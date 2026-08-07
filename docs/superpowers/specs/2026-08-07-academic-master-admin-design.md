# Technical Design Spec: Academic Master Admin Enhancement (`/admin/academic`)

## 1. Context & Objectives
Halaman Admin Master Akademik (`/admin/academic`) merupakan pusat pengelolaan seluruh hirarki dan struktur kurikulum pada platform **YakinLulus.id**. Sesuai skema database domain (`struktur database/Master Akademik.md`) dan daftar kontrak API (`backend/api_list.md`), domain ini mencakup:
1. **Jenjang Pendidikan** (`education_level`): SD, SMP, SMA, SMK, Gap Year.
2. **Kelas** (`grade`): 4–6 (SD), 7–9 (SMP), 10–12 (SMA/SMK), GY (Gap Year).
3. **Mata Pelajaran** (`subject`): Matematika, Fisika, Kimia, Biologi, Bahasa Indonesia, Bahasa Inggris, IPAS, dll.
4. **Bab & Sub-Bab** (`chapter` & `subchapter`): Struktur materi beserta estimasi durasi dan order number.
5. **Topik & Capaian Pembelajaran** (`topic` & `learning_outcome` / CP / KD): Pemetaan materi detail beserta tingkat kesulitan (Easy, Medium, Hard) dan Bloom's Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create).
6. **Kurikulum & Tahun Ajaran** (`curriculum` & `academic_year`): Kurikulum Merdeka, K13, UTBK, AKM, TKA.
7. **Program Belajar** (`program`): Reguler, Intensif UTBK, Kedokteran, CPNS.

Tujuan utama dari enhancement ini adalah menghadirkan antarmuka admin yang **lengkap, kaya visual (Skills Taste), responsif, dan terintegrasi 100% dengan API backend** tanpa mengubah/menghapus backend, API kontrak, maupun skema database.

---

## 2. Architecture & Design Options

### Option 1: Unified Interactive Academic Hub (RECOMMENDED)
- **Visual Overview Cards**: Kartu metrik realtime di bagian atas yang menampilkan total statistik (Total Jenjang, Total Kelas, Total Mata Pelajaran, Total Bab & Kurikulum).
- **Hirarki Drilldown Intuitive**:
  - **Level View**: Kartu/Tabel Jenjang dengan indikator warna khas (SD = Merah/Pink, SMP = Biru/Cyan, SMA = Hijau/Emerald, SMK = Ungu/Violet, Gap Year = Amber/Orange).
  - **Grade View**: Kelas terkait jenjang yang dipilih.
  - **Subject View**: Mapel terkait kelas & jenjang yang dipilih.
  - **Bab & Topik View**: Accordion interaktif untuk Bab → Sub-Bab → Topik → Capaian Pembelajaran (CP/KD) dengan badge Bloom's Taxonomy dan tingkat kesulitan.
- **Tab Kurikulum & Program**: Tabel manajemen Kurikulum & Program yang dilengkapi modal form modern.
- **Sistem UI & State Handling**:
  - Loading skeleton pada setiap pergantian level/tab.
  - Clean empty state saat belum ada data di database.
  - Error alert banner dengan tombol refetch.

---

## 3. UI/UX Polish & Design Tokens (Skills Taste)
- **Typography & Layout**: Font heading modern, rounded-2xl cards, border-border/60.
- **Color Coding Per Jenjang**:
  - SD: `bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200`
  - SMP: `bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200`
  - SMA: `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200`
  - SMK: `bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200`
  - Gap Year: `bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200`
- **Badges**:
  - Difficulty: Easy (Green), Medium (Yellow), Hard (Red).
  - Bloom's Taxonomy: Subtle indigo/violet pill badges.

---

## 4. Verification & Testing Plan
- **Type Safety**: Menjalankan `npm run build` untuk memastikan tidak ada kesalahan TypeScript pada komponen dan service akademik.
- **Data Flow Verification**: Memastikan interaksi dari Level → Grade → Subject → Bab → Topic → Learning Outcome dapat dinavigasikan dengan lancar dan form dialog berfungsi sesuai harapan.
