# Design Spec: Academic Master Module

**Date:** 2026-08-07
**Project:** YakinLulus.id
**Domain:** Admin / STAFF / SUPER_ADMIN

---

## Overview

Halaman Master Akademik untuk mengelola hierarki akademik:
Jenjang (SD/SMP/SMA/Gap Year) → Kelas → Mapel → Bab → Topik → Learning Outcome.

Curriculum & Program dikelola di halaman terpisah.

---

## Role Access

| Role | Sidebar | CRUD | GET-only |
|------|---------|------|----------|
| SUPER_ADMIN | visible | full | - |
| STAFF | visible | full | - |
| GURU | hidden | none | none |
| FINANCE | hidden | none | none |
| INVESTOR | hidden | none | none |

Route: `/admin/academic` (STAFF + SUPER_ADMIN only)

---

## Page Layout

### 1. Filter Bar (sticky, top)
3 cascading Select dropdowns + "+" quick-add buttons:

```
[Jenjang ▼]  [Kelas ▼]  [Mapel ▼]
   +              +            +
```

- Kelas: disabled until Jenjang selected (filter by `level_id`)
- Mapel: disabled until Kelas selected (filter by `education_level_id` + `grade_id`)
- Each `+` button opens the relevant form dialog

### 2. Content Area (below filter)
Context-aware based on selection depth:

| State | Shows |
|-------|-------|
| No selection | Jenjang table (all levels) |
| Jenjang selected | Kelas table (filtered by level) |
| Kelas selected | Mapel table (filtered by grade) |
| Mapel selected | Bab table with expandable rows → Topik → Learning Outcomes |

Breadcrumb above content shows current hierarchy path.

### 3. Tables per Entity

**Jenjang**
Columns: Name, Code, Sort Order, Status (Badge), Actions (dropdown menu)

**Kelas**
Columns: Name, Level Code, Sort Order, Status, Actions

**Mapel**
Columns: Name, Code, Level/Grade, Status, Actions

**Bab** (main table when Mapel selected)
Columns: Name, Subject, Description, Sort Order, Status, Actions
- Click row → expand → show **Topik** table nested
- Topik expand → show **Learning Outcome** table nested

**Topik** (nested under Bab)
Columns: Title, Sequence, Description, Status, Actions

**Learning Outcome** (nested under Topik)
Columns: Code, Title, Bloom Level, Sequence, Status, Actions

### 4. CRUD Forms
- Pattern: Dialog + React Hook Form + Zod (same as `SchoolFormDialog.tsx`)
- Form dialogs: `LevelFormDialog`, `GradeFormDialog`, `SubjectFormDialog`, `ChapterFormDialog`, `TopicFormDialog`, `LoFormDialog`
- Input height: 44px (h-11), radius 12
- Label above input, error below input
- Submit button with loading state, Cancel (outline variant)
- Delete: ConfirmDialog (same pattern as `/staff/schools`)

---

## API Service

**File:** `frontend/src/services/academic-master.service.ts`

Endpoints (inherited from backend, already deployed):

| Entity | Endpoints |
|--------|-----------|
| Levels | `GET /academic/levels`, `GET /academic/levels/:id`, `POST /academic/levels`, `PUT /academic/levels/:id`, `DELETE /academic/levels/:id` |
| Grades | `GET /academic/grades`, `POST /academic/grades`, `PUT /academic/grades/:id`, `DELETE /academic/grades/:id` |
| Subjects | `GET /academic/subjects`, `GET /academic/subjects/:id`, `POST /academic/subjects`, `PUT /academic/subjects/:id`, `DELETE /academic/subjects/:id` |
| Chapters | `GET /academic/chapters`, `GET /subjects/:id/chapters`, `POST /academic/chapters`, `PUT /academic/chapters/:id`, `DELETE /academic/chapters/:id` |
| Topics | `GET /academic/topics`, `POST /academic/topics`, `PUT /academic/topics/:id`, `DELETE /academic/topics/:id` |
| Learning Outcomes | `GET /academic/learning-outcomes`, `POST /academic/learning-outcomes`, `PUT /academic/learning-outcomes/:id`, `DELETE /academic/learning-outcomes/:id` |

Note: `write` middleware already restricts POST/PUT/DELETE to SUPER_ADMIN + STAFF only. GURU/FINANCE/INVESTOR get 403 on write ops.

---

## Frontend Components

| Component | Path | Purpose |
|-----------|------|---------|
| `admin/academic/page.tsx` | Page route | Main page container with filter bar + content area |
| `admin/academic/AcademicFilterBar.tsx` | Component | Cascading dropdowns (Jenjang → Kelas → Mapel) |
| `admin/academic/AcademicBreadcrumb.tsx` | Component | Hierarchy breadcrumb navigation |
| `admin/academic/AcademicTableRenderer.tsx` | Component | Renders context-aware table based on selection |
| `admin/academic/bab/BabTable.tsx` | Component | Bab table with expandable Topik/LO rows |
| `admin/academic/bab/TopicExpander.tsx` | Component | Nested Topik table inside Bab row |
| `admin/academic/bab/LearningOutcomeExpander.tsx` | Component | Nested LO table inside Topik row |
| `admin/academic/forms/LevelFormDialog.tsx` | Component | Create/edit Jenjang |
| `admin/academic/forms/GradeFormDialog.tsx` | Component | Create/edit Kelas |
| `admin/academic/forms/SubjectFormDialog.tsx` | Component | Create/edit Mapel |
| `admin/academic/forms/ChapterFormDialog.tsx` | Component | Create/edit Bab |
| `admin/academic/forms/TopicFormDialog.tsx` | Component | Create/edit Topik |
| `admin/academic/forms/LearningOutcomeFormDialog.tsx` | Component | Create/edit LO |

---

## Sidebar Navigation

```ts
// Add to STAFF_NAV (frontend/src/components/layout/sidebar.tsx)
{ title: "Master Akademik", href: "/admin/academic", icon: GraduationCap }
```

- Import `GraduationCap` icon from lucide-react (existing dependency)
- GURU_NAV: NOT modified (no guru access)
- SUPER_ADMIN: inherits via `[...STAFF_NAV, ...SUPER_ADMIN_NAV]` logic already in place

---

## Types (types/index.ts)

Existing types already defined:
- `EducationLevel { id, name, code, description }`
- `Grade { id, level_id, name, code, level? }`
- `Subject { id, name, code, description, icon_url }`
- `Chapter { id, subject_id, name, order_index, description }`
- `Topic { id, chapter_id, name, order_index }`

Need to add:
- `LearningOutcome { id, topic_id, code?, title, sequence, bloom_default?, description?, is_active }`
- Form request types: `CreateLevelReq`, `UpdateLevelReq`, `CreateGradeReq`, `CreateSubjectReq`, etc.

---

## Parallelizable Sub-tasks

These can be developed independently:

1. **API service + types** — `academic-master.service.ts` + type extensions
2. **Form dialogs** — Level/Grade/Subject forms (6 dialogs, parallelizable)
3. **Bab table + expanders** — BabTable + TopicExpander + LoExpander
4. **Filter bar + breadcrumb** — cascading dropdowns
5. **Main page container** — `page.tsx` integration
6. **Sidebar update** — add menu item

---

## Constraints & Notes

- Zero motion (admin panel, not marketing page)
- shadcn/ui components (existing pattern)
- TanStack Query for server state
- React Hook Form + Zod for form validation
- No Supabase direct — all API goes through Go backend `@/lib/api`
- Backend fully implements all endpoints (verified in `backend/internal/academic/academic.go`)
