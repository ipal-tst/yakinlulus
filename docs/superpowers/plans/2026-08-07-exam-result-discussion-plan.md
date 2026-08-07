# Exam Result & Discussion Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/app/(siswa)/exams/[id]/result/page.tsx` to resolve the 404 error after completing a CBT exam, displaying comprehensive IRT score analytics, target PTN progress, national ranking, accuracy stats, subtest breakdown, and interactive answer key solutions.

**Architecture:** Next.js 16 App Router using React client components, Lucide icons, `AppShell` layout, `academicService`.

---

### Task 1: Create `/app/(siswa)/exams/[id]/result/page.tsx` with Full Score Analytics & Discussion

**Files:**
- Create: `frontend/src/app/(siswa)/exams/[id]/result/page.tsx`

- [ ] **Step 1: Implement Target PTN Score Header & IRT Progress Banner**

Display IRT score, target score gap, passing probability badge, and national ranking position.

- [ ] **Step 2: Implement Accuracy & Subtest Breakdown Matrix**

Render accuracy metrics (% correct, % wrong, % skipped) and subtest performance breakdown table.

- [ ] **Step 3: Implement Interactive Question Answer Key & Step-by-Step Solutions**

Render filterable question list (All, Correct, Incorrect, Skipped) with student answers vs correct answers and step-by-step solution text.

- [ ] **Step 4: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/[id]/result/page.tsx"
git commit -m "feat(siswa-exams): create exam result and discussion page resolving 404 error"
```
