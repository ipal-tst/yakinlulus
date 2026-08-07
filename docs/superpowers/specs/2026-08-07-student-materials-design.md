# Design Specification: Student Learning Materials & Reader (`/materials`)

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target Module:** Student Module (`frontend/src/app/(siswa)/materials`)  

---

## 1. Overview & Objective

Modernize and personalize the **Student Learning Materials & Reader** experience on YakinLulus.id. The primary goal is to provide a clean, accessible catalog of subjects and materials tailored to the student's education level (`education_level` & `grade`), paired with a distraction-free material reader that seamlessly bridges reading with practice questions.

---

## 2. Technical Scope & Architecture

### Constraints:
- **Zero API/DB Changes**: Utilize existing `/academic/materials` endpoints and mock data fallbacks.
- **Frontend Framework**: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui components, Lucide icons, `AppShell` layout.

---

## 3. UI/UX Component Requirements

### Component 1: Subject Cards Carousel & Category Tabs (`/materials/page.tsx`)
1. **Header & Context**:
   - Title: "Modul Belajar & Teori UTBK/SNBT".
   - Subtitle with `GradeBadge` showing student's active education level & grade.
2. **Subject Overview Grid**:
   - Quick action cards for subjects (e.g., *Penalaran Matematika*, *Literasi Bahasa Indonesia*, *Penalaran Umum*, *Pengetahuan Kuantitatif*).
   - Display total materials and completion percentage bar.
3. **Materials Feed Controls**:
   - Category Tabs: `Semua`, `Teori`, `Strategi`, `Trik Cepat`, `Rangkuman Bab`.
   - Real-time search bar (filtering by material title or subject name).
4. **Material Card Item**:
   - Subject Badge, Category Badge, Reading Time (`Clock` icon), and `CheckCircle2` indicator if completed.
   - Action: "Baca Materi" button leading to `/materials/[id]`.

---

### Component 2: Distraction-Free Material Reader (`/materials/[id]/page.tsx`)
1. **Navigation Header**:
   - Back button (`< Kembali ke Modul Belajar`).
   - Breadcrumb: `Materi` > `Subject Name` > `Material Title`.
2. **Reading Layout**:
   - Clean typography with proper line height and generous padding.
   - Highlights callout box for "💡 Tips & Trik UTBK".
   - Structured sections with subheadings, bullet points, and code/formula blocks.
3. **Action Bar & Practice Trigger**:
   - **"Tandai Selesai"** button: Updates completion state and displays success toast.
   - **"🔥 Latihan Soal Materi Ini"** button: Primary CTA button navigating to `/practice` or `/exams` with pre-filtered subtest/subject parameters.

---

## 4. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` to ensure zero compilation errors.
2. **Responsiveness**: Verify proper rendering on mobile (stacked) and desktop (grid & reader sidebar).
3. **Navigation Flow**: Confirm seamless transition from `/materials` -> `/materials/[id]` -> `/practice`.
