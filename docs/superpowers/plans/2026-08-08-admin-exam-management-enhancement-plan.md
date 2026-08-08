# Admin Exam Management Studio & Visual Question Pool Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, high-aesthetic Admin Exam Management Studio (`/admin/exams` & `/admin/exams/create`) supporting Presets, 4-Step Wizard, Visual Question Pool Picker with filters, custom subtest rules, and Custom Scoring Systems (IRT, Standard, Minus System).

**Architecture:** A 4-step interactive wizard studio using Next.js 16, React Query, dynamic presets, modal picker for Question Bank sampling, and enhanced card catalog UI.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS v4, Lucide Icons, React Query, shadcn/ui components.

## Global Constraints
- Absolute paths for file references
- Clean TypeScript types without `any` errors (`npx tsc --noEmit` must pass)
- Light/System theme compatibility using `bg-card`, `bg-background`, `border-border`, `text-foreground`

---

### Task 1: Exam Presets Definition & Helpers
**Files:**
- Create: `frontend/src/components/admin/exams/exam-presets.ts`

**Interfaces:**
- Produces: `EXAM_PRESETS` list, `ExamPreset` type

- [ ] **Step 1: Define Exam Presets Constant and Types**

Write `frontend/src/components/admin/exams/exam-presets.ts` with 6 standard presets: UTBK SNBT 2026 Akbar (IRT), PTS/UAS Paket Multi-Mapel, Ujian Per-Mapel, Ujian Per-Bab, Ujian Mandiri PTN (Sistem Minus), and Custom Exam.

- [ ] **Step 2: TypeScript check**
Run `cmd /c "npx tsc --noEmit"` to ensure type safety.

---

### Task 2: Visual Question Pool Picker Modal
**Files:**
- Create: `frontend/src/components/admin/exams/QuestionPoolPickerModal.tsx`

**Interfaces:**
- Consumes: `questionService.getQuestions`, `academicMasterService.getSubjects`, `academicMasterService.getChapters`
- Produces: `QuestionPoolPickerModal` component with props `isOpen`, `onClose`, `onSelectQuestions`, `initialSelectedIds`, `defaultSubjectId`

- [ ] **Step 1: Implement `QuestionPoolPickerModal.tsx`**

Build interactive modal with:
- Subject, Chapter, Difficulty (EASY, MEDIUM, HARD, HOTS), and Search Filters.
- Table listing questions with checkboxes and "Pilih Semua Hasil Filter" button.
- Real-time selected count badge and confirmation button.

- [ ] **Step 2: TypeScript check**
Run `cmd /c "npx tsc --noEmit"`.

---

### Task 3: Upgrade Create Exam Page with Preset Modal & 4-Step Studio Wizard
**Files:**
- Modify: `frontend/src/app/(admin)/admin/exams/create/page.tsx`

**Interfaces:**
- Consumes: `EXAM_PRESETS` from Task 1, `QuestionPoolPickerModal` from Task 2
- Produces: Enhanced `/admin/exams/create` page with Preset Picker, Question Pool Modal integration, and Advanced Scoring Engine (IRT, Standard, Minus, Custom).

- [ ] **Step 1: Add Preset Selector Modal on Page Load / Button Trigger**
- [ ] **Step 2: Connect Question Pool Picker Modal to Subtest Pool Questions**
- [ ] **Step 3: Add Custom Scoring Rules Selector in Step 3**
- [ ] **Step 4: Update Student Attempt Simulator in Step 4**
- [ ] **Step 5: Run TypeScript check (`npx tsc --noEmit`)**

---

### Task 4: Upgrade Exam Catalog Page (`/admin/exams/page.tsx`)
**Files:**
- Modify: `frontend/src/app/(admin)/admin/exams/page.tsx`

**Interfaces:**
- Consumes: `academicService.getExams`
- Produces: Rich exam list catalog with Stats Bar, Filters, and detailed Exam Cards.

- [ ] **Step 1: Add High-Impact Stats Bar and Advanced Category Filter**
- [ ] **Step 2: Add Subtest Badges, Scoring Badge, and Quick Actions to Exam Cards**
- [ ] **Step 3: Verify build (`npx tsc --noEmit`)**
