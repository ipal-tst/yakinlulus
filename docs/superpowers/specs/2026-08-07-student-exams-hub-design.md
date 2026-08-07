# Design Specification: Student Exam Catalog & Goal Progress Hub

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target File:** `frontend/src/app/(siswa)/exams/page.tsx`

---

## 1. Objective

Enhance the Student Exam Catalog page (`/exams`) to transform it into a goal-driven **Try Out & Exam Hub**. The page will connect student exam scores directly to their **Target University & Major Progress**, national percentile ranking, and real-time exam attempt status without altering backend endpoints or database structures.

---

## 2. Component Design & Features

### 2.1 Target PTN & National Rank Banner (Header)
- **Target University Card**:
  - Displays student's target university and major (e.g. *Universitas Indonesia - Teknik Informatika*).
  - Target IRT Score vs Highest Student Score bar (e.g., *Current IRT: 685 / Target: 720*).
  - Passing Probability Prediction Badge (e.g., *Peluang 95% Lolos*).
- **National Ranking Widget**:
  - Shows student's current national position and percentile (e.g. *Rank #42 dari 3,450 Peserta*).

### 2.2 Exam Catalog Filters & Controls
- **Category Filter Tabs**:
  - `Semua Ujian` (All Exams)
  - `Try Out UTBK/SNBT` (UTBK SNBT IRT Exams)
  - `Ujian Mandiri PTN` (SIMAK UI, UM UGM, etc.)
  - `Ujian Sekolah / PTS` (School Exams)
- **Status Filter**:
  - `Semua` (All)
  - `Belum Dikerjakan` (Not Attempted)
  - `Sudah Dikerjakan` (Completed)
- **Search Bar**: Live title & description filtering.

### 2.3 Enhanced Exam Cards
- **IRT / Scoring System Badge** (e.g. *IRT UTBK*, *Standard Poin*).
- **Attempt Status Badge & Action Button**:
  - `Belum Dikerjakan` -> Button: **Mulai Ujian** (`/exams/[id]`)
  - `Sedang Berlangsung` -> Button: **Lanjutkan Ujian** (`/exams/[id]/cbt`)
  - `Selesai` -> Display Score & Rank -> Button: **Lihat Hasil & Pembahasan**
- **Subtests & Duration Summary**:
  - Duration (e.g. *195 Menit*)
  - Total Questions (e.g. *155 Soal*)
  - Target Contribution Indicator (*Menyumbang ke Skor Target PTN*).

---

## 3. Data Source Integration

- Uses `academicService.getExams()` for dynamic exam packets fetching.
- Leverages student profile details (`user?.school_name`, `user?.major`, `user?.education_level`, `user?.grade`) from `useAuthStore()`.
- Calculates mock/live target progress based on existing exam history score data.

---

## 4. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **Dynamic UI Rendering**: Confirm filters, target progress banner, and exam cards render accurately with fallback data if DB is empty.
