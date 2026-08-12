# Import Excel Master Akademik & Sekolah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax. **NO GIT COMMIT DURANTE SESI INI** (perintah user: eksekusi git menyusul).

**Goal:** Import Excel untuk semua modul master akademik (Jenjang/Kelas/Mapel/Bab/Topik/CP + Kurikulum/Program) + Sekolah & Target Sekolah: template generatif, upload → preview → submit, job log, skip duplikat.

**Architecture:** Helper `internal/importxlsx` (parse excelize/v2 + resolve kode/nama + skip/insert + job log) → file `import_xlsx.go` per modul (academic, school, target_schools) → endpoint `POST .../import/xlsx` + `GET .../import/template`. Frontend: `academic-excel-parser.ts` (preview di client) + service import + halaman `/admin/academic/import` (tab Hirarki/Kurikulum/Program) + tab Import di `/admin/schools`.

**Tech Stack:** Go (excelize/v2 sudah ada), Fiber, pgx. Next.js/React/TS strict, exceljs+sheetjs (sudah ada), TanStack Query. Verifikasi: `go build/vet/test`, `tsc`, `eslint`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-08-10-import-master-akademik-design.md`

## Global Constraints

- FRONTEND `frontend/**` WRITE bebas. Backend `backend/**` diubah untuk task ini (import endpoints, helper — sudah di-approve user; TIDAK ada migration baru).
- **NO GIT COMMIT** sampai user izinkan.
- Jangan tambah dependency npm/go baru (excelize/v2, exceljs, sheetjs, xlsx sudah ada).
- Enum level: SMP/SMA/UNIVERSITY (konsisten). Skor: max_total default SMP/SMA=400, UNIVERSITY=700.
- Bahasa Indonesia UI. `"use client"` untuk hooks. Skeleton/error banner/empty state.
- Template: ENDPOINT GENERATIF (stream xlsx dgn baris contoh).
- Duplikat → SKIP + report (bukan upsert). Resolve induk kode/nama + auto-create.
- Job log: `ocr.import_job` (module ACADEMIC/OTHER, source EXCEL), `ocr.import_error` (137) utk per-baris error. Envelope `shared.Success`/`shared.Error`. Roles SUPER_ADMIN/STAFF.

---

### Task 1: `internal/importxlsx` — helper shared + unit test

**Files:**
- Create: `backend/internal/importxlsx/importxlsx.go`
- Create: `backend/internal/importxlsx/importxlsx_test.go`

**Interfaces:**
- Produces (dipakai Task 2–4):
  ```go
  type ImportRow struct { RowNum int; Cells map[string]string }
  func Parse(reader io.Reader, sheetName string) ([]ImportRow, error)
  func FirstSheet(reader io.Reader) (string, error)
  func ResolveByNameOrCode(ctx, pool, table, code, name string) (uuid.UUID, bool, error)
  func RetrieveByCode(ctx, pool, table, code string) (uuid.UUID, bool, error)
  func InsertOnConflictDoNothing(ctx, pool, table, codeCol string, cols []string, vals []any) (sql.Result, error)
  func Job(...) // create ocr.import_job + ocr.import_file (module, job_number unik, source EXCEL) → (jobID, err)
  func LogError(ctx, pool, jobID, rowNum, message)
  func CompleteJob(ctx, pool, jobID, failed bool)
  ```
  Job fields sesuai `migrations/130_import_job.up.sql` + `ocr.import_error` (137).

- [ ] Step 1–4 (TDD): `Parse` (excelize OpenReader, header baris-1, cells map label-uppercase), `ResolveByNameOrCode` fallback `RetrieveByCode`, unit test pakai xlsx bytes in-memory (excelize.NewFile utk buat file). `go test ./internal/importxlsx/...`
- [ ] Step 5: no commit.

### Task 2: `internal/academic/import_xlsx.go` — Grup A (Hirarki) + B (Kurikulum/Program)

**Files:**
- Create: `backend/internal/academic/import_xlsx.go`
- Modify: `backend/internal/academic/academic.go` (handler: register routes import)

**Interfaces:**
- Consumes: Task 1 helpers; existing repo methods (`CreateGrade` auto-create level, `CreateSubject` auto-link, `CreateChapter`, `CreateTopic`, `CreateLearningOutcome`, `CreateCurriculum`, `CreateProgram`).
- Produces:
  ```go
  func (s *Service) ImportAcademic(ctx, kind, file io.Reader) (*ImportResult, error)
  func (h *Handler) ImportAcademicHandler(c *fiber.Ctx) error      // POST /academic/import/xlsx, form "file"
  func (h *Handler) ImportTemplateHandler(c *fiber.Ctx) error      // GET /academic/import/template?kind=...
  type ImportResult struct { JobID, Created, Skipped, Failed int; Errors []ImportError }
  type ImportError struct { Row int; Message string }
  const kindLevel/Grade/Subject/Chapter/Topic/LO/Curriculum/Program
  ```
- Multi-sheet (Grup A): sheet `Jenjang`,`Kelas`,`Mapel`,`Bab`,`Topik`,`Capaian Pembelajaran`. Per-sheet resolve induk (Kelas→Jenjang, Mapel→Jenjang+, Bab→Mapel, Topik→Bab, CP→Topik) + auto-create. Grup B: sheet `Kurikulum`/`Program`.
- Skip duplikat by code/name → `ocr.import_error` row "skipped: sudah ada".
- Template: stream xlsx dgn kolom + 1 baris contoh (pakai `excelize.NewFile`).

### Task 3: `internal/school/import_xlsx.go` + `internal/target_schools/import_xlsx.go` — Grup C

**Files:**
- Create: `backend/internal/school/import_xlsx.go`, `backend/internal/target_schools/import_xlsx.go`
- Modify: `backend/internal/school/school.go`, `backend/internal/target_schools/target_schools.go` (register routes)

**Interfaces:**
- Consumes: Task 1; `internal/school` repo (Create ke academic.school), `internal/target_schools` repo (Create dgn school_id).
- Produces:
  ```go
  // school
  func (s *Service) ImportSchools(ctx, file io.Reader) (*ImportResult, error)
  func (h *Handler) ImportSchoolsHandler / ImportTemplateHandler // POST /schools/import/xlsx, GET /schools/import/template
  // target_schools
  func (s *Service) ImportTargets(ctx, file io.Reader) (*ImportResult, error)
  func (h *Handler) ImportTargetsHandler / ImportTemplateHandler // POST /target-schools/import/xlsx, GET /target-schools/import/template
  ```
- Sekolah col: `Nama`,`NPSN`,`Jenjang`(SMP/SMA/UNIVERSITY),`Provinsi`,`Kota`,`Alamat`,`Telp`,`Email`; skip by npsn/name.
- Target col: `Sekolah`(resolve katalog, auto-create ke academic.school bila kosong),`Jenjang`,`Nilai Terendah Diterima`,`Nilai Tertinggi Diterima`,`Skor Maksimal`(default per level),`Mata Pelajaran`(koma),`Tahun Ajaran`. Validasi min≤max≤total, level enum.
- Routes daftar di `api_list.md`.

### Task 4: Frontend services + parser + test

**Files:**
- Create: `frontend/src/services/academic-master-import.service.ts`, `frontend/src/services/academic-excel-parser.ts`, + `.test.ts`
- Modify: `frontend/src/services/school.service.ts`, `frontend/src/services/target-school.service.ts` (lagi: tambah downloadImportTemplate/importFile)

**Interfaces:**
- Produces (Task 5–6):
  ```ts
  // academic-master-import.service.ts
  export type ImportKind = "level"|"grade"|"subject"|"chapter"|"topic"|"learning_outcome"|"curriculum"|"program";
  export interface ImportResult { job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }
  export const academicImportService = {
    downloadTemplate(kind, sheet): Promise<Blob>, // GET /academic/import/template?kind=
    importFile(kind, file): Promise<ImportResult>, // POST /academic/import/xlsx multipart FormData
  }
  // academic-excel-parser.ts
  export interface ParsedRow { rowNum: number; values: Record<string,string>; valid: boolean; warnings: string[]; errors: string[] }
  export function parseAcademicSheet(file, kind): Promise<ParsedRow[]>  // exceljs/sheetjs, validasi per kind
  // school.service / target-school.service
  downloadSchoolTemplate(): Promise<Blob>; importSchools(file): Promise<ImportResult>;
  downloadTargetTemplate(): Promise<Blob>; importTargets(file): Promise<ImportResult>;
  ```
- `api()` di `lib/api.ts` — periksa dukungan blob & multipart; tambah opsi bila perlu (laporkan).

### Task 5: Halaman `/admin/academic/import` (tab per grup)

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/import/page.tsx` (+ komponen `ImportUploader`, `ImportPreviewTable`, `ImportResultCard` bila perlu)

**Interfaces:**
- Consumes: Task 4 services/parser.
- Produces: halaman 3 tab (Hirarki: pilih sheet → parse+preview; Kurikulum; Program): Unduh Templat → Upload → Preview (badge valid/warning/error) → Submit → Result card (created/skipped/failed + errors list). Skeleton/error/empty.

### Task 6: Tab Import di `/admin/schools` + sidebar nav

**Files:**
- Modify: `frontend/src/app/(admin)/admin/schools/page.tsx` (tambah tab `Import Sekolah`), `schools-tab.tsx` atau file baru `schools-import-tab.tsx`

**Interfaces:**
- Consumes: Task 4.
- Produces: tab ke-3 di `/admin/schools`: Unduh Templat Sekolah → Upload → Preview → Import; sama untuk Target Sekolah.

### Task 7: Verifikasi final

Run (no commit):
- backend: `go build ./... && go vet ./... && go test ./internal/importxlsx/...`
- frontend: `npx tsc --noEmit`; `npx eslint <file baru>`; `npx vitest run`