# Wireframe — Halaman Siswa Hasil & Analisis Belajar

> **File:** `docs/frontend/wireframes/05-siswa-hasil.md`
> **Route:** `/results` (AppShell, role `SISWA` / `SUPER_SISWA`) + sub-halaman detail mapel.
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **Analisis Hasil Belajar Siswa** — halaman
**detail** dari widget dashboard (`01-siswa-dashboard.md`). Halaman menyajikan **hasil belajar
lengkap** dari tiga sumber: **materi** (dipelajari), **latihan soal** (dikerjakan), dan
**ujian** (ditempuh), dalam bentuk **persentase + chart**, berikut indikasi mapel/materi yang
**sudah dikuasai vs kurang dikuasai**, dan **saran penguatan** untuk materi yang perlu dikuasai.

Diselaraskan dengan skema DB, backend (Go/Fiber), dan API kontrak
(`docs/frontend/API-contract-siswa.md`). Data yang belum ada ditandai `[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

Setiap widget di dashboard (`01-siswa-dashboard.md`) menautkan ke halaman ini untuk **drill-down**:

| Widget di dashboard | CTA | Tujuan masuk ke sini |
|---|---|---|
| Statistik Try Out (`exam_stats`) | «Lihat Semua Hasil» → `/results` | riwayat + skor, trend |
| Analisis Mapel Kuat/Lemah (`subject-mastery`) | klik mapel → `/results` | chart akurasi per mapel + rekomendasi |
| Progress Mapel (`subject-progress`) | «Latih Mapel» | status penguasaan mapel |
| Target Sekolah | CTA cara mencapai | saran topik yang menghambat skor |

Tujuan halaman:
- **Satu tempat analisis hasil lengkap**: materi + latihan + ujian, semua tersaji dalam persentase
  dan chart (bar/donut/area).
- **Identifikasi penguasaan**: setiap mapel mendapat status `Dikuasai` / `Perlu Peningkatan` /
  `Kritis` dari agregat akurasi soal (ujian + latihan) dan progres materi.
- **Saran penguatan**: untuk materi/topik yang masih lemah, tampilkan **rekomendasi spesifik**
  (latih topik X, pelajari ulang materi Y) dengan **CTA langsung** ke `/practice` atau `/materials`.
- Cukup **≤2 klik** untuk mencapai aksi (design system `design.md`: UX ≤ 2 klik untuk dashboard &
  belajar).

**Perbedaan key vs halaman lain:** `/results` bukan katalog/runner/tampilan, melainkan
**agregat analitik read-only** berbasis endpoint statistik (`/analytics`, `/practice/stats`,
`/materials/progress`, `/results`). Kemungkinan dibangun dari komposisi endpoint existing +
satu endpoint agregat `[KONTRAK BARU]` (lihat §7).

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       Beranda   → /siswa
│       Belajar   → /materials
│       Latihan   → /practice
│       Ujian     → /exams
│       Hasil ●   → /results        (active)
│       Peringkat → /ranking
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px)
      ├── ✦ /results                          → Analisis Hasil Lengkap (overview + chart + saran)
      ├── ✦ /results/subjects/:subjectId      → Detail satu mapel (bab/topik mastery + rekomendasi)
      └── (lama) /results/:id                  → detail satu ujian (eksisting, tetap ada)
```

**Rute yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/results` | Halaman analisis lengkap: KPI ringkas, BarChart akurasi per mapel, Donut distribusi penguasaan, daftar rekomendasi penguatan, list progres per mapel (dengan CTA drill). |
| `/results/subjects/:subjectId` | Detail satu mapel: header status + ring, mater progres, chart akurasi per bab, list topik status + saran, CTA latihan/materi. |
| `/results/:id` (lama) | Detail hasil satu ujian (existing page `/results/[id]`), tidak diubah. |

> Catatan routing: gunakan segment literal `/subjects/` agar tidak bentrok dengan `/results/:id`.

**Auth:** Bearer JWT via `src/lib/api.ts`. Tidak ada penulisan data — murni read/analytics.

---

## 3. Wireframe ASCII — `/results` (Analisis Hasil Lengkap)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  Halo {nama}! · Analisis Hasil Belajar                                │  │
│ │  [Penjelasan: rangkuman materi, latihan & ujian + saran penguatan]    │  │
│ │  GradeBadge (SMA · Kelas 12) · StreakPill 🔥 4                          │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ KPI RINGKAS — grid 4 (StatsCard) ─────────────────────────────────────┐ │
│ │  Akurasi Total    Mapel Dikuasai    Materi Selesai    Ujian Ditempuh   │ │
│ │     72%              3 / 7           12 / 30 (40%)        14             │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ BarChart — Akurasi per Mapel (%).  ─────┬┐  ┌ Donut — Distribusi ──────┐ │
│ │  Matematika  ████████░░ 78% ✅        ││  │  🟢 Dikuasai (3)   ████░    │ │
│ │  Fisika      ████░░░░░░ 42% ⚠️        ││  │  🟡 Perlu (1)      ██░░░    │ │
│ │  B. Indonesia ████████░ 80% ✅        ││  │  🔴 Lemah (1)     ██░░░    │ │
│ │  B. Inggris   ██████░░░░ 55% ⚠️        ││  └──────────────────────────┘ │ │
│ │  (hijau × threshold kuat, merah <)    ││                                │ │
│ └────────────────────────────────────────┘└────────────────────────────────┘ │
│                                                                             │
│ ┌ TAB: [RANGKUMAN] [RIWAYAT] (opsional; riwayat = page lama) ────────────┐ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ REKOMENDASI PENGUATAN — kartu saran (prioritas) ──────────────────────┐ │
│ │  1. 🔴 Fisika · 42% · "Akurasi bab < threshold. Perkuat: Dinamika"    │ │
│ │     [Latih → /practice?scope=TOPIC]  [Materi → /materials/...]         │ │
│ │  2. 🟠 B.Inggris · 55% · "Perbanyak latihan Topik Reading" ...         │ │
│ │  3. 🟠 Matematika · Limit · 61% · ...                                   │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ DAFTAR PROGAMA PER MAPEL — list kartu (progress bar + status) ────────┐ │
│ │  📐 Matematika ▓▓▓▓▓▓▓░ 68%  [Dikuasai]      [detail →]              │ │
│ │  ⚛️ Fisika     ▓██░░░░░ 42%  [Perlu Peningkatan] [detail →]           │ │
│ │  (bar digabung: materi | latihan | ujian jadi 1 persentase bobot)      │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.1 Wireframe — `/results/subjects/:subjectId` (Detail Satu Mapel)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Hasil / Mapel › Fisika                                        │
│                                                                             │
│ ┌ HEADER MAPEL ──────────────────────────────────────────────────────────┐ │
│ │  ⚛ Fisika · status [🔴 Perlu Peningkatan] · akurasi 42%                │ │
│ │  KPI mini: Materi 3/8 · Latihan 180 soal · Ujian rata-64              │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ AreaChart → Trend skor ujian mapel (tingkat) ──────────────────────────┐ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ PENGUASAAN BAB — panel (dari /practice/catalog + /results) ────────────┐ │
│ │  Bab 1. Kinematika        ▓▓██░░ 40%   [Perkuat]                       │ │
│ │  Bab 2. Dinamika          ▓█████ 62%   [Perkuat]                       │ │
│ │  Bab 3. Hukum Newton      ▓███████ 88% [Dikuasai]                      │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ REKOMENDASI (saran penguatan topik) ───────────────────────────────────┐ │
│ │  • (TOPIC) Kinematika GLBB — akurasi 35% — "Pelajari materi & kerjakan │ │
│ │    10 soal." [LatihTopik →] [Buka Materi →]                            │ │
│ │  • (TOPIC) Dinamika Gaya — akurasi 48% — "... "                         │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ RIWAYAT (latihan + ujian mapel ini, tabel list) ──────────────────────┐ │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

### 4.1 `/results` — KPI Ringkas (grid 4)

| Kartu | Field | Sumber |
|---|---|---|
| Akurasi Total | `(Σ benar / Σ semua soal)` ujian+latihan | `/analytics/students/:id` (existing) + `/practice/stats` (existing) |
| MapDikuasai | `x / y` status | komposisi §7 agregat |
| Materi Selesai | `completed/total · pct` | `/materials/progress` (existing) |
| Ujian Ditempuh | `total` | `/analytics/.../total_exams_taken` (existing) |

### 4.2 Chart akurasi per mapel + distribusi

- **BarChart** (Recharts): sumbu-x mapel, y = `accuracy_pct`. Bar hijau bila `≥ strong_threshold`
  (`config.strong_subject_threshold` default 70), abu/merah bila di bawah. Per-mapel dapat diklik
  → `/results/subjects/:subjectId`.
- **Donut/Pie** distribusi status: jumlah mapel `Dikuasai` / `Perlu Peningkatan` / `Lemah`.
  Max 6 warna (design system; gunakan token Primary/Secondary/Accent + neutrals).

### 4.3 Rekomendasi Penguatan

Daftar 3–5 saran prioritas (diurutkan dari akurasi terendah & topik yang paling berpengaruh
ke target). Tiap kartu:

| Field | Contoh |
|---|---|
| Severity | 🔴 `42% · Fisika` (lemah) / 🟠 `55% · B.Inggris` |
| Pesan saran | "Akurasi topik Dinamika rendah. Kerjakan 10 latihan + pelajari ulang materi." |
| Aksi 1 | «Latih → `/practice?scope=TOPIC&topic_id=...` » (atau `/exam-practice`) |
| Aksi 2 | «Buka Materi → `/materials/{subjectId}` » |

Sumber saran: aturan sederhana server-side (akurasi `< threshold` → saran), belum ada AI.

### 4.4 Daftar progres per mapel

- Kartu per mapel: `Progress` kombinasi (materi read % · latihan accuracy · ujian avg → satu
  `per-mapel blended progress`), badge status (`Dikuasai`/`Perlu ...`/`Lemah`), tombol `detail →`.
- Klik → `/results/subjects/:subjectId`.

### 4.5 Status penguasaan (band)

| Nilai | Status | Token CSS |
|---|---|---|
| pct ≥ `strong_subject_threshold` (default 70) | `Dikuasai` | hijau/Secondary |
| 70.1–84.9 | `Berjalan Baik` (Reuse `color_bands` dari `config/student-dashboard`) | amber |
| ≤ 70 | `Perlu Peningkatan` / `Lemah` | merah/Accent |

> Threshold dibaca `GET /config/student-dashboard` `strong_subject_threshold` (existing DRAFT).

---

## 5. Mapping Data → API → DB (ringkasan)

| Isi | Endpoint | Tabel sumber |
|---|---|---|
| Akurasi per mapel + statistik siswa | `GET /analytics/students/:id` (existing) | `cbt.grading_detail`, `cbt.exam_attempt`, `question.question`, `question.question_subject`, `academic.subject` |
| Akurasi/statistik latihan | `GET /practice/stats` (existing) | `content.practice_session` |
| Progress materi | `GET /material` progress (existing) | `content.learning_progress`, `content.material` |
| Bab/topik mastery (untuk drill & saran) | `GET /practice/catalog` (BARU §15.8) | `content.practice_session`, `academic.*`, `cbt.grading_detail` |
| Status & saran per mapel | `GET /results/analytics` `[KONTRAK BARU]` (usulan) | komposit (query join) `cbt.grading_detail`+`content.practice_session`+`content.learning_progress` |
| Riwayat ujian | `GET /results` + `GET /results/:session_id` (existing) | `cbt.exam_attempt`, `cbt.grading_result`, `cbt.grading_detail` |

---

## 6. Catatan pra-mock / asumsi

- Frontend membangun **halaman ini dulu dari data mock/placeholders**, lalu diisi kontrak aktual.
- Saran penguatan `[KONTRAK BARU]`; jika belum tersedia, mock list diambil dari
  `subject-mastery` + `practice/catalog` yang diagregasi di client.
- `/results/[id]` (existing) tetap; halaman ini hanya menyediakan drill, tidak mengganti `/:id`.

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

> Sebagian besar data tersedia di endpoint existing (`/analytics`, `/practice/stats`,
> `/materials/progress`, `/results`, `/config/student-dashboard`). Endpoint agregat baru untuk
> menyatukan semuanya ketika implementasi (usulan di bawah; dapat diimplementasikan sebagai
> komposisi client dulu).

### 7.1 `GET /results/analytics` (usulan agregat)

| Method | Endpoint | Role | Response (usulan) |
|---|---|---|---|
| GET | `/results/analytics` | SISWA | `{ subjects:[{subject_id, subject_name, status MASTERED|GUARD|WEAK, accuracy_pct_ujian, accuracy_pct_latihan, material_pct, exam_avg, exam_count, weakest_topic:{topic_id, name, accuracy}, recommended:[{topic_id, name, reason, action}]}], summary:{accuracy_total, mastered_count, subject_total, material_completed, material_total, exam_taken} }` |

### 7.2 Reuse (tanpa kontrak baru)

| Endpoint | Peran |
|---|---|
| `GET /analytics/students/:id` | akurasi ujian per mapel (existing) |
| `GET /practice/stats` | latihan accuracy (existing) |
| `GET /practice/catalog` | bab/topic hierarchy + status (BARU §15.8) |
| `GET /materials/progress` | progress materi (existing) |
| `GET /config/student-dashboard` | threshold `strong_subject_threshold` (BARU §15.6) |
| `GET /results` | riwayat ujian |

---

## 8. Catatan Implementasi (saat implementasi)

- **Service/hook:** buat `frontend/src/services/analytics.service.ts` + hook TanStack Query
  `useResultsAnalytics()`; reuse `usePracticeCatalog()` (dari §15.8) dan `useMaterialsProgress()` (jika belum ada).
- **Type:** tambah `ResultsAnalytics`, `SubjectMasteryStatus`, `RecommendationItem` di
  `frontend/src/types/index.ts` (atau `admin.ts`); `band → token CSS`.
- **Chart:** Recharts `BarChart`, `Pie/Donut`, `LineChart` (≥chapter). Max 6 warna.
- **Threshold:** `strong_subject_threshold` dari `GET /config/student-dashboard`.
- **Drill links:** `/results/:subjectId` hanya untuk mapel; gunakan `/subjects/` literal di depan
  parameter agar tidak bentrok dengan `results/[id]`.
- **Empty:** belum ada data → `ilustrasi + CTA "Kerjakan Tryout" `.
- **Mobile:** chart full-width, rekomendasi kartu stack.

### Checklist Verifikasi
- [ ] KPI ring, BarChart & Donut tampil dengan benar dari komposisi data.
- [ ] Status tiap mapel benar (`≥70 = dikuasai` dll), warna sesuai token.
- [ ] Rekomendasi · /materi menuju route existing `/practice` dan `/materials`.
- [ ] Subroute `/results/subjects/...` tidak bentrok dengan `/results/:id` (test).
- [ ] `npx tsc --noEmit` clean; lint clean.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Hasil & Analisis v1: halaman `/results` (ringkas KPI, BarChart akurasi per mapel, Donut distribusi, Rekomendasi Penguatan, daftar progres per mapel) + `/results/subjects/:subjectId` (detail status, bab/topik mastery, trend, saran) + `GET /results/analytics` `[KONTRAK BARU]`. Detail page dari widget dashboard (`01-siswa-dashboard.md`).