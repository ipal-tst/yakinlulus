# Admin Pages Enhancement & Mock Data Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all hardcoded mockup data across all Admin pages in `/admin/*` and sync them with real backend database services and clean Skeleton/Empty States.

**Architecture:** Use `@tanstack/react-query` to consume existing frontend services (`questionService`, `dashboardService`, `notificationService`, `materialService`, `analyticsService`, `adminService`). When the database returns zero records or an error occurs, display responsive Skeleton loaders, Error Banners, and clean Empty States.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, TanStack React Query, Lucide Icons.

## Global Constraints
- Zero static dummy arrays or hardcoded mock numbers in React components.
- Strict read-only scope for existing data catalog.
- Zero edits/writes to API contracts, backend code, or database schemas.

---

### Task 1: Question Catalog Real Data Integration (`/admin/questions/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/questions/page.tsx`

**Interfaces:**
- Consumes: `questionService.getQuestions()` from `frontend/src/services/question.service.ts`
- Produces: Dynamic Question Catalog UI using real API response or empty state.

- [ ] **Step 1: Replace `INITIAL_MOCK_QUESTIONS` with `useQuery`**
Remove `INITIAL_MOCK_QUESTIONS`. Add `useQuery` hook:
```tsx
const { data: rawQuestions, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-questions-catalog", search, selectedSubject, selectedDifficulty, selectedType, selectedStatus, hotsOnly],
    queryFn: async () => {
        const res = await questionService.getQuestions({
            subject_name: selectedSubject !== "ALL" ? selectedSubject : undefined,
            difficulty: selectedDifficulty !== "ALL" ? selectedDifficulty : undefined,
        });
        return Array.isArray(res) ? res : res?.data || [];
    },
});
```

- [ ] **Step 2: Add Skeleton Loaders & Empty State**
When `isLoading` is true, render a 5-row table skeleton. When `questions.length === 0`, render an Empty State card with a "Tambah Soal" button.

- [ ] **Step 3: Test TypeScript build for `/admin/questions`**
Run: `cmd /c "npm run build"` in `frontend/` to verify zero type errors.

---

### Task 2: CMS Page API Integration (`/admin/cms/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/cms/page.tsx`

**Interfaces:**
- Consumes: `notificationService.getTemplates()` from `frontend/src/services/notification.service.ts` or `materialService.getMaterials()`
- Produces: Dynamic CMS UI for templates, pages, and news.

- [ ] **Step 1: Remove `mockPages` and `mockNews`**
Delete the inline `mockPages` and `mockNews` static arrays.

- [ ] **Step 2: Connect to `notificationService.getTemplates()` using `useQuery`**
Fetch templates and contents dynamically:
```tsx
const templatesQuery = useQuery({
    queryKey: ["cms-templates"],
    queryFn: () => notificationService.getTemplates(),
});
```

- [ ] **Step 3: Add Loading Skeleton and Empty State UI**
Render skeleton cards when `isLoading` is true and a "Belum ada konten" empty state card when records are 0.

- [ ] **Step 4: Test TypeScript build for `/admin/cms`**
Run: `cmd /c "npm run build"` in `frontend/`.

---

### Task 3: Admin Dashboard Fallback Data Removal (`/admin/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `dashboardService.getAdminDashboard()` from `frontend/src/services/dashboard.service.ts`
- Produces: Real Admin Dashboard KPI grid with loading skeleton and error alert.

- [ ] **Step 1: Remove `catch` block mock data fallback**
Remove lines 36-71 where mock data (e.g. `total_users: 15420`) is set on error.

- [ ] **Step 2: Implement Skeleton Loaders and Error Banner**
Replace hardcoded fallback values with loading skeletons when `!data && !error`, and show a clean error banner with a "Coba Lagi" button if `error` occurs.

- [ ] **Step 3: Test TypeScript build for `/admin`**
Run: `cmd /c "npm run build"` in `frontend/`.

---

### Task 4: Full Admin Verification & Build Check

**Files:**
- Verify: `frontend/src/app/(admin)/admin/**`

- [ ] **Step 1: Check all admin routes for mock data**
Ensure `/admin/academic`, `/admin/analytics`, `/admin/health`, `/admin/monitor-config`, `/admin/exams`, `/admin/materials` compile clean and contain zero mock arrays.

- [ ] **Step 2: Run production build**
Run: `cmd /c "npm run build"` in `frontend/`.
Expected: `✓ Compiled successfully` with 0 errors across all 42 routes.
