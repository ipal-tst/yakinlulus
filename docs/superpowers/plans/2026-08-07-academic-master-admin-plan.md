# Academic Master Admin Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `/admin/academic` into a rich, visual, 100% API-integrated Academic Master Admin Hub with live metric overview, color-coded level cards, interactive breadcrumbs, and complete Capaian Pembelajaran (CP/KD) tree representation.

**Architecture:** Refactor `/admin/academic/page.tsx` and related components (`LevelTable`, `GradeTable`, `SubjectTable`, `BabTable`, form dialogs) into clean, modularized units with robust TanStack React Query handling, skeleton loaders, and error fallbacks.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, TanStack React Query v5.

## Global Constraints
- Read-only scope for database schema, backend API contracts, and endpoints (no delete or modification of backend code).
- Standardized UI components using Tailwind CSS v4 design tokens and glassmorphism styling.
- Zero hardcoded static fallback arrays; 100% live data fetching from `academicMasterService`.

---

### Task 1: Academic Master Overview Stat Cards Component
**Files:**
- Create: `frontend/src/components/admin/academic/AcademicStatsOverview.tsx`
- Modify: `frontend/src/app/(admin)/admin/academic/page.tsx`

**Interfaces:**
- Consumes: `academicMasterService.getLevels`, `academicMasterService.getCurriculums`, `academicMasterService.getPrograms`
- Produces: `<AcademicStatsOverview />` rendering 4 live KPI cards (Total Jenjang, Total Kelas, Total Kurikulum, Total Program).

- [ ] **Step 1: Create AcademicStatsOverview component**
```tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, Layers, Award } from "lucide-react";

interface AcademicStatsOverviewProps {
  totalLevels: number;
  totalCurriculums: number;
  totalPrograms: number;
  isLoading: boolean;
}

export function AcademicStatsOverview({ totalLevels, totalCurriculums, totalPrograms, isLoading }: AcademicStatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Jenjang</p>
            <p className="text-xl font-bold font-heading">{totalLevels}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Kurikulum</p>
            <p className="text-xl font-bold font-heading">{totalCurriculums}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Program</p>
            <p className="text-xl font-bold font-heading">{totalPrograms}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status Master</p>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">Terintegrasi</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

### Task 2: Level Card Grid & Table Refactor with Jenjang Color Themes
**Files:**
- Modify: `frontend/src/components/table/LevelTable.tsx`

**Interfaces:**
- Consumes: `EducationLevel[]`
- Produces: Enhanced Level cards with distinct theme badges per Jenjang (SD, SMP, SMA, SMK, GAPYEAR).

- [ ] **Step 1: Add color theme mapper and visual badges to LevelTable**
```tsx
const getLevelColorTheme = (code: string) => {
  const c = code.toUpperCase();
  if (c.includes("SD")) return "border-rose-200 bg-rose-50/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800";
  if (c.includes("SMP")) return "border-sky-200 bg-sky-50/50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800";
  if (c.includes("SMA")) return "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
  if (c.includes("SMK")) return "border-purple-200 bg-purple-50/50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800";
  return "border-amber-200 bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
};
```

---

### Task 3: Complete Integration of Bab, Topik, & Capaian Pembelajaran (CP/KD)
**Files:**
- Modify: `frontend/src/app/(admin)/admin/academic/bab/BabTable.tsx`
- Modify: `frontend/src/app/(admin)/admin/academic/bab/TopicExpander.tsx`
- Modify: `frontend/src/app/(admin)/admin/academic/bab/LearningOutcomeExpander.tsx`

**Interfaces:**
- Consumes: `academicMasterService.getChapters`, `getTopics`, `getLearningOutcomes`
- Produces: Accordion hierarchy showing Bab → Topik → Learning Outcome (CP/KD) with Bloom's Taxonomy badges.

---

### Task 4: Main Page Integration, Skeletons, and Build Verification
**Files:**
- Modify: `frontend/src/app/(admin)/admin/academic/page.tsx`

**Interfaces:**
- Connects `AcademicStatsOverview`, `LevelTable`, `GradeTable`, `SubjectTable`, `BabTable`, `CurriculumTable`, `ProgramTable` with React Query error handling and skeleton loaders.

- [ ] **Step 1: Wire all queries and components into page.tsx**
- [ ] **Step 2: Run build verification (`npm run build`)**

---

## Verification Plan

### Automated Build Verification
Run standard Next.js build command to verify zero TypeScript or syntax errors:
```bash
npm run build
```
Expected output: `✓ Compiled successfully`, `✓ Generating static pages (42/42)`.
