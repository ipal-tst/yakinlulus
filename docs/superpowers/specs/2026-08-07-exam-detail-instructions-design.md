# Design Specification: Dynamic Exam Detail & Instructions Page

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target File:** `frontend/src/app/(siswa)/exams/[id]/page.tsx`

---

## 1. Objective

Customize the Exam Detail & Instruction page (`/exams/[id]`) so that the rules, badges, subtests breakdown, scoring explanations, and warnings dynamically align with the selected exam's database record (category, scoring system, subtest rules, mode, and subject/chapter associations).

---

## 2. Dynamic Features & Content Rules

### 2.1 Category & Metadata Badges
- **Category Badge**: Render `UTBK SNBT`, `Ujian Mandiri PTN`, `PTS / UAS Sekolah`, `Ujian Per-Bab`, or `Ujian Harian` dynamically.
- **Scoring System Badge**: Render `IRT UTBK (Skala 200 - 1000)`, `Sistem Minus (+4, -1, 0)`, or `Poin Standar (0 - 100)`.
- **Difficulty & Mode Badge**: Render Difficulty (`EASY`, `MEDIUM`, `HARD`, `HOTS`) and Mode (`Mode Santai` vs `Mode Simulasi Ujian`).

### 2.2 Dynamic Subtests Breakdown List
- If the exam record has `subtests` defined (e.g. TPS, Literasi Bahasa Indonesia, Penalaran Matematika):
  - Render a clean breakdown table listing each subtest name, duration (minutes), and question sampling count.
- If no subtests are defined:
  - Render a single-section summary showing total questions & total duration.

### 2.3 Contextual Instructions & Guidelines
- **IRT UTBK Rules**:
  - Explain IRT weighting: Harder questions yield higher IRT scores; no negative points for wrong answers.
- **Sistem Minus Rules**:
  - Explain scoring calculation: +4 for correct, -1 for wrong, 0 for unattempted.
- **Standard Points Rules**:
  - Explain score calculation: 0 - 100 based on proportion of correct answers.
- **Mode-Specific Rule**:
  - `SANTAI`: Direct solution & explanation visible after each question.
  - `SIMULASI`: CBT timer running, answers locked until test submission.

---

## 3. Data Integration & Fallback Handling

- Fetch exam by ID via `academicService.getExamById(id)`.
- If the backend returns a record or if fallback is used, match against mock exam lists by ID (`ex-1`, `ex-2`, `ex-3`, etc.) so that each specific test displays its precise title, category, subtests, and rules instead of defaulting to a static UTBK template.

---

## 4. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **Dynamic UI Verification**: Confirm that `/exams/ex-1`, `/exams/ex-2`, and `/exams/ex-3` display distinct subtest lists and scoring instructions matching their database attributes.
