# Import Excel Master Akademik & Sekolah — Design Document

> **Tanggal:** 2026-08-10
> **Status:** Approved (menunggu review user)
> **Cakupan:** Import data Excel untuk semua modul master akademik (Jenjang, Kelas, Mapel,
> Bab, Topik, Capaian Pembelajaran, Kurikulum, Program) + Sekolah & Target Sekolah. Frontend + Backend + job log.

## 1. Tujuan

Admin saat ini mengisi master akademik lewat formulir satu-per-satu (8 dialog). Butuh cara cepat
memasukkan data dalam jumlah besar via Excel — mengikuti pola import soal (`internal/question_bank/import_xlsx.go`)
dan import materi (`internal/material/material_xlsx.go`) yang sudah ada. Scope: seluruh modul master
akademik + katalog sekolah & target sekolah, `Upload → Preview → Submit`, templat generatif.

## 2. Keputusan Kunci (hasil brainstorming)

| Area | Keputusan |
|---|---|
| Modul | Jenjang, Kelas, Mapel, Bab, Topik, CP/LO, Kurikulum, Program, Sekolah, Target Sekolah |
| Struktur | Per modul + relasi bertingkat (file anak bawa kolom induk; resolve kode/nama; auto-create induk bila belum ada) |
| Identifikasi relasi | Resolve kode/nama + auto-create (ikuti pola auto-create existing: grade→level, subject→curriculum_subject, LO→competency, topic→subchapter) |
| Duplikat | Skip kode/nama sudah ada, catat di report (bukan upsert) |
| UI Alur | Upload → Preview (validasi per baris valid/warning/error) → Submit → Report |
| Templat | Generatif (backend stream xlsx berisi contoh baris per sheet) |
| Penempatan UI | 1 halaman `/admin/academic/import` dgn tab per grup; komponen sekolah → tab baru di `/admin/schools` |
| Git | TIDAK commit selama sesi (perintah user: eksekusi git menyusul) |

## 3. Struktur File Import

3 grup, masing-masing punya endpoint backend + halaman/tab frontend:

### Grup A — Hirarki (1 file multi-sheet)
`Jenjang`, `Kelas`, `Mapel`, `Bab`, `Topik`, `Capaian Pembelajaran`

Relasi bertingkat:
- Kelas → kolom `Jenjang` (resolve kode/nama level; auto-create)
- Mapel → kolom `Jenjang`/`Kelas` (optional; reserved utk link curriculum_subject bila jenjang/kelas terisi)
- Bab → kolom `Mapel`
- Topik → kolom `Bab`
- CP → kolom `Topik` (auto-create competency bila belum ada)

### Grup B — Master (file per modul)
Sheet tunggal: `Kurikulum`, `Program`

### Grup C — Sekolah & Target Sekolah (file per modul)
Sheet tunggal: `Sekolah` (katalog), `Target Sekolah`
- Sekolah kolom: `Nama`, `NPSN`, `Jenjang` (SMP/SMA/UNIVERSITY), `Provinsi`, `Kota`, `Alamat`, `Telp`, `Email`
- Target Sekolah kolom: `Sekolah` (resolve kode/nama dari katalog academic.school; auto-create ke katalog bila belum ada), `Jenjang`, `Nilai Terendah Diterima`, `Nilai Tertinggi Diterima`, `Skor Maksimal` (default 400/700), `Mata Pelajaran` (koma), `Tahun Ajaran`

## 4. Backend

### 4.1 Infrastruktur shared — modul baru `internal/importxlsx`
(paket helper, bukan routing)
```go
package importxlsx

type ImportRow struct {
    RowNum int
    Cells  map[string]string // header → nilai
}

func Parse(ctx, reader io.Reader, header map[string]int) ([]ImportRow, error)
// excelize/v2: OpenReader → sheet pertama → baris pertama header → map kolom label uppercase

func ResolveByNameOrCode(ctx, pool, table, code, name) (uuid.UUID, bool, error)
// SELECT id FROM table WHERE code=$1 OR name=$2; return (id, found, err)
func AutoCreate(ctx, pool, table, cols, vals) (uuid.UUID, error) // INSERT ... ON CONFLICT (code) DO NOTHING RETURNING id; fallback SELECT
func SkipOrInsert(ctx, pool, table, code, cols, vals) (action string, id uuid.UUID, err error)
// "created" | "skipped" bila code/name sudah ada
```

Pola retry: `AutoCreate` → kalau conflict karna unique → `RetrieveByCode`. Semua parameterized.

### 4.2 Endpoint per grup

Semua `POST .../import/xlsx` (multipart `file`), `GET .../import/template` (xlsx stream). Role: SUPER_ADMIN/STAFF. Envelope `shared.Success`/`shared.Error`.

| Grup | Route | Isi |
|---|---|---|
| A Hirarki | `POST /academic/import/xlsx` + `GET /academic/import/template` | multi-sheet; per sheet resolve + handoff ke repository academic |
| B Master | `POST /academic/import/curriculum` , `/academic/import/program` (+ template utk masing2) | single-sheet |
| C Sekolah | `POST /schools/import/xlsx` + `GET /schools/import/template` | katalog school; upsert-skip by npsn/name |
| C Target | `POST /target-schools/import/xlsx` + `GET /target-schools/import/template` | resolve school dari katalog |

Implementasi pada modul yang sudah ada (tambah file `import_xlsx.go` di `internal/academic`,
`internal/school`, `internal/target_schools`) — GARIS: jangan modul terpisah utk resolver; helper
`internal/importxlsx` dipakai bersama.

### 4.3 Import Job log
File `internal/academic/import_xlsx.go` mengikuti `question_bank/import_xlsx.go`:
- Insert `ocr.import_job` (module `ACADEMIC`/`SCHOOL`/`TARGET_SCHOOL`, status RUNNING)
- Per baris: `ocr.import_row` (PENDING/SUCCESS/FAILED/SKIPPED) + message
- Job selesai → status COMPLETED/FAILED
- Response: `{ job_id, created, skipped, failed, errors: [{row, message}] }`

Cek migration `138_import_template.up.sql` untuk enum module & kolom tabel sebelum menulis.

## 5. Frontend

### 5.1 Halaman `/admin/academic/import` (BARU) — tab per grup
```
Tabs: Hirarki | Kurikulum | Program
```
Tiap tab:
1. **Unduh Templat** — `academicMasterService.downloadImportTemplate(kind)` (blob)
2. **Upload file** — dropzone (pola import soal `admin/questions/import/page.tsx`)
3. **Preview** — tabel per sheet (grup Hirarki: pilih sheet via Tabs/Select kecil; validasi badge per baris: valid/warning/error; kolom yang dipetakan)
4. **Submit import** — `academicMasterService.importFile(kind, file)` → Modal/Report hasil `{ created, skipped, failed, errors }`

### 5.2 Halaman `/admin/schools` — tambah tab ke-3 `Import Sekolah`
Sama alurnya: Unduh Templat → Upload → Preview → Import. Service: extend `school.service.ts` / `target-school.service.ts` dgn `downloadImportTemplate()`, `importFile()`.

### 5.3 Services baru
- `frontend/src/services/academic-master-import.service.ts` — `downloadTemplate(kind)`, `importFile(kind, file)`, result type `ImportResult { job_id, created, skipped, failed, errors }`
- Extend `school.service.ts` + `target-school.service.ts` utk import.

### 5.4 Reuse
- Parser xlsx client: pola `frontend/src/services/question-excel-parser.ts` (exceljs + sheetjs) utk preview. Buat `academic-excel-parser.ts` sederhana (kolom label → baris; validasi per modul).
- Komponen: dropzone, DataTable preview, Badge status, Result card, skeleton/error/empty.

## 6. Error Handling & Edge Cases

- File bukan xlsx / salah sheet → pesan jelas
- Header tidak cocok templat → 400 daftar kolom wajib
- `school_id` target tidak ditemukan di katalog → auto-create school (nama + jenjang) bila `Sekolah` terisi
- Duplikat kode/name → `skipped` + alasan di report (bukan gagal)
- Level tidak valid (bukan SMP/SMA/UNIVERSITY utk sekolah) → baris failed dgn message
- `max_score < min_score` atau > max_total → failed baris
- Job sebagian gagal → tetap commit yg sukses; report memisahkan created/skipped/failed
- Loading skeleton; error banner; empty state

## 7. Testing

- Backend: `internal/importxlsx` unit test (parse, resolver, skip/insert) + repository test di tiap modul import (skip tanpa DB_URL — pola `subscription_repository_test.go`)
- Frontend: `academic-excel-parser.test.ts` (parse + validasi per modul), `academic-master-import.service.test.ts` (path + multipart)
- Vitest `.test.ts` env node; `go test ./internal/academic/... ./internal/school/... ./internal/target_schools/...`

## 8. Scope (non-goals)

- Tidak menambah migration baru (tabel `ocr.*` & master sudah ada)
- Tidak mengubah logic auto-create existing (dipakai kembali)
- Tidak mengubah halaman create/edit single-record
- Tidak commit git selama sesi (menunggu perintah user)
- Tidak menambah dependency baru (excelize/v2, exceljs, sheetjs sudah ada)

## 9. Prosedur Eksekusi

1. `internal/importxlsx` helper + unit test
2. `internal/academic/import_xlsx.go` (Grup A+B) + template + repository test
3. `internal/school/import_xlsx.go` + `internal/target_schools/import_xlsx.go` (Grup C)
4. Frontend services (`academic-master-import.service`, extend school/target)
5. Frontend parser + preview (`academic-excel-parser.ts`)
6. Halaman `/admin/academic/import` (tab per grup)
7. Tab `Import Sekolah` di `/admin/schools`
8. Verifikasi: `go build`/`go vet`/`go test`, `tsc`, `eslint`, `vitest`