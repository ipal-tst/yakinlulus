# Super Siswa Testing Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `SUPER_SISWA` role and seed account (`supersiswa@yakinlulus.id`), and update backend filters to allow unrestricted access across all education levels.

**Architecture:** Add `RoleSuperSiswa = "SUPER_SISWA"` to RBAC middleware, update seeder `cmd/seed/main.go` to insert `SUPER_SISWA` role & user, and update grade filter logic across question bank, material, and practice modules to bypass restriction when role is `SUPER_SISWA`.

**Tech Stack:** Go (Fiber, PostgreSQL).

## Global Constraints

- User email: `supersiswa@yakinlulus.id`
- User password: `Admin@123!`
- Role Code: `SUPER_SISWA`

---

### Task 1: Update RBAC Middleware & Seeder

**Files:**
- Modify: `backend/internal/middleware/auth.go`
- Modify: `backend/cmd/seed/main.go`

- [ ] **Step 1: Add `RoleSuperSiswa` constant in `backend/internal/middleware/auth.go`**

```go
const (
	RoleSuperAdmin = "SUPER_ADMIN"
	RoleStaff      = "STAFF"
	RoleFinance    = "FINANCE"
	RoleGuru       = "GURU"
	RoleSiswa      = "SISWA"
	RoleSuperSiswa = "SUPER_SISWA"
	RoleInvestor   = "INVESTOR"
)
```

- [ ] **Step 2: Add `SUPER_SISWA` role & user to `cmd/seed/main.go`**

```go
{"SUPER_SISWA", "Super Siswa (Testing)"},
```
and user entry:
```go
{"supersiswa@yakinlulus.id", "Super Siswa (Testing)", "SUPER_SISWA"},
```

- [ ] **Step 3: Test backend compilation**

Run: `go build -o api.exe ./cmd/api` in `d:\Project\EdTech\Yakinlulus.id\backend`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/middleware/auth.go backend/cmd/seed/main.go
git commit -m "feat(auth): add SUPER_SISWA role and seeder account"
```

---

### Task 2: Update Grade Filter Bypass Logic in Backend Services

**Files:**
- Modify: `backend/internal/question_bank/question_bank.go`
- Modify: `backend/internal/material/material.go`
- Modify: `backend/internal/practice/practice.go`

- [ ] **Step 1: Update `question_bank.go` grade filter**

Ensure `role == "SISWA"` checks exclude `SUPER_SISWA` or allow `SUPER_SISWA` to see all questions/grades.

- [ ] **Step 2: Update `material.go` and `practice.go` filters**

- [ ] **Step 3: Test backend compilation**

Run: `go build -o api.exe ./cmd/api` in `d:\Project\EdTech\Yakinlulus.id\backend`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/question_bank/question_bank.go backend/internal/material/material.go backend/internal/practice/practice.go
git commit -m "feat(rbac): bypass grade filtering for SUPER_SISWA role"
```
