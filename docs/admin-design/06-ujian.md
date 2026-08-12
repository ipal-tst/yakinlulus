# Halaman Admin — Ujian (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting hanya referensi)
> **Modul:** CRUD ujian & tryout (multimapel/TKA/UTBK-IRT), latihan per mapel/bab, jadwal,
> pool soal, cara penilaian, attempt policy, rank-basis, import/export, filter detil.
> **Tergantung pada:** Bank Soal (pool), Master Akademik (mapel/jenjang), siswa (participant).

---

## 1. Tujuan & Sifat Halaman

Halaman **Ujian** mengelola semua bentuk evaluasi terstruktur siswa. Sifat wajib:

1. **CRUD penuh & custom** — mulai dari identitas, **tanggal/jam mulai & berhenti**, **waktu
   pengerjaan**, **pool soal**, **cara penilaian**, hingga kebijakan attempt.
2. **Bentuk ujian yang bervariasi** (dari permintaan):
   - **Ujian multi-mapel** (event tryout bersama) — beberapa mapel dalam satu sesi.
   - **Ujian beberapa mapel** (TKA / UN / UM PTN) — subtes per mapel.
   - **Setara UTBK** — penilaian **IRT**.
   - **Sekali kesempatan** — nilainya dipakai sbg nilai ranking & pembanding target, disimpan
     sebagai bahan analisa.
   - **Bisa diulang-ulang** — latihan/quiz dengan `max_attempts > 1`.
3. **Import/Export + checkbox + tabel rapi + filter detil** — permintaan eksplisit.

---

## 2. Model Konseptual & Keputusan Data

### 2.1 Satu ujian = satu setting global + daftar subtes
```
cbt.exam (setting global)
├── status (DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED)
├── category (UTBK_SNBT, TRYOUT_NASIONAL, UM_PTN, PTS_UAS, UJIAN_HARIAN, UJIAN_BAB)
├── scoring_system (IRT / STANDARD_POINTS / NEGATIVE_MARKING)
├── exam_type → menentukan policy:
│     • TRYOUT/UTBK   → sekali-sesi utk nilai rank/target (default)
│     • QUIZ/LATIHAN  → dapat diulang (max_attempts > 1)
├── duration_minute  (total)
├── passing_score
├── schedule {start_time, end_time, timezone}
├── max_attempts (1 = sekali; N = berulang)
├── attempt_mode ("BEST" / "LAST" / "AVERAGE")  ← [BARU] utk berulang
├── is_rank_basis (bool)                        ← [BARU] nilai jadi bahan ranking
├── is_target_basis (bool)                      ← [BARU] nilai jadi pembanding target sekolah
├── round_no (int)                              ← [BARU] nomor ronde tryout pekanan
└── subtests[] → exam_subject + pool paket per subtes
```

### 2.2 Keputusan data `[BARU]` yang perlu dimigrate
| Kolom | Tabel | Alasan |
|---|---|---|
| `is_rank_basis boolean` | `cbt.exam_metadata` | flag "nilai jadi ranking" |
| `is_target_basis boolean` | `cbt.exam_metadata` | flag "nilai dibandingkan ke target sekolah" |
| `round_no int` | `cbt.exam_metadata` | nomor ronde tryout pekanan |
| `attempt_mode varchar` | `cbt.exam_metadata` | BEST/LAST/AVERAGE utk multi-attempt |
| endpoint `schedule` | baru | CRUD jadwal terdedikasi |
| endpoint `clone` | baru | duplikasi ujian |

> Catatan: `max_attempts` dan `is_rank_basis` tidak ada kolom eksplisit di schema saat ini
> (maks `exam_attempt.attempt_no` menangani logika berulang secara implisit).

---

## 3. Logic & Aturan Bisnis

1. **Subtes = unit soal** — ujian terdiri 1..N subtes; tiap subtes punya `nama, durasi, pool soal,
   sample_question_count, shuffle_questions, shuffle_options`. Multi-mapel = banyak subtes.
2. **Pool & sampling** — soal diambil dari pool (bank soal); saat siswa mulai, sistem mengambil
   `sample_question_count` soal secara acak per subtes (dengan `random_seed`+seed siswa → deterministik
   per POV).
3. **Scoring** —
   - `IRT`: skor relatif kesulitan (tempat utk UTBK & tryout nasional).
   - `STANDARD_POINTS`: jumlah skor per soal (0–100+), utk PTS/UAS/quiz.
   - `NEGATIVE_MARKING`: benar +, salah − (UM PTN).
   - passing = `passing_score` terhadap skor total.
4. **Attempt policy** —
   - `max_attempts = 1` → sekali sesi; skor disimpan utk ranking & perbandingan target.
   - `max_attempts > 1` → berulang; penentu nilai akhir = `attempt_mode` (BEST/LAST/AVERAGE).
5. **Jadwal** — `start_time ≤ end_time`, timezone default Asia/Jakarta; ujian hanya bisa dimulai
   dlm window tsb; `duration_minute` wajib > 0.
6. **Rank & target** —
   - `is_rank_basis=true` → skor attempt selesai masuk `ranking.*`/leaderboard.
   - `is_target_basis=true` → skor dibandingkan dengan `target_school_score` (grup Target Sekolah).
   - `round_no` utk grouping tryout pekanan.
7. **Status workflow** — `DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED`; hanya PUBLISHED
   yg bisa diikuti siswa; edit utk PUBLISHED → naik versi & status kembali DRAFT (opsi "re-publish").
8. **Jadwal yatim** — bila ujian tanpa schedule → tersedia tanpa batas waktu (mode "selalu terbuka");
   flag `scheduled = false`.
9. **Hapus** — soft delete; blok bila ada attempt/participant aktif.

---

## 4. API

Dari eksisting + `[BARU]`:

| Metode | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/exams` | any | list + filter §6 |
| POST | `/exams` | SA,ST,GU | create (global + subtests + blueprint) |
| GET | `/exams/:id` | any | detail lengkap |
| PUT | `/exams/:id` | SA,ST,GU | update |
| DELETE | `/exams/:id` | SA,ST,GU | soft delete |
| POST | `/exams/:id/questions` | SA,ST,GU | tambah soal |
| DELETE | `/exams/:id/questions/:questionId` | SA,ST,GU | hapus soal |
| PUT | `/exams/:id/questions/reorder` | SA,ST,GU | urutkan |
| GET/POST | `/exams/:id/blueprint` | any / SA,ST,GU | blueprint |
| GET/POST | `/exams/:id/subject-blueprints` | any / SA,ST,GU | per-mapel |
| GET/POST/DELETE | `/exams/:id/participants` | any / SA,ST,GU | kelola peserta |
| GET | `/exams/:id/analytics` | any | analitik ujian |
| POST | `/exams/:id/attempts/start` | SW | mulai |
| POST | `/exams/:id/attempts/:attemptId/submit` `/grade` | SW / SA,ST,GU | submit/grade |
| **POST** | **`/exams/:id/schedule`** | SA,ST,GU | **`[BARU]`** set jadwal |
| **POST** | **`/exams/:id/clone`** | SA,ST,GU | **`[BARU]`** duplikasi |
| **POST** | **`/exams/import/xlsx`** | SA,ST,GU | **`[BARU]`** import (general+jadwal+subtes) |
| **GET** | **`/exams/import/template`** | SA,ST,GU | **`[BARU]`** template |
| **POST** | **`/exams/export/xlsx`** | SA,ST,GU | **`[BARU]`** export |
| **POST** | **`/exams/bulk-delete`** | SA,ST,GU | **`[BARU]`** |
| **POST** | **`/exams/bulk-status`** | SA,ST,GU | **`[BARU]`** terbitkan/arsip massal |
| POST | `/exam-packages[...]` | SA,ST,GU | paket ujian (eksisting) |

> `POST /exams/import` (JSON) eksisting dipertahankan; `.xlsx` baru ditambahkan.

---

## 5. UI/UX — Wireframe

### 5.1 Halaman List (katalog)
```
┌─ Kelola Ujian & Tryout ─────────────────────────────────────────┐
│ [Total] [Terjadwal] [Aktif/Publik] [UTBK-IRT] [Tryout Ronde]     │
├──────────────────────────────────────────────────────────────────┤
│ Filter: [Cari judul ___] [Jenjang ▾][Mapel ▾][Kategori ▾]        │
│         [Status ▾][Penilaian ▾][Mode Ulang ▾][Tanggal ▾][Ron ▾] │
│         [Import ▾][Export ▾]                        [+ Ujian Baru]│
├──────────────────────────────────────────────────────────────────┤
│ ☐ │ Kode     │ Judul Ujian          │Kategori│ Mapel │ Jadwal │ Skor │ Status │ Aksi    │
│ ☐ │ EX-1001  │ Tryout Nasional #5   │TO      │ Multi │ 10-08  │ IRT  │ ✓ Pub  │ ▸✎🗑 ▾   │
│ ☐ │ EX-1002  │ TKA Saintek          │TKA     │ 3     │ 12-08  │ IRT  │ Draf   │ ...     │
│ ☐ │ EX-1003  │ Latihan Bab Trig     │Bab     │ 1     │ Bebas  │ Std  │ ✓ Pub  │ ...     │
├──────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih [Terbitkan][Arsipkan][Hapus]      Pagination [◀ ▶]   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Studio Create/Edit — wizard 5 step
```
┌─ Buat Ujian Baru ─────────────────────────────────────────────────┐
│ Stepper: [1 Info] [2 Subtes & Soal] [3 Penilaian] [4 Jadwal & Rule] [5 Pratinjau]│
├──────────────────────────────────────────────────────────────────┤
│ STEP 1 · Info Umum (identitas + klasifikasi + preset)             │
│ STEP 2 · Subtes (multimapel) — tiap subtes: nama, durasi, pool,   │
│          sampling, acak soal/opsi; [+ Subtes]                     │
│ STEP 3 · Penilaian — kartu IRT / Standar / Minus (+ passing)      │
│ STEP 4 · Jadwal & Aturan                                          │
│    Tanggal Mulai [📅 2026-08-10 08:00] Berhenti [📅 08-10 10:00]  │
│    TZ [Asia/Jakarta ▾] · Mode: ▸ Selalu terbuka                   │
│    Mode Ulang: [1× Sekali ▾]  → attempt_mode [BEST/LAST/AVG]      │
│    Gunakan utk Ranking [☐]  Utk Target Sekolah [☐]  Ronde [ _ ]   │
│ STEP 5 · Simulator POV siswa (3 varian acak)                      │
├──────────────────────────────────────────────────────────────────┤
│ [Simpan Draf] [Terbitkan]                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Detail Ujian — Tabs
`[Ringkasan] [Subtes & Soal] [Jadwal] [Peserta] [Analitik] [Riwayat]`
- Ringkasan: semua setting + badge status.
- Peserta: tabel tambah/hapus siswa (assign) **`[BARU]` UI**; progress attempt (belum/mulai/selesai/absent).
- Analitik: skor distribusi, durasi avg, pass rate, per-subtes (referensi `AdminReportDetail`).
- Riwayat: versi ujian + snapshot blueprint.

---

## 6. Filter (lengkap — server-side)

| Filter | Sumber | Param |
|---|---|---|
| Search | judul/deskripsi | `search` |
| Jenjang | akademik | `grade_id` |
| Mapel | akademik / multi-mapel flag | `subject_id` |
| Kategori | enum | `category` **`[BARU]` server-side** |
| Status | enum | `status` |
| Penilaian | enum | `scoring_system` **`[BARU]` server-side** |
| Mode Ulang | enum | `max_attempts`/`attempt_mode` **`[BARU]`** |
| Terjadwal | toggle | `scheduled` (bebas vs window) **`[BARU]`** |
| Ronde | int | `round_no` **`[BARU]`** |
| Tanggal | DatePicker range | `start_time`/`end_time` (eksisting) |
| Rank basis | toggle | `is_rank_basis` **`[BARU]`** |

Cascade Jenjang→Mapel; kombinasi disimpan di URL query.

---

## 7. Fitur Halaman

### 7.1 CRUD lengkap
- Create/Edit wizard 5 step (§5.2).
- Delete, Publish/Unpublish, Archive, **Clone (duplikat)** `[BARU]`.
- Status toggle instan di tabel.

### 7.2 Checkbox tiap row
- `Checkbox` + select-all (indeterminate).
- Bulk bar: Terbitkan, Arsip, Hapus massal.
- Kosong → bar hilang.

### 7.3 Import & Export
- Import xlsx (info+subtes+jadwal+penilaian) — wizard upload→preview→submit.
- Export xlsx sesuai filter / terpilih.
- Templat downloadable.

### 7.4 Kualitas Tabel
- `DataTable` TanStack: sticky, sortable, resize, pagination, tooltip utk judul panjang,
  badge kategori/penilaian/status, baris 44px, tidak terpotong/tumpang tindih.

---

## 8. Komponen yang Dipakai

- Primitives: `Button, Input, Textarea, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton,
  Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Breadcrumb, DatePicker, Calendar, Stepper`.
- Exam: `ExamStepper`, `SubtestEditor` (per subtes: pool+sampling+shuffle), `QuestionPoolPickerModal`,
  `ScheduleField` (baru — datetime range + TZ + mode bebas/window), `AttemptPolicyField` (baru),
  `ScoringPicker`, `ParticipantTable` (baru), `ExamAnalyticsTab` (baru), `StudentExamPovSimulator`.
- Shared: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`, `ImportResultCard`, `FilterBar`.

---

## 9. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows + skeleton studio |
| Error | banner merah + Coba Lagi |
| Empty list | EmptyState + "Buat Ujian" / "Import" |
| Jadwal invalid (start>end, durasi 0) | error inline form |
| Attempt policy konflik | warning bila is_rank_basis & max_attempts>1 (skor mana yg dipakai) |
| Bulk selesai | Toast "12 ujian diterbitkan" |
| Delet dgn attempt aktif | AlertDialog + backend blok |

---

## 10. Prioritas Pekerjaan (greenfield)

1. Migration `[BARU]`: `is_rank_basis, is_target_basis, round_no, attempt_mode` di exam_metadata.
2. Backend: endpoint schedule + clone + export + bulk-status + filter category/scoring server-side.
3. Frontend: `ScheduleField` + `AttemptPolicyField` di wizard Step 4.
4. Participant manager UI + ExamAnalyticsTab di detail.
5. Import/export xlsx ujian + template.
6. DataTable + checkbox + bulk bar standardisasi.

---

## 11. Keselarasan Design System

Radius 12/16/20; primary Blue; accent Orange badges HOTS/warning; hijau sukses; skeleton;
empty state; Bahasa Indonesia; wizard dengan stepper minimal (no bounce); pratinjau CBT-friendly
(fokus, tanpa popup/iklan) — ikuti kaidah desain modul lain.