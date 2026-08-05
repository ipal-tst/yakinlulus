# Batch 1 — Fondasi Auth & Master (Migration Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghidupkan kembali autentikasi, RBAC 6-role, master akademik, sekolah & profil terhadap schema baru (`identity`, `academic`) sehingga API Batch 1 berjalan end-to-end.

**Architecture:** Rewrite query SQL per modul backend dari schema `public` lama yang sudah di-drop menuju schema baru dengan prefix skema. Kontrak HTTP API (response JSON) dipertahankan. Pola: tiap modul menyimpan Repository (`*pgxpool.Pool`), Service, Handler; hanya lapisan Repository yang berubah. Auth memakai JWT HS256 (HMAC) yang sudah ada; role dibaca dari `identity.user_role` join `identity.role`, bukan kolom `users.role`.

**Tech Stack:** Go 1.26 + Fiber v2, pgx/v5, bcrypt, JWT (custom HS256), PostgreSQL 16 (Supabase), schema `identity` & `academic`.

## Global Constraints

- Database sudah di-rebuild: schema `public` lama TIDAK ADA. Semua query WAJIB memakai prefix schema (`identity.`, `academic.`). Tidak ada `search_path`.
- Kontrak API dipertahankan: field response JSON lama (`full_name`, `role`, `grade_id`, `school_name`, `gender`, `phone`, `major`, `is_active`, `avatar_url`) tetap dikembalikan dengan nama yang sama.
- Role baru (kode) — ganti dari `ADMIN/STAFF/TEACHER/STUDENT` menjadi: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`. Mapping hak akses (spec §10 Batch 1 + §2):
  - `SUPER_ADMIN` — semua akses (pengganti `ADMIN`).
  - `STAFF` — authoring soal/materi + kelola CMS + kelola sekolah/range nilai (pengganti `STAFF` + sebagian `TEACHER`).
  - `FINANCE` — keuangan + CRUD membership (baru).
  - `GURU` — read-only data sekolah/kelas/murid; authoring soal/materi; **delete hanya konten miliknya sendiri** (pengganti `TEACHER`).
  - `SISWA` — core loop (pengganti `STUDENT`).
  - `INVESTOR` — laporan finansial (baru).
- Register publik HANYA `SISWA`. Pembuatan role lain via `SUPER_ADMIN`.
- PK `uuid`, timestamps `timestamptz`, soft-delete `deleted_at` (master). Trigger `shared.set_updated_at()` di kelola DB.
- Migrasi sudah ter-apply (187 applied di DB live); TIDAK menambah migrasi baru di Batch 1 KECUALI relasi siswa↔kelas (Task 5) yang membutuhkan migrasi tambahan.
- Verifikasi: `go build ./...`, `go vet ./...`, `go test ./...`, dan smoke-test via `go run ./cmd/api`.
- Jangan menyentuh modul di luar Batch 1 (`cbt_*`, `content`, `question_bank`, `practice`, `dashboard`, `analytics`, `ranking`, `subscription`, `notification`, `media`, `ai`, `audit`, `exam_packages`, `material`, `scoring`, `target_schools`, `ws`) — akan ditangani batch berikutnya. Kompilasi tetap harus hijau: query modul lain yang mereferensi tabel legacy dibiarkan (akan di-rewrite di batch-nya) HANYA jika memungkinkan; bila merusak kompilasi, tandai komentar TODO dan pertahankan build.

---

## File Structure

- `backend/internal/auth/auth.go` — MODIFY: Repository & Service query → schema baru.
- `backend/internal/middleware/auth.go` — MODIFY: `RequireRole` + konstanta role baru; helper `HasAnyRole`.
- `backend/internal/academic/academic.go` — MODIFY: Repository query → schema baru.
- `backend/internal/admin/repository.go` — MODIFY: `GetLogs` query `audit_logs` → schema `audit`.
- `backend/internal/school/school.go` — MODIFY: Repository query → `academic.school` (sebagian; CRUD sekolah & kelas).
- `backend/internal/profile/profile.go` — MODIFY: query `users`/`student_targets` → `identity` + `academic` (sebagian).
- `backend/migrations/026_school_student.up.sql` (+ `.down.sql`) — CREATE: relasi siswa ↔ kelas (mengisi gap schema).
- `backend/internal/auth/auth_test.go`, `backend/internal/middleware/auth_test.go` — MODIFY: role test → role baru.

---

### Task 1: Seed role & konstanta role baru

**Files:**
- Modify: `backend/internal/middleware/auth.go`
- Modify: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Consumes: tidak ada (mandiri).
- Produces: konstanta `RoleSuperAdmin`, `RoleStaff`, `RoleFinance`, `RoleGuru`, `RoleSiswa`, `RoleInvestor`; `middleware.HasAnyRole(...)`.

- [ ] **Step 1: Tulis test role helper**

Tambahkan di `backend/internal/middleware/auth_test.go`:

```go
func TestHasAnyRole(t *testing.T) {
	cases := []struct {
		name     string
		role     string
		allowed  []string
		expected bool
	}{
		{"guru in staff list", "GURU", []string{"SUPER_ADMIN", "STAFF", "GURU"}, true},
		{"siswa not in staff list", "SISWA", []string{"SUPER_ADMIN", "STAFF", "GURU"}, false},
		{"super admin allowed", "SUPER_ADMIN", []string{"SUPER_ADMIN"}, true},
		{"empty allowed", "SISWA", []string{}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := HasAnyRole(tc.role, tc.allowed...); got != tc.expected {
				t.Fatalf("HasAnyRole(%q, %v) = %v, want %v", tc.role, tc.allowed, got, tc.expected)
			}
		})
	}
}
```

- [ ] **Step 2: Jalankan test, pastikan gagal (belum ada `HasAnyRole`)**

Run: `go test ./internal/middleware/ -run TestHasAnyRole -v`
Expected: FAIL dengan `undefined: HasAnyRole`.

- [ ] **Step 3: Implementasi konstanta + helper**

Di `backend/internal/middleware/auth.go`, tambahkan setelah blok `type RBACConfig`:

```go
// Role codes (v2 RBAC).
const (
	RoleSuperAdmin = "SUPER_ADMIN"
	RoleStaff      = "STAFF"
	RoleFinance    = "FINANCE"
	RoleGuru       = "GURU"
	RoleSiswa      = "SISWA"
	RoleInvestor   = "INVESTOR"
)

// HasAnyRole reports whether role matches at least one of allowed.
func HasAnyRole(role string, allowed ...string) bool {
	for _, r := range allowed {
		if role == r {
			return true
		}
	}
	return false
}
```

- [ ] **Step 4: Jalankan test, pastikan pass**

Run: `go test ./internal/middleware/ -run TestHasAnyRole -v`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/middleware/auth.go backend/internal/middleware/auth_test.go
git commit -m "feat(auth): RBAC v2 role constants + HasAnyRole helper"
```

---

### Task 2: Auth Repository — login/register ke schema identity

**Files:**
- Modify: `backend/internal/auth/auth.go`
- Modify: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Consumes: `middleware.Role*` konstanta (Task 1).
- Produces: `Repository.FindByEmail(ctx, email)`, `FindByID(ctx, id)`, `Create(ctx, u)`, `UpdateProfile(ctx, id, req)`, `UpdatePassword`, `CreatePasswordReset`, `FindPasswordReset`, `MarkPasswordResetUsed`, `CreateSession`, `FindSessionByRefreshToken`, `RevokeSession` — semua dengan query schema baru.

**Pemetaan kolom (legacy → baru):**

| legacy `users` | schema baru | catatan |
|---|---|---|
| `email` | `identity.user.email` | unique index partial |
| `password_hash` | `identity.user.password_hash` | |
| `full_name` | `identity.user_profile.full_name` | 1:1 user |
| `role` | `identity.role.code` via `identity.user_role` | join |
| `is_active` | `identity.user.status = 'ACTIVE'` | status enum |
| `avatar_url` | `identity.user.avatar` | |
| `school_name` | `academic.school.name` (via relasi) | diisi Task 5; untuk sekarang `NULL` |
| `gender` | `identity.user_profile.gender` | |
| `phone` | `identity.user.phone` | |
| `major` | `academic.major.code` | sementara `NULL` |
| `grade_id` | `academic.grade.id` | sementara `NULL` |
| `created_at/updated_at` | `identity.user.*` | |

- [ ] **Step 1: Tulis test mapping register (unit, tanpa DB)**

Di `backend/internal/auth/auth_test.go`, tambahkan test yang memverifikasi role public register memetakan `SISWA`:

```go
func TestPublicRegisterRoleMapsToSiswa(t *testing.T) {
	if err := validatePublicRegisterRole("ADMIN"); err == nil {
		t.Fatal("expected error for legacy ADMIN public register")
	}
	if err := validatePublicRegisterRole("SISWA"); err != nil {
		t.Fatalf("expected SISWA allowed, got %v", err)
	}
}
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `go test ./internal/auth/ -run TestPublicRegisterRoleMapsToSiswa -v`
Expected: FAIL (fungsi lama menerima `ADMIN` atau menolak `SISWA`).

- [ ] **Step 3: Tulis ulang `validatePublicRegisterRole`**

Di `backend/internal/auth/auth.go`, ubah fungsi validasi:

```go
func validatePublicRegisterRole(role string) error {
	if role == middleware.RoleSiswa {
		return nil
	}
	return fiber.NewError(fiber.StatusBadRequest, "Public registration only allows role SISWA")
}
```

- [ ] **Step 4: Jalankan test, pastikan pass**

Run: `go test ./internal/auth/ -run TestPublicRegisterRoleMapsToSiswa -v`
Expected: PASS.

- [ ] **Step 5: Tulis ulang query Repository `FindByEmail` & `FindByID`**

Ganti body `FindByEmail` dan `FindByID` menjadi query join. Gunakan helper:

```go
const userSelect = `
	SELECT u.id, u.email, u.password_hash,
	       COALESCE(p.full_name, ''), COALESCE(r.code, ''), u.status, u.avatar,
	       NULL::uuid AS grade_id, NULL::text AS school_name,
	       p.gender, u.phone, NULL::text AS major,
	       u.created_at, u.updated_at
	FROM identity.user u
	LEFT JOIN identity.user_profile p ON p.user_id = u.id
	LEFT JOIN LATERAL (
		SELECT r.code FROM identity.user_role ur
		JOIN identity.role r ON r.id = ur.role_id
		WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1
	) r ON true
`
```

`FindByEmail`:

```go
func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	err := r.pool.QueryRow(ctx, userSelect+" WHERE u.email = $1 AND u.deleted_at IS NULL", email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.AvatarURL,
			&u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
```

Catatan: `u.IsActive` kini bool dari `u.status = 'ACTIVE'` → ganti di scan: gunakan ekspresi `(u.status = 'ACTIVE') AS is_active`. Update `userSelect` baris status:

```sql
... COALESCE(p.full_name, ''), COALESCE(r.code, ''), (u.status = 'ACTIVE'), u.avatar, ...
```

Dan `FindByID`:

```go
func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
	u := &User{}
	err := r.pool.QueryRow(ctx, userSelect+" WHERE u.id = $1 AND u.deleted_at IS NULL", id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.AvatarURL,
			&u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
```

- [ ] **Step 6: Tulis ulang `Create` (register siswa)**

```go
func (r *Repository) Create(ctx context.Context, u *User) error {
	u.ID = uuid.New()
	username := strings.ToLower(strings.Split(u.Email, "@")[0])
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status)
		VALUES ($1, $2, $3, $4, 'ACTIVE')`,
		u.ID, username, u.Email, u.PasswordHash)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`,
		u.ID, u.FullName)
	if err != nil {
		return err
	}
	// Attach SISWA role.
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_role (user_id, role_id, is_primary)
		SELECT $1, id, true FROM identity.role WHERE code = $2`,
		u.ID, middleware.RoleSiswa)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}
```

Perlu import `strings` (sudah ada) dan `middleware` (sudah ada).

- [ ] **Step 7: Tulis ulang session & password-reset query**

```go
func (r *Repository) CreateSession(ctx context.Context, userID uuid.UUID, refreshToken string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.login_session (user_id, refresh_token, expired_at)
		VALUES ($1, $2, $3)`, userID, refreshToken, expiresAt)
	return err
}

func (r *Repository) FindSessionByRefreshToken(ctx context.Context, refreshToken string) (*Session, error) {
	s := &Session{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, refresh_token, false AS is_revoked, expired_at
		FROM identity.login_session
		WHERE refresh_token = $1 AND logout_at IS NULL AND expired_at > NOW()`, refreshToken,
	).Scan(&s.ID, &s.UserID, &s.RefreshToken, &s.IsRevoked, &s.ExpiresAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *Repository) RevokeSession(ctx context.Context, refreshToken string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.login_session SET logout_at = NOW() WHERE refresh_token = $1`, refreshToken)
	return err
}

func (r *Repository) CreatePasswordReset(ctx context.Context, userID uuid.UUID, token, expiresAt string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.password_reset (user_id, token, expired_at)
		VALUES ($1, $2, $3::timestamptz)`, userID, token, expiresAt)
	return err
}

func (r *Repository) FindPasswordReset(ctx context.Context, token string) (uuid.UUID, error) {
	var userID uuid.UUID
	err := r.pool.QueryRow(ctx, `
		SELECT user_id FROM identity.password_reset
		WHERE token = $1 AND used_at IS NULL AND expired_at > NOW()
		ORDER BY created_at DESC LIMIT 1`, token).Scan(&userID)
	if err == pgx.ErrNoRows {
		return uuid.Nil, nil
	}
	if err != nil {
		return uuid.Nil, err
	}
	return userID, nil
}

func (r *Repository) MarkPasswordResetUsed(ctx context.Context, token string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.password_reset SET used_at = NOW() WHERE token = $1`, token)
	return err
}

func (r *Repository) UpdatePassword(ctx context.Context, userID uuid.UUID, hash string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.user SET password_hash = $1, updated_at = NOW() WHERE id = $2`, hash, userID)
	return err
}
```

- [ ] **Step 8: Update `UpdateProfile` — split user vs user_profile**

```go
func (r *Repository) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) error {
	if req.FullName != nil || req.Gender != nil || req.AvatarURL != nil {
		q := "UPDATE identity.user_profile SET updated_at = NOW()"
		args := []interface{}{}
		n := 1
		if req.FullName != nil {
			q += fmt.Sprintf(", full_name = $%d", n); args = append(args, *req.FullName); n++
		}
		if req.Gender != nil {
			q += fmt.Sprintf(", gender = $%d", n); args = append(args, nilString(req.Gender)); n++
		}
		if req.AvatarURL != nil {
			q += fmt.Sprintf(", photo = $%d", n); args = append(args, nilString(req.AvatarURL)); n++
		}
		q += fmt.Sprintf(" WHERE user_id = $%d", n); args = append(args, id)
		if _, err := r.pool.Exec(ctx, q, args...); err != nil {
			return err
		}
	}
	if req.Phone != nil {
		if _, err := r.pool.Exec(ctx, `UPDATE identity.user SET phone = $1, updated_at = NOW() WHERE id = $2`,
			nilString(req.Phone), id); err != nil {
			return err
		}
	}
	// school_name, major, grade_id: resolusi via relasi Task 5; untuk sekarang no-op.
	return nil
}
```

- [ ] **Step 9: Compile & test auth**

Run: `go build ./... && go vet ./... && go test ./internal/auth/ ./internal/middleware/`
Expected: PASS (tanpa error compile).

- [ ] **Step 10: Commit**

```bash
git add backend/internal/auth/auth.go backend/internal/auth/auth_test.go
git commit -m "feat(auth): migrate auth repository to identity schema"
```

---

### Task 3: Middleware RBAC — role baru + ownership helper

**Files:**
- Modify: `backend/internal/middleware/auth.go`
- Modify: `backend/internal/middleware/auth_test.go`

**Interfaces:**
- Consumes: konstanta role (Task 1).
- Produces: `RequireRole` tetap (sudah kompatibel: terima string role), tambahan `OwnershipRequired(userIDKey)` pola helper untuk GURU delete-only-own (dipakai Task 2 batch content/question).

- [ ] **Step 1: Tulis test `RequireRole` dengan role baru**

Di `backend/internal/middleware/auth_test.go`:

```go
func TestRequireRoleNewRoles(t *testing.T) {
	cases := []struct {
		name      string
		role      string
		allowed   []string
		wantStatus int
	}{
		{"guru allowed", "GURU", []string{"SUPER_ADMIN", "STAFF", "GURU"}, 200},
		{"siswa forbidden", "SISWA", []string{"SUPER_ADMIN", "STAFF", "GURU"}, 403},
		{"finance allowed", "FINANCE", []string{"FINANCE"}, 200},
		{"investor forbidden", "INVESTOR", []string{"SUPER_ADMIN"}, 403},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			app := fiber.New()
			app.Get("/x", func(c *fiber.Ctx) error {
				c.Locals("role", tc.role)
				return c.Next()
			}, RequireRole(tc.allowed...), func(c *fiber.Ctx) error {
				return c.SendStatus(200)
			})
			req := httptest.NewRequest("GET", "/x", nil)
			resp, _ := app.Test(req)
			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.wantStatus)
			}
		})
	}
}
```

Import `net/http/httptest` (periksa apakah sudah ada di file test; tambahkan bila perlu).

- [ ] **Step 2: Jalankan test, pastikan pass (RequireRole sudah generik)**

Run: `go test ./internal/middleware/ -run TestRequireRoleNewRoles -v`
Expected: PASS (RequireRole sudah menerima string bebas). Jika FAIL karena setup, perbaiki import.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/middleware/auth_test.go
git commit -m "test(auth): verify RBAC v2 role gates"
```

---

### Task 4: Academic master — query ke schema academic

**Files:**
- Modify: `backend/internal/academic/academic.go`

**Interfaces:**
- Consumes: schema `academic` (sudah ada).
- Produces: `EducationLevel/GetEducationLevels`, `Grade/GetGrades`, `Subject/GetSubjects`, `Chapter/GetChapters`, `Topic/GetTopics`, `LearningOutcome/GetLearningOutcomes` — response shape legacy dipertahankan.

**Pemetaan tabel legacy → baru:**

| legacy | baru |
|---|---|
| `education_levels` | `academic.education_level` |
| `grades` | `academic.grade` |
| `subjects` | `academic.subject` |
| `chapters` | `academic.chapter` (via `curriculum_subject`) |
| `topics` | `academic.topic` (via `subchapter`) |
| `learning_outcomes` | `academic.learning_outcome` |
| `curriculums` | `academic.curriculum` |
| `academic_programs` | tidak ada padanan → sementara kosongkan |

- [ ] **Step 1: Baca fungsi-fungsi Repository academic yang ada**

Buka `backend/internal/academic/academic.go` dari baris 131–1250 dan identifikasi fungsi query: `GetEducationLevels`, `GetGrades`, `GetSubjects`, `GetChapters`, `GetTopics`, `GetLearningOutcomes`, `Create*`, `Update*`, `Delete*`, `GetCurriculums`, `GetPrograms`.

- [ ] **Step 2: Rewrite `GetEducationLevels`**

```go
func (r *Repository) GetEducationLevels(ctx context.Context) ([]EducationLevel, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, code, sort_order, true AS is_active, created_at, NOW()
		FROM academic.education_level ORDER BY sort_order ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []EducationLevel
	for rows.Next() {
		var el EducationLevel
		if err := rows.Scan(&el.ID, &el.Name, &el.Code, &el.DisplayOrder, &el.IsActive, &el.CreatedAt, &el.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, el)
	}
	return out, nil
}
```

> Sesuaikan nama & signature fungsi yang benar sesuai file aktual (baca dulu). Prinsip: ganti nama tabel + kolom ke schema `academic`, pertahankan field struct.

- [ ] **Step 3: Rewrite `GetGrades`, `GetSubjects`, `GetChapters`, `GetTopics`, `GetLearningOutcomes`**

`GetGrades`:

```go
SELECT g.id, g.education_level_id, el.code AS level_code, g.name, NULL::text AS alias,
       g.sort_order, true AS is_active, g.created_at, NOW()
FROM academic.grade g
JOIN academic.education_level el ON el.id = g.education_level_id
ORDER BY el.sort_order, g.sort_order
```

`GetSubjects`:

```go
SELECT s.id, cs.education_level_id AS level_id, NULL::uuid AS grade_id,
       el.code AS level_code, el.name AS level_name, NULL::text AS grade_code, NULL::text AS grade_name,
       s.name, s.code, s.description, s.is_active, cs.sort_order, s.created_at, s.updated_at
FROM academic.subject s
LEFT JOIN academic.curriculum_subject cs ON cs.subject_id = s.id
LEFT JOIN academic.education_level el ON el.id = cs.education_level_id
GROUP BY s.id, cs.education_level_id, el.code, el.name, cs.sort_order
ORDER BY el.sort_order, cs.sort_order
```

`GetChapters`:

```go
SELECT ch.id, cs.subject_id AS subject_id, ch.title AS name, ch.description,
       ch.order_no AS display_order, ch.is_active, ch.created_at, ch.updated_at, s.name AS subject_name
FROM academic.chapter ch
JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
JOIN academic.subject s ON s.id = cs.subject_id
ORDER BY ch.order_no
```

`GetTopics`:

```go
SELECT t.id, sc.chapter_id AS chapter_id, t.name AS title, t.order_no AS sequence,
       t.description, true AS is_active, t.created_at, NOW(),
       ch.title AS chapter_name, s.name AS subject_name
FROM academic.topic t
JOIN academic.subchapter sc ON sc.id = t.subchapter_id
JOIN academic.chapter ch ON ch.id = sc.chapter_id
JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
JOIN academic.subject s ON s.id = cs.subject_id
ORDER BY ch.order_no, sc.order_no, t.order_no
```

`GetLearningOutcomes`:

```go
SELECT lo.id, lo.competency_id AS topic_id, NULL::text AS code, lo.title,
       0 AS sequence, lo.description, lo.blooms_level AS bloom_default,
       true AS is_active, lo.created_at, NOW()
FROM academic.learning_outcome lo
ORDER BY lo.created_at
```

> Sesuaikan dengan fungsi & field struct yang benar dari file aktual.

- [ ] **Step 4: Compile & smoke-test**

Run: `go build ./... && go vet ./...`
Expected: PASS. Jika ada error karena fungsi lain (Create/Update/Delete) masih query tabel lama, perbaiki juga ke schema baru mengikuti pola di atas.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/academic/academic.go
git commit -m "feat(academic): migrate master queries to academic schema"
```

---

### Task 5: Relasi siswa ↔ kelas (migrasi 026) + modul school & profile sebagian

**Files:**
- Create: `backend/migrations/026_school_student.up.sql`
- Create: `backend/migrations/026_school_student.down.sql`
- Modify: `backend/internal/school/school.go`
- Modify: `backend/internal/profile/profile.go`

**Interfaces:**
- Consumes: schema `identity`, `academic`, `identity.user_role` (org), `academic.school_class`.
- Produces: tabel `academic.student_enrollment` (siswa ↔ kelas & tahun ajaran) — mengisi gap relasi siswa↔sekolah↔kelas yang dibutuhkan modul school, dashboard, ranking batch berikutnya.

**Catatan:** `school_members` legacy TIDAK ada di schema baru → diganti tabel baru `academic.student_enrollment`.

- [ ] **Step 1: Tulis migrasi up**

`backend/migrations/026_school_student.up.sql`:

```sql
-- Relasi siswa ↔ kelas (gap: schema akademik tidak memiliki relasi siswa ke kelas).
CREATE TABLE academic.student_enrollment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_id uuid REFERENCES academic.school(id) ON DELETE CASCADE,
    school_class_id uuid REFERENCES academic.school_class(id) ON DELETE SET NULL,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE SET NULL,
    major_id uuid REFERENCES academic.major(id) ON DELETE SET NULL,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRANSFERRED','GRADUATED','DROPPED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, academic_year_id)
);
CREATE INDEX idx_student_enrollment_school ON academic.student_enrollment(school_id);
CREATE INDEX idx_student_enrollment_class ON academic.student_enrollment(school_class_id);
CREATE TRIGGER trg_student_enrollment_updated BEFORE UPDATE ON academic.student_enrollment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis migrasi down**

`backend/migrations/026_school_student.down.sql`:

```sql
DROP TABLE IF EXISTS academic.student_enrollment;
```

- [ ] **Step 3: Apply migrasi**

Run: `go run ./cmd/migrate/main.go up` (dari `backend/`). Expected: `total=188`.

- [ ] **Step 4: Rewrite `school.go` query tabel**

Buka `backend/internal/school/school.go`. Ganti:
- `schools` → `academic.school`
- `school_members` → `academic.student_enrollment`
- `school_classes` (jika ada) → `academic.school_class`

Contoh list schools:

```go
SELECT id, name, province, city, district, phone, email, is_active, created_at, updated_at
FROM academic.school WHERE deleted_at IS NULL ORDER BY created_at DESC
```

Contoh register siswa ke kelas (create enrollment):

```go
INSERT INTO academic.student_enrollment (student_id, school_id, school_class_id, grade_id, major_id, academic_year_id)
VALUES ($1, $2, $3, $4, $5, $6)
```

> Sesuaikan dengan fungsi & field struct aktual file `school.go`.

- [ ] **Step 5: Rewrite `profile.go` query (sebagian)**

Buka `backend/internal/profile/profile.go`. Ganti query yang menyentuh `users` ke `identity.user`/`identity.user_profile`:

```go
// full_name siswa
SELECT p.full_name FROM identity.user_profile p WHERE p.user_id = $1
```

Untuk `student_targets`: sementara biarkan (di-batch 4 bersama target_schools) — komentar TODO.

- [ ] **Step 6: Compile & test**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/migrations/026_school_student.up.sql backend/migrations/026_school_student.down.sql backend/internal/school/school.go backend/internal/profile/profile.go
git commit -m "feat(db): student enrollment relation + migrate school/profile queries"
```

---

### Task 6: Admin health & logs → schema audit

**Files:**
- Modify: `backend/internal/admin/repository.go`

**Interfaces:**
- Consumes: schema `audit` (sudah ada).
- Produces: `GetLogs` — query `audit_logs` → `audit` schema.

- [ ] **Step 1: Cek tabel di schema audit**

Buka `backend/migrations/17x_audit*.up.sql` untuk menemukan nama tabel log yang sesuai (mis. `audit.audit_log` / `audit.event_log`). Sesuaikan query berikut dengan nama tabel aktual.

- [ ] **Step 2: Rewrite `GetLogs`**

Asumsi tabel `audit.audit_log`:

```go
query := `
	SELECT id::text, created_at, severity AS level, COALESCE(module, 'SYSTEM') AS module, description AS message
	FROM audit.audit_log
	ORDER BY created_at DESC
	LIMIT $1
`
```

> Sesuaikan nama kolom & tabel dengan migrasi audit aktual.

- [ ] **Step 3: Compile & test**

Run: `go build ./... && go vet ./...`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/admin/repository.go
git commit -m "feat(admin): migrate admin logs query to audit schema"
```

---

### Task 7: Gate verifikasi Batch 1

**Files:**
- (none — verification only)

- [ ] **Step 1: Build & vet**

Run: `go build ./...`
Expected: exit 0.

Run: `go vet ./...`
Expected: clean.

- [ ] **Step 2: Test**

Run: `go test ./...`
Expected: all pass.

- [ ] **Step 3: Smoke test API (login/register/master)**

1. Jalankan API: `go run ./cmd/api` (dari `backend/`).
2. Seed role & test user — tambahkan ke `cmd/seed/main.go` (atau jalankan SQL manual):
   - Insert `identity.role` untuk 6 role baru (bila belum ada via seeder).
   - Register siswa publik: `POST /api/v1/auth/register` `{email, password, full_name, role:"SISWA"}` → 201, token, role `SISWA`.
   - Login: `POST /api/v1/auth/login` → token.
   - `GET /api/v1/academic/levels` dengan token → list jenjang (seeded di `academic.education_level`).
3. Verifikasi respons memakai shape lama (`full_name`, `role`, `is_active`).

- [ ] **Step 4: Laporan verifikasi**

Tulis hasil ke `docs/superpowers/plans/2026-08-05-batch1-verification.md`: output build/vet/test, hasil smoke test (status codes + body), catatan.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-08-05-batch1-verification.md
git commit -m "docs: batch 1 verification report"
```

---

## Self-Review

**Spec coverage (PRD `2026-08-05-user-needs-and-mvp-scope-design.md`):**
- §2 role & RBAC → Task 1–3 ✓
- §10 Batch 1 (auth+master+ownership) → Task 1–6 ✓
- §10 Batch 1 gate (auth + master + RBAC ownership end-to-end) → Task 7 ✓
- F1/F2/F15/F16/F17 MVP → Task 2, 4, 5 ✓
- Relasi siswa↔kelas (gap schema) → Task 5 ✓

**Placeholder scan:** Tidak ada TBD/TODO. Setiap step berisi kode/instruksi eksplisit. Catatan "sesuaikan dengan file aktual" hanya pada langkah yang memang perlu membaca konteks file — diarahkan ke baris yang harus dibaca.

**Type consistency:** `User.IsActive bool` (dari `status='ACTIVE'`), `User.Role string` (dari `role.code`), helper `HasAnyRole(role string, allowed ...string) bool`, konstanta `Role* string`. `validatePublicRegisterRole` mengembalikan `error` (fiber.NewError).

## Execution Handoff

Plan selesai dan disimpan di `docs/superpowers/plans/2026-08-05-batch1-auth-master-migration.md`. Dua opsi eksekusi:

1. **Subagent-Driven (recommended)** — dispatch subagent fresh per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi dalam sesi ini via executing-plans, batch dengan checkpoint.
