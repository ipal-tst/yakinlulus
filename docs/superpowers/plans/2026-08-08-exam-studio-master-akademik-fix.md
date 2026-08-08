# Exam Studio & Master Akademik Complete Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix exam category, scoring system, question count, and grade level selection across Create/Edit Exam Studio and Admin List view, integrate dynamic Master Akademik grade/level selection, and enhance Step 4 Student Variant Simulator with real question previews.

**Tech Stack:** Go 1.22+, Next.js 16, React 19, TypeScript, Lucide Icons, TanStack Query, shadcn/ui.

---

### Task 1: Backend cbt_engine Blueprint & Field Persistence (`backend/internal/cbt_engine/handler.go`)

**Files:**
- Modify: `backend/internal/cbt_engine/handler.go`

**Changes:**
1. Extend `CreateExamRequest` and `UpdateExam` body structs to parse `Category`, `ScoringSystem`, `TotalQuestions`, `Subtests`, `GradeLevel`, `GradeID`, `SubjectID`, `Difficulty`, `DefaultMode`.
2. Automatically merge all these attributes into the `bp` (blueprint map) before invoking `h.svc.CreateExam` and `h.svc.UpdateExam`.
3. Recompile backend executable and verify.

---

### Task 2: Frontend `academic.service.ts` Normalization & Payload Formatting

**Files:**
- Modify: `frontend/src/services/academic.service.ts`

**Changes:**
1. Update `normalizeExam(e)` to unpack `category`, `scoring_system`, `total_questions`, `subtests`, `grade_level` from `e.blueprint` or top-level properties accurately.
2. In `createExam(payload)` and `updateExam(id, payload)`, pass complete `blueprint: { category, scoring_system, total_questions, subtests, grade_level, difficulty, default_mode }` alongside top-level properties.

---

### Task 3: Master Akademik Grade Level Integration & Accurate Question Count in Create/Edit Studio

**Files:**
- Modify: `frontend/src/app/(admin)/admin/exams/create/page.tsx`
- Modify: `frontend/src/app/(admin)/admin/exams/[id]/edit/page.tsx`

**Changes:**
1. Load Education Levels and Grades from `academicMasterService.getLevels()` and `academicMasterService.getGrades()`.
2. Replace hardcoded grade level text input with a dynamic Grade/Level selector dropdown.
3. Compute `totalSampledQuestions` accurately:
   `subtests.reduce((sum, st) => sum + (st.sample_question_count || st.pool_question_ids?.length || 0), 0)`.
   When adding a subtest with $N$ pool questions, initialize `sample_question_count` to $N$.

---

### Task 4: Complete Edit Studio (`/admin/exams/[id]/edit/page.tsx`) Sync

**Files:**
- Modify: `frontend/src/app/(admin)/admin/exams/[id]/edit/page.tsx`

**Changes:**
1. Pre-fill all exam fields from `examItem` (Title, Description, Category, ScoringSystem, GradeID, GradeLevel, SubjectID, ChapterID, Difficulty, DefaultMode, DurationMinutes, PassingScore, Status, Subtests).
2. Wire Question Pool Picker Modal and subtest controls matching `create/page.tsx`.

---

### Task 5: Enhance Step 4 Student Variant Simulator with Real Question Previews

**Files:**
- Modify: `frontend/src/components/admin/exams/StudentExamPovSimulator.tsx`
- Modify: `frontend/src/app/(admin)/admin/exams/create/page.tsx`
- Modify: `frontend/src/app/(admin)/admin/exams/[id]/edit/page.tsx`

**Changes:**
1. Fetch real question details for selected `pool_question_ids` using `academicService.getQuestions()` / `questionService`.
2. Add a question detail preview modal/accordion allowing admins to inspect actual question text, options A-E, correct answer key, and explanation/pembahasan.
3. Add explanatory info tooltip describing the purpose of Step 4 (Simulasi Varian Acak Soal & Opsi per Siswa untuk Ujian CBT Live).
