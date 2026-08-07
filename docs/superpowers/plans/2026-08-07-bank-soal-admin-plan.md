# Bank Soal Admin UI & Multi-Format Import Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete Admin Bank Soal Catalog (`/admin/questions`), Create Question Form (`/admin/questions/create`), and Multi-Format Import Engine (`/admin/questions/import`) for PDF, DOCX, XLSX, CSV in Next.js 16 frontend with zero backend modifications and strict read-only for existing items.

**Architecture:** Create modular React components using Tailwind CSS & Lucide icons for stats, filters, read-only detail drawer, 5-section create form with real-time student preview, and 4-stage import pipeline with template downloads and parsed item review table.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React icons, UI components (`card`, `button`, `input`, `badge`, `tabs`, `select`).

## Global Constraints
- Scope is strictly Frontend Only (`frontend/src/...`).
- No Edit or Delete buttons on existing or catalog questions.
- Support PDF, DOCX, XLSX, CSV formats in the import module.

---

### Task 1: Type Definitions (`frontend/src/types/question-bank.ts`)

**Files:**
- Create: `frontend/src/types/question-bank.ts`

- [ ] **Step 1: Write type definitions**
  Define `ExtendedQuestion`, `QuestionBlock`, `OptionBlock`, `SolutionStep`, `QuestionMetadata`, `ImportJob`, `ParsedQuestionItem` interfaces.

- [ ] **Step 2: Commit**
  `git add frontend/src/types/question-bank.ts && git commit -m "feat(bank-soal): add question bank and import type definitions"`

---

### Task 2: Question Import Service (`frontend/src/services/question-import.service.ts`)

**Files:**
- Create: `frontend/src/services/question-import.service.ts`

- [ ] **Step 1: Write Question Import Service**
  Implement template generator (`downloadTemplate(format)` for XLSX and CSV), file parser simulator (`parseFile(file, format)`), and batch import handler (`commitImport(jobId, questions)`).

- [ ] **Step 2: Commit**
  `git add frontend/src/services/question-import.service.ts && git commit -m "feat(bank-soal): add question import service with template downloads and parser simulation"`

---

### Task 3: Catalog Helper Components (`question-stats-bar`, `question-filter-bar`, `question-detail-drawer`)

**Files:**
- Create: `frontend/src/components/admin/questions/question-stats-bar.tsx`
- Create: `frontend/src/components/admin/questions/question-filter-bar.tsx`
- Create: `frontend/src/components/admin/questions/question-detail-drawer.tsx`

- [ ] **Step 1: Create QuestionStatsBar component**
  Display cards for Total Soal, Drafts, Published, Difficulty breakdown, and Active Import Jobs.

- [ ] **Step 2: Create QuestionFilterBar component**
  Build search input and select dropdowns for Subject, Level, Difficulty, Question Type, Status, and HOTS flag.

- [ ] **Step 3: Create QuestionDetailDrawer component**
  Build slide-over drawer showing question content blocks, options (highlighting correct answers and scores), explanation, solution steps, classification tags, IRT difficulty stats, versioning, and copy code action. NO edit/delete buttons.

- [ ] **Step 4: Commit**
  `git add frontend/src/components/admin/questions/ && git commit -m "feat(bank-soal): add stats bar, filter bar, and read-only detail drawer"`

---

### Task 4: Bank Soal Admin Catalog Page (`frontend/src/app/(admin)/admin/questions/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/questions/page.tsx`

- [ ] **Step 1: Implement Admin Questions Catalog Page**
  Integrate `QuestionStatsBar`, `QuestionFilterBar`, `QuestionDetailDrawer`, header with "Tambah Soal" (links to `/admin/questions/create`) and "Import Soal" (links to `/admin/questions/import`), comprehensive data table with selection checkboxes, badges, and detail trigger.

- [ ] **Step 2: Commit**
  `git add frontend/src/app/(admin)/admin/questions/page.tsx && git commit -m "feat(bank-soal): enhance admin questions catalog page"`

---

### Task 5: Create Question Page (`frontend/src/app/(admin)/admin/questions/create/page.tsx`)

**Files:**
- Create: `frontend/src/app/(admin)/admin/questions/create/page.tsx`

- [ ] **Step 1: Implement Halaman Tambah Soal**
  Build 5-section form:
  1. Hierarchical Classification (Level, Subject, Grade, Chapter, Topic, Competency)
  2. Question Type & Cognitive Metadata (Single Choice, Multiple Choice, True/False, Short Answer, Essay; Difficulty, Bloom's C1-C6, Duration, HOTS, Calculator, Randomize)
  3. Content Block Editor (Text, LaTeX preview, Image preview, Table snippet)
  4. Option & Key Answer Builder (Dynamic options A-E, True/False grid, Short Answer keys)
  5. Explanation & Solution Steps
  Include real-time student view preview card and Save/Publish actions.

- [ ] **Step 2: Commit**
  `git add frontend/src/app/(admin)/admin/questions/create/page.tsx && git commit -m "feat(bank-soal): create question authoring page with 5-section form and student preview"`

---

### Task 6: Multi-Format Import Engine Page (`frontend/src/app/(admin)/admin/questions/import/page.tsx`)

**Files:**
- Create: `frontend/src/app/(admin)/admin/questions/import/page.tsx`

- [ ] **Step 1: Implement Halaman Import Soal**
  Build 4-stage wizard:
  - Format selection (PDF, DOCX, XLSX, CSV) with template download buttons (.xlsx and .csv)
  - Drag & Drop file uploader with validation
  - 4-stage pipeline stepper animation/progress (Upload -> Validate -> OCR/AI Parsing -> Review)
  - Interactive Parsed Questions Review Table with status badges (Valid, Warning, Error)
  - Batch Import Submission action button

- [ ] **Step 2: Commit**
  `git add frontend/src/app/(admin)/admin/questions/import/page.tsx && git commit -m "feat(bank-soal): create multi-format import engine page for PDF, DOCX, XLSX, CSV"`

---

### Task 7: Verification & Build Check

**Files:**
- Verify overall TypeScript typing and Next.js build setup.

- [ ] **Step 1: Run TypeScript compiler check in frontend**
  Execute `npx tsc --noEmit` in `frontend` directory to ensure zero type errors.

- [ ] **Step 2: Commit final verification status**
