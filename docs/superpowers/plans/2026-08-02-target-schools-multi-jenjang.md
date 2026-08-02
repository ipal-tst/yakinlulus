# Target Sekolah & Jurusan — Multi-Jenjang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the student profile "Target Sekolah & Jurusan" to support SMP, SMA, and Universitas targets backed by admin-managed school master data, auto-computed student scores, and a motivating UI.

**Architecture:** Backend Go Fiber provides `target_schools` master CRUD (admin) + enriched `GET/PUT /profile/targets` (student). Target type is derived from the student's grade (SD→SMP, SMP→SMA, SMA/SMK→UNIVERSITY). Student score is computed server-side: Universitas = IRT (from best certificate percent); SMP/SMA = sum of best-per-subject tryout scores (driven by `target_schools.subjects` + `max_total_score`, no hardcoded 400). Frontend (Next.js) redesigns the target card and dialog, plus a new admin page.

**Tech Stack:** Go Fiber 2 + pgx/v5, PostgreSQL, Next.js 15 App Router, TanStack Query, Tailwind, lucide-react, vitest, testify.

## Global Constraints

- Type-check: `cmd /c "npm run type-check 2>&1"` (must pass).
- Frontend tests: `cmd /c "npm test"` (vitest run).
- Backend build/vet/test: `go build ./... && go vet ./... && go test ./...`.
- Migration pattern per `backend/migrations/038_student_profile.up.sql` (+ matching `.down.sql`).
- `apiFetch` auto-unwraps `{data}`; HttpOnly cookie auth; admin login `admin@yakinlulus.id` / `Admin@123!`.
- TDD: every new function gets a failing test first; no production code without a failing test.
- No hardcoded score total (400); always driven by `target_schools.max_total_score` + `subjects`.
- Target type mapping: SD→`SMP`, SMP→`SMA`, SMA/SMK→`UNIVERSITY`. Unknown/missing grade → `UNIVERSITY`.
- Backend server on :8080, frontend dev on :3000; after backend changes rebuild `yakinlulus-api.exe` and restart it.
- Response shapes use snake_case JSON matching existing Go structs.

---

### Task 1: Migration 039 — target_schools + student_targets alter

**Files:**
- Create: `backend/migrations/039_target_schools.up.sql`
- Create: `backend/migrations/039_target_schools.down.sql`

**Interfaces:**
- Produces: table `target_schools(id, name, level, min_score, max_score, max_total_score, subjects JSONB, academic_year, is_active, created_at, updated_at)`; `student_targets` gains `target_type`, `target_school_id`, renamed `university`→`school_name`, nullable `major`/`passing_score_irt`.

- [ ] **Step 1: Write the up migration**

```sql
-- Migration 039: Target Sekolah multi-jenjang (SMP/SMA/Universitas)
-- Master data sekolah + ambang nilai, dikelola admin & di-update tahunan.

CREATE TABLE IF NOT EXISTS target_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    level VARCHAR(20) NOT NULL
        CHECK (level IN ('SMP','SMA','UNIVERSITY')),
    min_score INT,
    max_score INT,
    max_total_score INT NOT NULL DEFAULT 400,
    subjects JSONB NOT NULL DEFAULT '[]',
    academic_year VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_schools_level ON target_schools(level);
CREATE INDEX IF NOT EXISTS idx_target_schools_active ON target_schools(is_active);

ALTER TABLE student_targets
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(20)
        CHECK (target_type IN ('SMP','SMA','UNIVERSITY'));
ALTER TABLE student_targets
    ADD COLUMN IF NOT EXISTS target_school_id UUID
        REFERENCES target_schools(id) ON DELETE SET NULL;
ALTER TABLE student_targets
    RENAME COLUMN university TO school_name;
ALTER TABLE student_targets
    ALTER COLUMN major DROP NOT NULL;
ALTER TABLE student_targets
    ALTER COLUMN passing_score_irt DROP NOT NULL;
```

- [ ] **Step 2: Write the down migration**

```sql
-- Migration 039 (down): revert target schools changes

ALTER TABLE student_targets DROP COLUMN IF EXISTS target_school_id;
ALTER TABLE student_targets DROP COLUMN IF EXISTS target_type;
ALTER TABLE student_targets ALTER COLUMN major SET NOT NULL;
ALTER TABLE student_targets ALTER COLUMN passing_score_irt SET NOT NULL;
ALTER TABLE student_targets RENAME COLUMN school_name TO university;

DROP TABLE IF EXISTS target_schools;
```

- [ ] **Step 3: Apply migration**

Run: `go run ./cmd/migrate up` (workdir `backend`)
Expected: `Migration applied name=039_target_schools.up.sql`

- [ ] **Step 4: Commit**

```bash
git add backend/migrations/039_target_schools.up.sql backend/migrations/039_target_schools.down.sql
git commit -m "feat: migration 039 target_schools + student_targets multi-jenjang"
```

---

### Task 2: Backend — target_schools admin CRUD + public list

**Files:**
- Create: `backend/internal/target_schools/target_schools.go` (repo, service, handler)
- Modify: `backend/cmd/api/main.go` (register module)
- Test: `backend/internal/target_schools/target_schools_test.go`

**Interfaces:**
- Consumes: `middleware.RequireAuth`, `middleware.RequireRole`, `shared.Success/Error`.
- Produces:
  - `type TargetSchool { ID, Name, Level, MinScore *int, MaxScore *int, MaxTotalScore int, Subjects []string, AcademicYear *string, IsActive bool, CreatedAt, UpdatedAt }`
  - `type SaveSchoolRequest { Name, Level string; MinScore, MaxScore *int; MaxTotalScore int; Subjects []string; AcademicYear *string; IsActive bool }`
  - Routes on `/target-schools`: `GET /` (auth, `?level=`), admin CRUD `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.
  - `func (s *Service) ListSchools(ctx, level string) ([]TargetSchool, error)`
  - `func (s *Service) GetSchool(ctx, id) (*TargetSchool, error)`
  - `func (s *Service) CreateSchool(ctx, SaveSchoolRequest) (*TargetSchool, error)`
  - `func (s *Service) UpdateSchool(ctx, id, SaveSchoolRequest) (*TargetSchool, error)`
  - `func (s *Service) DeleteSchool(ctx, id) error`

- [ ] **Step 1: Write the failing service test**

Create `backend/internal/target_schools/target_schools_test.go` with a pure helper test first (validation), then handler tests come in Step 5.

```go
package target_schools

import "testing"

func TestValidateSaveRequest(t *testing.T) {
	cases := []struct {
		name    string
		req     SaveSchoolRequest
		wantErr bool
	}{
		{"empty name", SaveSchoolRequest{Level: "SMP"}, true},
		{"bad level", SaveSchoolRequest{Name: "SMPN 1", Level: "SD"}, true},
		{"valid", SaveSchoolRequest{Name: "SMPN 1 Yogyakarta", Level: "SMP", MaxTotalScore: 400}, false},
		{"zero max default", SaveSchoolRequest{Name: "SMA N 1", Level: "SMA", MaxTotalScore: 0}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateSaveRequest(tc.req)
			if tc.wantErr && err == nil {
				t.Fatalf("expected error for %q, got nil", tc.name)
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("expected no error for %q, got %v", tc.name, err)
			}
		})
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/target_schools/...`
Expected: FAIL with `undefined: SaveSchoolRequest` / `undefined: validateSaveRequest`

- [ ] **Step 3: Write minimal implementation**

Create `backend/internal/target_schools/target_schools.go`:

```go
package target_schools

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type TargetSchool struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Level          string    `json:"level"`
	MinScore       *int      `json:"min_score,omitempty"`
	MaxScore       *int      `json:"max_score,omitempty"`
	MaxTotalScore  int       `json:"max_total_score"`
	Subjects       []string  `json:"subjects"`
	AcademicYear   *string   `json:"academic_year,omitempty"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type SaveSchoolRequest struct {
	Name          string   `json:"name"`
	Level         string   `json:"level"`
	MinScore      *int     `json:"min_score,omitempty"`
	MaxScore      *int     `json:"max_score,omitempty"`
	MaxTotalScore int      `json:"max_total_score"`
	Subjects      []string `json:"subjects"`
	AcademicYear  *string  `json:"academic_year,omitempty"`
	IsActive      *bool    `json:"is_active,omitempty"`
}

func validateSaveRequest(req SaveSchoolRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name required")
	}
	switch req.Level {
	case "SMP", "SMA", "UNIVERSITY":
	default:
		return fiber.NewError(fiber.StatusBadRequest, "level must be SMP/SMA/UNIVERSITY")
	}
	if req.MaxTotalScore < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "max_total_score cannot be negative")
	}
	return nil
}

// --- Repository ---

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const schoolCols = `id, name, level, min_score, max_score, max_total_score, subjects, academic_year, is_active, created_at, updated_at`

func scanSchool(row pgx.Row) (*TargetSchool, error) {
	var s TargetSchool
	var subjects []byte
	var min, max *int
	var year *string
	err := row.Scan(&s.ID, &s.Name, &s.Level, &min, &max, &s.MaxTotalScore, &subjects, &year, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	s.MinScore, s.MaxScore = min, max
	s.AcademicYear = year
	s.Subjects = []string{}
	if len(subjects) > 0 {
		if err := json.Unmarshal(subjects, &s.Subjects); err != nil {
			s.Subjects = []string{}
		}
	}
	return &s, nil
}

func (r *Repository) List(ctx context.Context, level string) ([]TargetSchool, error) {
	query := `SELECT ` + schoolCols + ` FROM target_schools WHERE is_active = true`
	args := []interface{}{}
	if level != "" {
		query += ` AND level = $1`
		args = append(args, level)
	}
	query += ` ORDER BY name`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TargetSchool
	for rows.Next() {
		s, err := scanSchool(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *s)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*TargetSchool, error) {
	return scanSchool(r.pool.QueryRow(ctx, `SELECT `+schoolCols+` FROM target_schools WHERE id = $1`, id))
}

func (r *Repository) Create(ctx context.Context, req SaveSchoolRequest) (*TargetSchool, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	subjects, _ := json.Marshal(req.Subjects)
	if subjects == nil {
		subjects = []byte("[]")
	}
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO target_schools (name, level, min_score, max_score, max_total_score, subjects, academic_year, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
		req.Name, req.Level, req.MinScore, req.MaxScore, req.MaxTotalScore, subjects, req.AcademicYear, active,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req SaveSchoolRequest) (*TargetSchool, error) {
	subjects, _ := json.Marshal(req.Subjects)
	if subjects == nil {
		subjects = []byte("[]")
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE target_schools SET name=$2, level=$3, min_score=$4, max_score=$5,
		   max_total_score=$6, subjects=$7, academic_year=$8,
		   is_active=COALESCE($9, is_active), updated_at=NOW()
		 WHERE id=$1`,
		id, req.Name, req.Level, req.MinScore, req.MaxScore, req.MaxTotalScore, subjects, req.AcademicYear, req.IsActive)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM target_schools WHERE id = $1`, id)
	return err
}

// --- Service ---

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) ListSchools(ctx context.Context, level string) ([]TargetSchool, error) {
	return s.repo.List(ctx, level)
}
func (s *Service) GetSchool(ctx context.Context, id uuid.UUID) (*TargetSchool, error) {
	return s.repo.GetByID(ctx, id)
}
func (s *Service) CreateSchool(ctx context.Context, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, req)
}
func (s *Service) UpdateSchool(ctx context.Context, id uuid.UUID, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, id, req)
}
func (s *Service) DeleteSchool(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// --- Handler ---

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler { return &Handler{svc: svc, auth: jwtSecret} }

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	write := middleware.RequireRole("ADMIN", "STAFF")

	r := router.Group("/target-schools", authM)
	r.Get("/", h.List)
	r.Get("/:id", write, h.Get)
	r.Post("/", write, h.Create)
	r.Put("/:id", write, h.Update)
	r.Delete("/:id", write, h.Delete)
}

func (h *Handler) List(c *fiber.Ctx) error {
	schools, err := h.svc.ListSchools(c.Context(), c.Query("level"))
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list target schools"))
	}
	if schools == nil {
		schools = []TargetSchool{}
	}
	return c.JSON(shared.Success(schools))
}

func (h *Handler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	s, err := h.svc.GetSchool(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "School not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get school"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req SaveSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	s, err := h.svc.CreateSchool(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create school"))
	}
	return c.Status(201).JSON(shared.Success(s))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req SaveSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	s, err := h.svc.UpdateSchool(c.Context(), id, req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update school"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	if err := h.svc.DeleteSchool(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete school"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}
```

- [ ] **Step 4: Add required import `encoding/json`**

Add `"encoding/json"` to the import block in `target_schools.go` (used by `scanSchool`/`Create`/`Update`).

- [ ] **Step 5: Run test to verify it passes**

Run: `go test ./internal/target_schools/...`
Expected: PASS

- [ ] **Step 6: Register module in main.go**

In `backend/cmd/api/main.go`:
- Add import `"yakinlulus.id/backend/internal/target_schools"`.
- After the profile module block add:

```go
	// Target schools module
	targetSchoolRepo := target_schools.NewRepository(pool)
	targetSchoolSvc := target_schools.NewService(targetSchoolRepo)
	targetSchoolHandler := target_schools.NewHandler(targetSchoolSvc, cfg.JWT.Secret)
```

- Add to route registration: `targetSchoolHandler.RegisterRoutes(api)`

- [ ] **Step 7: Build & commit**

Run: `go build ./...` → expected clean
Commit:

```bash
git add backend/internal/target_schools backend/cmd/api/main.go
git commit -m "feat: target_schools admin CRUD + public list"
```

---

### Task 3: Backend — profile targets multi-jenjang + enriched response

**Files:**
- Modify: `backend/internal/profile/profile.go`
- Test: `backend/internal/profile/profile_test.go` (extend)

**Interfaces:**
- Consumes: `target_schools.TargetSchool` (for enrichment), existing `users.grade_id`.
- Produces:
  - `func targetTypeFromGrade(levelCode string) string` → `SMP`|`SMA`|`UNIVERSITY`
  - `func (r *Repository) GetUserLevelCode(ctx, userID) (string, error)`
  - `func (s *Service) ResolveStudentScore(ctx, userID, school *target_schools.TargetSchool) (score int, progress float64, hasData bool, err error)`
  - `func (s *Service) GetEnrichedTargets(ctx, userID) ([]EnrichedTarget, error)`
  - `type EnrichedTarget { ID, Choice, TargetType, SchoolName string; SchoolID *uuid.UUID; Major *string; PassingScoreIRT *int; MinScore, MaxScore *int; MaxTotalScore int; Subjects []string; StudentScore int; ProgressPct float64; HasScoreData bool; ThresholdRank string; Motivational string; CreatedAt, UpdatedAt }`

- [ ] **Step 1: Write the failing tests**

Append to `backend/internal/profile/profile_test.go`:

```go
func TestTargetTypeFromGrade(t *testing.T) {
	cases := []struct{ level, want string }{
		{"SD", "SMP"}, {"SMP", "SMA"}, {"SMA", "UNIVERSITY"},
		{"SMK", "UNIVERSITY"}, {"ALUMNI", "UNIVERSITY"}, {"UTBK", "UNIVERSITY"},
		{"", "UNIVERSITY"}, {"XYZ", "UNIVERSITY"},
	}
	for _, tc := range cases {
		if got := targetTypeFromGrade(tc.level); got != tc.want {
			t.Errorf("targetTypeFromGrade(%q) = %q, want %q", tc.level, got, tc.want)
		}
	}
}

func TestMotivationalState(t *testing.T) {
	cases := []struct {
		name                  string
		hasData               bool
		score, minScore       int
		wantPass, wantMotiv   string
	}{
		{"no data", false, 0, 0, "PENDING", "Belum ada nilai tryout"},
		{"below", true, 350, 367, "BELOW", "Kurang 17 poin lagi untuk lolos ambang"},
		{"meets", true, 398, 367, "PASSED", "Nilai kamu di atas ambang sekolah"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			state, motiv := motivationalState(tc.hasData, tc.score, tc.minScore)
			if state != tc.wantPass || motiv != tc.wantMotiv {
				t.Errorf("got (%q, %q), want (%q, %q)", state, motiv, tc.wantPass, tc.wantMotiv)
			}
		})
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/profile/...`
Expected: FAIL with `undefined: targetTypeFromGrade` / `undefined: motivationalState`

- [ ] **Step 3: Implement helpers**

In `backend/internal/profile/profile.go` add (before Handler):

```go
// targetTypeFromGrade maps a student's education level to the next target type.
func targetTypeFromGrade(levelCode string) string {
	switch strings.ToUpper(strings.TrimSpace(levelCode)) {
	case "SD":
		return "SMP"
	case "SMP":
		return "SMA"
	default:
		return "UNIVERSITY"
	}
}

// motivationalState derives the motivating state for a target.
func motivationalState(hasData bool, score, minScore int) (state, motivational string) {
	if !hasData {
		return "PENDING", "Belum ada nilai tryout"
	}
	if score >= minScore {
		return "PASSED", "Nilai kamu di atas ambang sekolah"
	}
	return "BELOW", fmt.Sprintf("Kurang %d poin lagi untuk lolos ambang", minScore-score)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/profile/...`
Expected: PASS (both new tests)

- [ ] **Step 5: Add repository methods**

In `profile.go` Repository add:

```go
func (r *Repository) GetUserLevelCode(ctx context.Context, userID uuid.UUID) (string, error) {
	var code string
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(el.code, '') FROM users u
		 LEFT JOIN grades g ON g.id = u.grade_id
		 LEFT JOIN education_levels el ON el.id = g.education_level_id
		 WHERE u.id = $1`, userID).Scan(&code)
	if err != nil && err != pgx.ErrNoRows {
		return "", err
	}
	return code, nil
}

func (r *Repository) ListTargetsEnriched(ctx context.Context, userID uuid.UUID) ([]StudentTarget, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, choice, target_type, target_school_id, COALESCE(school_name,''),
		   major, passing_score_irt, created_at, updated_at
		 FROM student_targets WHERE user_id = $1 ORDER BY choice`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var targets []StudentTarget
	for rows.Next() {
		var t StudentTarget
		if err := rows.Scan(&t.ID, &t.Choice, &t.TargetType, &t.SchoolID, &t.SchoolName,
			&t.Major, &t.PassingScoreIRT, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		targets = append(targets, t)
	}
	return targets, rows.Err()
}
```

- [ ] **Step 6: Update StudentTarget/TargetInput models**

Replace the `StudentTarget` and `TargetInput` structs:

```go
type StudentTarget struct {
	ID              uuid.UUID  `json:"id"`
	Choice          int        `json:"choice"`
	TargetType      string     `json:"target_type"`
	SchoolID        *uuid.UUID `json:"target_school_id,omitempty"`
	SchoolName      string     `json:"school_name"`
	Major           *string    `json:"major,omitempty"`
	PassingScoreIRT *int       `json:"passing_score_irt,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type SaveTargetsRequest struct {
	Targets []TargetInput `json:"targets"`
}

type TargetInput struct {
	Choice          int    `json:"choice"`
	TargetSchoolID  string `json:"target_school_id"`
	SchoolName      string `json:"school_name"`
	Major           *string `json:"major,omitempty"`
	PassingScoreIRT *int   `json:"passing_score_irt,omitempty"`
}

type EnrichedTarget struct {
	ID             uuid.UUID  `json:"id"`
	Choice         int        `json:"choice"`
	TargetType     string     `json:"target_type"`
	SchoolID       *uuid.UUID `json:"target_school_id,omitempty"`
	SchoolName     string     `json:"school_name"`
	Major          *string    `json:"major,omitempty"`
	PassingScoreIRT *int      `json:"passing_score_irt,omitempty"`
	MinScore       *int       `json:"min_score,omitempty"`
	MaxScore       *int       `json:"max_score,omitempty"`
	MaxTotalScore  int        `json:"max_total_score"`
	Subjects       []string   `json:"subjects"`
	StudentScore   int        `json:"student_score"`
	ProgressPct    float64    `json:"progress_pct"`
	HasScoreData   bool       `json:"has_score_data"`
	ThresholdState string     `json:"threshold_state"`
	Motivational   string     `json:"motivational"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
```

- [ ] **Step 7: Update UpsertTargets SQL + service**

Replace `UpsertTargets` body:

```go
func (r *Repository) UpsertTargets(ctx context.Context, userID uuid.UUID, targets []TargetInput) ([]StudentTarget, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	for _, in := range targets {
		if in.Choice != 1 && in.Choice != 2 {
			continue
		}
		var schoolID *uuid.UUID
		if in.TargetSchoolID != "" {
			if id, perr := uuid.Parse(in.TargetSchoolID); perr == nil {
				schoolID = &id
			}
		}
		_, err := tx.Exec(ctx,
			`INSERT INTO student_targets (user_id, choice, target_type, target_school_id, school_name, major, passing_score_irt)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (user_id, choice)
			 DO UPDATE SET target_school_id = EXCLUDED.target_school_id,
			   school_name = EXCLUDED.school_name,
			   major = EXCLUDED.major,
			   passing_score_irt = EXCLUDED.passing_score_irt,
			   updated_at = NOW()`,
			userID, in.Choice, targetTypeFromGrade(""), schoolID, in.SchoolName, in.Major, in.PassingScoreIRT)
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.ListTargetsEnriched(ctx, userID)
}
```

Note: target_type is re-derived at read time from grade, so store a placeholder; the Service resolves the real type.

- [ ] **Step 8: Add score computation + service enrichment**

Add to `profile.go` (Service):

```go
// ResolveStudentScore computes the student's current score against a school.
// UNIVERSITY -> IRT (best certificate percent * 10). SMP/SMA -> sum of
// best-per-subject tryout scores driven by school.Subjects / MaxTotalScore.
func (s *Service) ResolveStudentScore(ctx context.Context, userID uuid.UUID, school *target_schools.TargetSchool) (score int, progress float64, hasData bool, err error) {
	if school == nil {
		return 0, 0, false, nil
	}
	if school.Level == "UNIVERSITY" {
		best, ok, cerr := s.repo.BestCertificatePct(ctx, userID)
		if cerr != nil {
			return 0, 0, false, cerr
		}
		if !ok {
			return 0, 0, false, nil
		}
		score = int(best * 10)
		max := school.MaxTotalScore
		if max <= 0 {
			max = 700
		}
		if max > 0 {
			progress = float64(score) / float64(max) * 100
		}
		return score, progress, true, nil
	}

	total, hasData, cerr := s.repo.SumBestPerSubject(ctx, userID, school.Subjects)
	if cerr != nil {
		return 0, 0, false, cerr
	}
	if !hasData {
		return 0, 0, false, nil
	}
	score = total
	max := school.MaxTotalScore
	if max <= 0 {
		max = 400
	}
	if max > 0 {
		progress = float64(score) / float64(max) * 100
	}
	return score, progress, true, nil
}

func (s *Service) GetEnrichedTargets(ctx context.Context, userID uuid.UUID) ([]EnrichedTarget, error) {
	levelCode, err := s.repo.GetUserLevelCode(ctx, userID)
	if err != nil {
		return nil, err
	}
	targetType := targetTypeFromGrade(levelCode)

	targets, err := s.repo.ListTargetsEnriched(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := []EnrichedTarget{}
	for _, t := range targets {
		et := EnrichedTarget{
			ID: t.ID, Choice: t.Choice, TargetType: targetType,
			SchoolID: t.SchoolID, SchoolName: t.SchoolName,
			Major: t.Major, PassingScoreIRT: t.PassingScoreIRT,
			Subjects: []string{}, CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
		}
		if t.SchoolID != nil {
			school, serr := s.schoolRepo.GetByID(ctx, *t.SchoolID)
			if serr == nil && school != nil {
				et.MinScore = school.MinScore
				et.MaxScore = school.MaxScore
				et.MaxTotalScore = school.MaxTotalScore
				et.Subjects = school.Subjects
				if et.SchoolName == "" {
					et.SchoolName = school.Name
				}
				score, progress, hasData, serr2 := s.ResolveStudentScore(ctx, userID, school)
				if serr2 == nil {
					et.StudentScore = score
					et.ProgressPct = progress
					et.HasScoreData = hasData
					min := 0
					if school.MinScore != nil {
						min = *school.MinScore
					}
					et.ThresholdState, et.Motivational = motivationalState(hasData, score, min)
				}
			}
		} else {
			et.ThresholdState, et.Motivational = motivationalState(false, 0, 0)
		}
		out = append(out, et)
	}
	return out, nil
}
```

- [ ] **Step 9: Add repository helpers + schoolRepo field**

Add to Repository:

```go
func (r *Repository) BestCertificatePct(ctx context.Context, userID uuid.UUID) (float64, bool, error) {
	var pct float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(CASE WHEN COALESCE(a.max_score,0) > 0
		        THEN ROUND(COALESCE(a.total_score,0)/a.max_score*100,1) ELSE 0 END),0)
		 FROM content_exam_attempts a
		 WHERE a.user_id = $1 AND a.status = 'SUBMITTED'`, userID).Scan(&pct)
	if err != nil {
		return 0, false, err
	}
	return pct, pct > 0, nil
}

// SumBestPerSubject sums the best score per subject across the student's
// submitted attempts, only counting subjects present in the given list.
func (r *Repository) SumBestPerSubject(ctx context.Context, userID uuid.UUID, subjects []string) (int, bool, error) {
	if len(subjects) == 0 {
		return 0, false, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT s.name, MAX(COALESCE(a.total_score,0))
		 FROM content_exam_attempts a
		 JOIN contents c ON c.id = a.exam_content_id
		 JOIN subjects s ON s.id = c.subject_id
		 WHERE a.user_id = $1 AND a.status = 'SUBMITTED'
		   AND LOWER(s.name) = ANY($2)
		 GROUP BY s.name`, userID, lowerAll(subjects))
	if err != nil {
		return 0, false, err
	}
	defer rows.Close()
	total := 0
	found := false
	for rows.Next() {
		var name string
		var sc int
		if err := rows.Scan(&name, &sc); err != nil {
			return 0, false, err
		}
		total += sc
		found = true
	}
	return total, found, rows.Err()
}

func lowerAll(in []string) []string {
	out := make([]string, len(in))
	for i, v := range in {
		out[i] = strings.ToLower(strings.TrimSpace(v))
	}
	return out
}
```

Add `schoolRepo *target_schools.Repository` to `Service`, set in `NewService`; update signature:

```go
func NewService(repo *Repository, schoolRepo *target_schools.Repository) *Service {
	return &Service{repo: repo, schoolRepo: schoolRepo}
}
```

Add import `"yakinlulus.id/backend/internal/target_schools"`.

- [ ] **Step 10: Update handlers GetTargets/SaveTargets**

```go
func (h *Handler) GetTargets(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	targets, err := h.svc.GetEnrichedTargets(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list targets"))
	}
	if targets == nil {
		targets = []EnrichedTarget{}
	}
	return c.JSON(shared.Success(targets))
}

func (h *Handler) SaveTargets(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	var req SaveTargetsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if len(req.Targets) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "targets required"))
	}
	for _, t := range req.Targets {
		if strings.TrimSpace(t.SchoolName) == "" && strings.TrimSpace(t.TargetSchoolID) == "" {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "school_name or target_school_id required for each target"))
		}
	}
	if _, err := h.svc.SaveTargets(c.Context(), userID, req); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save targets"))
	}
	enriched, err := h.svc.GetEnrichedTargets(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load targets"))
	}
	return c.JSON(shared.Success(enriched))
}
```

- [ ] **Step 11: Update NewService call in main.go**

In `backend/cmd/api/main.go`, change profile service construction:

```go
	profileSvc := profile.NewService(profileRepo, targetSchoolRepo)
```

(Note: `targetSchoolRepo` is created in the target_schools block; ensure the profile block references it AFTER declaration or move the profile block after target schools.)

- [ ] **Step 12: Update existing test + build + commit**

Update `backend/internal/profile/profile_test.go` to use the new constructor signature (`NewService(nil, nil)`). Run `go build ./...` → fix compile errors (e.g. keep `SaveTargets` service wrapper delegating to `UpsertTargets`, add missing imports). Run `go test ./internal/profile/... ./internal/target_schools/...` → PASS. Rebuild binary `go build -o yakinlulus-api.exe ./cmd/api` and restart the server (stop PID on :8080, start exe).

Commit:

```bash
git add backend/internal/profile backend/internal/target_schools backend/cmd/api/main.go
git commit -m "feat: profile targets multi-jenjang with enriched score"
```

---

### Task 4: Backend — seed data + live endpoint verification

**Files:**
- (none new)

- [ ] **Step 1: Insert sample target schools**

Login as admin (cookie session) and POST a few schools:

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = '{"email":"admin@yakinlulus.id","password":"Admin@123!"}'
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $login -ContentType "application/json" -WebSession $s | Out-Null
$schools = @(
  '{"name":"SMA Negeri 1 Yogyakarta","level":"SMA","min_score":367,"max_score":398,"max_total_score":400,"subjects":["Matematika","Bahasa Indonesia","Bahasa Inggris","IPA"],"academic_year":"2026"}',
  '{"name":"SMP Negeri 8 Yogyakarta","level":"SMP","min_score":350,"max_score":390,"max_total_score":400,"subjects":["Matematika","Bahasa Indonesia","Bahasa Inggris","IPA"],"academic_year":"2026"}',
  '{"name":"Institut Teknologi Bandung","level":"UNIVERSITY","min_score":700,"max_score":760,"max_total_score":700,"subjects":[],"academic_year":"2026"}'
)
foreach ($b in $schools) { Invoke-RestMethod -Uri "http://localhost:8080/api/v1/target-schools" -Method Post -Body $b -ContentType "application/json" -WebSession $s | Out-Null }
Write-Output "Seeded"
```

Expected: prints `Seeded`

- [ ] **Step 2: Verify GET /target-schools**

`GET http://localhost:8080/api/v1/target-schools?level=SMA` → JSON array with SMA Negeri 1 Yogyakarta.

- [ ] **Step 3: Verify PUT + GET /profile/targets**

PUT `{"targets":[{"choice":1,"target_school_id":"<SMA id>","school_name":"SMA Negeri 1 Yogyakarta"}]}` then GET `/profile/targets` → array with `target_type:"UNIVERSITY"` (admin grade likely UNIVERSITY), school threshold fields, `has_score_data` (false if no attempts), `motivational` fallback.

- [ ] **Step 4: Commit**

```bash
git commit -am "chore: verify target schools endpoints live"
```

---

### Task 5: Frontend — api hooks + api-client methods

**Files:**
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/lib/api-client.ts`

**Interfaces:**
- Produces in `lib/api.ts`:
  - `export interface TargetSchool { id, name, level, min_score?, max_score?, max_total_score, subjects: string[], academic_year?, is_active, created_at, updated_at }`
  - `export interface EnrichedTarget { id, choice, target_type, target_school_id?, school_name, major?, passing_score_irt?, min_score?, max_score?, max_total_score, subjects, student_score, progress_pct, has_score_data, threshold_state, motivational, created_at, updated_at }`
  - `export function useTargetSchools(level: string)` — GET `/target-schools?level=`
  - `export function useSaveTargets(payload: SaveTargetsPayload)` — updated payload
  - `export function useCreateTargetSchool()`, `useUpdateTargetSchool()`, `useDeleteTargetSchool()`
  - Update `useMyTargets()` return type to `EnrichedTarget[]`.
- Produces in `api-client.ts`:
  - `apiClient.targetSchools.list(level)`, `.create(payload)`, `.update(id,payload)`, `.remove(id)`
  - Update `apiClient.profile.saveTargets` payload shape.

- [ ] **Step 1: Update `lib/api.ts`**

Replace the `StudentTarget` interface + `useMyTargets`/`useSaveTargets` block with:

```ts
export interface TargetSchool {
  id: string;
  name: string;
  level: "SMP" | "SMA" | "UNIVERSITY";
  min_score?: number;
  max_score?: number;
  max_total_score: number;
  subjects: string[];
  academic_year?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrichedTarget {
  id: string;
  choice: number;
  target_type: "SMP" | "SMA" | "UNIVERSITY";
  target_school_id?: string;
  school_name: string;
  major?: string;
  passing_score_irt?: number;
  min_score?: number;
  max_score?: number;
  max_total_score: number;
  subjects: string[];
  student_score: number;
  progress_pct: number;
  has_score_data: boolean;
  threshold_state: "PENDING" | "PASSED" | "BELOW";
  motivational: string;
  created_at: string;
  updated_at: string;
}

export interface SaveTargetInput {
  choice: number;
  target_school_id?: string;
  school_name?: string;
  major?: string;
  passing_score_irt?: number;
}

export function useMyTargets() {
  return useQuery<EnrichedTarget[]>({
    queryKey: queryKeys.profile.targets,
    queryFn: () => apiFetch<EnrichedTarget[]>('/profile/targets'),
  });
}

export function useSaveTargets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targets: SaveTargetInput[]) =>
      apiFetch('/profile/targets', { method: 'PUT', body: JSON.stringify({ targets }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.targets }),
  });
}

export function useTargetSchools(level: string) {
  return useQuery<TargetSchool[]>({
    queryKey: ['target-schools', level],
    queryFn: () => apiFetch<TargetSchool[]>(`/target-schools${level ? `?level=${level}` : ''}`),
    enabled: !!level,
  });
}

export function useCreateTargetSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TargetSchool>) => apiFetch('/target-schools', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['target-schools'] }),
  });
}

export function useUpdateTargetSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TargetSchool> }) =>
      apiFetch(`/target-schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['target-schools'] }),
  });
}

export function useDeleteTargetSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/target-schools/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['target-schools'] }),
  });
}
```

- [ ] **Step 2: Update `api-client.ts`**

Replace `apiClient.profile` block:

```ts
    // --- 1b. Student Profile API ---
    public profile = {
        getTargets: async () => this.request("/profile/targets", { method: "GET" }),
        saveTargets: async (targets: any[]) => this.request("/profile/targets", { method: "PUT", body: JSON.stringify({ targets }) }),
        getCertificates: async () => this.request("/profile/certificates", { method: "GET" }),
    };

    // --- 1c. Target Schools API ---
    public targetSchools = {
        list: async (level?: string) => this.request(`/target-schools${level ? `?level=${level}` : ""}`, { method: "GET" }),
        create: async (payload: any) => this.request("/target-schools", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: any) => this.request(`/target-schools/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        remove: async (id: string) => this.request(`/target-schools/${id}`, { method: "DELETE" }),
    };
```

- [ ] **Step 3: Type-check**

Run: `cmd /c "npm run type-check 2>&1"` → PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api.ts frontend/lib/api-client.ts
git commit -m "feat: frontend hooks for target schools + enriched targets"
```

---

### Task 6: Frontend — target card + dialog redesign (student profile)

**Files:**
- Modify: `frontend/app/(portal)/student/profile/page.tsx`

**Interfaces:**
- Consumes: `useMyTargets` (EnrichedTarget[]), `useSaveTargets`, `useTargetSchools`.

- [ ] **Step 1: Replace TargetsDialog with school-picker version**

Replace the `TargetsDialog` component: use `useTargetSchools(targetType)` for the dropdown (searchable via native filter), show major + passing score inputs only when `targetType === "UNIVERSITY"`, and a live preview of the selected school's threshold. Also show target type badge read-only.

```tsx
function TargetsDialog({ isOpen, onClose, targets }: { isOpen: boolean; onClose: () => void; targets: EnrichedTarget[] }) {
    const { user } = useAuth();
    const targetType: "SMP" | "SMA" | "UNIVERSITY" = targets[0]?.target_type || "UNIVERSITY";
    const schoolsQuery = useTargetSchools(targetType);
    const schools: TargetSchool[] = schoolsQuery.data ?? [];
    const saveTargets = useSaveTargets();

    const [choices, setChoices] = React.useState<Array<{ choice: number; schoolId: string; schoolName: string; major: string; passing: string }>>([
        { choice: 1, schoolId: "", schoolName: "", major: "", passing: "" },
        { choice: 2, schoolId: "", schoolName: "", major: "", passing: "" },
    ]);

    React.useEffect(() => {
        if (isOpen) {
            setChoices([1, 2].map((c) => {
                const found = targets.find((t) => t.choice === c);
                return {
                    choice: c,
                    schoolId: found?.target_school_id || "",
                    schoolName: found?.school_name || "",
                    major: found?.major || "",
                    passing: found?.passing_score_irt ? String(found.passing_score_irt) : "",
                };
            }));
        }
    }, [isOpen, targets]);

    const setField = (index: number, field: keyof typeof choices[number], value: string) =>
        setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

    const selectSchool = (index: number, schoolId: string) => {
        const school = schools.find((s) => s.id === schoolId);
        setChoices((prev) => prev.map((c, i) =>
            i === index ? { ...c, schoolId, schoolName: school?.name || "" } : c));
    };

    const submit = async () => {
        const valid = choices.filter((c) => c.schoolId || c.schoolName.trim());
        if (valid.length === 0) { alert("Pilih minimal satu sekolah"); return; }
        await saveTargets.mutateAsync(
            valid.map((c) => ({
                choice: c.choice,
                target_school_id: c.schoolId || undefined,
                school_name: c.schoolName.trim(),
                major: targetType === "UNIVERSITY" ? c.major.trim() || undefined : undefined,
                passing_score_irt: targetType === "UNIVERSITY" && c.passing ? Number(c.passing) : undefined,
            }))
        );
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Target Sekolah & Jurusan" description={`Jenjang target: ${targetType === "UNIVERSITY" ? "Universitas" : targetType}`}>
            <div className="space-y-4">
                <div className="rounded-xl border bg-primary/5 border-primary/20 p-3">
                    <p className="text-xs font-semibold text-primary">Jenjang target kamu: {targetType === "UNIVERSITY" ? "Universitas (PTN)" : `Sekolah ${targetType}`}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Diturunkan otomatis dari kelasmu. Pilih sekolah & jurusan impian dari daftar.</p>
                </div>
                {choices.map((c, i) => {
                    const selectedSchool = schools.find((s) => s.id === c.schoolId);
                    return (
                        <div key={c.choice} className="space-y-2 rounded-xl border p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {c.choice === 1 ? "Pilihan 1 (Utama)" : "Pilihan 2"}
                            </p>
                            <select
                                value={c.schoolId}
                                onChange={(e) => selectSchool(i, e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Pilih sekolah...</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.max_score ? `(${s.min_score}-${s.max_score})` : ""}
                                    </option>
                                ))}
                            </select>
                            {selectedSchool && (
                                <p className="text-[11px] text-muted-foreground">
                                    Ambang nilai: {selectedSchool.min_score ?? "-"} - {selectedSchool.max_score ?? "-"}
                                </p>
                            )}
                            {targetType === "UNIVERSITY" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <Input value={c.major} onChange={(e) => setField(i, "major", e.target.value)} placeholder="Jurusan" />
                                    <Input value={c.passing} onChange={(e) => setField(i, "passing", e.target.value)} placeholder="Passing grade IRT" type="number" />
                                </div>
                            )}
                        </div>
                    );
                })}
                <Button size="sm" className="w-full" onClick={submit} disabled={saveTargets.isPending}>
                    {saveTargets.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                    Simpan Target
                </Button>
            </div>
        </Dialog>
    );
}
```

- [ ] **Step 2: Replace the target card section**

Replace the "Target Sekolah & Jurusan Impian" card content to use `EnrichedTarget` fields with progress + motivational state:

```tsx
{targets.length === 0 ? (
    <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
        Belum ada target. Klik <span className="font-semibold text-primary">Ubah</span> untuk menambahkan target sekolah & jurusan impianmu.
    </div>
) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {targets.map((t) => {
            const pct = t.has_score_data ? Math.min(100, Math.round(t.progress_pct)) : 0;
            return (
                <div key={t.id} className={`p-4 rounded-xl border space-y-2 ${t.choice === 1 ? "bg-primary/5 border-primary/20" : ""}`}>
                    <div className="flex items-center justify-between">
                        <Badge variant={t.choice === 1 ? "default" : "outline"} className="text-[10px]">
                            {t.choice === 1 ? "PILIHAN 1 (UTAMA)" : "PILIHAN 2"} • {t.target_type}
                        </Badge>
                        <Badge variant={t.threshold_state === "PASSED" ? "success" : t.threshold_state === "BELOW" ? "warning" : "secondary"} className="text-[10px]">
                            {t.threshold_state === "PASSED" ? "LULUS" : t.threshold_state === "BELOW" ? "KURANG" : "BELUM"}
                        </Badge>
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground">{t.school_name}</h4>
                    <p className="text-xs text-muted-foreground">
                        {t.major || (t.subjects.length ? t.subjects.join(" • ") : "")}
                        {t.max_score ? ` • Ambang: ${t.min_score}-${t.max_score}` : ""}
                    </p>
                    {t.has_score_data ? (
                        <>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${t.threshold_state === "PASSED" ? "bg-success" : "bg-primary"}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-muted-foreground">Nilai kamu: {t.student_score}</span>
                                <span className={t.threshold_state === "PASSED" ? "text-success" : "text-primary"}>{pct}%</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">{t.motivational}</p>
                    )}
                    <p className={`text-xs font-semibold ${t.threshold_state === "PASSED" ? "text-success" : t.threshold_state === "BELOW" ? "text-warning-foreground" : "text-muted-foreground"}`}>
                        {t.motivational}
                    </p>
                </div>
            );
        })}
    </div>
)}
```

- [ ] **Step 3: Update imports**

Ensure the page imports `TargetSchool`, `EnrichedTarget` from `@/lib/api`, and keeps `Input`, `Loader2`, `Target`, `Badge`, `Button`, `Dialog`, `useAuth`.

- [ ] **Step 4: Type-check**

Run: `cmd /c "npm run type-check 2>&1"` → PASS

- [ ] **Step 5: Test render**

`npm test` still passes. Verify page loads at `http://localhost:3000/student/profile` (200, no render error).

- [ ] **Step 6: Commit**

```bash
git add "frontend/app/(portal)/student/profile/page.tsx"
git commit -m "feat: student target card + dialog multi-jenjang UI"
```

---

### Task 7: Frontend — admin target schools management page

**Files:**
- Create: `frontend/app/(portal)/admin/target-schools/page.tsx`

**Interfaces:**
- Consumes: `useTargetSchools`, `useCreateTargetSchool`, `useUpdateTargetSchool`, `useDeleteTargetSchool`, `useAuth`, `useHasRole`.

- [ ] **Step 1: Write page**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useHasRole } from "@/providers/AuthProvider";
import {
    useTargetSchools, useCreateTargetSchool, useUpdateTargetSchool, useDeleteTargetSchool,
    type TargetSchool,
} from "@/lib/api";
import { Plus, Pencil, Trash2, Loader2, School } from "lucide-react";

const LEVELS: Array<{ value: TargetSchool["level"]; label: string }> = [
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "UNIVERSITY", label: "Universitas" },
];

export default function AdminTargetSchoolsPage() {
    const { allowed, loading } = useHasRole("ADMIN", "STAFF");
    const router = useRouter();
    const [level, setLevel] = React.useState<TargetSchool["level"]>("SMP");
    const schools = useTargetSchools(level);
    const createSchool = useCreateTargetSchool();
    const updateSchool = useUpdateTargetSchool();
    const deleteSchool = useDeleteTargetSchool();
    const [editing, setEditing] = React.useState<Partial<TargetSchool> | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    if (loading) return <div className="p-6">Memuat...</div>;
    if (!allowed) {
        router.replace("/admin");
        return null;
    }

    const list = schools.data ?? [];

    const openNew = () => { setEditing({ level, max_total_score: 400, subjects: [], is_active: true }); setDialogOpen(true); };
    const openEdit = (s: TargetSchool) => { setEditing(s); setDialogOpen(true); };

    const save = async () => {
        if (!editing) return;
        if (editing.id) await updateSchool.mutateAsync({ id: editing.id, data: editing });
        else await createSchool.mutateAsync(editing);
        setDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">ADMIN</Badge>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Target Sekolah</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Master data sekolah & ambang nilai (SMP/SMA/Universitas).</p>
                </div>
                <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Sekolah</Button>
            </div>

            <div className="flex gap-2">
                {LEVELS.map((l) => (
                    <Button key={l.value} variant={level === l.value ? "default" : "outline"} size="sm" onClick={() => setLevel(l.value)}>
                        {l.label}
                    </Button>
                ))}
            </div>

            <Card className="p-4">
                {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada sekolah untuk jenjang {level}.</p>
                ) : (
                    <div className="space-y-3">
                        {list.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-xl border p-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate flex items-center gap-1.5">
                                        <School className="h-4 w-4 text-primary" /> {s.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Ambang: {s.min_score ?? "-"} - {s.max_score ?? "-"} • Maks: {s.max_total_score}
                                        {s.academic_year ? ` • ${s.academic_year}` : ""}
                                        {s.subjects.length ? ` • ${s.subjects.join(", ")}` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <Badge variant={s.is_active ? "success" : "secondary"} className="text-[10px]">{s.is_active ? "AKTIF" : "NONAKTIF"}</Badge>
                                    <Button variant="outline" size="icon" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="outline" size="icon" className="text-danger" onClick={() => deleteSchool.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={editing?.id ? "Edit Sekolah" : "Tambah Sekolah"}>
                {editing && (
                    <div className="space-y-3">
                        <Input placeholder="Nama sekolah" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                        <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Min" type="number" value={editing.min_score ?? ""} onChange={(e) => setEditing({ ...editing, min_score: e.target.value ? Number(e.target.value) : undefined })} />
                            <Input placeholder="Max" type="number" value={editing.max_score ?? ""} onChange={(e) => setEditing({ ...editing, max_score: e.target.value ? Number(e.target.value) : undefined })} />
                            <Input placeholder="Total maks" type="number" value={editing.max_total_score ?? 400} onChange={(e) => setEditing({ ...editing, max_total_score: e.target.value ? Number(e.target.value) : 400 })} />
                        </div>
                        <Input placeholder="Tahun ajaran (contoh 2026)" value={editing.academic_year || ""} onChange={(e) => setEditing({ ...editing, academic_year: e.target.value })} />
                        <Input placeholder="Mapel dipisah koma (contoh: Matematika, IPA)" value={(editing.subjects || []).join(", ")} onChange={(e) => setEditing({ ...editing, subjects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                        <select value={editing.level || "SMP"} onChange={(e) => setEditing({ ...editing, level: e.target.value as TargetSchool["level"] })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                        <Button size="sm" className="w-full" onClick={save} disabled={createSchool.isPending || updateSchool.isPending}>
                            {(createSchool.isPending || updateSchool.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Simpan
                        </Button>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `cmd /c "npm run type-check 2>&1"` → PASS

- [ ] **Step 3: Manual verify**

Open `http://localhost:3000/admin/target-schools` as admin → add/edit/delete a school.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/(portal)/admin/target-schools/page.tsx"
git commit -m "feat: admin target schools management page"
```

---

### Task 8: Final verification

**Files:**
- (none)

- [ ] **Step 1: Backend**

Run: `go build ./... && go vet ./... && go test ./...` → all PASS

- [ ] **Step 2: Frontend**

Run: `cmd /c "npm run type-check 2>&1"` and `cmd /c "npm test"` → PASS

- [ ] **Step 3: Live smoke test**

- Login, GET `/profile/targets` returns enriched array.
- PUT a target with a seeded school → enrichment shows threshold + motivational.
- Admin page CRUD works.

- [ ] **Step 4: Final commit**

```bash
git commit -am "feat: target schools multi-jenjang complete"
```
