# Comprehensive Fullstack Database & Model Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all backend domain modules (`cbt`, `academic`, `question`, `content`, `school`, `identity`, `analytics`) and frontend models to the existing 32 PostgreSQL database schemas, using **Master Akademik (`academic`)** as the source of truth without any database schema mutations.

**Architecture:** 
1. Backend Go: Update queries in `backend/internal/content/repository.go` and `cbt_engine/handler.go` to store `category` in `cbt.exam.exam_type`, join `academic.grade` and `academic.education_level` for real grade names, compute question counts from `cbt.exam_question_pool`, and persist metadata via `cbt.exam_metadata`.
2. Frontend Next.js: Update `academic.service.ts` model normalization and fix route links in `frontend/src/app/(siswa)/exams/page.tsx` from `/cbt/${exam.id}/start` to `/exams/${exam.id}`.

**Tech Stack:** Go 1.24 (Fiber, pgxpool), Next.js 16 (React 19, TypeScript), PostgreSQL 16.

## Global Constraints

- **Zero Schema Mutations**: Do NOT execute any `ALTER TABLE` or `CREATE TABLE` commands against PostgreSQL database. Use existing `cbt`, `academic`, `question`, `content`, `school`, and `identity` tables verbatim.
- **Master Akademik Source of Truth**: All grade, level, subject, and chapter references across all modules must resolve to `academic` schema tables (`education_level`, `grade`, `subject`, `chapter`, `topic`).
- **Compilation Guarantee**: Both Go backend binaries and Next.js frontend MUST compile cleanly with 0 errors.

---

### Task 1: Backend Database & Model Alignment (`backend/internal/content/repository.go` & `cbt_engine/handler.go`)

**Files:**
- Modify: `backend/internal/content/repository.go:1850-2120`
- Modify: `backend/internal/cbt_engine/handler.go:340-435`

**Interfaces:**
- Consumes: `CreateExamReq`, `UpdateExamReq`
- Produces: Persistent `ExamFull` data mapped directly from existing PostgreSQL `cbt` and `academic` tables.

- [ ] **Step 1: Write `category` directly into `cbt.exam.exam_type`**

In `backend/internal/content/repository.go`:
Ensure `INSERT INTO cbt.exam (..., exam_type)` uses `c.Category` or `c.ExamType` instead of hardcoded `'CBT'`. In `updateExamContent`, update `exam_type = COALESCE($5, exam_type)`.

- [ ] **Step 2: Update `scanExam` to JOIN `academic.grade` and `academic.education_level`**

In `backend/internal/content/repository.go`:
Join `academic.grade g ON g.id = gr.grade_id` and `academic.education_level l ON l.id = g.education_level_id` in `examFrom`. Populate `e.Exam.Blueprint` map directly with `m.exam_type`, `g.name`, `total_questions` (from pool count), and `scoring_system` (from `md.negative_marking`).

- [ ] **Step 3: Update `UpdateExam` handler response**

In `backend/internal/cbt_engine/handler.go`:
Return the freshly fetched `ExamFull` object on `PUT /exams/:id` so frontend receives updated payload.

- [ ] **Step 4: Compile backend Go code**

Run: `go build -o qa_validator.exe ./cmd/qa_validator` in `backend/` directory.  
Expected: Build success with exit code 0.

---

### Task 2: Frontend Route & Model Normalization (`frontend/src/app/(siswa)/exams/page.tsx` & `academic.service.ts`)

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/page.tsx:370-388`
- Modify: `frontend/src/services/academic.service.ts:30-120`

**Interfaces:**
- Consumes: `Exam` API payload
- Produces: Correct Next.js App Router URL `/exams/${exam.id}` and normalized Exam properties for UI components.

- [ ] **Step 1: Fix Link URL on student exam cards**

In `frontend/src/app/(siswa)/exams/page.tsx`:
Change `<Link href={`/cbt/${exam.id}/start`}>` to `<Link href={`/exams/${exam.id}`}>`.

- [ ] **Step 2: Ensure `normalizeExam` extracts Master Akademik grade and category**

In `frontend/src/services/academic.service.ts`:
Ensure `normalizeExam` reads `grade_level`, `category`, `scoring_system`, and `total_questions` from root or blueprint object.

- [ ] **Step 3: Test frontend build**

Run: `npm run build` in `frontend/` directory.  
Expected: Production build completes with exit code 0.

---

### Task 3: Full End-to-End System Verification

**Files:**
- Executable: `backend/qa_validator.exe`
- Build script: `frontend/package.json`

- [ ] **Step 1: Run Backend QA Validator**

Run: `.\qa_validator.exe` in `backend/` directory.  
Expected: 46 / 46 endpoint tests pass (100%).

- [ ] **Step 2: Run Next.js Frontend Production Build**

Run: `npm run build` in `frontend/` directory.  
Expected: 48 static/dynamic routes compiled successfully with 0 errors.
