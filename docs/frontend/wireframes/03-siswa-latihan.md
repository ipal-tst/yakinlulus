# Wireframe — Halaman Siswa Latihan (Practice)

> **File:** `docs/frontend/wireframes/03-siswa-latihan.md`
> **Route:** `/practice` (AppShell, role `SISWA` / `SUPER_SISWA`)
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Latihan Siswa** — daftar latihan
berdasarkan hierarki *Mata Pelajaran → Bab → Topik*, runner pengerjaan (tanpa waktu), halaman
hasil, dan pembahasan. Diselaraskan dengan skema DB, backend (Go/Fiber), dan API kontrak
(`docs/frontend/API-contract-siswa.md`). Bagian datanya yang belum ada diberi penanda
`[KONTRAK BARU]` untuk dibuat menyusul.

---

## 1. Konteks & Tujuan

Halaman Latihan adalah tempat siswa **mengasah soal secara berulang** per tingkat hierarki
kurikulum. Tujuannya:

- **Daftar latihan** dikelompokkan per **Mapel → Bab → Topik** (sesuai jenjang siswa).
- Latihan **bisa dikerjakan berulang-ulang** (tidak ada batas attempt, bebas ulang kapan pun).
- **Progress penguasaan** dengan indikator warna: **hijau bila skor benar ≥ 85%** (threshold
  **bisa di-custom admin**), dan aturan ini berlaku **recursive ke setiap child** pada pohon
  hierarki.
- Ada **riwayat latihan** yang pernah dijalankan; tiap entri bisa diklik → **langsung ke
  halaman pembahasan** latihan tersebut.
- **Runner ujian berlangsung di dalam modul ini**: tanpa hitung mundur waktu, dengan **navigasi
  soal** (ikon → floating navigasi), tombol navigasi, dan **flag ragu-ragu**. Runner memakai
  **full main section** — sidebar & topbar (AppShell) tetap tampil.
- Jawaban **hanya terekam saat klik "Selesai Ujian"**. Keluar tengah jalan (klik sidebar) →
  peringatan; jika diakhiri, **jawaban tidak direkam / hilang**.

**Target primer UX:** siswa langsung tahu topik/bab/mapel mana yang sudah "hijau" (dikuasai
≥ threshold) dan bisa mengulang latihan mana pun tanpa rasa takut kehilangan progress — karena
mengulang justru memperbarui akurasi penguasaan.

Design system: `design.md` (Modern Minimal Education; sukses = Secondary Green, peringatan =
Accent Orange, never as background).

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       Beranda   → /siswa
│       Belajar   → /materials
│       Latihan ● → /practice      (active)
│       Ujian     → /exams
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px, container max-w-1600px)
      ├── ✦ /practice                        → Daftar Latihan (hierarki) + Riwayat
      ├── ✦ /practice/:sessionId             → Runner pengerjaan (full main, tanpa timer)
      ├── ✦ /practice/:sessionId/result      → Hasil latihan (statistik detik + CTA pembahasan)
      └── ✦ /practice/:sessionId/review      → Pembahasan (soal → opsi → pembahasan, vertikal)
```

**Rute baru yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/practice` | Daftar latihan: hierarki Mapel→Bab→Topik (accordion), indikator hijau penguasaan, CTA "Mulai", dan section **Riwayat Latihan**. |
| `/practice/:sessionId` | Runner pengerjaan (full main section). Tidak ada waktu. Navigasi soal + flag ragu-ragu + tombol Selesai. |
| `/practice/:sessionId/result` | Halaman hasil: ringkasan skor, statistik (detik), tombol/link pembahasan. |
| `/practice/:sessionId/review` | Pembahasan: susunan vertikal **soal → opsi jawaban (opsi benar ter-highlight) → pembahasan**. Juga dibuka dari Riwayat. |

> Rute runner sengaja **tidak** memakai `/exams/:id/cbt` karena latihan ini scoped ke hierarki
> kurikulum (mapel/bab/topik) dan tanpa durasi — alur submit-nya sendiri (hanya terekam saat
> Selesai).

**Auth:** Bearer JWT via `src/lib/api.ts`. Semua akses divalidasi jenjang: konten
`grade_id` / `education_level_id` != milik siswa → **404 (bukan 403)** agar tidak bocorkan
keberadaan konten.

---

## 3. Wireframe ASCII — `/practice` (Daftar Latihan + Riwayat)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  Halo {nama}! · "Latihan rutin 15 menit/hari kunci nilai bagus 💪"      │  │
│ │  [Penjelasan: latihan mengikuti kurikulum-mu; hijau = ≥85% benar]       │  │
│ │  GradeBadge (SMA · Kelas 12 UTBK)   ·   [threshold: ≥85%]  (dari config)│ │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ DAFTAR LATIHAN — hierarki Mapel (Accordion) ───────────────────────────┐ │
│ │                                                                         │ │
│ │  ▸ 📘 Matematika           [▓▓▓▓▓▓▓▓░░ 82%]   badge: 6/8 bab hijau      │ │
│ │   ├─ ▸ Bab 1 · Aljabar     [▓▓▓▓▓▓▓▓▓░ 90%]   ✓ HIJAU                  │ │
│ │   │    ├─ ● Topik: Konsep Dasar      [90% ✓]  ✓ HIJAU   [Mulai]        │ │
│ │   │    ├─ ● Topik: Operasi Aljabar   [88% ✓]  ✓ HIJAU   [Mulai]        │ │
│ │   │    └─ ● Topik: Faktorisasi       [60% ▓]  ○ BELUM    [Mulai]        │ │
│ │   │                                    (amber: 60 < 85)                 │ │
│ │   ├─ ▸ Bab 2 · Persamaan Kuadrat    [75% ▓]  ○ BELUM   [Mulai Bab]     │ │
│ │   │    └─ ● Topik: Rumus ABC        [75% ▓]  ○ BELUM    [Mulai]        │ │
│ │   └─ ▸ Bab 3 · ...                                                        │ │
│ │                                                                         │ │
│ │  Klik header bab → expand topik. Klik "Mulai" → POST start → runner.     │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ RIWAYAT LATIHAN — card daftar (pagination) ────────────────────────────┐ │
│ │  [🎯 Matematika · Bab 1 · Topik Aljabar]  [✓ 9/10]  [00:04:32]  [Hasil] │ │
│ │  [🧮 Matematika · Bab 2]                    [✓ 7/10]  [00:03:10]  [Hasil] │ │
│ │  [📗 B.Indonesia · Topik Ide Pokok]         [✗ 5/10]  [00:05:00]  [Hasil] │ │
│ │  klik → /practice/:sessionId/review  (pembahasan langsung)                │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Responsive:** accordion bab → full-width; riwayat → card grid 2→1 kolom.

---

## 3.1 Wireframe — `/practice/:sessionId` (Runner — Full Main, Tanpa Waktu)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [AppShell tetap]  Sidebar kiri + Topbar (72px). Main = FULL RUNNER.         │
│                                                                             │
│ ┌ HEADER RUNNER ────────────────────────────────────────────────────────┐  │
│ │  Matematika · Bab 1 · Topik Aljabar        [flag: 1 ragu]  [SELESAI →] │  │
│ │  Progress bar: ▓▓▓▓▓▓░░░ 5/10 · No timer (TANPA waktu)               │  │
│ │  [☰ Navigasi Soal]   (ikon grid — klik → floating panel)             │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ BODY SOAL ────────────────────────────────────────────────────────────┐  │
│ │  Soal 5 dari 10   [🏳️ ragu-ragu  /  batalkan flag]                    │  │
│ │  ─────────────────────────────────────────────────                    │  │
│ │  Jika x² + 2x − 8 = 0, maka himpunan penyelesaian-nya adalah …          │  │
│ │  ─────────────────────────────────────────────────                    │  │
│ │  ( ) A. {−4, 2}       (klik opsi → ter-pilih, highlight)              │  │
│ │  (●) B. {−2, 4}                                                         │  │
│ │  ( ) C. {−4, −2}                                                        │  │
│ │  ( ) D. {2, 4}                                                          │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ NAVIGASI BAWAH ───────────────────────────────────────────────────────┐  │
│ │  [← Sebelumnya]                          [Berikutnya →]               │  │
│ │                                                                         │  │
│ │  🏁 [SELESAI UJIAN]  (primer)  → Dialog "Yakin selesai?"               │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ FLOATING PANEL NAVIGASI SOAL (popup, dari ikon ☰) ────────────────────┐ │
│ │  Kisi-kisi nomor 1–10:                                                   │ │
│ │   [1✓] [2✓] [3✗] [4] [5●] [6] [7] [8] [9] [10]                        │ │
│ │    ✓=dijawab  ✗=dijawab+ragu  ●=sedang  kosong=belum                  │ │
│ │  [Tutup]                                                                │ │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ⚠ DIALOG KELUAR (klik menu sidebar saat ada jawaban)                      │ │
│   "Akhiri latihan?" · "Jawaban yang belum di-submit akan HILANG."          │ │
│   [Lanjut Mengerjakan]   [Akhiri — Jawaban Tidak Direkam]                  │ │
└────────────────────────────────────────────────────────────────────────────┘
```

**Alur data (penting):**
1. Jawaban disimpan **hanya di state lokal** (Zustand/useState per sesi) selama pengerjaan.
2. Keluar tengah jalan (`Akhiri`) → **tidak ada request submit** → sesi dianggap dibatalkan,
   jawaban hilang. (Opsional: `DELETE /practice/sessions/:id` untuk bersih-bersih server.)
3. Data **tersimpan hanya** ketika klik `[SELESAI UJIAN]` → konfirmasi → `POST .../submit`
   → navigasi ke `/practice/:sessionId/result`.

---

## 3.2 Wireframe — `/practice/:sessionId/result` (Hasil Latihan)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Latihan / Hasil                                              │
│                                                                             │
│ ┌ KARTU SKOR (hero) ────────────────────────────────────────────────────┐  │
│ │  [✓ 8/10 benar]   Skor 80%   [🔴 belum hijau — target ≥85%]           │  │
│ │  🎯 Matematika · Bab 1 · Topik Aljabar                                 │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ STATISTIK (grid 4) ───────────────────────────────────────────────────┐  │
│ │  Benar 8   Salah 2   Kosong 0   Waktu 04:32 (detik: 272s)              │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ CTA ──────────────────────────────────────────────────────────────────┐  │
│ │  [📖 Lihat Pembahasan → /practice/:sessionId/review]  (primer)         │  │
│ │  [↻ Ulangi Latihan → POST start baru]   [Kembali ke Latihan]           │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.3 Wireframe — `/practice/:sessionId/review` (Pembahasan)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Latihan / Riwayat / Pembahasan                               │
│ HEADER: Matematika · Bab 1 · Topik Aljabar · Skor 80% · Waktu 04:32          │
│                                                                             │
│ ┌ KARTU SOAL 1 (susun VERTIKAL ke bawah, satu per satu) ────────────────┐  │
│ │  Soal 1 · PG    [✓ jawaban-mu benar]                                   │  │
│ │  x² + 2x − 8 = 0, himpunan penyelesaian-nya adalah …                   │  │
│ │  ─────────────────────────────────                                    │  │
│ │  A. {−4, 2}                                                            │  │
│ │  B. {−2, 4}   ← di-highlight border hijau (opsi BENAR)               │  │
│ │     (jawaban-mu ✓ jika benar; ✗ merah jika salah → tampilkan)        │  │
│ │  ─────────────────────────────────                                    │  │
│ │  💡 PEMBAHASAN: (x+4)(x−2)=0 → x=−4 atau x=2 …                        │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ KARTU SOAL 2 (berikutnya di bawah) ───────────────────────────────────┐  │
│ │  Soal 2 · PG    [✗ salah]                                             │  │
│ │  … (opsi yang dipilih user: ✗ merah; opsi benar: ✓ hijau)              │  │
│ │  💡 PEMBAHASAN: …                                                       │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  (dst — semua soal bersusun ke bawah, scroll alami)                         │
└────────────────────────────────────────────────────────────────────────────┘
```

> Dari **Riwayat** di `/practice`, klik entri → langsung ke halaman ini (tanpa lewat result).

---

## 4. Spesifikasi per-seksi

Semua response API sudah di-`unwrap` (`data`). Notasi field: `data.<path>`.

### 4.1 Header `/practice`

| Aspek | Detail |
|---|---|
| Data | greeting + `GradeBadge` + badge threshold `≥{practice_master_threshold}%` (dari `GET /config/student-dashboard`) |
| Config | `practice_master_threshold` (default **85**) — admin ubah via `PUT /config/student-dashboard` `[KONTRAK BARU: extend]` |

### 4.2 Daftar Latihan — Hierarki Mapel→Bab→Topik

| Aspek | Detail |
|---|---|
| Data | `GET /practice/catalog` `[BARU]` → `{ config:{threshold}, subjects:[{subject_id, subject_name, icon, color, progress_pct, status, chapters:[{chapter_id, title, progress_pct, status, topics:[{topic_id, title, progress_pct, status, question_count}]}]}] }` |
| Perilaku | Accordion 2 level: klik mapel → daftar bab; klik bab → daftar topik. Setiap baris leaf/topik punya tombol `[Mulai]`. Bab juga punya `[Mulai Bab]` (acak seluruh soal bab). |
| Aturan warna | `status`: `GREEN` (hijau) bila `progress_pct ≥ threshold`; `AMBER` bila `0 < pct < threshold`; `GRAY/EMPTY` bila belum ada latihan. **Recursive:** mapel hijau bila **seluruh bab** hijau; bab hijau bila **seluruh topik** hijau **ATAU** `progress_pct ≥ threshold` (bab-nya sendiri); topik hijau bila `progress_pct ≥ threshold`. |
| Progress | `progress_pct = Σ correct / Σ total` untuk **seluruh attempt** di node tsb (aggregate), `×100`. Dihitung server-side (lihat §6). |
| CTA | `[Mulai]` → `POST /practice/start` (level + node id) → `{session_id}` → router ke `/practice/:sessionId`. |

### 4.3 Riwayat Latihan

| Aspek | Detail |
|---|---|
| Data | `GET /practice/sessions` (existing, `?page=&limit=`) diperluas → item punya `practice_scope` (`{level, subject_name, chapter_title?, topic_title?}`) + `duration_seconds` + `accuracy_pct` |
| Entri | kartu: judul scope, `✓ benar/total`, `duration_seconds`, tombol `[Hasil]`; **seluruh kartu klik → `/practice/:sessionId/review`** |
| Pagination | reuse `meta` (limit default 20) |

### 4.4 Runner `/practice/:sessionId`

| Aspek | Detail |
|---|---|
| Layout | **Full main section** di dalam AppShell (sidebar + topbar tetap). Tidak ada layar penuh tanpa kerangka. |
| Waktu | **Tidak ada timer / hitung mundur** sama sekali (tidak ada `remaining_seconds`, tidak ada pause). |
| Data soal | `GET /practice/sessions/:sessionId` `[BARU]` → `{session_id, practice_scope, questions:[{question_id, content, options:[{id,key,content}], is_doubtful?}]}` |
| State jawaban | lokal saja (per sesi). Tidak ada `answer` per-soal ke server. |
| Navigasi soal | ikon `[☰]` → **floating panel** kisi nomor (answered/flagged/current/belum), bisa lompat ke nomor mana pun; tutup = kembali |
| Flag ragu | toggle per soal (`Flag` icon) — tampil di nomor panel + di header runner counter `{n} ragu` |
| Nav bawah | `[Sebelumnya]` `[Berikutnya]`, dan `[SELESAI UJIAN]` (primer) |
| Keluar tengah jalan | klik menu sidebar saat ada jawaban → Dialog `Akhiri latihan?` — `[Lanjut Mengerjakan]` (tetap) / `[Akhiri — Jawaban Tidak Direkam]` (tanpa submit, jawaban hilang). Bila belum ada jawaban → langsung boleh pindah. |
| Selesai | `[SELESAI UJIAN]` → Dialog `Yakin selesai?` → `[Batal]` / `[Ya, Selesai]` → `POST /practice/sessions/:sessionId/submit` → redirect `/practice/:sessionId/result` |

### 4.5 Hasil `/practice/:sessionId/result`

| Aspek | Detail |
|---|---|
| Data | `GET /practice/sessions/:sessionId/result` `[BARU]` (atau response submit) → `{session_id, scope, total, correct, wrong, unanswered, accuracy_pct, duration_seconds, passed}` |
| Statistik | kartu grid: Benar / Salah / Kosong / **Waktu (detik)** |
| Status hijau | `passed = accuracy_pct ≥ threshold` — badge hijau/merah + teks target |
| CTA | `[Lihat Pembahasan]` (primer → `/review`), `[Ulangi Latihan]` (POST start baru), `[Kembali ke Latihan]` |

### 4.6 Pembahasan `/practice/:sessionId/review`

| Aspek | Detail |
|---|---|
| Data | `GET /practice/sessions/:sessionId/review` `[BARU]` → `{session_id, scope, questions:[{number, content, options:[{key,text,is_correct}], selected_key?, is_correct, explanation}]}` |
| Layout | susunan **vertikal** (stack) kartu soal; tiap kartu: soal → daftar opsi (opsi **benar di-highlight** hijau; opsi pilihan user yang salah di-highlight merah + tanda) → blok **pembahasan** (`Lightbulb`) |
| Akses | owner saja; dari `/result` (tombol) atau langsung dari `/practice` (riwayat) |

---

## 5. Mapping Data → API → DB (ringkasan)

| Field API | Endpoint | Tabel sumber |
|---|---|---|
| `subjects/chapters/topics` | `GET /practice/catalog` `[BARU]` | `academic.curriculum_subject`, `academic.subject`, `academic.chapter`, `academic.subchapter`/`academic.topic` |
| progress/status per node | agregat server `[BARU]` | `content.practice_session`, `question.question`, `question.question_option`, `cbt.attempt_question`, `cbt.attempt_option` (atau tabel jawaban latihan) |
| start session | `POST /practice/start` `[BARU]` | `content.practice_session`, `question.question` (filter scope level) |
| soal runner | `GET /practice/sessions/:sessionId` `[BARU]` | `content.practice_session`, `question.question`, `question.question_option` |
| submit | `POST /practice/sessions/:sessionId/submit` `[BARU]` | `content.practice_session`, jawaban/`cbt.attempt_*`, agregat `accuracy` |
| result/review | `GET /practice/sessions/:sessionId/result|review` `[BARU]` | `content.practice_session`, `cbt.grading_detail`-like, `question.question` |
| riwayat | `GET /practice/sessions` (extend) | `content.practice_session` |
| threshold | `PUT /config/student-dashboard` `[BARU: extend]` | `cms.setting` / `system_configuration` |

---

## 6. Penanda & Progres — berbasis SKOR per latihan (default ≥ 85%)

> Design 2026-08-09. Penguasaan dihitung dari **skor benar** latihan yang dijalankan, bukan dari
> jumlah soal tertentu. Dihitung **aggregate di seluruh attempt** (karena latihan bisa berulang).

- **`progress_pct(node) = Σ correct(node) / Σ total(node) × 100`** — agregat seluruh jawaban
  dari semua attempt latihan pada node itu (topik/bab/mapel).
- **Threshold:** `practice_master_threshold`, **default 85** — custom admin via
  `PUT /config/student-dashboard` `[KONTRAK BARU: extend]`.
- **Aturan hijau (recursive):**
  - **Topik (leaf):** hijau ⟺ `progress_pct ≥ threshold`.
  - **Bab:** hijau ⟺ seluruh topik di bawahnya hijau **ATAU** `progress_pct(bab) ≥ threshold`
    (latihan soal bab langsung yang ≥ threshold).
  - **Mapel:** hijau ⟺ **seluruh bab** di bawahnya hijau.
- Warna badge/bar:
  - `pct ≥ threshold` → **hijau** (`bg-emerald-500/10 text-emerald-600`).
  - `0 < pct < threshold` → **amber**.
  - `pct = 0` / belum ada latihan → abu/border.
- UI: di kartu topik tampil `90% · hijau`; di header mapel tampil `6/8 bab hijau`.

**Config contoh** (`GET /config/student-dashboard` → extended):

```json
{
  "strong_subject_threshold": 70,
  "correct_progress_target": 50,
  "chapter_correct_target": 50,
  "subject_master_rule": "ALL",
  "practice_master_threshold": 85
}
```

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

> Semua kontrak di bawah **belum ada**. Frontend menulis halaman terhadap skemanya; kontrak
> dibuat & disetujui user lebih dulu (AGENTS rule #4) lalu diekspose via hook mock saat mockup.

| # | Endpoint | Role | Response (usulan) |
|---|---|---|---|
| 1 | `GET /practice/catalog` | SISWA | `{ config:{threshold}, subjects:[{subject_id,name,icon,color,progress_pct,status,chapters:[{chapter_id,title,progress_pct,status,topics:[{topic_id,title,progress_pct,status,question_count}]}]}] }` |
| 2 | `POST /practice/start` | SISWA | body `{level:"SUBJECT|CHAPTER|TOPIC", subject_id?, chapter_id?, topic_id?}` → 201 `{session_id}` |
| 3 | `GET /practice/sessions/:sessionId` | SISWA | `{session_id, scope, questions:[{question_id, content, options:[{id,key,content}]}]}` (no timer) |
| 4 | `POST /practice/sessions/:sessionId/submit` | SISWA | `{answers:[{question_id, selected_option_id}]}` → `{session_id, correct, wrong, unanswered, accuracy_pct, duration_seconds, passed}` |
| 5 | `GET /practice/sessions/:sessionId/result` | SISWA | statistik (detail skor) |
| 6 | `GET /practice/sessions/:sessionId/review` | SISWA | `{questions:[{number, content, options:[{key,text,is_correct}], selected_key?, is_correct, explanation}]}` |
| 7 | (extend) `PUT /config/student-dashboard` | STAFF/ADMIN | tambah `practice_master_threshold` (default 85) |
| 8 | (extend) `GET /practice/sessions` | SISWA | item ditambah `practice_scope`, `duration_seconds`, `accuracy_pct` |

**Catatan:** alur runner sengaja **tanpa** endpoint `answer` per-soal (jawaban lokal sampai
submit). Jika tim butuh recover dari refresh, tambahkan `POST /practice/sessions/:sessionId/sync`
(opsional, simpan draft lokal server).

---

## 8. Catatan Implementasi (saat implementasi)

- **Service/hook:** tambah ke `frontend/src/services/academic.service.ts` + hook TanStack Query:
  `usePracticeCatalog()`, `usePracticeSession(id)`, `useSubmitPractice(id)`.
- **State runner:** `zustand` store per sesi (`answers: Record<question_id, option_id>`,
  `doubtful: Set<question_id>`, `current`); **tidak** disinkronkan ke server sampai submit.
- **Nav guard:** bungkus `useRouter`/`Link` dengan konfirmasi keluar bila `answers.size > 0`.
- **Type:** `PracticeScope`, `PracticeSession`, `PracticeResult`, `PracticeReview` di
  `src/types/index.ts`.
- **Struktur komponen:**
  - `components/siswa/practice/PracticeTree.tsx` (accordion mapel→bab→topik)
  - `components/siswa/practice/PracticeHistory.tsx` (riwayat)
  - `components/siswa/practice/RunnerHeader.tsx` + `QuestionNavigator.tsx` (floating panel)
  - `components/siswa/practice/QuestionCard.tsx` (opsi + flag ragu)
  - `components/siswa/practice/ResultPanel.tsx` / `ReviewList.tsx`
- **Dialog:** pakai `Dialog`/`AlertDialog` shadcn; keluar & selesai → konfirmasi.
- **Jenjang & akses:** filter/otoritas di sisi server; klien tidak memakai override jenjang.
- **Empty/loading:** skeleton; empty riwayat = ilustrasi + CTA "Mulai latihan pertama".

### Checklist Verifikasi
- [ ] `npx tsc --noEmit` clean; lint clean.
- [ ] Siswa grade `12 SMA` → katalog latihan hanya menampilkan mapel/bab/topik SMA.
- [ ] Selesai latihan dengan benar 8/10 → `accuracy_pct=80` → topik **amber** (bukan hijau).
- [ ] Ulangi latihan sampai `≥85%` → topik **hijau**; bab dengan semua topik hijau → bab hijau;
      semua bab hijau → mapel hijau.
- [ ] Ubah `practice_master_threshold` (admin, mis. ke 75) → indikator langsung menyesuaikan.
- [ ] Di runner: klik sidebar dengan jawaban → dialog; pilih `Akhiri` → tidak ada submit, kembali
      ke `/practice` dan tidak ada entri baru di riwayat.
- [ ] Klik `SELESAI UJIAN` → konfirmasi → hasil tampil; klik `Lihat Pembahasan` → semua soal
      vertikal dengan opsi benar ter-highlight.
- [ ] Dari `/practice` Riwayat, klik entri → langsung `/practice/:sessionId/review`.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Latihan v1: daftar hierarki Mapel→Bab→Topik; penguasaan skor ≥85% (custom admin, recursive ke child); runner full-main tanpa timer + navigasi soal + flag ragu-ragu; data hanya terekam saat Selesai; hasil + pembahasan vertikal; riwayat → review. |
