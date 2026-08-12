# Halaman Admin — Target Sekolah (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting referensi)
> **Modul:** Nilai penerimaan per sekolah per tahun ajaran · Analisa progress
> **Terhubung ke:** Kelola Sekolah (katalog), halaman siswa (target siswa).

---

## 1. Tujuan & Sifat Halaman

Halaman **Target Sekolah** mencatat **nilai penerimaan** (ambang kelulusan) tiap sekolah/PT per
**tahun ajaran**. Data ini adalah dasar:

- Motivasi siswa (target sekolah dengan nilai ambang).
- Analisa admin: `sekolah mana naik/turun ambang`, `progress antar tahun`.

**Keunggulan model data:** karena nilai disimpan **per tahun ajaran**, admin dapat:
- Memfilter nilai pada tahun tertentu.
- Membandingkan antar tahun (progres).
- Menampilkan tren (chart) per sekolah.

---

## 2. Model Data

### 2.1 `academic.target_school` (entitas sekolah-target; eksisting)

Entitas *payung* per sekolah (identitas relasi), bukan nilai per tahun:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| school_id | uuid | FK ke academic.school |
| level | varchar(20) | `SMP`/`SMA`/`UNIVERSITY` (dari school bila diisi) |
| is_active | bool | |
| subjects | jsonb | daftar mapel utama (opsional di payung) |
| timestamps | | |

### 2.2 `academic.target_school_score` (nilai per tahun; tabel BARU)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| target_school_id | uuid | FK payung |
| academic_year | varchar(20) | `2025/2026` |
| min_score | int | nilai terendah diterima |
| max_score | int | nilai tertinggi diterima |
| max_total_score | int | skala penuh (default 400 SMP/SMA; 700 PT) |
| created_by | uuid | user pembuat |
| created_at / updated_at | timestamptz | |
| UNIQUE (target_school_id, academic_year) | | satu baris per tahun |

### 2.3 (Opsional) `academic.target_school_program`
Jika nanti dibutuhkan: nilai per `program/major` dalam satu tahun
`(target_school_score_id, program_id, min, max)`. Desertakan sekarang — YAGNI.

---

## 3. Logic & Aturan Bisnis

1. **Payung→nilai** — `target_school` dibuat eksplisit (pilih sekolah dari katalog Kelola Sekolah).
   Nilai per tahun menempel pada payung.
2. **Skala** — `max_total_score` default 400 (SMP/SMA) / 700 (PT); validasi `0 ≤ min ≤ max ≤ total`.
3. **Tahun unik** — gabungan (sekolah, tahun) satu-satunya; menambah tahun kedua memakai `upsert`.
4. **Analisa progress** — endpoint agregat menyediakan `prev_year` & `delta` (min/max vs tahun
   sebelumnya) per sekolah.
5. **Hapus pa、kedua** — hapus payung menghapus seluruh nilai tahun (cascade); hapus satu baris
   nilai tidak menghapus payung.
6. **Import** — header: `Sekolah, Tahun, Nilai Terendah, Nilai Tertinggi, Skala`; resolve sekolah
   dari katalog by nama/NPSN (auto-create bila belum ada); duplikat (sekolah, tahun) → skipped.
7. **Ekspor** — file per filter (tahun, tingkat, provinsi, sekolah); kolom mencakup delta antar tahun.

---

## 4. API

| Metode | Path | Fungsi |
|---|---|---|
| GET | `/target-schools` | list payung (+ score tahun terpilih via `?year=`) |
| POST/PUT/DELETE | `/target-schools[...]` | CRUD payung |
| GET | `/target-school-scores?target_school_id=&academic_year=` | list nilai per tahun |
| POST | `/target-school-scores` | upsert nilai (sekolah+tahun) |
| PUT | `/target-school-scores/:id` | update nilai |
| DELETE | `/target-school-scores/:id` | hapus nilai tahun |
| GET | `/target-schools/trend/:id` | tren nilai sekolah (semua tahun) |
| POST | `/target-school-scores/import/xlsx` | import nilai |
| GET | `/target-school-scores/import/template` | template |
| POST | `/target-school-scores/export/xlsx` | export |
| POST | `/target-school-scores/bulk-delete` | hapus massal |

---

## 5. UI/UX — Wireframe

### 5.1 Toolbar & Filter
```
┌─ Kelola Nilai Penerimaan Target Sekolah ──────────────────────┐
│ [Cari Sekolah ______]  [Jenjang ▾]  [Provinsi ▾]  [Tahun ▾]  │
│ [Mode: Semua ▾ | Tren Chip]  [Import][Export]   [+ Baris Nilai]│
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Tabel — per (sekolah × tahun) baris
```
│ ☐ │ Sekolah/PT      │ Jenjang │ Kota/Prov │ Tahun    │ Terendah │ Tertinggi │ Δ │ Aksi │
│ ☐ │ UI              │ PT      │ Depok/KB  │ 2025/2026│ 520      │ 680       │ ⬆│ ✏️ 🗑 │
│ ☐ │ UI              │ PT      │ Depok/KB  │ 2024/2025│ 500      │ 660       │ ▲│ ✏️ 🗑 │
│ ☐ │ SMA N 1 Jakarta │ SMA     │ Jkt Pusat │ 2025/2026│ 340      │ 380       │  │ ✏️ 🗑 │
├──────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih  [Hapus Terpilih]        [◀ 1/3 ▶]               │
```

### 5.3 Drawer Form — tambah/edit nilai
```
┌─ Nilai Penerimaan ────────────────────────────────────────┐
│ Sekolah/PT  [SEKOLAH SELECT ▾ (dari katalog) + 🔍 Baru]   │
│ Jenjang     (otomatis dari sekolah)                       │
│ Tahun Ajaran  [2025/2026]        Skala [400]              │
│ Nilai Terendah Diterima [ 340 ]  Tertinggi [ 380 ]        │
│ ⚠ max tidak boleh < min; max ≤ skala                      │
│                                      [Batal][Simpan]      │
└───────────────────────────────────────────────────────────┘
```

### 5.4 Mode Tren (analisa progress per sekolah)
Klik sekolah → panel tren: **LineChart** (sumbu X tahun, 2 garis min & max) + badge
naik/turun (delta vs tahun sebelumnya). Warna: blue (min), orange/green (max).

---

## 6. Fitur Halaman

### 6.1 CRUD & Checkbox
- Tambah/edit/hapus baris nilai; upsert (sekolah, tahun).
- **Checkbox setiap row** + select-all + Hapus Terpilih massal.
- Tambahan tombol ruik: `+ Baris Nilai`, dan cepat input beruntun (mode multi-baris per sekolah).

### 6.2 Import & Export
- Export (filter aktif / terpilih) `.xlsx` — kolom + delta.
- Import → preview → report (skipped utk duplikat tahun).
- Templat downloadable.

### 6.3 Analisa
- Filter **Tahun** default = tahun aktif.
- Toggle **Tren** → panel LineChart progress per sekolah (1-2 klik, sesuai UX ≤2 klik).

---

## 7. Komponen yang Dipakai

- Primitives: `Button, Input, Select, Dialog, Card, Badge, Tabs, Skeleton, Switch, Checkbox,
  DropdownMenu, Pagination, Tooltip, AlertDialog`.
- Chart: Recharts `LineChart` / `Line` + `ResponsiveContainer` (maks 4 warna).
- Shared: `PageHeader`, `DataTable`, `ConfirmDialog`, `EmptyState`, `ImportResultCard`,
  `FilterBar`.
- Form: react-hook-form + zod; `SchoolSelect` (reuse dari Kelola Sekolah).

---

## 8. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton |
| Error | banner merah + Coba Lagi |
| Empty | EmptyState + CTA "Impor nilai pertama" |
| Import | ImportResultCard |
| Duplikat tahun | error inline / skipped pada import |
| max < min | validasi form + pesan server |

---

## 9. Keselarasan Design System

Sama dengan dokumen lain; chart ≤6 warna; badge delta hijau (naik) / merah (turun);
tabel rapi, tidak terpotong.