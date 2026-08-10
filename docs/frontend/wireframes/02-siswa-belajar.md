# Wireframe — Halaman Siswa Belajar (Materials)

> **File:** `docs/frontend/wireframes/02-siswa-belajar.md`
> **Route:** `/materials` (AppShell, role `SISWA` / `SUPER_SISWA`)
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Belajar Siswa** — katalog mata
pelajaran, materi per bab, dan alur belajarnya. Diselaraskan dengan skema DB, backend (Go/Fiber),
dan API kontrak (`docs/frontend/API-contract-siswa.md`). Bagian yang datanya belum ada diberi
penanda `[KONTRAK BARU]` untuk dibuat menyusul.

---

## 1. Konteks & Tujuan

Halaman Belajar adalah jendela utama siswa untuk **menguasai materi sesuai jenjangnya**
(education level + kelas). Tujuannya:

- **Katalog mapel** sesuai jenjang siswa (SD/SMP/SMA) — konten di luar jenjang **tidak tampil
  dan tidak bisa diakses** (filter wajib di sisi server, bukan sekadar tampilan).
- **Hierarki:** *Mata Pelajaran → Bab → Topik → CP/KD*.
- Setiap topik/CP/KD dapat berisi **teks, rumus (LaTeX), grafik, gambar, dan video**.
- Di **akhir setiap bab** ada tombol/link menuju **ujian bab** (soal-soal bab tersebut).
- **Penanda/progres penguasaan** di setiap mapel & bab: berbasis **jumlah jawaban benar soal**
  (default ≥ 50 per bab, target configurable oleh admin).
- Ada konten **non-mapel**: Tips & Trik, Video, dan Audio (tips/cara belajar umum).

**Target primer UX:** siswa langsung tahu mana yang sudah dikuasai & apa yang harus
dikerjakan berikutnya — per tingkat (bab hijau) dan per mapel (hijau jika seluruh bab hijau).

Design system: `design.md` (Modern Minimal Education; warna Primary Blue, success progress,
accent hanya untuk badge/highlight).

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       Beranda   → /siswa
│       Belajar ● → /materials      (active)
│       Latihan   → /practice
│       Ujian     → /exams
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px, container max-w-1600px)
      ├── ✦ /materials                       → Daftar Mapel + non-mapel
      ├── ✦ /materials/:subjectId            → Daftar Bab dari satu mapel
      └── ✦ /materials/:subjectId/:chapterId  → Materi Bab → Topik → CP/KD (detail, baca/putar)
```

**Route baru yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/materials` | Daftar mapel (sesuai jenjang) + section Tips & Trik / Video / Audio non-mapel. |
| `/materials/:subjectId` | Daftar **Bab** mapel tsb: progres per bab, status hijau, ujian bab per mapel. |
| `/materials/:subjectId/:chapterId` | Halaman **detail** bab: daftar Topik → CP/KD, konten reader/video/rumus/grafik, tombol ujian bab di akhir. |

> Rute detail lama `/materials/:id` (materi tunggal) dipetakan ke format bab baru
> (`/materials/:subjectId/:chapterId`), lihat Bagian 9.

**Auth:** Bearer JWT via `src/lib/api.ts`. Semua akses divalidasi jenjang: konten
`grade_id` / `education_level_id` != milik siswa → **404 (bukan 403)** agar tidak bocorkan keberadaan konten.

---

## 3. Wireframe ASCII — `/materials` (Daftar Mapel)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  Pertanyaan: "Halo {nama}! Ingin belajar apa hari ini? 👋"              │  │
│ │  [Penjelasan kecil: materi ditampilkan sesuai jenjang kamu]            │  │
│ │  GradeBadge (SMA · Kelas 12 UTBK)                                        │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌── TABS JENJANG (auto-only aktif untuk jenjang-mu; nonaktif disabled) ──┐ │
│ │   [ SD ] [ SMP ] [ SMA ] ●  (jenjang lain dimunculkan sebagai icon + tooltip "sesuai jenjang") │ │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ DAFTAR MAPEL — grid kartu (2–4 kolom) ─────────────────────────────────┐ │
│ │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│ │  │ 📘 Matematika │ │ 📖 B.Indonesia│ │ 🔬 Fisika    │ │ 🧑🔬 Kimia    │  │ │
│ │  │ 8 Bab        │ │ 6 Bab        │ │ 5 Bab        │ │ 4 Bab        │  │ │
│ │  │ ▓▓▓▓▓▓▓▒ ░ 70%│ │ ▓▓▓▓░ 40%    │ │ ▓ 10%        │ │ ░ 0%          │  │ │
│ │  │ (hijau, karena│ │ (amber)      │ │ (merah)      │ │ (abu)         │  │ │
│ │  │ semua bab ✓)   │ │              │ │              │ │              │  │ │
│ │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ SEKTOR NON-MAPEL — kartu grid kecil ───────────────────────────────────┐ │
│ │  [💡 Tips & Trik]  [🎬 Video]  [🎧 Audio]                            │ │
│ │   (umum, non-mapel; jenjang-filter juga diterapkan)                     │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Responsive:** grid 4→2→1; tabs jadi horizontal scroll.

---

## 3.1 Wireframe — `/materials/:subjectId` (Bab dari Mapel)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Belajar / Matematika  →  (klik → /materials)
│ HEADER: 📘 Matematika · "Kelas 12 · UTBK" · total {n} bab                     │
│         Progress mapel: [▓▓▓▓▓▓▓░░ 70%] + checklist "X dari Y bab hijau"      │
│                                                                             │
│ ┌ LIST BAB (Accordion per bab) ────────────────────────────────────────────┐ │
│ │  Bab 1 · Aljabar & Fungsi                 [✓ MULAI DIPAHAMI? ]    12/50  │ │
│ │   Progres : ▓▓▓▓▓▓▓▓▓░ 45% · benar 31/50                                │ │
│ │   ✅ 12 Topik kuasai · 🏁 Ujian Bab 1  → [Kerjakan Ujian → /exams]     │ │
│ │  ─────────────────────────────────────────────                            │ │
│ │  Bab 2 · Persamaan Kuadrat               [blank] (belum mulai)          │ │
│ │   Progres : ░░░░░ 0%                     [Mulai Bab]                    │ │
│ │  Bab 3 · …                                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.3 Wireframe — `/materials/:subjectId/:chapterId` (Detail Bab → Topik → CP/KD)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Belajar / Matematika / Bab 1 · Aljabar                        │
│                                                                             │
│ ┌ HEADER BAB ──────────────────────────────────────────────────────────┐   │
│ │  Bab 1 · "Aljabar & Fungsi"   Badge: SMA · Kelas 12 UTBK                │   │
│ │  Progres belajar: ▓▓▓▓▓▓▓▓░░ 45%  ·  Dokumen: Topik 3 dari 5            │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌ Isi (SIDEBAR KIRI — Daftar Topik, sticky) ─┐│ ┌ KONTEN UTAMA ──────────┐ │
│ │ 1. Konsep Dasar  ● (aktif)                 ││  CP/KD 3.1 · Judul Materi │ │
│ │ 2. Video: Konsep   ○                        ││  [Teks/paragraf]          │ │
│ │ 3. Contoh & Rumus  ○                        ││  [LaTeX / rumus]          │ │
│ │ 4. Grafik/Image     ○                        ││  [Grafik + gambar]         │ │
│ │ 5. Video animasi    ○                           │ │  [Video embed/audio]      │ │
│ └──────────────────────────────────────────────┘ │  [btn berikutnya →]     │ │
│                                                └───────────────────────────┘ │
│                                                                             │
│ ┌ Footer Bab (fixed-bottom dalam halaman) ────────────────────────────────┐ │
│ │  🏆 Bab selesai membaca? Perluas. Progres: {pct}%                        │ │
│ │  [btn PRIMER: Kerjakan Ujian Bab 1 → /exams/:quiz_exam_id]                │ │
│ └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

Semua response API sudah di-`unwrap` (`data`). Notasi field: `data.<path>`.

### 4.1 Header `/materials` (Daftar Mapel)

| Aspek | Detail |
|---|---|
| Data | `GET /materials/catalog?grade_id=` (BARU) → `{ subjects:[{subject_id, subject_name, icon, color, total_children, completed_children, progress_pct, status}], extra:[{kind: TIPS/VIDEO/AUDIO, ...}] }` |
| Komponen | Header greeting + `GradeBadge`; tabs jenjang |
| Jenjang | Server menerima `grade_id` (dari JWT/profil + query override TIDAK untuk akses lain); tampilan: tab aktif sesuai jenjang, tab lain di-disabled dengan tooltip "Berisi materi untuk jenjang lain" |
| Akses | `403` bila `grade_id` konten ≠ jenjang siswa (server, tidak ada filter klien saja) |
| Empty | "Belum ada materi untuk jenjangmu" + ilustrasi + CTA `[Ke Dashboard]` |

### 4.2 Daftar Mapel Cards

| Aspek | Detail |
|---|---|
| Data | `GET /materials/catalog` → per subject `{subject_id, subject_name, icon, color, chapters_count, progress_pct, is_mastered}` |
| Aturan warna | `status_code` dihitung: **hijau** bila `is_mastered` (semua bab `progress_pct ≥ 100%` per target soal benar); **amber** bila `0 < progress_pct < 100`; **abu** bila `0`. |
| Progress | `progress_pct = min(100, Σ correct_count per bab / (bab_count × target_correct) × 100)` — lihat §6. |
| CTA | klik kartu → `/materials/:subjectId` |

### 4.3 Sektor Non-Mapel (Tips & Trik / Video / Audio)

| Aspek | Detail |
|---|---|
| Data | Dari katalog `extra_blocks`: `{kind: TIPS, VIDEO, AUDIO, title, media_url?, synopsis, duration_seconds?, link?}`. |
| Konten | Konten umum/ tempat umum, **bukan milik mapel**; tetap di-filter jenjang. |
| CTA | klik kartu → drawer/modal ringan (bukan popup besar) atau halaman detail materi non-mapel `/materials/:subjectId` bila di-link ke topik. |
| Ikon | `Lightbulb` (Tips), `PlayCircle` (Video), `Headphones` (Audio). Max 6 colors (design). |

### 4.4 Halaman `:subjectId` — Daftar Bab

| Aspek | Detail |
|---|---|
| Data | `GET /materials/:subjectId/chapters` (BARU) → `{ subject: {...}, chapters: [{chapter_id, title, order_no, progress_pct, correct_count, target_correct, status_chapter, quiz_exam_id?}] }` |
| Aturan | `status_chapter` (merah/amber/hijau) dari `correct_count ≥ target_correct`. |
| Per-Bab | Accordion row: judul bab, progres bar, badge "kuasai"/"belum", CTA buka bab |
| CTA ujian bab | `[Kerjakan Ujian Bab]` → `/exams/{quiz_exam_id}` atau `/exam-practice` bila berbasis practice. Ada di setiap baris bab (tidak hanya terakhir). |

### 4.5 Halaman `:subjectId/:chapterId` — Detail Bab (Topik → CP/KD)

| Aspek | Detail |
|---|---|
| Data | `GET /materials/:subjectId/:chapterId` (BARU) → `{ bab: {...}, topics: [{topic_id, title, order_no, competencies: [{competency_id (CP/KD), code, title, content_blocks: [...]}]}] }` |
| Konten | `content_blocks[]` mendukung `block_type` (`PARAGRAPH, IMAGE, VIDEO, AUDIO, LATEX, TABLE, SVG, GRAPH, CODE, HTML, MARKDOWN, QUIZ, CALLOUT, TIMELINE, EMBED, ACCORDION, CHECKLIST`) — struktur eksisting `content.material_block`. Render sesuai design.md: LaTeX/rumus di-kasih font mono/rumus, grafik via recharts/`SVG` asset, video embed responsive. |
| Sidebar | Daftar topik sticky kiri; status centang untuk topik yang telah dibuka |
| CTA sekunder | `[Lanjutkan belajar]` → materi berikutnya (prev/next navigation) |
| CTA ujian | **Di akhir halaman bab** (fixed-footer section): `[Kerjakan Ujian Bab {n} → /exams]` — primary button |
| Progress | `POST /materials/:id/progress` (existing) tetap diperbarui saat diakses; penguasaan per-bab berasal dari aggregate soal benar (§6) |

### 4.4.5 | Rute lama `/materials/:id` (kompatibilitas)

- Tipe `Material` di `src/types/index.ts` sudah punya field `chapter_id`, `topic_id` — rute lama
  bisa redirect ke `/materials/:subjectId/:chapterId` bila `subject_id`+`chapter_id` tersedia;
  bila tidak, tampilkan mode flat lama. Rute lama dihapus setelah katalog baru live.

---

## 5. Mapping Data → API → DB (ringkasan)

| Field API | Endpoint | Tabel sumber (migrasi) |
|---|---|---|
| `subjects` catalog | `GET /materials/catalog` [BARU] | `academic.curriculum_subject`, `academic.subject`, `academic.grade`, `content.material`, `content.material_subject`, `content.material_grade` |
| `chapters` per mapel | `GET /materials/:subjectId/chapters` [BARU] | `academic.chapter`, `content.material_chapter`, `content.learning_progress`, `cbt.exam` (quiz), `cbt.grading_detail` |
| `topics`+`competencies` | `GET /materials/:subjectId/:chapterId` [BARU] | `academic.subchapter`, `academic.topic`, `academic.competency`, `content.material`, `content.material_block`/`_section_block`, `content.material_topic`/`_competency` |
| `tips/video/audio` | dari katalog | `content.material` (jenis non-mapel dengan `material_type` TIPS/VIDEO/AUDIO), `media.asset` |
| progress soal benar | agregat (view) | `cbt.grading_detail`, `question.question` (link ke `academic.topic`/`competency`) |
| target correct (`default 50`) | `GET /config/student-dashboard` (existing, extend) | `cms.setting`/`system_configuration` |

---

## 6. Penanda & Progres — **berbasis SOAL** (default ≥ 50 benar)

> Design 2026-08-09. Progres penguasaan MAPEL & BAB dihitung dari **jumlah jawaban benar**
> siswa pada soal-soal yang terhubung ke bab/topik/CP-KD (bukan dari seberapa banyak materi dibaca).

- **Per bab:** `progress_pct = min(100, correct_count_bab / target_correct × 100)`.
  - `target_correct` **default 50** — bisa **di-`PUT /config/student-dashboard`** (admin).
- **Per mapel:** hijau jika **seluruh bab** pada mapel itu `progress_pct ≥ 100%`
  (atau config `subject_master_rule = ALL|MAJORITY`, default `ALL`).
- Warna badge/bar:
  - `pct ≥ 100` → **hijau** (`bg-emerald-500/10 text-emerald-600`).
  - `70 ≤ pct < 100` → **amber**.
  - `pct < 70` & `> 0` → **merah** (`bg-red-500/10 text-red-600`).
  - `pct = 0` → abu/border.
- UI: di daftar bab tampil "35/50 benar"; di daftar mapel tampil "8 bab hijau" dan card hijau bila lengkap.

**Config contoh** (`GET /config/student-dashboard` → extended):

```json
{
  "strong_subject_threshold": 70,
  "correct_progress_target": 50,
  "chapter_correct_target": 50,
  "subject_master_rule": "ALL"
}
```

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

> Semua kontrak di bawah **belum ada**. Frontend menulis halaman terhadap skemanya; kontrak
> dibuat & disetujui user lebih dulu (AGENTS rule #4) lalu diekspose via hook mock saat mockup.

| # | Endpoint | Role | Response (usulan) |
|---|---|---|---|
| 1 | `GET /materials/catalog` | SISWA | `{ subjects:[{subject_id, subject_name, icon, color, subject_count, completed_count, progress_pct, status}], extras:[{kind, title, media_url?, duration_seconds?}] }` |
| 2 | `GET /materials/:subjectId/chapters` | SISWA | `{ subject:{...}, chapters:[{chapter_id,title,order_no,progress_pct,correct_count,target_correct,status, quiz_exam_id?}] }` |
| 3 | `GET /materials/:subjectId/:chapterId` | SISWA | `{ bab:{...}, chapters_topics:[{topic_id,title,order_no,competencies:[{competency_id,code,title,content_blocks:[]}]}], quiz_exam_id? }` |
| 4 | (config) `PUT /config/student-dashboard` (extend) | STAFF/ADMIN | tambah `chapter_correct_target`, `subject_master_rule` |

**DB migrate tambahan (usulan, di-review):**

- Untuk agregasi soal benar per bab: buat **view/aggregate** `content` → `cbt` untuk menembus
  `question_learning_material`/`question.learning_type` ↔ `academic.chapter` (sebelumnya ada di 061 FK,
  tinggal perluas).

---

## 8. Catatan Implementasi (saat implementasi)

- **Service/hook:** perluas `frontend/src/services/academic.service.ts` + `hooks/use-learn.ts`
  (TanStack Query): `useLearnCatalog()` asynchronous, `useSubjectChapters(id)` (per-view).
- **Type:** perluas types `LearnSubject`, `LearnChapter`, `LearnTopic`, `ContentBlock` di
  `src/types/index.ts`.
- **Struktur komponen:**
  - `components/siswa/learn/SubjectCard.tsx`
  - `components/siswa/learn/ChapterAccordion.tsx`
  - `components/siswa/learn/TopicSidebar.tsx`
  - `components/siswa/learn/ContentRenderer.tsx` (switch per `block_type`; LaTeX via
    `katex`/`mathjax`, SVG/graph via `recharts`, video via `<video>`/`iframe` embed).
- **Jenjang & akses:** filter/otoritas di sisi server; klien tidak memakai override jenjang.
- **Empty/loading:** skeleton; empty = ilustrasi + CTA; error 403 → halaman akses ditolak.
- **Mockup presentasi:** data katalog/bab/CP-KD di-simulasikan (placeholder).

### Checklist Verifikasi
- [ ] `npx tsc --noEmit` clean; lint clean.
- [ ] Siswa grade `12 SMA` → hanya melihat menu mapel SMA; konten SMP/SD tidak tampil.
- [ ] Kerjakan soal bab (simulasi) → `pct` naik; saat `≥50 benar` bab hijau; semua bab hijau → card mapel hijau.
- [ ] Ubah `chapter_correct_target` (config admin) → indikator langsung berubah.
- [ ] Tombol `Kerjakan Ujian Bab` → benar-forward `/exams/:quiz_exam_id`.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Belajar v1: rute `/materials` → `/:subjectId` → `/:subjectId/:chapterId`; hierarki Mapel→Bab→Topik→CP/KD; progres berbasis soal (default 50, configurable); materi mendukung rumus/grafik/gambar/video; tombol ujian bab. |