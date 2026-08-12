# Halaman Admin — Materi Pelajaran (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting hanya referensi)
> **Modul:** Authoring materi terstruktur + media pendukung (video/audio/gambar/dokumen)
> **Tergantung pada:** Master Akademik (jenjang/kelas/mapel/bab/topik) — hierarki di sini ditarik dari sana.

---

## 1. Tujuan & Sifat Halaman

Halaman **Materi Pelajaran** adalah studio authoring materi belajar siswa. Dua sifat utama:

1. **Terstruktur & berdasarkan master akademik** — materi di-*map* ke hierarki
   `Mapel → Bab → Topik` yang berasal dari Master Akademik (bukan teks bebas).
2. **Kaya media** — satu materi menampung **blok konten** (teks, formula, tabel) + **media
   pendukung** (video, audio, gambar, dokumen) sebagai penunjang belajar.

Halaman ini adalah "bagian depan" dari pipeline konten: di-authoring di sini, dirender siswa
di halaman belajar (`ContentRenderer`).

---

## 2. Model Data (dipetakan dari skema eksisting + tambahan)

### 2.1 `content.material` (master)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| material_code | varchar(50) | unik |
| title | varchar(200) | judul materi |
| slug | varchar(200) | unik |
| summary | text | ringkasan |
| material_type_id | uuid→`material_type` | TEXT/RICH_TEXT/MARKDOWN/VIDEO/PDF/AUDIO/INTERACTIVE |
| current_version_id | uuid→`material_version` | versi aktif |
| status_id | uuid→`material_status` | DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED |
| owner_id / created_by / updated_by | uuid | |
| published_at | timestamptz | |
| timestamps + deleted_at | | |

### 2.2 `content.material_block` (isi materi)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| material_version_id | uuid | versi pemilik blok |
| block_order | int | urutan tampil |
| block_type | text | **17 jenis**: PARAGRAPH, IMAGE, VIDEO, AUDIO, LATEX, TABLE, SVG, GRAPH, CODE, HTML, MARKDOWN, QUIZ, CALLOUT, TIMELINE, EMBED, ACCORDION, CHECKLIST |
| content | text | teks/markdown/formula |
| asset_id | uuid→`media.asset` | utk IMAGE/VIDEO/AUDIO |
| style_json | jsonb | gaya tampil |

### 2.3 Junction struktur (dari master akademik)
`content.material_subject` (→subject), `material_grade` (→grade), `material_chapter` (→chapter),
`material_topic` (→topic), `material_curriculum` (→curriculum), `material_major`, `material_tag`.

> **Keputusan desain:** hierarki **wajib** diisi dari master akademik (Mapel → Bab → Topik).
> Admin memilih via cascade dropdown; backend memvalidasi relasi tersebut.

### 2.4 Media pendukung
- `content.material_attachment` — lampiran: `PRIMARY` / `SUPPORT` / `DOWNLOAD`.
- `content.material_thumbnail` — thumbnail kartu.
- `content.material_subtitle`, `content.material_transcript` — subtitle/transkrip utk video/audio.
- `media.asset` + `media.asset_reference` (module=`material`, entity=`material_block`) —
  polymorphic link media↔blok.

---

## 3. Logic & Aturan Bisnis

1. **Hierarki wajib dari master** — materi tak boleh berdiri tanpa `subject`; `chapter`/`topic`
   opsional tapi bila diisi harus valid & ancestor konsisten (topic ⊆ chapter ⊆ subject).
2. **Blok terstruktur** — isi materi = daftar blok ber-urutan (`block_order`). Authoring harus
   menghasilkan blok, bukan satu teks datar (agar `ContentRenderer` siswa bisa render per tipe).
3. **Kategori** — `TEORI` / `STRATEGI` / `TRIK_CEPAT` (+ opsional custom tag):
   - Rangkuman Teori → block PARAGRAPH/LATEX/TABLE
   - Strategi Belajar & Pengerjaan → CALLOUT/TIMELINE/CHECKLIST
   - Trik Cepat & Formula → LATEX/CALLOUT/GRAPH
4. **Media** — blok IMAGE/VIDEO/AUDIO memakai `asset_id` (upload → `media.asset`; bukan URL bebas).
   Lampiran tambahan (PDF/doc) → `material_attachment` tipe DOWNLOAD/SUPPORT.
5. **Status workflow** — `DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED`. Toggle "Terbitkan"
   harus melewati state; admin bisa publish langsung dari DRAFT (bypass review bila diizinkan).
6. **Versi** — setiap simpan blok menaikkan `material_version` + `current_version_id` dipindah;
   riwayat tampil di "Riwayat Revisi".
7. **Duplikat slug** — slug unik; saat create gunakan slug otomatis dari judul, editable.
8. **Import** — template kolom eksisting (Mapel, Kelas, Bab, Topik, Judul, Format, Isi, Link Aset,
   Durasi, Status) + perluasan: `Kategori`, `Blok` (memungkinkan N baris blok per materi dengan
   `NoBlok`/`JenisBlok`), `Media` (link). Resolve Mapel/Kelas/Bab/Topik by nama/kode; auto-create
   induk bila belum ada (pola master akademik).
9. **Export** — xlsx dari filter aktif; kolom identitas + ringkasan blok + link media.

---

## 4. API

Dari eksisting `/materials` + tambahan `[BARU]`:

| Metode | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/materials` | any | list, filter (lihat §6) |
| POST | `/materials` | SA,ST,GU | create (materi+blok+junction) |
| GET | `/materials/:id` | any | detail (materi + blok + metadata + media) |
| PUT | `/materials/:id` | SA,ST,GU | update (blok diformat penuh) |
| DELETE | `/materials/:id` | SA,ST,GU | hapus (soft) |
| PATCH | `/materials/:id/publish` | SA,ST,GU | publish |
| PATCH | `/materials/:id/archive` | SA,ST,GU | archive |
| GET | `/materials/:id/blocks` | any | **`[BARU]`** list blok versi aktif |
| POST | `/materials/:id/blocks` | SA,ST,GU | **`[BARU]`** simpan/urutkan blok |
| PUT | `/materials/:id/blocks/:blockId` | SA,ST,GU | **`[BARU]`** update blok |
| DELETE | `/materials/:id/blocks/:blockId` | SA,ST,GU | **`[BARU]`** hapus blok |
| GET | `/materials/:id/revisions` | any | **`[BARU]`** riwayat versi |
| GET/POST | `/material-attachments` | any / SA,ST,GU | **`[BARU]`** lampiran (PRIMARY/SUPPORT/DOWNLOAD) |
| POST | `/materials/import/xlsx` | SA,ST,GU | import (eksisting, diperluas) |
| GET | `/materials/import/template` | SA,ST,GU | template (eksisting) |
| POST | `/materials/export/xlsx` | SA,ST,GU | **`[BARU]`** export |
| POST | `/materials/bulk-delete` | SA,ST,GU | **`[BARU]`** |
| POST | `/materials/bulk-publish` | SA,ST,GU | **`[BARU]`** |
| POST | `/media/upload` | SA,ST,GU | upload aset (eksisting) |
| GET | `/media/entity/:type/:id` | any | list media per entity |

---

## 5. UI/UX — Wireframe

### 5.1 Halaman List
```
┌─ Kelola Materi Pelajaran ⭐ Authoring Hub ─────────────────────────┐
│ [Siswa Aktif] [Total] [Terpublikasi] [Draf] [Waktu Baca Rata2]     │
├────────────────────────────────────────────────────────────────────┤
│ [Cari judul/konten ______] [Jenjang ▾][Mapel ▾][Bab ▾][Kategori ▾]│
│ [Status ▾] [Penulis ▾]  [Import ▾][Export ▾]       [+ Materi Baru]│
├────────────────────────────────────────────────────────────────────┤
│ ☐ │ Kode │ Judul Materi  │ Mapel │ Bab │ Kategori │ Status │ Media │ Aksi │
│ ☐ │ B01  │ Teori ....    │ MTK   │ 12  │ Teori    │ ✓ Pub  │ 🎬📄 │ ✏️ 🗑 ▾ │
│ ☐ │ B02  │ Trik ....     │ FIS   │ 11  │ Trik     │ Draf   │ 🎬    │ ...  │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih  [Terbitkan] [Hapus]         [◀ 1/3 ▶]               │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Studio Authoring (create/edit) — halaman/wizard penuh
```
┌─ Materi Baru ────────────────────────────────────────────────────┐
│ Tabs: [Konten] [Media & Lampiran] [Atur & Klasifikasi] [Pratinjau]│
├──────────────────────────────────────────────────────────────────┤
│ KONTEN                                                          │
│  Judul *  │ Kode  │ Slug                                        │
│  Mapel ▾  │ Bab ▾ │ Topik ▾          (dari master akademik)      │
│  ── Blok Konten ─────────────────────────────────────────────────│
│  ▸ [⊕ Tambah Blok: ▾ Teks|Rumus|Tabel|Gambar|Video|Audio|Kuis]  │
│  Block 1: PARAGRAPH —  "Di era digital..."           [↑][↓][✎][🗑] │
│  Block 2: LATEX — $$f(x)=x^2$$                        [↑][↓][✎][🗑]│
│  Block 3: IMAGE — [thumb.png] (upload/picker)          [↑][↓][✎][🗑]│
│  Block 4: VIDEO — [video.mp4] (upload/embed)           [↑][↓][✎][🗑]│
├──────────────────────────────────────────────────────────────────┤
│ [Simpan Draf]  [Terbitkan]  (versi naik otomatis per simpan)     │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Tab Media & Lampiran
```
│ Video Tutorial  [⊕ Upload] [🔗 emtaut URL]  → blok VIDEO           │
│ Audio          [⊕ Upload]  (podcast/penjelasan) → blok AUDIO       │
│ Gambar         [⊕ Upload]  (gallery picker) → blok IMAGE           │
│ Dokumen        [⊕ Upload]  PDF/doc → attachment DOWNLOAD           │
│ Thumbnail      [⊕ Upload]                                          │
```

### 5.4 Pratinjau (POV siswa)
Render sinkron memakai `ContentRenderer` (blok → tampilan siswa): kaidah desain CBT-friendly
(fokus, tanpa iklan/popup).

---

## 6. Filter (lengkap — permintaan khusus)

Filter bar multi-dropdown (semua server-side `?<key>=`):

| Filter | Sumber | Nilai |
|---|---|---|
| Search | `/materials?search=` | judul/summary/konten |
| Jenjang | akademik | SD/SMP/SMA/SMK |
| Mapel | akademik | subject aktif |
| **Bab** | akademik (tergantung mapel) | list chapter |
| **Topik** | akademik (tergantung bab) | list topic |
| Kategori | enum | TEORI/STRATEGI/TRIK_CEPAT |
| Format | enum | TEXT/RICH_TEXT/MARKDOWN/VIDEO/PDF/AUDIO/INTERACTIVE |
| Status | enum | DRAF/REVIEW/APPROVED/PUBLISHED/ARSIP |
| Media | toggle | "Punya Video", "Punya Gambar", "Punya Dokumen" |
| Penulis | user | nama author |
| Tanggal | DatePicker | `published_at` range |

Cascade: Jenjang → Mapel → Bab → Topik (pola `AcademicFilterBar`; nonaktif ketika induk kosong).

---

## 7. Fitur Halaman

### 7.1 CRUD penuh
- **Create / Edit** — studio authoring (blok terstruktur; §5.2).
- **Delete** — `AlertDialog`; soft delete + peringatan bila materi dipakai ujian.
- **Publish / Archive** — toggle status; workflow state.
- **Revisi** — lihat & restore versi lama.

### 7.2 Checkbox tiap row
- Kolom pertama `Checkbox` + select-all (indeterminate).
- Bar aksi bila ≥1 terpilih: **Terbitkan Terpilih**, **Arsipkan**, **Hapus**.
- Kosong → bar aksi hilang.

### 7.3 Import & Export
- **Import xlsx** — wizard upload → preview (per baris + blok) → submit → `ImportResultCard`.
- **Export xlsx** — sesuai filter aktif / terpilih.
- **Unduh Templat** — kolom lengkap + baris contoh.

### 7.4 Kualitas Tabel
- `DataTable` TanStack: sticky header, sortable, resize, pagination 20/50/100, tooltip `title`
  utk judul panjang; badge media (🎬 📄 🖼 🔊) compact; baris 44px; tidak terpotong/tumpang tindih.

---

## 8. Komponen yang Dipakai

- Primitives: `Button, Input, Textarea, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton,
  Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Breadcrumb, DatePicker, Popover`.
- Authoring: `BlockEditor` (baru — toolbar insert blok + editor per tipe), `BlockRenderer`,
  `MediaPicker` (baru — pilih/upload aset dari `media.asset`), `TableEditor` (baru), `QuizBlockEditor` (baru).
- Shared: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`,
  `ImportResultCard`, `FilterBar` (reuse + cascade).
- Form: react-hook-form + zod.
- Arahkan ke sidebar guru juga (GU meng-authoring materi dengan klaim owner).

---

## 9. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows + skeleton studio |
| Error | banner merah + Coba Lagi |
| Empty list | EmptyState + "Buat Materi" / "Import Excel" |
| Import selesai | ImportResultCard |
| Simpan blok | Toast "Materi disimpan · versi 3" |
| Relasi bab/topik invalid | error inline di form (cascade valid) |
| Media gagal upload | pesan inline picker + batas ukuran (mis ≤15MB video via external) |

---

## 10. Prioritas Pekerjaan (greenfield)

1. Backend: endpoint blok `[BARU]` (§4) + perluasan import/export + bulk + filter bab/topik.
2. Frontend: `BlockEditor` + simpan blok → `MaterialCreateForm` restruktur.
3. `MediaPicker` + upload + attachment kategori.
4. Filter lengkap + DataTable + checkbox + bulk.
5. Import/export wizard + template baru.
6. Versi/revisi UI + Pratinjau siswa (ContentRenderer).

---

## 11. Keselarasan Design System

Radius 12/16/20; shadow small→medium; primary Blue; accent Orange hanya badge; hijau sukses;
skeleton; empty state ilustrasi+CTA; Bahasa Indonesia; toolbar ikon lucide 16/20; blok editor
minimal, tanpa eye-candy berlebih (karena ini halaman kerja/authoring).