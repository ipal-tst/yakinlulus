# Halaman Admin — Master Akademik (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting hanya referensi)
> **Modul:** Jenjang · Kelas · Mata Pelajaran · Kurikulum · Program
> **Dasar:** dokumen ini adalah fondasi untuk pembuatan konten (soal & materi) dan kelompok halaman
> akademik lainnya (Kelola Sekolah, Target Sekolah).

---

## 1. Tujuan & Sifat Halaman

Halaman **Master Akademik** adalah sumber tunggal data struktural yang menjadi acuan seluruh platform:

- **Jenjang** (`education_level`): SD, SMP, SMA, SMK (+ kategori PT terpisah).
- **Kelas/Grade** (`grade`): kelas per jenjang (SD 1–6, SMP 7–9, SMA 10–12).
- **Mata Pelajaran** (`subject`): daftar mapel global (id, kode, nama, kategori, deskripsi, ikon, warna).
- **Kurikulum** (`curriculum`): versi kurikulum (K13, KurMer, dll), tahun efektif.
- **Program** (`program`): program belajar (IPA, IPS, Bahasa, kejuruan).

Halaman ini **hanya mengelola data struktur** (bukan konten). Pembuatan soal/materi memakai hierarki
ini sebagai *foreign key*.

### Nalar Hubungan
```
Jenjang (SD/SMP/SMA/SMK/PT)
  └─ Kelas (1..6 / 7..9 / 10..12)
       └─ [Kurikulum] ─── Kurikulum dipakai per jenjang (relasi n:m opsional)
  └─ Mata Pelajaran (global)
       └─ [Program]  ─── program bisa menaungi subset mapel
```

---

## 2. Model Data

### 2.1 `academic.education_level` (eksisting, diperluas)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| code | varchar(20) | `SD`/`SMP`/`SMA`/`SMK`/`UNIVERSITY` |
| name | varchar(100) | "Sekolah Menengah Atas" |
| sort_order | int | urutan tampil |
| icon | text | ikon |
| color | varchar(20) | warna token |
| created_at | timestamptz | |

### 2.2 `academic.grade` (eksisting)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| education_level_id | uuid | FK jenjang |
| code | varchar(10) | "10" |
| name | varchar(60) | "Kelas 10" |
| sort_order | int | |

### 2.3 `academic.subject` (eksisting, diperluas opsional)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| code | varchar(20) | singkatan mapel |
| name | varchar(120) | |
| category | varchar(40) | opsional: UMUM/KEJURUAN/... |
| description | text | |
| icon / color | text / varchar(20) | |
| is_active | bool | |
| created_at/updated_at | timestamptz | |

### 2.4 `academic.curriculum`
Kolom eksisting: `id, code, name, version, effective_year, description, is_active`.

### 2.5 `academic.program`
Kolom eksisting: `id, code, name, education_level_id, is_active, deleted_at`.

> **Keputusan data:** `education_level` mendapat kode `SMK` dan `UNIVERSITY`; institusi perguruan
> tinggi tidak lagi dihitung sebagai "bentuk sekolah" — ia menjadi **institution_type** di modul Sekolah.

---

## 3. Logic & Aturan Bisnis

1. **Kode unik per entitas** — `code` wajib unik (unique index). Import/index checklist pakai kode.
2. **Cascade jenjang→kelas** — hapus jenjang menolak bila masih ada kelas (soft block), kecuali admin
   mengonfirmasi cascade.
3. **Mapel global** — mapel tidak milik satu jenjang; relasi jenjang→mapel lewat
   `curriculum_subject` (opsional, di luar scope halaman ini, diwakili di halaman Konten).
4. **Kurikulum default** — bila tidak ada kurikulum aktif, form/import otomatis memakai
   kurikulum `is_active=true` pertama.
5. **Program per jenjang** — `education_level_id` opsional; bila kosong program berlaku lintas jenjang.
6. **Import** — file Excel per entitas; resolve relasi induk dengan **kode/nama** (bukan UUID);
   duplikat kode → `skipped`, catat di report; auto-create induk bila belum ada (pola eksisting).
7. **Export** — riwayat disimpan sebagai file; export mengikuti filter aktif halaman.

---

## 4. API (dipetakan dari kontrak eksisting + tambahan)

| Metode | Path | Fungsi | Body utama |
|---|---|---|---|
| GET | `/academic/levels` | list | `?is_active=` |
| POST | `/academic/levels` | create | `{code,name,sort_order}` |
| PUT | `/academic/levels/:id` | update | |
| DELETE | `/academic/levels/:id` | delete | (blok bila ada kelas) |
| GET/POST/PUT/DELETE | `/academic/grades[...]` | CRUD kelas | |
| GET/POST/PUT/DELETE | `/academic/subjects[...]` | CRUD mapel | |
| GET/POST/PUT/DELETE | `/academic/curriculums[...]` | CRUD kurikulum | |
| GET/POST/PUT/DELETE | `/academic/programs[...]` | CRUD program | |
| POST | `/academic/import/xlsx` | import (multipart) | `?kind=` mapel dll |
| GET | `/academic/import/template` | download template | `?kind=` |
| POST | `/academic/export/xlsx` | export (filter) | body filter |
| POST | `/academic/bulk-delete` | hapus massal by ids | `{ids[]}` |
| POST | `/academic/bulk-publish` | aktif/nonaktif massal | `{ids[],is_active}` |

---

## 5. UI/UX — Wireframe

### 5.1 Tab Utama
```
┌──────────────────────────────────────────────────────────────────┐
│  Master Akademik  [Aktif Jenjang] [Kurikulum] [Program]           │
├──────────────────────────────────────────────────────────────────┤
```
Empat tab: **Kelas** · **Mata Pelajaran** · **Kurikulum** · **Program**. (Jenjang tersirat
sebagai header/filter jenjang; tidak sebagai tab terpisah agar hierarki tampil jelas.)

### 5.2 Tab "Kelas" (hirarki Jenjang → Kelas → Mapel)
```
┌────────────────────────────────────────────────────────────────────┐
│ Statistik: 4 Jenjang · 12 Kelas · 45 Mapel · 3 Kurikulum           │
├────────────────────────────────────────────────────────────────────┤
│ [Filter Jenjang ▾] [Filter Kurikulum ▾] [Cari Kelas/Mapel _____]   │
│ [Import ▾] [Export ▾]                                    [+ Kelas] │
├────────────────────────────────────────────────────────────────────┤
│ Jenjang: SMA                                                    (✓)│
│  ├─ Kelas 10    (30 mapel)  [expand ▾]                         (✓)│
│  ├─ Kelas 11    (31 mapel)                                      (✓)│
│  └─ Kelas 12    (31 mapel)                                      (✓)│
│    └─ Mapel Kelas 12                                             (✓)│
│        [X] Bahasa Indonesia   [X] Matematika                       │
│        [X] Fisika             [X] Kimia                            │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 3 terpilih   [Hapus Terpilih]  [Aktifkan]  [Nonaktifkan]         │
└────────────────────────────────────────────────────────────────────┘
```

### 5.3 Tab "Mata Pelajaran"
```
┌────────────────────────────────────────────────────────────────────┐
│ [Cari Mapel ______] [Kategori ▾] [Status ▾]   [Import][Export][+Mapel]│
├────────────────────────────────────────────────────────────────────┤
│ ☐ │ Kode     │ Nama Mapel     │ Kategori │ Status │ Aksi            │
│ ☐ │ MTK      │ Matematika     │ UMUM     │ Aktif  │ ✏️ 🗑  ▾(klon)  │
│ ☐ │ FIS      │ Fisika         │ SAINS    │ Aktif  │ ...             │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih  [Hapus]  [Nonaktifkan]        [◀ 1/4 ▶]              │
└────────────────────────────────────────────────────────────────────┘
```

### 5.4 Halaman Detail Jenjang (ritel kelas+mapel)
Klik row jenjang pada tab Kelas → expand/collapse; bisa juga drawer **"Detail Jenjang"**
menampilkan ringkasan + aksi.

---

## 6. Fitur Halaman (Checklist UI)

### 6.1 CRUD penuh — setiap tab
- **Create / Edit** — Dialog (form `react-hook-form` + `zodResolver`, label di atas, input h-11,
  error di bawah input, radius 12).
- **Delete** — `AlertDialog` konfirmasi; pesan destruktif + konsekuensi cascade.
- **Toggle status** — `Switch` pada kolom status; aktif/nonaktif instan.

### 6.2 Checkbox setiap row
- Kolom pertama: `Checkbox` (shadcn).
- **Select all** pada header (check state, indeterminate bila sebagian).
- Bar aksi muncul saat ≥1 terpilih (floating bottom / inline di bawah tabel).
- Aksi tersedia: **Hapus Terpilih**, **Aktifkan**, **Nonaktifkan**.

### 6.3 Ekspor & Impor
- **Export**: dropdown → `export.xlsx` sesuai filter aktif; pilihan: "Semua" / "Terpilih".
- **Import**: dialog wizard — upload `.xlsx` → preview validasi per baris (valid/warning/error)
  → submit → report `{created, skipped, failed, errors}`.
- **Unduh Templat**: tombol template per entitas.

### 6.4 Kualitas Tabel
- Gunakan **`DataTable`** (TanStack Table): sticky header, **sortable** (nama, kode, urutan),
  pagination (20/50/100), **column resize**, **CSV export** bawaan opsional.
- **Nama jelas & tidak terpotong**: kolom ber-resize, `truncate` + `title` tooltip, `whitespace-nowrap`
  untuk badge; row tinggi tetap 44px.

---

## 7. Komponen yang Dipakai

- Primitives: `Button, Input, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton,
  Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Breadcrumb`.
- Shared: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`,
  `ImportResultCard` (baru), `FilterBar` (baru, standardisasi dari AcademicFilterBar).
- Form: `react-hook-form` + `zodResolver`.
- Icon: lucide `LayoutGrid, BookOpen, ScrollText, GraduationCap, Upload, Download, Plus, Search`.

---

## 8. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows: `h-14 w-full rounded-xl` ×N |
| Error fetch | banner merah + "Coba Lagi" (refetch) |
| Empty | `EmptyState` + CTA "Buat Jenjang Baru" / "Import Excel" |
| Import selesai | `ImportResultCard`: hijau=created, amber=skipped, merah=failed+list error |
| Bulk aksi selesai | Toast "X Jenjang nonaktifkan" (label konsisten dgn tombol) |
| Hapus dgn dependensi | AlertDialog menampilkan peringatan cascade |

---

## 9. Checklist Keselarasan Design System (design.md)

- Radius 12 (button) / 16 (card) / 20 (dialog); shadow small→medium hover.
- Warna: primary `#2563EB`; accent orange hanya badge; hijau only success.
- Baris tabel tinggi 44px; kolom tidak tumpang tindih; tooltip utk konten panjang.
- Loading skeleton, empty state ilustrasi+CTA, error banner konsisten.
- Bahasa Indonesia; label jelas ("Simpan Perubahan", "Nonaktifkan").