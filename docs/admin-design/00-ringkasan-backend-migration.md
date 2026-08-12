# Kelompok Master Akademik — Ringkasan Teknis Backend & Migration

> Dokumen pendamping untuk `01-master-akademik.md`, `02-kelola-sekolah.md`, `03-target-sekolah.md`.
> Menyatakan **perubahan DB & API yang diperlukan** untuk implementasi greenfield ketiga halaman tersebut.

---

## 1. Daftar Migration

| # | Nama | Isi |
|---|---|---|
| N | `school_institution_type` | `ALTER TABLE academic.school ADD institution_type varchar(20) NOT NULL DEFAULT 'SEKOLAH';` |
| N | `school_identity_extra` | `ADD school_status varchar(20) DEFAULT 'NEGERI'`, `yayasan_name varchar(200) NULL`, `village varchar(100) NULL`, `postal_code varchar(10) NULL`, `curriculum_code varchar(20) NULL` |
| N | `school_demographic` | Create `academic.school_demographic` (school_id, academic_year, total_students, total_rombel, grade_breakdown jsonb, unique(school_id,academic_year)) |
| N | `target_school_score` | Create `academic.target_school_score` (target_school_id, academic_year, min_score, max_score, max_total_score, created_by, unique(target_school_id,academic_year)) |
| N | `target_school_payung` | `ALTER TABLE academic.target_school ADD COLUMN IF NOT EXISTS subjects jsonb` (sudah ada) — verifikasi tidak perlu |
| N | `education_level_smk` | Seed kode `SMK` utk `academic.education_level` (baru) |

> Catatan: pastikan `academic.school.education_level` CHECK sudah mencakup `SD/SMP/SMA/SMK/UNIVERSITY`.

---

## 2. Perubahan Enum & Referensi

- `academic.school.education_level` CHECK diperluas menjadi
  `('SD','SMP','SMA','SMK','UNIVERSITY')`.
- `academic.target_school.level` tetap `('SMP','SMA','UNIVERSITY')`; untuk konsistensi dapat
  disamakan (opsional).
- `institution_type` (SEKOLAH/PT) menggantikan makna `UNIVERSITY` sebagai bentuk — `education_level=UNIVERSITY` dipertahankan utk kompatibilitas, di-fill otomatis bila `institution_type=PT`.

---

## 3. Ringkasan API yang Perlu Diimplementasikan/Dipetakan

### akademik
- CRUD jenjang/kelas/mapel/kurikulum/program — **sudah ada** (verifikasi ulang role gate).
- `GET/POST /academic/import/xlsx` & `/import/template` — **sudah ada**.
- `POST /academic/export/xlsx` — **baru** (template dari import; ubah arah).
- `POST /academic/bulk-delete` / `bulk-publish` — **baru**.

### sekolah
- CRUD sekolah — **sudah ada**, tapi query & DTO harus diperluas ke kolom baru.
- `GET/POST/PUT/DELETE /school-demographics` — **baru** (data per tahun).
- Import/export/bulk — sebagian sudah ada (import), export & bulk baru.

### target sekolah
- CRUD payung (`target_schools`) — **sudah ada**.
- CRUD nilai per tahun (`/target-school-scores*`) — **baru**.
- `GET /target-schools/trend/:id` — **baru**.

---

## 4. Prinsip Implementasi

1. **Kontrak API eksisting adalah dasar** — perbarui `api_list.md` & `openapi.yaml` agar sinkron
   dengan kode (banyak endpoint tercatat tidak ada di handler).
2. **Parameterized query** — tidak ada interpolasi SQL.
3. **Validasi di server** — level, skala skor, duplikat, NPSN.
4. **Soft delete** untuk school; cascade utk score per tahun.
5. **Job log** (ocr.import_job / ocr.import_error) utk import — pola sudah ada.
6. **Role gate**: SUPER_ADMIN/STAFF utk write; GURU hanya utk authoring konten.

---

## 5. Urutan Pengerjaan yang Disarankan

1. Migration + perbaikan enum + seed `SMK`.
2. Backend akademik: export & bulk; verifikasi CRUD.
3. Backend sekolah: perluas DTO/query; tabel demographic; import/export/bulk.
4. Backend target sekolah: tabel score; CRUD value; trend.
5. Frontend: tab master akademik (checkbox, import/export) → tab kelola sekolah
   (form terbagi 3 seksi, tab demografi) → target sekolah (nilai per tahun + tren chart).