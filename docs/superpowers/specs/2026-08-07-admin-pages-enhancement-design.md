# Design Specification: Admin Pages Enhancement & Mock Data Removal

**Date**: 2026-08-07  
**Status**: APPROVED  
**Scope**: Frontend Admin Pages (`/admin/*`)

---

## 1. Overview
The goal of this enhancement is to remove all hardcoded mockup data, fake fallback numbers, and dummy arrays across all Admin pages in `frontend/src/app/(admin)/admin/*`. All pages will be strictly aligned with backend database schemas (`backend/api_list.md` & `struktur database/`) using `@tanstack/react-query` and service modules, rendering real database records or clean Skeleton/Empty States when data is not yet available.

---

## 2. Scope & Target Files

### 2.1 Target Pages & Components
1. **`/admin/questions/page.tsx` (Question Catalog)**
   - **Current Issue**: Uses `INITIAL_MOCK_QUESTIONS` array.
   - **Enhancement**: Replace with `useQuery` invoking `questionService.getQuestions()`. Render real `ExtendedQuestion[]` or an empty state with prompt to create/import questions.

2. **`/admin/cms/page.tsx` (Content Management System)**
   - **Current Issue**: Uses `mockPages` and `mockNews` arrays.
   - **Enhancement**: Replace with dynamic data fetching using `notificationService.getTemplates()` / `materialService.getMaterials()` / `api("/cms")` with clean empty states.

3. **`/admin/page.tsx` (Super Admin Dashboard)**
   - **Current Issue**: Fallback mock numbers in `catch` block (`total_users: 15420`, `total_schools: 85`, etc.).
   - **Enhancement**: Remove fallback mock data. Display actual values from `dashboardService.getAdminDashboard()`. On error/loading, render skeleton cards and error alert banner.

4. **`/admin/academic/page.tsx` & Sub-components (`BabTable.tsx`, etc.)**
   - **Status**: Already using `academicMasterService`.
   - **Enhancement**: Ensure all levels, grades, subjects, chapters, topics, and learning outcomes seamlessly handle real database responses and zero-data states without mock fallbacks.

5. **`/admin/analytics/page.tsx` & `/admin/health/page.tsx` & `/admin/monitor-config/page.tsx`**
   - **Status**: Already using `analyticsService`, `adminService`, `auditService`.
   - **Enhancement**: Ensure loading skeletons and error handlers handle non-existent backend data gracefully.

---

## 3. Data Flow & API Contracts

### 3.1 Questions Catalog API Mapping
- **Endpoint**: `GET /api/v1/academic/questions`
- **Params**: `subject_name`, `difficulty`, `page`, `limit`
- **Response**: `ExtendedQuestion[]` or `PaginatedData<ExtendedQuestion>`

### 3.2 Super Admin Dashboard API Mapping
- **Endpoint**: `GET /api/v1/dashboard/admin`
- **Response Structure**:
  ```ts
  {
    kpi: {
      total_users: number;
      active_today: number;
      total_schools: number;
      total_teachers: number;
      total_students: number;
      total_exams: number;
      total_materials: number;
      total_questions: number;
    },
    system_health: {
      api_status: string;
      db_status: string;
      storage_usage: number;
      uptime_hours: number;
    },
    active_users: { online_now: number; active_24h: number },
    school_stats: { total: number; active: number; verified: number },
    cbt_monitoring: { scheduled: number; running: number; finished: number },
    recent_activity: Array<{ type: string; message: string; created_at: string }>
  }
  ```

---

## 4. UI/UX Rules
1. **Zero Mock Data Policy**: No static dummy arrays or hardcoded numbers in React components.
2. **Skeleton & Empty States**: When loading, show animated Skeleton components. When database returns 0 records, render a visually polished Empty State component with an action button (e.g. "Tambah Soal", "Buat Konten").
3. **Strict Scope**: Scope is strictly front-end UI & service integration. No edits to API contracts, backend code, or database schemas.
