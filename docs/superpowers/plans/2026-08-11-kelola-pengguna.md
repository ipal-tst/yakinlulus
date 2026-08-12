# Kelola Pengguna & Role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/admin/users` (Kelola Pengguna) + `/staff/users` menjadi pusat administrasi identitas & akses sesuai `docs/admin-design/07-kelola-pengguna.md` + `kelola-pengguna.html`: CRUD user penuh (username/email/password + profil + data akademik via `student_enrollment`), RBAC (role master + permission matrix + assign role), checkbox + bulk aksi, import/export xlsx, filter detil, form 3-tab (Identitas/Akademik/Akses).

**Architecture:** Backend mem-perbaiki repo/service `internal/auth`: (1) role create diambil dari body (bukan hardcode SISWA), (2) `userSelect` diperluas (username, status, school_id, academic_year_id), (3) filter list (q/role/status/education_level), (4) delete jadi soft-delete + blokir bila ada enrollment aktif, (5) academic fields (school_id/grade_id/major_id) disimpan via upsert `academic.student_enrollment`. Menambah file baru `roles.go` (role CRUD + permission catalog + matrix via `role_permission` lazy-upsert, tanpa migration baru) dan `users_admin.go` (create/update akademik, bulk-delete/bulk-status, import/export xlsx, template). Tambah endpoint read-only kecil `GET /academic/majors` di `internal/academic` (design butuh dropdown jurusan). Frontend: `user.service.ts` diperluas, `UserFormDialog` jadi 3-tab, `UserTable` selectable, komponen baru `UsersTab` + `RolesTab` + `ImportUsersCard`, halaman `/admin/users` & `/staff/users` memakai komponen shared, `admin-nav` tambah item "Role & Permission" (SA).

**Tech Stack:** Go (Fiber, pgx, excelize/v2), Next.js 16 + React 19 + TS strict, TanStack Query, TanStack Table (DataTable selectable), shadcn tokens, zod + react-hook-form, lucide. Verifikasi: `go build/vet/test`, `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, `npm run build`.

**Spesifikasi pendukung:** `docs/admin-design/07-kelola-pengguna.md` · `kelola-pengguna.html` · `00-kerangka-template.md` · `docs/frontend/API-contract.md` · `api-kontrak-admin.md` (§5).

## Global Constraints

- FRONTEND `frontend/**` WRITE bebas. **Backend `backend/**` diubah utk tugas ini — sudah di-approve user** ("check backend, database, dan kontrak api yang ada. implementasi kelola-pengguna", lalu "lanjutkan" ×2). **DB state change** (menjalankan migration/seed/query) tetap butuh approval eksplisit per-run — plan ini TIDAK menambah migration baru; semua perubahan memakai tabel existing. **NO GIT COMMIT** sampai user izinkan.
- Bahasa Indonesia UI. `"use client"` utk hooks. Design tokens `design.md`: radius 12/16/20, primary `#2563EB`, accent orange hanya badge, skeleton loading, error banner merah + "Coba Lagi", empty state + CTA.
- Role codes konsisten dgn middleware: `SUPER_ADMIN, STAFF, FINANCE, GURU, SISWA, SUPER_SISWA, INVESTOR`. Hierarchy priority: SUPER_ADMIN > STAFF > FINANCE > GURU > INVESTOR > SUPER_SISWA > SISWA.
- Gate write user: `SUPER_ADMIN, STAFF`. Gate role CRUD + permission matrix write: `SUPER_ADMIN` saja. Delete/blokir role `is_system` atau role yg masih punya user.
- Tab Akademik form hanya tampil bila role ∈ {SISWA, SUPER_SISWA}.
- Tabel pakai **`DataTable`** (TanStack, sudah support `selectable`/`selectedRowIds`/`onSelectionChange`) + `BulkActionBar` + `ImportResultCard` (sudah ada di `components/admin/shared/`).
- Jangan tambah dependency npm/go baru (excelize/v2, @tanstack/react-table, lucide, framer-motion, zod, react-hook-form sudah ada).
- Import: pakai `internal/importxlsx` (`Parse`, `Job`, `LogError`, `CompleteJob`, `ResolveByNameOrCode`). Envelope `shared.Success`/`SuccessWithMeta`/`Error`. Parameterized query selalu; validasi server-side.
- Password: bcrypt + `validatePassword` (min 10, upper/lower/digit/special) — reuse fungsi existing di `auth.go`.
- Jenjang: enum level dari `academic.education_level` (`/academic/levels`); grade dari `/academic/grades?level_id=`; sekolah dari `/schools`; jurusan dari `GET /academic/majors` (Task 2).
- Tidak menyentuh `internal/academic/bulk_test.go` (WIP agent lain) — skip di `go test ./...`.

---

## Hasil Audit (desain ↔ DB ↔ backend ↔ frontend)

| # | Temuan | Tindakan di plan |
|---|---|---|
| 1 | `repo.Create` hardcode role `middleware.RoleSiswa` — role dari body diabaikan (bug desain §3.1) | Task 1: signature `Create(ctx, u, roleCode, academic)`; panggilan Register tetap SISWA |
| 2 | `userSelect` tidak sertakan `username`, `status`, `school_id`, `academic_year_id`; grade_id/school_name/major selalu NULL | Task 1: JOIN LATERAL ke `student_enrollment` + `academic.school`; model `User` + scan sites diperluas |
| 3 | `FindAll`/`Search` tanpa filter role/status/education_level | Task 1: `UserListFilter{q,role,status,education_level}` |
| 4 | `UpdateUser` hanya update email+profile+role; `is_active`, gender, phone, akademik tidak diproses | Task 1: extended update + upsert enrollment |
| 5 | `SoftDelete` melakukan HARD delete (`DELETE FROM identity.user`) + hapus session; tanpa blokir enrollment aktif | Task 1: soft delete `deleted_at`, blokir bila enrollment ACTIVE |
| 6 | Tidak ada role CRUD / permission matrix / `GET /auth/roles` | Task 3: `roles.go` + route (list SA,ST; write SA) |
| 7 | Tidak ada import/export/bulk-delete/bulk-status user | Task 4: `users_admin.go` + route (SA,ST) |
| 8 | Tidak ada endpoint jurusan (`/academic/majors`) padahal form akademik butuh | Task 2: tambah `ListMajors` di `internal/academic` (read-only, pola `ListGrades`) |
| 9 | Frontend `UserFormDialog` satu layar tanpa tab & tanpa field akademik via ID | Task 6: rework 3-tab |
| 10 | Frontend `UserTable` tanpa checkbox/bulk; halaman tanpa filter/stats/import/export; `admin-nav` belum ada item Role | Task 7–9 |

**Keputusan:** tanpa migration baru — tabel `identity.*` (010/012) + `academic.student_enrollment` (026) sudah mencukupi. Permission matrix dipakai lewat katalog statis di Go (persis HTML `PERMISSIONS`), di-persist ke `identity.permission_module/resource/permission/role_permission` via **lazy upsert** saat `PUT /auth/roles/:id/permissions` (tidak perlu seed massal).

---

## Struktur File

```
backend/
├── internal/auth/
│   ├── auth.go            ◄── MODIFY: model User+filter, Create/Update/SoftDelete/FindAll/Search
│   ├── roles.go           ◄── BARU: Role model, CRUD, PermissionCatalog, matrix, handler+route
│   ├── users_admin.go     ◄── BARU: admin create/update akademik, bulk, export/import/template
│   └── auth_test.go       ◄── BARU: validasi murni (role order, import row, permission catalog)
└── internal/academic/
    └── academic.go        ◄── MODIFY: tambah ListMajors + route GET /academic/majors

frontend/src/
├── types/admin.ts                          ◄── EXTEND: User + Role + RolePermission + Stat
├── services/user.service.ts                ◄── EXTEND: filters, roles CRUD, bulk, import/export
├── services/user-excel.ts                  ◄── BARU: header export + mapper (pure)
├── services/user-excel.test.ts             ◄── BARU
├── components/admin/users/
│   ├── UserFormDialog.tsx                  ◄── REWORK: 3-tab (Identitas/Akademik/Akses)
│   ├── UserTable.tsx                       ◄── REWORK: selectable + kolom username/sekolah
│   ├── UserRoleBadge.tsx                   ◄── MODIFY: variasi SUPERN_SISWA/INVESTOR
│   ├── UsersTab.tsx                        ◄── BARU: stats + filter bar + table + bulk + import/export
│   ├── RolesTab.tsx                        ◄── BARU: role list + permission matrix + dialog
│   └── ImportUsersCard.tsx                 ◄── BARU: upload + submit + ImportResultCard
├── app/(admin)/admin/users/page.tsx        ◄── REWORK: tabs (Pengguna | Role & Akses)
├── app/(staff)/staff/users/page.tsx        ◄── REWORK: reuse UsersTab (read-only roles utk staff)
└── config/admin-nav.ts                     ◄── MODIFY: item "Role & Permission" (SA) → /admin/users?tab=roles
```

---

### Task 1: Backend — Perbaiki repo `internal/auth` (role from body, select lengkap, filter, soft-delete, update akademik)

**Files:**
- Modify: `backend/internal/auth/auth.go`

**Interfaces:**
- Produces: `User` struct + field `Username, Status, SchoolID, AcademicYearID`; `UserListFilter{Page,Limit,Q,Role,Status,EducationLevel}`; `AcademicUpsert{SchoolID,GradeID,MajorID *uuid.UUID}`; signature baru `Create(ctx, u *User, roleCode string, academic *AcademicUpsert)`, `UpdateUser(ctx, u *User, academic *AcademicUpsert)`, `SoftDelete(ctx, id)` (soft), `FindAll(ctx, f UserListFilter)`, `Search(ctx, q string, f UserListFilter)`.
- Consumes: existing `middleware.RoleSiswa`, `validatePassword`, `nilString`, `userSelect` (di-extend).

- [ ] **Step 1: extend model `User` + `userSelect`**

```go
type User struct {
	ID             uuid.UUID  `json:"id"`
	Username       string     `json:"username"`
	Email          string     `json:"email"`
	PasswordHash   string     `json:"-"`
	FullName       string     `json:"full_name"`
	Role           string     `json:"role"`
	Status         string     `json:"status"`
	IsActive       bool       `json:"is_active"`
	GradeID        *uuid.UUID `json:"grade_id,omitempty"`
	SchoolID       *uuid.UUID `json:"school_id,omitempty"`
	SchoolName     *string    `json:"school_name,omitempty"`
	AcademicYearID *uuid.UUID `json:"academic_year_id,omitempty"`
	AvatarURL      *string    `json:"avatar_url,omitempty"`
	Gender         *string    `json:"gender,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	Major          *string    `json:"major,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
```

```go
const userSelect = `
	SELECT u.id, u.email, u.password_hash, u.username, u.status,
	       COALESCE(p.full_name, ''), COALESCE(r.code, ''), (u.status = 'ACTIVE'),
	       u.avatar, p.gender, u.phone,
	       se.grade_id, se.school_id, se.academic_year_id, s.name, NULL::text AS major,
	       u.created_at, u.updated_at
	FROM identity.user u
	LEFT JOIN identity.user_profile p ON p.user_id = u.id
	LEFT JOIN LATERAL (
		SELECT r.code FROM identity.user_role ur
		JOIN identity.role r ON r.id = ur.role_id
		WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1
	) r ON true
	LEFT JOIN LATERAL (
		SELECT se.grade_id, se.school_id, se.academic_year_id
		FROM academic.student_enrollment se
		WHERE se.student_id = u.id
		ORDER BY se.updated_at DESC LIMIT 1
	) se ON true
	LEFT JOIN academic.school s ON s.id = se.school_id
`
```

Urutan scan baru: `ID, Email, PasswordHash, Username, Status, FullName, Role, IsActive, AvatarURL, Gender, Phone, GradeID, SchoolID, AcademicYearID, SchoolName, Major, CreatedAt, UpdatedAt`.

- [ ] **Step 2: update semua `Scan` call site** (`FindByEmail`, `FindByID`, `FindAll`, `Search`)

```go
func (r *Repository) scanUser(row pgx.Row) (*User, error) {
	u := &User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Username, &u.Status,
		&u.FullName, &u.Role, &u.IsActive, &u.AvatarURL, &u.Gender, &u.Phone,
		&u.GradeID, &u.SchoolID, &u.AcademicYearID, &u.SchoolName, &u.Major,
		&u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
```

`FindByEmail`/`FindByID` ganti blok Scan dengan `return r.scanUser(r.pool.QueryRow(ctx, userSelect+" WHERE u.email = $1 AND u.deleted_at IS NULL", email))`. `FindAll`/`Search` ganti loop scan dengan helper di atas.

- [ ] **Step 3: ganti `Create` — role & akademik dari argumen**

```go
type AcademicUpsert struct {
	SchoolID *uuid.UUID
	GradeID  *uuid.UUID
	MajorID  *uuid.UUID
}

func (r *Repository) resolveActiveAcademicYear(ctx context.Context) *uuid.UUID {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM academic.academic_year WHERE is_active = true ORDER BY created_at DESC LIMIT 1`).Scan(&id)
	if err != nil {
		return nil
	}
	return &id
}

func (r *Repository) upsertEnrollment(ctx context.Context, tx pgx.Tx, userID uuid.UUID, academic *AcademicUpsert) error {
	if academic == nil || (academic.SchoolID == nil && academic.GradeID == nil && academic.MajorID == nil) {
		return nil
	}
	yearID := r.resolveActiveAcademicYear(ctx)
	if yearID == nil {
		return nil
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO academic.student_enrollment (student_id, school_id, grade_id, major_id, academic_year_id, status)
		VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
		ON CONFLICT (student_id, academic_year_id)
		DO UPDATE SET school_id = EXCLUDED.school_id, grade_id = EXCLUDED.grade_id,
		              major_id = EXCLUDED.major_id, updated_at = NOW()`,
		userID, academic.SchoolID, academic.GradeID, academic.MajorID, yearID)
	return err
}

func (r *Repository) Create(ctx context.Context, u *User, roleCode string, academic *AcademicUpsert) error {
	u.ID = uuid.New()
	u.Username = strings.ToLower(strings.Split(u.Email, "@")[0])
	username := u.Username
	var count int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user WHERE username = $1`, username).Scan(&count); err == nil && count > 0 {
		username = fmt.Sprintf("%s_%s", u.Username, u.ID.String()[:8])
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, phone, password_hash, status)
		VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
		u.ID, username, u.Email, nilString(u.Phone), u.PasswordHash)
	if err != nil {
		return err
	}
	profileQ := `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`
	profileArgs := []interface{}{u.ID, u.FullName}
	if u.Gender != nil {
		profileQ = `INSERT INTO identity.user_profile (user_id, full_name, gender) VALUES ($1, $2, $3)`
		profileArgs = append(profileArgs, nilString(u.Gender))
	}
	if _, err := tx.Exec(ctx, profileQ, profileArgs...); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_role (user_id, role_id, is_primary)
		SELECT $1, id, true FROM identity.role WHERE code = $2`,
		u.ID, roleCode)
	if err != nil {
		return err
	}
	if err := r.upsertEnrollment(ctx, tx, u.ID, academic); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
```

Catatan: pastikan blok role-attach sebelumnya (`INSERT ... code = $2`, `middleware.RoleSiswa`) dihapus.

- [ ] **Step 4: ganti `UpdateUser` — email, profile, role, is_active, akademik**

```go
func (r *Repository) UpdateUser(ctx context.Context, u *User, academic *AcademicUpsert) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE identity.user SET email = $1, phone = COALESCE($3, phone), updated_at = NOW() WHERE id = $2`,
		u.Email, u.ID, nilString(u.Phone)); err != nil {
		return err
	}

	profileQ := `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW()`
	profileArgs := []interface{}{u.ID, u.FullName}
	if u.Gender != nil {
		profileQ = `INSERT INTO identity.user_profile (user_id, full_name, gender) VALUES ($1, $2, $3)
			ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, gender = EXCLUDED.gender, updated_at = NOW()`
		profileArgs = append(profileArgs, nilString(u.Gender))
	}
	if _, err := tx.Exec(ctx, profileQ, profileArgs...); err != nil {
		return err
	}

	if u.Status != "" {
		if _, err := tx.Exec(ctx, `UPDATE identity.user SET status = $1, updated_at = NOW() WHERE id = $2`, u.Status, u.ID); err != nil {
			return err
		}
	}

	if u.Role != "" {
		if _, err := tx.Exec(ctx, `DELETE FROM identity.user_role WHERE user_id = $1`, u.ID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.user_role (user_id, role_id, is_primary)
			SELECT $1, id, true FROM identity.role WHERE code = $2`, u.ID, u.Role); err != nil {
			return err
		}
	}

	if err := r.upsertEnrollment(ctx, tx, u.ID, academic); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
```

`buildUpdateUserQuery` lama boleh dihapus (diganti inline di atas).

- [ ] **Step 5: ganti `SoftDelete` — soft delete + blokir enrollment aktif**

```go
func (r *Repository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	var active bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM academic.student_enrollment
		              WHERE student_id = $1 AND status = 'ACTIVE')`, id).Scan(&active)
	if err != nil {
		return err
	}
	if active {
		return fiber.NewError(fiber.StatusConflict, "User has active student enrollment")
	}
	_, err = r.pool.Exec(ctx, `
		UPDATE identity.user SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}
```

- [ ] **Step 6: ganti `FindAll` + `Search` — filter lengkap**

```go
type UserListFilter struct {
	Page            int
	Limit           int
	Q               string
	Role            string
	Status          string
	EducationLevel  string
}

func buildUserWhere(f UserListFilter) (string, []interface{}) {
	conds := []string{"u.deleted_at IS NULL"}
	args := []interface{}{}
	n := 1
	if f.Q != "" {
		conds = append(conds, "(u.email ILIKE $"+itoa(n)+" OR p.full_name ILIKE $"+itoa(n)+" OR u.username ILIKE $"+itoa(n)+")")
		args = append(args, "%"+f.Q+"%")
		n++
	}
	if f.Role != "" {
		conds = append(conds, "r.code = $"+itoa(n))
		args = append(args, f.Role)
		n++
	}
	if f.Status != "" {
		conds = append(conds, "u.status = $"+itoa(n))
		args = append(args, f.Status)
		n++
	}
	if f.EducationLevel != "" {
		conds = append(conds, "el.code = $"+itoa(n))
		args = append(args, f.EducationLevel)
		n++
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}
```

Tambah helper `func itoa(n int) string { return strconv.Itoa(n) }` dan import `strconv`. `EducationLevel` filter butuh join `academic.student_enrollment se2 ON se2.student_id = u.id` + `academic.grade g ON g.id = se2.grade_id` + `academic.education_level el ON el.id = g.education_level_id`. Karena `userSelect` sudah punya LATERAL `se`, gunakan `LEFT JOIN academic.grade g ON g.id = se.grade_id LEFT JOIN academic.education_level el ON el.id = g.education_level_id` di query **list/search** (jangan di `userSelect` global — `FindByEmail/FindByID` tak butuh).

Implementasi `FindAll`:

```go
func (r *Repository) FindAll(ctx context.Context, f UserListFilter) ([]User, int, error) {
	where, args := buildUserWhere(f)
	argsWithP := append(args, f.Limit, (f.Page-1)*f.Limit)
	whereP := where + fmt.Sprintf(" ORDER BY u.created_at DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user u
		LEFT JOIN identity.user_profile p ON p.user_id = u.id
		LEFT JOIN LATERAL (SELECT r.code FROM identity.user_role ur JOIN identity.role r ON r.id = ur.role_id WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1) r ON true
		LEFT JOIN LATERAL (SELECT se.grade_id, se.school_id FROM academic.student_enrollment se WHERE se.student_id = u.id ORDER BY se.updated_at DESC LIMIT 1) se ON true
		LEFT JOIN academic.grade g ON g.id = se.grade_id
		LEFT JOIN academic.education_level el ON el.id = g.education_level_id`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, userSelect+whereP, argsWithP...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		u, err := r.scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, *u)
	}
	return users, total, nil
}
```

`Search(ctx, q string, f UserListFilter)` jadi wrapper: set `f.Q = q` lalu panggil `FindAll`. Hapus query lama.

- [ ] **Step 7: update panggilan `Create` di `Register` (service)**

```go
	if err := s.repo.Create(ctx, user, middleware.RoleSiswa, nil); err != nil {
```

(`user.Role` tetap SISWA; roleCode argumen dipakai utk attach.)

- [ ] **Step 8: update call site `UpdateUser` di handler lama** (`AdminUpdateUser`) — sementara tetap kompatibel:

```go
	if err := h.svc.repo.UpdateUser(c.Context(), user, nil); err != nil {
```

Handler ini akan ditulis ulang di Task 4 (`users_admin.go`).

- [ ] **Step 9: verifikasi**

Run (workdir `backend`): `go build ./...` → expected: PASS. `go vet ./...` → PASS.

---

### Task 2: Backend — Endpoint `GET /academic/majors`

**Files:**
- Modify: `backend/internal/academic/academic.go`

**Interfaces:**
- Produces: `GET /academic/majors?level_id=` → array `{id, code, name, education_level_id, is_active}` (dibungkus `shared.Success`), dipakai dropdown jurusan form akademik.

- [ ] **Step 1: tambah repo method + handler**

Pola `ListGrades` (baris 1535). Tambah sebelum `ListSubjects`:

```go
func (h *Handler) ListMajors(c *fiber.Ctx) error {
	levelID := c.Query("level_id")
	q := `SELECT id, code, name, education_level_id, is_active
	      FROM academic.major WHERE is_active = true`
	args := []interface{}{}
	if levelID != "" {
		args = append(args, levelID)
		q += fmt.Sprintf(" AND education_level_id = $%d", len(args))
	}
	q += " ORDER BY name ASC"
	rows, err := h.svc.repo.pool.Query(c.Context(), q, args...)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list majors"))
	}
	defer rows.Close()
	type majorRow struct {
		ID               uuid.UUID `json:"id"`
		Code             string    `json:"code"`
		Name             string    `json:"name"`
		EducationLevelID uuid.UUID `json:"education_level_id"`
		IsActive         bool      `json:"is_active"`
	}
	var out []majorRow
	for rows.Next() {
		var m majorRow
		if err := rows.Scan(&m.ID, &m.Code, &m.Name, &m.EducationLevelID, &m.IsActive); err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list majors"))
		}
		out = append(out, m)
	}
	return c.JSON(shared.Success(out))
}
```

- [ ] **Step 2: register route**

Dalam `RegisterRoutes` (baris ~1381-1394), setelah `r.Get("/grades", ...)`:

```go
	r.Get("/majors", middleware.RequireAuth(h.jwt), h.ListMajors)
```

- [ ] **Step 3: verifikasi**

Run: `go build ./...` → PASS.

---

### Task 3: Backend — Role CRUD + Permission Matrix (`roles.go`)

**Files:**
- Create: `backend/internal/auth/roles.go`

**Interfaces:**
- Produces: model `Role`, `PermissionItem`; repo methods `ListRoles`, `CreateRole`, `UpdateRole`, `DeleteRole`, `GetRolePermissions`, `UpsertRolePermissions`; handler + route:
  - `GET /auth/roles` (SA,ST) — list role + user_count
  - `POST /auth/roles` (SA)
  - `PUT /auth/roles/:id` (SA)
  - `DELETE /auth/roles/:id` (SA)
  - `GET /auth/roles/:id/permissions` (SA,ST)
  - `PUT /auth/roles/:id/permissions` (SA)
- Consumes: `*Repository`, `middleware.RequireRole`, `shared`, `uuid`, `pgx`.

- [ ] **Step 1: definisi model + katalog permission (salinan HTML `PERMISSIONS`)**

```go
type Role struct {
	ID          uuid.UUID  `json:"id"`
	Code        string     `json:"code"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Priority    int        `json:"priority"`
	IsSystem    bool       `json:"is_system"`
	UserCount   int        `json:"user_count"`
	CreatedAt   time.Time  `json:"created_at"`
}

type PermissionItem struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Desc   string `json:"desc"`
	Allow  bool   `json:"allow"`
}

var PermissionCatalog = []PermissionItem{
	{ID: "academic.read", Label: "Academic — baca", Desc: "Lihat master akademik, sekolah, target"},
	{ID: "academic.write", Label: "Academic — tulis", Desc: "Ubah jenjang/kelas/mapel/kurikulum"},
	{ID: "content.read", Label: "Konten — baca", Desc: "Lihat materi, bank soal, ujian"},
	{ID: "content.write", Label: "Konten — tulis", Desc: "Authoring materi, soal, ujian"},
	{ID: "financial.read", Label: "Keuangan — baca", Desc: "Lihat laporan & transaksi"},
	{ID: "financial.write", Label: "Keuangan — tulis", Desc: "Kelola membership & pembayaran"},
	{ID: "users.read", Label: "Pengguna — baca", Desc: "Lihat daftar pengguna"},
	{ID: "users.write", Label: "Pengguna — tulis", Desc: "Kelola user & assign role"},
	{ID: "analytics.view", Label: "Analitik — lihat", Desc: "Akses laporan hasil belajar"},
}

var defaultRolePerms = map[string]map[string]bool{
	"SUPER_ADMIN": {"academic.read": true, "academic.write": true, "content.read": true, "content.write": true, "financial.read": true, "financial.write": true, "users.read": true, "users.write": true, "analytics.view": true},
	"STAFF":       {"academic.read": true, "academic.write": true, "content.read": true, "content.write": true, "users.read": true, "users.write": true, "analytics.view": true},
	"FINANCE":     {"financial.read": true, "financial.write": true, "analytics.view": true},
	"GURU":        {"academic.read": true, "content.read": true, "content.write": true},
	"INVESTOR":    {"financial.read": true, "analytics.view": true},
	"SUPER_SISWA": {"academic.read": true, "content.read": true, "analytics.view": true},
	"SISWA":       {"academic.read": true, "content.read": true},
}
```

- [ ] **Step 2: repo methods**

```go
func (r *Repository) ListRoles(ctx context.Context) ([]Role, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.code, r.name, r.description, r.priority, r.is_system, r.created_at,
		       (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id) AS user_count
		FROM identity.role r
		WHERE r.deleted_at IS NULL
		ORDER BY r.priority ASC, r.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Role
	for rows.Next() {
		var rl Role
		if err := rows.Scan(&rl.ID, &rl.Code, &rl.Name, &rl.Description, &rl.Priority, &rl.IsSystem, &rl.CreatedAt, &rl.UserCount); err != nil {
			return nil, err
		}
		out = append(out, rl)
	}
	return out, nil
}

func (r *Repository) CreateRole(ctx context.Context, code, name string, description *string, priority int) (*Role, error) {
	id := uuid.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.role (id, code, name, description, priority, is_system)
		VALUES ($1, $2, $3, $4, $5, false)`,
		id, code, name, description, priority)
	if err != nil {
		return nil, err
	}
	return &Role{ID: id, Code: code, Name: name, Description: description, Priority: priority, IsSystem: false, CreatedAt: time.Now()}, nil
}

func (r *Repository) UpdateRole(ctx context.Context, id uuid.UUID, name *string, description *string, priority *int) (*Role, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE identity.role SET
			name = COALESCE($2, name),
			description = CASE WHEN $3::text IS NULL THEN description ELSE $3 END,
			priority = COALESCE($4, priority),
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, id, name, description, priority)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	var rl Role
	err = r.pool.QueryRow(ctx, `
		SELECT id, code, name, description, priority, is_system, created_at,
		       (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id)
		FROM identity.role r WHERE r.id = $1 AND r.deleted_at IS NULL`, id).
		Scan(&rl.ID, &rl.Code, &rl.Name, &rl.Description, &rl.Priority, &rl.IsSystem, &rl.CreatedAt, &rl.UserCount)
	if err != nil {
		return nil, err
	}
	return &rl, nil
}

func (r *Repository) DeleteRole(ctx context.Context, id uuid.UUID) error {
	var isSystem bool
	var userCount int
	err := r.pool.QueryRow(ctx, `SELECT is_system, (SELECT COUNT(*) FROM identity.user_role ur WHERE ur.role_id = r.id) FROM identity.role r WHERE r.id = $1 AND r.deleted_at IS NULL`, id).
		Scan(&isSystem, &userCount)
	if err == pgx.ErrNoRows {
		return fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	if err != nil {
		return err
	}
	if isSystem {
		return fiber.NewError(fiber.StatusForbidden, "Cannot delete system role")
	}
	if userCount > 0 {
		return fiber.NewError(fiber.StatusConflict, "Role is assigned to users")
	}
	_, err = r.pool.Exec(ctx, `UPDATE identity.role SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}
```

- [ ] **Step 3: permission matrix repo (lazy upsert catalog)**

```go
func (r *Repository) GetRolePermissions(ctx context.Context, roleID uuid.UUID) ([]PermissionItem, error) {
	var roleCode string
	err := r.pool.QueryRow(ctx, `SELECT code FROM identity.role WHERE id = $1 AND deleted_at IS NULL`, roleID).Scan(&roleCode)
	if err == pgx.ErrNoRows {
		return nil, fiber.NewError(fiber.StatusNotFound, "Role not found")
	}
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT p.code, rp.allow
		FROM identity.role_permission rp
		JOIN identity.permission p ON p.id = rp.permission_id
		WHERE rp.role_id = $1`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	overrides := map[string]bool{}
	for rows.Next() {
		var code string
		var allow bool
		if err := rows.Scan(&code, &allow); err != nil {
			return nil, err
		}
		overrides[code] = allow
	}
	defaults := defaultRolePerms[roleCode]
	out := make([]PermissionItem, 0, len(PermissionCatalog))
	for _, p := range PermissionCatalog {
		allow, ok := overrides[p.ID]
		if !ok {
			allow = defaults[p.ID]
		}
		out = append(out, PermissionItem{ID: p.ID, Label: p.Label, Desc: p.Desc, Allow: allow})
	}
	return out, nil
}

func (r *Repository) UpsertRolePermissions(ctx context.Context, roleID uuid.UUID, perms []PermissionItem) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var roleCode string
	if err := tx.QueryRow(ctx, `SELECT code FROM identity.role WHERE id = $1 AND deleted_at IS NULL`, roleID).Scan(&roleCode); err == pgx.ErrNoRows {
		return fiber.NewError(fiber.StatusNotFound, "Role not found")
	} else if err != nil {
		return err
	}
	if roleCode == "SUPER_ADMIN" {
		return fiber.NewError(fiber.StatusForbidden, "SUPER_ADMIN permissions cannot be changed")
	}

	for _, p := range perms {
		// upsert module → resource → permission (lazy seed)
		if _, err := tx.Exec(ctx, `INSERT INTO identity.permission_module (code, name) VALUES ($1, $1) ON CONFLICT (code) DO NOTHING`, moduleOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.permission_resource (module_id, code, name)
			SELECT id, $1, $1 FROM identity.permission_module WHERE code = $2
			ON CONFLICT (code) DO NOTHING`, resourceOf(p.ID), moduleOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.permission (resource_id, code, name)
			SELECT pr.id, $1, $2 FROM identity.permission_resource pr WHERE pr.code = $3
			ON CONFLICT (code) DO NOTHING`, p.ID, p.Label, resourceOf(p.ID)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.role_permission (role_id, permission_id, allow)
			SELECT $1, id, $2 FROM identity.permission WHERE code = $3
			ON CONFLICT (role_id, permission_id) DO UPDATE SET allow = EXCLUDED.allow`, roleID, p.Allow, p.ID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func moduleOf(code string) string {
	parts := strings.Split(code, ".")
	if len(parts) == 0 {
		return code
	}
	return parts[0]
}

func resourceOf(code string) string {
	return moduleOf(code)
}
```

- [ ] **Step 4: handler + routes**

```go
func (h *Handler) ListRoles(c *fiber.Ctx) error {
	roles, err := h.svc.repo.ListRoles(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list roles"))
	}
	return c.JSON(shared.Success(roles))
}

func (h *Handler) CreateRole(c *fiber.Ctx) error {
	var req struct {
		Code        string  `json:"code"`
		Name        string  `json:"name"`
		Description *string `json:"description"`
		Priority    int     `json:"priority"`
	}
	if err := c.BodyParser(&req); err != nil || strings.TrimSpace(req.Code) == "" || strings.TrimSpace(req.Name) == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "code and name required"))
	}
	if !isValidRoleCode(req.Code) {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "role code must be uppercase letters, digits, and underscore"))
	}
	role, err := h.svc.repo.CreateRole(c.Context(), strings.ToUpper(req.Code), req.Name, req.Description, req.Priority)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create role"))
	}
	return c.Status(201).JSON(shared.Success(role))
}

func (h *Handler) UpdateRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	var req struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Priority    *int    `json:"priority"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	role, err := h.svc.repo.UpdateRole(c.Context(), id, req.Name, req.Description, req.Priority)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update role"))
	}
	return c.JSON(shared.Success(role))
}

func (h *Handler) DeleteRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	if err := h.svc.repo.DeleteRole(c.Context(), id); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete role"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Role deleted"}))
}

func (h *Handler) GetRolePermissions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	perms, err := h.svc.repo.GetRolePermissions(c.Context(), id)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get role permissions"))
	}
	return c.JSON(shared.Success(perms))
}

func (h *Handler) UpdateRolePermissions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid role ID"))
	}
	var req struct {
		Permissions []PermissionItem `json:"permissions"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.Permissions) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "permissions required"))
	}
	if err := h.svc.repo.UpsertRolePermissions(c.Context(), id, req.Permissions); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update role permissions"))
	}
	perms, _ := h.svc.repo.GetRolePermissions(c.Context(), id)
	return c.JSON(shared.Success(perms))
}

func isValidRoleCode(code string) bool {
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') {
			return false
		}
	}
	return true
}
```

- [ ] **Step 5: register route** — di `RegisterRoutes` dalam blok `admin` (baris 606-613), tambahkan:

```go
	admin.Get("/roles", h.ListRoles)
	admin.Get("/roles/:id/permissions", h.GetRolePermissions)
	admin.Put("/roles/:id/permissions", h.UpdateRolePermissions)
```

Blok role write (SA saja) baru:

```go
	saOnly := r.Group("", middleware.RequireAuth(h.jwt), middleware.RequireRole("SUPER_ADMIN"))
	saOnly.Post("/roles", h.CreateRole)
	saOnly.Put("/roles/:id", h.UpdateRole)
	saOnly.Delete("/roles/:id", h.DeleteRole)
```

**PENTING:** route `POST /roles` harus didaftarkan di grup `saOnly` (baru), karena grup `admin` sudah ada `Post("/users", ...)` — tidak bentrok karena path berbeda. Pastikan tidak ada route `/roles` lain.

- [ ] **Step 6: verifikasi**

Run: `go build ./...` → PASS.

---

### Task 4: Backend — Admin user CRUD akademik + bulk + import/export (`users_admin.go`)

**Files:**
- Create: `backend/internal/auth/users_admin.go`

**Interfaces:**
- Produces: handler `AdminCreateUser`/`AdminUpdateUser` (akademik via ID), `BulkDeleteUsers`, `BulkStatusUsers`, `ExportUsersXlsx`, `ImportUsersXlsx`, `UsersImportTemplate`, + route:
  - `POST /auth/users/bulk-delete` (SA,ST)
  - `POST /auth/users/bulk-status` (SA,ST)
  - `POST /auth/users/export/xlsx` (SA,ST)
  - `POST /auth/users/import/xlsx` (SA,ST)
  - `GET /auth/users/import/template` (SA,ST)
- Consumes: `Repository.Create/UpdateUser/SoftDelete/FindAll/SetActive`, `importxlsx`, `excelize/v2`, `bcrypt`, `shared`, `uuid`.

- [ ] **Step 1: hapus handler lama dari `auth.go`** (`AdminCreateUserReq`, `AdminUpdateUserReq`, `AdminGetUser`, `AdminCreateUser`, `AdminUpdateUser`, `AdminDeleteUser`) — dipindah & diperluas di file ini.

- [ ] **Step 2: create + update handler akademik**

```go
type AdminCreateUserReq struct {
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Password string    `json:"password"`
	FullName string    `json:"full_name"`
	Role     string    `json:"role"`
	Gender   *string   `json:"gender"`
	Phone    *string   `json:"phone"`
	SchoolID *uuid.UUID `json:"school_id"`
	GradeID  *uuid.UUID `json:"grade_id"`
	MajorID  *uuid.UUID `json:"major_id"`
	Status   string    `json:"status"`
}

type AdminUpdateUserReq struct {
	Email    *string    `json:"email,omitempty"`
	FullName *string    `json:"full_name,omitempty"`
	Role     *string    `json:"role,omitempty"`
	Status   *string    `json:"status,omitempty"`
	Gender   *string    `json:"gender,omitempty"`
	Phone    *string    `json:"phone,omitempty"`
	SchoolID *uuid.UUID `json:"school_id"`
	GradeID  *uuid.UUID `json:"grade_id"`
	MajorID  *uuid.UUID `json:"major_id"`
}

func (h *Handler) AdminCreateUser(c *fiber.Ctx) error {
	var req AdminCreateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email == "" || req.Password == "" || req.FullName == "" || req.Role == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "email, password, full_name, role required"))
	}
	if err := validatePassword(req.Password); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	if req.Role == middleware.RoleSuperAdmin {
		actorRole, _ := c.Locals("role").(string)
		if actorRole != middleware.RoleSuperAdmin {
			return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Only SUPER_ADMIN can assign SUPER_ADMIN role"))
		}
	}
	existing, _ := h.svc.repo.FindByEmail(c.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if existing != nil {
		return c.Status(409).JSON(shared.Error(shared.ErrConflict, "Email already registered"))
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to hash password"))
	}
	status := req.Status
	if status == "" {
		status = "ACTIVE"
	}
	user := &User{
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		Status:       status,
		IsActive:     status == "ACTIVE",
		Gender:       req.Gender,
		Phone:        req.Phone,
	}
	academic := &AcademicUpsert{SchoolID: req.SchoolID, GradeID: req.GradeID, MajorID: req.MajorID}
	if err := h.svc.repo.Create(c.Context(), user, req.Role, academic); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create user"))
	}
	created, _ := h.svc.repo.FindByID(c.Context(), user.ID)
	return c.Status(201).JSON(shared.Success(created))
}

func (h *Handler) AdminGetUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) AdminUpdateUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	var req AdminUpdateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Role != nil {
		if *req.Role == middleware.RoleSuperAdmin && user.Role != middleware.RoleSuperAdmin {
			actorRole, _ := c.Locals("role").(string)
			if actorRole != middleware.RoleSuperAdmin {
				return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Only SUPER_ADMIN can assign SUPER_ADMIN role"))
			}
		}
		user.Role = *req.Role
	}
	if req.Status != nil {
		user.Status = *req.Status
		user.IsActive = *req.Status == "ACTIVE"
	}
	if req.Gender != nil {
		user.Gender = req.Gender
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}
	academic := &AcademicUpsert{SchoolID: req.SchoolID, GradeID: req.GradeID, MajorID: req.MajorID}
	if err := h.svc.repo.UpdateUser(c.Context(), user, academic); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update user"))
	}
	updated, _ := h.svc.repo.FindByID(c.Context(), id)
	return c.JSON(shared.Success(updated))
}
```

- [ ] **Step 3: bulk-delete + bulk-status handler**

```go
func (h *Handler) BulkDeleteUsers(c *fiber.Ctx) error {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	type bulkResult struct {
		Processed int      `json:"processed"`
		Deleted   int      `json:"deleted"`
		Failed    int      `json:"failed"`
		Errors    []string `json:"errors,omitempty"`
	}
	res := &bulkResult{Processed: len(req.IDs)}
	for _, id := range req.IDs {
		if err := h.svc.repo.SoftDelete(c.Context(), id); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		res.Deleted++
	}
	return c.JSON(shared.Success(res))
}

func (h *Handler) BulkStatusUsers(c *fiber.Ctx) error {
	var req struct {
		IDs      []uuid.UUID `json:"ids"`
		IsActive bool        `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	type bulkResult struct {
		Processed int      `json:"processed"`
		Updated   int      `json:"updated"`
		Failed    int      `json:"failed"`
		Errors    []string `json:"errors,omitempty"`
	}
	res := &bulkResult{Processed: len(req.IDs)}
	for _, id := range req.IDs {
		if err := h.svc.repo.SetActive(c.Context(), id, req.IsActive); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		res.Updated++
	}
	return c.JSON(shared.Success(res))
}
```

- [ ] **Step 4: export + template xlsx**

```go
var userExportHeader = []string{"USERNAME", "EMAIL", "FULL_NAME", "ROLE", "STATUS", "GENDER", "PHONE", "SCHOOL"}

func usersTemplateWorkbook() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()
	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")
	for i, h := range userExportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}
	example := []interface{}{"ahmad", "ahmad@yakinlulus.id", "Ahmad Rizki", "SISWA", "ACTIVE", "L", "08123456789", "SMA Negeri 1 Jakarta"}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, v)
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (h *Handler) UsersImportTemplate(c *fiber.Ctx) error {
	b, err := usersTemplateWorkbook()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to build template"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", `attachment; filename="template_import_pengguna.xlsx"`)
	return c.Send(b)
}

func (h *Handler) ExportUsersXlsx(c *fiber.Ctx) error {
	f := UserListFilter{Page: 1, Limit: 10000, Q: c.Query("q", ""), Role: c.Query("role", ""), Status: c.Query("status", ""), EducationLevel: c.Query("education_level", "")}
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if c.Method() == "POST" {
		_ = c.BodyParser(&req)
	}
	var users []User
	if len(req.IDs) > 0 {
		for _, id := range req.IDs {
			u, err := h.svc.repo.FindByID(c.Context(), id)
			if err != nil || u == nil {
				continue
			}
			users = append(users, *u)
		}
	} else {
		all, _, err := h.svc.repo.FindAll(c.Context(), f)
		if err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
		}
		users = all
	}
	file := excelize.NewFile()
	defer file.Close()
	sheetName := "Users"
	index, err := file.NewSheet(sheetName)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
	}
	file.SetActiveSheet(index)
	file.DeleteSheet("Sheet1")
	for i, h := range userExportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		file.SetCellValue(sheetName, cell, h)
	}
	rowIdx := 2
	for _, u := range users {
		vals := []interface{}{u.Username, u.Email, u.FullName, u.Role, u.Status, derefOrEmpty(u.Gender), derefOrEmpty(u.Phone), derefOrEmpty(u.SchoolName)}
		for i, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIdx)
			file.SetCellValue(sheetName, cell, v)
		}
		rowIdx++
	}
	buf, err := file.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export users"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="pengguna-%s.xlsx"`, time.Now().Format("2006-01-02")))
	return c.Send(buf.Bytes())
}

func derefOrEmpty(p *string) interface{} {
	if p == nil {
		return ""
	}
	return *p
}
```

- [ ] **Step 5: import xlsx handler**

```go
type userImportResult struct {
	JobID        int      `json:"job_id"`
	TotalRows    int      `json:"total_rows"`
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	Errors       []string `json:"errors,omitempty"`
}

func (h *Handler) ImportUsersXlsx(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "file required"))
	}
	f, err := fileHeader.Open()
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "cannot open file"))
	}
	defer f.Close()

	rows, err := importxlsx.Parse(f, "Users")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	jobID, err := importxlsx.Job(c.Context(), h.svc.repo.pool, "IDENTITY", "import-users", fileHeader.Filename)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create import job"))
	}
	res := &userImportResult{JobID: jobID, TotalRows: len(rows)}

	validRoles := map[string]bool{middleware.RoleSuperAdmin: true, middleware.RoleStaff: true, middleware.RoleFinance: true, middleware.RoleGuru: true, middleware.RoleSiswa: true, middleware.RoleSuperSiswa: true, middleware.RoleInvestor: true}

	for _, row := range rows {
		email := row.Cells["EMAIL"]
		password := row.Cells["PASSWORD"]
		fullName := row.Cells["FULL_NAME"]
		role := row.Cells["ROLE"]
		schoolName := row.Cells["SCHOOL"]

		if email == "" || password == "" || fullName == "" || role == "" {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "EMAIL, PASSWORD, FULL_NAME, ROLE required")
			res.FailedCount++
			continue
		}
		if !strings.Contains(email, "@") {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "invalid email")
			res.FailedCount++
			continue
		}
		if !validRoles[role] {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid role: %s", role))
			res.FailedCount++
			continue
		}
		if err := validatePassword(password); err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, err.Error())
			res.FailedCount++
			continue
		}
		existing, _ := h.svc.repo.FindByEmail(c.Context(), strings.ToLower(strings.TrimSpace(email)))
		if existing != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "duplicate email")
			res.FailedCount++
			continue
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, "hash failed")
			res.FailedCount++
			continue
		}
		var schoolID *uuid.UUID
		if schoolName != "" {
			sid, ok, err := importxlsx.ResolveByNameOrCode(c.Context(), h.svc.repo.pool, "academic.school", "", schoolName)
			if err != nil {
				importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("resolve school: %v", err))
				res.FailedCount++
				continue
			}
			if !ok {
				importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("school not found: %s", schoolName))
				res.FailedCount++
				continue
			}
			schoolID = &sid
		}
		user := &User{
			Email:        strings.ToLower(strings.TrimSpace(email)),
			PasswordHash: string(hash),
			FullName:     fullName,
			Role:         role,
			Status:       "ACTIVE",
			IsActive:     true,
		}
		if err := h.svc.repo.Create(c.Context(), user, role, &AcademicUpsert{SchoolID: schoolID}); err != nil {
			importxlsx.LogError(c.Context(), h.svc.repo.pool, jobID, row.RowNum, fmt.Sprintf("create failed: %v", err))
			res.FailedCount++
			continue
		}
		res.SuccessCount++
	}
	importxlsx.CompleteJob(c.Context(), h.svc.repo.pool, jobID, res.FailedCount > 0)
	return c.JSON(shared.Success(res))
}
```

- [ ] **Step 6: register route** — dalam blok `admin` `RegisterRoutes`, tambahkan:

```go
	admin.Post("/users/bulk-delete", h.BulkDeleteUsers)
	admin.Post("/users/bulk-status", h.BulkStatusUsers)
	admin.Post("/users/export/xlsx", h.ExportUsersXlsx)
	admin.Post("/users/import/xlsx", h.ImportUsersXlsx)
	admin.Get("/users/import/template", h.UsersImportTemplate)
```

**PENTING:** route `GET /users/import/template`, `POST /users/import/xlsx`, `POST /users/export/xlsx`, `POST /users/bulk-delete`, `POST /users/bulk-status` harus didaftarkan **sebelum** `GET /users/:id` dan `POST /users/:id/...` agar tidak tertelan param `:id`. Order di blok admin: list → search → import/template → import/xlsx → export/xlsx → bulk-delete → bulk-status → `/users/:id` (GET) → POST `/users` → PUT `/users/:id` → PATCH `/users/:id/activate` → DELETE `/users/:id`.

- [ ] **Step 7: verifikasi**

Run: `go build ./...` → PASS. `go vet ./...` → PASS.

---

### Task 5: Backend — Test validasi murni (`auth_test.go`)

**Files:**
- Create: `backend/internal/auth/auth_test.go`

**Interfaces:**
- Produces: unit test (tanpa DB) utk `isValidRoleCode`, urutan `PermissionCatalog` vs `defaultRolePerms`, `moduleOf`, `UserListFilter` build SQL placeholder indexing.

- [ ] **Step 1: tulis test**

```go
package auth

import (
	"strings"
	"testing"
)

func TestIsValidRoleCode(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"SUPER_ADMIN", true},
		{"STAFF_1", true},
		{"staff", false},
		{"A B", false},
		{"", false},
	}
	for _, c := range cases {
		if got := isValidRoleCode(c.in); got != c.want {
			t.Errorf("isValidRoleCode(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestPermissionCatalogDefaultsCoverage(t *testing.T) {
	ids := map[string]bool{}
	for _, p := range PermissionCatalog {
		ids[p.ID] = true
	}
	for role, perms := range defaultRolePerms {
		for id := range perms {
			if !ids[id] {
				t.Errorf("role %s references unknown permission %s", role, id)
			}
		}
	}
	for _, p := range PermissionCatalog {
		if strings.Count(p.ID, ".") != 1 {
			t.Errorf("permission %s should be module.code", p.ID)
		}
	}
}

func TestModuleOf(t *testing.T) {
	if moduleOf("academic.read") != "academic" {
		t.Error("moduleOf mismatch")
	}
	if resourceOf("academic.read") != "academic" {
		t.Error("resourceOf mismatch")
	}
}

func TestBuildUserWherePlaceholders(t *testing.T) {
	f := UserListFilter{Q: "x", Role: "SISWA", Status: "ACTIVE", EducationLevel: "SMA"}
	where, args := buildUserWhere(f)
	if len(args) != 4 {
		t.Fatalf("expected 4 args, got %d", len(args))
	}
	if !strings.Contains(where, "$1") || !strings.Contains(where, "$4") {
		t.Errorf("placeholder indexing broken: %s", where)
	}
	if strings.Contains(where, "$5") {
		t.Errorf("placeholder overflow: %s", where)
	}
}
```

- [ ] **Step 2: jalankan**

Run: `go test ./internal/auth/ -v` → expected: PASS (3 tests).

---

### Task 6: Frontend — Types + service extension

**Files:**
- Modify: `frontend/src/types/admin.ts`
- Modify: `frontend/src/services/user.service.ts`
- Create: `frontend/src/services/user-excel.ts`
- Create: `frontend/src/services/user-excel.test.ts`

**Interfaces:**
- Produces: `User` + `Status`, `SchoolID`, `AcademicYearID`; `Role`, `RolePermission`, `UserStat`, `UserBulkResult`; `userService.{listUsers(params), createUser, updateUser, deleteUser, toggleActivate, bulkDelete, bulkStatus, exportXlsx, downloadTemplate, importUsers, listRoles, createRole, updateRole, deleteRole, getRolePermissions, updateRolePermissions}`; `userExcel.{userExportHeaders, userRowToCells, userImportRowToPayload}`.
- Consumes: `api` (lib/api.ts), `downloadBlob`, `exportFilename` dari `school-excel.ts`.

- [ ] **Step 1: extend `types/admin.ts`**

```ts
export interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    status: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
    is_active: boolean;
    school_id?: string;
    school_name?: string;
    grade_id?: string;
    academic_year_id?: string;
    avatar_url?: string;
    gender?: string;
    phone?: string;
    major?: string;
    education_level?: EducationLevel;
    grade?: string;
    membership_status?: MembershipStatus;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    code: string;
    name: string;
    description?: string;
    priority: number;
    is_system: boolean;
    user_count: number;
    created_at: string;
}

export interface RolePermission {
    id: string;
    label: string;
    desc: string;
    allow: boolean;
}

export interface UserStat {
    total: number;
    active: number;
    inactive: number;
    siswa: number;
    guru: number;
}

export interface UserBulkResult {
    processed: number;
    deleted?: number;
    updated?: number;
    failed: number;
    errors?: string[];
}
```

- [ ] **Step 2: extend `user.service.ts`**

```ts
import { api } from "@/lib/api";
import { downloadBlob, exportFilename } from "./school-excel";
import { User, UserRole, Role, RolePermission, UserBulkResult, PaginatedData } from "@/types/admin";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export interface UserListParams {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
    education_level?: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    gender?: string;
    phone?: string;
    school_id?: string;
    grade_id?: string;
    major_id?: string;
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
}

export interface UpdateUserPayload {
    email?: string;
    full_name?: string;
    role?: UserRole;
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
    gender?: string;
    phone?: string;
    school_id?: string;
    grade_id?: string;
    major_id?: string;
    password?: string;
}

function authHeaders(): Record<string, string> {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("yl_token");
        if (token) return { Authorization: `Bearer ${token}` };
    }
    return {};
}

export const userService = {
    async listUsers(params?: UserListParams): Promise<PaginatedData<User> | User[]> {
        return api<PaginatedData<User> | User[]>("/auth/users", { params });
    },

    async createUser(payload: CreateUserPayload): Promise<User> {
        return api<User>("/auth/users", { method: "POST", body: payload });
    },

    async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
        return api<User>(`/auth/users/${id}`, { method: "PUT", body: payload });
    },

    async toggleActivate(id: string, active: boolean): Promise<User> {
        return api<User>(`/auth/users/${id}/activate`, { method: "PATCH", body: { active } });
    },

    async deleteUser(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/users/${id}`, { method: "DELETE" });
    },

    async bulkDelete(ids: string[]): Promise<UserBulkResult> {
        return api<UserBulkResult>("/auth/users/bulk-delete", { method: "POST", body: { ids } });
    },

    async bulkStatus(ids: string[], isActive: boolean): Promise<UserBulkResult> {
        return api<UserBulkResult>("/auth/users/bulk-status", { method: "POST", body: { ids, is_active: isActive } });
    },

    async exportXlsx(ids?: string[]): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/auth/users/export/xlsx?dl=${bust}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ ids: ids ?? [] }),
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            throw new Error(`Export failed: ${res.status}`);
        }
        const blob = await res.blob();
        downloadBlob(blob, exportFilename("pengguna"));
    },

    async downloadTemplate(): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/auth/users/import/template?dl=${bust}`;
        const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            throw new Error(`Template download failed: ${res.status}`);
        }
        const blob = await res.blob();
        downloadBlob(blob, "template_import_pengguna.xlsx");
    },

    async importUsers(file: File): Promise<{ job_id: number; total_rows: number; success_count: number; failed_count: number; errors?: string[] }> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/auth/users/import/xlsx`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Import failed: ${res.status}`);
        }
        return res.json().then((j) => j.data);
    },

    async listRoles(): Promise<Role[]> {
        return api<Role[]>("/auth/roles");
    },

    async createRole(payload: { code: string; name: string; description?: string; priority: number }): Promise<Role> {
        return api<Role>("/auth/roles", { method: "POST", body: payload });
    },

    async updateRole(id: string, payload: { name?: string; description?: string; priority?: number }): Promise<Role> {
        return api<Role>(`/auth/roles/${id}`, { method: "PUT", body: payload });
    },

    async deleteRole(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/roles/${id}`, { method: "DELETE" });
    },

    async getRolePermissions(id: string): Promise<RolePermission[]> {
        return api<RolePermission[]>(`/auth/roles/${id}/permissions`);
    },

    async updateRolePermissions(id: string, permissions: { id: string; allow: boolean }[]): Promise<RolePermission[]> {
        return api<RolePermission[]>(`/auth/roles/${id}/permissions`, { method: "PUT", body: { permissions } });
    },
};
```

- [ ] **Step 3: buat `user-excel.ts` (helper murni)**

```ts
// src/services/user-excel.ts — helper murni utk mapping baris export/import user.

export interface UserRow {
    username: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    gender?: string;
    phone?: string;
    school_name?: string;
}

export const USER_EXPORT_HEADERS = ["USERNAME", "EMAIL", "FULL_NAME", "ROLE", "STATUS", "GENDER", "PHONE", "SCHOOL"];

export function userRowToCells(u: UserRow): (string | undefined)[] {
    return [
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.status,
        u.gender,
        u.phone,
        u.school_name,
    ];
}

export function userImportRowToPayload(row: Record<string, string>): Partial<UserRow> {
    const pick = (k: string) => row[k]?.trim() ?? "";
    return {
        username: pick("USERNAME") || undefined,
        email: pick("EMAIL") || undefined,
        full_name: pick("FULL_NAME") || undefined,
        role: pick("ROLE") || undefined,
        status: pick("STATUS") || undefined,
        gender: pick("GENDER") || undefined,
        phone: pick("PHONE") || undefined,
        school_name: pick("SCHOOL") || undefined,
    };
}
```

- [ ] **Step 4: buat `user-excel.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { USER_EXPORT_HEADERS, userImportRowToPayload, userRowToCells } from "./user-excel";

describe("user-excel", () => {
    it("memetakan baris user ke sel", () => {
        const cells = userRowToCells({
            username: "ahmad",
            email: "ahmad@x.id",
            full_name: "Ahmad",
            role: "SISWA",
            status: "ACTIVE",
            gender: "L",
            phone: "0812",
            school_name: "SMA 1",
        });
        expect(cells).toEqual(["ahmad", "ahmad@x.id", "Ahmad", "SISWA", "ACTIVE", "L", "0812", "SMA 1"]);
    });

    it("header berisi 8 kolom", () => {
        expect(USER_EXPORT_HEADERS).toHaveLength(8);
    });

    it("membaca baris import", () => {
        const p = userImportRowToPayload({ EMAIL: "siti@x.id", FULL_NAME: "Siti", ROLE: "SISWA" });
        expect(p.email).toBe("siti@x.id");
        expect(p.role).toBe("SISWA");
        expect(p.phone).toBeUndefined();
    });
});
```

- [ ] **Step 5: verifikasi**

Run (workdir `frontend`): `npx tsc --noEmit` → PASS. `npx vitest run src/services/user-excel.test.ts` → PASS.

---

### Task 7: Frontend — `UserFormDialog` 3-tab + `UserRoleBadge` + `UserTable` selectable

**Files:**
- Modify: `frontend/src/components/admin/users/UserFormDialog.tsx`
- Modify: `frontend/src/components/admin/users/UserRoleBadge.tsx`
- Modify: `frontend/src/components/admin/users/UserTable.tsx`

**Interfaces:**
- Consumes: `userService` (roles, academicMasterService levels/grades, schoolService), `Tabs` UI, `User` type.
- Produces: `UserFormValues` (diperluas: username, status, school_id, grade_id, major_id); `UserTable` dgn props `selectedRowIds`, `onSelectionChange`, `selectable`.

- [ ] **Step 1: rework `UserFormDialog` — 3 tab**

Ganti struktur jadi `Tabs` (`components/ui/tabs`) dgn 3 tab. Tab "Akademik" hanya render bila `watch("role")` ∈ {SISWA, SUPER_SISWA}. Schema zod ditambah `username`, `status`, `school_id`, `grade_id`, `major_id` (semua optional string). Data dropdown level/grade/school/major dimuat via TanStack Query di komponen.

```tsx
const schema = z.object({
    full_name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "SUPER_SISWA", "INVESTOR"]),
    gender: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "PENDING"]).optional(),
    school_id: z.string().optional(),
    grade_id: z.string().optional(),
    major_id: z.string().optional(),
});
```

Body dialog: `Tabs defaultValue="identitas"` dgn:
- Tab `identitas` (label "Identitas"): Nama Lengkap*, Email*, Password*, Jenis Kelamin, Telepon.
- Tab `akademik` (label "Akademik"): hanya bila role SISWA/SUPER_SISWA — Jenjang (Select dari `academicMasterService.getLevels`), Kelas (Select grade tergantung level), Sekolah (Select dari `schoolService.listSchools`), Jurusan (Select dari `getMajors`), Status Keanggotaan (membership_status). Simpan `education_level` terpisah (state lokal) utk chain level→grade; kirim `school_id`/`grade_id`/`major_id` di payload.
- Tab `akses` (label "Akses"): Role (Select dari `userService.listRoles` — tampilkan `r.code`), Status (ACTIVE/INACTIVE/LOCKED/PENDING).

Ganti efek reset dialog jadi conditional-mount: render `<UserFormDialogInner key={open ? "open" : "closed"} .../>` atau panggil `reset(...)` di `useEffect` seperti sebelumnya (sudah dipakai & lolos lint). Pertahankan pola existing (`useEffect` on open).

Data dropdown (jangan panggil api saat dialog tertutup):

```tsx
const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => userService.listRoles() });
const { data: levels } = useQuery({ queryKey: ["academic-levels"], queryFn: () => academicMasterService.getLevels() });
const selectedLevelId = watch("education_level");
const { data: grades } = useQuery({
    queryKey: ["academic-grades", selectedLevelId],
    queryFn: () => academicMasterService.getGrades(selectedLevelId),
    enabled: Boolean(selectedLevelId) && isStudentRole,
});
const { data: majors } = useQuery({
    queryKey: ["academic-majors", selectedLevelId],
    queryFn: () => api(`/academic/majors?level_id=${selectedLevelId}`),
    enabled: Boolean(selectedLevelId) && isStudentRole,
});
const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: () => schoolService.listSchools({ limit: 500 }),
});
```

`UserFormValues` tetap diekspor; payload disusun di `handleFormSubmit` (buang field kosong + jangan kirim `password` kosong saat edit — pola existing).

- [ ] **Step 2: `UserRoleBadge` — tambah variasi INVESTOR**

```tsx
const roleVariant: Record<UserRole, "default" | "secondary" | "warning" | "destructive" | "outline"> = {
    SUPER_ADMIN: "destructive",
    STAFF: "warning",
    GURU: "secondary",
    FINANCE: "default",
    SISWA: "outline",
    SUPER_SISWA: "secondary",
    INVESTOR: "default",
};
```

- [ ] **Step 3: `UserTable` — selectable + kolom baru**

```tsx
interface UserTableProps {
    users: User[];
    loading?: boolean;
    selectable?: boolean;
    selectedRowIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    onToggleActivate: (user: User) => void;
    onDelete: (user: User) => void;
    onEdit: (user: User) => void;
}
```

Kolom: Nama (full_name + email), Role badge, Status badge (pakai `status`, fallback is_active), Sekolah (`school_name || "-"`), Aksi (dropdown edit/nonaktif/delete). Tambah kolom Username bila nilai `username` ada. `getRowId={(u) => u.id}`. Pass `selectable`/`selectedRowIds`/`onSelectionChange` ke `DataTable`.

- [ ] **Step 4: verifikasi**

Run: `npx tsc --noEmit` → PASS. `npx eslint src/components/admin/users` → PASS.

---

### Task 8: Frontend — `UsersTab` (stats + filter + bulk + import/export) + `ImportUsersCard`

**Files:**
- Create: `frontend/src/components/admin/users/UsersTab.tsx`
- Create: `frontend/src/components/admin/users/ImportUsersCard.tsx`

**Interfaces:**
- Consumes: `userService`, `DataTable` (selectable), `BulkActionBar`, `ImportResultCard`, `UserTable`, `UserFormDialog`, `ConfirmDialog`, `PageHeader`-style card, `Skeleton`, `EmptyState`.
- Produces: `UsersTab` komponen lengkap utk kedua halaman.

- [ ] **Step 1: `ImportUsersCard`**

Upload file → tampil `ImportResultCard`. Props `{ onImported?: () => void }`. State `{ file, importing, result }`. Gunakan `userService.importUsers(file)`; hasil `{total_rows, success_count, failed_count, errors}` dipetakan ke `ImportResultData {total, success, skipped: 0, failed, errors: [{row, message}]}` (errors backend adalah `[]string` per baris — parse `"N: msg"` bila perlu, atau tampilkan mentah di list). Tombol "Unduh Template" panggil `userService.downloadTemplate()`.

- [ ] **Step 2: `UsersTab`**

Props `{ role?: UserRole }`. State: `page`, `q` (debounce sederhana), `roleFilter`, `statusFilter`, `levelFilter`, `selected` (Set<string>), `formOpen`, `editing`, `deleteTarget`, `bulkTarget` (Set → bulk action yg dipilih), `showImport`.

Query: `useQuery({queryKey:["admin-users", page, q, roleFilter, statusFilter, levelFilter], queryFn: () => userService.listUsers({page, limit: 20, q, role: roleFilter, status: statusFilter, education_level: levelFilter})})`. Data `items`/`total` dari `PaginatedData`. Stats dari query list `limit:10000` (hitung total/active/siswa/guru di client) ATAU hitung dari `meta.total`. Pilih: hitung client-side dari data page bila `Array.isArray`; utk akurasi pakai `total` dari meta. Stats cards (4): Total Pengguna, Aktif, Siswa, Guru — dihitung dari hasil `listUsers({limit:10000})` sekali di query terpisah `["admin-user-stats"]`.

Bulk bar: `BulkActionBar count={selected.size}` aksi `Aktifkan`, `Nonaktifkan`, `Hapus` → panggil `bulkStatus`/`bulkDelete`, lalu `qc.invalidateQueries(["admin-users"])` + clear selection.

Header area: filter Select (Role, Status, Jenjang) + tombol `Import`, `Export`, `+ Tambah`. Export → `userService.exportXlsx(Array.from(selected))`. Import → `showImport = true` render `ImportUsersCard`.

Table: `<UserTable selectable selectedRowIds={selected} onSelectionChange={setSelected} ... />`.

Pagination: bawah tabel — tombol Sebelumnya/Selanjutnya berdasar `meta.page/total_pages` (properti `PaginatedData`). Karena `DataTable` punya pagination internal, pakai `pageSize` besar (semua dari server page) & biarkan DataTable handle tampilan; server pagination opsional. **Keputusan:** pakai server pagination (page/limit 20) & nonaktifkan pagination internal DataTable via `pageSize` = data length (DataTable tidak terima disable) — gunakan `pageSize={items.length}` sehingga internal pagination tak terpotong.

- [ ] **Step 3: verifikasi**

Run: `npx tsc --noEmit` → PASS.

---

### Task 9: Frontend — `RolesTab` + halaman admin & staff + `admin-nav`

**Files:**
- Create: `frontend/src/components/admin/users/RolesTab.tsx`
- Modify: `frontend/src/app/(admin)/admin/users/page.tsx`
- Modify: `frontend/src/app/(staff)/staff/users/page.tsx`
- Modify: `frontend/src/config/admin-nav.ts`

**Interfaces:**
- Consumes: `userService`, `UserRoleBadge`, `DataTable`, `ConfirmDialog`, UI primitives.
- Produces: `/admin/users` dgn tabs (Pengguna | Role & Akses), `/staff/users` reuse `UsersTab` + `RolesTab` read-only, nav item Role & Permission (SA).

- [ ] **Step 1: `RolesTab`**

Props `{ canManage?: boolean }` (admin SA true, staff false). Kiri: list role (card per role: badge code + name + user_count + badge SISTEM/KUSTOM). Pilih role → kanan: permission matrix (daftar `PermissionItem` dari `userService.getRolePermissions(id)`) tiap baris: label + desc + `Switch allow`. Simpan lokal → tombol Simpan panggil `updateRolePermissions`. `canManage` → tombol + Tambah Role (dialog sederhana: code, name, priority) & tombol edit/delete per role (delete via ConfirmDialog). Role SUPER_ADMIN: matrix readonly (backend tolak ubah; UI nonaktifkan).

Layout: `grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4`. Pakai `Card`. Loading skeleton. Empty state bila tak ada role.

- [ ] **Step 2: halaman `/admin/users`**

```tsx
export default function AdminUserManagementPage() {
    const [tab, setTab] = useState("users");
    return (
        <div className="space-y-6">
            <PageHeader title="Manajemen Pengguna" description="Pusat administrasi identitas & akses platform — user, role (RBAC), permission matrix, dan data akademik siswa." />
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="users">Daftar Pengguna</TabsTrigger>
                    <TabsTrigger value="roles">Role & Akses</TabsTrigger>
                </TabsList>
                <TabsContent value="users"><UsersTab /></TabsContent>
                <TabsContent value="roles"><RolesTab canManage /></TabsContent>
            </Tabs>
        </div>
    );
}
```

Dukung `?tab=roles` dari nav: baca `window.location.search` di `useState` initializer.

- [ ] **Step 3: halaman `/staff/users`**

Reuse `UsersTab` (tanpa tab roles, karena role write SA). Header deskripsi disesuaikan.

```tsx
<div className="space-y-6">
    <PageHeader title="Manajemen Pengguna" description="Kelola semua akun pengguna platform." />
    <UsersTab />
</div>
```

- [ ] **Step 4: `admin-nav.ts` — item Role & Permission**

Dalam grup `PENGGUNA.items` tambahkan:

```ts
{ title: "Role & Permission", href: "/admin/users?tab=roles", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
```

- [ ] **Step 5: verifikasi**

Run: `npx tsc --noEmit` → PASS. `npx eslint src/app/(admin)/admin/users src/app/(staff)/staff/users src/components/admin/users src/config/admin-nav.ts` → PASS.

---

### Task 10: Verifikasi menyeluruh + smoke test

**Files:** (tidak ada perubahan file baru — hanya menjalankan verifikasi)

- [ ] **Step 1: backend lint/build/test**

Run (workdir `backend`): `go build ./... && go vet ./... && go test ./internal/auth/ -v`
Expected: build/vet PASS; test PASS. (Catatan: `go test ./...` masih akan gagal di `internal/academic/bulk_test.go` WIP agent lain — JANGAN diperbaiki.)

- [ ] **Step 2: frontend static checks**

Run (workdir `frontend`): `npx tsc --noEmit` → PASS. `npx eslint src/components/admin/users src/services/user-excel.ts src/app/"(admin)"/admin/users src/app/"(staff)"/staff/users src/config/admin-nav.ts` → PASS. `npx vitest run src/services/user-excel.test.ts` → PASS.

- [ ] **Step 3: build**

Run (workdir `frontend`): `npm run build` → PASS.

- [ ] **Step 4: smoke test API**

(Butuh approval user utk restart backend + query DB? Tidak — smoke test hanya HTTP ke server yang sudah jalan di port 8080. Login SUPER_ADMIN `admin@yakinlulus.id`/`Admin@123!` via `POST /auth/login`, lalu):
- `GET /auth/roles` → 200, 7 role + user_count.
- `GET /auth/roles/:id/permissions` (id role SISWA) → 200, 9 permission items, academic.read/allow true.
- `PUT /auth/users/:id` (ganti role user test) → 200.
- `POST /auth/users/bulk-status` → 200.
- `GET /auth/users?role=SISWA&status=ACTIVE` → 200 terfilter.

- [ ] **Step 5: lapor**

Ringkas hasil + file yang diubah (tanpa git commit).

---

## Self-Review

**1. Spec coverage** — desain §1 (CRUD penuh ✓ Task 1/4/7; RBAC + role master + permission matrix ✓ Task 3/9; import/export + checkbox + filter detil ✓ Task 4/8). §3 aturan bisnis (role dari body ✓ T1; grade/school/major via student_enrollment ✓ T1; soft delete + blokir enrollment ✓ T1; role assignment SUPER_ADMIN ✓ T4; password bcrypt ✓ existing; import/export ✓ T4). §4 API `[BARU]` (roles CRUD ✓ T3; import/export/bulk ✓ T4). §5 UI (stats ✓ T8; tabs ✓ T9; 3-tab form ✓ T7; import wizard ✓ T8). §6 filter (q/role/status/education_level ✓ T1). §7 komponen ✓. Tidak ada migration baru ✓.

**2. Placeholder scan** — tidak ada "TBD"/"similar to Task N"; semua langkah berisi kode konkret.

**3. Type consistency** — `User.Status`, `SchoolID`, `AcademicYearID` konsisten di backend (`userSelect`, `scanUser`) & frontend (`types/admin.ts`). `AcademicUpsert` dipakai di `Create`/`UpdateUser`/`upsertEnrollment` (T1) & handler (T4). `UserListFilter` dipakai `FindAll`/`Search`/`ExportUsersXlsx` (T1/T4). `PermissionItem` konsisten backend `roles.go` ↔ frontend `RolePermission`. Nama route: `/auth/users/bulk-delete`, `/auth/users/bulk-status`, `/auth/users/export/xlsx`, `/auth/users/import/xlsx`, `/auth/users/import/template`, `/auth/roles`, `/auth/roles/:id/permissions` — sama di backend & `user.service.ts`. Catatan: frontend `updateRolePermissions` mengirim `{permissions:[{id,allow}]}` — cocok dgn struct `PermissionItem` backend (field `ID/Allow` JSON `id/allow`).

---

## Implementation Status — Completed 2026-08-11

### Backend (Go + Fiber)
| Task | Status | Files |
|------|--------|-------|
| 1. auth repo rework | ✅ | `backend/internal/auth/auth.go` (repo) |
| 2. GET /academic/majors | ✅ | `backend/internal/academic/academic.go` |
| 3. roles CRUD + permissions | ✅ | `backend/internal/auth/roles.go` (new) |
| 4. admin CRUD + bulk + import/export | ✅ | `backend/internal/auth/users_admin.go` (new) |
| 5. unit tests | ✅ | `backend/internal/auth/auth_test.go` |

Backend verification: `go build ./...` ✅, `go vet ./...` ✅, `go test ./internal/auth/` ✅ (0.26s)

**Fixes applied after Task 4 review:**
- Critical 1: Added `g`/`el` joins to `FindAll` list query (education_level filter now works)
- Critical 2: Added SUPER_ADMIN guard to import handler (STAFF cannot create SA)
- Important 3: Create uses `u.Status` instead of hardcoded ACTIVE
- Important 4: STAFF cannot modify SUPER_ADMIN accounts (4 guards added)

### Frontend (Next.js 16 + React 19)
| Task | Status | Files |
|------|--------|-------|
| 6. types + services | ✅ | `frontend/src/types/admin.ts`, `frontend/src/services/user.service.ts`, `frontend/src/services/user-excel.ts` |
| 7. form 3-tab + table | ✅ | `frontend/src/components/admin/users/UserFormDialog.tsx`, `UserTable.tsx`, `UserRoleBadge.tsx` |
| 8. UsersTab + ImportUsersCard | ✅ | `frontend/src/components/admin/users/UsersTab.tsx`, `ImportUsersCard.tsx` |
| 9. RolesTab + pages + nav | ✅ | `frontend/src/components/admin/users/RolesTab.tsx`, `admin/users/page.tsx`, `staff/users/page.tsx`, `admin-nav.ts` |

Frontend verification: TypeScript compilation ✅ (0 errors), build completed ✅ (14.3s)

### Navigation
- `admin/users` → UsersTab + RolesTab (for SUPER_ADMIN)
- `staff/users` → UsersTab only (STAFF), both tabs (SUPER_ADMIN)
- `Role & Permission` nav item (SUPER_ADMIN only) → `/admin/users?tab=roles`

### Known Limitations (per review findings)
1. Import modal duplication between `UsersTab` and `ImportUsersCard` (minor)
2. Stats query fetches all users (may need dedicated endpoint for scale)
3. Import template has PASSWORD column but export does not (by design: security)
