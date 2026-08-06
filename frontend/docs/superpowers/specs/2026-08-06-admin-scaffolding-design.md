# Admin Scaffolding (SUPER_ADMIN + STAFF) — Design Spec

Date: 2026-08-06
Status: Approved by user (2026-08-06)
Stack: Next.js 16 + React 19 + TypeScript strict + Tailwind CSS v4 + shadcn/ui + TanStack Query/Table + Zustand + recharts
Base API: `http://localhost:8080/api/v1`
Design system: `design.md` (verbatim)

## Goal

Build complete, detailed admin scaffolding for `SUPER_ADMIN` and `STAFF` roles —
dashboard, user/school/target-school/notification/audit/AI management, plus
`SUPER_ADMIN`-only health/logs and analytics — wired to the real backend endpoints
per `docs/frontend/API-contract.md` and `docs/frontend/PAGE-WIRING.md`. Includes
bugfix of the existing dashboard service endpoints and unit tests.

## Architecture

Feature-folder approach: every admin module owns a folder of components
(`src/components/admin/<module>/`) plus one service (`src/services/<module>.service.ts`)
and its types. Page routes are thin compositions. Shared primitives
(PageHeader, ConfirmDialog, DataTable upgraded to TanStack) live in
`src/components/admin/` and `src/components/data-display/`.

Server state via TanStack Query hooks (`useQuery`/`useMutation`). Forms via
react-hook-form + zod. Charts via recharts (max 6 colors per design.md §30).

## Scope

### Routes & pages

| Route | Status | Action |
|---|---|---|
| `/staff` | exists, wrong endpoint | Fix service endpoint → `GET /dashboard/admin` |
| `/staff/users` | exists, inline modal | Refactor to module components |
| `/staff/schools` | exists | Refactor to module components |
| `/staff/target-schools` | missing | Create (target-schools API) |
| `/staff/notifications` | missing | Create (broadcast + templates) |
| `/staff/audit` | exists at `/staff/audit-logs`, hardcoded | Move + wire `GET /audit-logs`, `GET /audit-logs/stats` |
| `/staff/ai` | missing | Create (AI config) |
| `/admin/health` | missing | Create (SUPER_ADMIN only) |
| `/admin/analytics` | missing | Create (SUPER_ADMIN only) |

### Bugfix — dashboard service endpoints

Current (`src/services/dashboard.service.ts`) uses wrong paths:

- `/dashboard/siswa` → `/dashboard/student`
- `/dashboard/guru` → `/dashboard/teacher`
- `/dashboard/staff` → `/dashboard/admin`
- Remove `/dashboard/finance`, `/dashboard/investor` (backend has no such routes; `cmd/api/main.go` + `dashboard.go:805-808` register only student/teacher/admin).

Backend `AdminDashboard` shape (dashboard.go:129-169):
`kpi{total_users, active_today, total_schools, total_teachers, total_students, total_exams, total_materials, total_questions}`,
`system_health{api_status, db_status, storage_usage, uptime_hours}`,
`active_users{online_now, active_24h}`,
`school_stats{total, active, verified}`,
`cbt_monitoring{scheduled, running, finished}`,
`recent_activity[{type, message, created_at}]`.

Replace frontend `StaffDashboard` type with `AdminDashboard` matching this shape.

## File structure

```
src/app/(staff)/staff/page.tsx
src/app/(staff)/staff/users/page.tsx
src/app/(staff)/staff/schools/page.tsx
src/app/(staff)/staff/target-schools/page.tsx
src/app/(staff)/staff/notifications/page.tsx
src/app/(staff)/staff/audit/page.tsx        # move from audit-logs
src/app/(staff)/staff/ai/page.tsx
src/app/(admin)/admin/health/page.tsx
src/app/(admin)/admin/analytics/page.tsx

src/components/admin/
  page-header.tsx        # title + description + actions + breadcrumb
  confirm-dialog.tsx     # shared destructive/activate confirm
  users/      UserTable.tsx, UserFormDialog.tsx, UserRoleBadge.tsx
  schools/    SchoolTable.tsx, SchoolFormDialog.tsx
  target-schools/ TargetSchoolTable.tsx, TargetSchoolFormDialog.tsx
  notifications/ BroadcastForm.tsx, TemplateTable.tsx, TemplateFormDialog.tsx
  audit/      AuditLogTable.tsx, AuditStatsCards.tsx
  ai/         AiConfigForm.tsx
  admin/      HealthStatusGrid.tsx, LogsViewer.tsx
  analytics/  OverviewKPISection.tsx, ExamReportsTable.tsx

src/services/ dashboard.service.ts (fix), target-schools.service.ts,
              notification.service.ts, audit.service.ts, ai.service.ts,
              admin.service.ts, analytics.service.ts
src/types/    admin.ts (new types), index.ts (remove StaffDashboard)
src/components/data-display/data-table.tsx  # upgrade to TanStack, keep Column<T> API
```

## Data flow

- Query hooks per module: `useQuery` list/detail, `useMutation` create/update/delete/activate.
- Loading: `ui/skeleton.tsx`. Empty: `feedback/empty-state.tsx`. Error: inline alert + empty state.
- 401 auto-logout already handled in `src/lib/api.ts`.
- Forms: react-hook-form + zod schema; validate at submit; error below input (design.md §13).

## DataTable upgrade

`src/components/data-display/data-table.tsx` currently hand-rolled (search + client pagination).
Upgrade internals to `@tanstack/react-table@9` (already in package.json) while keeping the
existing `Column<T>` interface (header/accessorKey/cell) so SISWA/GURU pages keep compiling.
Add per design.md §29: sticky header, sorting, filtering, column resize, CSV export, pagination.

## Sidebar & role gating

`src/components/layout/sidebar.tsx`:
- STAFF_NAV keeps 6 items; add `roles?: UserRole[]` support.
- SUPER_ADMIN-only items (Health/Logs `/admin/health`, Analytics `/admin/analytics`)
  gated by role.
- Route groups `(staff)` and `(admin)` share `AppShell`.

## Endpoint reference (source of truth: docs/frontend/API-contract.md)

- Dashboard: `GET /dashboard/admin` (SUPER_ADMIN)
- Users: `GET /auth/users`, `POST /auth/users`, `PUT /auth/users/:id`,
  `PATCH /auth/users/:id/activate`, `DELETE /auth/users/:id`
- Schools: `GET /school`, `POST /school`, `PUT /school/:id`,
  `PATCH /school/:id/status`, `DELETE /school/:id`, `GET/PUT /school/:id/settings`
- Target schools: `GET/POST /target-schools`, `GET/PUT/DELETE /target-schools/:id`
- Notifications: `GET /notifications/templates`, `POST /notifications/templates`,
  `PUT/DELETE /notifications/templates/:id`, `POST /notifications/send`,
  `POST /notifications/broadcast`
- Audit: `GET /audit-logs`, `GET /audit-logs/stats`
- AI config: `GET /ai/config`, `PUT /ai/config`, `POST /ai/test-connection`
- Admin: `GET /admin/health`, `GET /admin/logs`
- Analytics: `GET /analytics/admin/overview`, `GET /analytics/admin/reports/exams`,
  `GET /analytics/admin/reports/exams/:id`, `GET /analytics/school/stats`

## Testing

Vitest (devDependency) + unit tests for:
1. `src/services/*.service.ts` endpoint contract (URLs + methods).
2. Pure helpers/formatters (role badge variant mapping, datetime/number format).
3. Zod form schema validation.

No E2E in this phase.

## Non-goals (this phase)

- FINANCE/INVESTOR page builds (out of scope).
- Backend changes — all endpoints already exist; only frontend consumed.
- E2E / integration tests.
