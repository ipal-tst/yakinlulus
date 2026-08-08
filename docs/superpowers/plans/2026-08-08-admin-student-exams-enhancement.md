# Admin & Student Exams Page Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix exam edit links and draft status toggle in Admin Exams page (`/admin/exams`), and eliminate mock data while enhancing UI/UX in Student Exams page (`/siswa/exams`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide Icons, TanStack Query, shadcn/ui.

---

### Task 1: Fix Admin Exams Edit Action & Quick Status Toggle

**Files:**
- Modify: `frontend/src/app/(admin)/admin/exams/page.tsx`

**Changes:**
1. Update table view edit button link: Change `href="/admin/exams/create"` to `href={`/admin/exams/${exam.id}/edit`}`.
2. Update card view edit button link: Change `href="/admin/exams/create"` to `href={`/admin/exams/${exam.id}/edit`}`.
3. Add a quick status toggle button/badge in both table and card view that calls `academicService.updateExam(exam.id, { status: newStatus })` so admins can switch Draft ↔ Published with 1 click.
4. Show toast / feedback on successful status change and invalidate query `["admin-exams"]`.

---

### Task 2: Enhance Student Exams Page & Connect Real DB Data

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/page.tsx`

**Changes:**
1. Remove `getFallbackExams()` mock data generator.
2. Fetch exams using `academicService.getExams()` and student target PTN using `academicService.getTargetSchool()`.
3. Filter student view to show active/published exams.
4. Display dynamic target school header (University, Major, Target Score) using real user profile / target data.
5. Upgrade layout with modern card design, category tabs, difficulty badges, IRT scoring badge, duration, question count, and primary CTA ("Mulai Ujian" / "Lihat Hasil").
6. Provide clean empty state when no exams are found in database.
