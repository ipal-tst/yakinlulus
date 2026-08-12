# Kelola Sekolah & Target Sekolah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/admin/schools` (Kelola Sekolah + Target Sekolah) menjadi CRUD lengkap: identitas sekolah diperluas (`institution_type`, `school_status`, `yayasan_name`, `village`, `postal_code`, `curriculum_code`), tab "Siswa & Akademik per Tahun" (`school_demographic`), nilai penerimaan **per tahun ajaran** (`target_school_score`) + analisa tren, checkbox + bulk aksi, import/export xlsx — sesuai `docs/admin-design/02-kelola-sekolah.md`, `03-target-sekolah.md`, `00-kerangka-template.md`, `api-kontrak-admin.md` (§3–§4).

**Architecture:** Backend menambah 3 migration (kolom sekolah + perluasan enum, `school_demographic`, `target_school_score` + backfill), memperluas repo/service `internal/school` & `internal/target_schools`, menambah endpoint demografi + nilai/tahun + trend + export/bulk. Frontend: `DataTable` di-extend dgn checkbox + selection, komponen shared `BulkActionBar`/`ImportResultCard`, `SchoolsTab` dua sub-tab (Identitas / Demografi), `TargetSchoolsTab` per (sekolah × tahun) + mode Tren (Recharts LineChart). Payung `target_school` dipertahankan + disinkronkan dari tahun terbaru agar modul siswa (`profile.ResolveStudentScore`) tetap kompatibel.

**Tech Stack:** Go (Fiber, pgx, excelize/v2), Next.js 16 + React 19 + TS strict, shadcn tokens, TanStack Query, TanStack Table (DataTable), Recharts. Verifikasi: `go build/vet/test`, `npx tsc --noEmit`, `npx eslint`, `npx vitest run`.

**Spesifikasi pendukung:** `docs/admin-design/02-kelola-sekolah.md` · `03-target-sekolah.md` · `00-ringkasan-backend-migration.md` · `api-kontrak-admin.md` (§3–§4).

## Global Constraints

- FRONTEND `frontend/**` WRITE bebas. Backend `backend/**` diubah utk tugas akademik grup ini (sudah di-approve utk export/bulk sesi sebelumnya; **perlu konfirmasi lagi saat eksekusi**). **DB state change** (menjalankan migration) butuh approval eksplisit per-run — jangan jalankan tanpa user OK. **NO GIT COMMIT** sampai user izinkan.
- Bahasa Indonesia UI. `"use client"` utk hooks. Design tokens `design.md`: radius 12/16/20, primary `#2563EB`, accent orange hanya badge, skeleton loading, error banner merah + "Coba Lagi", empty state + CTA.
- Enum jenjang konsisten: `SD/SMP/SMA/SMK/UNIVERSITY`. `institution_type`: `SEKOLAH|PT`; `school_status`: `NEGERI|SWASTA`; `target_school.level` & `target_school_score`: `SMP/SMA/UNIVERSITY`.
- Skala skor default: SMP/SMA=400, PT(UNIVERSITY)=700. Validasi `0 ≤ min ≤ max ≤ max_total`.
- Tabel pakai **`DataTable`** (TanStack) — sticky header, sortable, resize, pagination; baris 44px; tooltip utk nama panjang. Setiap row **Checkbox** + select-all; bulk bar muncul saat ≥1 terpilih (Hapus/Aktifkan/Nonaktifkan).
- Jangan tambah dependency npm/go baru (excelize/v2, @tanstack/react-table, lucide, recharts sudah ada).
- Job log import: `ocr.import_job` + `ocr.import_error` (pola existing via `internal/importxlsx`). Envelope `shared.Success`/`shared.Error`.
- Parameterized query selalu; validasi server-side; role gate SUPER_ADMIN/STAFF utk write.

---

## Hasil Audit (docs ↔ DB ↔ backend ↔ frontend)

| # | Temuan | Tindakan di plan |
|---|---|---|
| 1 | `academic.school` kurang `institution_type`, `school_status`, `yayasan_name`, `village`, `postal_code`, `curriculum_code` | Task 1 (migration 220) |
| 2 | CHECK `education_level` hanya `SMP/SMA/UNIVERSITY`; desain butuh `SD/SMP/SMA/SMK/UNIVERSITY` + null utk PT | Task 1 (drop+add constraint) |
| 3 | `academic.school_demographic` belum ada | Task 1 (migration 221) |
| 4 | `academic.target_school_score` belum ada | Task 1 (migration 222 + backfill) |
| 5 | Backend school: filter list kurang type/level/province; tanpa demografi; tanpa export/bulk; delete tak cek score; template placeholder kosong | Task 2–4 |
| 6 | Backend target: tanpa `/target-school-scores*`, trend, export/bulk; list paksa `is_active=true` | Task 5–6 |
| 7 | Frontend: table tanpa checkbox/bulk/filter/demografi/tahun/tren | Task 8–12 |
| 8 | `admin-nav.ts`: "Target Sekolah" → `/staff/target-schools` inkonsisten dgn tab nyata | Task 12 |

**Keputusan:** kolom inline payung (`min_score/max_score/max_total_score/academic_year`) dipertahankan utk kompatibilitas modul siswa; disinkronkan dari baris `target_school_score` tahun terbaru pada tiap mutasi nilai (Task 5). `List /target-schools` admin mengembalikan **semua** (termasuk non-aktif) via query `?include_inactive=1`; default tetap aktif utk siswa.

---

## Keberadaan yang SUDAH ADA (jangan buat ulang)

- Backend `internal/school/school.go` — CRUD sekolah + settings/branding + import xlsx (sebagian). `internal/school/import_xlsx.go` — `ImportSchools`.
- Backend `internal/target_schools/target_schools.go` — CRUD payung + join katalog + filter level/province/q; `import_xlsx.go` — `ImportTargets`. `target_schools_test.go` pola test DB_URL-skip.
- `internal/importxlsx` — `Parse`, `Job`, `LogError`, `CompleteJob`, `ResolveByNameOrCode`.
- Frontend `services/school.service.ts` & `services/target-school.service.ts`; `lib/target-school-mappers.ts` (`sortedProvinces`, `defaultMaxTotal`, `formatScoreRange`); `components/data-display/data-table.tsx` (`DataTable`+`Column<T>`); `components/admin/schools/*` (SchoolTable, SchoolFormDialog, school-select, target-school-table, target-school-form-dialog, schools-import-tab); `components/feedback/empty-state.tsx`; halaman `/admin/schools/page.tsx` (3 tab) + `/staff/schools/page.tsx` (reuse komponen).
- `config/admin-nav.ts` — grup Master Akademik ada.

---

## Struktur File

```
backend/
├── migrations/
│   ├── 220_school_identity_extra.up.sql / .down.sql   ◄── BARU
│   ├── 221_school_demographic.up.sql / .down.sql      ◄── BARU
│   └── 222_target_school_score.up.sql / .down.sql     ◄── BARU
├── internal/school/
│   ├── school.go          ◄── MODIFY: model+dto+repo+query+filters+validasi+route
│   ├── demographic.go     ◄── BARU: repo/service/handler demografi
│   ├── export_xlsx.go     ◄── BARU: export sekolah + template sungguhan
│   ├── bulk.go            ◄── BARU: bulk-delete/bulk-status
│   └── school_test.go     ◄── BARU: validasi murni + integration (DB_URL-skip)
├── internal/target_schools/
│   ├── target_schools.go  ◄── MODIFY: List include_inactive
│   ├── scores.go          ◄── BARU: repo/service/handler score + trend
│   ├── scores_import.go   ◄── BARU: import/export score
│   ├── scores_bulk.go     ◄── BARU: bulk-delete score
│   └── scores_test.go     ◄── BARU

frontend/src/
├── services/school.service.ts        ◄── EXTEND: fields + filters + demografi + export/bulk
├── services/target-school.service.ts ◄── EXTEND: scores + trend + export/import/bulk
├── services/school-excel.ts          ◄── BARU: downloadBlob + header mapping (pure)
├── services/school-excel.test.ts     ◄── BARU
├── components/data-display/data-table.tsx  ◄── EXTEND: selectable/selection
├── components/admin/shared/
│   ├── bulk-action-bar.tsx           ◄── BARU
│   └── import-result-card.tsx        ◄── BARU
├── components/admin/schools/
│   ├── SchoolFormDialog.tsx          ◄── REWORK: 3 seksi + field baru
│   ├── SchoolTable.tsx               ◄── REWORK: checkbox + kolom Bentuk/Jenjang/Kota
│   ├── demographic-form-dialog.tsx   ◄── BARU
│   ├── target-score-form-dialog.tsx  ◄── BARU (drawer nilai per tahun)
│   ├── target-score-trend-panel.tsx  ◄── BARU (Recharts LineChart)
│   └── target-school-table.tsx       ◄── REWORK: checkbox + delta badge
├── app/(admin)/admin/schools/
│   ├── page.tsx                      ◄── MODIFY: dukung ?tab= (targets)
│   ├── schools-tab.tsx               ◄── REWORK: sub-tab Identitas + Demografi
│   └── target-schools-tab.tsx        ◄── REWORK: filter tahun + baris per (sekolah×tahun) + tren
└── config/admin-nav.ts               ◄── MODIFY: item Target Sekolah → /admin/schools
```

---

### Task 1: Backend — Migration DB (3 migration)

**Files:**
- Create: `backend/migrations/220_school_identity_extra.up.sql`, `220_school_identity_extra.down.sql`
- Create: `backend/migrations/221_school_demographic.up.sql`, `221_school_demographic.down.sql`
- Create: `backend/migrations/222_target_school_score.up.sql`, `222_target_school_score.down.sql`

**Interfaces:**
- Produces: skema DB baru — kolom `academic.school` (institution_type, school_status, yayasan_name, village, postal_code, curriculum_code), enum `education_level` → `SD/SMP/SMA/SMK/UNIVERSITY` nullable; tabel `academic.school_demographic`; tabel `academic.target_school_score` (UNIQUE(target_school_id,academic_year)) + backfill dari kolom inline payung.

- [ ] **Step 1: tulis `220_school_identity_extra.up.sql`**

```sql
-- 220: perluas identitas katalog sekolah (desain 02 §2.1)
ALTER TABLE academic.school ADD COLUMN institution_type varchar(20) NOT NULL DEFAULT 'SEKOLAH';
ALTER TABLE academic.school ADD COLUMN school_status varchar(20) NOT NULL DEFAULT 'NEGERI';
ALTER TABLE academic.school ADD COLUMN yayasan_name varchar(200);
ALTER TABLE academic.school ADD COLUMN village varchar(100);
ALTER TABLE academic.school ADD COLUMN postal_code varchar(10);
ALTER TABLE academic.school ADD COLUMN curriculum_code varchar(20);

ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_education_level_check;
-- nullable agar PT (institution_type='PT') bisa tanpa jenjang; nilai lama 'SMA' tetap valid
ALTER TABLE academic.school ADD CONSTRAINT academic_school_education_level_check
  CHECK (education_level IS NULL OR education_level IN ('SD','SMP','SMA','SMK','UNIVERSITY'));

ALTER TABLE academic.school ADD CONSTRAINT academic_school_institution_type_check
  CHECK (institution_type IN ('SEKOLAH','PT'));
ALTER TABLE academic.school ADD CONSTRAINT academic_school_status_check
  CHECK (school_status IN ('NEGERI','SWASTA'));

-- isi nilai default pada baris eksisting sesuai enum (tidak wajib; DEFAULT sudah 'SMA')
```

- [ ] **Step 2: tulis `220_school_identity_extra.down.sql`**

```sql
ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_status_check;
ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_institution_type_check;
ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_education_level_check;
ALTER TABLE academic.school DROP COLUMN IF EXISTS curriculum_code;
ALTER TABLE academic.school DROP COLUMN IF EXISTS postal_code;
ALTER TABLE academic.school DROP COLUMN IF EXISTS village;
ALTER TABLE academic.school DROP COLUMN IF EXISTS yayasan_name;
ALTER TABLE academic.school DROP COLUMN IF EXISTS school_status;
ALTER TABLE academic.school DROP COLUMN IF EXISTS institution_type;
```

- [ ] **Step 3: tulis `221_school_demographic.up.sql`**

```sql
-- 221: data siswa & rombel per tahun ajaran (desain 02 §2.2)
CREATE TABLE academic.school_demographic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES academic.school(id) ON DELETE CASCADE,
    academic_year varchar(20) NOT NULL,
    total_students int NOT NULL DEFAULT 0 CHECK (total_students >= 0),
    total_rombel int NOT NULL DEFAULT 0 CHECK (total_rombel >= 0),
    grade_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, academic_year)
);
CREATE INDEX idx_school_demographic_school ON academic.school_demographic(school_id);
```

- [ ] **Step 4: tulis `221_school_demographic.down.sql`**

```sql
DROP TABLE IF EXISTS academic.school_demographic;
```

- [ ] **Step 5: tulis `222_target_school_score.up.sql`**

```sql
-- 222: nilai penerimaan per tahun ajaran (desain 03 §2.2)
CREATE TABLE academic.target_school_score (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_school_id uuid NOT NULL REFERENCES academic.target_school(id) ON DELETE CASCADE,
    academic_year varchar(20) NOT NULL,
    min_score int,
    max_score int,
    max_total_score int NOT NULL DEFAULT 400,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (target_school_id, academic_year),
    CHECK (min_score IS NULL OR min_score >= 0),
    CHECK (max_score IS NULL OR max_score <= max_total_score),
    CHECK (min_score IS NULL OR max_score IS NULL OR max_score >= min_score)
);
CREATE INDEX idx_target_score_payung ON academic.target_school_score(target_school_id);

-- backfill dari kolom inline payung (nilai lama) — hanya bila tahun tersedia
INSERT INTO academic.target_school_score (target_school_id, academic_year, min_score, max_score, max_total_score)
SELECT id, academic_year, min_score, max_score, max_total_score
FROM academic.target_school
WHERE academic_year IS NOT NULL AND academic_year <> '' AND deleted_at IS NULL
ON CONFLICT (target_school_id, academic_year) DO NOTHING;
```

- [ ] **Step 6: tulis `222_target_school_score.down.sql`**

```sql
DROP TABLE IF EXISTS academic.target_school_score;
```

- [ ] **Step 7: verifikasi migration tersusun (TIDAK dijalankan)**

Run: `cmd /c "Get-ChildItem backend\migrations\22*.sql | ForEach-Object { $_.Name }"` (backend/)
Expected: 6 file `220_*`, `221_*`, `222_*` (up+down) muncul.

> **DB state change:** jangan jalankan `go run ./cmd/migrate` / reset / seed. Minta approval user per-run saat eksekusi (Guardrail). Backend test integration memakai `DB_URL` — jika user belum migrasi, test skip otomatis.

- [ ] **Step 8: no commit.**

---

### Task 2: Backend — Sekolah: model, query, filter, validasi

**Files:**
- Modify: `backend/internal/school/school.go` (struct + repo + service + DTO + validasi + List handler)

**Interfaces:**
- Consumes: kolom baru dari Task 1.
- Produces:
  ```go
  type School struct { ... InstitutionType string `json:"institution_type"`; SchoolStatus string `json:"school_status"`; YayasanName *string; City *string `json:"city,omitempty"`; Village *string; PostalCode *string; CurriculumCode *string; IsActive bool `json:"is_active"` }
  type ListFilter struct { Page, Limit int; Search, Type, Level, Province string }
  func (r *Repository) List(ctx, f ListFilter) ([]School, int, error)
  func (r *Repository) CountTargetScores(ctx, id) (int, error)
  func (s *Service) List(ctx, f ListFilter) ([]School, int, error)
  ```
- Validasi create/update: `institution_type` SEKOLAH/PT; SEKOLAH→`education_level` wajib; PT→`education_level='UNIVERSITY'`; `school_status` NEGERI/SWASTA; SWASTA→`yayasan_name` wajib, NEGERI→null; NPSN 8 digit bila diisi.

- [ ] **Step 1: tulis failing test validasi murni** `backend/internal/school/school_test.go`:

```go
package school

import "testing"

func TestValidateCreateReq(t *testing.T) {
	good := CreateSchoolReq{SchoolName: "SMA N 1", NPSN: strPtr("20100001"), InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "NEGERI"}
	if err := validateCreateReq(good); err != nil { t.Fatalf("expected valid: %v", err) }
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "PT", SchoolStatus: "NEGERI"}); err != nil {
		t.Fatalf("PT tanpa level harus valid: %v", err)
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "SEKOLAH", SchoolStatus: "NEGERI"}); err == nil {
		t.Fatal("SEKOLAH tanpa education_level harus error")
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", NPSN: strPtr("123"), InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "NEGERI"}); err == nil {
		t.Fatal("NPSN bukan 8 digit harus error")
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "SWASTA"}); err == nil {
		t.Fatal("SWASTA tanpa yayasan_name harus error")
	}
}

func strPtr(s string) *string { return &s }
```

- [ ] **Step 2: run FAIL** — `cmd /c "go test ./internal/school/... -run TestValidateCreateReq"` (backend/) → fail `undefined: validateCreateReq`.
- [ ] **Step 3: implement di `school.go`** — ganti struct & DTO:

```go
type School struct {
	ID              uuid.UUID  `json:"id"`
	SchoolName      string     `json:"school_name"`
	SchoolCode      string     `json:"school_code"`
	NPSN            *string    `json:"npsn,omitempty"`
	InstitutionType string     `json:"institution_type"`
	EducationLevel  string     `json:"education_level"`
	SchoolStatus    string     `json:"school_status"`
	YayasanName     *string    `json:"yayasan_name,omitempty"`
	Province        *string    `json:"province,omitempty"`
	City            *string    `json:"city,omitempty"`
	District        *string    `json:"district,omitempty"`
	Village         *string    `json:"village,omitempty"`
	Address         *string    `json:"address,omitempty"`
	PostalCode      *string    `json:"postal_code,omitempty"`
	Phone           *string    `json:"phone,omitempty"`
	Email           *string    `json:"email,omitempty"`
	Website         *string    `json:"website,omitempty"`
	CurriculumCode  *string    `json:"curriculum_code,omitempty"`
	PrincipalName   *string    `json:"principal_name,omitempty"`
	Accreditation   *string    `json:"accreditation,omitempty"`
	Status          string     `json:"status"`
	IsActive        bool       `json:"is_active"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
```

```go
type CreateSchoolReq struct {
	SchoolName      string  `json:"school_name"`
	NPSN            *string `json:"npsn,omitempty"`
	InstitutionType string  `json:"institution_type"`
	EducationLevel  *string `json:"education_level,omitempty"`
	SchoolStatus    string  `json:"school_status"`
	YayasanName     *string `json:"yayasan_name,omitempty"`
	Province        *string `json:"province,omitempty"`
	City            *string `json:"city,omitempty"`
	District        *string `json:"district,omitempty"`
	Village         *string `json:"village,omitempty"`
	Address         *string `json:"address,omitempty"`
	PostalCode      *string `json:"postal_code,omitempty"`
	Phone           *string `json:"phone,omitempty"`
	Email           *string `json:"email,omitempty"`
	Website         *string `json:"website,omitempty"`
	CurriculumCode  *string `json:"curriculum_code,omitempty"`
}

type UpdateSchoolReq struct {
	SchoolName      *string `json:"school_name,omitempty"`
	NPSN            *string `json:"npsn,omitempty"`
	InstitutionType *string `json:"institution_type,omitempty"`
	EducationLevel  *string `json:"education_level,omitempty"`
	SchoolStatus    *string `json:"school_status,omitempty"`
	YayasanName     *string `json:"yayasan_name,omitempty"`
	Province        *string `json:"province,omitempty"`
	City            *string `json:"city,omitempty"`
	District        *string `json:"district,omitempty"`
	Village         *string `json:"village,omitempty"`
	Address         *string `json:"address,omitempty"`
	PostalCode      *string `json:"postal_code,omitempty"`
	Phone           *string `json:"phone,omitempty"`
	Email           *string `json:"email,omitempty"`
	Website         *string `json:"website,omitempty"`
	CurriculumCode  *string `json:"curriculum_code,omitempty"`
}
```

- [ ] **Step 4: tambah helper validasi** (di `school.go`):

```go
var validInstitutionTypes = map[string]bool{"SEKOLAH": true, "PT": true}
var validSchoolStatuses = map[string]bool{"NEGERI": true, "SWASTA": true}
var validSchoolLevels = map[string]bool{"SD": true, "SMP": true, "SMA": true, "SMK": true, "UNIVERSITY": true}

func is8DigitNPSN(s string) bool {
	if len(s) != 8 { return false }
	for _, c := range s { if c < '0' || c > '9' { return false } }
	return true
}

func validateCreateReq(req CreateSchoolReq) error {
	if req.SchoolName == "" { return fiber.NewError(400, "school_name required") }
	if req.InstitutionType == "" { req.InstitutionType = "SEKOLAH" }
	if !validInstitutionTypes[req.InstitutionType] { return fiber.NewError(400, "institution_type must be SEKOLAH or PT") }
	if req.SchoolStatus == "" { req.SchoolStatus = "NEGERI" }
	if !validSchoolStatuses[req.SchoolStatus] { return fiber.NewError(400, "school_status must be NEGERI or SWASTA") }
	if req.NPSN != nil && *req.NPSN != "" && !is8DigitNPSN(*req.NPSN) { return fiber.NewError(400, "npsn must be 8 digits") }
	if req.InstitutionType == "SEKOLAH" {
		if req.EducationLevel == nil || *req.EducationLevel == "" { return fiber.NewError(400, "education_level required for SEKOLAH") }
		if !validSchoolLevels[*req.EducationLevel] { return fiber.NewError(400, "invalid education_level") }
	} else {
		lvl := "UNIVERSITY"
		req.EducationLevel = &lvl
	}
	if req.SchoolStatus == "SWASTA" {
		if req.YayasanName == nil || *req.YayasanName == "" { return fiber.NewError(400, "yayasan_name required when SWASTA") }
	} else {
		req.YayasanName = nil
	}
	return nil
}
```

- [ ] **Step 5: implement repo List + scan dengan kolom baru.** Ganti `scanSchool`/`scanSchoolRows` dan query `List`/`FindByID` agar membaca `institution_type, school_status, yayasan_name, city, village, postal_code, curriculum_code, is_active`; ubah `s.city AS regency` → `s.city AS city`; tambah filter:

```go
type ListFilter struct {
	Page, Limit int
	Search, Type, Level, Province string
}

const schoolSelectCols = `s.id, s.name AS school_name,
	COALESCE(s.npsn,'') AS school_code, s.npsn,
	COALESCE(s.institution_type,'SEKOLAH') AS institution_type,
	COALESCE(s.education_level,'') AS education_level,
	COALESCE(s.school_status,'NEGERI') AS school_status,
	s.yayasan_name, s.province, s.city AS city, s.district, s.village,
	s.address, s.postal_code, s.phone, s.email, s.website, s.curriculum_code,
	NULL::text AS principal_name, NULL::text AS accreditation,
	s.is_active, CASE WHEN s.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
	s.created_at, s.updated_at`

func scanSchoolRow(row pgx.Row) (*School, error) {
	sc := &School{}
	err := row.Scan(&sc.ID, &sc.SchoolName, &sc.SchoolCode, &sc.NPSN, &sc.InstitutionType,
		&sc.EducationLevel, &sc.SchoolStatus, &sc.YayasanName, &sc.Province, &sc.City,
		&sc.District, &sc.Village, &sc.Address, &sc.PostalCode, &sc.Phone, &sc.Email,
		&sc.Website, &sc.CurriculumCode, &sc.PrincipalName, &sc.Accreditation,
		&sc.IsActive, &sc.Status, &sc.CreatedAt, &sc.UpdatedAt)
	return sc, err
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]School, int, error) {
	where := "WHERE s.deleted_at IS NULL"
	args := []interface{}{}
	n := 1
	if f.Search != "" {
		where += fmt.Sprintf(" AND (s.name ILIKE $%d OR COALESCE(s.npsn,'') ILIKE $%d)", n, n)
		args = append(args, "%"+f.Search+"%"); n++
	}
	if f.Type != "" { where += fmt.Sprintf(" AND s.institution_type = $%d", n); args = append(args, f.Type); n++ }
	if f.Level != "" { where += fmt.Sprintf(" AND s.education_level = $%d", n); args = append(args, f.Level); n++ }
	if f.Province != "" { where += fmt.Sprintf(" AND COALESCE(s.province,'') ILIKE $%d", n); args = append(args, "%"+f.Province+"%"); n++ }

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM academic.school s "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `SELECT ` + schoolSelectCols + ` FROM academic.school s ` + where +
		fmt.Sprintf(" ORDER BY s.name LIMIT $%d OFFSET $%d", n, n+1)
	args = append(args, f.Limit, (f.Page-1)*f.Limit)
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var out []School
	for rows.Next() {
		sc, err := scanSchoolRow(rows)
		if err != nil { return nil, 0, err }
		out = append(out, *sc)
	}
	return out, total, rows.Err()
}
```

- [ ] **Step 6: service & handler** — `Service.List(ctx, f ListFilter)` memanggil repo; `Create` panggil `validateCreateReq` lalu repo.Create (repo SQL tambah kolom baru); `Update` panggil validasi ringan (`validateUpdateReq` memakai pointer, isi field ke objek lalu repo.Update). `Handler.List` baca query `q,type,level,province,page,limit`. Tambah `fmt` import.

- [ ] **Step 7: run test PASS + build/vet** — `cmd /c "go test ./internal/school/... -run TestValidateCreateReq"` (backend/) PASS; lalu `go build ./... && go vet ./internal/school/...`
- [ ] **Step 8: no commit.**

---

### Task 3: Backend — Demografi (`/school-demographics` CRUD)

**Files:**
- Create: `backend/internal/school/demographic.go`
- Modify: `backend/internal/school/school.go` (RegisterRoutes tambah route)

**Interfaces:**
- Consumes: repo school (untuk validasi `school_id` ada).
- Produces:
  ```go
  type SchoolDemographic struct { ID uuid.UUID; SchoolID uuid.UUID; AcademicYear string; TotalStudents int; TotalRombel int; GradeBreakdown map[string]int; CreatedAt, UpdatedAt time.Time }
  type DemographicReq struct { SchoolID uuid.UUID `json:"school_id"`; AcademicYear string `json:"academic_year"`; TotalStudents *int `json:"total_students,omitempty"`; TotalRombel *int `json:"total_rombel,omitempty"`; GradeBreakdown map[string]int `json:"grade_breakdown,omitempty"` }
  func (s *Service) ListDemographics(ctx, schoolID uuid.UUID, year string) ([]SchoolDemographic, error)
  func (s *Service) UpsertDemographic(ctx, req DemographicReq) (*SchoolDemographic, error)
  func (s *Service) UpdateDemographic(ctx, id uuid.UUID, req DemographicReq) (*SchoolDemographic, error)
  func (s *Service) DeleteDemographic(ctx, id uuid.UUID) error
  ```
- Rute: `GET /school-demographics?school_id=&academic_year=`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` (role SA,ST).

- [ ] **Step 1: tulis failing test** (append `school_test.go`):

```go
func TestDemographicValidation(t *testing.T) {
	s := &Service{}
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{AcademicYear: "2025/2026"}); err == nil {
		t.Fatal("school_id required")
	}
	neg := -1
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{SchoolID: uuid.New(), AcademicYear: "2025/2026", TotalStudents: &neg}); err == nil {
		t.Fatal("total_students cannot be negative")
	}
}
```

- [ ] **Step 2: run FAIL** — `go test ./internal/school/... -run TestDemographicValidation`
- [ ] **Step 3: implement `demographic.go`** — repo upsert `ON CONFLICT (school_id, academic_year) DO UPDATE`, `grade_breakdown` marshal/unmarshal jsonb, validasi `total>=0`, `academic_year` non-kosong, `school_id` wajib; service panggil; handler + route di `RegisterRoutes`:

```go
d := router.Group("/school-demographics", admin)
d.Get("/", h.ListDemographics)
d.Get("/:id", h.GetDemographic)
d.Post("/", h.CreateDemographic)
d.Put("/:id", h.UpdateDemographic)
d.Delete("/:id", h.DeleteDemographic)
```

- [ ] **Step 4: run test PASS + build/vet** — `go build ./... && go vet ./internal/school/... && go test ./internal/school/...`
- [ ] **Step 5: no commit.**

---

### Task 4: Backend — Sekolah: export xlsx, bulk, template, delete-block

**Files:**
- Create: `backend/internal/school/export_xlsx.go`, `backend/internal/school/bulk.go`
- Modify: `backend/internal/school/school.go` (routes + `CountTargetScores` + `SoftDelete`)

**Interfaces:**
- Produces:
  ```go
  type BulkResult struct{ Processed, Deleted, Failed int; Errors []string }
  func (s *Service) ExportXLSX(ctx, ids []uuid.UUID, f ListFilter) ([]byte, error)
  func (s *Service) BulkDelete(ctx, ids []uuid.UUID) (*BulkResult, error)
  func (s *Service) BulkStatus(ctx, ids []uuid.UUID, active bool) (*BulkResult, error)
  func (s *Service) SchoolImportTemplate(ctx) ([]byte, error)   // fix placeholder
  ```
- Header export/template (sheet `"Sekolah"`): `NAMA, NPSN, BENTUK, JENJANG, STATUS, YAYASAN, PROVINSI, KOTA, KECAMATAN, DESA, ALAMAT, KODEPOS, TELP, EMAIL, WEBSITE, KURIKULUM`.
- Rute: `POST /schools/export/xlsx`, `POST /schools/bulk-delete`, `POST /schools/bulk-status` (SA,ST).

- [ ] **Step 1: tulis failing test template/export** (append `school_test.go`):

```go
func TestSchoolTemplateHeaders(t *testing.T) {
	b, err := schoolTemplateWorkbook()
	if err != nil { t.Fatalf("template: %v", err) }
	f, err := excelize.OpenReader(bytes.NewReader(b))
	if err != nil { t.Fatalf("open: %v", err) }
	rows, _ := f.GetRows("Sekolah")
	if len(rows) < 2 { t.Fatal("need header + example row") }
	want := []string{"NAMA", "NPSN", "BENTUK", "JENJANG", "STATUS", "YAYASAN", "PROVINSI", "KOTA", "KECAMATAN", "DESA", "ALAMAT", "KODEPOS", "TELP", "EMAIL", "WEBSITE", "KURIKULUM"}
	for i, w := range want {
		if rows[0][i] != w { t.Fatalf("col %d = %q, want %q", i, rows[0][i], w) }
	}
}
```
(`excelize` + `bytes` import; helper `schoolTemplateWorkbook()` pure, tanpa DB.)

- [ ] **Step 2: run FAIL** — `go test ./internal/school/... -run TestSchoolTemplateHeaders`
- [ ] **Step 3: implement `export_xlsx.go`** — `schoolTemplateWorkbook()` (excelize: sheet `Sekolah`, header + 1 contoh); `ExportXLSX(ctx, ids, f)` list data → isi baris; handler `ExportSchoolsXlsx` membaca body `{ids}` atau query filter → set `Content-Type`/`Content-Disposition` `attachment; filename="sekolah-<yyyy-mm-dd>.xlsx"`.
- [ ] **Step 4: implement `bulk.go`** — `BulkDelete` loop `SoftDelete` per id (blok bila ada member/score → hitung failed); `BulkStatus` loop `UpdateStatus`; hasil `BulkResult`.
- [ ] **Step 5: fix placeholder template** — ganti isi `ImportSchoolsTemplate` handler dgn `schoolTemplateWorkbook()` bytes (jangan lagi `[]byte{}`).
- [ ] **Step 6: `CountTargetScores` + block** — tambah repo `CountTargetScores` (`SELECT COUNT(*) FROM academic.target_school_score tss JOIN academic.target_school ts ON ts.id=tss.target_school_id WHERE ts.school_id=$1`); `Service.SoftDelete` & `UpdateStatus(INACTIVE)` tolak bila member>0 **atau** score>0 (409).
- [ ] **Step 7: register routes:**

```go
r.Post("/export/xlsx", admin, h.ExportSchoolsXlsx)
r.Post("/bulk-delete", admin, h.BulkDelete)
r.Post("/bulk-status", admin, h.BulkStatus)
```

- [ ] **Step 8: run test PASS + build/vet** — `go build ./... && go vet ./internal/school/... && go test ./internal/school/...`
- [ ] **Step 9: no commit.**

---

### Task 5: Backend — Target Sekolah: nilai per tahun + trend

**Files:**
- Create: `backend/internal/target_schools/scores.go`
- Modify: `backend/internal/target_schools/target_schools.go` (List include_inactive + route)
- Create: `backend/internal/target_schools/scores_test.go`

**Interfaces:**
- Produces:
  ```go
  type TargetSchoolScore struct { ID uuid.UUID `json:"id"`; TargetSchoolID uuid.UUID `json:"target_school_id"`; AcademicYear string `json:"academic_year"`; MinScore *int `json:"min_score,omitempty"`; MaxScore *int `json:"max_score,omitempty"`; MaxTotalScore int `json:"max_total_score"`; CreatedBy *uuid.UUID `json:"created_by,omitempty"`; CreatedAt, UpdatedAt time.Time }
  type SaveScoreRequest struct { TargetSchoolID uuid.UUID `json:"target_school_id"`; AcademicYear string `json:"academic_year"`; MinScore *int `json:"min_score,omitempty"`; MaxScore *int `json:"max_score,omitempty"`; MaxTotalScore *int `json:"max_total_score,omitempty"` }
  type TrendPoint struct { AcademicYear string `json:"academic_year"`; MinScore *int `json:"min_score,omitempty"`; MaxScore *int `json:"max_score,omitempty"`; DeltaMin *int `json:"delta_min,omitempty"`; DeltaMax *int `json:"delta_max,omitempty"` }
  func (s *Service) ListScores(ctx, targetSchoolID uuid.UUID, year string) ([]TargetSchoolScore, error)
  func (s *Service) GetScore(ctx, id uuid.UUID) (*TargetSchoolScore, error)
  func (s *Service) UpsertScore(ctx, req SaveScoreRequest, userID uuid.UUID) (*TargetSchoolScore, error)
  func (s *Service) UpdateScore(ctx, id uuid.UUID, req SaveScoreRequest, userID uuid.UUID) (*TargetSchoolScore, error)
  func (s *Service) DeleteScore(ctx, id uuid.UUID) error
  func (s *Service) Trend(ctx, targetSchoolID uuid.UUID) ([]TrendPoint, error)
  ```
- Validasi: `academic_year` non-kosong; `target_school_id` wajib; `0 ≤ min ≤ max ≤ max_total`; `max_total` default dari level payung (SMP/SMA=400, UNIVERSITY=700) bila 0.
- **Sinkron payung:** setelah upsert/update/delete, `UPDATE academic.target_school SET min_score=.., max_score=.., max_total_score=.., academic_year=.. WHERE id=$payung` memakai tahun terbaru (ORDER BY academic_year DESC LIMIT 1) — agar katalog siswa tetap akurat.
- Rute (role SA,ST): `GET /target-school-scores?target_school_id=&academic_year=`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /trend/:id`.

- [ ] **Step 1: tulis failing test** `scores_test.go`:

```go
package target_schools

import (
	"testing"
	"github.com/google/uuid"
)

func TestValidateScoreReq(t *testing.T) {
	min, max := 340, 380
	total := 400
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MinScore: &min, MaxScore: &max, MaxTotalScore: &total}); err != nil {
		t.Fatalf("valid case: %v", err)
	}
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: ""}); err == nil {
		t.Fatal("academic_year required")
	}
	badMin, badMax := 400, 300
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MinScore: &badMin, MaxScore: &badMax}); err == nil {
		t.Fatal("max < min harus error")
	}
	over := 500
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MaxScore: &over, MaxTotalScore: &total}); err == nil {
		t.Fatal("max > max_total harus error")
	}
}
```

- [ ] **Step 2: run FAIL** — `go test ./internal/target_schools/... -run TestValidateScoreReq`
- [ ] **Step 3: implement `scores.go`** — repo: `List` (filter payung+tahun, ORDER BY academic_year DESC), `GetByID`, `Upsert` (`INSERT ... ON CONFLICT (target_school_id, academic_year) DO UPDATE`), `Update`, `Delete`, `SyncPayungLatest(ctx, targetSchoolID)`; service validasi + panggil + sync; handler + route di `RegisterRoutes`.
- [ ] **Step 4: `List` payung admin** — ubah `Repository.List` menerima `includeInactive bool`; bila true, hapus `ts.is_active = true` dari where. `Service.ListSchools(ctx, level, province, q, includeInactive)`.
- [ ] **Step 5: run test PASS + build/vet** — `go build ./... && go vet ./internal/target_schools/... && go test ./internal/target_schools/...` (integration skip tanpa DB_URL)
- [ ] **Step 6: no commit.**

---

### Task 6: Backend — Target Sekolah: import/export/bulk nilai

**Files:**
- Create: `backend/internal/target_schools/scores_import.go`, `backend/internal/target_schools/scores_bulk.go`

**Interfaces:**
- Produces:
  ```go
  func (s *Service) ImportScores(ctx, file io.Reader, fileName string) (*ImportResult, error)
  func (s *Service) ExportScoresXLSX(ctx, targetSchoolID uuid.UUID, year string) ([]byte, error)
  func (s *Service) ScoreImportTemplate(ctx) ([]byte, error)
  func (s *Service) BulkDeleteScores(ctx, ids []uuid.UUID) (int, error)
  ```
- Header import/export (sheet `"Target Sekolah"`): `SEKOLAH, TAHUN, NILAI TERENDAH, NILAI TERTINGGI, SKALA`; ekspor menambah kolom `DELTA MIN, DELTA MAX` (vs tahun sebelumnya).
- Rule import: resolve payung by nama/NPSN (`ResolveByNameOrCode` → `academic.target_school` join school; auto-create payung bila belum ada); duplikat (payung, tahun) → `skipped` dicatat di job; reuse `importxlsx.Job/LogError/CompleteJob`.
- Rute: `POST /target-school-scores/import/xlsx`, `GET /import/template`, `POST /export/xlsx`, `POST /bulk-delete`.

- [ ] **Step 1: tulis failing test template** (append `scores_test.go`):

```go
func TestScoreImportTemplateHeaders(t *testing.T) {
	b, err := scoreTemplateWorkbook()
	if err != nil { t.Fatalf("template: %v", err) }
	f, err := excelize.OpenReader(bytes.NewReader(b))
	if err != nil { t.Fatalf("open: %v", err) }
	rows, _ := f.GetRows("Target Sekolah")
	want := []string{"SEKOLAH", "TAHUN", "NILAI TERENDAH", "NILAI TERTINGGI", "SKALA"}
	if len(rows) < 2 { t.Fatal("need header + example") }
	for i, w := range want { if rows[0][i] != w { t.Fatalf("col %d = %q want %q", i, rows[0][i], w) } }
}
```
(import `bytes`, `excelize`; helper `scoreTemplateWorkbook()` pure.)

- [ ] **Step 2: run FAIL** — `go test ./internal/target_schools/... -run TestScoreImportTemplateHeaders`
- [ ] **Step 3: implement `scores_import.go`** — `scoreTemplateWorkbook()`; `ImportScores` parse (sheet `Target Sekolah`, `importxlsx.Parse` uppercases header): resolve payung `academic.target_school` join `academic.school` by nama/npsn → auto-create payung bila belum ada (school_id resolve, level dari school); parse int; validasi; `s.UpsertScore` (skip duplikat → LogError); job log; `ExportScoresXLSX` (list scores + hitung delta vs tahun sebelumnya per payung); handler `ImportScoresXlsx`/`ImportScoresTemplate`/`ExportScoresXlsx`.
- [ ] **Step 4: implement `scores_bulk.go`** — `BulkDeleteScores` loop `DeleteScore`; handler `BulkDeleteScores`.
- [ ] **Step 5: register routes** di `RegisterRoutes`:

```go
r.Post("/import/xlsx", write, h.ImportScoresXlsx)
r.Get("/import/template", write, h.ImportScoresTemplate)
r.Post("/export/xlsx", write, h.ExportScoresXlsx)
r.Post("/bulk-delete", write, h.BulkDeleteScores)
```
> Catatan: rute group `/target-school-scores`; pastikan rute `/trend/:id` & `/import/template` terdaftar sebelum `/:id` agar tidak tertelan (Fiber cocok berdasar jumlah segmen, tapi urutkan rute statis lebih dulu).

- [ ] **Step 6: run test PASS + build/vet** — `go build ./... && go vet ./internal/target_schools/... && go test ./internal/target_schools/...`
- [ ] **Step 7: no commit.**

---

### Task 7: Frontend — services (school + target) & helper excel

**Files:**
- Modify: `frontend/src/services/school.service.ts`
- Modify: `frontend/src/services/target-school.service.ts`
- Create: `frontend/src/services/school-excel.ts`
- Create: `frontend/src/services/school-excel.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // school.service.ts
  export interface School { id; school_name; name?; code?; npsn?; institution_type?: "SEKOLAH"|"PT"; education_level?: string; school_status?: "NEGERI"|"SWASTA"; yayasan_name?: string; province?; city?; district?; village?; address?; postal_code?; phone?; email?; website?; curriculum_code?; status?; is_active?: boolean; total_students?; created_at?; updated_at? }
  export interface SchoolPayload { school_name; npsn?; institution_type?; education_level?; school_status?; yayasan_name?; province?; city?; district?; village?; address?; postal_code?; phone?; email?; website?; curriculum_code? }
  export interface SchoolDemographic { id; school_id; academic_year; total_students; total_rombel; grade_breakdown: Record<string, number>; created_at?; updated_at? }
  listSchools(params?: { page?; limit?; q?; type?; level?; province? }): Promise<School[]>
  createSchool/updateSchool (payload city, bukan regency)
  toggleStatus(id, status); deleteSchool(id)
  listDemographics(params?: { school_id?; academic_year? }): Promise<SchoolDemographic[]>
  upsertDemographic(payload): Promise<SchoolDemographic>
  updateDemographic(id, payload); deleteDemographic(id)
  exportXlsx(ids?: string[]): Promise<Blob>          // POST /schools/export/xlsx
  bulkDelete(ids: string[]): Promise<BulkResult>
  bulkStatus(ids: string[], isActive: boolean): Promise<BulkResult>
  // target-school.service.ts (tambahan)
  export interface TargetSchoolScore { id; target_school_id; academic_year; min_score?; max_score?; max_total_score; created_at?; updated_at? }
  listScores(params?: { target_school_id?; academic_year? }): Promise<TargetSchoolScore[]>
  upsertScore(payload): Promise<TargetSchoolScore>
  updateScore(id, payload); deleteScore(id)
  getTrend(id): Promise<{ items: { academic_year; min_score?; max_score?; delta_min?; delta_max? }[] }>
  exportScores(ids?: string[]): Promise<Blob>; importScores(file): Promise<ImportResult>; bulkDeleteScores(ids): Promise<BulkResult>
  // school-excel.ts
  export interface BulkResult { processed: number; deleted: number; failed: number; errors: {row:number;message:string}[] }
  export function downloadBlob(blob: Blob, filename: string): void
  export function exportFilename(prefix: string): string   // `sekolah-2026-08-11.xlsx`
  ```

- [ ] **Step 1: tulis helper test** `school-excel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { exportFilename } from "./school-excel";

describe("exportFilename", () => {
  it("prefix + tanggal", () => {
    expect(exportFilename("sekolah")).toMatch(/^sekolah-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
```

- [ ] **Step 2: run FAIL** — `cmd /c "npx vitest run src/services/school-excel.test.ts"` (frontend/)
- [ ] **Step 3: implement `school-excel.ts`** — `downloadBlob` (anchor + revoke), `exportFilename` (`new Date().toISOString().slice(0,10)`), `BulkResult` type.
- [ ] **Step 4: extend `school.service.ts`** — ganti `regency`→`city` pada `School`/`SchoolPayload`; tambah field baru; `listSchools` params extend; `listDemographics`/`upsertDemographic`/`updateDemographic`/`deleteDemographic` via `api`; `exportXlsx` (fetch blob + auth token, pola `downloadSchoolImportTemplate`), `bulkDelete`/`bulkStatus` (body `{ids}` / `{ids,is_active}`).
- [ ] **Step 5: extend `target-school.service.ts`** — `listScores`, `upsertScore`, `updateScore`, `deleteScore`, `getTrend`, `exportScores`, `importScores` (FormData, pola `importTargets`), `bulkDeleteScores`.
- [ ] **Step 6: run PASS + tsc/eslint** — `cmd /c "npx vitest run src/services/school-excel.test.ts"`, `cmd /c "npx eslint src/services/school.service.ts src/services/target-school.service.ts src/services/school-excel.ts"` → 0 error.
- [ ] **Step 7: no commit.**

---

### Task 8: Frontend — DataTable selectable + komponen shared

**Files:**
- Modify: `frontend/src/components/data-display/data-table.tsx`
- Create: `frontend/src/components/admin/shared/bulk-action-bar.tsx`
- Create: `frontend/src/components/admin/shared/import-result-card.tsx`

**Interfaces:**
- Produces:
  ```ts
  // data-table.tsx (extend, backward-compatible)
  export interface DataTableOptions<T> {
    // ...existing
    selectable?: boolean                       // default false → tak berubah utk tabel lain
    selectedRowIds?: Set<string>
    onSelectionChange?: (ids: Set<string>) => void
  }
  // Kolom checkbox otomatis muncul saat selectable (select-all di header)
  // bulk-action-bar.tsx
  export interface BulkActionBarProps {
    count: number
    actions: { label: string; variant?: "default"|"destructive"|"outline"; onClick: () => void; confirm?: string }[]
    onClear?: () => void
  }
  // import-result-card.tsx
  export interface ImportResultCardProps {
    result: { total: number; success: number; skipped: number; failed: number; errors?: { row: number; message: string }[] }
    onClose?: () => void
  }
  ```
- Checklist kolom header: checkbox (select-all indeterminate), sticky left, 40px, a11y `aria-label`.

- [ ] **Step 1: baca `data-table.tsx`** — pahami `Column<T>` + render struktur (header/body) agar ekstensi tak merusak.
- [ ] **Step 2: extend `data-table.tsx`** — prop `selectable` + `selectedRowIds` + `onSelectionChange`; render kolom checkbox di header (select-all + indeterminate) & tiap row (toggle). Tambah baris summary opsional di bawah tabel menampilkan "N terpilih".
- [ ] **Step 3: tulis `bulk-action-bar.tsx`** — bar sticky di atas tabel: pill `N terpilih`, tombol aksi (destructive → konfirmasi native `confirm` bila `confirm` diset), tombol "Bersihkan". Framer-motion slide-in 150ms; a11y `role="toolbar"`.
- [ ] **Step 4: tulis `import-result-card.tsx`** — ringkasan: Total / Sukses / Dilewati / Gagal; expandable list error (row+pesan); tombol "Tutup". Icon status green/orange/red (bukan warna penuh).
- [ ] **Step 5: verifikasi** — `npx tsc --noEmit` (frontend/), `npx eslint src/components/data-display/data-table.tsx src/components/admin/shared/` → 0 error.
- [ ] **Step 6: no commit.**

---

### Task 9: Frontend — SchoolFormDialog (3 seksi + field baru)

**Files:**
- Modify: `frontend/src/components/admin/schools/SchoolFormDialog.tsx`
- Modify: `frontend/src/components/admin/schools/SchoolTable.tsx` (kolom Bentuk/Jenjang/Kota + checkbox)

**Interfaces:**
- Produces:
  ```ts
  export interface SchoolFormValues {
    school_name: string; npsn?: string
    institution_type: "SEKOLAH" | "PT"; education_level?: string
    school_status: "NEGERI" | "SWASTA"; yayasan_name?: string
    province?: string; city?: string; district?: string; village?: string
    address?: string; postal_code?: string
    phone?: string; email?: string; website?: string; curriculum_code?: string
    is_active: boolean
  }
  ```
- Form 3 seksi (Card, radius 16): **Identitas** (nama, NPSN, bentuk→jenjang cascade, status, yayasan), **Alamat** (provinsi→kota→kecamatan→kelurahan cascade, kode pos, alamat), **Kontak & Kurikulum** (telp, email, website, kurikulum). Save = create/update via `createSchool`/`updateSchool`. Simpan juga `Demografi`? **TIDAK** — demografi form terpisah (Task 10). Validasi: nama wajib; bila `SEKOLAH` maka `education_level` wajib; bila `PT` jenjang opsional.

- [ ] **Step 1: baca `SchoolFormDialog.tsx` & `SchoolTable.tsx`** — catat state, cascade provinsi, endpoint yang dipakai.
- [ ] **Step 2: tulis SchoolTable yang sudah pakai `DataTable` selectable** — kolom: checkbox, `school_name` (tooltip), `Bentuk` (badge SEKOLAH/PT), `Jenjang` (label education_level), `Kota` (city), `Status` (Aktif/Nonaktif badge), aksi (edit/hapus). Kosongkan sementara prop `onSelectionChange` sampai Tab terhubung (Task 11).
- [ ] **Step 3: rework `SchoolFormDialog`** — 3 seksi; cascade: `institution_type` (Select SEKOLAH/PT) → `education_level` (Select SD/SMP/SMA/SMK/UNIVERSITY, disabled bila PT); `province`→`city`→`district`→`village` dari `lib/target-school-mappers` (`sortedProvinces`); field baru `village`, `postal_code`, `curriculum_code`, `yayasan_name`, `school_status`. Submit → `createSchool`/`updateSchool`.
- [ ] **Step 4: validasi + error** — inline error di bawah field (design.md); error API → banner merah + "Coba Lagi".
- [ ] **Step 5: verifikasi** — `npx tsc --noEmit` + `npx eslint` → 0 error. Run dev server `npm run dev` & cek form render (manual smoke).

---

### Task 10: Frontend — SchoolsTab sub-tab Identitas + Demografi

**Files:**
- Modify: `frontend/src/app/(admin)/admin/schools/schools-tab.tsx`
- Modify: `frontend/src/components/admin/schools/SchoolTable.tsx`
- Create: `frontend/src/components/admin/schools/demographic-form-dialog.tsx`
- Create: `frontend/src/app/(admin)/admin/schools/demographic-tab.tsx`

**Interfaces:**
- Produces:
  ```ts
  // demographic-form-dialog.tsx
  export interface DemographicFormDialogProps {
    open: boolean; onOpenChange: (o: boolean) => void
    schoolId?: string; initial?: SchoolDemographic | null
  }
  // demographic-tab.tsx: tabel demografi per tahun (DataTable) + tombol "Tambah Data"
  ```
- Sub-tab memakai `Tabs` shadcn: **Identitas** (SchoolTable) / **Siswa & Akademik** (DemographicTable). Filter: search (q), type, level, province; bulk bar (Hapus/Aktif/Nonaktif) via Task 8 komponen; tombol "Export XLSX".
- Demografi per tahun: kolom `Tahun Ajaran`, `Total Siswa`, `Total Rombel`, `Rincian` (grade_breakdown expandable/summary), aksi edit/hapus.

- [ ] **Step 1: baca `schools-tab.tsx`** — pahami struktur tab + query existing (listSchools, useQuery dll).
- [ ] **Step 2: tulis `demographic-form-dialog.tsx`** — field: `academic_year` (Input/Select tahun), `total_students` (number), `total_rombel` (number), grade_breakdown (dinamis: per jenjang, Input number). Submit → `upsertDemographic`/`updateDemographic`.
- [ ] **Step 3: tulis `demographic-tab.tsx`** — `useQuery` `listDemographics` (+ filter school_id dari tab yang sedang dibuka; untuk daftar sekolah aktif pilih salah satu/pertama — atau tampilkan semua + filter tahun). Tabel DataTable + tombol "+ Tambah".
- [ ] **Step 4: rework `schools-tab.tsx`** — wrapper 2 sub-tab; pindahkan SchoolTable di sub-tab Identitas; wire `onSelectionChange` → `useState<Set<string>>`; bulk bar di atas tabel; tombol "Export XLSX" (`exportXlsx` → `downloadBlob`); handle empty state & error banner.
- [ ] **Step 5: wire `SchoolTable`** — sambungkan selection state + tombol edit/hapus + notif toast.
- [ ] **Step 6: verifikasi** — `npx tsc --noEmit` + `npx eslint` → 0 error; smoke run.

---

### Task 11: Frontend — TargetSchoolsTab per (sekolah × tahun) + mode Tren

**Files:**
- Modify: `frontend/src/components/admin/schools/target-school-table.tsx`
- Modify: `frontend/src/app/(admin)/admin/schools/target-schools-tab.tsx`
- Create: `frontend/src/components/admin/schools/target-score-form-dialog.tsx`
- Create: `frontend/src/components/admin/schools/target-score-trend-panel.tsx`

**Interfaces:**
- Produces:
  ```ts
  // target-score-form-dialog.tsx
  export interface TargetScoreFormDialogProps {
    open: boolean; onOpenChange: (o: boolean) => void
    payungId?: string; payungName?: string; level?: string; maxDefault?: number
    initial?: TargetSchoolScore | null
  }
  // target-score-trend-panel.tsx: LineChart (Recharts) skor min/max vs tahun; delta badge
  ```
- Tabel **per (sekolah × tahun)**: bukan satu baris per payung — satu baris per `target_school_score`. Kolom: `Tahun Ajaran`, `Sekolah`, `Jenjang` (badge), `Min`/`Max`, `Skala` (max_total), `Δ Min`/`Δ Max` (badge vs tahun sebelumnya, hijau naik / orange turun), aksi edit/hapus + tombol "+ Baris Nilai".
- Filter: **Tahun Ajaran** (Select opsional, dari daftar tahun), **Jenjang** (SMP/SMA/UNIVERSITY), **Pencarian**. Tombol **"Mode Tren"** toggle → panel LineChart (min/max per tahun) memakai `getTrend`.
- List backend default include_inactive → badge `Nonaktif` bila payung nonaktif.

- [ ] **Step 1: baca `target-schools-tab.tsx` & `target-school-table.tsx`** — pahami data flow (one row per payung sekarang).
- [ ] **Step 2: tulis `target-score-form-dialog.tsx`** — field: `academic_year` (Select), `min_score`, `max_score`, `max_total_score` (number, default dari level: SMP/SMA=400, PT=700). Submit → `upsertScore`/`updateScore`.
- [ ] **Step 3: tulis `target-score-trend-panel.tsx`** — `useQuery` `getTrend(id)`; LineChart (X: academic_year, 2 line min/max, warna primary+orange, legend, tooltip). Empty state → pesan "Belum ada data nilai".
- [ ] **Step 4: rework `target-schools-tab.tsx`** — table per (sekolah×tahun) memakai `listScores` (+ filter), bukan payung; tombol "+ Baris Nilai", "Mode Tren", "Export XLSX", "Import XLSX" (upload → `importScores` → ImportResultCard), bulk-delete bar; query `listSchools` utk map payung↔nama; `defaultMaxTotal(level)`.
- [ ] **Step 5: verifikasi** — `npx tsc --noEmit` + `npx eslint` → 0 error; smoke run.

---

### Task 12: Frontend — admin-nav + verifikasi final

**Files:**
- Modify: `frontend/src/config/admin-nav.ts`
- Verify: seluruh chain (backend compile + test, frontend tsc + lint + vitest)

- [ ] **Step 1: fix `admin-nav.ts`** — item "Target Sekolah" arahkan ke `/admin/schools` (dengan query `?tab=targets` bila tersedia) menggantikan `/staff/target-schools`. Pastikan `/admin/schools/page.tsx` membaca `?tab=` → aktifkan tab `targets` (periksa `page.tsx` sudah dukung atau tambahkan).
- [ ] **Step 2: verifikasi backend** — `go build ./...`, `go vet ./...`, `go test ./...` (integration skip bila tanpa DB_URL) di `backend/`.
- [ ] **Step 3: verifikasi frontend** — `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` di `frontend/`.
- [ ] **Step 4: smoke test manual** — jalankan backend + frontend; cek alur: create sekolah (3 seksi) → tambah demografi → tambah nilai per tahun → mode tren → bulk delete → import/export xlsx.
- [ ] **Step 5: no commit** — laporkan ke user utk persetujuan sebelum commit/PR.



