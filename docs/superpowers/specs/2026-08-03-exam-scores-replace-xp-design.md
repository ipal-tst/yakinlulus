# Design: Ganti Fitur XP dengan Nilai Ujian & Peringkat Berbasis Nilai

Tanggal: 2026-08-03

## Ringkasan

Hapus seluruh fitur gamification (XP, level, streak, badges, leaderboard XP) dan ganti
dengan nilai ujian yang telah dijalani siswa. Perkenalkan konsep **paket ujian** yang
berisi beberapa ujian mapel, dan **peringkat nilai per paket** yang di-reset bulanan.

## Latar Belakang

Fitur XP saat ini:
- Backend: `backend/internal/gamification/gamification.go` (750 baris) + migration 017.
- Frontend: `student/leaderboard/page.tsx`, `student/page.tsx` (dashboard), `student/profile/page.tsx`.
- Nilai ujian sebenarnya sudah tersimpan di `content_exam_attempts` (`total_score`, `max_score`,
  `status`, `submitted_at`) dan per-mapel di `content_exam_session_questions.subject_id`.

Temuan penting:
- XP tidak pernah otomatis diberikan saat ujian selesai — hanya lewat admin grant dan streak ping.
- Tidak ada entitas "paket ujian"; satu record `contents` (content_type EXAM) = satu ujian.
- Migration 022 sudah punya view `user_accessible_grades` untuk membatasi akses per grade.
- Modul `profile` sudah punya `target_schools`, `student_targets`, dan `SumBestPerSubject`.

## Keputusan Desain (dari brainstorming)

1. Hapus **semua** gamifikasi: level, XP, streak, badges, leaderboard XP.
2. Leaderboard diganti **peringkat nilai ujian** per paket, **reset bulanan total**, cakupan **nasional**.
3. Beranda siswa menampilkan **statistik + daftar nilai**.
4. Profil siswa menampilkan data siswa yang **dapat diedit** (nama, foto, sekolah opsional),
   Target Sekolah & Jurusan, status paket. Buang achievements XP.
5. Paket ujian = **tabel baru** `exam_packages` yang mengelompokkan beberapa record EXAM terpisah.
6. Tabel gamification (migration 017) **di-drop** via migration 041.

## Business Rules

- Siswa hanya dapat mengerjakan ujian, latihan, dan paket ujian sesuai gradenya
  (gunakan view `user_accessible_grades` yang sudah ada).
- Jenis konten:
  - Ujian mata pelajaran (single-subject EXAM).
  - Latihan soal per materi (practice).
  - Ujian dengan soal campuran beberapa mapel (EXAM dengan subject-blueprints).
  - Paket ujian berisi beberapa ujian mapel (entitas baru `exam_packages`).
- Sekolah pada profil siswa bersifat opsional. Jika kosong, kolom "Sekolah" di peringkat
  ditampilkan sebagai strip (-).

## Arsitektur

### Komponen Baru

1. `internal/exam_packages` — CRUD paket ujian + link ujian mapel ke paket (ADMIN/TEACHER).
2. `internal/ranking` — peringkat nilai per paket, reset bulanan, cakupan nasional.

### Komponen Dihapus / Diubah

- Hapus `internal/gamification` (kode + DI + route).
- Refactor `internal/dashboard`: buang `GetAchievement`/`GetLeaderboard` XP, ganti agregasi nilai.
- Frontend: hapus hook/tampilan XP; tambah paket & ranking.
- Update `openapi.yaml`, `api-list.md`, `README.md`, `summary.md`, `WIRING.md`.

## Database — Migration 040

```sql
-- Paket ujian (misal: "Tryout TKA SMP 2026", "Tryout TKS SD 2026")
CREATE TABLE exam_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    education_level VARCHAR(10) NOT NULL,   -- SD / SMP / SMA / UNIVERSITY
    grade_id UUID REFERENCES grades(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link paket -> beberapa record EXAM (satu per mapel)
CREATE TABLE exam_package_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    display_order INT NOT NULL DEFAULT 0,
    UNIQUE (package_id, exam_content_id)
);

CREATE INDEX idx_exam_package_exams_package ON exam_package_exams(package_id);

-- Sekolah opsional pada profil siswa
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
```

## Database — Migration 041 (drop gamification)

```sql
DROP TABLE IF EXISTS xp_transactions;
DROP TABLE IF EXISTS user_levels;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS user_streaks;
```

## API Backend

### `internal/exam_packages` (ADMIN/TEACHER)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/v1/exam-packages` | Daftar paket (filter `education_level`) |
| POST | `/api/v1/exam-packages` | Buat paket |
| PUT | `/api/v1/exam-packages/:id` | Ubah paket |
| DELETE | `/api/v1/exam-packages/:id` | Hapus paket |
| POST | `/api/v1/exam-packages/:id/exams` | Tambah ujian mapel `{exam_content_id, subject_id, display_order}` |
| DELETE | `/api/v1/exam-packages/:id/exams/:examContentId` | Hapus ujian dari paket |
| GET | `/api/v1/exam-packages/:id/exams` | Daftar ujian dalam paket (header tabel peringkat) |

### `internal/ranking` (siswa, auth)

`GET /api/v1/leaderboard?package_id=<uuid>&month=YYYY-MM` (default bulan berjalan)

Logika:
1. Ambil ujian mapel milik paket (`exam_package_exams` JOIN `contents`).
2. Untuk tiap siswa: nilai terbaik per mapel dari `content_exam_attempts`
   (status `SUBMITTED`/`GRADED`, `submitted_at` dalam bulan diminta, ujian accessible sesuai grade).
3. Baris: `rank | user_id | full_name | school_name | {subject}: best_score per mapel | total | average`.
4. Urutan: `total DESC, average DESC, full_name ASC`. Limit default 50, maks 100.
5. Reset bulanan: hanya attempt dengan `submitted_at` pada bulan yang diminta.

Keamanan:
- Parameterized query (`$1`, `$2`) — cegah SQL injection.
- Validasi `package_id` (UUID valid) dan `month` (format `YYYY-MM`); invalid -> 400.
- CRUD paket via `middleware.RequireRole("ADMIN", "TEACHER")` -> 403 jika bukan.
- Leaderboard: auth wajib; output hanya data publik (nama, sekolah, nilai).
- Cakupan grade via view `user_accessible_grades`.

## Frontend

### Beranda siswa (`student/page.tsx`)
- Hapus: kartu Level+XP, streak flame, statistik "Total XP" & "Nasional", preview leaderboard XP.
- Ganti: statistik nilai (Tryout Selesai, Rata-rata, Nilai Tertinggi, Peringkat Nasional bulan ini)
  + daftar Nilai Ujian Terbaru (nama, skor, tanggal) -> link ke `/student/exam/[id]/result`.

### Leaderboard (`student/leaderboard/page.tsx`)
- Hapus: XP/level hero, badges, tab mingguan/all-time.
- Ganti: selector Paket Ujian, label periode + "Reset bulanan",
  tabel `No | Nama Siswa | Mapel 1..N (dinamis) | Total | Rata-rata | Sekolah`,
  baris siswa aktif di-highlight.

### Profil siswa (`student/profile/page.tsx`)
- Hapus: statistik achievements (Peringkat Nasional XP, Skor IRT), kartu "Super App Ultra Pass" statis.
- Tambah: field Sekolah (opsional) di dialog Edit Profil.
- Pertahankan: Target Sekolah & Jurusan, sertifikat, ubah sandi, notifikasi.

### API client & hooks
- Hapus: `getMyXP`, `getStreak`, `pingStreak`, `addXP`, `useXP`, `useBadges`, `useUserBadges`,
  `useStreak`, `useAchievements`, leaderboard XP.
- Tambah: `listExamPackages`, `getPackageExams`, `getRanking(packageId, month)` +
  hooks `useExamPackages`, `usePackageExams`, `useRanking`.
- Update: `types/dashboard.ts` (hapus level/current_xp/streak), `types/exam.ts` (tambah tipe ranking).

## Error Handling

- Backend memakai pola `shared.Error(...)` yang ada (401/400/404/500/403).
- Invalid `package_id`/`month` -> 400. Paket tidak ditemukan -> 404. Role tidak berhak -> 403.
- Frontend: state error tiap hook; kosong -> "Belum ada nilai tryout pada bulan ini".

## Testing (TDD)

Backend Go:
- `internal/ranking/ranking_test.go`:
  - hitung best-per-mapel + total + rata-rata
  - filter bulan berjalan
  - tanpa data -> kosong
  - validasi input month/package_id (invalid -> error)
- `internal/exam_packages/exam_packages_test.go`:
  - create/link/delete paket
  - duplicate link -> error

Verifikasi akhir:
- `go build ./...` && `go test ./...` di `backend/`
- `npm run lint` && `npm run build` di `frontend/`
- Smoke test manual: buat paket -> isi attempt -> cek peringkat bulan ini.

## Catatan Implementasi

- Verifikasi endpoint update profil yang ada untuk menyimpan `school_name`.
- `internal/profile` sudah punya `SumBestPerSubject` — potensi reuse untuk ranking per-mapel.
- Dokumen `docs/`, `mockup siswa/` dapat diperbarui di tahap akhir bila diperlukan.
