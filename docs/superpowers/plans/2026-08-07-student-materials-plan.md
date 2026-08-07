# Student Learning Materials & Reader (`/materials`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize and personalize the `/materials` catalog and `/materials/[id]` reader with subject cards, category filters, distraction-free reading layout, and direct CTA to practice questions.

**Architecture:** Next.js 16 App Router using React client components, lucide-react icons, shadcn/ui components, and Tailwind CSS v4 layout styling. Integrates `GradeBadge` for education level awareness.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Lucide Icons, shadcn/ui.

## Global Constraints

- **No API/DB Schema Changes**: Maintain existing service signatures and backend contracts.
- **Strict Type Safety**: Every component must pass `npx tsc --noEmit`.
- **Responsive Layout**: Full support for dark mode and mobile views.

---

### Task 1: Enhance Materials Catalog Page (`/materials/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(siswa)/materials/page.tsx`

**Interfaces:**
- Consumes: `GradeBadge` from `@/components/siswa/GradeBadge`, `academicService` from `@/services/academic.service`, `Material` type from `@/types`.
- Produces: Enhanced `/materials` catalog route.

- [ ] **Step 1: Update MaterialsPage component with Subject Cards & Filter Tabs**

Implement subject summary grid (*Penalaran Matematika*, *Literasi Bahasa Indonesia*, *Penalaran Umum*, *Pengetahuan Kuantitatif*), category filters (*Semua*, *Teori*, *Strategi*, *Trik Cepat*, *Rangkuman Bab*), search bar, and grade badge header.

- [ ] **Step 2: Verify Type Safety & Compilation**

Run: `cmd /c "npx tsc --noEmit"` (in `frontend/` directory)  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/src/app/(siswa)/materials/page.tsx
git commit -m "feat(materials): enhance student materials catalog page with subject cards & filters"
```

---

### Task 2: Enhance Material Reader Page (`/materials/[id]/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(siswa)/materials/[id]/page.tsx`

**Interfaces:**
- Consumes: `academicService.getMaterialById(id)`, `Material` type, Lucide icons (`ArrowLeft`, `Clock`, `CheckCircle2`, `Zap`, `BookOpen`).
- Produces: Enhanced `/materials/[id]` reader route.

- [ ] **Step 1: Update MaterialDetailPage component with clean typography, tips callout box, and Practice CTA**

Add breadcrumb header, structured content layout, "💡 Tips & Trik UTBK" highlight card, completion toggle button, and "🔥 Latihan Soal Materi Ini" CTA button linking to `/practice?subject_id=...`.

- [ ] **Step 2: Verify Type Safety & Compilation**

Run: `cmd /c "npx tsc --noEmit"` (in `frontend/` directory)  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add "frontend/src/app/(siswa)/materials/[id]/page.tsx"
git commit -m "feat(materials): enhance material reader page with distraction-free typography & practice CTA"
```
