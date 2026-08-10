# Wireframe — Halaman Siswa Dashboard

> **File:** `docs/frontend/wireframes/01-siswa-dashboard.md`
> **Route:** `/siswa` (AppShell, role `SISWA` / `SUPER_SISWA`)
> **Status:** Dokumen acuan pembuatan mockup & implementasi. Belum ada kode diubah.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **Dashboard Siswa** (`GET /dashboard/student`).
Setiap bagian dicocokkan dengan skema database, backend (Go/Fiber), dan API kontrak
(`docs/frontend/API-contract.md`). Bagian apa pun yang datanya **belum tersedia** di
API diberi penanda `[KONTRAK BARU]` dan dikumpulkan pada bagian akhir untuk dibuat
menyusul (sesuai kebutuhan user, input oleh admin/staff).

---

## 1. Konteks & Tujuan

Dashboard adalah landing page siswa setelah login. Satu halaman berisi ringkasan:
- pencapaian ujian & ranking,
- progres belajar (materi + soal),
- target sekolah/universitas impian sebagai **pemicu motivasi**,
- jadwal try out khusus mingguan sebagai **acuan ranking dan target**.

Target primer UX: siswa melihat **jarak nilainya ke target** dan **persentase kemungkinan diterima**
secara jelas, besar, dan berwarna, agar terdorong terus berlatih. (Design system: `design.md`.)

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell (frontend/src/components/layout/app-shell.tsx)
│
├── Sidebar (280px; collapsed 72px) — SISWA_NAV
│      Beranda ●   → /siswa            (active)
│      Belajar     → /materials
│      Latihan     → /practice
│      Try Out     → /exams
│      Hasil       → /results
│      Peringkat   → /ranking
│      Target Saya → /targets
│      Sertifikat  → /certificates
│      AI Tutor    → /ai
│
├── Topbar (72px) — search global "Ctrl+K", dark mode, lonceng notifikasi, avatar dropdown (/profile, /settings, Keluar)
│
└── Main (max-w 1440px, container max-w-1600px)
       └── ✦ Halaman ini: /siswa  (∅ = komponen dashboard)
       └── Referensi PAGE-WIRING: Home student = `GET /dashboard/student` + `GET /notifications`
```

**Auth:** Bearer JWT via `src/lib/api.ts` (`yl_token`), refresh `/auth/refresh`.

---

## 3. Wireframe ASCII — Layout Utuh

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440px · padding p-4/6/8                                     │
│                                                                            │
│ ┌ HEADER ────────────────────────────────────────────────────────────────┐ │
│ │  [◆ TRYOUT KHUSUS MINGGUAN — kartu mencolok, span-2]                  │ │
│ │   "HASILMU MINGGU INI"                [TRY OUT KHUSUS #7]              │ │
│ │   Jadwal: Kamis, 14.00 – 16.00 · 120 soal · 150 menit                 │ │
│ │   🏆 Nilai dari tryout ini = ACUAN ranking & target kamu              │ │
│ │   [btn: MULAI TRYOUT → /exams/:id]             [btn: Jadwal/umum → /exams]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│  Greeting card: "Selamat {pagi}, {nama}! 👋" · GradeBadge (SMA · Kelas 12)│
│                  · streak pill 🔥 {n} Hari × tanggal · motivasi           │
│                                                                            │
│ ┌──────────────────┬────────────────────────────────────────────────────┐ │
│ │ GOAL HARI INI    │ LANJUTKAN BELAJAR                                    │ │
│ │  (ProgressRing)  │  [materi terakhir]  ▓▓▓▓▒▒ 62% · sisa ±15 mnt      │ │
│ │   3 Materi / 10  │  [btn: Lanjut → /materials/:material_id]            │ │
│ └──────────────────┴────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌ STATS (4× StatsCard) ─────────────────────────────────────────────────┐ │
│ │  Try Out Selesai     Rata2 Skor     Skor Tertinggi     Peringkat #N    │ │
│ │  (FileCheck)         (Trophy)       (Award)            (Medal)         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌──── ★★ TARGET SEKOLAH — kartu BESAR & MENCOLOK ★★ ───────────────────┐ │
│ │  UNIVERSITAS MELATI · Teknik Informatika                              │ │
│ │   Jarak Nilai:  −25 poin  (kurang dari nilai terendah seleksi)        │ │
│ │   [ % Diterima: 78% ]  ← Badge raksasa · warna = band (%)             │ │
│ │   Kuota 2026: 120 mahasiswa · Nilai terendah: 721 · Skor Anda: 696    │ │
│ │   [btn: Kelola Target → /targets]  [jika tanpa skor: btn: Kerjakan Tryout Khusus] │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌── STATISTIK MAPEL (BarChart) ──┐   ┌── MAPEL KUAT vs LEMAH ───────────┐ │
│ │  % benar per mapel (semua      │   │ ✅ Kuat: Matematika (78%)         │ │
│ │  soal semua ujian/latihan)     │   │ ❌ Lemah: Fisika (38%)            │ │
│ │  (chart-1..chart-5)            │   │  …                                  │ │
│ └─────────────────────────────────┘   └──────────────────────────────────┘ │
│                                                                            │
│ ┌ PROGRESS MAPEL — berbasis SOAL (target 50 jawaban BENAR) ──────────────┐ │
│ │  Matematika      ▓▓▓▓▓▓▓░ 32/50 · 64%                                  │ │
│ │  Bahasa Indonesia ▓▓▓▓▓▓▓▓▓ 41/50 · 82%                                │ │
│ │  Fisika          ▓░░░░░░░ 19/50 · 38%  (⟷ "X benar dari target 50")   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌ Ujian Mendatang (tabel) ───-┐   ┌ Aktivitas Terakhir (timeline) ─────────┐│
│ │ # Ujian │ Mapel │ Tanggal │ ⟶ │ ◈ Menyelesaikan ujian: …                 │
│ │ Durasi │ Status │ [Mulai]  │   │ ◈ Menyelesaikan materi: …               │
│ └──────────────────────────────┘   └────────────────────────────────────────┘│
│                                                                            │
│ ┌ Weekly Activity (Bar chart 7 hari) ────────────────────────────────────┐ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Responsive:** kolom 2→1 (mobile); tabel jadi kartu/list; chart full-width.

---

## 4. Spesifikasi per-seksi

Semua wrapper `{ success, message, data }` sudah di-`unwrap` oleh `src/lib/api.ts`.
Notasi field: `data.<path>`.

### 4.1 Header — Try Out Khusus Mingguan `[KONTRAK BARU]`

| Aspek | Detail |
|---|---|
| Data | `GET /dashboard/student/weekly-exam` → `{ exam_id, title, exam_code, subject_name, scheduled_start, scheduled_end, duration_minutes, status, round_no }` |
| Komponen | `Card` besar, border accent, `Badge` "HASILMU MINGGU INI" |
| CTA | `[Mulai / Lanjutkan]` → `/exams/{exam_id}`; `[Kelola Jadwal]` → `/exams` |
| Keunikan | Kartu teratas halaman, berbanding tinggi; ikon Trophy; label pengantar acuan ranking |
| Sumber DB | `cbt.exam` (+flag khusus tryout mingguan — lihat Kontrak Baru #4) + `cbt.exam_schedule`, `cbt.exam_metadata` |
| Empty | Jika belum ada → kartu promosi: "Tryout khusus pekan ini belum dijadwalkan" + CTA `/exams` |

### 4.2 Header — Greeting + Grade + Streak

| Aspek | Detail |
|---|---|
| Data | `greeting.{full_name, greeting, date, motivation}` (dari `/dashboard/student`); `user.{education_level, grade}` (auth store) |
| Streak | `[KONTRAK BARU]` `GET /dashboard/student/streak` → `{ current_streak, longest_streak }`. Saat ini `StreakBanner` default `5` hardcoded — ganti ke API. |
| Komponen | `StreakBanner` + `GradeBadge` |
| CTA | `[Mulai Try Out] → /exams`, `[Pelajari Materi] → /materials`, `[Tanya AI Tutor] → /ai` |

### 4.3 | Goal Hari Ini (`today_goal`)

| Aspek | Detail |
|---|---|
| Data | `today_goal.{target_materials, completed_materials, target_questions, answered_questions, progress_pct}` |
| Komponen | `Card` kecil + `ProgressRing` (Recharts) besar 88–120px, keterangan 3 materi / 10 soal |
| CTA | `[Lanjutkan Belajar] → /materials` |
| Empty | `progress_pct=0` → "Belum ada aktivitas hari ini", CTA `/materials` |

### 4.4 | Statistik Try Out (`exam_stats`) — 4× `StatsCard`

| Stat | Field | Ikon |
|---|---|---|
| Try Out Selesai | `exam_stats.total_completed` | FileCheck |
| Rata-rata Skor | `exam_stats.average_score` | Trophy |
| Skor Tertinggi | `exam_stats.highest_score` | Award |
| Peringkat Nasional | `exam_stats.national_rank` (#N) | Crown/Medal |

- CTA card kanan: `[Lihat Semua Hasil] → /results`.
- `national_rank` dari `ranking.user_rank_summary.global_rank` (0 → "—", description "dari 15.420 siswa aktif" placeholder → `total_leaderboard` kalau mau dikirim).

### 4.5 | ★ TARGET SEKOLAH / UNIVERSITAS — **fokus motivasi** `[KONTRAK BARU]`

Kartu terbesar kedua di halaman (span 2 kolom), menonjol jika data tersedia.

**Sumber data (admin/staff input):**
- `academic.target_school` → kolom baru (lihat Kontrak Baru #1):
  - `seat_quota` (jumlah murid/mahasiswa yang diterima) — input admin/staff
  - `passing_score_lowest` — **nilai terendah hasil seleksi** penerimaan
- `identity.student_target` (`school_name`, `major`, `passing_score_irt`) milik siswa.
- Skor banding: **skor try out KHUSUS siswa** (dari `weekly-exam`/`TRYOUT` terbaik) — mengikuti basis ranking yang sama.

**Rumus presentasi:**
- `jarak = skor_tryout_khusus − passing_score_lowest` (angka +/−)
- `pct = min(100, skor_tryout_khusus / passing_score_lowest × 100)` (pembatas atas 100)

**Skema warna (% band) — token CSS:**

| Jika | Warna | Token |
|---|---|---|
| `pct ≤ 70` | **MERAH** | `bg-red-500/10 text-red-600 border-red-500/30` |
| `70.1 ≤ pct ≤ 95` | **KUNING/AMBER** | `bg-amber-500/10 text-amber-600 border-amber-500/30` |
| `95.1 ≤ pct ≤ 100` | **HIJAU** | `bg-emerald-500/10 text-emerald-600 border-emerald-500/30` |

- Badge `% Diterima` diperbesar (font-h2), elemen utama: tombol `[Kelola Target → /targets]`,
label kolom "Kuota · Nilai Terendah · Skor Anda".
- Jika `pct ≥ 95` → sentuhan kecil animasi ring (150ms pulse sekali) — bukan popup/animasi besar; konsisten motion 150/200/250ms (design.md).
- Jika siswa belum punya skor tryout khusus → CTA utama: `[Kerjakan Tryout Khusus → /exams]`.

### 4.6 | Statistik Analisis Mapel (Kuat / Lemah) `[KONTRAK BARU]`

**Sumber:** seluruh `cbt.grading_detail` (semua attempt ujian + sesi latihan) →
`question.question` → `question_subject` / `academic.subject`.

- Endpoint: `GET /dashboard/student/subject-mastery` →
  `[{ subject_id, subject_name, total_questions, correct_count, accuracy_pct }]`
- **Threshold kuat/lemah = configurable** `[KONTRAK BARU]` via `GET /config/student-dashboard` (default `70%`).
- Komponen:
  - Kiri: `BarChart` (Recharts) `accuracy_pct` per mapel; hijau bila ≥ threshold, merah bila < threshold.
  - Kanan: dua daftar `Mapel Kuat` / `Mapel Lemah` dengan `Badge` ✅ / ❌ + jumlah soal.
- CTA per mapel → `/practice?subject={subject_id}`.

### 4.7 | Progress Mapel — **berbasis SOAL** `[KONTRAK BARU]`

> Parameter perubahan dari design 2026-08-07: kemajuan mapel **bukan** dihitung dari materi
> dibaca selesai, melainkan dari **≥50 soal dengan jawaban benar** per mapel.

- Label: `GET /dashboard/student/subject-progress` →
  `[{ subject_id, subject_name, target_correct=50, correct_count, progress_pct }]`
- `progress_pct = min(100, correct_count / 50 × 100)`.
- Komponen: per-mapel `Progress` bar (tema), label `{correct}/50 · {pct}%`, pesan "2 lagi benar sampai naik level".
- Threshold `50` bisa deprecated ke config yang sama.
- CTA `[Latih Mapel] → /practice`.

### 4.8 | Ujian Mendatang | `upcoming_exams` (existing)

Tabel kecil (maks 5 baris):
| Kolom | Field |
|---|---|
| Nama Ujian | `title` |
| Mapel | `subject_name` |
| Jadwal | `scheduled_date` |
| Durasi | `duration_minutes` menit |
| Status | `status` → Badge |
| Aksi | `[Mulai]` → `/exams/{exam_id}` |

Empty state: "Belum ada ujian mendatang" + CTA `/exams`.

### 4.9 | Aktivitas Terakhir — `recent_activity` (existing)

Timeline max 6: icon per `type` (`exam`→FileCheck, `material`→BookOpen), `message`,
`created_at` (relative time). Empty: "Belum ada aktivitas".

### 4.10 | Weekly Activity — `weekly_activity` (existing)

Recharts `BarChart` (7 hari): series `materials` & `questions` (chart-1 & chart-2).
Empty: chart dengan data 0.

---

## 5. Mapping Data → API → DB (ringkasan)

| Field API | Endpoint | Tabel sumber (migrasi) |
|---|---|---|
| `greeting` | `/dashboard/student` | `identity.user`, `identity.user_profile` |
| `today_goal` | `/dashboard/student` | `content.learning_progress`, `cbt.exam_attempt` |
| `exam_stats` | `/dashboard/student` | `cbt.grading_result`, `cbt.exam_attempt`, `ranking.user_rank_summary` |
| `upcoming_exams` | `/dashboard/student` | `cbt.exam`, `cbt.exam_metadata`, `cbt.exam_schedule`, `cbt.exam_status` |
| `recent_activity` | `/dashboard/student` | `cbt.exam_attempt`, `content.learning_progress` |
| `weekly_activity` | `/dashboard/student` | `content.learning_progress`, `cbt.exam_attempt` |
| `learning_progress` (mapel read) | `/dashboard/student` | `academic.subject`, `content.material`, `content.material_subject`, `content.learning_progress` |
| `weekly-exam` [KONTRAK BARU] | TBD | `cbt.exam` + flag |
| `target_comparison` [K] | TBD | `academic.target_school`(+kolom baru), `identity.student_target` |
| `subject_mastery` [K] | TBD | `cbt.grading_detail`, `question.question`, `academic.subject` |
| `subject_progress` [K] | TBD | `cbt.grading_detail`, `question.question`, `academic.subject` |
| `streak` [K] | TBD | `analytics.analytics_events` (login/activity) |
| `config-strongweak` [K] | TBD | `cms.setting` / `system_configuration` |

> `GET /notifications` — badge topbar (unread count); saat ini masih nilai mock (3).

---

## 6. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

> Semua kontrak ini **belum ada** (belum dibuat). Frontend menulis halaman terhadap
> skema di bawah; kontrak dibuat & disetujui user terlebih dulu (sesuai AGENTS rule #4), lalu diekspose
> hook data mock pada saat mockup presentasi.

| # | Endpoint | Role | Response (usulan) | Input admin/staff |
|---|---|---|---|---|
| 1 | `GET /dashboard/student/target` | SISWA | `{ has_target, school_name, major, passing_score_lowest, seat_quota, student_score, score_gap, chance_pct, verdict }` | Form ← `/staff/target-schools` |
| 2 | `GET /dashboard/student/subject-mastery` | SISWA | `[{ subject_id, subject_name, total_questions, correct_count, accuracy_pct }]` | – |
| 3 | `GET /dashboard/student/subject-progress` | SISWA | `[{ subject_id, subject_name, target_correct, correct_count, progress_pct }]` | – |
| 4 | `GET /dashboard/student/weekly-exam` | SISWA | `{ exam_id, title, subject_name, scheduled_start, scheduled_end, duration_minutes, round }` | label round/flag |
| 5 | `GET /dashboard/student/streak` | SISWA | `{ current_streak, last_streak }` | – |
| 6 | `GET /config/student-dashboard` | SISWA (+ `PUT` admin) | `{ strong_subject_threshold=70, progress_correct_target=50, color_bands:[…] }` | FORM: config |
| 7 | (flag) `/admin/exams` (label tryout mingguan) | SUPER_ADMIN/STAFF | extended `cbt.exam` metadata | checkbox "Jadikan Acuan Ranking" |

**Kolom DB baru (migrasi):**

```sql
-- academic.target_school (extend)
ALTER TABLE academic.target_school
    ADD COLUMN seat_quota int,
    ADD COLUMN passing_score_lowest int;

-- cbt.exam (extend) — penanda tryout khusus mingguan
ALTER TABLE cbt.exam ADD COLUMN is_weekly_rank_basis boolean DEFAULT false;
```

---

## 7. Catatan Implementasi (saat implementasi kode)

- **Service:** perluas `frontend/src/services/dashboard.service.ts` + hook baru
  `frontend/src/hooks/use-dashboard.ts` (TanStack Query):
  - `useQuery(["siswa-dashboard"], () => dashboardService.getStudentDashboard())`
  - fetch paralel `target-comparison`, `subject-mastery`, `subject-progress`, `weekly-exam`, `streak`, `config` dengan `Promise.all` & skeleton.
- **Type:** perluas `SiswaDashboard` di `src/types/admin.ts` (field mock lama `total_exam_taken`, `average_score`, `global_rank`, `target_school`, `recent_exams` → skema baru sesuai kontrak).
- **Kartu target:** komponen baru `TargetChanceCard.tsx` di `src/components/siswa/`.
- **Config:** threshold & target-progress dibaca dari endpoint config (default 70 / 50).
- **Empty & loading:** skeleton (bukan spinner); empty = "ilustrasi sederhana + CTA".
- **Mockup presentasi:** data belum ada disimulasikan sebagai placeholder `[KONTRAK BARU]`.

### Checklist Verifikasi
- [ ] Konfirmasi kontrak API baru dengan user & review DB (kembali cek rule #1/#4 AGENTS).
- [ ] Setelah kontrak tersedia → buat types/services, mock dengan endpoint asli.
- [ ] `npx tsc --noEmit` clean, lint clean.
- [ ] Verifikasi: login siswa (SMA-12) → kartu target menampilkan jarak & % berwarna benar;
      ubah band → warna berubah (0-70 merah / 70.1-95 amber / 95.1-100 hijau).