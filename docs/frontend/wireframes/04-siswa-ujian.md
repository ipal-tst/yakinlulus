# Wireframe — Halaman Siswa Ujian (Exams / CBT)

> **File:** `docs/frontend/wireframes/04-siswa-ujian.md`
> **Route:** `/exams` (AppShell, role `SISWA` / `SUPER_SISWA`) + runner full-screen terpisah.
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Ujian Siswa** — katalog **paket
ujian** (test/tryout multi-mapel & ujian khusus UTBK/SNMPTN/UM/CAT_PNS yang di-create admin),
alur persiapan → petunjuk → runner **full-screen** → hasil → pembahasan. Diselaraskan dengan
skema DB, backend (Go/Fiber), dan API kontrak (`docs/frontend/API-contract-siswa.md`). Bagian
yang datanya belum ada diberi penanda `[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

Halaman Ujian adalah jendela siswa untuk **mengeksekusi paket ujian** yang disiapkan admin.
Tujuannya:

- **Katalog paket ujian** — dua kategori isi:
  - **Test / Try Out** multi-bidang: satu paket berisi **beberapa mapel** (sub-test per mapel).
  - **Ujian khusus**: UTBK/SNMPTN/UM/CAT_PNS — custom oleh admin, siswa tinggal kerjakan.
- Per paket bisa **1 attempt** (sekali) atau **bisa diulang** (`max_attempts = 1` vs
  `>1` / unlimited), diatur admin.
- **Widget progress** di halaman utama: **nilai terakhir** ujian (untuk paket 1-attempt) dan
  **rata-rata nilai** seluruh ujian yang dikerjakan.
- Alur: klik paket → (bila multi mapel) **pilih sub-test** → **halaman petunjuk** → *Setuju*
  (runner langsung, **timer berjalan**) / *Tidak* (kembali ke halaman sebelumnya).
- Runner **full-screen tanpa kerangka**: topbar (judul, timer, navigasi soal, tombol selesai);
  main terbagi **kiri = soal**, **kanan = opsi jawaban** (desktop) / **susun ke bawah (mobile)**;
  tombol prev/next di bawah opsi.
- Selesai → konfirmasi «Setuju / Kembali mengerjakan» → **halaman hasil** (nilai + statistik) →
  tombol/link **pembahasan** semua soal yang telah dikerjakan.

**Perbedaan kunci vs Latihan (`03-siswa-latihan.md`):** Latihan tidak ada timer, berbasis
hierarki kurikulum, jawaban lokal. **Ujian: punya timer**, basis **paket**, runner **full-screen
tanpa AppShell**, dinilai server saat Selesai.

Design system: `design.md` — CBT fokus penuh (no popup selain konfirmasi, no animasi besar).

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       Belajar   → /materials
│       Latihan   → /practice
│       Ujian ●   → /exams      (active)
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px)
      ├── ✦ /exams                          → Daftar Paket Ujian + Widget progress
      ├── ✦ /exams/:packageId               → Detail paket → daftar sub-test (multi mapel)
      ├── ✦ /exams/:packageId/instructions  → Petunjuk ujian (Setuju / Tidak)
      │
      │   (Setuju → pindah ke halaman FULL-SCREEN tanpa AppShell)
      │
      ├── ✦ /exams/run/:sessionId            → Runner ujian (full-screen)
      ├── ✦ /exams/run/:sessionId/result     → Hasil ujian (nilai + statistik + CTA pembahasan)
      └── ✦ /exams/run/:sessionId/review     → Pembahasan soal-soal yang dikerjakan
```

**Rute baru yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/exams` | Katalog paket ujian (kartu). Widget progress: nilai terakhir + rata-rata. |
| `/exams/:packageId` | Detail paket → bila multipel mapel, pilih **sub-test**; bila single mapel → langsung petunjuk. |
| `/exams/:packageId/instructions` | Halaman petunjuk (aturan, konfigurasi). **Setuju** → start + masuk runner; **Tidak** → kembali. |
| `/exams/run/:sessionId` | Runner **full-screen** (tanpa AppShell). Hanya tombol **Selesai Ujian** (plus navigasi soal). |
| `/exams/run/:sessionId/result` | Hasil: nilai, statistik, tombol pembahasan. |
| `/exams/run/:sessionId/review` | Pembahasan semua soal (opsi benar ter-highlight + penjelasan). |

> Rute lama `/exams/:id` (detail single exam) + `/exams/:id/cbt` tetap ada untuk kompatibilitas,
> tetapi halaman **baru** siswa memakai **paket** (`/exam-packages`). Migrasi bertahap.

**Auth:** Bearer JWT via `src/lib/api.ts`. Akses: siswa hanya paket sesuai jenjang (gate server);
bukan peserta → 403; attempt melebihi max → `409 MAX_ATTEMPTS_REACHED`.

---

## 3. Wireframe ASCII — `/exams` (Daftar Paket Ujian + Widget)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  Halo {nama}! · Ujian & Try Out kamu                                  │  │
│ │  [Penjelasan: kerjakan paket sesuai jadwal; nilai terakhir & rata-rata │  │
│ │   tampil di bawah.]                                                    │  │
│ │  GradeBadge (SMA · Kelas 12 UTBK)                                      │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ WIDGET PROGRESS — grid kartu (2) ─────────────────────────────────────┐ │
│ │  ┌─────────────────────────────┐  ┌─────────────────────────────┐     │ │
│ │  │ Nilai Terakhir (pkg 1-att)  │  │ Rata-rata Nilai Ujian        │     │ │
│ │  │       712 · UTBK #3          │  │       687                    │     │ │
│ │  │  [✓ di atas passing 600]     │  │  (dari 14 ujian dikerjakan)   │     │ │
│ │  └─────────────────────────────┘  └─────────────────────────────┘     │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ FILTER — kategori tab + toggle ────────────────────────────────────────┐ │
│ │  [Semua] [UTBK/SNBT] [UM PTN] [CAT/PNS] [Try Out] [PTS/UAS]            │ │
│ │  (opsional toggle: belum / sudah / bisa diulang)                        │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ DAFTAR PAKET UJIAN — grid kartu (2–3 kolom) ──────────────────────────┐ │
│ │  ┌─────────────────────────┐  ┌─────────────────────────┐             │ │
│ │  │ 🎓 UTBK SNBT #3          │  │ 🏫 UM PTN Gratis #1    │             │ │
│ │  │  Try Out · 4 mapel       │  │  Try Out · 3 mapel     │             │ │
│ │  │  ⏱ 145 mnt · 120 soal   │  │  ⏱ 120 mnt · 90 soal   │             │ │
│ │  │  [1 attempt]            │  │  [Bisa diulang ×3]     │             │ │
│ │  │  nilai terakhir: 720     │  │  [Mulai]               │             │ │
│ │  │  [Lihat]                 │  │                        │             │ │
│ │  └─────────────────────────┘  └─────────────────────────┘             │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

**Kartu paket (1-attempt / repeatable):**
- Badge `1 attempt` → klik → petunjuk. Bila sudah ada nilai → tampil `Nilai terakhir`.
- Badge `×N / unlimited` → tombol `Mulai` (atau `Ulangi`).
- Konten per paket: daftar sub-test dari `GET /exam-packages/:id/exams`.
- Akses cepat: kartu `Lihat` → detail paket; `Mulai` → langsung petunjuk (pra-isi sub-test bila multi).

---

## 3.1 Wireframe — `/exams/:packageId` (Detail Paket + Pilih Sub-Test)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Ujian / Try Out Nasional #4                                  │
│                                                                             │
│ ┌ HEADER PAKET ────────────────────────────────────────────────────────┐  │
│ │  «Try Out Nasional #4»   badges: TRY OUT · 4 mapel · ⏱ 150 mnt       │  │
│ │  max_attempts: 1 | N | ∞          status: OPEN / CLOSED             │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ SUB TESTS (bila multi mapel) ─────────────────────────────────────────┐ │
│ │  Matematika Pendahulan · 25 soal · 30 mnt      [Kerjakan]            │ │
│ │  Penalaran Kuantitatif · 20 soal · 25 mnt      [Kerjakan]            │ │
│ │  Penalaran Umum · 15 soal · 20 mnt             [Kerjakan]            │ │
│ │  (bila single mapel: tanpa sub-test → tombol "Mulai" langsung)        │ │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ CTA → /exams/:packageId/instructions                                       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Aturan:** paket multi mapel → tampilkan daftar sub-test (dari `GET /exam-packages/:id/exams`).
Admin bisa atur **satu sesi keseluruhan** (semua sub-test dalam satu runner) atau per-sub-test.
Navigasi soal mengikuti mode ini.

---

## 3.2 Wireframe — `/exams/:packageId/instructions` (Petunjuk / Aturan)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] AppShell (sidebar + topbar tetap)                                   │
│                                                                             │
│ ┌ KARTU PETUNJUK (center, max-w-640) ───────────────────────────────────┐ │
│ │  📋 Petunjuk Ujian                                                     │ │
│ │  • Jumlah soal: 120 · sub-test: 4 mapel                                │ │
│ │  • Durasi: 150 menit (timer berjalan setelah Anda setuju)               │ │
│ │  • Bebas navigasi nomor; tidak ada penalti isi kosong                   │ │
│ │  • Dilarang pindah tab / keluar layar → violation dicatat               │ │
│ │  • [Checkbox] "Saya siap mematuhi aturan"                               │ │
│ │                                                                         │ │
│ │  [← Tidak (kembali ke detail paket)]   [✅ Setuju, Mulai Ujian]        │ │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Klik "Setuju" → POST start attempt → redirect /exams/run/:sessionId       │
│            (timer LANGSUNG berjalan saat runner loading)                   │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Tidak** → `router.back()` ke halaman sebelumnya (`/exams/:packageId`). **Setuju** → start
> (attempt IN_PROGRESS dilanjutkan / 409 bila max attempt tercapai).

---

## 3.3 Wireframe — `/exams/run/:sessionId` (Runner — FULL SCREEN)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ (TANPA AppShell / sidebar / topbar — layar penuh fokus CBT)                │
│                                                                             │
│ ┌ TOPBAR RUNNER (fixed, 64px, bg-surface-container) ────────────────────┐ │
│ │  «Try Out Nasional #3» · Sub-test: Matematika                           │ │
│ │  ⏱ TIMER  [01:23:45]  (hitung mundur)    [☰ Navigasi]  [🏁 Selesai]  │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ MAIN — 2 KOLOM (desktop) ─────────────────────────────────────────────┐ │
│ │                                                                          │ │
│ │  KIRI — SOAL (60%)                        KANAN — OPSI JAWABAN (40%)    │ │
│ │  ┌─────────────────────────────────┐     ┌────────────────────────────┐ │ │
│ │  │ Nomor soal: 1                   │     │ ( ) A. {−4, 2}            │ │
│ │  │ (soal · langkah · hanya soal)   │     │ (●) B. {−2, 4}            │ │
│ │  │                                 │     │ ( ) C. {−4, −2}           │ │
│ │  │                                 │     │ ( ) D. {2, 4}             │ │
│ │  └─────────────────────────────────┘     │                            │ │
│ │                                             ─────────────────────────────│ │
│ │                                             [← Sebelum] [Berikutnya →]  │ │
│ │                                             └────────────────────────────┘ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ FLOATING NAVIGASI SOAL (dari ikon ☰) ────────────────────────────────┐ │
│  │  kisi nomor 1–40: [1✓][2][3●][4][5][...][40] (✓dijawab, ●aktif)     │ │
│  │  [Ragu-ragu] · [Tutup]                                              │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ⚠ DIALOG SELESAI (klik "Selesai Ujian")                                   │ │
│   "Yakin mengumpulkan? Semua jawaban akan dikirim & dinilai."               │ │
│   [Kembali Mengerjakan]   [Setuju, Selesai] → POST submit → /result        │ │
└────────────────────────────────────────────────────────────────────────────┘
```

**Aturan kunci runner:**
- **Full-screen**: tidak ada AppShell, tidak ada tombol kembali/kecil selain tombol **Selesai
  Ujian** (navigasi soal tetap tersedia).
- **Timer** di topbar; bila `remaining_seconds=0` → auto-submit + redirect hasil (atau per config).
- **Layout 2 kolom (desktop)**: kiri **hanya soal + nomor**, kanan **opsi jawaban**. **Mobile**:
  disusun ke bawah — soal dulu, opsi di bawah, prev/next paling bawah.
- **Opsi** interaktif pill; terpilih → highlight; bisa ganti (jawaban akhir yang dikirim).
- **Navigasi**: tombol Sebelum/Selanjutnya di bawah opsi; floating panel dari ☰ (nomor dengan
  status dijawab / ragu / aktif / belum).
- **Auto-save**: jawaban dikirim via `sync` saat berpindah soal + saat `finish`.

---

## 3.4 Wireframe — `/exams/run/:sessionId/result` (Hasil Ujian)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Ujian / {judul paket} / Hasil                                │
│                                                                             │
│ ┌ KARTU NILAI (hero) ───────────────────────────────────────────────────┐  │
│ │  🏆 Total Nilai        712 / 760          badge: ✅ LULUS (≥ passing) │  │
│ │  🎯 UTBK SNBT #3 · Try Out · 4 mapel                                  │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ STATISTIK (grid 3–4) ──────────────────────────────────────────────────┐ │
│ │  Benar 92   Salah 18   Kosong 10   Waktu 02:14:33 (detik: 8073s)       │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ SUB-SCORE per mapel (bila multi sub-test) ────────────────────────────┐ │
│ │  Matematika 168/180 · Penalaran Kualitatif 145/180 · ...              │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ CTA ──────────────────────────────────────────────────────────────────┐  │
│ │  [📖 Lihat Pembahasan → /exams/run/:sessionId/review]  (primer)       │  │
│ │  [↻ Ulangi (bila repeatable)] · [Kembali ke Daftar Ujian]             │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.5 Wireframe — `/exams/run/:sessionId/review` (Pembahasan Soal)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Ujian / {paket} / Pembahasan · skor 92% · waktu 01:14:33           │
│                                                                             │
│ ┌ KARTU SOAL 1 (susun VERTIKAL ke bawah, satu per satu) ────────────────┐  │
│ │  Soal 1 · Matematika · [✓ benar]                                      │  │
│ │  Teks soal…                                                            │  │
│ │  ─────────────────────────────                                         │  │
│ │  A. {−4, 2}         (opsi benar → border hijau highlight)             │  │
│ │  B. {−2, 4}         (opsi yang kamu pilih benar → ✓)                  │  │
│ │  ─────────────────────────────                                         │  │
│ │  💡 PEMBAHASAN: …                                                      │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│ ┌ KARTU SOAL 2 (user salah) ──────────────────────────────────────────┐  │
│ │  Soal 2 · PG [✗ salah] → opsi user ✗ merah + opsi benar ✓ hijau     │  │
│ │  💡 PEMBAHASAN: …                                                     │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│  (dst — semua soal bersusun ke bawah, scroll alami)                       │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

Semua response API sudah di-`unwrap` (`data`). Notasi field: `data.<path>`.

### 4.1 Halaman utama `/exams`

| Aspek | Detail |
|---|---|
| Data | `GET /exam-packages?education_level=` (existing) → `[]ExamPackage {id, code, name, education_level, grade_id?}` + per paket tambahan `max_attempts`, `subjects_count`, `total_questions`, `duration_minutes`, `attempts_used`, `last_score`, `status` `[KONTRAK BARU: extend]` |
| Widget | `GET /exams/summary` `[KONTRAK BARU]` → `{last_score:{package_name, score, passing_score, above_passing}, avg_score, total_taken}` |
| Filter | kategori tab (`UTBK_SNBT, UM_PTN, TRYOUT_NASIONAL, PTS_UAS, UJIAN_HARIAN, UJIAN_BAB`, + `CAT_PNS` `[BARU]`), search, toggle status |
| Kartu | klik → `/exams/:packageId`; tombol `Mulai`/`Lihat` sesuai state attempt |

### 4.2 Detail paket `/exams/:packageId`

| Aspek | Detail |
|---|---|
| Data | `GET /exam-packages/:id/exams` (existing) → `[{exam_content_id, subject_name, display_order}]` |
| Mode | `package_mode` `[BARU]`: `SINGLE` (satu sesi semua mapel) vs `PER_SUBTEST` (mulai terpisah) — atur admin |
| CTA | `[Kerjakan]` → `/exams/:packageId/instructions` |

### 4.3 Petunjuk `/exams/:packageId/instructions`

| Aspek | Detail |
|---|---|
| Aturan | dari `GET /exam-packages/:id` + `exam.metadata` (durasi, jumlah soal, passing) |
| Checkbox | harus tercentang agar tombol Setuju aktif |
| Setuju | `POST /exams/:examId/attempts/start` (per sub-test pertama) → redirect `/exams/run/:sessionId` |
| Tidak | `router.back()` |

### 4.4 Runner `/exams/run/:sessionId` (full-screen)

| Aspek | Detail |
|---|---|
| Layout | Tanpa AppShell. Topbar: judul, **timer**, `☰` navigasi, `Selesai`. Main 2 kolom (desktop) / stacked (mobile) |
| Data soal | `GET /cbt/:session_id/questions` (existing) → `SessionQuestion[]` |
| Simpan jawaban | `POST /cbt/:session_id/sync` (existing) saat pindah soal + auto-interval; `navigate` untuk current |
| Selesai | konfirmasi → `POST /cbt/:session_id/finish` (existing) → redirect `/exams/run/:sessionId/result` |
| Timer habis | `remaining_seconds=0` → auto-finish (config server) |

### 4.5 Hasil `/exams/run/:sessionId/result`

| Aspek | Detail |
|---|---|
| Data | `GET /results/:session_id` (existing) → `Result` (score, passing, is_passed, duration_seconds, subject_breakdown) |
| CTA | `[Lihat Pembahasan]` (primer), `[Ulangi]` (bila repeatable & belum max attempt), `[Daftar Ujian]` |

### 4.6 Pembahasan `/exams/run/:sessionId/review`

| Aspek | Detail |
|---|---|
| Data | `GET /cbt/:session_id/review` (existing) → `SessionReview` (opsi benar + selected + explanation) |
| Layout | vertikal stack; tiap kartu: soal → opsi (benar hijau, user salah merah) → pembahasan |

---

## 5. Mapping Data → API → DB (ringkasan)

| Field API | Endpoint | Tabel sumber |
|---|---|---|
| paket + sub-test | `GET /exam-packages` + `/:id/exams` (existing) | `cbt.exam_package` (backing `cbt.exam`), join mapel `cbt.exam_subject`; view `cms.exam_packages`, `cms.exam_package_exams` |
| widget summary | `GET /exams/summary` `[BARU]` | `cbt.exam_attempt`, `cbt.grading_result` |
| attempt start | `POST /exams/:id/attempts/start` (existing) | `cbt.exam_attempt` |
| soal runner | `GET /cbt/:session_id/questions` (existing) | `cbt.attempt_question`, `question.question`, `question.question_option` |
| simpan/selesai | `POST /cbt/:session_id/sync` / `finish` (existing) | `cbt.student_answer`, `cbt.grading_result`, `cbt.grading_detail` |
| hasil/pembahasan | `GET /results/:session_id`, `GET /cbt/:session_id/review` (existing) | `cbt.exam_attempt`, `cbt.grading_result`, `cbt.grading_detail` |
| attempt limit | `max_attempts` (existing) | `cbt.exam.max_attempts`, `cbt.exam_attempt` |

---

## 6. Widget Progress — Nilai Terakhir & Rata-rata

> Design 2026-08-09. Dua kartu di header `/exams`.

- **Kartu A — Nilai Terakhir:** skor attempt terbaru yang `GRADED`/`SUBMITTED`. Tampilkan paket
  asal + status lulus (≥ passing). Fokus untuk paket **1-attempt** (sekali paket itu, satu nilai).
- **Kartu B — Rata-rata Nilai:** `avg(score)` seluruh ujian yang selesai; badge `dari {n} ujian`.
- Sumber: `GET /exams/summary` `[KONTRAK BARU]`.

```json
{
  "last_score": { "package_name": "UTBK SNBT #3", "score": 712, "passing_score": 600, "above_passing": true },
  "avg_score": 687.4,
  "total_taken": 14
}
```

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

> Semua kontrak di bawah **belum ada**. Runner/hasil memakai endpoint existing (`/cbt`, `/results`,
> `/exams/:id/attempts/start`). Frontend membangun untuk kontrak di bawah dulu (mock), lalu
> disetujui user (AGENTS rule #4).

| # | Endpoint | Role | Response (usulan) |
|---|---|---|---|
| 1 | (extend) `GET /exam-packages?education_level=` | SISWA | `ExamPackage` + `max_attempts`, `attempts_used`, `subjects_count`, `total_questions`, `duration_minutes`, `status`, `last_score?` |
| 2 | `GET /exams/summary` | SISWA | `{last_score:{package_name, score, passing_score, above_passing}, avg_score, total_taken}` |
| 3 | (extend) `GET /exam-packages/:id` | SISWA | `{...ExamPackage, subjects:[{exam_content_id, subject_name, display_order}], package_mode}` |
| 4 | (extend) enum `ExamCategory` | — | tambah `CAT_PNS` |
| 5 | (opsional) `POST /exams/:packageId/sessions/start` | SISWA | bila atribut `SINGLE` (satu runner utk seluruh sub-test) → 201 `{session_id}` |

**Catatan:** untuk `package_mode`, admin bisa sesuaikan via API `/exam-packages` (existing update)
— tambahkan field opsional.

---

## 8. Catatan Implementasi (saat implementasi)

- **Service/hook:** perluas `frontend/src/services/academic.service.ts` + hooks TanStack Query:
  `useExamPackages()`, `useExamSummary()`, `useStartAttempt()`, `useCBT()` (runner).
- **Layout runner:** route `/exams/run/[sessionId]` memakai **layout terpisah** (tanpa
  `AppShell`) — full-screen (`min-h-screen`), tidak ada sidebar/topbar.
- **State runner**: simpan `answers: Record<question_id, option_id>`, `current`, `doubtful`.
  Kirim `sync` saat pindah (atau interval); `finish` saat Selesai.
- **Timer:** `remaining_seconds` dari response start/`sync`; penurunan lokal; peringatan di menit
  terakhir; auto-submit saat 0.
- **Nav-guard:** sebelum pergi dari runner (back/Tutup/menu) → dialog "Yakin keluar?" (data
  ter-auto-save via sync, jadi aman).
- **Type:** perluas `ExamPackage`, `Exam`, tambah `ExamPackageWithMeta` di `src/types/index.ts`
  (sudah ada `ExamPackage`).
- **Opacity/desktop:** layout kiri-kanan pada `md+`; stacked pada mobile (soal → opsi → prev/next).

### Checklist Verifikasi
- [ ] `npx tsc --noEmit` clean; lint clean.
- [ ] Paket 1-attempt: sekali selesai → widget Kartu A isi; tombol jadi `Lihat` (bukan `Mulai`).
- [ ] Paket repeatable: tombol `Ulangi` tersedia; quiz counter attempt terpakai/tersedia tampil.
- [ ] Paket multi mapel: daftar sub-test → petunjuk → runner (semua mapel dalam satu runner).
- [ ] Setuju → timer berjalan; Tidak → kembali ke detail.
- [ ] Runner full-screen **tanpa** tombol kembali; hanya Selesai; navigasi soal + flag ragu.
- [ ] Selesai → konfirmasi → hasil (nilai+statistik+detik) → pembahasan (opsi benar highlight).
- [ ] Widget summary benar: nilai terakhir + rata-rata dari `/exams/summary`.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Ujian v1: katalog paket (1-attempt & repeatable), multi-mapel sub-test, jenis UTBK/UM/CAT_PNS; alur paket → sub-test → petunjuk (Setuju mulai timer) → runner full-screen (topbar timer/nav/selesai, 2 kolom soal-opsi) → hasil + pembahasan; widget nilai terakhir & rata-rata. |