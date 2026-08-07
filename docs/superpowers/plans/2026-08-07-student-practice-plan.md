# Student Practice Module (`/practice`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `/practice` route to resolve the 404 error and provide a comprehensive practice hub supporting Subject-based Practice, Topic-based Practice, and Special Admin Drills.

**Architecture:** Next.js 16 App Router using React client components, Lucide icons, `AppShell` layout, shadcn/ui components, and Tailwind CSS v4.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Lucide Icons, shadcn/ui.

## Global Constraints

- **STRICT REQUIREMENT**: ZERO changes to backend API contracts, backend logic, or database schema.
- **Strict Type Safety**: Every file must pass `npx tsc --noEmit` with 0 errors.
- **Responsive & Dark-Mode Friendly**: Responsive layout with full support for mobile and desktop screens.

---

### Task 1: Create Practice Hub Page Component (`/practice/page.tsx`)

**Files:**
- Create: `frontend/src/app/(siswa)/practice/page.tsx`

**Interfaces:**
- Consumes: `GradeBadge` from `@/components/siswa/GradeBadge`, `academicService` from `@/services/academic.service`, `useAuthStore` from `@/stores/auth.store`.
- Produces: Client page component at `/practice` route.

- [ ] **Step 1: Create `/practice/page.tsx` with Stats Header, 3-Tab Selector, and Launcher Modal**

Build the header with student stats cards (Questions Answered, Accuracy %, Drill Streak, Practice Points), 3 Category Tabs (*Latihan Per Mapel*, *Latihan Per Materi/Bab*, *Drill Soal Spesial Admin*), practice cards grid, and interactive start practice modal.

- [ ] **Step 2: Verify Type Safety & Compilation**

Run: `cmd /c "npx tsc --noEmit"` (in `frontend/` directory)  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add "frontend/src/app/(siswa)/practice/page.tsx"
git commit -m "feat(practice): create student practice hub page resolving 404 error"
```
