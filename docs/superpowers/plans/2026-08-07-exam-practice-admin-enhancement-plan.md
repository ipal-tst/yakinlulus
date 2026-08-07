# Admin Exam Management Practice Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Admin Exam Studio (`/admin/exams/create`) and Admin Exam Catalog (`/admin/exams`) to fully configure practice parameters (Subject, Chapter, Difficulty, Practice Mode) for student practice sets.

**Architecture:** Next.js 16 App Router using React client components, `@tanstack/react-query`, Lucide icons, `AppShell` layout, `academicMasterService`, `academicService`.

---

### Task 1: Update Types & Admin Exam Studio (`/admin/exams/create/page.tsx`)

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/app/(admin)/admin/exams/create/page.tsx`

- [ ] **Step 1: Add optional fields to Exam interface in `frontend/src/types/index.ts`**

Add `subject_id?: string; subject_name?: string; chapter_id?: string; difficulty?: "EASY" | "MEDIUM" | "HARD" | "HOTS"; default_mode?: "SANTAI" | "SIMULASI";`

- [ ] **Step 2: Update `/admin/exams/create/page.tsx` with Subject, Chapter, Difficulty, & Mode selectors**

In Step 1 (General Info), add Subject dropdown (populated via `academicMasterService.getSubjects()`), Chapter dropdown (populated via `academicMasterService.getChapters(subjectId)`), Difficulty dropdown, and Default Practice Mode selector.

- [ ] **Step 3: Update `/admin/exams/page.tsx` with Subject & Difficulty Badges & Filters**

Add Subject & Difficulty badges on exam cards, and add extra filter options to the category dropdown.

- [ ] **Step 4: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit Implementation**

```bash
git add "frontend/src/types/index.ts" "frontend/src/app/(admin)/admin/exams/create/page.tsx" "frontend/src/app/(admin)/admin/exams/page.tsx"
git commit -m "feat(admin-exams): enhance admin exam creation with subject, chapter, difficulty, and mode configuration"
```
