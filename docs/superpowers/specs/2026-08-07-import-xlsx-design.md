# Import XLSX Template — Bank Soal & Materi Pelajaran — Design

Date: 2026-08-07

## Goal

Provide an Excel (.xlsx) template + import feature to create **questions (bank soal)** and
**learning materials (materi pelajaran)** in bulk, mapping directly to the existing
block-content schema **without any database change**.

## Context

- Questions live in a block-content model: `question.question` → `question.question_version`
  → `question.question_block` (11 types: PARAGRAPH, IMAGE, TABLE, LATEX, SVG, AUDIO, VIDEO,
  GRAPH, CODE, HTML, MARKDOWN) with `block_order`; options in `question.question_option` →
  `question.option_block`; plus `explanation`, `hint`, `solution_step`, `question_metadata`.
  A stimulus is just `question_block` #0. This supports rich "text–image–text" sequences.
- Materials live in the generic `content` table + `metadata` JSONB (content_format,
  estimated_duration, is_preview), via the `/materials` CRUD.
- Existing `/questions/import` only accepts a **JSON array** (no file, no parsing) and reuses
  `Create` which writes a **single** `question_block`. The frontend import wizard is 100% mocked.
- No XLSX library is currently installed → add `github.com/xuri/excelize/v2` (backend dep only).

## Non-negotiables

- **No DB schema change.** Only backend code (handlers/services/repo) + frontend.
- Blocks are always inserted in the user-entered order (`block_order` = column order).
- Parameterized SQL only; `uuid.Parse` on ids; per-row validation; audit per row.
- Files parsed in-memory (no persistence of uploaded xlsx required).
- Difficulty values: `EASY / MEDIUM / HARD / EXPERT` (template labels: Mudah/Sedang/Sulit/Paling Sulit).

## Template — Sheet "Soal" (1 baris = 1 soal)

Columns (headers in a fixed order):

| # | Column | Type | Req | Notes |
|---|--------|------|-----|-------|
| 1 | No (opsional) | text | - | row number only |
| 2 | Kode (opsional) | text | - | overrides auto code |
| 3 | Mapel | text | yes | name or code; resolved via `academic.subject` ILIKE; error if not found |
| 4 | Kelas (opsional) | text | - | name filter hint, not stored |
| 5 | Bab (opsional) | text | - | chapter name hint |
| 6 | Tipe Soal | text | yes | one of 8 valid types |
| 7 | Kesulitan | text | yes | EASY/MEDIUM/HARD (map Mudah/Sedang/Sulit) |
| 8..(8+2N) | **Blok i – Tipe** / **Blok i – Isi** for i=1..N (N=8) | text | - | each block = (type, content) pair, filled in order; empty pairs skipped but gaps preserved by column order |
| … | Opsi A … H (isi opsional) | text | as needed | option content; label A–H by column position |
| +1 | Kunci Jawaban | text | yes | letters, e.g. `B` or `AB` (multi) |
| +1 | Skor (opsional) | number | - | question score (default 1) |
| +1 | Skor Negatif (opsional) | number | - | negative score |
| +1 | Pembahasan (opsional) | text | - | explanation block |
| +1 | Bloom (opsional) | text | - | mapped to metadata blooms_level |
| +1 | Bahasa (opsional) | text | - | default `id` |

**Block pairs:** each `Blok i` is two adjacent columns (`…Tipe`, `…Isi`). A row like
Blok1=(PARAGRAPH, "kalimat"), Blok2=(IMAGE, "gambar"), Blok3=(PARAGRAPH, "kalimat") → three
`question_block` rows at order 0,1,2 (text–image–text).

**Image references:** `IMAGE` block `Isi` holds an existing `media.asset` id OR a filename
label. If it is a valid UUID that resolves, `asset_id` is set; otherwise the block is still
inserted with `asset_id NULL` and its `content` set to the reference (placeholder for later
image swap).

## Template — Sheet "Materi"

Columns:

| # | Column | Req | Notes |
|---|--------|-----|-------|
| 1 | Mapel | yes | resolve by name/code |
| 2 | Kelas (opsional) | - | hint |
| 3 | Bab (opsional) | - | hint |
| 4 | Subbab/Topik | - | topic name |
| 5 | Judul Materi | yes | content.title |
| 6 | Format | yes | TEXT/RICH_TEXT/MARKDOWN/VIDEO/PDF/AUDIO/INTERACTIVE |
| 7 | Isi / Body | - | content.body |
| 8 | Link Aset | - | for VIDEO/PDF/AUDIO |
| 9 | Estimasi Durasi (menit) | - | metadata |
| 10 | Status | - | DRAFT/PUBLISHED |
| 11 | Is Preview | - | YA/TIDAK |

(Subject/Chapter stated; these are free-text helpers, matching how content classifies.)

## Backend

### Dependency
- Add `github.com/xuri/excelize/v2` to `backend/go.mod`.

### Question multi-block
- Add optional `Blocks []QuestionBlockReq` (`json:"blocks,omitempty"`), `QuestionBlockReq{ BlockType, Label, AssetID }`, to `CreateQuestionReq`.
- In `Repository.Create`, replace the single `question_block` insert (question_bank.go:334) with: if `len(q.Blocks)>0` insert each in order (block_order = i), else current single-PARAGRAPH behavior. Thread `req.Blocks` in `Service.Create`. Existing behavior for normal create is unchanged.

### Question import endpoints
- `GET /api/v1/questions/import/template` → downloads generated `.xlsx` (Soal + Panduan guide).
- `POST /api/v1/questions/import/xlsx` (multipart field `file`) → read workbook stream in memory;
  iterate Soal rows (skip header/blank); per row resolve subject/chapter, validate type/difficulty,
  build `CreateQuestionReq` (with blocks parsed from the 8 block pairs, options from A–H with
  correct set from Kunci Jawaban), call `Import` creation, write audit (`question_import_job` /
  `question_import_row` with per-row status/message). Response `{job_id, created, failed, errors[]}`.
- Reuse existing `ImportRow` shape for JSON parity; new `XLSXImportRow` for the parsed columns.

### Material new endpoints
- `GET /api/v1/materials/import/template` → generated `.xlsx`.
- `POST /api/v1/materials/import/xlsx` (multipart field `file`) → parse Materi sheet → per-row
  create via existing material/content create path; collect `{created, failed, failed[]}`.
- (Reuses `MaterialService.Create`; no DB change.)

## Frontend

Replace the mocked `question-import.service.ts` and wire the existing import wizard:

- `parseFile` → `upload(file)` → `POST /questions/import/xlsx` (multipart), returns `{job_id,
  created, failed, errors[]}`, with upload progress.
- `commitImport` → removed (import is commit-on-parse). Stage-2 progress → real upload;
  Stage-3 review → backend result table (created count + per-row errors); keeps Edit/Preview
  acting on returned data; Stage-4 success shows `job_id`.
- Template download button calls `GET /questions/import/template` (+ `/materials/import/template`
  on the materials import page).
- Add `src/services/material-import.service.ts` mirroring question import.
- Reconcile `ParsedQuestionItem`/`ImportJob` types to the real response; keep defensive mapping.

## Security

- Role gate on import/template: reuse `middleware.RequireRole("SUPER_ADMIN","STAFF","GURU")`.
- Input validation per row (invalid mapel/type/difficulty → row FAILED with message, not crash).
- Parameterized queries; no raw string interpolation of cell values.
- Cap blocks N=8, options 8, file ≤15MB, reject non-.xlsx.

## Non-goals

- No PDF/DOCX/OCR/AI parsing (XLSX only, matching the request).
- No row-level asset upload of images (IMAGE blocks store a reference/placeholder).
- No schema/table/column changes.

## Verification

- Backend: `go build ./...`, `go vet ./internal/...`, `gofmt`, `go test ./internal/question_bank/`
  and `./internal/material/` `./internal/content/`. Add unit tests for xlsx row→block parsing
  and a routing-less test for the question Create-with-blocks (multi-block order persists).
- Frontend: `tsc --noEmit`, `npm run lint` (only pre-existing warnings; no new in changed files).
- Manual: upload a sample workbook containing one text–image–text single-choice question and
  verify 3 ordered `question_block` rows + option blocks + kunci jawaban persist.