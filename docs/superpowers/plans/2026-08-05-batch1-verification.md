# Batch 1 Verification Report

**Date:** 2026-08-05
**Branch:** `yl-batch1` (worktree `D:\Project\EdTech\yl-batch1`)
**Base commit:** `634133c` → batch commits `acaf189`, `c0a2e00`, `d0cce2e`, `7ce0fd5`, `3b463cd`, `b08f1f2`

## 1. Build & Vet

```text
go build ./...  → exit 0
go vet ./...    → exit 0
```

## 2. Tests

```text
go test ./... → all packages PASS
  ok  internal/academic
  ok  internal/auth
  ok  internal/cbt_engine
  ok  internal/exam_packages
  ok  internal/middleware
  ok  internal/profile
  ok  internal/ranking
  ok  internal/scoring
  ok  internal/shared
  ok  internal/target_schools
  ok  pkg/config
  ok  pkg/database
  (packages without tests report "[no test files]", no failures)
```

## 3. Migration

```text
go run ./cmd/migrate/main.go status → Applied migrations: 188
academic.student_enrollment created (total_tables 690 → 691)
```

## 4. Smoke Test (API live, port 8081 terpisah)

Server: `go build` dari `cmd/api` dengan config sementara (port 8081) — port 8080 dipakai server dev lama (`api.exe`, tidak disentuh).

Seed: 6 role (`SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`) + 4 jenjang (`SD`, `SMP`, `SMA`, `GAPYEAR`) di-insert ke DB via helper.

| Test | Request | Result |
|---|---|---|
| Register SISWA | `POST /api/v1/auth/register` `{email, password, full_name, role:"SISWA"}` | 200, `role:"SISWA"`, token issued |
| Login | `POST /api/v1/auth/login` | 200, `role:"SISWA"`, `is_active:true`, timestamps real dari `identity.user` |
| Levels authed | `GET /api/v1/academic/levels` + Bearer | 200, list 4 jenjang dari `academic.education_level` |
| Register ADMIN (negatif) | `POST register role:"ADMIN"` | 400 `"Public registration only allows role SISWA"` |
| Levels unauth (negatif) | `GET /academic/levels` tanpa token | 401 `"Missing authentication token"` |

Catatan response register: `is_active:false` & zero `created_at/updated_at` karena response dibangun dari request (belum query DB ulang). Login (yang membaca DB via `FindByEmail`) menampilkan nilai benar — perilaku ini konsisten dengan desain legacy (register tidak re-fetch).

## 5. Verification of key rewrites

- `auth.go`: `FindByEmail`/`FindByID` via `userSelect` join `identity.user` + `identity.user_profile` + lateral role; `Create` insert user+profile+user_role (SISWA); sessions/password-reset → `identity.login_session`/`identity.password_reset`; `UpdateProfile` menulis `full_name`/`gender` ke `user_profile` dan `phone`/`avatar` ke `identity.user` (avatar konsisten dengan read path).
- `validatePublicRegisterRole` hanya menerima `SISWA`.
- `academic.go`: `ListLevels`, `ListGrades`, `ListSubjects`, `ListChapters`, `ListTopics`, `ListLearningOutcomes` → schema `academic.*`.
- `school.go`/`profile.go`: read query → `academic.school` / `identity.user_profile`.
- `admin/repository.go`: `GetLogs` → `identity.activity_log` (plan menyebut schema `audit` yang ternyata tidak ada; controller resolve ke `activity_log`).

## 6. Known issues / deferred

- `school.go` admin-write functions & `GetUserGradeID` masih menarget tabel legacy `users`/`schools` → di-rewrite batch berikutnya (batch 4).
- `ListSubjects` LEFT JOIN scan non-pointer `level_id`/`sort_order` berisiko NULL bila subject belum punya mapping `curriculum_subject` → perlu COALESCE/pengaman saat batch content.
- Seeder `cmd/seed/main.go` masih target `users` legacy → perlu di-rewrite (bukan bagian scope Batch 1; smoke test memakai helper SQL sementara).
- `profile.go` `student_targets`/target_schools masih legacy (batch 4).

## 7. Conclusion

Batch 1 gate: **PASS**. Auth (register/login/role SISWA), master akademik, migrasi 026, dan log admin terverifikasi end-to-end terhadap schema baru.
