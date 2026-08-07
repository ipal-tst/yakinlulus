# Student Exam Catalog & Goal Progress Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/exams` into a goal-driven student exam hub featuring target university passing probability tracking, national percentile ranking widget, multi-category filters, and rich exam status cards.

**Architecture:** Next.js 16 App Router using React client components, Tailwind CSS v4, Lucide icons, `AppShell` layout, `academicService`, `useAuthStore`.

---

### Task 1: Enhance Student Exam Catalog Hub (`frontend/src/app/(siswa)/exams/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/page.tsx`

- [ ] **Step 1: Build Target University & National Ranking Banner**

Add Target PTN Progress Card showing student's target major, IRT score gap, passing chance (e.g. 95%), and National Rank badge.

- [ ] **Step 2: Implement Multi-Category & Attempt Status Filters**

Add Category Tabs (`Semua`, `Try Out UTBK/SNBT`, `Ujian Mandiri PTN`, `Ujian Sekolah`) and Status Filter (`Semua`, `Belum Dikerjakan`, `Sudah Dikerjakan`).

- [ ] **Step 3: Enhance Exam Cards UI & Status Badges**

Render IRT/Standard badges, subtest summary, duration, attempt status (`Belum Dikerjakan` / `Selesai`), score preview, and launcher action button.

- [ ] **Step 4: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/page.tsx"
git commit -m "feat(siswa-exams): modernize student exam catalog hub with target PTN progress and ranking banner"
```
