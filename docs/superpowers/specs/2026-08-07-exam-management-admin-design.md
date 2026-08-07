# Design Specification: Admin Exam & Tryout Management Hub

**Date**: 2026-08-07  
**Module**: Admin Exam & Tryout Management (`/admin/exams`)  
**Target System**: YakinLulus.id Admin Dashboard  

---

## 1. Executive Summary & Objectives

The Admin Exam & Tryout Management Hub is designed to empower admin staff and educators to author, configure, and manage all categories of exams on the YakinLulus.id platform. It accommodates:
1. **High-Stakes University Entrance Exams (IRT Scoring)**: UTBK SNBT, UMPTN, SBMPTN, UM PTN with multi-subtest allocation, subtest timer locks, and Item Response Theory (IRT) dynamic scoring weights.
2. **School & Periodic Academic Exams**: PTS (Penilaian Tengah Semester), UAS (Penilaian Akhir Semester), Ujian Harian (UH), Ujian per-Mapel, Ujian per-Bab.
3. **National & Graduation Exams**: TKA, UN, Tryout Nasional.
4. **Dynamic Question Pooling & Double Randomization Engine**:
   - **Question Pool Sampling**: Admins assemble a pool of $N$ questions (e.g. 100 questions) for an exam/subtest.
   - **Sampling Rules**: Admins set the number $K$ of questions randomly drawn for each student (e.g. sample 30 questions out of 100).
   - **Double Randomization**: Ensures every student receives a unique random subset of questions and randomized question numbers and choice options.

---

## 2. System Architecture & Components

```
+-----------------------------------------------------------------------------------+
|                            Admin Exams Hub (/admin/exams)                         |
+-----------------------------------------------------------------------------------+
|  - ExamStatsBar: Active, Draft, IRT Exams, Total Attempts                        |
|  - ExamFilterBar: Search, Category (UTBK, PTS/UAS, Harian), Status, Level          |
|  - ExamGridCardView: Action triggers for Edit Studio, Preview, Delete, Status     |
+-----------------------------------------------------------------------------------+
                                        |
     +----------------------------------+----------------------------------+
     |                                                                     |
     v                                                                     v
+------------------------------------+               +------------------------------------+
|   Create Studio                    |               |   Edit Studio                      |
|   (/admin/exams/create)            |               |   (/admin/exams/[id]/edit)         |
+------------------------------------+               +------------------------------------+
| - Tab 1: General Info & Timing     |               | - Edit details, update pools       |
| - Tab 2: Subtest & Pool Config     |               | - Update scoring model & limits    |
| - Tab 3: IRT / Scoring Rules       |               |                                    |
| - Tab 4: Student Simulation        |               |                                    |
+------------------------------------+               +------------------------------------+
```

---

## 3. Data Model Extensions

The frontend service layer will extend `Exam` and `CBTSession` types (in `src/types/index.ts` and `src/services/academic.service.ts`) with flexible metadata structures without breaking existing backend API contracts:

```typescript
export type ExamCategory = 
  | "UTBK_SNBT" 
  | "UM_PTN" 
  | "TRYOUT_NASIONAL" 
  | "PTS_UAS" 
  | "UJIAN_HARIAN" 
  | "UJIAN_BAB";

export type ScoringSystem = "IRT" | "STANDARD_POINTS" | "NEGATIVE_MARKING";

export interface ExamSubtestRule {
  id: string;
  subtest_name: string;
  subject_id?: string;
  duration_minutes: number;
  pool_question_ids: string[]; // Total pool (e.g. 100 items)
  sample_question_count: number; // Items presented to student (e.g. 30 items)
  shuffle_questions: boolean;
  shuffle_options: boolean;
}

export interface EnhancedExam extends Exam {
  category: ExamCategory;
  scoring_system: ScoringSystem;
  grade_level?: string;
  subtests: ExamSubtestRule[];
  is_randomized_pool: boolean;
  total_pool_questions: number;
  total_sampled_questions: number;
}
```

---

## 4. Feature Workflows & User Interface

### A. Main Exam Management Hub (`/admin/exams/page.tsx`)
- Real-time statistics bar (Active exams, Drafs, Total UTBK/IRT exams, Attempt counts).
- Filter bar with search, category filters (UTBK, PTS/UAS, Harian, Tryout), status filters, and grade levels.
- Responsive exam cards with clear indicators for IRT scoring, pooled randomization badges, subtest count, and quick action buttons.

### B. Dedicated Full-Page Exam Authoring Studio (`/admin/exams/create/page.tsx` & `/admin/exams/[id]/edit/page.tsx`)
- **Step 1: Exam Overview & Classification**:
  - Title, Exam Category (UTBK, PTS, UAS, Harian), Scoring Model (IRT vs Standard vs Negative Points), Duration, Start & End Time bounds.
- **Step 2: Subtest & Question Pool Manager**:
  - Add multiple subtests (e.g. Penalaran Matematika, Literasi Bahasa Indonesia, Literasi Bahasa Inggris, Penalaran Umum).
  - Select questions from Question Bank into the Pool (e.g. 100 questions).
  - Set `sample_question_count` (e.g. 30 questions) per student attempt.
  - Enable/disable Question Order Shuffling and Choice Option Shuffling.
- **Step 3: IRT Scoring & Weighting Rules**:
  - Set item difficulty weights ($a, b, c$ parameters for IRT 3PL model simulation).
- **Step 4: Student Attempt Simulation Preview**:
  - Live simulation showing how a student sees their 30 randomly sampled questions out of the 100-question pool.

---

## 5. Verification & Testing Plan

1. **TypeScript Type Safety**: Run `cmd /c npx tsc --noEmit` to guarantee zero compilation errors.
2. **Pool Randomization Engine Simulation**: Verify that 2 consecutive simulated attempts yield distinct question sets and shuffled option numbers.
3. **Data Integrity**: Confirm that creating, editing, and deleting exams persists smoothly in state/API services without breaking existing CBT engines.
