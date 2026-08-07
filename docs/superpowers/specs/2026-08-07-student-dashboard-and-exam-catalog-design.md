# Student Dashboard & Exam Catalog Enhancement Design Specification

## Overview
Enhancing the Student Experience (`/siswa`) on the YakinLulus.id platform, starting with **Phase 1: Siswa Dashboard & Exam Catalog**. A key requirement is **education level and grade personalization** (`education_level` and `grade`), ensuring students only see exams, materials, targets, and statistics relevant to their grade level (e.g., SD 1-6, SMP 7-9, SMA 10-12, UTBK/SNBT, Gap Year).

---

## Key Features & Requirements

### 1. Education Level & Grade Personalization (`education_level` & `grade`)
- **Context Filtering**: All queries for Exams (`/siswa/exams`), Materials (`/siswa/materials`), and Targets (`/siswa/targets`) automatically filter according to the logged-in student's `education_level` (SD/SMP/SMA/GapYear) and `grade` (e.g., 10, 11, 12).
- **Grade Badge**: Top bar or dashboard header displays a prominent badge (e.g., `SMA - Kelas 12 (UTBK/SNBT 2026)`), with a quick button to adjust or edit profile grade if needed.

### 2. Enhanced Siswa Dashboard (`/siswa/page.tsx`)
- **Header & Streak Banner**:
  - Personal greeting with student name.
  - Grade indicator & Learning Streak count (e.g., 🔥 5 Hari Berturut-turut).
  - Quick action buttons: *Mulai Try Out Baru*, *Latihan Soal per Bab*, *Tanya AI Tutor*.
- **Grade-Tailored Overview Stats**:
  - *Try Out Selesai* (Total exams completed in current grade level)
  - *Rata-rata Skor UTBK/Ujian (IRT)*
  - *Peringkat Nasional* (Filtered by grade/level)
  - *Total Jam Belajar & Daily Streak*
- **Target PTN & Program Studi Impian / Target Sekolah**:
  - Displays target university & major (for SMA/GapYear) or Target School (for SD/SMP).
  - Visual Progress Bar: Current Score vs Target Minimum Score.
  - Estimated Passing Chance (%) based on IRT / grading algorithm.
- **Grade-Filtered Active & Recent Tryouts**:
  - List of recent completed try outs with score breakdown and direct link to step-by-step discussion (`/siswa/results/[id]`).

### 3. Enhanced Exam & Practice Catalog (`/siswa/exams/page.tsx`)
- **Category Tabs**:
  - *Semua Ujian*
  - *Try Out UTBK/SNBT* (SMA 12 / GapYear)
  - *Ujian Sekolah (PTS/PAS/TKA)* (SD/SMP/SMA)
  - *Latihan Soal per Bab/Mapel*
- **Grade & Subject Search & Filter**:
  - Instant search input.
  - Subject dropdown filtered dynamically according to the student's active `education_level`.
- **Rich Exam Cards**:
  - Grade/Subtest indicators.
  - Duration, total questions, IRT scoring standard badge.
  - Action buttons: `Mulai Ujian` (New), `Lanjutkan` (In progress), or `Lihat Hasil` (Completed).

---

## Technical & Component Architecture

### Components
1. `src/app/(siswa)/page.tsx`: Siswa Dashboard Page.
2. `src/app/(siswa)/exams/page.tsx`: Grade-filtered Exam Catalog.
3. `src/components/siswa/GradeBadge.tsx`: Visual grade indicator badge component.
4. `src/components/siswa/StreakBanner.tsx`: Daily learning streak and quick actions banner.
5. `src/components/siswa/TargetProgressCard.tsx`: Dedicated target score & PTN progress component.
6. `src/services/dashboard.service.ts` & `src/services/academic.service.ts`: Updated service queries with `education_level` and `grade` parameters.

---

## Verification Plan

### Automated Checks
- `npx tsc --noEmit` to verify type safety across all student components.

### Manual Verification
- Log in as a student with grade `SMA 12` -> Verify dashboard & catalog show UTBK/SNBT exams & targets.
- Change grade or test with `SMP 9` -> Verify dashboard & catalog filter content appropriately for SMP.
