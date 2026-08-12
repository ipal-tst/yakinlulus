# Master Akademik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade halaman `/admin/academic` (Master Akademik) menjadi halaman CRUD lengkap utk Jenjang/Kelas/Mapel/Kurikulum/Program dengan checkbox per-row + bulk action, export/import xlsx, tabel rapi (DataTable), dan filter detil — mengikuti `docs/admin-design/01-master-akademik.md`, `00-kerangka-template.md`, `api-kontrak-admin.md`.

**Architecture:** Backend menambah endpoint `[BARU]`: export xlsx per kind, bulk-delete, bulk-status (import+template sudah ada dari sesi sebelumnya). Frontend: setiap tab (Kelas, Mapel, Kurikulum, Program) direfactor ke `DataTable` ber-checkbox + bar aksi; `ExportDialog`/`ImportResultCard`/`FilterBar` di-shared; navigasi masuk `config/admin-nav.ts`.

**Tech Stack:** Go (Fiber, pgx, excelize/v2), Next.js 16 + React 19 + TS strict, shadcn tokens, TanStack Query, TanStack Table (DataTable). Verifikasi: `go build/vet/test`, `npx tsc --noEmit`, `npx eslint`, `npx vitest run`.

**Spesifikasi pendukung:** `docs/admin-design/01-master-akademik.md` · `docs/admin-design/00-kerangka-template.md` · `docs/admin-design/api-kontrak-admin.md` (§2).

## Global Constraints

- FRONTEND `frontend/**` WRITE bebas. Backend `backend/**` diubah utk endpoint export/bulk (sudah di-approve user 2026-08-10 utk grup akademik). **NO GIT COMMIT** sampai user izinkan.
- Bahasa Indonesia UI. `"use client"` utk hooks.
- Design tokens `design.md`: radius 12/16/20, primary `#2563EB`, accent Orange only badge, skeleton loading, error banner merah + Coba Lagi, empty state ilustrasi+CTA.
- Enum jenjang: `SD/SMP/SMA/SMK/UNIVERSITY` (konsisten). `code` unik per entitas.
- Tabel: **`DataTable`** (TanStack Table) — sticky header, sortable, resize, pagination 20/50/100; baris 44px; tooltip utk nama panjang (tidak terpotong/tumpang tindih).
- Setiap row punya **Checkbox** + select-all; bulk bar muncul saat ≥1 terpilih (Hapus/Aktifkan/Nonaktifkan).
- Jangan tambah dependency npm/go baru (excelize/v2, @tanstack/react-table, lucide sudah ada).
- Job log import: `ocr.import_job` + `ocr.import_error` (pola existing). Envelope `shared.Success`/`shared.Error`. Roles SUPER_ADMIN/STAFF.

---

## Keberadaan yang SUDAH DIPAKAI (jangan buat ulang)

- Backend `internal/academic/import_xlsx.go` — `ImportAcademic(ctx, kind, file, fileName)`, template. Endpoints `POST /academic/import/xlsx?kind=` + `GET /academic/import/template?kind=` **sudah ada**.
- Backend CRUD lengkap utk levels/grades/subjects/chapters/topics/learning-outcomes/curriculums/programs di `internal/academic/academic.go`.
- Frontend `services/academic-master.service.ts` — CRUD resmi.
- Frontend halaman import `(admin)/admin/academic/import/page.tsx` (3 tab: Hirarki/Kurikulum/Program) **sudah ada**.
- Komponen form dialogs `forms/*.tsx` (Level/Grade/Subject/Curriculum/Program/Chapter/Topic/LearningOutcome) **sudah ada**.
- `config/admin-nav.ts` — grup Master Akademik sudah ada (item akademik + import).
- `components/table/LevelTable|GradeTable|SubjectTable|CurriculumTable|ProgramTable` (tabel polos, tanpa checkbox).
- `components/data-display/data-table.tsx` — `DataTable` + `Column<T>`.

---

## Struktur File

```
backend/
├── internal/academic/export_xlsx.go        ◄── BARU (export per kind)
├── internal/academic/bulk.go               ◄── BARU (bulk-delete/bulk-status)
├── internal/academic/academic.go           ◄── MODIFY: register 3 route
└── internal/academic/export_xlsx_test.go   ◄── BARU

frontend/src/
├── services/academic-master.service.ts     ◄── EXTEND: exportXlsx, bulkDelete, bulkStatus
├── components/admin/academic/
│   ├── academic-excel.ts                    ◄── BARU (pure helper: downloadBlob, kindOptions)
│   ├── academic-excel.test.ts               ◄── BARU
│   ├── bulk-action-bar.tsx                  ◄── BARU (shared bottom bar)
│   └── import-result-card.tsx               ◄── BARU (shared report)
├── app/(admin)/admin/academic/
│   ├── page.tsx                             ◄── REWORK: tab + DataTable checkbox + filter + export/import menu
│   └── tabs/
│       ├── levels-tab.tsx                   ◄── BARU (atau extend LevelTable)
│       ├── grades-tab.tsx                   ◄── BARU
│       ├── subjects-tab.tsx                 ◄── BARU
│       ├── curriculums-tab.tsx              ◄── BARU
│       └── programs-tab.tsx                 ◄── BARU
└── config/admin-nav.ts                      ◄── MODIFY: item "Akademik" tetap; tambahkan item menu (opsional)
```

---

### Task 1: Backend — endpoint export xlsx per kind (TDD, helper + resolver)

**Files:**
- Create: `backend/internal/academic/export_xlsx.go`
- Create: `backend/internal/academic/export_xlsx_test.go`
- Modify: `backend/internal/academic/academic.go` (handler + route)

**Interfaces:**
- Consumes: existing repo `ListLevels`, `ListGrades`, `ListSubjects`, `ListCurriculums`, `ListPrograms`.
- Produces:
  ```go
  const (
    KindLevel=..., KindGrade=..., KindSubject=..., KindCurriculum=..., KindProgram=...
  )
  type ExportParams struct{ Kind string `json:"kind"`; Filters map[string]string `json:"filters,omitempty"` }
  func (s *Service) ExportXLSX(ctx, params) ([]byte, error)   // workbook bytes
  func (h *Handler) ExportAcademicHandler(c *fiber.Ctx) error // POST /academic/export/xlsx (body) + GET?kind= (query)
  ```
- Export header file (kind→columns+example row) mengikuti template import existing (`import_xlsx.go`).

- [ ] **Step 1: tulis failing test** `export_xlsx_test.go`:

```go
package academic

import (
	"context"
	"os"
	"testing"
	"github.com/xuri/excelize/v2"
)

func TestExportXLSXKindColumns(t *testing.T) {
	s := &Service{repo: &Repository{}} // stub; hanya test header lewat fungsi non-DB
	for kind, want := range map[string][]string{
		KindLevel:    {"CODE", "NAME", "URUTAN"},
		KindGrade:    {"JENJANG", "CODE", "NAME"},
		KindSubject:  {"CODE", "NAME", "DESKRIPSI"},
		KindCurriculum: {"CODE", "NAME", "VERSION"},
		KindProgram:  {"CODE", "NAME", "JENJANG"},
	} {
		b, err := exportWorkbook(kind) // func murni: buat sheet + header + contoh
		if err != nil { t.Fatalf("kind %s: %v", kind, err) }
		f, err := excelize.OpenReader(bytesToReadCloser(b))
		if err != nil { t.Fatalf("open: %v", err) }
		rows, _ := f.GetRows("Data")
		if len(rows) < 2 { t.Fatalf("kind %s: perlu header+contoh", kind) }
		for i, col := range want {
			if resultRows[0][i] != col { t.Fatalf("kind %s col %d = %s, want %s", kind, i, rows[0][i], col) }
		}
	}
}
```
(_Sesuaikan signature helper: `exportWorkbook(kind string) ([]byte, error)` menulis sheet `"Data"` dengan header + 1 baris contoh. Implementasikan `bytes` wrapper di test._)

- [ ] **Step 2: run, pastikan FAIL** — `cmd /c "go test ./internal/academic/... -run TestExportXLSXKindColumns"` (backend/) → fail "undefined exportWorkbook".

- [ ] **Step 3: implement `export_xlsx.go`** — `exportWorkbook(kind)` buat sheet `Data`, header utk 5 kind di atas + 1 baris contoh; `Service.ExportXLSX` list data aktual dari repo (bila non-kosong) ke worksheet header yang sama; abaikan DB error jadi sheet header saja (pola template existing).

- [ ] **Step 4: register route** di `academic.go RegisterRoutes`:

```go
g.Post("/export/xlsx", h.ExportAcademicHandler)   // group yang sama (SA,ST)
```

- [ ] **Step 5: run test PASS + build/vet** — `go build ./... && go vet ./internal/academic/... && go test ./internal/academic/...`
- [ ] **Step 6: no commit.**

---

### Task 2: Backend — bulk-delete & bulk-status

**Files:**
- Create: `backend/internal/academic/bulk.go`
- Modify: `backend/internal/academic/academic.go` (handler + routes)

**Interfaces:**
- Consumes: repo delete per kind (`DeleteLevel`, `DeleteGrade`, `DeleteSubject`, `DeleteCurriculum`, `DeleteProgram`) dan toggle via update (atau tambah repo `SetLevelActive` dst bila perlu).
- Produces:
  ```go
  type BulkRequest struct{ Kind string `json:"kind"`; IDs []uuid.UUID `json:"ids"`; IsActive *bool `json:"is_active,omitempty"` }
  type BulkResult struct{ Processed, Deleted, Failed int; Errors []ImportError }
  func (s *Service) BulkDelete(ctx, req) (*BulkResult, error)
  func (s *Service) BulkStatus(ctx, req) (*BulkResult, error)
  ```

- [ ] **Step 1: tulis failing test** (unit, stub repo atau dengan DB_URL skip):

```go
func TestBulkDeleteValidation(t *testing.T) {
	s := &Service{repo: &Repository{}}
	_, err := s.BulkDelete(context.Background(), BulkRequest{Kind: "BADKIND", IDs: []uuid.UUID{uuid.New()}})
	if err == nil { t.Fatal("expected error for unknown kind") }
}
```

- [ ] **Step 2: run FAIL** `go test ./internal/academic/... -run TestBulkDeleteValidation`
- [ ] **Step 3: implement `bulk.go`** — switch kind: delete masing2 (pakai repo delete); hitung Deleted/Failed; `IsActive != nil` → toggle via update repo (atau inline `UPDATE academic.<t> SET is_active=$2 WHERE id = ANY($1)`). Guard: kind tak dikenal → error 400.
- [ ] **Step 4: register routes:**

```go
g.Post("/bulk-delete", h.BulkDeleteHandler)
g.Post("/bulk-status", h.BulkStatusHandler)
```

- [ ] **Step 5: build/vet/test PASS**
- [ ] **Step 6: no commit**

---

### Task 3: Frontend — extend service + helper export/bulk

**Files:**
- Modify: `frontend/src/services/academic-master.service.ts`
- Create: `frontend/src/components/admin/academic/academic-excel.ts`
- Create: `frontend/src/components/admin/academic/academic-excel.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type AcademicKind = "level"|"grade"|"subject"|"curriculum"|"program";
  // service
  exportXlsx(kind: AcademicKind, ids?: string[]): Promise<Blob>;  // GET /academic/export/xlsx?kind=&ids=
  bulkDelete(kind, ids: string[]): Promise<BulkResult>;
  bulkStatus(kind, ids: string[], isActive: boolean): Promise<BulkResult>;
  // helper
  export interface BulkResult { processed: number; deleted: number; failed: number; errors: {row:number;message:string}[] }
  export function kindLabel(kind: AcademicKind): string;
  ```

- [ ] **Step 1: tulis helper test** `academic-excel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { kindLabel } from "./academic-excel";

describe("kindLabel", () => {
  it("maps kinds to indonesian labels", () => {
    expect(kindLabel("level")).toBe("Jenjang");
    expect(kindLabel("subject")).toBe("Mata Pelajaran");
  });
});
```

- [ ] **Step 2: run FAIL** `cmd /c "npx vitest run src/components/admin/academic/academic-excel.test.ts"` (frontend/)
- [ ] **Step 3: implement helper** `academic-excel.ts` (pure functions: `kindLabel`, `downloadBlob(blob, filename)` menggunakan anchor).
- [ ] **Step 4: extend service** `academic-master.service.ts` — `exportXlsx` (fetch blob dgn auth via `api` atau `fetch`+token — ikuti pola `question-import.service.ts`), `bulkDelete`, `bulkStatus`.
- [ ] **Step 5: run PASS + eslint** file yang diubah → 0 error.
- [ ] **Step 6: no commit**

---

### Task 4: Frontend — komponen shared BulkActionBar + ImportResultCard

**Files:**
- Create: `frontend/src/components/admin/academic/bulk-action-bar.tsx`
- Create: `frontend/src/components/admin/academic/import-result-card.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function BulkActionBar(props: { count: number; onDelete: () => void; onActivate: () => void; onDeactivate: () => void; onExport: () => void; busy?: boolean }): JSX.Element;
  export function ImportResultCard(props: { result: BulkResult }): JSX.Element;
  ```

- [ ] **Step 1–4: implement keduanya** (design: bar bawah sticky/hover, Badge jumlah terpilih + tombol aksi ikon+tulisan; result card: hijau processed/created, amber skipped, merah failed+list error). Pakai `Card`, `Badge`, `Button`, lucide.
- [ ] **Step 5: eslint** 0 error; `npx tsc --noEmit` clean (frontend/)
- [ ] **Step 6: no commit**

---

### Task 5: Frontend — tabel per tab dgn DataTable + checkbox

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/tabs/levels-tab.tsx`
- Create: `.../tabs/grades-tab.tsx`
- Create: `.../tabs/subjects-tab.tsx`
- Create: `.../tabs/curriculums-tab.tsx`
- Create: `.../tabs/programs-tab.tsx`
- Modify: `frontend/src/app/(admin)/admin/academic/page.tsx` (ganti render tabel polos → tabs)

**Interfaces:**
- Consumes: `academicMasterService` + `academic-excel` helper + `DataTable` + `BulkActionBar`.
- Produces: tiap tab = `DataTable` dgn kolom `Checkbox` (select-all indeterminate), kolom data, kolom Aksi (Edit/Delete), filter & export tombol.

- [ ] **Step 1: baca `components/table/LevelTable/GradeTable/SubjectTable/CurriculumTable/ProgramTable` + `data-display/data-table.tsx`** — petakan `Column<T>`.
- [ ] **Step 2: tulis `subjects-tab.tsx`** (contoh template utk tab lain) — useQuery `getSubjects`, `useState selected: Set<string>`, checkbox select-all, `Column<Subject>[]` dengan `id`, `code`, `name`, `category`, `is_active` (Switch), Aksi; `BulkActionBar` saat selection; tombol "Unduh Templat"/"Export"/"Import" di footer; error banner + skeleton + empty state.
- [ ] **Step 3: tulis `levels-tab.tsx`, `grades-tab.tsx`, `curriculums-tab.tsx`, `programs-tab.tsx`** dengan pola sama (resouse header biar konsisten; kolom sesuai entitas).
- [ ] **Step 4: rework `page.tsx`** — ganti render tabel polos dgn `Tabs: Kelas (hierarchy) / Mata Pelajaran / Kurikulum / Program`; tab Kelas menampilkan hierarki Jenjang→Kelas expandable (BabTable existing utk detail mapel bila dipakai); tiap tab komponen baru; pastikan form dialog existing tetap dipakai.
- [ ] **Step 5: tsc + eslint** (frontend/) → 0 error; vitest → all pass.

> Catatan: tab "Kelas" (hierarki) boleh mempertahankan struktur existing (LevelTable inline + BabTable) selama sudah memiliki **checkbox** di baris jenjang/kelas; jika sulit, tambahkan checkbox pada `LevelTable`/`GradeTable` via props `selectable` opsional.

- [ ] **Step 6: no commit**

---

### Task 6: Frontend — filter detil, export/import menu, nav

**Files:**
- Modify: `frontend/src/app/(admin)/admin/academic/page.tsx` (filter bar + export/import dropdown)
- Modify: `frontend/src/components/admin/academic/AcademicFilterBar.tsx` (perluas: Jenjang/Mapel/Status; opsional cascade)
- Modify: `frontend/src/config/admin-nav.ts` (opsional: item "Import Akademik" sudah ada; pastikan aktif)

**Interfaces:**
- Produces: filter `Jenjang ▾ Mapel ▾ Status ▾` + dropdown `Import ▾` (link `/admin/academic/import`) + `Export ▾` (per tab aktif via `exportXlsx`) + tombol `+ Tambah`.

- [ ] **Step 1–4:** hubungkan filter ke query state per tab; export memanggil `academicMasterService.exportXlsx(kind, selected)` → download filename `akademik-<kind>-<date>.xlsx`; import → link halaman import existing; tombol tambah membuka dialog form existing.
- [ ] **Step 5: tsc/eslint/vitest clean**
- [ ] **Step 6: no commit**

---

### Task 7: Verifikasi final

- [ ] **Step 1:** backend: `go build ./... && go vet ./... && go test ./internal/academic/...`
- [ ] **Step 2:** frontend: `cmd /c "npx tsc --noEmit"` (abaikan error pre-existing siswa), `cmd /c "npx eslint src/app/(admin)/admin/academic src/components/admin/academic src/services/academic-master.service.ts"` → 0 error, `cmd /c "npx vitest run"` → all pass
- [ ] **Step 3:** laporan pengguna: status, file baru/diubah, hasil check, concern. **No git.**

---

## Self-Review & Catatan

- **Scope**: plan ini hanya Master Akademik. Kelola Sekolah & Target Sekolah → plan terpisah (sesuai permintaan "3 modul" secara bertahap, Master dulu).
- **Import existing**: jangan duplikasi; hanya tambahkan export + bulk + rework tabel.
- **Backend test**: `exportWorkbook` dibuat murni (tanpa DB) utk unit test; `BulkDelete` guard kind.
- **tsc pre-existing**: error siswa (`siswa/materials`, `components/siswa/learn/*`) di luar scope — catat di laporan.
- **Tab "Kelas" hierarki**: boleh mempertahankan hierarchy existing asalkan checkbox per baris jenjang/kelas terpenuhi (modifikasi `props selectable` bila perlu).