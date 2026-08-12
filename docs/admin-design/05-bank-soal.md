# Halaman Admin — Bank Soal (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting hanya referensi)
> **Modul:** CRUD soal lengkap + pembahasan + media · bulk · import/export · filter detil
> **Tergantung pada:** Master Akademik (jenjang/kelas/mapel/bab/topik/CP) + Materi Pelajaran (rekomendasi/stimulus).

---

## 1. Tujuan & Sifat Halaman

Halaman **Bank Soal** adalah pusat authoring soal-soal yang dipakai siswa di **Latihan**, **Ujian**,
dan **CBT**. Karakter wajib:

1. **Lengkap & detil** — satu soal berisi: stimulus, konten multi-blok (teks/latex/tabel/gambar),
   opsi jawaban (A–H, media per opsi), **kunci jawaban + skor**, **pembahasan** (+ media), metadata
   kognitif (difficulty, Bloom C1–C6, HOTS, calculator, randomizable).
2. **Berbasis master akademik & materi** — soal di-*map* ke `Mapel→Bab→Topik/CP` dari Master
   Akademik, bisa di-kaitkan ke materi terkait (`question_learning_material`).
3. **Workflow status** — `DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED` + versi & riwayat.
4. **Bulk + import/export + filter detil** — permintaan eksplisit.

---

## 2. Model Data

Struktur soal **berversi dan berblok**, dipetakan dari skema eksisting:

### 2.1 `question.question` (master)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| question_code | varchar(50) | unik |
| question_type | text | `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `ESSAY` (+ SHORT_ANSWER, MATCHING) |
| current_version_id | uuid→version | versi aktif |
| status_id | uuid→status | DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED |
| owner_id / created_by / updated_by | uuid | |
| timestamps + deleted_at | | |

### 2.2 `question.question_block` (konten soal — multi blok)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| question_version_id | uuid | pemilik versi |
| block_order | int | urutan |
| block_type | text | PARAGRAPH/IMAGE/TABLE/LATEX/SVG/AUDIO/VIDEO/GRAPH/CODE/HTML/MARKDOWN |
| content | text | teks/latex/markdown |
| asset_id | uuid→media.asset | utk IMAGE/AUDIO/VIDEO |
| style_json | jsonb | |

### 2.3 Opsi & Pembahasan
- `question_option` — `{id, question_version_id, label(A–H), score, is_correct, display_order}`
- `question.option_block` — `{option_id, block_order, block_type, content, asset_id}` (media per opsi)
- `question.explanation` — `{question_version_id, content}` satu pembahasan per versi

### 2.4 Metadata
`question_metadata` — `difficulty_level (EASY/MEDIUM/HARD/VERY_HARD), blooms_level (REMEMBER..CREATE),
cognitive_level, language, source_type/name/publication_year/reference_code, is_hots, is_calculator_allowed, is_randomizable, estimated_time`.

### 2.5 Junction ke master akademik & materi
`question_subject (→academic.subject)`, `question_grade (→academic.grade)`,
`question_chapter (→academic.chapter)`, `question_topic (→academic.topic)`,
`question_tag`, `question_learning_material (→content.material)`.

### 2.6 Verifikasi & Versi
- `question_version` — `version_no, change_summary, is_current`.
- `question_history` — riwayat aksi (CREATE/UPDATE/REVIEW/APPROVE/ARCHIVE/RESTORE/DELETE) + snapshot.
- `question_statistics` — `total_answer, correct, wrong, skip, accuracy`.
- `question_import_job` / `question_import_row` — log import.

---

## 3. Logic & Aturan Bisnis

1. **Versi & atomic** — setiap simpan = version bump (`version_no+1`), `current_version_id` dipindah;
   version lama tak diubah (riwayat utuh). Create/Update dalam satu transaction.
2. **Kunci & skor** — opsi benar `is_correct=true` + `score>0`; sisanya score 0. Aturan jenis soal:
   - `SINGLE_CHOICE`: tepat 1 kunci.
   - `MULTIPLE_CHOICE`: ≥2 kunci.
   - `TRUE_FALSE`: 2 opsi (Benar/Salah), 1 kunci.
   - `ESSAY`: tanpa opsi; kunci = rubrik/nilai acuan (ada di `explanation`/opsi khusus).
3. **Junction wajib** — minimal `subject`; `grade/chapter/topic` opsional tapi konsisten
   (topic ⊆ chapter ⊆ subject). Satu soal boleh lintas grade bila grade kosong (umum).
4. **Validasi soal terbit** — soal PUBLISHED tak bisa dihapus tanpa repurcussion check; edit soal
   PUBLISHED → naik versi (konten baru), status kembali DRAFT/RIVIEW sesuai kebijakan.
5. **Duplikat** — cek isi (hash content+opsi) saat create & saat import; tandai & blok / warn.
6. **HOTS & Bloom** — `is_hots` + `blooms_level` disimpan & jadi filter; `ThinkingLevel`
   (LOTS/MOTS/HOTS) turunan opsional.
7. **Bulk** — `bulk-publish`, `bulk-status`, `bulk-update` (difficulty/subject/grade/score),
   `bulk-delete`: semua dalam batch + count; soal berstatus PUBLISHED diblok di bulk-delete sampai
   diberi peringatan.
8. **Import** — template 29 kolom (No, Kode, Mapel, Kelas, Bab, Tipe, Kesulitan, Blok1–4, Opsi A–H,
   Kunci, Skor, Skor Negatif, Pembahasan, Bloom, Bahasa); resolve mapel/kelas/bab by nama/kode
   (auto-create bila belum ada); opsi & kunci matrix; media diekstrak dari zip/xl/media.
9. **Export** — bematching filter; format kolom sama dgn template import (round-trip).
10. **Relasi materi** — pilih materi terkait (recommended reading) → `question_learning_material`.

---

## 4. API

Dari eksisting (semua sudah ada di `internal/question_bank`) + `[BARU]` utk filter/export:

| Metode | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/questions` | any | list — filter lengkap (lihat §6) |
| POST | `/questions` | SA,ST,GU | create (blok+opsi+metadata+junction) |
| GET | `/questions/:id` | any | detail lengkap |
| PUT | `/questions/:id` | SA,ST,GU | update (version bump) + history |
| DELETE | `/questions/:id` | SA,ST,GU | soft delete |
| POST | `/questions/:id/publish` | SA,ST,GU | DRAFT→PUBLISHED |
| POST | `/questions/:id/unpublish` | SA,ST,GU | →DRAFT |
| POST | `/questions/:id/archive` / `/restore` | SA,ST,GU | arsip/restore |
| POST | `/questions/:id/clone` | SA,ST,GU | duplikat utk revisi |
| GET | `/questions/:id/revisions` | any | riwayat versi |
| GET | `/questions/:id/options` | any | opsi |
| PUT | `/questions/:id/options` | SA,ST,GU | replace opsi |
| POST | `/questions/check-duplicates` | SA,ST,GU | cek isi |
| POST | `/questions/bulk-publish` | SA,ST,GU | |
| POST | `/questions/bulk-status` | SA,ST,GU | |
| POST | `/questions/bulk-update` | SA,ST,GU | |
| POST | `/questions/bulk-delete` | SA,ST,GU | |
| GET | `/questions/export` | SA,ST,GU | CSV (eksisting) |
| GET | `/questions/export/xlsx` | SA,ST,GU | **`[BARU]`** XLSX sesuai filter |
| POST | `/questions/import` | SA,ST,GU | import JSON |
| POST | `/questions/import/xlsx` | SA,ST,GU | import Excel |
| GET | `/questions/import/template` | SA,ST,GU | template |
| GET | `/media/entity/question/:id` | any | media per soal |

> Filter yang PERLU ditambah di `GET /questions`: `type`, `is_hots`, `blooms_level`, `chapter_id`,
> `topic_id`, `created_by` — saat ini belum didukung (`question_bank.go:607-666`).

---

## 5. UI/UX — Wireframe

### 5.1 Halaman List / Katalog
```
┌─ Bank Soal · Authoring Hub ─────────────────────────────────────┐
│ [Total] [Terpublikasi] [Draf] [HOTS] [Import Jobs]               │
├──────────────────────────────────────────────────────────────────┤
│ Filter: [Cari kode/konten ___] [Jenjang ▾][Mapel ▾][Bab ▾][Topik▾]│
│         [Tipe Soal ▾][Kesulitan ▾][Status ▾][HOTS ☐] [Penulis ▾] │
│         [Import ▾][Export ▾]                          [+ Soal]   │
├──────────────────────────────────────────────────────────────────┤
│ ☐ │ Kode    │ Konten (ringkas)        │ Mapel│ Bab│ Tipe │ Diff │ Status   │ Aksi      │
│ ☐ │ Q-1001  │ Di era digital, ...     │ MTK  │ 12 │ SC   │ HARD │ ✓ Pub    │ ▸ ✎ 🗑 ▾ │
│ ☐ │ Q-1002  │ $f(x)=x^2$...            │ FIS  │ 11 │ MCQ  │ MED  │ Draf     │ ...       │
├──────────────────────────────────────────────────────────────────┤
│ ☑ 3 terpilih [Terbitkan][Ubah Status][Edit Masal][Hapus]         │
│                        Pagination 20/50/100/1000  [◀ ▶]          │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Studio Create/Edit Soal (full-page, 2 kolom)
```
┌─ Buat Soal Baru ─────────────────────────────────────────────────┐
│ [Adm: klik Simpan utk simpan]  [Simpan Draf] [Terbitkan]         │
├──────────────────────────────────────────────────────────────────┤
│ Klasifikasi          │ Pratinjau Siswa (sticky)                  │
│  Jenjang ▾ Mapel ▾ Bab▾│ ┌──────────────────────────────┐        │
│  Topik ▾ CP ▾ Kurik ▾ │ │ [SINGLE] [MEDIUM] [HOTS]       │        │
│  Materi terkait ▾     │ │ Stimulus / Konten Blok         │        │
│                       │ │ Opsi A ■ B □ C □ D □          │        │
│ Konten Soal (blok)    │ └──────────────────────────────┘        │
│  [Blok1: PARAGRAPH]   │                                          │
│    "Di era digital..."│                                          │
│  [⊕ Tambah Blok:       │                                          │
│   Teks|Rumus|Tabel|    │                                          │
│   Gambar|Video|Audio]  │                                          │
│ Opsi Jawaban          │                                          │
│  A [____] (KUNCI ○)   │                                          │
│  B [____] (○) + media │                                          │
│  [+ Tambah Opsi]       │                                          │
│ Pembahasan           │                                          │
│  [textarea + gambar]   │                                          │
│ Metadata              │                                          │
│  Tipe ▾ Kesulitan ▾ Bloom▾ HOTS☐ Calc☐ Rand☐ Durasi[]          │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Drawer Detail (read-only) + Riwayat Revisi
- Drawer kanan menampilkan classification, blok konten, opsi+kunci+skor, pembahasan, metadata,
  statistik (accuracy), IRT, tombol aksi (publish/unpublish/archive).
- Tab **Riwayat Revisi**: list versi + `change_summary`; tombol "Pulihkan".

### 5.4 Import Wizard
`Upload (.xlsx) → Parse (client) → Preview+Edit (tabel inline, POV simulator) → Submit → ImportResultCard`.
Sudah ada pola lengkap di eksisting `import/page.tsx` — pertahankan & standardisasi.

---

## 6. Filter (lengkap — server-side)

Filter bar multi-dropdown cascade:

| Filter | Sumber | Nilai | Param |
|---|---|---|---|
| Search | soal | kode/konten/pembahasan | `q` |
| Jenjang | akademik | SD/SMP/SMA/SMK | (via grade) |
| Mapel | akademik | subject aktif | `subject_id` |
| Bab | akademik (per mapel) | chapter | `chapter_id` |
| Topik | akademik (per bab) | topic | `topic_id` |
| Tipe Soal | enum | SINGLE/MULTIPLE/TRUE_FALSE/ESSAY | `type` **`[BARU]`** |
| Kesulitan | enum | EASY/MEDIUM/HARD/VERY_HARD | `difficulty` |
| Status | enum | DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED | `status` |
| HOTS | toggle | hanya HOTS | `is_hots` **`[BARU]`** |
| Bloom | enum | C1–C6 | `blooms_level` **`[BARU]`** |
| Penulis | user | author | `created_by` **`[BARU]`** |
| Media | toggle | punya gambar/video | (opsional) |

Cascade Jenjang→Mapel→Bab→Topik (pola `AcademicFilterBar`); nonaktif bawah saat induk kosong.
Kombinasi disimpan di URL query untuk shareable & backable.

---

## 7. Fitur Halaman

### 7.1 CRUD penuh
- Create/Edit soal (studio blok + opsi + kunci + pembahasan + media + metadata) — §5.2.
- Delete — `AlertDialog`; blok bila soal PUBLISHED (saat di dalam ujian/latihan).
- Publish/Unpublish/Archive/Restore/Clone — aksi status.
- Riwayat revisi — melihat & restore versi.

### 7.2 Checkbox tiap row
- `Checkbox` + select-all (indeterminate).
- Bulk bar: Terbitkan Terpilih, Ubah Status, Edit Masal, Hapus.
- Kosong → bar hilang.

### 7.3 Import & Export
- Import xlsx (wizard preview+edit) — §5.4.
- Export xlsx sesuai filter / terpilih — round-trip dgn template.
- Template downloadable.

### 7.4 Kualitas Tabel
- `DataTable` TanStack: sticky header, sortable, resize, pagination, `title` tooltip utk konten
  panjang, badge tipe/status/kesulitan, baris 44px, tidak terpotong/tumpang tindih.

---

## 8. Komponen yang Dipakai

- Primitives: `Button, Input, Textarea, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton,
  Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Breadcrumb, Drawer, Popover, RadioGroup`.
- Authoring (baru): `QuestionBlockEditor` (insert blok per tipe), `QuestionOptionsEditor`
  (kunci toggle + skor + media per opsi), `QuestionExplanationEditor`, `QuizBlockEditor`,
  `BloomDifficultyPicker`, live `StudentPOVPreview`.
- Shared: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`,
  `ImportResultCard`, `FilterBar` (reuse + cascade).
- Parser client: `question-excel-parser.ts` (eksisting).
- Form: react-hook-form + zod.

---

## 9. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows + skeleton studio |
| Error | banner merah + Coba Lagi |
| Empty list | EmptyState + "Buat Soal" / "Import Excel" |
| Import selesai | ImportResultCard (created/skipped/failed) |
| Duplikat soal | tombol kuning "Duplikat terdeteksi" di preview; blok submit bila strict |
| Relasi bab/topik invalid | error inline di form |
| Simpan versi | Toast "Soal disimpan · v3" |
| Bulk berhasil | Toast "X soal dipublikasikan" |

---

## 10. Prioritas Pekerjaan (greenfield)

1. Backend: tambah filter `type/is_hots/blooms/chapter/topic/created_by` di `GET /questions` +
   endpoint export xlsx.
2. Frontend: `QuestionBlockEditor` + `QuestionOptionsEditor` → konsolidasi create/edit jadi studio
   penuh (menggantikan textarea).
3. Media per soal/opsi/pembahasan via `MediaPicker` (upload→`media.asset`).
4. Filter lengkap cascade + DataTable + checkbox + bulk (sebagian eksisting sudah, standardisasi).
5. Import wizard + export round-trip + template.
6. Riwayat revisi UI + restore.
7. Pratinjau siswa live (POV) dengan renderer blok yang sama dgn sisi siswa.

---

## 11. Keselarasan Design System

Radius 12/16/20; shadow small→medium; primary Blue; accent Orange hanya badge HOTS˥; hijau sukses;
skeleton; empty state; Bahasa Indonesia; toolbar ikon lucide 16/20; editor minimal (halaman kerja);
CBT-friendly saat pratinjau (fokus, tanpa iklan).