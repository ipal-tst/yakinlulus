# Admin Exam & Tryout Management Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a comprehensive, full-page Exam & Tryout Management Studio for admins supporting IRT-based UTBK/PTN exams, PTS/UAS school exams, subtest configurations, and dynamic question pool sampling rules.

**Architecture:** Extend frontend exam types with subtest pool rules & IRT scoring models. Rebuild `/admin/exams/page.tsx` as a high-density management hub and create dedicated full-page studios at `/admin/exams/create/page.tsx` and `/admin/exams/[id]/edit/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, TanStack React Query, TypeScript.

## Global Constraints

- Never break existing API contracts or backend database schemas.
- Ensure unique React keys for dynamic dynamic dropdown items (`Array.from(new Set(...))`).
- All code must pass `cmd /c npx tsc --noEmit` with 0 errors.

---

### Task 1: Extend Exam Data Types & Service Layer

**Files:**
- Modify: `d:/Project/EdTech/Yakinlulus.id/frontend/src/types/index.ts`
- Modify: `d:/Project/EdTech/Yakinlulus.id/frontend/src/services/academic.service.ts`

**Interfaces:**
- Consumes: Existing `Exam` interface
- Produces: Extended `ExamCategory`, `ScoringSystem`, `ExamSubtestRule`, and full CRUD operations in `academicService`.

- [ ] **Step 1: Update `types/index.ts` with extended exam & subtest pool interfaces**
- [ ] **Step 2: Add `createExam`, `updateExam`, `deleteExam` functions to `academic.service.ts`**
- [ ] **Step 3: Run `cmd /c npx tsc --noEmit` to verify type safety**

---

### Task 2: Create Full-Page Create Exam Studio (`/admin/exams/create/page.tsx`)

**Files:**
- Create: `d:/Project/EdTech/Yakinlulus.id/frontend/src/app/(admin)/admin/exams/create/page.tsx`

**Interfaces:**
- Consumes: Extended `ExamSubtestRule`, `academicService`, `questionService` or question bank data
- Produces: Dedicated 4-step full-page creation studio for exam metadata, subtest pool sampling rules (e.g. 30 from 100 questions), IRT scoring model, and student attempt simulation preview.

- [ ] **Step 1: Write `/admin/exams/create/page.tsx` with step wizard navigation**
- [ ] **Step 2: Implement Question Pool Selection & `sample_question_count` sampling rules**
- [ ] **Step 3: Implement Live Student Attempt Simulator**
- [ ] **Step 4: Run `cmd /c npx tsc --noEmit` to verify compilation**

---

### Task 3: Create Full-Page Edit Exam Studio (`/admin/exams/[id]/edit/page.tsx`)

**Files:**
- Create: `d:/Project/EdTech/Yakinlulus.id/frontend/src/app/(admin)/admin/exams/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `params.id`, `academicService.getExamById`
- Produces: Full-page edit route to modify existing exam metadata, subtest pools, and scoring settings.

- [ ] **Step 1: Write `/admin/exams/[id]/edit/page.tsx`**
- [ ] **Step 2: Hydrate form with existing exam subtests and pool sampling rules**
- [ ] **Step 3: Save changes back via `academicService.updateExam`**
- [ ] **Step 4: Run `cmd /c npx tsc --noEmit` to verify compilation**

---

### Task 4: Rebuild Main Admin Exams Hub (`/admin/exams/page.tsx`)

**Files:**
- Modify: `d:/Project/EdTech/Yakinlulus.id/frontend/src/app/(admin)/admin/exams/page.tsx`

**Interfaces:**
- Consumes: `/admin/exams/create`, `/admin/exams/[id]/edit`, `academicService.getExams`
- Produces: Modernized Exam Hub with stats bar, category filters (UTBK IRT, PTS/UAS, Harian, Tryout), grid cards, and navigation buttons to full-page studio routes.

- [ ] **Step 1: Rebuild `/admin/exams/page.tsx` with stats, filters, and exam cards**
- [ ] **Step 2: Connect action buttons to router navigation (`/admin/exams/create`, `/admin/exams/[id]/edit`)**
- [ ] **Step 3: Run `cmd /c npx tsc --noEmit` to verify type safety**

---

### Task 5: Final Verification & Type Check

- [ ] **Step 1: Run `cmd /c npx tsc --noEmit`**
- [ ] **Step 2: Confirm 0 TypeScript compilation errors**
