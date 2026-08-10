# Admin Target Sekolah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halaman `/admin/schools` (Tabs: Daftar Sekolah + Target Sekolah): CRUD target sekolah/PT berbasis katalog dengan filter jenjang & provinsi, kolom nilai terendah/tertinggi diterima, dan tambah kolom `education_level` di `academic.school`.

**Architecture:** 1 migration (`academic.school.education_level`) → perluas `internal/target_schools` (join katalog, filter, `school_id`) + `internal/school` write-path diperbaiki ke `academic.school` → frontend `/admin/schools` reusing `SchoolTable`/`TargetSchoolTable` + `school-select` (search + create-in-form) → mappers murni + TanStack Query.

**Tech Stack:** Go (Fiber, pgx), Next.js 16 + React 19 + TS strict, TanStack Query, shadcn tokens (design.md), lucide-react. Verifikasi: `go build ./...` + `go vet ./...` + `go test ./internal/target_schools/...` + `npx tsc --noEmit` + `npm run lint` + `npm test` (Vitest, `.test.ts`, node env).

**Spec:** `docs/superpowers/specs/2026-08-10-admin-target-school-design.md`

## Global Constraints

- **FRONTEND `frontend/**` WRITE bebas.** Backend `backend/**` diubah hanya untuk task ini (sudah di-approve user 2026-08-10: migration + target_schools + school write-path).
- **DB state change** (`go run ./cmd/migrate/main.go up`, seeder) → WAJIB approval per-jalan. Jangan jalankan seeder sampai user approve.
- Migration terbaru = `218_*`. Migration baru = **`219_academic_school_education_level.up.sql`** + `.down.sql`.
- Enum jenjang konsisten: `SMP/SMA/UNIVERSITY` (sama dgn `academic.target_school.level`).
- Skala skor: `max_total_score` default SMP/SMA=400, UNIVERSITY=700 bila kolom 0/frontend.
- **Bahasa UI:** Indonesia. Ikon: lucide-react outline 16/20.
- Jangan tambah dependency npm / go baru (recharts tidak dipakai di halaman ini).
- Komponen baru ber-hooks → `"use client"`.
- Design tokens design.md: card radius 12–20, shadow small, primary `#2563EB`, skeleton loading.
- Keamanan: semua query parameterized; validasi level & `school_id` di server; nama target override dari katalog.
- **Deviations note (flag):** `internal/school` Create/Update/Delete sekarang menulis ke tabel legacy `schools` yang tidak ada di migration (POST /schools gagal di DB bersih). Fitur ini butuh insert katalog yang bekerja → write-path `internal/school` DIPERBAIKI ke `academic.school` sebagai bagian task (di luar batas-batas spec §8 yang tadinya menandai ini sebagai non-goal terpisah). Sudah tercakup dalam approval backend task ini.

---

## Struktur File

```
backend/
├── migrations/219_academic_school_education_level.up.sql   ◄── BARU
├── migrations/219_academic_school_education_level.down.sql ◄── BARU
├── internal/school/school.go                                ◄── MODIFY (write→academic.school, List/FindByID tampilkan education_level nyata)
├── internal/target_schools/target_schools.go                ◄── MODIFY (DTO+join+filters+school_id)
├── internal/target_schools/target_schools_test.go           ◄── BARU (repo integration, skip tanpa DB_URL)
└── cmd/seed_target_schools/main.go                          ◄── BARU (seeder PT umum; JALAN SETELAH APPROVAL)

frontend/src/
├── lib/target-school-mappers.ts                             ◄── BARU (pure, ditest)
├── lib/target-school-mappers.test.ts                        ◄── BARU
├── services/target-school.service.ts                        ◄── MODIFY (list params, school_id, provinces)
├── services/school.service.ts                               ◄── MODIFY (List return education_level + provinces helper)
├── services/target-school.service.test.ts                   ◄── MODIFY
├── components/admin/schools/
│   ├── school-select.tsx                                    ◄── BARU
│   ├── target-school-table.tsx                              ◄── BARU (hasil upgrade dari components/admin/target-schools)
│   └── target-school-form-dialog.tsx                        ◄── BARU (upgrade dari components/admin/target-schools)
├── app/(admin)/admin/schools/
│   ├── page.tsx                                             ◄── BARU (Tabs)
│   ├── schools-tab.tsx                                      ◄── BARU
│   └── target-schools-tab.tsx                               ◄── BARU
└── components/layout/sidebar.tsx                            ◄── MODIFY (SUPER_ADMIN: Kelola Sekolah → /admin/schools)
```

---

### Task 1: Migration `219_academic_school_education_level`

**Files:**
- Create: `backend/migrations/219_academic_school_education_level.up.sql`
- Create: `backend/migrations/219_academic_school_education_level.down.sql`

**Interfaces:** Produces kolom `academic.school.education_level varchar(20) NOT NULL DEFAULT 'SMA' CHECK (SMP|SMA|UNIVERSITY)`. Dipakai Task 2 (school.go) dan Task 3 (target_schools join).

- [ ] **Step 1: tulis up.sql**

```sql
-- Migration 219: education_level pada academic.school (katalog sekolah).
-- Enum identik dengan academic.target_school.level.

ALTER TABLE academic.school
    ADD COLUMN education_level varchar(20) NOT NULL DEFAULT 'SMA'
        CHECK (education_level IN ('SMP', 'SMA', 'UNIVERSITY'));
```

- [ ] **Step 2: tulis down.sql**

```sql
ALTER TABLE academic.school
    DROP COLUMN IF EXISTS education_level;
```

- [ ] **Step 3: (TIDAK dijalankan sekarang — butuh approval DB)** Jalankan saat user approve:
  `go run ./cmd/migrate/main.go up` (dari `backend/`)
  Expected: `Migration applied name=219_academic_school_education_level.up.sql`

- [ ] **Step 4: commit**

```bash
git add backend/migrations/219_academic_school_education_level.up.sql backend/migrations/219_academic_school_education_level.down.sql
git commit -m "feat(db): education_level di academic.school (migration 219)"
```

---

### Task 2: `internal/school` — write-path ke `academic.school` + level nyata

**Files:**
- Modify: `backend/internal/school/school.go`

**Interfaces:**
- Consumes: migration 219 (kolom `education_level`).
- Produces: `School.EducationLevel` terisi nilai nyata dari DB (bukan `''`); `Create`/`Update`/`UpdateStatus`/`Delete` menulis ke `academic.school`; `List` mengembalikan `school_name`, `npsn`, `education_level`, `province`, `city AS regency`, `status`.

- [ ] **Step 1: Update `List` & `FindByID` query** — ganti `'' AS education_level` → `COALESCE(s.education_level, '') AS education_level` (dua tempat: FindByID baris ~122, List baris ~146).

`backend/internal/school/school.go` FindByID & List:
```sql
SELECT s.id, s.name AS school_name,
       COALESCE(s.npsn, '') AS school_code, s.npsn,
       COALESCE(s.education_level, '') AS education_level, s.address, s.province, s.city AS regency, s.district,
       ...
```

- [ ] **Step 2: Buat `scanSchool` menerima `education_level`** — pastikan struct `School` sudah punya field `EducationLevel;` (cek definisi; bila kolom SQL tambah di SELECT, scan ke field harus cocok). Rabik bila `School.EducationLevel` belum ada: tambah `EducationLevel string \`json:"education_level"\``.

- [ ] **Step 3: `Create` → INSERT ke `academic.school`** (ganti tabel `schools`):
```go
func (r *Repository) Create(ctx context.Context, sc *School) (*School, error) {
	sc.CreatedAt = time.Now()
	sc.UpdatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO academic.school (npsn, name, education_level, province, city, district, address, phone, email, website, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
		ON CONFLICT (npsn) WHERE npsn IS NOT NULL AND deleted_at IS NULL DO NOTHING`,
		sc.NPSN, sc.SchoolName, sc.EducationLevel, sc.Province, sc.Regency, sc.District, sc.Address, sc.Phone, sc.Email, sc.Website)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, sc.ID)
}
```
> Periksa nama field struct `School` yang aktual (mungkin `SchoolName`, `Regency`, `Province`, `NPSN`, dst). Sesuaikan dgn definisi aktual; JANGAN asal pakai nama di atas tanpa verifikasi baris definisi.

- [ ] **Step 4: `Update` → UPDATE `academic.school`** (field sesuai struct aktual; wajib mengupdate `education_level`, `province`, `city`, `district`, `address`, `phone`, `email`, `website`, `is_active`, `updated_at=NOW()`). Hapus TODO `legacy schools`.

- [ ] **Step 5: `UpdateStatus` → UPDATE `academic.school SET is_active = $2`**; `Delete` → soft delete `SET deleted_at = NOW()`. Sesuaikan cek "active members" bila perlu (abaikan bila tabel relasi jadi tidak ada).

- [ ] **Step 6: Compile & lint**

Run: `cd backend && go build ./... && go vet ./...`
Expected: no error. Jika ada nama field tak cocok, perbaiki mapping.

- [ ] **Step 7: commit**

```bash
git add backend/internal/school/school.go
git commit -m "fix(school): write-path ke academic.school + education_level nyata"
```

---

### Task 3: `internal/target_schools` — join katalog + filter + school_id

**Files:**
- Modify: `backend/internal/target_schools/target_schools.go`
- Create: `backend/internal/target_schools/target_schools_test.go`

**Interfaces:**
- Consumes: migration 219, Task 2 (`academic.school.education_level`).
- Produces: DTO `TargetSchool` extended `{ school_id, province, city, education_level, district }`; `Repository.List(ctx, level, province, q)`; `Create`/`Update` terima `school_id` & resolve nama/wilayah dari katalog; validasi level konsisten; tes repo.

- [ ] **Step 1: DTO & request extended**

Di `TargetSchool` tambah:
```go
SchoolID      uuid.UUID `json:"school_id,omitempty"`
Province      string    `json:"province,omitempty"`
City          string    `json:"city,omitempty"`
District      string    `json:"district,omitempty"`
EducationLevel string   `json:"education_level,omitempty"`
```
Di `SaveSchoolRequest` tambah:
```go
SchoolID uuid.UUID `json:"school_id"`
```

- [ ] **Step 2: validateSaveRequest** — tambah: `req.SchoolID == uuid.Nil` → error "school_id required". Validasi level tetap.

- [ ] **Step 3: Repository.List — join + filters**

```go
func (r *Repository) List(ctx context.Context, level, province, q string) ([]TargetSchool, error) {
	where := "ts.is_active = true AND ts.deleted_at IS NULL"
	args := []interface{}{}
	n := 1
	if level != "" {
		where += fmt.Sprintf(" AND ts.level = $%d", n); args = append(args, level); n++
	}
	if province != "" {
		where += fmt.Sprintf(" AND COALESCE(s.province,'') ILIKE $%d", n); args = append(args, "%"+province+"%"); n++
	}
	if q != "" {
		where += fmt.Sprintf(" AND (ts.name ILIKE $%d OR COALESCE(s.name,'') ILIKE $%d)", n, n); args = append(args, "%"+q+"%"); n++
	}
	query := `SELECT ts.id, COALESCE(ts.name, s.name) AS name, ts.level, ts.min_score, ts.max_score, ts.max_total_score, ts.subjects, ts.academic_year, ts.is_active, ts.created_at, ts.updated_at,
	        ts.school_id, COALESCE(s.province,''), COALESCE(s.city,''), COALESCE(s.district,''), COALESCE(s.education_level,'')
	         FROM academic.target_school ts
	         LEFT JOIN academic.school s ON s.id = ts.school_id AND s.deleted_at IS NULL
	         WHERE ` + where + ` ORDER BY name`
	rows, err := r.pool.Query(ctx, query, args...)
	...
}
```

- [ ] **Step 4: `scanSchool` extended** — scan field join. `school_id` nullable → pakai `*uuid.UUID`.

- [ ] **Step 5: service `ListSchools(ctx, level, province, q)`** passthrough.

- [ ] **Step 6: repo helper resolve dari katalog**

```go
func (r *Repository) resolveSchool(ctx context.Context, schoolID uuid.UUID) (name string, level string, province, city, district string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT COALESCE(name,''), COALESCE(education_level,''), COALESCE(province,''), COALESCE(city,''), COALESCE(district,'')
		FROM academic.school WHERE id = $1 AND deleted_at IS NULL AND is_active = true`, schoolID).
		Scan(&name, &level, &province, &city, &district)
	return
}
```

- [ ] **Step 7: `Create`/`Update` — pakai school_id**

`Create`:
```go
func (r *Repository) Create(ctx context.Context, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil { return nil, err }
	name, lvl, prov, city, dist, err := r.resolveSchool(ctx, req.SchoolID)
	if err != nil { return nil, fiber.NewError(fiber.StatusBadRequest, "school not found or inactive") }
	if req.Level != "" && req.Level != lvl {
		return nil, fiber.NewError(fiber.StatusBadRequest, "level mismatch: target level must match school level")
	}
	req.Name = name // override — jangan percaya input bebas
	active := true
	if req.IsActive != nil { active = *req.IsActive }
	subjects, _ := json.Marshal(req.Subjects)
	var id uuid.UUID
	err = r.pool.QueryRow(ctx, `INSERT INTO academic.target_school
		(school_id, name, level, min_score, max_score, max_total_score, subjects, academic_year, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		req.SchoolID, req.Name, lvl, req.MinScore, req.MaxScore, req.MaxTotalScore, subjects, req.AcademicYear, active).Scan(&id)
	if err != nil { return nil, err }
	return r.GetByID(ctx, id)
}
```
`Update` analog (jangan ubah `school_id` saat update; validasi level dari katalog saat update juga).

- [ ] **Step 8: Handler List** — baca query `level`, `province`, `q`; `svc.ListSchools(ctx, level, province, q)`.

- [ ] **Step 9: repo test** — `backend/internal/target_schools/target_schools_test.go`:
  - helper `testPool(t)` (skip bila `DB_URL` kosong — pola `subscription_repository_test.go`)
  - `seedSchool(t)` → insert `academic.school` (level SMA, province "DKI Jakarta", city "Jakarta Selatan") + cleanup
  - `TestRepositoryListFilters`: create target (school_id), list `level=SMA` → ditemukan; `province="DKI"` → ditemukan; `province="Jawa Timur"` → kosong; `q` → match
  - `TestRepositoryCreateResolvesName`: create dgn school_id → `TargetSchool.Name == school.Name`, `Province` terisi
  - `TestRepositoryCreateLevelMismatch`: target level "SMP" + school level "SMA" → error

```go
package target_schools

import (
	"context"
	"os"
	"testing"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping target_schools integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil { t.Fatalf("connect: %v", err) }
	t.Cleanup(p.Close)
	return p
}

func seedSchool(t *testing.T, p *pgxpool.Pool, id uuid.UUID, name, lvl, province, city string) {
	t.Helper()
	ctx := context.Background()
	if _, err := p.Exec(ctx, `
		INSERT INTO academic.school (id, name, education_level, province, city, is_active)
		VALUES ($1,$2,$3,$4,$5,true)`, id, name, lvl, province, city); err != nil {
		t.Fatalf("seed school: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.school WHERE id = $1`, id) })
}

func TestRepositoryCreateResolvesName(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 1 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")

	s, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, Level: "SMA", MaxTotalScore: 400})
	if err != nil { t.Fatalf("Create: %v", err) }
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, s.ID) })
	if s.Name != "SMA Negeri 1 Jakarta" { t.Fatalf("name not resolved: %q", s.Name) }
	if s.Province != "DKI Jakarta" { t.Fatalf("province not resolved: %q", s.Province) }
}

func TestRepositoryCreateLevelMismatch(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 8 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")
	if _, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, Level: "SMP", MaxTotalScore: 400}); err == nil {
		t.Fatal("expected level mismatch error")
	}
}
```

(Test Level Mismatch PATH: `r.Create` validasi dulu `validateSaveRequest` yang butuh `Name` — periksa urut. Bila `validateSaveRequest` menolak kosong, isi `Name: "x"` pada request mismatch.)

- [ ] **Step 10: build + vet + test**

Run: `cd backend && go build ./... && go vet ./... && go test ./internal/target_schools/...`
Expected: PASS/SKIP (skip bila DB_URL kosong).

- [ ] **Step 11: commit**

```bash
git add backend/internal/target_schools/target_schools.go backend/internal/target_schools/target_schools_test.go
git commit -m "feat(target_schools): join katalog, filter level/province/q, school_id wajib"
```

---

### Task 4: Seeder PT umum (`cmd/seed_target_schools`)

**Files:**
- Create: `backend/cmd/seed_target_schools/main.go`

**Interfaces:** Inserts `academic.school` (UNIVERSITY) umum + `academic.target_school` (level UNIVERSITY) terkait. DILARANG jalan tanpa approval DB terpisah.

- [ ] **Step 1: tulis main.go** (copy struktur `cmd/seed_academic/main.go` — config.Load, pool):
  - Insert ~10 universitas umum (mis. Universitas Indonesia, Institut Teknologi Bandung, Universitas Gadjah Mada, Institut Teknologi Sepuluh Nopember, Universitas Airlangga, Universitas Brawijaya, Universitas Diponegoro, Universitas Padjadjaran, Universitas Negeri Jakarta, Politeknik Negeri Jakarta) dgn `education_level='UNIVERSITY'`, `province`/`city`.
  - Untuk tiap universitas: `INSERT INTO academic.target_school (school_id, name, level, min_score, max_score, max_total_score, academic_year, is_active)` level UNIVERSITY, `max_total_score=700`, min/max contoh (mis. min 500, max 650), `is_active=true`.
  - Idempotent: cek duplikat by `name` sebelum insert (atau hapus-trus-insert dlm transaksi).
  - Log count.

- [ ] **Step 2: build**

Run: `cd backend && go build ./cmd/seed_target_schools`
Expected: no error.

- [ ] **Step 3: commit**

```bash
git add backend/cmd/seed_target_schools/main.go
git commit -m "feat(seed): seeder universitas umum (PT) + target school"
```

- [ ] **Step 4: TIDAK DIJALANKAN sekarang** — akan jalankan setelah user approve DB: `go run ./cmd/seed_target_schools` (dari `backend/`).

---

### Task 5: Frontend — mapper murni + tes (TDD)

**Files:**
- Create: `frontend/src/lib/target-school-mappers.ts`
- Create: `frontend/src/lib/target-school-mappers.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TargetRow = { id, name, level, province, city, minScore, maxScore, maxTotalScore, academicYear, isActive, subjects }
  export function dumpTargetRow(t: TargetSchool): TargetRow
  export function formatScoreRange(min?: number, max?: number, total?: number, level?: string): string  // "320–380 / 400"; PT default 700; kosong → "-"
  export function sortedProvinces(schools: { province?: string }[]): string[]   // dedup nonempty + sort
  export function defaultMaxTotal(level: string): number  // SMP/SMA→400, UNIVERSITY→700
  ```

- [ ] **Step 1: tulis failing test**

```ts
import { describe, it, expect } from "vitest";
import { dumpTargetRow, formatScoreRange, sortedProvinces, defaultMaxTotal } from "./target-school-mappers";
import { TargetSchool } from "@/services/target-school.service";

const t = { id: "a", name: "SMA N 1", level: "SMA", min_score: 320, max_score: 380, max_total_score: 400, subjects: ["Mat"], academic_year: "2025/2026", is_active: true, created_at: "", updated_at: "" } as TargetSchool;

describe("dumpTargetRow", () => {
  it("maps backend fields", () => {
    expect(dumpTargetRow(t)).toEqual({
      id: "a", name: "SMA N 1", level: "SMA", province: "", city: "",
      minScore: 320, maxScore: 380, maxTotalScore: 400, academicYear: "2025/2026", isActive: true, subjects: ["Mat"],
    });
  });
});

describe("formatScoreRange", () => {
  it("renders min–max / total", () => {
    expect(formatScoreRange(320, 380, 400, "SMA")).toBe("320–380 / 400");
  });
  it("fallback max_total by level", () => {
    expect(formatScoreRange(500, 650, 0, "UNIVERSITY")).toBe("500–650 / 700");
  });
  it("empty for no scores", () => {
    expect(formatScoreRange(undefined, undefined, 400, "SMA")).toBe("-");
  });
});

describe("sortedProvinces", () => {
  it("dedups and sorts non-empty", () => {
    expect(sortedProvinces([{ province: "Jawa Barat" }, { province: "" }, { province: "DKI Jakarta" }, { province: "Jawa Barat" }]))
      .toEqual(["DKI Jakarta", "Jawa Barat"]);
  });
});

describe("defaultMaxTotal", () => {
  it("SMP/SMA 400, UNIVERSITY 700", () => {
    expect(defaultMaxTotal("SMA")).toBe(400);
    expect(defaultMaxTotal("UNIVERSITY")).toBe(700);
  });
});
```

- [ ] **Step 2: run, pastikan FAIL** `cmd /c "npx vitest run src/lib/target-school-mappers.test.ts"` (dari `frontend/`) → Cannot find module.

- [ ] **Step 3: implement**

```ts
import { TargetSchool } from "@/services/target-school.service";

export type TargetRow = {
  id: string; name: string; level: string; province: string; city: string;
  minScore?: number; maxScore?: number; maxTotalScore: number; academicYear?: string; isActive: boolean; subjects: string[];
};

// province/city diisi backend via join katalog (Task 3). Type di-extend Task 6;
// mapper terima tipe gabungan supaya Task 5 compile mandiri tanpa `any`.
type TargetSchoolResolved = TargetSchool & { province?: string; city?: string; district?: string };

export function dumpTargetRow(t: TargetSchoolResolved): TargetRow {
  return {
    id: t.id, name: t.name, level: t.level,
    province: t.province ?? "", city: t.city ?? "",
    minScore: t.min_score, maxScore: t.max_score, maxTotalScore: t.max_total_score,
    academicYear: t.academic_year, isActive: t.is_active, subjects: t.subjects ?? [],
  };
}

export function defaultMaxTotal(level: string): number {
  return level === "UNIVERSITY" ? 700 : 400;
}

export function formatScoreRange(min?: number, max?: number, total?: number, level?: string): string {
  if (min === undefined || max === undefined) return "-";
  const t = total && total > 0 ? total : defaultMaxTotal(level ?? "");
  return `${min}–${max} / ${t}`;
}

export function sortedProvinces(schools: { province?: string }[]): string[] {
  return Array.from(new Set(schools.map((s) => s.province ?? "").filter(Boolean))).sort((a, b) => a.localeCompare(b, "id"));
}
```

- [ ] **Step 4: run PASS** `cmd /c "npx vitest run src/lib/target-school-mappers.test.ts"`

- [ ] **Step 5: lint** `cmd /c "npx eslint src/lib/target-school-mappers.ts src/lib/target-school-mappers.test.ts"` → 0 error.

- [ ] **Step 6: commit** `git add frontend/src/lib/target-school-mappers.ts frontend/src/lib/target-school-mappers.test.ts; git commit -m "feat(target-school): mapper murni + tes"`

---

### Task 6: Frontend — services extend + tes

**Files:**
- Modify: `frontend/src/services/target-school.service.ts`
- Modify: `frontend/src/services/target-school.service.test.ts`
- Modify: `frontend/src/services/school.service.ts`

**Interfaces:**
- Consumes: Task 5 `sortedProvinces` (via school list atau local).
- Produces: `targetSchoolService.listTargetSchools(params?: {level?, province?, q?})`; `TargetSchool` type tambah `school_id?, province?, city?`; `TargetSchoolPayload` tambah `school_id?`.
- `schoolService.listSchools` → kembalikan `education_level` (dari backend yang sudah nyata).

- [ ] **Step 1: perluas type & list params di `target-school.service.ts`**

```ts
export interface TargetSchool {
  id: string;
  name: string;
  level: string;
  school_id?: string;
  province?: string;
  city?: string;
  district?: string;
  min_score?: number;
  max_score?: number;
  max_total_score: number;
  subjects: string[];
  academic_year?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface TargetSchoolPayload {
  name?: string;
  level?: string;
  school_id: string;
  min_score?: number;
  max_score?: number;
  max_total_score: number;
  subjects?: string[];
  academic_year?: string;
  is_active?: boolean;
}
export async listTargetSchools(params?: { level?: string; province?: string; q?: string }): Promise<TargetSchool[]> {
  return api<TargetSchool[]>("/target-schools", { params });
}
```

- [ ] **Step 2: update service test** — add: `listTargetSchools({level:"SMA",province:"DKI Jakarta",q:"Negeri"})` → api dipped `params`. Render existing mock ok.

- [ ] **Step 3: `school.service.ts`** — pastikan `School` type & mapping tetap; `listSchools` kirim params bila ada; tambahkan komentar bahwa `education_level` kini nyata dari backend.

- [ ] **Step 4: run tests** `cmd /c "npx vitest run src/services/target-school.service.test.ts src/services/school.service.test.ts"` → PASS.

- [ ] **Step 5: lint** file yg diubah → 0 error.

- [ ] **Step 6: commit** `feat(target-school): services extend (params list, school_id)`

---

### Task 7: Frontend — komponen `school-select`, tabel & form upgrade

**Files:**
- Create: `frontend/src/components/admin/schools/school-select.tsx`
- Create: `frontend/src/components/admin/schools/target-school-table.tsx`
- Create: `frontend/src/components/admin/schools/target-school-form-dialog.tsx`

**Interfaces:**
- Consumes: `schoolService.listSchools`, `targetSchoolService`, Task 5 mappers, shadcn Select/Dialog/Input/Button/Badge, TanStack Query (parent mengelola data).
- Produces: `SchoolSelect({ level, value, onChange, onCreateSchool })`; `TargetSchoolTable({ schools, onEdit, onDelete, onToggle })`; `TargetSchoolFormDialog({ open, onOpenChange, initial?, level, onSubmit })`.

- [ ] **Step 1: `school-select.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { schoolService, School } from "@/services/school.service";

interface Props {
  level?: string;
  value?: string;
  onChange: (schoolId: string) => void;
  onCreateSchool: () => void;
}

export function SchoolSelect({ level, value, onChange, onCreateSchool }: Props) {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);

  const load = async () => {
    const all = await schoolService.listSchools({ limit: 500 });
    setSchools(level ? all.filter((s) => (s.education_level ?? "") === level) : all);
  };

  return (
    <div className="flex items-end gap-2">
      <Select
        value={value}
        open={open}
        onOpenChange={(o) => { setOpen(o); if (o) load(); }}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full"><SelectValue placeholder="Pilih sekolah/PT dari katalog" /></SelectTrigger>
        <SelectContent>
          {schools.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name} {s.province ? `— ${s.province}` : ""}
            </SelectItem>
          ))}
          {schools.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Tidak ada sekolah {level ?? ""}. Buat baru dulu.</p>}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={onCreateSchool} title="Buat sekolah/PT baru di katalog">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: `target-school-table.tsx`** — upgrade dari `components/admin/target-schools/TargetSchoolTable.tsx`. Tambah prop `onEdit`, `onToggle`. Kolom: Nama (name + badge jenjang + province·city sub), Nilai Terendah Diterima (`formatScoreRange` min), Nilai Tertinggi Diterima (`max`), Tahun, Status, Aksi (Edit/Hapus/Nonaktifkan). Pakai `formatScoreRange` dari mappers.

- [ ] **Step 3: `target-school-form-dialog.tsx`** — upgrade dari `components/admin/target-schools/TargetSchoolFormDialog.tsx`.
  - Field: `SchoolSelect` (level-aware), `min_score`, `max_score` (Input number), `academic_year`, `subjects` (chips), level Select (auto dari sekolah bila sekolah terpilih).
  - Validasi client: min ≤ max ≤ maxTotal(default level).
  - Bila mode create-in-form (tombol `+ Baru` di SchoolSelect): buka modal/origin create school (nama, level, province, city, npsn opsional) → `schoolService.createSchool` → pilih hasilnya → refresh.

Periksa struktur `TargetSchoolFormDialog.tsx` existing di `components/admin/target-schools/` — gunakan pola yang sama (Dialog + form), lalu modifikasi agar field sesuai.

- [ ] **Step 4: lint + tsc** `cmd /c "npx tsc --noEmit"` + eslint file baru → 0 error.

- [ ] **Step 5: commit** `feat(target-school): komponen tabel, form dialog, school-select`

---

### Task 8: Frontend — halaman `/admin/schools` + sidebar

**Files:**
- Create: `frontend/src/app/(admin)/admin/schools/page.tsx`
- Create: `frontend/src/app/(admin)/admin/schools/schools-tab.tsx`
- Create: `frontend/src/app/(admin)/admin/schools/target-schools-tab.tsx`
- Modify: `frontend/src/components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: Task 6/7 komponen + service, `Tabs`, `PageHeader`, TanStack Query.
- Produces: `/admin/schools` (2 tab). Tab Target Sekolah: filter bar (jenjang, provinsi derivasi katalog, search) + tabel + form dialog.

- [ ] **Step 1: `page.tsx` — Tabs shell**

```tsx
"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SchoolsTab } from "./schools-tab";
import { TargetSchoolsTab } from "./target-schools-tab";

export default function AdminSchoolsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Kelola Sekolah" description="Daftar sekolah/PT katalog dan target sekolah untuk acuan siswa." />
        <Tabs defaultValue="schools">
          <TabsList>
            <TabsTrigger value="schools">Daftar Sekolah</TabsTrigger>
            <TabsTrigger value="targets">Target Sekolah</TabsTrigger>
          </TabsList>
          <TabsContent value="schools"><SchoolsTab /></TabsContent>
          <TabsContent value="targets"><TargetSchoolsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: `schools-tab.tsx`** — reuse seluruh isi `frontend/src/app/(staff)/staff/schools/SchoolTable` flow: query `schoolService.listSchools()` key `["admin-schools"]`, `SchoolTable` + confirm dialog. Bisa di-copy dari `/staff/schools/page.tsx` bagian Daftar Sekolah (potong bagian Target PTN).

- [ ] **Step 3: `target-schools-tab.tsx`** — query `targetSchoolService.listTargetSchools({level,province,q})` key `["admin-target-schools", level, province, q]` + `schoolService.listSchools({limit:500})` for provinces (via `sortedProvinces`); filter bar Jenjang + Provinsi; tabel `TargetSchoolTable`; `TargetSchoolFormDialog`; mutations create/update/delete/toggle dengan invalidation. Filter bar mengikuti pola `AcademicFilterBar` (w-[180px] SelectTrigger dsb).

- [ ] **Step 4: `sidebar.tsx`** — SUPER_ADMIN_NAV & STAFF_NAV: ubah `Kelola Sekolah` href `/staff/schools` → `/admin/schools`? YA untuk SUPER_ADMIN; STAFF tetap `/staff/schools`. Periksa definisi nav di sidebar dan sesuaikan hanya SUPER_ADMIN entry:

```ts
{ title: "Kelola Sekolah", href: "/admin/schools", icon: Building2 },
```

- [ ] **Step 5: tsc + lint** `cmd /c "npx tsc --noEmit"` + eslint file baru di `frontend/` → 0 error (file baru).

- [ ] **Step 6: commit** `feat(admin): halaman /admin/schools (Daftar Sekolah + Target Sekolah)`

---

### Task 9: Verifikasi final + seleksi commit

**Files:** none (artefak sudah di commit task).

- [ ] **Step 1: full check frontend** (dari `frontend/`):
  `cmd /c "npx tsc --noEmit"` → clean
  `cmd /c "npx vitest run"` → all pass

- [ ] **Step 2: full check backend** (dari `backend/`):
  `go build ./...` → clean
  `go vet ./...` → clean

- [ ] **Step 3: git status** — pastikan hanya file task ini yang di-commit; jangan commit perubahan tak terkait (`frontend/src/components/layout/sidebar.tsx` lainnya, `docs/frontend/*`, siswa membership, dll).

---

## Self-Review & Catatan

- **Backend test skips** di CI lokal tanpa DB_URL — pola existing (`subscription_repository_test.go`). OK.
- **`validateSaveRequest` & Create mismatch**: bila `validateSaveRequest` menolak `Name` kosong dan Create dipanggil dgn `SchoolID` (name masih kosong), urut validasi perlu disesuaikan: validasi request (level, max_total) → resolve katalog → override name → masih boleh lolos. Implementor harap cek alurnya saat Edit.
- **Migration commit tanpa jalan** aman: `AutoMigrate` hanya menerapkan saat `up` dijalankan.
- Seeder & migration TIDAK jalan sampai approval DB user per-jalan (AGENTS.md).