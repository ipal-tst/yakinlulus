# Replace XP with Exam Score Ranking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all gamification (XP, level, streak, badges, XP leaderboard) and replace it with exam-score ranking per exam package with monthly reset.

**Architecture:** Add two new Go modules (`internal/exam_packages`, `internal/ranking`), two migrations (040 create package tables + `users.school_name`; 041 drop gamification tables), delete `internal/gamification`, refactor `internal/dashboard` and `internal/auth` to drop XP and support `school_name`, then rework the student frontend (dashboard, leaderboard, profile) to show exam scores instead of XP.

**Tech Stack:** Go 1.26 + Fiber + pgx/pgxpool + PostgreSQL 16; Next.js 15 App Router + TanStack Query + TypeScript strict; Vitest (frontend), Go `testing` + testify (backend).

## Global Constraints

- Module path: `yakinlulus.id/backend`
- Go tests use `stretchr/testify/assert`; run `go test ./...` from `backend/`
- Frontend tests: Vitest (`npm test`); type-check: `npm run type-check`; lint: `npm run lint`; build: `npm run build` — all from `frontend/`
- All DB access uses parameterized queries (`$1`, `$2`, ...) — no string interpolation for values
- All responses use `shared.Success(data)` / `shared.Error(code, msg)`; errors via `shared.ErrorCode`
- Auth via `middleware.RequireAuth(secret)`; role gate via `middleware.RequireRole("ADMIN", "TEACHER")`
- Migration files named `<NNN>_<name>.up.sql`; runner applies only `.up.sql` sorted lexically (see `backend/pkg/database/migrate.go`)
- `user_accessible_grades` view (migration 022) drives grade-based access filtering
- Business rules: one `contents` EXAM record = one ujian; a package groups several EXAM records (one per subject)
- Do not drop the `_migrations` bookkeeping table; do not modify migration 017 itself — drop its tables via migration 041

---

### Task 1: Migration 040 — exam package tables + users.school_name

**Files:**
- Create: `backend/migrations/040_exam_packages.up.sql`
- Create: `backend/migrations/040_exam_packages.down.sql`

**Interfaces:**
- Produces: tables `exam_packages`, `exam_package_exams`; column `users.school_name`
- Consumed by: Task 3 (`exam_packages` module), Task 4 (`ranking` module), Task 5 (`auth` school_name)

- [ ] **Step 1: Write the migration**

Create `backend/migrations/040_exam_packages.up.sql`:

```sql
-- Migration 040: Exam packages (paket ujian) grouping multiple subject exams
CREATE TABLE exam_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    education_level VARCHAR(10) NOT NULL CHECK (education_level IN ('SD','SMP','SMA','UNIVERSITY')),
    grade_id UUID REFERENCES grades(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_packages_level ON exam_packages(education_level);
CREATE INDEX idx_exam_packages_active ON exam_packages(is_active);

CREATE TABLE exam_package_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (package_id, exam_content_id)
);

CREATE INDEX idx_exam_package_exams_package ON exam_package_exams(package_id);
CREATE INDEX idx_exam_package_exams_exam ON exam_package_exams(exam_content_id);

-- Optional school name on student profile (kolom Sekolah di peringkat)
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
```

Create `backend/migrations/040_exam_packages.down.sql`:

```sql
DROP TABLE IF EXISTS exam_package_exams;
DROP TABLE IF EXISTS exam_packages;
ALTER TABLE users DROP COLUMN IF EXISTS school_name;
```

- [ ] **Step 2: Verify migration is picked up**

Run: `Get-ChildItem backend\migrations -Filter "040*" | Select-Object -ExpandProperty Name`
Expected: `040_exam_packages.up.sql`, `040_exam_packages.down.sql`

- [ ] **Step 3: Commit**

```bash
git add backend/migrations/040_exam_packages.up.sql backend/migrations/040_exam_packages.down.sql
git commit -m "feat(db): add exam_packages tables and users.school_name"
```

---

### Task 2: Migration 041 — drop gamification tables

**Files:**
- Create: `backend/migrations/041_drop_gamification.up.sql`
- Create: `backend/migrations/041_drop_gamification.down.sql`

**Interfaces:**
- Consumes: migration 017 tables (`xp_transactions`, `user_levels`, `badges`, `user_badges`, `user_streaks`)
- Produces: removal of those tables (data loss by design — approved)

- [ ] **Step 1: Write the migration**

Create `backend/migrations/041_drop_gamification.up.sql`:

```sql
-- Migration 041: Remove gamification (XP/level/streak/badges) feature tables
DROP TABLE IF EXISTS xp_transactions;
DROP TABLE IF EXISTS user_levels;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS user_streaks;
```

Create `backend/migrations/041_drop_gamification.down.sql`:

```sql
-- Down migration recreates minimal gamification schema (data loss is NOT recoverable)
CREATE TABLE user_levels (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1,
    current_xp INT NOT NULL DEFAULT 0,
    total_xp_earned INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Verify migration is picked up**

Run: `Get-ChildItem backend\migrations -Filter "041*" | Select-Object -ExpandProperty Name`
Expected: `041_drop_gamification.up.sql`, `041_drop_gamification.down.sql`

- [ ] **Step 3: Commit**

```bash
git add backend/migrations/041_drop_gamification.up.sql backend/migrations/041_drop_gamification.down.sql
git commit -m "feat(db): drop gamification tables"
```

---

### Task 3: Backend module `internal/exam_packages`

**Files:**
- Create: `backend/internal/exam_packages/exam_packages.go`
- Create: `backend/internal/exam_packages/exam_packages_test.go`

**Interfaces:**
- Consumes: `*pgxpool.Pool`, `middleware.RequireAuth`, `middleware.RequireRole`, `shared`
- Produces:
  - `type ExamPackage struct` with fields `id uuid.UUID`, `code string`, `name string`, `education_level string`, `grade_id *uuid.UUID`, `is_active bool`, `created_at time.Time`, `updated_at time.Time`
  - `type PackageExam struct` with `exam_content_id uuid.UUID`, `subject_id uuid.UUID`, `subject_name string`, `display_order int`
  - `type SavePackageRequest struct` with `code string`, `name string`, `education_level string`, `grade_id *string`, `is_active *bool`
  - `type LinkExamRequest struct` with `exam_content_id string`, `subject_id string`, `display_order int`
  - `func (h *Handler) RegisterRoutes(router fiber.Router)`
  - `func NewHandler(svc *Service, secret string) *Handler`
  - `func NewService(repo *Repository) *Service`
  - `func NewRepository(pool *pgxpool.Pool) *Repository`
  - Routes (group `/exam-packages`, all auth):
    - `GET /` → list, query `education_level`
    - `POST /` → create (ADMIN, TEACHER)
    - `PUT /:id` → update (ADMIN, TEACHER)
    - `DELETE /:id` → delete (ADMIN, TEACHER)
    - `POST /:id/exams` → link exam (ADMIN, TEACHER)
    - `DELETE /:id/exams/:examContentId` → unlink (ADMIN, TEACHER)
    - `GET /:id/exams` → list package exams
- Consumed by: Task 4 (ranking reads `exam_package_exams`), Task 7 (main.go DI)

- [ ] **Step 1: Write the failing validation tests**

Create `backend/internal/exam_packages/exam_packages_test.go`:

```go
package exam_packages

import (
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestValidateSaveRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     SavePackageRequest
		wantErr bool
	}{
		{"valid", SavePackageRequest{Code: "TKA-SMP-2026", Name: "Tryout TKA SMP", EducationLevel: "SMP"}, false},
		{"missing code", SavePackageRequest{Name: "Tryout", EducationLevel: "SMP"}, true},
		{"missing name", SavePackageRequest{Code: "X", EducationLevel: "SMP"}, true},
		{"bad level", SavePackageRequest{Code: "X", Name: "Y", EducationLevel: "TK"}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSaveRequest(tt.req)
			if tt.wantErr {
				assert.Error(t, err)
				if ferr, ok := err.(*fiber.Error); ok {
					assert.Equal(t, fiber.StatusBadRequest, ferr.Code)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateLinkRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     LinkExamRequest
		wantErr bool
	}{
		{"valid", LinkExamRequest{ExamContentID: "11111111-1111-1111-1111-111111111111", SubjectID: "22222222-2222-2222-2222-222222222222"}, false},
		{"bad exam id", LinkExamRequest{ExamContentID: "nope", SubjectID: "22222222-2222-2222-2222-222222222222"}, true},
		{"bad subject id", LinkExamRequest{ExamContentID: "11111111-1111-1111-1111-111111111111", SubjectID: "nope"}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateLinkRequest(tt.req)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/exam_packages/...` (from `backend/`)
Expected: FAIL — compile error: undefined `SavePackageRequest`, `validateSaveRequest`, `LinkExamRequest`, `validateLinkRequest`

- [ ] **Step 3: Write minimal implementation**

Create `backend/internal/exam_packages/exam_packages.go`:

```go
package exam_packages

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// ---- Models ----

type ExamPackage struct {
	ID             uuid.UUID  `json:"id"`
	Code           string     `json:"code"`
	Name           string     `json:"name"`
	EducationLevel string     `json:"education_level"`
	GradeID        *uuid.UUID `json:"grade_id,omitempty"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type PackageExam struct {
	ExamContentID uuid.UUID `json:"exam_content_id"`
	SubjectID     uuid.UUID `json:"subject_id"`
	SubjectName   string    `json:"subject_name"`
	DisplayOrder  int       `json:"display_order"`
}

type SavePackageRequest struct {
	Code           string `json:"code"`
	Name           string `json:"name"`
	EducationLevel string `json:"education_level"`
	GradeID        *string `json:"grade_id,omitempty"`
	IsActive       *bool   `json:"is_active,omitempty"`
}

type LinkExamRequest struct {
	ExamContentID string `json:"exam_content_id"`
	SubjectID     string `json:"subject_id"`
	DisplayOrder  int    `json:"display_order"`
}

func validateSaveRequest(req SavePackageRequest) error {
	if req.Code == "" {
		return fiber.NewError(fiber.StatusBadRequest, "code required")
	}
	if req.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name required")
	}
	switch req.EducationLevel {
	case "SD", "SMP", "SMA", "UNIVERSITY":
	default:
		return fiber.NewError(fiber.StatusBadRequest, "education_level must be SD/SMP/SMA/UNIVERSITY")
	}
	return nil
}

func validateLinkRequest(req LinkExamRequest) error {
	if _, err := uuid.Parse(req.ExamContentID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid exam_content_id")
	}
	if _, err := uuid.Parse(req.SubjectID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid subject_id")
	}
	return nil
}

// ---- Repository ----

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const pkgCols = `id, code, name, education_level, grade_id, is_active, created_at, updated_at`

func scanPackage(row pgx.Row) (*ExamPackage, error) {
	var p ExamPackage
	var gradeID *uuid.UUID
	err := row.Scan(&p.ID, &p.Code, &p.Name, &p.EducationLevel, &gradeID, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.GradeID = gradeID
	return &p, nil
}

func (r *Repository) List(ctx context.Context, level string) ([]ExamPackage, error) {
	query := `SELECT ` + pkgCols + ` FROM exam_packages`
	args := []interface{}{}
	if level != "" {
		query += ` WHERE education_level = $1`
		args = append(args, level)
	}
	query += ` ORDER BY name`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ExamPackage
	for rows.Next() {
		p, err := scanPackage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*ExamPackage, error) {
	return scanPackage(r.pool.QueryRow(ctx, `SELECT `+pkgCols+` FROM exam_packages WHERE id = $1`, id))
}

func (r *Repository) Create(ctx context.Context, req SavePackageRequest) (*ExamPackage, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	var gradeID *uuid.UUID
	if req.GradeID != nil && *req.GradeID != "" {
		if id, err := uuid.Parse(*req.GradeID); err == nil {
			gradeID = &id
		}
	}
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO exam_packages (code, name, education_level, grade_id, is_active)
		 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		req.Code, req.Name, req.EducationLevel, gradeID, active).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req SavePackageRequest) (*ExamPackage, error) {
	var gradeID *uuid.UUID
	if req.GradeID != nil && *req.GradeID != "" {
		if gid, err := uuid.Parse(*req.GradeID); err == nil {
			gradeID = &gid
		}
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_packages SET code=$2, name=$3, education_level=$4, grade_id=$5,
		   is_active=COALESCE($6, is_active), updated_at=NOW() WHERE id=$1`,
		id, req.Code, req.Name, req.EducationLevel, gradeID, req.IsActive)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM exam_packages WHERE id = $1`, id)
	return err
}

func (r *Repository) ListExams(ctx context.Context, packageID uuid.UUID) ([]PackageExam, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT epe.exam_content_id, epe.subject_id, COALESCE(s.name, ''), epe.display_order
		 FROM exam_package_exams epe
		 LEFT JOIN subjects s ON s.id = epe.subject_id
		 WHERE epe.package_id = $1
		 ORDER BY epe.display_order`, packageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PackageExam
	for rows.Next() {
		var pe PackageExam
		if err := rows.Scan(&pe.ExamContentID, &pe.SubjectID, &pe.SubjectName, &pe.DisplayOrder); err != nil {
			return nil, err
		}
		out = append(out, pe)
	}
	return out, rows.Err()
}

func (r *Repository) LinkExam(ctx context.Context, packageID uuid.UUID, req LinkExamRequest) error {
	examID, _ := uuid.Parse(req.ExamContentID)
	subjectID, _ := uuid.Parse(req.SubjectID)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO exam_package_exams (package_id, exam_content_id, subject_id, display_order)
		 VALUES ($1,$2,$3,$4)
		 ON CONFLICT (package_id, exam_content_id) DO UPDATE SET subject_id = EXCLUDED.subject_id, display_order = EXCLUDED.display_order`,
		packageID, examID, subjectID, req.DisplayOrder)
	return err
}

func (r *Repository) UnlinkExam(ctx context.Context, packageID, examContentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM exam_package_exams WHERE package_id = $1 AND exam_content_id = $2`,
		packageID, examContentID)
	return err
}

// ---- Service ----

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, level string) ([]ExamPackage, error) {
	return s.repo.List(ctx, level)
}
func (s *Service) Get(ctx context.Context, id uuid.UUID) (*ExamPackage, error) {
	return s.repo.GetByID(ctx, id)
}
func (s *Service) Create(ctx context.Context, req SavePackageRequest) (*ExamPackage, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, req)
}
func (s *Service) Update(ctx context.Context, id uuid.UUID, req SavePackageRequest) (*ExamPackage, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, id, req)
}
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
func (s *Service) ListExams(ctx context.Context, packageID uuid.UUID) ([]PackageExam, error) {
	return s.repo.ListExams(ctx, packageID)
}
func (s *Service) LinkExam(ctx context.Context, packageID uuid.UUID, req LinkExamRequest) error {
	if err := validateLinkRequest(req); err != nil {
		return err
	}
	return s.repo.LinkExam(ctx, packageID, req)
}
func (s *Service) UnlinkExam(ctx context.Context, packageID, examContentID uuid.UUID) error {
	return s.repo.UnlinkExam(ctx, packageID, examContentID)
}

// ---- Handler ----

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, secret string) *Handler {
	return &Handler{svc: svc, auth: secret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	write := middleware.RequireRole("ADMIN", "TEACHER")

	r := router.Group("/exam-packages", authM)
	r.Get("/", h.List)
	r.Post("/", write, h.Create)
	r.Put("/:id", write, h.Update)
	r.Delete("/:id", write, h.Delete)
	r.Get("/:id/exams", h.ListExams)
	r.Post("/:id/exams", write, h.LinkExam)
	r.Delete("/:id/exams/:examContentId", write, h.UnlinkExam)
}

func (h *Handler) parseID(c *fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "Invalid package ID")
	}
	return id, nil
}

func (h *Handler) List(c *fiber.Ctx) error {
	items, err := h.svc.List(c.Context(), c.Query("education_level"))
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list exam packages"))
	}
	if items == nil {
		items = []ExamPackage{}
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req SavePackageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	p, err := h.svc.Create(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create exam package"))
	}
	return c.Status(201).JSON(shared.Success(p))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	var req SavePackageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	p, err := h.svc.Update(c.Context(), id, req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update exam package"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete exam package"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

func (h *Handler) ListExams(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	items, err := h.svc.ListExams(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list package exams"))
	}
	if items == nil {
		items = []PackageExam{}
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) LinkExam(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	var req LinkExamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.LinkExam(c.Context(), id, req); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to link exam"))
	}
	exams, err := h.svc.ListExams(c.Context(), id)
	if err != nil {
		exams = []PackageExam{}
	}
	return c.JSON(shared.Success(exams))
}

func (h *Handler) UnlinkExam(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	examID, err := uuid.Parse(c.Params("examContentId"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam content ID"))
	}
	if err := h.svc.UnlinkExam(c.Context(), id, examID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to unlink exam"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "unlinked"}))
}

var _ = fmt.Sprintf
```

Note: remove the unused `fmt` import if the compiler complains (the `var _ = fmt.Sprintf` guard keeps it harmless; delete both if unused).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/exam_packages/...`
Expected: PASS

- [ ] **Step 5: Vet & build**

Run: `go vet ./internal/exam_packages/...` then `go build ./...`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add backend/internal/exam_packages/exam_packages.go backend/internal/exam_packages/exam_packages_test.go
git commit -m "feat(exam-packages): add exam package CRUD and exam linking"
```

---

### Task 4: Backend module `internal/ranking`

**Files:**
- Create: `backend/internal/ranking/ranking.go`
- Create: `backend/internal/ranking/ranking_test.go`

**Interfaces:**
- Consumes: `*pgxpool.Pool`, `middleware.RequireAuth`, `shared`
- Produces:
  - `type RankingRow struct { Rank int; UserID uuid.UUID; FullName string; SchoolName string; SubjectScores map[string]float64; Total float64; Average float64 }` (json: `rank`, `user_id`, `full_name`, `school_name`, `subject_scores`, `total`, `average`)
  - `func NewHandler(svc *Service, secret string) *Handler`
  - `func NewService(repo *Repository) *Service`
  - `func NewRepository(pool *pgxpool.Pool) *Repository`
  - Route: `GET /leaderboard` (auth) with query `package_id` (required, UUID), `month` (optional `YYYY-MM`, default current month), `limit` (default 50, max 100)
  - `func parseMonth(s string) (time.Time, error)` — pure, returns first instant of the month in UTC
  - `func buildRanking(raw []rawScore, subjectCount int) []RankingRow` — pure aggregation/sort/rank
  - `type rawScore struct { UserID uuid.UUID; FullName string; SchoolName string; SubjectID string; Best float64 }`
- Consumed by: Task 7 (main.go DI), Task 11 (frontend leaderboard)

- [ ] **Step 1: Write the failing unit tests**

Create `backend/internal/ranking/ranking_test.go`:

```go
package ranking

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestParseMonth(t *testing.T) {
	got, err := parseMonth("2026-08")
	assert.NoError(t, err)
	assert.Equal(t, time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC), got)

	_, err = parseMonth("2026-13")
	assert.Error(t, err)
	_, err = parseMonth("august")
	assert.Error(t, err)
	_, err = parseMonth("")
	assert.Error(t, err)
}

func TestBuildRanking(t *testing.T) {
	u1 := uuid.New()
	u2 := uuid.New()
	raw := []rawScore{
		{u1, "Andi", "SMPN 1", "math", 90},
		{u1, "Andi", "SMPN 1", "indo", 80},
		{u1, "Andi", "SMPN 1", "eng", 70},
		{u2, "Budi", "SMPN 2", "math", 85},
		{u2, "Budi", "SMPN 2", "indo", 85},
		{u2, "Budi", "SMPN 2", "eng", 60},
	}
	rows := buildRanking(raw, 3)
	assert.Len(t, rows, 2)

	// Andi total 240, average 80; Budi total 230, average 76.67 -> Andi first
	assert.Equal(t, 1, rows[0].Rank)
	assert.Equal(t, u1, rows[0].UserID)
	assert.Equal(t, 240.0, rows[0].Total)
	assert.InDelta(t, 80.0, rows[0].Average, 0.01)
	assert.Equal(t, 90.0, rows[0].SubjectScores["math"])
	assert.Equal(t, "SMPN 1", rows[0].SchoolName)

	assert.Equal(t, 2, rows[1].Rank)
	assert.Equal(t, u2, rows[1].UserID)
}

func TestBuildRankingEmpty(t *testing.T) {
	rows := buildRanking(nil, 3)
	assert.Empty(t, rows)
}

func TestBuildRankingBestPerSubject(t *testing.T) {
	u := uuid.New()
	// same user twice for same subject -> keep max
	raw := []rawScore{
		{u, "Andi", "SMPN 1", "math", 70},
		{u, "Andi", "SMPN 1", "math", 95},
	}
	rows := buildRanking(raw, 2)
	assert.Len(t, rows, 1)
	assert.Equal(t, 95.0, rows[0].SubjectScores["math"])
	assert.Equal(t, 95.0, rows[0].Total)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/ranking/...`
Expected: FAIL — compile error: undefined `parseMonth`, `buildRanking`, `rawScore`

- [ ] **Step 3: Write minimal implementation**

Create `backend/internal/ranking/ranking.go`:

```go
package ranking

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// ---- Models ----

type RankingRow struct {
	Rank          int                `json:"rank"`
	UserID        uuid.UUID          `json:"user_id"`
	FullName      string             `json:"full_name"`
	SchoolName    string             `json:"school_name"`
	SubjectScores map[string]float64 `json:"subject_scores"`
	Total         float64            `json:"total"`
	Average       float64            `json:"average"`
}

type rawScore struct {
	UserID     uuid.UUID
	FullName   string
	SchoolName string
	SubjectID  string
	Best       float64
}

// parseMonth parses "YYYY-MM" into the first instant of that month (UTC).
func parseMonth(s string) (time.Time, error) {
	parts := strings.Split(strings.TrimSpace(s), "-")
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid month format")
	}
	var year, month int
	if _, err := fmt.Sscanf(parts[0], "%d", &year); err != nil {
		return time.Time{}, fmt.Errorf("invalid year")
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &month); err != nil {
		return time.Time{}, fmt.Errorf("invalid month")
	}
	if year < 2000 || year > 2100 || month < 1 || month > 12 {
		return time.Time{}, fmt.Errorf("month out of range")
	}
	return time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC), nil
}

// buildRanking aggregates best score per subject per user, then sorts and ranks.
func buildRanking(raw []rawScore, subjectCount int) []RankingRow {
	type acc struct {
		scores map[string]float64
		row    RankingRow
	}
	byUser := map[uuid.UUID]*acc{}
	for _, r := range raw {
		a, ok := byUser[r.UserID]
		if !ok {
			a = &acc{scores: map[string]float64{}}
			a.row = RankingRow{UserID: r.UserID, FullName: r.FullName, SchoolName: r.SchoolName, SubjectScores: map[string]float64{}}
			byUser[r.UserID] = a
		}
		if r.Best > a.scores[r.SubjectID] {
			a.scores[r.SubjectID] = r.Best
			a.row.SubjectScores[r.SubjectID] = r.Best
		}
	}

	rows := make([]RankingRow, 0, len(byUser))
	for _, a := range byUser {
		total := 0.0
		for _, v := range a.row.SubjectScores {
			total += v
		}
		a.row.Total = total
		if subjectCount > 0 {
			a.row.Average = round1(total / float64(subjectCount))
		}
		rows = append(rows, a.row)
	}

	sort.SliceStable(rows, func(i, j int) bool {
		if rows[i].Total != rows[j].Total {
			return rows[i].Total > rows[j].Total
		}
		if rows[i].Average != rows[j].Average {
			return rows[i].Average > rows[j].Average
		}
		return strings.ToLower(rows[i].FullName) < strings.ToLower(rows[j].FullName)
	})

	for i := range rows {
		rows[i].Rank = i + 1
	}
	return rows
}

func round1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}

// ---- Repository ----

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) CountPackageSubjects(ctx context.Context, packageID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM exam_package_exams WHERE package_id = $1`, packageID).Scan(&n)
	return n, err
}

func (r *Repository) FetchRawScores(ctx context.Context, packageID uuid.UUID, from, to time.Time) ([]rawScore, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT a.user_id, u.full_name, COALESCE(u.school_name, ''),
		        epe.subject_id::text, MAX(a.total_score)
		 FROM content_exam_attempts a
		 JOIN exam_package_exams epe ON epe.exam_content_id = a.exam_content_id AND epe.package_id = $1
		 JOIN users u ON u.id = a.user_id
		 WHERE a.status IN ('SUBMITTED', 'GRADED')
		   AND a.submitted_at >= $2 AND a.submitted_at < $3
		 GROUP BY a.user_id, u.full_name, u.school_name, epe.subject_id`,
		packageID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []rawScore
	for rows.Next() {
		var rs rawScore
		var best float64
		if err := rows.Scan(&rs.UserID, &rs.FullName, &rs.SchoolName, &rs.SubjectID, &best); err != nil {
			return nil, err
		}
		rs.Best = best
		out = append(out, rs)
	}
	return out, rows.Err()
}

// ---- Service ----

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetLeaderboard(ctx context.Context, packageID uuid.UUID, month time.Time, limit int) ([]RankingRow, error) {
	subjectCount, err := s.repo.CountPackageSubjects(ctx, packageID)
	if err != nil {
		return nil, err
	}
	if subjectCount == 0 {
		return []RankingRow{}, nil
	}
	from := month
	to := month.AddDate(0, 1, 0)
	raw, err := s.repo.FetchRawScores(ctx, packageID, from, to)
	if err != nil {
		return nil, err
	}
	rows := buildRanking(raw, subjectCount)
	if len(rows) > limit {
		rows = rows[:limit]
	}
	return rows, nil
}

// ---- Handler ----

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, secret string) *Handler {
	return &Handler{svc: svc, auth: secret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Get("/leaderboard", middleware.RequireAuth(h.auth), h.Get)
}

func (h *Handler) Get(c *fiber.Ctx) error {
	packageID, err := uuid.Parse(c.Query("package_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "package_id is required and must be a valid UUID"))
	}

	month := time.Now().UTC()
	if m := c.Query("month"); m != "" {
		parsed, perr := parseMonth(m)
		if perr != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "month must be YYYY-MM"))
		}
		month = parsed
	}

	limit := c.QueryInt("limit", 50)
	if limit < 1 || limit > 100 {
		limit = 50
	}

	rows, err := h.svc.GetLeaderboard(c.Context(), packageID, month, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load leaderboard"))
	}
	if rows == nil {
		rows = []RankingRow{}
	}
	return c.JSON(shared.Success(rows))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/ranking/...`
Expected: PASS

- [ ] **Step 5: Vet & build**

Run: `go vet ./internal/ranking/...` then `go build ./...`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add backend/internal/ranking/ranking.go backend/internal/ranking/ranking_test.go
git commit -m "feat(ranking): add monthly exam-score leaderboard"
```

---

### Task 5: Add `school_name` support to `internal/auth`

**Files:**
- Modify: `backend/internal/auth/auth.go:48-51` (UpdateProfileRequest), `:111-132` (Repository.UpdateProfile), `:417-422` (Service.UpdateProfile), `:593-610` (Handler.UpdateProfile)

**Interfaces:**
- Consumes: existing auth profile update flow
- Produces: `UpdateProfileRequest.SchoolName *string` field; persisted to `users.school_name`
- Consumed by: Task 12 (frontend profile edit)

- [ ] **Step 1: Write the failing test**

Add to `backend/internal/auth/auth_test.go` (create it if missing):

```go
package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUpdateProfileRequestAcceptsSchoolName(t *testing.T) {
	school := "SMPN 1 Jakarta"
	req := UpdateProfileRequest{SchoolName: &school}
	assert.Equal(t, "SMPN 1 Jakarta", *req.SchoolName)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/auth/...`
Expected: FAIL — undefined field `SchoolName`

- [ ] **Step 3: Implement**

In `backend/internal/auth/auth.go`:

Edit the struct (L48-51):

```go
type UpdateProfileRequest struct {
	FullName   *string `json:"full_name,omitempty"`
	AvatarURL  *string `json:"avatar_url,omitempty"`
	SchoolName *string `json:"school_name,omitempty"`
}
```

Edit `Repository.UpdateProfile` (L111-132):

```go
func (r *Repository) UpdateProfile(ctx context.Context, id uuid.UUID, fullName *string, avatarURL *string, schoolName *string) error {
	query := "UPDATE users SET updated_at = NOW()"
	args := []interface{}{}
	argN := 1

	if fullName != nil {
		query += fmt.Sprintf(", full_name = $%d", argN)
		args = append(args, *fullName)
		argN++
	}
	if avatarURL != nil {
		query += fmt.Sprintf(", avatar_url = $%d", argN)
		args = append(args, *avatarURL)
		argN++
	}
	if schoolName != nil {
		query += fmt.Sprintf(", school_name = $%d", argN)
		args = append(args, *schoolName)
		argN++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argN)
	args = append(args, id)

	_, err := r.pool.Exec(ctx, query, args...)
	return err
}
```

Edit `Service.UpdateProfile` (L417-422):

```go
func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (*User, error) {
	if err := s.repo.UpdateProfile(ctx, userID, req.FullName, req.AvatarURL, req.SchoolName); err != nil {
		return nil, err
	}
	return s.repo.FindByID(ctx, userID)
}
```

Edit `Handler.UpdateProfile` (L593-610) — it already calls `h.svc.UpdateProfile(c.Context(), userID, req)`; no change needed beyond the struct/repo/service. Verify the handler body parses the body into `UpdateProfileRequest` (it does).

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/auth/...`
Expected: PASS

- [ ] **Step 5: Vet & build**

Run: `go vet ./internal/auth/...` then `go build ./...`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add backend/internal/auth/auth.go backend/internal/auth/auth_test.go
git commit -m "feat(auth): support school_name in profile update"
```

---

### Task 6: Refactor `internal/dashboard` — remove XP, add exam score stats

**Files:**
- Modify: `backend/internal/dashboard/dashboard.go` (DTOs L19-98, repository L368-409, service L614-652, recent activity L411-442)

**Interfaces:**
- Consumes: existing `content_exam_attempts`, `users`
- Produces:
  - Replaces `AchievementSummary` and `LeaderboardEntry` (XP) with `ExamStats` (`total_completed int`, `average_score float64`, `highest_score float64`, `national_rank int`) and removes `Leaderboard []LeaderboardEntry` from `StudentDashboard`
  - `GetExamStats(ctx, userID) ExamStats`
  - `GetNationalRank(ctx, userID) int`
- Consumed by: Task 13 (frontend dashboard)

- [ ] **Step 1: Update DTOs**

In `backend/internal/dashboard/dashboard.go`:

Replace `AchievementSummary` (L78-83):

```go
type ExamStats struct {
	TotalCompleted int     `json:"total_completed"`
	AverageScore   float64 `json:"average_score"`
	HighestScore   float64 `json:"highest_score"`
	NationalRank   int     `json:"national_rank"`
}
```

Delete `LeaderboardEntry` struct (L85-92).

Replace `StudentDashboard` fields `Achievement AchievementSummary` and `Leaderboard []LeaderboardEntry` with:

```go
	ExamStats ExamStats `json:"exam_stats"`
```

Update `StudentDashboard` struct (L19-29): remove the `Achievement` and `Leaderboard` lines, add `ExamStats`.

- [ ] **Step 2: Replace repository methods**

Replace `GetAchievement` (L368-384) and `GetLeaderboard` (L386-409) with:

```go
func (r *Repository) GetExamStats(ctx context.Context, userID uuid.UUID) ExamStats {
	var s ExamStats
	r.pool.QueryRow(ctx,
		`SELECT COUNT(*),
		        COALESCE(AVG(total_score), 0),
		        COALESCE(MAX(total_score), 0)
		 FROM content_exam_attempts
		 WHERE user_id = $1 AND status IN ('SUBMITTED','GRADED') AND total_score IS NOT NULL`,
		userID).Scan(&s.TotalCompleted, &s.AverageScore, &s.HighestScore)
	s.NationalRank = r.GetNationalRank(ctx, userID)
	return s
}

func (r *Repository) GetNationalRank(ctx context.Context, userID uuid.UUID) int {
	var rank int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) + 1
		 FROM (SELECT user_id, AVG(total_score) AS avg
		       FROM content_exam_attempts
		       WHERE status IN ('SUBMITTED','GRADED') AND total_score IS NOT NULL
		         AND submitted_at >= date_trunc('month', NOW())
		       GROUP BY user_id) t
		 WHERE t.avg > COALESCE((
		     SELECT AVG(total_score) FROM content_exam_attempts
		     WHERE user_id = $1 AND status IN ('SUBMITTED','GRADED')
		       AND total_score IS NOT NULL
		       AND submitted_at >= date_trunc('month', NOW())), 0)`,
		userID).Scan(&rank)
	if err != nil {
		return 0
	}
	return rank
}
```

- [ ] **Step 3: Update service**

In `GetStudentDashboard` (L614-652), replace:

```go
		Achievement:      s.repo.GetAchievement(ctx, userID),
		Leaderboard:      s.repo.GetLeaderboard(ctx),
```

with:

```go
		ExamStats:        s.repo.GetExamStats(ctx, userID),
```

- [ ] **Step 4: Fix recent activity (remove badge UNION)**

In `GetStudentRecentActivity` (L411-442), remove the badge UNION branch (the `UNION ALL SELECT 'badge'...` lines) so it only queries exam + material activity. Expected result: two `SELECT` branches, no `user_badges`/`badges` reference.

- [ ] **Step 5: Build**

Run: `go build ./...`
Expected: no errors (any references to removed fields will surface here)

- [ ] **Step 6: Commit**

```bash
git add backend/internal/dashboard/dashboard.go
git commit -m "refactor(dashboard): replace XP achievement with exam score stats"
```

---

### Task 7: Wire new modules in `main.go`; remove gamification

**Files:**
- Modify: `backend/cmd/api/main.go` (imports L26, DI L224-227, routes L268)

**Interfaces:**
- Consumes: `exam_packages.Handler`, `ranking.Handler`
- Produces: registered routes `/api/v1/exam-packages/*` and `/api/v1/leaderboard`; gamification fully removed

- [ ] **Step 1: Edit imports**

In `backend/cmd/api/main.go`, replace the gamification import line:

```go
	"yakinlulus.id/backend/internal/gamification"
```

with:

```go
	"yakinlulus.id/backend/internal/exam_packages"
	"yakinlulus.id/backend/internal/ranking"
```

- [ ] **Step 2: Replace DI block**

Replace (L224-227):

```go
	// Gamification module
	gamiRepo := gamification.NewRepository(pool)
	gamiSvc := gamification.NewService(gamiRepo)
	gamiHandler := gamification.NewHandler(gamiSvc, cfg.JWT.Secret)
```

with:

```go
	// Exam packages module
	pkgRepo := exam_packages.NewRepository(pool)
	pkgSvc := exam_packages.NewService(pkgRepo)
	pkgHandler := exam_packages.NewHandler(pkgSvc, cfg.JWT.Secret)

	// Ranking module
	rankRepo := ranking.NewRepository(pool)
	rankSvc := ranking.NewService(rankRepo)
	rankHandler := ranking.NewHandler(rankSvc, cfg.JWT.Secret)
```

- [ ] **Step 3: Replace route registration**

Replace (L268):

```go
	gamiHandler.RegisterRoutes(api)
```

with:

```go
	pkgHandler.RegisterRoutes(api)
	rankHandler.RegisterRoutes(api)
```

- [ ] **Step 4: Delete the gamification package**

Run: `Remove-Item -Recurse -Force backend\internal\gamification`
Expected: directory removed

- [ ] **Step 5: Build & test**

Run: `go build ./...` then `go test ./...`
Expected: all pass, no references to gamification

- [ ] **Step 6: Commit**

```bash
git add -A backend/cmd/api/main.go
git rm -r backend/internal/gamification
git commit -m "refactor(api): wire exam_packages and ranking, remove gamification"
```

---

### Task 8: Update OpenAPI spec & api-list.md

**Files:**
- Modify: `backend/openapi.yaml` (remove gamification section ~L2732-2841; add exam-packages + leaderboard)
- Modify: `backend/api_list.md` (gamification lines ~L221-228)

**Interfaces:**
- Consumes: route shapes from Tasks 3, 4, 7

- [ ] **Step 1: Remove gamification section**

In `backend/openapi.yaml`, delete the gamification API section (the block describing `/gamification/*`). In `backend/api_list.md`, delete the gamification endpoint list block.

- [ ] **Step 2: Add exam-packages + leaderboard sections**

Append to `backend/openapi.yaml` (after the target-schools section, before end) minimal path entries for `/api/v1/exam-packages` (GET/POST), `/api/v1/exam-packages/{id}` (PUT/DELETE), `/api/v1/exam-packages/{id}/exams` (GET/POST), `/api/v1/exam-packages/{id}/exams/{examContentId}` (DELETE), and `/api/v1/leaderboard` (GET with `package_id`, `month`, `limit` query params). Append matching entries to `backend/api_list.md`.

- [ ] **Step 3: Validate**

Run: `Select-String -Path backend\openapi.yaml -Pattern "exam-packages|leaderboard" | Measure-Object`
Expected: count > 0. Run: `Select-String -Path backend\openapi.yaml -Pattern "gamification" | Measure-Object`
Expected: count = 0

- [ ] **Step 4: Commit**

```bash
git add backend/openapi.yaml backend/api_list.md
git commit -m "docs: update openapi and api list for exam packages + ranking"
```

---

### Task 9: Frontend API client — remove gamification, add packages & ranking

**Files:**
- Modify: `frontend/lib/api-client.ts` (gamification block L367-377; add new sections)
- Modify: `frontend/lib/api.ts` (queryKeys L103-108; gamification hooks L626-659, useAchievements L717-722; add new hooks)

**Interfaces:**
- Consumes: backend endpoints from Tasks 3, 4
- Produces:
  - `apiClient.examPackages` object with `list`, `create`, `update`, `remove`, `listExams`, `linkExam`, `unlinkExam`
  - `apiClient.ranking` object with `getLeaderboard`
  - `queryKeys.examPackages`, `queryKeys.ranking`
  - hooks: `useExamPackages(level?)`, `useCreateExamPackage`, `usePackageExams(packageId)`, `useRanking(packageId, month)`
  - removed: `apiClient.gamification`, `useXP`, `useBadges`, `useUserBadges`, `useStreak`, `useLeaderboard`, `useAchievements`
- Consumed by: Tasks 11, 12, 13

- [ ] **Step 1: Remove gamification API client block**

In `frontend/lib/api-client.ts`, delete lines 367-377 (the `// --- 15. Gamification API ---` block through the closing `};`).

- [ ] **Step 2: Add examPackages + ranking blocks**

Insert after the deleted block (keep numbering cosmetic; renumber following comments if desired, not required):

```ts
    // --- 15. Exam Packages API ---
    public examPackages = {
        list: async (educationLevel?: string) => this.request(`/exam-packages${educationLevel ? `?education_level=${educationLevel}` : ""}`, { method: "GET" }),
        create: async (payload: { code: string; name: string; education_level: string; grade_id?: string; is_active?: boolean }) => this.request("/exam-packages", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: { code: string; name: string; education_level: string; grade_id?: string; is_active?: boolean }) => this.request(`/exam-packages/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        remove: async (id: string) => this.request(`/exam-packages/${id}`, { method: "DELETE" }),
        listExams: async (id: string) => this.request(`/exam-packages/${id}/exams`, { method: "GET" }),
        linkExam: async (id: string, payload: { exam_content_id: string; subject_id: string; display_order?: number }) => this.request(`/exam-packages/${id}/exams`, { method: "POST", body: JSON.stringify(payload) }),
        unlinkExam: async (id: string, examContentId: string) => this.request(`/exam-packages/${id}/exams/${examContentId}`, { method: "DELETE" }),
    };

    // --- 15b. Ranking API ---
    public ranking = {
        getLeaderboard: async (packageId: string, month?: string, limit = 50) => this.request(`/leaderboard?package_id=${packageId}&month=${month || ""}&limit=${limit}`, { method: "GET" }),
    };
```

- [ ] **Step 3: Update queryKeys in api.ts**

Replace `queryKeys.gamification` (L103-108) with:

```ts
  examPackages: {
    all: (level?: string) => ['exam-packages', level] as const,
    exams: (packageId: string) => ['exam-packages', 'exams', packageId] as const,
  },
  ranking: {
    leaderboard: (packageId: string, month?: string) => ['ranking', 'leaderboard', packageId, month] as const,
  },
```

- [ ] **Step 4: Remove gamification hooks, add new hooks**

In `frontend/lib/api.ts`, delete the gamification hooks block (L626-659: `useXP`, `useBadges`, `useUserBadges`, `useStreak`, `useLeaderboard`) and delete `useAchievements` (L717-722).

Insert after the practice hooks section (after L623):

```ts
// Exam Package Hooks
export function useExamPackages(educationLevel?: string) {
  return useQuery({
    queryKey: queryKeys.examPackages.all(educationLevel),
    queryFn: () => apiFetch(`/exam-packages${educationLevel ? `?education_level=${educationLevel}` : ''}`),
  });
}

export function usePackageExams(packageId?: string) {
  return useQuery({
    queryKey: queryKeys.examPackages.exams(packageId || ''),
    queryFn: () => apiFetch(`/exam-packages/${packageId}/exams`),
    enabled: !!packageId,
  });
}

export function useRanking(packageId?: string, month?: string) {
  return useQuery({
    queryKey: queryKeys.ranking.leaderboard(packageId || '', month),
    queryFn: () => apiFetch(`/leaderboard?package_id=${packageId}&month=${month || ''}&limit=100`),
    enabled: !!packageId,
  });
}
```

- [ ] **Step 5: Type-check**

Run: `npm run type-check` (from `frontend/`)
Expected: no errors related to removed gamification hooks (fix any remaining imports in pages in Tasks 11-13)

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/api-client.ts frontend/lib/api.ts
git commit -m "feat(frontend): swap gamification API for exam packages and ranking"
```

---

### Task 10: Update frontend types

**Files:**
- Modify: `frontend/types/dashboard.ts` (remove level/current_xp/streak/xp_progress/leaderboard_rank; add exam_stats)
- Modify: `frontend/types/exam.ts` (add ExamPackage, PackageExam, RankingRow)

**Interfaces:**
- Produces: type `ExamPackage { id, code, name, education_level, grade_id?, is_active, created_at, updated_at }`, `PackageExam { exam_content_id, subject_id, subject_name, display_order }`, `RankingRow { rank, user_id, full_name, school_name, subject_scores: Record<string, number>, total, average }`
- Consumed by: Tasks 11, 12, 13

- [ ] **Step 1: Update dashboard types**

In `frontend/types/dashboard.ts`, edit `StudentDashboard` (L15-31): remove `level`, `current_xp`, `next_level_xp`, `streak_days`, `xp_progress`, `leaderboard_rank`; add:

```ts
  exam_stats: {
    total_completed: number;
    average_score: number;
    highest_score: number;
    national_rank: number;
  };
```

- [ ] **Step 2: Add ranking types to exam.ts**

Append to `frontend/types/exam.ts`:

```ts
export interface ExamPackage {
  id: string;
  code: string;
  name: string;
  education_level: "SD" | "SMP" | "SMA" | "UNIVERSITY";
  grade_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageExam {
  exam_content_id: string;
  subject_id: string;
  subject_name: string;
  display_order: number;
}

export interface RankingRow {
  rank: number;
  user_id: string;
  full_name: string;
  school_name: string;
  subject_scores: Record<string, number>;
  total: number;
  average: number;
}
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/types/dashboard.ts frontend/types/exam.ts
git commit -m "feat(frontend): update types for exam packages and ranking"
```

---

### Task 11: Rework student dashboard page

**Files:**
- Modify: `frontend/app/(portal)/student/page.tsx` (whole file)

**Interfaces:**
- Consumes: `useStudentDashboard` (returns `exam_stats`), `useExamPackages`, `useRanking`; existing `/results`
- Produces: dashboard showing stats (Tryout Selesai, Rata-rata, Tertinggi, Peringkat Nasional) + daftar nilai ujian terbaru

- [ ] **Step 1: Rewrite the file**

Replace `frontend/app/(portal)/student/page.tsx` with a version that:
- Reads `dashData.exam_stats` for the four stat cards (Tryout Selesai / Rata-rata / Tertinggi / Peringkat Nasional).
- Removes the Level+XP card, streak flame, "Total XP" stat, XP leaderboard preview.
- Keeps: greeting, continue-learning hero, quick actions, recent materials, upcoming exams, weekly activity, daily tip.
- Adds a "Nilai Ujian Terbaru" list rendered from `dashData.recent_results` if present, else from `useExamPackages` + `useRanking` summary; each row links to `/student/exam/[id]/result`.

Reference skeleton (keep existing Tailwind classes/structure, swap only data sources):

```tsx
const dashData = useStudentDashboard() as any;
const examStats = dashData?.exam_stats ?? {};
const stats = [
  { label: "Tryout Selesai", value: examStats.total_completed ?? 0 },
  { label: "Rata-rata Nilai", value: (examStats.average_score ?? 0).toFixed(1) },
  { label: "Nilai Tertinggi", value: (examStats.highest_score ?? 0).toFixed(1) },
  { label: "Peringkat Nasional", value: examStats.national_rank ? `#${examStats.national_rank}` : "—" },
];
```

Render the stats grid, then a "Nilai Ujian Terbaru" section listing recent results (name + score + date, link to result page).

- [ ] **Step 2: Type-check & lint**

Run: `npm run type-check` then `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/app/'(portal)'/student/page.tsx
git commit -m "feat(frontend): student dashboard shows exam score stats and recent results"
```

---

### Task 12: Rework leaderboard page

**Files:**
- Modify: `frontend/app/(portal)/student/leaderboard/page.tsx` (whole file)

**Interfaces:**
- Consumes: `useExamPackages`, `usePackageExams`, `useRanking`, `useAuth`
- Produces: selector of packages + dynamic-column ranking table (`No | Nama Siswa | Mapel 1..N | Total | Rata-rata | Sekolah`) + "Reset bulanan" label

- [ ] **Step 1: Rewrite the file**

Replace `frontend/app/(portal)/student/leaderboard/page.tsx` with a version that:
- Loads packages via `useExamPackages()`, state `selectedPackageId`.
- Loads package exams via `usePackageExams(selectedPackageId)` to build dynamic column headers (subject order).
- Loads rows via `useRanking(selectedPackageId, currentMonth)` where `currentMonth = new Date().toISOString().slice(0,7)`.
- Renders a table: `No | Nama Siswa | {subject_name}... | Total | Rata-rata | Sekolah`.
- Maps each row's `subject_scores` by subject id to fill columns (`(row.subject_scores[subject.exam_content_id] ?? row.subject_scores[subject.subject_id] ?? "—")` — prefer keying scores by `subject_id`; see implementation note below).
- Highlights the current user's row (`row.user_id === user?.id`).
- Shows "Reset bulanan" badge and empty state ("Belum ada nilai tryout pada bulan ini").

Implementation note on keying: the backend `buildRanking` keys `subject_scores` by the subject id (`epe.subject_id::text`). Header columns come from `usePackageExams` which returns `subject_id` + `subject_name`. Therefore read `row.subject_scores[subject.subject_id]`. Confirm during smoke test; if mismatched, adjust backend `FetchRawScores` to key by `epe.exam_content_id` instead and align headers.

- [ ] **Step 2: Type-check & lint**

Run: `npm run type-check` then `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/app/'(portal)'/student/leaderboard/page.tsx
git commit -m "feat(frontend): monthly exam-score leaderboard with per-subject columns"
```

---

### Task 13: Rework student profile page

**Files:**
- Modify: `frontend/app/(portal)/student/profile/page.tsx` (achievements stats L62, L79-88; EditProfileDialog L273-319; Stats block L84-88)

**Interfaces:**
- Consumes: `useAuth`, `useUpdateProfile` (now with `school_name`), existing target/settings dialogs
- Produces: profile without XP achievements; edit dialog with optional School field; keeps Target Sekolah & Jurusan, certificates, change password, notifications

- [ ] **Step 1: Remove achievements usage**

In `frontend/app/(portal)/student/profile/page.tsx`:
- Delete `const achievements = useAchievements();` (L62) and the `useAchievements` import.
- Replace the `stats` block (L84-88) with exam-based stats from `certs`/targets, e.g.:

```tsx
const bestPct = certs.length > 0 ? Math.max(...certs.map((c) => c.percent)) : 0;
const stats = [
  { icon: FileSpreadsheet, value: `${certs.length}`, label: "Tryout Selesai" },
  { icon: TrendingUp, value: `${bestPct > 0 ? Math.round(bestPct) : "—"}%`, label: "Nilai Terbaik" },
  { icon: Medal, value: targets.length ? targets[0]?.threshold_state : "BELUM", label: "Target Sekolah" },
];
```

- Remove the `rank`/`examsDone`/`ertScore` references.

- [ ] **Step 2: Add School field to EditProfileDialog**

In `EditProfileDialog` (L273-319):
- Add state `const [school, setSchool] = React.useState((user as any)?.school_name || "");`
- Populate in the `useEffect` on `[user, isOpen]`.
- Add an Input for School (optional) between avatar and email.
- Include in submit: `await updateProfile.mutateAsync({ full_name: fullName, avatar_url: avatarUrl, school_name: school });`

Update `useUpdateProfile` mutation payload type in `api.ts` (Task 9) to accept `school_name?: string` (edit the hook's payload type from `{ full_name?: string; avatar_url?: string }` to include `school_name?: string`).

- [ ] **Step 3: Remove static "Super App Ultra Pass" card or keep as placeholder**

Decision: keep the card visually but label it with real subscription data if available; otherwise leave as-is (no code change required). Do NOT wire fake data.

- [ ] **Step 4: Type-check & lint**

Run: `npm run type-check` then `npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/app/'(portal)'/student/profile/page.tsx frontend/lib/api.ts
git commit -m "feat(frontend): profile edit includes school name, drop XP stats"
```

---

### Task 14: Update docs (README/summary/WIRING) and final verification

**Files:**
- Modify: `README.md`, `summary.md`, `WIRING.md` (remove XP/gamification mentions; add exam packages & leaderboard)

**Interfaces:**
- Consumes: completed code from all tasks

- [ ] **Step 1: Update docs**

Search for `gamification|XP|level|streak|badge` in `README.md`, `summary.md`, `WIRING.md` and replace XP references with exam-score/ranking descriptions. Keep changes factual and minimal.

- [ ] **Step 2: Backend verify**

Run: `go build ./...` then `go test ./...` (from `backend/`)
Expected: all pass

- [ ] **Step 3: Frontend verify**

Run: `npm run type-check`, `npm run lint`, `npm run build` (from `frontend/`)
Expected: all pass

- [ ] **Step 4: Smoke test**

With backend running against a DB with migration 040/041 applied:
1. Create a package via `POST /api/v1/exam-packages`.
2. Link 3 exams via `POST /api/v1/exam-packages/:id/exams`.
3. Insert a submitted attempt (`status='SUBMITTED'`, `submitted_at=NOW()`, `total_score`) for two students via the seed script or SQL.
4. `GET /api/v1/leaderboard?package_id=...` → verify ranking rows, totals, averages, school names.
5. `GET /api/v1/exam-packages/:id/exams` → verify header subjects.
6. Open `/student/leaderboard` → verify table renders.
7. Edit profile → set School → `PUT /api/v1/auth/profile` → verify `users.school_name` saved and reflected in ranking.

- [ ] **Step 5: Final commit**

```bash
git add README.md summary.md WIRING.md
git commit -m "docs: replace XP references with exam score ranking"
```
