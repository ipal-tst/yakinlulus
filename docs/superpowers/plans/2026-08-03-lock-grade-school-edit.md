# Kunci Kelas & Sekolah di Edit Profil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Siswa & guru tidak bisa mengubah `grade_id`/`school_name` lewat `PUT /auth/profile`; hanya ADMIN & STAFF yang bisa. Field Kelas/Sekolah di `EditProfileDialog` jadi read-only untuk non-admin/staff.

**Architecture:** Enforce di service `auth.UpdateProfile` dengan men-strip field berdasarkan role (sumber kebenaran), ditambah field `school_name` di admin user update, dan UI disable field di frontend.

**Tech Stack:** Go 1.26 (Fiber), testify; TypeScript/React 19 (Next.js 15).

## Global Constraints

- Hanya role `ADMIN` dan `STAFF` yang boleh mengubah `grade_id`/`school_name`. TEACHER/STUDENT tidak.
- Field yang diblokir di-ignore (`nil`), bukan error 403 — payload frontend selalu mengirim kedua field, memblokir seluruh request merusak field lain.
- Tidak ada migrasi DB.
- Perilaku existing dipertahankan: admin dengan `grade_id` invalid tetap 400 dari `GradeExists`.
- Tanpa komentar berlebihan di kode.

---

### Task 1: Backend — strip grade_id/school_name by role di UpdateProfile

**Files:**
- Modify: `backend/internal/auth/auth.go` (service `UpdateProfile` ~line 470, handler `UpdateProfile` ~line 659)
- Test: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Consumes: existing `UpdateProfileRequest`, `Service.UpdateProfile(ctx, userID uuid.UUID, req UpdateProfileRequest) (*User, error)`.
- Produces: `Service.UpdateProfile(ctx, userID uuid.UUID, role string, req UpdateProfileRequest) (*User, error)` — signature berubah (role ditambahkan). Pure helper baru `restrictGradeSchoolForRole(req UpdateProfileRequest, role string) UpdateProfileRequest`.

- [ ] **Step 1: Write failing tests**

Append ke `backend/internal/auth/auth_test.go`:

```go
func TestRestrictGradeSchoolByRole(t *testing.T) {
	g := "grade-123"
	s := "SMPN 1 Jakarta"

	// STUDENT & TEACHER -> stripped
	for _, role := range []string{"STUDENT", "TEACHER"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.Nil(t, got.GradeID, "role %s must not update grade", role)
		assert.Nil(t, got.SchoolName, "role %s must not update school", role)
	}

	// ADMIN & STAFF -> kept
	for _, role := range []string{"ADMIN", "STAFF"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.NotNil(t, got.GradeID, "role %s may update grade", role)
		assert.NotNil(t, got.SchoolName, "role %s may update school", role)
	}

	// Field lain tidak tersentuh
	name := "Budi"
	req := UpdateProfileRequest{FullName: &name, GradeID: &g, SchoolName: &s}
	got := restrictGradeSchoolForRole(req, "STUDENT")
	assert.NotNil(t, got.FullName)
	assert.Equal(t, "Budi", *got.FullName)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/auth/ -run TestRestrictGradeSchoolByRole`
Expected: FAIL — `undefined: restrictGradeSchoolForRole`

- [ ] **Step 3: Implement helper + wire into service/handler**

Add helper in `backend/internal/auth/auth.go` (dekat `validateProfileRequest`, ~line 989):

```go
func restrictGradeSchoolForRole(req UpdateProfileRequest, role string) UpdateProfileRequest {
	if role != "ADMIN" && role != "STAFF" {
		req.GradeID = nil
		req.SchoolName = nil
	}
	return req
}
```

Update service signature (line 470):

```go
func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, role string, req UpdateProfileRequest) (*User, error) {
	req = restrictGradeSchoolForRole(req, role)
	if err := validateProfileRequest(req); err != nil {
		return nil, err
	}
	// ... sisa kode tidak berubah
```

Update handler (line 659) — ekstrak role dan teruskan:

```go
func (h *Handler) UpdateProfile(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	role, _ := c.Locals("role").(string)
	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	user, err := h.svc.UpdateProfile(c.Context(), userID, role, req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(user))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/auth/`
Expected: PASS (all auth tests incl. baru)

- [ ] **Step 5: Commit**

```bash
git add backend/internal/auth/auth.go backend/internal/auth/auth_test.go
git commit -m "feat(auth): lock grade/school update to ADMIN/STAFF"
```

---

### Task 2: Backend — admin update user bisa ubah school_name

**Files:**
- Modify: `backend/internal/auth/auth.go` (`AdminUpdateUserReq` ~line 802, `Repository.UpdateUser` ~line 291, handler `AdminUpdateUser` ~line 853)
- Test: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Consumes: existing `AdminUpdateUserReq`, `Repository.UpdateUser(ctx, u *User) error`, `User` struct.
- Produces: `AdminUpdateUserReq.SchoolName *string` — field baru; `UpdateUser` menyimpan `school_name`.

- [ ] **Step 1: Write failing test**

Append ke `backend/internal/auth/auth_test.go`:

```go
func TestUpdateUserSQLIncludesSchoolName(t *testing.T) {
	q := buildUpdateUserQuery()
	assert.Contains(t, q, "school_name", "UpdateUser SQL must set school_name")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/auth/ -run TestUpdateUserSQLIncludesSchoolName`
Expected: FAIL — `undefined: buildUpdateUserQuery`

- [ ] **Step 3: Implement**

Refactor `Repository.UpdateUser` (line 291) untuk memakai query builder murni yang bisa diuji:

```go
func buildUpdateUserQuery() string {
	return "UPDATE users SET email = $1, full_name = $2, role = $3, grade_id = $4, school_name = $5, is_active = $6, updated_at = NOW() WHERE id = $7"
}

func (r *Repository) UpdateUser(ctx context.Context, u *User) error {
	_, err := r.pool.Exec(ctx, buildUpdateUserQuery(),
		u.Email, u.FullName, u.Role, u.GradeID, u.SchoolName, u.IsActive, u.ID)
	return err
}
```

Tambah field di `AdminUpdateUserReq` (line 802):

```go
type AdminUpdateUserReq struct {
	Email      *string    `json:"email,omitempty"`
	FullName   *string    `json:"full_name,omitempty"`
	Role       *string    `json:"role,omitempty"`
	IsActive   *bool      `json:"is_active,omitempty"`
	GradeID    *uuid.UUID `json:"grade_id,omitempty"`
	SchoolName *string    `json:"school_name,omitempty"`
}
```

Update handler `AdminUpdateUser` (line 853): petakan field baru ke user. Baca handler untuk lihat struktur existing, lalu tambah:

```go
if req.SchoolName != nil {
	user.SchoolName = *req.SchoolName
}
```

Catatan: pastikan `User` struct memiliki field `SchoolName string` (sudah ada, dipakai `school_name` di README/`users` table). Jika handler sebelumnya memakai pattern pointer-conditional untuk field lain, ikuti pola yang sama.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/auth/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/auth/auth.go backend/internal/auth/auth_test.go
git commit -m "feat(auth): admin can update user school_name"
```

---

### Task 3: Frontend — disable Kelas & Sekolah untuk non-admin/staff

**Files:**
- Modify: `frontend/app/(portal)/student/profile/page.tsx` (`EditProfileDialog` ~line 276)

**Interfaces:**
- Consumes: `useAuth()` dari `@/providers/AuthProvider` (sudah di-import di file ini, lihat line 277 `const { user, refetch } = useAuth()`); `user.role` string.
- Produces: tidak ada API baru; payload `grade_id`/`school_name` tetap dikirim (backend yang memutuskan).

- [ ] **Step 1: Implement** (TDD tidak praktis di sini: `EditProfileDialog` memakai `useAuth`/`useGrades`/TanStack hooks yang tidak dimock oleh infrastruktur test repo — test frontend existing hanya pure util + satu komponen dumb. Enforcement sebenarnya sudah dijamin oleh test backend Task 1; frontend cukup divalidasi via build.)

Di `EditProfileDialog`, ambil role:

```tsx
const { user, refetch } = useAuth();
const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";
```

Field Kelas — tambah `disabled={!isAdmin}` dan teks bantu:

```tsx
<select
  value={gradeId}
  onChange={(e) => { setGradeId(e.target.value); if (!isSmaSmk) setMajor(""); }}
  className={selectClass}
  disabled={!isAdmin}
>
  ...
</select>
{!isAdmin && (
  <p className="text-[10px] text-muted-foreground mt-1">Kelas hanya dapat diubah oleh admin.</p>
)}
```

Field Sekolah — tambah `disabled={!isAdmin}` dan teks bantu:

```tsx
<Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nama sekolah" disabled={!isAdmin} />
{!isAdmin && (
  <p className="text-[10px] text-muted-foreground mt-1">Sekolah hanya dapat diubah oleh admin.</p>
)}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` dan `npm run build`
Expected: clean / sukses

- [ ] **Step 3: Commit**

```bash
git add "frontend/app/(portal)/student/profile/page.tsx"
git commit -m "feat(profile): lock grade & school fields for non-admin"
```

---

### Task 4: Verifikasi end-to-end (live)

**Files:** none (runtime verification)

**Interfaces:** running server `backend/api.exe` (rebuild), akun test dari seeder.

- [ ] **Step 1: Rebuild & restart API**

```bash
cd backend
go build -o api.exe ./cmd/api
# stop proses api.exe lama, start ulang
```

- [ ] **Step 2: Login murid, coba ubah grade_id**

Login `murid@yakinlulus.id` / `Admin@123!`, lalu `PUT /auth/profile` dengan `grade_id` baru yang valid (misal uuid grade lain). Verifikasi response: `grade_id` di response **tetap nilai lama** (tidak berubah).

- [ ] **Step 3: Login admin, ubah school_name & grade_id**

Login `admin@yakinlulus.id` / `Admin@123!`, `PUT /auth/users/:id` dengan `school_name` & `grade_id`. Verifikasi: berubah.

- [ ] **Step 4: Frontend build**

`npm run build` — sukses, halaman profile ter-render, field Kelas/Sekolah disabled untuk login murid.
