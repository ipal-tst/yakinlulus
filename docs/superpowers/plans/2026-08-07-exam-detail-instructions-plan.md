# Dynamic Exam Detail Instructions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/exams/[id]/page.tsx` into a dynamic data-driven exam instruction page where rules, badges, subtests breakdown, scoring methodology, and mode guidelines adapt to the database exam record.

**Architecture:** Next.js 16 App Router using React client components, Lucide icons, `AppShell` layout, `academicService`.

---

### Task 1: Update `/app/(siswa)/exams/[id]/page.tsx` with Dynamic Exam Rules & Subtests Breakdown

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/[id]/page.tsx`

- [ ] **Step 1: Implement Dynamic Category, Scoring, Difficulty, and Mode Badges**

Render badges based on `exam.category`, `exam.scoring_system`, `exam.difficulty`, and `exam.default_mode`.

- [ ] **Step 2: Implement Dynamic Subtests Breakdown Section**

If `exam.subtests` exists and has items, render a subtest table/card breakdown with subtest name, question count, and duration. If not, render single total overview stats.

- [ ] **Step 3: Implement Contextual Scoring Instructions & Guidelines Box**

Adapt instructions based on `IRT`, `NEGATIVE_MARKING`, or `STANDARD_POINTS`, and specify CBT mode guidelines (`SANTAI` vs `SIMULASI`).

- [ ] **Step 4: Update Fallback Generator by ID**

Ensure `getFallbackExamById(id)` provides accurate mock data matching the specific `id` if backend API fails.

- [ ] **Step 5: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/[id]/page.tsx"
git commit -m "feat(siswa-exams): customize exam instruction page dynamically based on exam database record"
```
