# Admin Exam Management Studio & Visual Question Pool Picker - Design Specification

## 1. Overview
Halaman Admin Ujian (`/admin/exams`) dan Studio Pembuatan Ujian (`/admin/exams/create`) ditingkatkan secara menyeluruh (UI/UX) untuk mendukung seluruh jenis, tipe, dan bentuk konfigurasi ujian di platform YakinLulus.id:
1. **Ujian Per Mapel Per Jenjang/Kelas**: Latihan & Ujian spesifik 1 mata pelajaran.
2. **Ujian Kombinasi Semua Mapel**: Soal dari beberapa mapel digabung menjadi 1 ujian tunggal.
3. **Ujian Paket Mapel (PTS, UAS, UN/TKA)**: Terdiri dari beberapa subtes/mapel berurutan.
4. **Ujian Khusus IRT (UTBK, SNMPTN, UM)**: Sistem penilaian statistik berbasis tingkat kesulitan item (Item Response Theory).
5. **Dynamic Question Pool Sampling**: Pengumpulan naskah soal dalam jumlah besar (misal 100 soal ke pool) dan penentuan sampling acak yang dikerjakan siswa (misal 30 soal) sehingga setiap siswa menerima kombinasi soal yang berbeda.
6. **Custom Scoring Rules Engine**: Pengaturan skema penilaian yang dapat disesuaikan (IRT, Poin Standar 0-100, Sistem Minus +4/-1/0, dan Bobot Khusus).

---

## 2. Architecture & Components

### 2.1. Template-Based Exam Wizard (Presets First)
Saat pengguna membuka pembuatan ujian baru, ditampilkan Dialog Modal atau Grid Pilihan Preset Ujian:
- **UTBK SNBT 2026 Akbar (IRT)**: Preset 7 Subtes UTBK (TPS, Literasi Ind/Ing, PM) dengan scoring IRT, sampling 20-30 soal per subtes dari pool 100+ soal.
- **PTS / UAS Paket Multi-Mapel**: Gabungan beberapa mata pelajaran dalam 1 paket ujian dengan skor poin standar 0-100.
- **Ujian Per-Mapel / Ujian Harian**: 1 Mapel spesifik untuk jenjang/kelas tertentu.
- **Ujian Per-Bab Materi / Drill**: Ujian latihan berfokus pada 1 bab spesifik.
- **Ujian Mandiri PTN (Sistem Minus)**: SIMAK UI / UM UGM dengan scoring sistem minus (+4 / -1 / 0).
- **Kosong / Custom Exam**: Konfigurasi mandiri tanpa preset.

---

### 2.2. Studio Wizard 4-Langkah (`CreateExamPage`)

#### Langkah 1: Identitas & Klasifikasi Ujian
- Judul Ujian, Deskripsi / Petunjuk Pengerjaan.
- Kategori Ujian (`UTBK_SNBT`, `UM_PTN`, `TRYOUT_NASIONAL`, `PTS_UAS`, `UJIAN_HARIAN`, `UJIAN_BAB`).
- Mata Pelajaran (Opsional / Multi-Mapel), Bab/Topik Spesifik, Target Jenjang/Kelas.
- Target Passing Score, Durasi Total (menit), dan Default Mode (`SANTAI` vs `SIMULASI`).

#### Langkah 2: Arsitektur Subtes & Visual Question Pool Picker
- Manajemen Subtes (Tambah, Hapus, Edit Nama, Durasi Subtes, Jumlah Sampling Soal per Siswa).
- Checkbox acak soal & acak opsi jawaban.
- **Visual Question Pool Picker Modal (`QuestionPoolPickerModal.tsx`)**:
  - Modal pencari & pemilih butir soal dari database bank soal (`/api/v1/questions`).
  - Filter interaktif: *Mata Pelajaran*, *Bab/Topik*, *Tingkat Kesulitan (EASY, MEDIUM, HARD, HOTS)*, *Tipe Soal*, *Pencarian Teks/Kode*.
  - Pemilihan baris soal via Checkbox & Tombol "Pilih Semua Hasil Filter".
  - Indikator Visual Real-time: `Total Pool: 100 Soal` → `Sampling Dikerjakan Siswa: 30 Soal Acak`.

#### Langkah 3: Advanced Custom Scoring Rules Engine
- Opsi Sistem Penilaian:
  1. **IRT (Item Response Theory)**: Bobot dinamis berbasis statistik tingkat kesulitan jawaban benar seluruh peserta.
  2. **Poin Standar (0-100)**: Poin seragam proporsional dari jawaban benar.
  3. **Sistem Minus (+4 / -1 / 0)**: Benar +4, Salah -1, Kosong 0.
  4. **Custom Weighting per Subtes**: Bobot khusus per subtes atau jenis soal.

#### Langkah 4: Pratinjau Simulator Pengerjaan Siswa
- Simulasi visual variasi soal acak yang akan diterima Siswa A vs Siswa B secara *live*.
- Ringkasan total durasi, jumlah subtes, total pool, dan total soal yang diikutsertakan.

---

### 2.3. Halaman Katalog Ujian (`/admin/exams/page.tsx`)
- **Stats Bar**: Total Ujian, Ujian Aktif/Publik, UTBK IRT, Ujian Sekolah/Paket Mapel.
- **Filter & Search Bar**: Filter Kategori, Status (Published/Draft), dan pencarian cepat.
- **Grid Card Ujian**: Card modern dengan Badge Kategori, Badge Mapel, Jumlah Subtes, Status Pool, Durasi, Sistem Penilaian, serta Tombol Aksi (Edit, Detail, Duplikasi, Hapus, Preview POV).

---

## 3. Data Models & API Integration

```typescript
export interface ExamSubtestRule {
    id: string;
    subtest_name: string;
    subject_id?: string;
    subject_name?: string;
    duration_minutes: number;
    pool_question_ids: string[];
    sample_question_count: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    custom_weight?: number;
}

export type ScoringSystem = "IRT" | "STANDARD_POINTS" | "NEGATIVE_MARKING" | "CUSTOM_WEIGHT";

export interface ExamPreset {
    id: string;
    title: string;
    description: string;
    category: ExamCategory;
    scoring_system: ScoringSystem;
    duration_minutes: number;
    passing_score: number;
    subtests: ExamSubtestRule[];
}
```

---

## 4. Verification Plan

### Automated Build Verification
- `go build ./...` (Backend compilation check)
- `cmd /c "npx tsc --noEmit"` (Frontend TypeScript type-checking)

### Manual Functional Verification
1. Pemilihan Preset Ujian (UTBK, PTS/UAS, Per-Mapel, System Minus) mengisi form otomatis.
2. Pemilihan Butir Soal via `QuestionPoolPickerModal` dengan filter Mapel, Bab, Kesulitan.
3. Konfigurasi Sampling Acak (Pool 100 -> Student 30).
4. Pengaturan Sistem Penilaian (IRT vs Standard vs Minus).
5. Simulasi variasi pengerjaan siswa pada Langkah 4.
