# Admin Learning Materials Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Admin Learning Materials page (`/admin/materials`) into a feature-rich, database-synced Learning Materials Authoring Hub with Stat Cards, Search/Filter, Create/Edit Dialog, Student Preview Simulator, and File Import.

**Architecture:** Use `tanstack/react-query` to fetch materials and subjects dynamically from `academicService` and `academicMasterService`. Keep all modal workflows fast and responsive in the unified Hub.

**Tech Stack:** Next.js 16 (App Router), React Query, Tailwind CSS, shadcn/ui, Lucide Icons, TypeScript.

## Global Constraints
- Do not modify backend API contracts, database schema, or backend code.
- Ensure all subject select dropdowns use unique keys (`Array.from(new Set(...))`) to prevent React key collision warnings.
- Keep strict TypeScript compliance.

---

### Task 1: Enhance `academic.service.ts` with Material CRUD Operations

**Files:**
- Modify: `frontend/src/services/academic.service.ts:13-21`

**Interfaces:**
- Consumes: `Material` interface from `@/types`
- Produces: `createMaterial`, `updateMaterial`, `deleteMaterial` methods in `academicService`

- [ ] **Step 1: Add CRUD methods to `academicService`**
```typescript
    async createMaterial(payload: Partial<Material>): Promise<Material> {
        return api<Material>("/academic/materials", {
            method: "POST",
            body: payload,
        });
    },

    async updateMaterial(id: string, payload: Partial<Material>): Promise<Material> {
        return api<Material>(`/academic/materials/${id}`, {
            method: "PUT",
            body: payload,
        });
    },

    async deleteMaterial(id: string): Promise<{ success: boolean }> {
        return api<{ success: boolean }>(`/academic/materials/${id}`, {
            method: "DELETE",
        });
    },
```
- [ ] **Step 2: Save and verify compilation**

---

### Task 2: Create `MaterialStatsBar` Component

**Files:**
- Create: `frontend/src/components/admin/materials/material-stats-bar.tsx`

**Interfaces:**
- Consumes: `materials: Material[]`
- Produces: Stat bar component displaying Total Modul, Published, Draft, Total Read Time, Covered Subjects.

- [ ] **Step 1: Create `material-stats-bar.tsx` component**
- [ ] **Step 2: Save and verify TypeScript types**

---

### Task 3: Create `MaterialFilterBar` Component with Dynamic Database Subjects

**Files:**
- Create: `frontend/src/components/admin/materials/material-filter-bar.tsx`

**Interfaces:**
- Consumes: `academicMasterService.getSubjects()`
- Produces: Search input, subject filter select, category filter select, status filter select, and quick action buttons.

- [ ] **Step 1: Create `material-filter-bar.tsx` with `Array.from(new Set(...))` deduplication**
- [ ] **Step 2: Save and verify compilation**

---

### Task 4: Create `MaterialAuthoringDialog` Component

**Files:**
- Create: `frontend/src/components/admin/materials/MaterialAuthoringDialog.tsx`

**Interfaces:**
- Consumes: `item: Material | null`, `isOpen`, `onClose`, `onSave`
- Produces: Modal with Metadata & Content tabs for rich material authoring.

- [ ] **Step 1: Create `MaterialAuthoringDialog.tsx` component**
- [ ] **Step 2: Save and verify layout and state handling**

---

### Task 5: Create `MaterialPreviewDialog` Component (Student LMS Simulator)

**Files:**
- Create: `frontend/src/components/admin/materials/MaterialPreviewDialog.tsx`

**Interfaces:**
- Consumes: `item: Material | null`, `isOpen`, `onClose`
- Produces: LMS Reader simulation modal with Desktop & Mobile view toggle.

- [ ] **Step 1: Create `MaterialPreviewDialog.tsx` component**
- [ ] **Step 2: Save and verify layout responsiveness**

---

### Task 6: Create `MaterialImportDialog` Component

**Files:**
- Create: `frontend/src/components/admin/materials/MaterialImportDialog.tsx`

**Interfaces:**
- Consumes: `isOpen`, `onClose`, `onImportSuccess`
- Produces: File upload dropzone & Markdown/JSON parsing preview.

- [ ] **Step 1: Create `MaterialImportDialog.tsx` component**
- [ ] **Step 2: Save and verify compilation**

---

### Task 7: Assemble `AdminMaterialsPage` (`/admin/materials/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/materials/page.tsx`

**Interfaces:**
- Consumes: `MaterialStatsBar`, `MaterialFilterBar`, `MaterialAuthoringDialog`, `MaterialPreviewDialog`, `MaterialImportDialog`, `academicService.getMaterials()`
- Produces: Complete Admin Learning Materials Management Hub.

- [ ] **Step 1: Update `page.tsx` with state, queries, and action handlers**
- [ ] **Step 2: Verify component composition**

---

### Task 8: Production Build Verification

**Files:**
- Target: All project routes

- [ ] **Step 1: Run `npm run build`**
- [ ] **Step 2: Confirm Exit Code 0 and zero TypeScript errors**
