# Halaman Admin — Kelola Sekolah (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting referensi)
> **Modul:** Identitas & Profil Sekolah · Data Siswa & Akademik · Rombel · Kurikulum
> **Terhubung ke:** halaman Target Sekolah (nilai penerimaan), halaman Akademik (jenjang/kurikulum).

---

## 1. Tujuan & Sifat Halaman

Halaman **Kelola Sekolah** mengelola katalog satuan pendidikan yang menjadi sumber data bagi:

- Halaman **Target Sekolah** (nilai penerimaan per sekolah).
- Halaman **Pengguna** (siswa/guru terdaftar pada sekolah).
- Analitik & ranking (agregat per sekolah).

Data disimpan **dua lapis waktu**:
1. **Identitas & profil** — data saat ini (nama, NPSN, alamat, status, kontak, bentuk pendidikan).
2. **Data tahunan** — jumlah siswa, rombel, kurikulum per tahun ajaran (historis, dianalisis
   lintas tahun).

---

## 2. Model Data

### 2.1 `academic.school` (identitas; eksisting, diperluas)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| npsn | varchar(20) | unik (partial unique) |
| name | varchar(200) | nama resmi satuan pendidikan |
| institution_type | varchar(20) | `SEKOLAH` / `PT` (perguruan tinggi) |
| education_level | varchar(20) | `SD`/`SMP`/`SMA`/`SMK` (bila SEKOLAH); null bila PT |
| school_status | varchar(20) | `NEGERI` / `SWASTA` |
| yayasan_name | varchar(200) | nama yayasan bila swasta (nullable) |
| province | varchar(100) | |
| city | varchar(100) | kabupaten/kota |
| district | varchar(100) | kecamatan |
| village | varchar(100) | desa/kelurahan (baru) |
| address | text | alamat lengkap |
| postal_code | varchar(10) | |
| phone / email / website | varchar | kontak resmi |
| curriculum_code | varchar(20) | kurikulum yang dipakai (kode, mengacu `academic.curriculum`) |
| is_active | bool | |
| timestamps + deleted_at | | |

### 2.2 `academic.school_demographic` (data tahunan; tabel BARU)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| school_id | uuid | FK school |
| academic_year | varchar(20) | `2025/2026` |
| total_students | int | jumlah total siswa aktif |
| total_rombel | int | jumlah rombongan belajar |
| grade_breakdown | jsonb | `{ "10": 120, "11": 118, "12": 110 }` |
| created_at | timestamptz | |
| UNIQUE (school_id, academic_year) | | satu baris per tahun |

> **Keputusan:** tanpa split gender (total saja); tanpa koordinat; kurikulum satu kolom.

---

## 3. Logic & Aturan Bisnis

1. **NPSN unik** — tidak boleh kosong & tidak boleh duplikat (partial unique); validasi format 8 digit.
2. **Bentuk vs jenis** — `institution_type=PT` tidak memakai `education_level`; `SEKOLAH` wajib
   memiliki education_level terisi.
3. **Status negeri/swasta** — bila `SWASTA`, field `yayasan_name` wajib; bila `NEGERI`, di-null-kan.
4. **Demografi** — disimpan per `academic_year`; form menampilkan tahun aktif saat ini, riwayat
   tahun lalu dipertahankan; perbarui → validasi `UNIQUE(school_id, academic_year)` → opt-update
   atau upsert.
5. **Hapus** — soft delete (`deleted_at`); blok bila sekolah memiliki siswa `student_enrollment`
   aktif atau target_school_score.
6. **Import** — header wajib: `Nama, NPSN, Bentuk, Jenjang, Status, Yayasan, Provinsi, Kota, Kecamatan, Desa, Alamat, KodePos, Telp, Email, Website, Kurikulum`. `Jenjang` kosong utk PT; duplikat NPSN → skipped.
7. **Export** — mengikuti filter; mencakup kolom identitas + demografi tahun terakhir.

---

## 4. API

| Metode | Path | Fungsi |
|---|---|---|
| GET | `/schools` | list (filter `?q=&type=&level=&province=&page=&limit=`) |
| POST | `/schools` | create |
| GET | `/schools/:id` | detail (identitas + demografi) |
| PUT | `/schools/:id` | update identitas |
| DELETE | `/schools/:id` | soft delete |
| PATCH | `/schools/:id/status` | aktif/nonaktif |
| GET/POST/PUT/DELETE | `/schools/:id/settings` | pengaturan sekolah |
| GET/PUT | `/schools/:id/branding` | branding (logo, warna) |
| GET/POST/PUT/DELETE | `/school-demographics` | CRUD data tahunan |
| GET | `/school-demographics?school_id=&academic_year=` | filter riwayat |
| POST | `/schools/import/xlsx` | import |
| GET | `/schools/import/template` | template |
| POST | `/schools/export/xlsx` | export |
| POST | `/schools/bulk-delete` | hapus massal |
| POST | `/schools/bulk-status` | aktif/nonaktif massal |

---

## 5. UI/UX — Wireframe

### 5.1 Tab & Toolbar
```
┌────────────────────────────────────────────────────────────────────┐
│  Kelola Sekolah     [Identitas] [Siswa & Akademik per Tahun]        │
├────────────────────────────────────────────────────────────────────┤
│ [Cari Nama/NPSN/Provinsi ______] [Bentuk ▾] [Jenjang ▾] [Status ▾] │
│ [Provinsi ▾]  [Import ▾] [Export ▾]                       [+Sekolah]│
├────────────────────────────────────────────────────────────────────┤
```

### 5.2 Tab "Identitas" — tabel daftar sekolah
```
│ ☐ │ NPSN      │ Nama Sekolah        │ Bentuk │ Jenjang│ Kota/Prov │ Status │ Aksi  │
│ ☐ │ 20100001 │ SMA N 1 Jakarta      │ N      │ SMA    │ Jkt/ DKI  │ ✓ Aktif │ ✏️ 🗑  │
│ ☐ │ 20200003 │ SMP N 3 Bandung      │ N      │ SMP    │ Kota/KBB  │ ✓ Aktif │ ...   │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih  [Hapus] [Aktifkan] [Nonaktifkan]       [◀ 1/3 ▶]     │
```

### 5.3 Dialog Sekolah (create/edit) — formulir 3 seksi
```
┌─ Dialog: Tambah Sekolah ─────────────────────────┐
│ [1. Identitas & Profil]                          │
│   Nama * ....................  NPSN * ........... │
│   Bentuk [SEKOLAH/PT]  Jenjang [SD/SMP/SMA/SMK]  │
│   Status [NEGERI/SWASTA]  Yayasan (jika swasta)  │
│   Kurikulum [K13/KurMer]                         │
│ [2. Alamat]                                      │
│   Provinsi ▾  Kota ▾  Kecamatan ▾  Desa          │
│   Alamat Lengkap ................  Kode Pos      │
│ [3. Kontak]                                      │
│   Telp ........  Email ........  Website ........ │
│ ──────────────────────────────────────────────── │
│                    [Batal]  [Simpan Sekolah]     │
└──────────────────────────────────────────────────┘
```

### 5.4 Tab "Siswa & Akademik per Tahun" (baris per year)
```
│ ☐ │ Tahun      │ Total Siswa │ Rombel │ Rincian Per Kelas         │ Aksi  │
│ ☐ │ 2025/2026  │ 348         │ 12     │ K10:120 · K11:118 · ...  │ ✏️ 🗑 │
│ ☐ │ 2024/2025  │ 342         │ 12     │ ...                      │ ✏️ 🗑 │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 1 terpilih  [Hapus]        [+ Tambah Tahun]                      │
```

---

## 6. Fitur Halaman

### 6.1 CRUD penuh & Checkbox
- **Sekolah**: create/edit/delete/toggle — dialog seksi identitas+alamat+kontak.
- **Demografi per tahun**: create/edit/delete baris tahunan; validasi jumlah ≥0.
- **Checkbox tiap row** + select-all + bar aksi (hapus/aktif/nonaktif massal).

### 6.2 Import & Export
- Export (filter aktif, semua/terpilih) — `.xlsx`.
- Import — wizard upload → preview (badge baris) → submit → report.
- Templat downloadable per jenis.

### 6.3 Kualitas Tabel
- `DataTable` TanStack: sortable, sticky header, resize, pagination, tooltip utk teks panjang,
  kolom jelas tidak terpotong/tumpang tindih.

---

## 7. Komponen yang Dipakai

- Primitives: `Button, Input, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton,
  Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Textarea`.
- Shared: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`,
  `ImportResultCard`, `FilterBar`, `SchoolFormDialog` (di-rework), `DemographicFormDialog` (baru).
- Form: react-hook-form + zod.

---

## 8. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows |
| Error | banner merah + Coba Lagi |
| Empty | EmptyState + CTA |
| Import | ImportResultCard |
| NPSN duplikat | error inline di form + pesan 409 pada import |
| Hapus dgn siswa aktif | AlertDialog peringatan; backend blok |

---

## 9. Keselarasan Design System

Sama seperti dokumen 01-Master-Akademik (radius, warna, spacing, skeleton, empty, badge,
Bahasa Indonesia). Tabel rapi: baris 44px, resize kolom, tooltip konten panjang.