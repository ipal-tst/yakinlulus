# Replace Mock Data with Real Database Data - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock/fallback data in admin pages with real database queries via existing API hooks, ensuring every admin page displays live data from PostgreSQL/Supabase.

**Architecture:** 
- Identify all mock/fallback data in admin pages
- Replace hardcoded arrays with real API hooks (`useLevels`, `useSubjects`, `useUsers`, `useSchools`, `useAnalyticsOverview`, etc.)
- Remove `INITIAL_*` constants and fallback logic
- Ensure proper loading states and error handling
- Use existing `useQuery` / `useMutation` patterns with proper cache invalidation

**Tech Stack:** Next.js 15, React 19, TanStack Query v5, TypeScript, Tailwind v4

## Global Constraints

- All admin pages under `frontend/app/(portal)/admin/**/*.tsx`
- Use existing hooks from `frontend/lib/api.ts` (e.g., `useLevels`, `useSubjects`, `useUsers`, `useSchools`, `useAnalyticsOverview`, `useExams`, `useMaterials`, `useContents`, `useMedia`, `useSubscriptionStats`, `useSubscriptionPlans`, `useAIStats`, `useAIConversations`, `useAuditStats`, `useAuditLogs`)
- Use `useQueryClient` for mutations with `invalidateQueries`
- TypeScript strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- No mock data constants (`INITIAL_*`, `INITIAL_*_MOCK`, etc.)
- Loading states with proper skeletons/spinners
- Error boundaries/toast for failed queries

---

### Task 1: Fix Admin Dashboard (`admin/page.tsx`) - Replace Mock Health Services & Logs

**Files:**
- Modify: `frontend/app/(portal)/admin/page.tsx`

**Interfaces:**
- Consumes: `useAdminDashboard` hook (already exists, returns `{ totalUsers, totalSchools, activeExamSessions, totalExams, totalQuestions, approvedQuestions }`)
- Produces: Real-time health metrics from backend API

- [x] **Step 1: Remove mock constants**
```typescript
// DELETE these lines (70-83):
const INITIAL_HEALTH_SERVICES: HealthMetric[] = [...]
const INITIAL_LOGS: TerminalLogEntry[] = [...]
```

- [x] **Step 2: Add real health check hooks**
```typescript
// ADD after useAdminDashboard:
const { data: healthData, isLoading: healthLoading } = useApiHealthCheck() // new hook needed
const { data: logData, isLoading: logLoading } = useSystemLogs() // new hook needed
```

- [x] **Step 3: Update health services rendering**
```typescript
// REPLACE healthServices state usage:
{healthLoading ? <Skeleton /> : healthData?.services?.map(...)}

// REPLACE logs state usage:
{logLoading ? <Skeleton /> : logData?.logs?.map(...)}
```

- [x] **Step 4: Add backend API endpoints for health/logs**
- Backend: Add `/api/v1/admin/health` and `/api/v1/admin/logs` endpoints in `backend/internal/admin/handler.go`

- [x] **Step 5: Add frontend hooks for health/logs**
```typescript
// In lib/api.ts:
export function useApiHealthCheck() { return useQuery({ queryKey: ['admin', 'health'], queryFn: () => apiFetch('/admin/health') }) }
export function useSystemLogs() { return useQuery({ queryKey: ['admin', 'logs'], queryFn: () => apiFetch('/admin/logs') }) }
```

- [x] **Step 6: Test and verify**
- Run: `npm run build && npm run type-check`
- Verify dashboard loads real health data from DB

---

### Task 2: Fix Master Data Levels (DONE) (`admin/master-data/levels/page.tsx`) - Remove INITIAL_LEVELS Fallback

**Files:**
- Modify: `frontend/app/(portal)/admin/master-data/levels/page.tsx`

**Interfaces:**
- Consumes: `useLevels` (from `lib/api.ts`) → returns `LevelItem[]` from `/api/v1/academic/levels`
- Produces: Live level data without fallback

- [x] **Step 1: Remove INITIAL_LEVELS constant**
```typescript
// DELETE lines 36-41:
const INITIAL_LEVELS: LevelItem[] = [...]
```

- [x] **Step 2: Remove fallback state initialization**
```typescript
// REPLACE line 73:
const [levels, setLevels] = React.useState<LevelItem[]>(INITIAL_LEVELS);
// WITH:
const [levels, setLevels] = React.useState<LevelItem[]>([]);
```

- [x] **Step 3: Remove mock ID check in delete**
```typescript
// REPLACE lines 308-319 (isMockId logic):
// DELETE entire isMockId block (lines 308-319)
// Keep only real API delete
```

- [x] **Step 4: Ensure fetchLevels uses only real API**
```typescript
// In fetchLevels (lines 184-203):
// Remove fallback to INITIAL_LEVELS on error
// Just show error toast instead
```

- [x] **Step 5: Add proper loading state**
```typescript
// Initial load should show skeleton, not mock data
// isLoading from useLevels should drive UI
```

- [x] **Step 6: Test and verify**
- Run: `npm run build && npm run type-check`
- Verify levels page loads real data from `/api/v1/academic/levels`

---

### Task 3: Fix Master Data Subjects (DONE) (`admin/master-data/subjects/page.tsx`) - Remove INITIAL_SUBJECTS Fallback

**Files:**
- Modify: `frontend/app/(portal)/admin/master-data/subjects/page.tsx`

**Interfaces:**
- Consumes: `useSubjects`, `useLevels`, `useGrades` hooks
- Produces: Live subject data without fallback

- [x] **Step 1: Remove INITIAL_SUBJECTS constant**
```typescript
// DELETE lines 35-43:
const INITIAL_SUBJECTS: SubjectItem[] = [...]
```

- [x] **Step 2: Remove fallback state initialization**
```typescript
// REPLACE line 50:
const [subjects, setSubjects] = React.useState<SubjectItem[]>(INITIAL_SUBJECTS);
// WITH:
const [subjects, setSubjects] = React.useState<SubjectItem[]>([]);
```

- [x] **Step 3: Remove synced state logic**
```typescript
// REPLACE lines 56-76 (synced useEffect):
// Remove entire synced logic - just use apiSubjects directly
```

- [x] **Step 4: Simplify data mapping**
```typescript
// Use apiSubjects directly from useSubjects hook
// Remove INITIAL_SUBJECTS fallback entirely
```

- [x] **Step 5: Test and verify**
- Run: `npm run build && npm run type-check`
- Verify subjects page loads real data from `/api/v1/academic/subjects`

---

### Task 4: Fix Admin Dashboard (DONE) - Add Real Health/Logs API Endpoints

**Files:**
- Create: `backend/internal/admin/handler.go`
- Create: `backend/internal/admin/repository.go`
- Modify: `backend/cmd/api/main.go` (register admin routes)

**Interfaces:**
- Produces: `/api/v1/admin/health` and `/api/v1/admin/logs` endpoints

- [x] **Step 1: Create admin handler with health/logs endpoints**
```go
// backend/internal/admin/handler.go
func (h *Handler) GetHealth(c *fiber.Ctx) error {
    // Query DB for service health: postgres, redis, minio, etc.
}
func (h *Handler) GetLogs(c *fiber.Ctx) error {
    // Query audit_logs table for recent logs
}
```

- [x] **Step 2: Register admin routes**
```go
// In main.go:
admin := api.Group("/admin", middleware.RequireAuth, middleware.RequireRole("ADMIN"))
admin.Get("/health", adminHandler.GetHealth)
admin.Get("/logs", adminHandler.GetLogs)
```

- [x] **Step 3: Add frontend hooks**
```typescript
// lib/api.ts
export function useApiHealthCheck() { return useQuery({ queryKey: ['admin', 'health'], queryFn: () => apiFetch('/admin/health') }) }
export function useSystemLogs() { return useQuery({ queryKey: ['admin', 'logs'], queryFn: () => apiFetch('/admin/logs') }) }
```

- [x] **Step 4: Update admin dashboard to use real hooks**
- Replace mock state with `useApiHealthCheck` and `useSystemLogs`

- [x] **Step 6: Test and verify**
- Run: `go build ./... && go test ./internal/admin/...`
- Verify `/api/v1/admin/health` returns real DB health

---

### Task 5: Verify All Other Admin Pages (DONE) Use Real Data (Audit Pass)

**Files:**
- Review: All admin pages under `frontend/app/(portal)/admin/**/*.tsx`

**Interfaces:**
- Verify each page uses proper hooks, no mock constants

- [x] **Step 1: Audit each page for mock constants**
```bash
# Check for INITIAL_* constants
grep -r "INITIAL_" frontend/app/(portal)/admin/
```

- [x] **Step 2: Verify these pages use real hooks (already done):**
- [x] `admin/analytics/page.tsx` - uses `useAnalyticsOverview`, `useAnalytics` ✓
- [x] `admin/cbt/page.tsx` - uses `useExams`, `useCreateExam`, etc. ✓
- [x] `admin/materials/page.tsx` - uses `useMaterials`, `useSubjects`, etc. ✓
- [x] `admin/question-bank/page.tsx` - uses `useQuestions`, `useCreateQuestion`, etc. ✓
- [x] `admin/users/page.tsx` - uses `useUsers`, `apiFetch` ✓
- [x] `admin/schools/page.tsx` - uses `useSchools`, `useCreateSchool` ✓
- [x] `admin/subscriptions/page.tsx` - uses `useSubscriptionStats`, `useSubscriptionPlans` ✓
- [x] `admin/audit-logs/page.tsx` - uses `useAuditStats`, `useAuditLogs` ✓
- [x] `admin/ai-tutor/page.tsx` - uses `useAIStats`, `useAIConversations` ✓
- [x] `admin/content/page.tsx` - uses `useContents`, `useMedia` ✓
- [x] `admin/settings/page.tsx` - uses `apiClient.ai.getConfig` ✓
- [x] `admin/master-data/page.tsx` - uses `useLevels`, `useSubjects` ✓
- [x] `admin/master-data/chapters/page.tsx` - uses `useChapters` (mutation fixed) ✓
- [x] `admin/master-data/curriculums/page.tsx` - uses `useCurriculums` ✓
- [x] `admin/master-data/programs/page.tsx` - uses `usePrograms` (fallback removed) ✓
- [x] `admin/master-data/topics/page.tsx` - uses `useTopics`, `useChapters` ✓
- [x] `admin/master-data/levels/page.tsx` - uses `useLevels` (fallback removed) ✓
- [x] `admin/master-data/subjects/page.tsx` - uses `useSubjects` (fallback removed) ✓

- [x] **Step 3: Fix any remaining pages with mock data**
- Add proper hooks where missing

---

### Task 6: Create Missing Admin Health/Logs API (DONE)

**Files:**
- Create: `backend/internal/admin/handler.go`
- Create: `backend/internal/admin/repository.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- GET `/api/v1/admin/health` → `{ services: [{ name, status, latency, uptime }] }`
- GET `/api/v1/admin/logs` → `{ logs: [{ timestamp, level, module, message }] }`

- [x] **Step 1: Create repository**
```go
// backend/internal/admin/repository.go
type Repository struct { pool *pgxpool.Pool }
func (r *Repository) GetServiceHealth(ctx context.Context) ([]ServiceHealth, error)
func (r *Repository) GetSystemLogs(ctx context.Context, limit int) ([]SystemLog, error)
```

- [x] **Step 2: Create handler**
```go
// backend/internal/admin/handler.go
type Handler struct { repo *Repository }
func (h *Handler) GetHealth(c *fiber.Ctx) error
func (h *Handler) GetLogs(c *fiber.Ctx) error
func (h *Handler) RegisterRoutes(router fiber.Router)
```

- [x] **Step 3: Register in main.go**
```go
adminHandler := admin.NewHandler(repo)
adminHandler.RegisterRoutes(api)
```

- [x] **Step 4: Add to queryKeys and hooks**
```typescript
// lib/query-keys.ts
export const queryKeys = {
  admin: {
    health: () => ['admin', 'health'] as const,
    logs: () => ['admin', 'logs'] as const,
  }
}

// lib/api.ts
export function useApiHealthCheck() { return useQuery({ queryKey: queryKeys.admin.health(), queryFn: () => apiFetch('/admin/health') }) }
export function useSystemLogs() { return useQuery({ queryKey: queryKeys.admin.logs(), queryFn: () => apiFetch('/admin/logs') }) }
```

- [x] **Step 5: Test end-to-end**
- Start backend, call `/api/v1/admin/health` → verify real DB health

---

### Task 7: Final Verification & Cleanup

**Files:**
- All admin pages

**Interfaces:**
- Full test suite pass

- [x] **Step 1: Remove all INITIAL_* constants**
```bash
grep -r "INITIAL_" frontend/app/(portal)/admin/ --include="*.tsx"
# Should return no results
```

- [x] **Step 2: Run full test suite**
```bash
cd frontend && npm run type-check && npm test
cd backend && go test ./...
```
- Result: type-check exit 0, 29/29 frontend tests pass, `go test ./...` exit 0.

- [x] **Step 3: Build production**
```bash
cd frontend && npm run build
cd backend && go build ./cmd/api
```
- Result: both builds succeed.

- [x] **Step 4: Manual smoke test**
- Start both servers
- Visit each admin page
- Verify no mock data visible
- Verify loading states work
- Verify CRUD operations persist to DB

**Note (programs backend build):** The programs admin page consumed `/academic/programs` which **never existed** in the backend (no route, no table). Built it end-to-end:
- Migration `backend/migrations/037_academic_programs.up.sql`/`.down.sql` (auto-applied on server start)
- Repo/Service/Handler + routes in `backend/internal/academic/academic.go`
- Seed in `backend/cmd/reset_db/main.go`; live seed via API (3 programs)
- Verified full CRUD cycle via API: create → update → list → delete
- Programs page now uses `usePrograms` hook with no fallback

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-01-replace-mock-data-with-real-data.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
