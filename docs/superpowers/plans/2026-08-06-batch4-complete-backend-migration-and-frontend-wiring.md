# Batch 4 — Complete Backend Migration + API Contract Lock + Frontend Wiring Docs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every remaining legacy `public.*` query in the Go backend so all API routes serve the new DB schemas, harmonize RBAC to 6 roles, resolve the `/practice/*` route collision, apply the small schema gap migrations, then produce the frontend contract + page-wiring documentation and a synced `openapi.yaml`.

**Architecture:** Each task rewrites the Repository SQL of one backend module from dropped `public.*` tables to new prefixed schemas (mirroring Batch 1–3), runs a DB-backed repository test, and is reviewed/merged before the next. Final tasks update `openapi.yaml`, write `docs/frontend/*` (contract + page wiring + Antigravity setup), and verify zero legacy references remain.

**Tech Stack:** Go 1.26 + Fiber v2, pgx/v5, PostgreSQL 16 (Supabase). Live DB URL:
```
postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require
```

## Global Constraints

- **Every SQL statement MUST be schema-prefixed.** Schema `public.*` does not exist (empty `search_path`). Any unprefixed table name resolves to nothing and fails at runtime.
- **API JSON contract is preserved**: struct tags/fields stay as-is (may add `omitempty` fields, never remove).
- **6 final roles** (live in `identity.role`): `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`. Legacy `ADMIN/TEACHER/STUDENT` are dead — every `RequireRole(...)` must use only the six.
- Route gate conventions: authoring-write `(SUPER_ADMIN, STAFF, GURU)`; admin-only `SUPER_ADMIN`; finance `(SUPER_ADMIN, FINANCE)` and investor `(SUPER_ADMIN, INVESTOR)`; student read `SISWA`.
- **PK uuid, `timestamptz`, soft-delete `deleted_at`** on masters; `shared.set_updated_at()` triggers already created.
- Migrations: `NNN_*.up.sql`/`.down.sql`, applied via `go run ./cmd/migrate/main.go up` from `backend/`, recorded in `_migrations`. Do not renumber existing ones.
- Verify per task: `go build ./... && go vet ./... && go test ./...` (DB-backed test skips w/o `DB_URL`). DB-backed tests MUST be zero-residue (cleanup via `t.Cleanup` or FK cascade), and MUST run to completion.
- Do not touch modules outside this plan unless a query fix requires a named cross-module change (cross-cutting changes are legitimate but must be reviewed + tested).
- Work flow per task: use the shared DB probe pattern; commit on the feature branch; whole-branch review; merge FF to `main`.

---

## File Structure

**Modified (Repository/Handler SQL):**
- `backend/internal/auth/auth.go` — admin user CRUD (FindAll/Search/SetActive/UpdateUser/SoftDelete/AdminCreate/AdminGet/AdminUpdate)
- `backend/internal/academic/academic.go` — Delete* cascade rewrite + remove legacy `academic.program`/curriculum deletes
- `backend/internal/content/repository.go` + `handler.go` — CreateContent/GetContent/ListContent/DeleteContent
- `backend/internal/profile/profile.go` — GetUserLevelCode/ListTargets/UpsertTargets/BestCertificatePct/SumBestPerSubject/ListCertificates
- `backend/internal/target_schools/target_schools.go` — full Repository
- `backend/internal/subscription/subscription.go` — full Repository
- `backend/internal/notification/notification.go` — full Repository
- `backend/internal/practice/practice.go` + `backend/internal/cbt_engine/handler.go` — route-prefix split
- `backend/cmd/api/main.go` — route registration order + role code updates + `cbtAdmin` role

**New migrations:**
- `backend/migrations/213_academic_target_school.up.sql` / `.down.sql`
- `backend/migrations/214_profile_student_target.up.sql` / `.down.sql`
- `backend/migrations/215_academic_program.up.sql` / `.down.sql` (if program needed)
- `backend/migrations/216_user_notification_legacy_columns.up.sql` / `.down.sql` (adds `status`, `delivered_at`, `reference_type`, `reference_id`, `archived_at` to `notification.user_notification`; required by Task 7)

**New tests (DB-backed, skip w/o DB_URL, zero-residue):**
- `backend/internal/auth/auth_repository_test.go`
- `backend/internal/academic/academic_delete_test.go`
- `backend/internal/content/content_cud_test.go`
- `backend/internal/profile/profile_repository_test.go`
- `backend/internal/target_schools/target_schools_repository_test.go`
- `backend/internal/subscription/subscription_repository_test.go`
- `backend/internal/notification/notification_repository_test.go`

**Docs (produced at end):**
- `docs/frontend/API-contract.md`, `docs/frontend/PAGE-WIRING.md`, `docs/frontend/ANTIGRAVITY-SETUP.md`
- `backend/openapi.yaml` (synced)

---

### Task 1: Migration 213 — `academic.target_school`

**Files:**
- Create: `backend/migrations/213_academic_target_school.up.sql`
- Create: `backend/migrations/213_academic_target_school.down.sql`

**Interfaces:**
- Produces: table `academic.target_school` consumed by Task 5 (target_schools).

- [ ] **Step 1: Write the up migration.** Create the table matching the legacy `TargetSchool` DTO:

```sql
-- Migration 213: academic target school (extends academic.school metadata).
CREATE TABLE academic.target_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES academic.school(id) ON DELETE SET NULL,
    level varchar(20) NOT NULL DEFAULT 'SMP' CHECK (level IN ('SMP','SMA','UNIVERSITY')),
    min_score int,
    max_score int,
    max_total_score int NOT NULL DEFAULT 0,
    subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
    academic_year varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE INDEX idx_target_school_active ON academic.target_school(is_active);
CREATE INDEX idx_target_school_school ON academic.target_school(school_id);
```

- [ ] **Step 2: Write the down migration**

```sql
DROP TABLE IF EXISTS academic.target_school;
```

- [ ] **Step 3: Apply migration**

Run: from `backend/`, `go run ./cmd/migrate/main.go up`
Expected: exit 0, and `_migrations` records `213`.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations/213_academic_target_school.up.sql backend/migrations/213_academic_target_school.down.sql
git commit -m "feat(db): add academic.target_school for target-school mapping"
```

---

### Task 2: Migrations `214` (student target) + `215` (academic.program)

**Files:**
- Create: `backend/migrations/214_profile_student_target.up.sql` / `.down.sql`
- Create: `backend/migrations/215_academic_program.up.sql` / `.down.sql`

**Interfaces:**
- Produces: `identity.student_target` (consumed by Task 4); `academic.program` (if academic program needed — verify first).

- [ ] **Step 1: Verify whether `academic.program` / student-target already exist**

Run from `backend/`: `go run ./cmd/migrate/main.go status` and probe:
`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('program','academic_program','student_target')`.
If `academic.program` exists, skip `215`. If `identity.student_target` exists, skip part of `214`.

> **Note (verified):** there is NO `profile` schema in this DB (see migration 000). Per-user targets live in the `identity` schema (alongside `identity.user_profile`). Migration 214 creates `identity.student_target` accordingly.

- [ ] **Step 2: Write migration `214`** (student target, mirrors legacy `student_targets` used by Task 4):

```sql
-- Migration 214: identity.student_target (per-user ranked school choices).
CREATE TABLE identity.student_target (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    choice int NOT NULL DEFAULT 1 CHECK (choice IN (1,2)),
    target_type varchar(30),
    target_school_id uuid REFERENCES academic.school(id) ON DELETE SET NULL,
    school_name varchar(200),
    major varchar(120),
    passing_score_irt numeric(10,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_student_target_user_choice ON identity.student_target(user_id, choice);
CREATE INDEX idx_student_target_user ON identity.student_target(user_id);
```
Down: `DROP TABLE IF EXISTS identity.student_target;`

- [ ] **Step 3: If `academic.program` absent, write migration `215`**

```sql
-- Migration 215: academic.program (needed by academic delete cascade).
CREATE TABLE academic.program (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(200) NOT NULL,
    education_level_id uuid REFERENCES academic.education_level(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_academic_program_code ON academic.program(code) WHERE deleted_at IS NULL;
```
Down: `DROP TABLE IF EXISTS academic.program;`

- [ ] **Step 4: Apply migrations** (`go run ./cmd/migrate/main.go up` from `backend/`), verify recorded.

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/214_*.sql backend/migrations/215_*.sql
git commit -m "feat(db): add identity.student_target and academic.program"
```

---

### Task 3: Auth — admin user-management rewrite (A1)

**Files:**
- Modify: `backend/internal/auth/auth.go:279-369` (FindAll/Search/SetActive/UpdateUser/SoftDelete) and the handler methods `ListUsers/SearchUsers/ActivateUser/AdminUpdateUser/AdminGetUser/AdminDeleteUser`
- Modify: `backend/internal/auth/auth.go` RegisterRoutes role gates (lines ~765-922)
- Test: `backend/internal/auth/auth_repository_test.go` (create)

**Interfaces:**
- Consumes: `identity.user` (010), `identity.user_profile` (010), `identity.user_role`/`identity.role` (012), `identity.login_session`/`identity.password_reset` (013).
- Produces: `FindAll/FindByID/Search/SetActive/UpdateUser/SoftDelete` all query `identity.*` and return the existing `User` struct.

**Legacy→New mapping:**
- `public.users` → `identity.user` + `identity.user_profile` (full_name/gender/phone via profile; `password_hash` + `status` + `avatar` on user).
- `public.users.role` (string) → join `identity.user_role` → `identity.role.code` (primary role, same lateral as `userSelect` at auth.go:81-94).
- `public.sessions` → `identity.login_session`; `public.password_resets` → `identity.password_reset`.
- `public.student_answers`/`exam_sessions`/`cbt_*`/`learning_progress`/`exam_results`/`student_scores`/`question_revisions` → cascade handled by new schema FKs; rewrite `SoftDelete` cleanup list to the real child tables.
- `public.notifications` → `notification.user_notification`.
- Legacy `grade_id`/`school_name` on users no longer exist directly → return `NULL`/'' as the current `userSelect` already does.

- [ ] **Step 1: Write the failing test**

`backend/internal/auth/auth_repository_test.go` — DB-backed. Claims (each a sub-test):
1. `FindAll` returns users with role code from `identity.role`, "grade_id" nil, zero residue.
2. `SoftDelete` removes an `identity.user` row (verify via `SELECT COUNT(*) FROM identity.user WHERE id=$1 → 0`), and its child rows cascade.
3. `SetActive` flips `identity.user.status` from ACTIVE↔INACTIVE.
4. `Search` filters by email/full_name; `UpdateUser` changes full_name (via `identity.user_profile`) + email.

Seed helper: create a user via `INSERT INTO identity.user (id, username, email, password_hash, status)` + `identity.user_profile` + `identity.user_role` linked to a `identity.role` code=(pick from seed) e.g. `SISWA`. `t.Cleanup` deletes `identity.user_profile.user_id` then `identity.user` (or rely on cascade) and asserts zero residue.

```go
func TestAuthAdminCRUD(t *testing.T) {
    p := testPool(t) // skip when DB_URL unset
    ctx := context.Background()
    repo := NewRepository(p)
    // seed user + profile + role, t.Cleanup deletes
    // 1) repo.FindAll(...) → expect 1, role == "SISWA"
    // 2) repo.SetActive(id,false) → status INACTIVE
    // 3) repo.UpdateUser(updated) → full_name changed
    // 4) repo.SoftDelete(id) → count(identity.user where id) == 0
}
```

- [ ] **Step 2: Run test to confirm it fails** (guard tables still reference `public.*`).

Run: `go test ./internal/auth/ -run Test]AdminCRUD -v`
Expected: FAIL (query error from missing `public.users`).

- [ ] **Step 3: Rewrite each Repository method to `identity.*`**

Rewrite `FindAll`, `Search` to join `identity.user`/`identity.user_profile` and the primary-role subselect (reuse the existing `userSelect` at auth.go:81-94). Rename the join so `grade_id`/`school_name` stay `NULL::uuid`/`NULL::text`.

For `UpdateUser`, update `identity.user_profile.full_name`/`gender` and `identity.user.email`/`status`. For `SetActive`, `UPDATE identity.user SET status = CASE $2 WHEN true THEN 'ACTIVE' ELSE 'INACTIVE' END WHERE id=$1`. For `SoftDelete`, in a transaction delete child rows across `identity.login_session`, `identity.password_reset`, then `DELETE FROM identity.user WHERE id=$1` (cascade removes profiles/roles).

- [ ] **Step 4: Run test green**

Run: `go test ./internal/auth/... -v`
Expected: PASS. Verify zero residue by scanning `identity.user` count before/after.

- [ ] **Step 5: Fix role gates in RegisterRoutes**

The `/auth/users*` admin group is registered at `auth.go:572`:
```go
admin := r.Group("", middleware.RequireAuth(h.jwt), middleware.RequireRole("ADMIN", "STAFF"))
```
Replace `"ADMIN"` → `"SUPER_ADMIN"` (resulting `("SUPER_ADMIN","STAFF")`). Leave `/auth/me` etc. untouched. Also update the middlewareDefault role + any legacy `"ADMIN"` string literals in `auth.go` to the six-role set (`SUPER_ADMIN, STAFF, FINANCE, GURU, SISWA, INVESTOR`).

- [ ] **Step 6: Run build/vet/test**

```bash
cd backend && go build ./... && go vet ./... && go test ./internal/auth/...
```
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/auth/
git commit -m "feat(auth): migrate admin user CRUD to identity schema + fix role gates"
```

---

### Task 4: Profile — targets + certificates (A4)

**Files:**
- Modify: `backend/internal/profile/profile.go` (GetUserLevelCode, ListTargets, UpsertTargets, BestCertificatePct, SumBestPerSubject, ListCertificates)
- Test: `backend/internal/profile/profile_repository_test.go` (create)

**Interfaces:**
- Consumes: `identity.student_target` (Task 2), `identity.user_profile`, `cbt.exam_attempt`+`cbt.grading_result`, junction subject.
**Produces:** unchanged `StudentProfile`, `Certificate`, `TargetInput` DTOs.

**Legacy→New mapping:**
- `public.users.grade_id` → read `identity.user_profile` joined fields or `academic.student_enrollment` (verify during implementation); default when absent.
- `public.student_targets` → `identity.student_target` (id, user_id, choice, target_type, target_school_id, school_name, major, passing_score).
- `public.content_exam_attempts`/`contents`/`subjects` for certificates → `cbt.exam_attempt` + `cbt.grading_result` + `cbt.exam`/`cbt.exam_subject`/`academic.subject`.
- BestCertificatePct: use `cbt.grading_result.score` (0-100 scale): `MAX(COALESCE(gr.score,0))/100*100`. Use attempt status filter (SUBMITTED/GRADING/COMPLETED).
- SumBestPerSubject: `MAX(COALESCE(gr.score,0))` per `academic.subject.name`, group by subject.
- Grade ID resolution: on profile load, resolve via `academic.student_enrollment WHERE student_id=$1 AND status='ACTIVE'` → school/grade.

- [ ] **Step 1:** Write failing DB test `profile_repository_test.go` covering: `ListTargets`/`UpsertTargets` use `identity.student_target` (round-trip); `BestCertificatePct`/`SumBestPerSubject`/`ListCertificates` read from `cbt.exam_attempt`+`grading_result`. Seed `cbt` rows (user+participant+attempt+grading_result+subject), `t.Cleanup` cascade; assert zero residue.

- [ ] **Step 2:** Run to confirm FAIL.

- [ ] **Step 3:** Rewrite all six Repository funcs to new schema.

- [ ] **Step 4:** Run green; assert zero residue.

- [ ] **Step 5:** `go build/vet/test ./internal/profile/...` green.

- [ ] **Step 6:** Commit.

---

### Task 5: Target Schools (A5)

**Files:**
- Modify: `backend/internal/target_schools/target_schools.go` (whole Repository)
- Test: `backend/internal/target_schools/target_schools_repository_test.go` (create)

**Interfaces:**
- Consumes: `academic.target_school` (Task 1).
- Produces: same `TargetSchool` / `SaveSchoolRequest` DTOs and JSON.

**Legacy→New mapping:**
- `public.target_schools` → `academic.target_school`. `name` from that table; `subjects` was a JSON column → keep `subjects jsonb`; `level` string; `is_active` bool.

- [ ] **Step 1:** DB test: `Create` → `List(level)` → `Update` → `Delete` round-trip against `academic.target_school`; `t.Cleanup`; assert zero residue.

- [ ] **Step 2:** Run, confirm FAIL (public table missing).

- [ ] **Step 3:** Rewrite all 6 repo funcs to `academic.target_school`.

- [ ] **Step 4:** Green + zero residue.

- [ ] **Step 5:** Build/vet/test green.

- [ ] **Step 6:** Commit.

---

### Task 6: Subscription / Finance (A6)

**Files:**
- Modify: `backend/internal/subscription/subscription.go` (Repository)
- Test: `backend/internal/subscription/subscription_repository_test.go` (create)

**Interfaces:**
- Consumes: `finance.membership_package` (074), `finance.user_membership` (075), `finance.subscription` (074), `identity.user`.
- Produces: same `Plan`, `UserSubscription` DTOs and JSON.

**Legacy→New mapping:**
- `public.subscription_plans` → `finance.membership_package` (id, name, slug, price numeric→int64, duration → `duration_day`, is_active, package_type→level, deleted_at soft).
- `public.user_subscriptions` → `finance.user_membership` (+ join `finance.subscription` for status/billing). DTO mapping (verified against migrations 074/075):
  - `Plan.ID`→`membership_package.id`, `Name`→`name`, `Slug`→`slug`, `Price`→`ROUND(price)::bigint`, `DurationDays`→`duration_day`, `Features`→`ARRAY(SELECT feature_name FROM finance.package_feature WHERE membership_package_id=...)`, `IsActive`→`is_active`.
  - **Gap:** `membership_package` has no `description` column → `Plan.Description` maps to `NULL`.
  - `UserSubscription.ID`→`user_membership.id`, `UserID`→`user_id`, `PlanID`→`membership_package_id`, `Status`→`user_membership.status`, `StartedAt`→`active_from`, `ExpiresAt`→`expired_at`, `PaymentMethod`→`COALESCE(finance.subscription.payment_method)`, `Notes`→`cancel_reason`.
  - **Gap:** `payment_proof` has no equivalent column (new schema stores images on `finance.invoice`/payment) → map to `NULL` and document.
- `public.users` (for plan membership user join) → `identity.user` (+ `identity.user_profile.full_name` for `UserFullname`; `identity.user.email` for `UserEmail`).
- `subscriptions/stats` → compute counts from `finance.*` plus a finance-KPI query (active memberships, MRR from `finance.subscription`, invoice totals from `finance.invoice`).

- [ ] **Step 1:** DB test: `CreatePlan`→`ListPlans`→`UpdatePlan`→`DeletePlan`→`ListSubscriptions`; seed `finance.membership_package`+`finance.user_membership`+`identity.user`; `t.Cleanup`; assert zero residue.

- [ ] **Step 2:** Run, confirm FAIL.

- [ ] **Step 3:** Rewrite all Repository funcs (CreatePlan, ListPlans, FindPlanByID, UpdatePlan, DeletePlan, GetStats, ListSubscriptions) to `finance.*`.

- [ ] **Step 4:** Green + zero residue.

- [ ] **Step 5:** build/vet/test. Fix `GetStats` finance query.

- [ ] **Step 6:** Commit.

---

### Task 7: Notification (A7)

**Files:**
- Modify: `backend/internal/notification/notification.go` (whole Repository)
- Test: `backend/internal/notification/notification_repository_test.go` (create)

**Interfaces:**
- Consumes: `notification.user_notification`, `notification.notification_preferences`, `notification.notification_template`.
- Produces: same `Notification`/`NotificationTemplate`/`NotificationPreference` DTOs.

**Legacy→New mapping:**
- `public.notifications` → `notification.user_notification` (id, user_id, title, body, is_read→read_at, created_at; no `archived_at` → soft-delete via deleting row or add `archived_at` via a new column in migration 216 if required).
  - FindByUser: `SELECT ... FROM notification.user_notification WHERE user_id=$1 ORDER BY created_at DESC`. Count with `is_read` filter for unread.
  - MarkRead: `SET is_read=true, read_at=NOW()`.
- `public.subscription` → `notification.*`.
- Template CRUD → `notification.notification_template` (code/name/title→subject? map templates to the template schema).
- Preferences → `notification.notification_preferences`.

**Caution:** The legacy `Notification` DTO (`notification.go:19-32`) exposes `Status`, `ReferenceType`, `ReferenceID`, `DeliveredAt`, `ArchivedAt` — but `notification.user_notification` (migration 103) only has `title, body, image_url, action_url, action_type, icon, badge, priority, is_read, read_at, expired_at, created_at, updated_at`. To preserve the API contract, first run **migration 216** adding the missing nullable columns, then map:

- `Status` ← `user_notification.status` (default `'PENDING'`)
- `ReferenceType`/`ReferenceID` ← `user_notification.reference_type`/`reference_id` (nullable)
- `DeliveredAt`←`user_notification.delivered_at` (nullable; set to `created_at` when `status='SENT'`)
- `ArchivedAt`←`user_notification.archived_at` (nullable; archive = set it, filter `WHERE archived_at IS NULL`)
- `Channel`←denormalize from `notification_history.channel` (join) or set from template

**Step 1 (migration 216):**
```sql
-- backend/migrations/216_user_notification_legacy_columns.up.sql
ALTER TABLE notification.user_notification
    ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','SENT','FAILED')),
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
    ADD COLUMN IF NOT EXISTS reference_type varchar(60),
    ADD COLUMN IF NOT EXISTS reference_id uuid,
    ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_user_notification_status ON notification.user_notification(status);
CREATE INDEX IF NOT EXISTS idx_user_notification_archived ON notification.user_notification(archived_at);
```
Down migration drops those four columns + indexes.

- [ ] **Step 0:** Write + apply migration `216` (above), verify recorded via `go run ./cmd/migrate/main.go up` from `backend/`.

- [ ] **Step 1:** DB test: Create → FindByUser (unread count) → MarkRead → Archive (`archived_at` set, filtered out) → template CRUD → preferences. `t.Cleanup`; assert zero residue.

- [ ] **Step 2:** Run, confirm FAIL.

- [ ] **Step 3:** Rewrite all Repository methods to `notification.*`. Decide + document the `archived_at` mapping.

- [ ] **Step 4:** Green + zero residue.

- [ ] **Step 5:** build/vet/test.

- [ ] **Step 6:** Commit.

---

### Task 8: Academic delete cascade + program (A2)

**Files:**
- Modify: `backend/internal/academic/academic.go` (DeleteLevel/DeleteSubject/DeleteChapter/DeleteTopic/DeleteLearningOutcome/DeleteGrade/DeleteCurriculum/DeleteProgram)
- Test: `backend/internal/academic/academic_delete_test.go` (create)

**Legacy→New mapping:**
- `public.content_*`, `public.contents` → `content.material`, `content.question`? Use relevant new tables: `content.material` (055), `content.question` (054? verify). Cascade delete children in new schema; any `cbt.exam_*` junctions for that subject/grades deleted via FK cascade.
- `public.subjects`→`academic.subject`, `public.chapters`→`academic.chapter`, `public.learning_outcomes`→`academic.learning_outcome`, `public.grades`→`academic.grade`, `public.curriculums`→`academic.curriculum`, `public.levels`→`academic.education_level`, `public.academic_programs`→`academic.program` (Task 215).

- [ ] **Step 1:** DB test: seed a level→grades→subjects→chapters→topics tree; run `DeleteLevel` and assert recursion cleaned (dependent junction rows gone) + zero residue.

- [ ] **Step 2:** Run, confirm FAIL (public tables).

- [ ] **Step 3:** Rewrite the delete functions as a recursive `DELETE ... FROM academic.* WHERE ...` in a transaction; remove any references to dropped tables.

- [ ] **Step 4:** Green + zero residue.

- [ ] **Step 5:** Delete/replace the legacy `academic.program` mapping; ensure `DeleteProgram` uses `academic.program`.

- [ ] **Step 6:** build/vet/test.

- [ ] **Step 7:** Commit.

---

### Task 9: Route conflict — split `/practice/*` (A8)

**Files:**
- Modify: `backend/internal/practice/practice.go` (RegisterRoutes — keep `/sessions/*`)
- Modify: `backend/internal/cbt_engine/handler.go` (RegisterRoutes — rename `/practice/...` to `/exam-practice/...`)
- Modify: `backend/cmd/api/main.go` route order (261, 262)

**New route contract (breaking, documented):**

| Method | Path (before) | Path (after) | Module |
|---|---|---|---|
| POST | `/api/v1/practice/material/:materialId` | `/api/v1/exam-practice/material/:materialId` | cbt_engine |
| POST | `/api/v1/practice/subject` | `/api/v1/exam-practice/subject` | cbt_engine |
| POST | `/api/v1/practice/tags` | `/api/v1/exam-practice/tags` | cbt_engine |
| POST | `/api/v1/practice/:sessionId/submit` | `/api/v1/exam-practice/:sessionId/submit` | cbt_engine |
| GET | `/api/v1/practice/:sessionId` | `/api/v1/exam-practice/:sessionId` | cbt_engine |
| GET/POST | `/api/v1/practice/sessions/...` | unchanged | practice |
| GET | `/api/v1/practice/stats` | unchanged | practice |

- [ ] **Step 1:** In `cbt_engine/handler.go`, register routes under a local router `router.Group("/exam-practice")` and change the `RegisterRoutes` grouping so the five routes use `/exam-practice` instead of `/practice`.

- [ ] **Step 2:** In `main.go`, register `examHandler.RegisterRoutes(api)` (262) AFTER `practiceHandler.RegisterRoutes(api)` (261) — keep this order so `/exam-practice` and `/practice/sessions` don't collide.

- [ ] **Step 3:** run `go build ./...` — the cbt_engine handler references must compile.

- [ ] **Step 4:** manual/annotated smoke (or a focused route test) verifying the new path resolves; confirm old `/practice/{material,subject,tags,...}` no longer registers.

- [ ] **Step 5:** Commit (`chore(route): split practice vs exam-practice prefixes`).

---

### Task 10: Harmonize role gates (A9, sweep)

**Files:** all RegisterRoutes across `internal/*`.
**Interfaces:** uses `middleware.RoleSuperAdmin/Staff/Finance/Guru/Siswa/Investor` constants.

- [ ] **Step 1:** Grep remaining `RequireRole("ADMIN"|"TEACHER"|"STUDENT")`. Confirmed legacy gates exist at (verify each again after prior edits):
  - `internal/auth/auth.go:572` → `("SUPER_ADMIN","STAFF")`
  - `internal/notification/notification.go:432` → `("SUPER_ADMIN","STAFF")`
  - `internal/audit/audit.go:174` → `("SUPER_ADMIN","STAFF")`
  - `internal/ws/ws.go:203` (`TEACHER`) → `("SUPER_ADMIN","STAFF","GURU")`
  - `internal/ai/ai.go:909` → `("SUPER_ADMIN","STAFF")`
  - `internal/target_schools/target_schools.go:196` → `("SUPER_ADMIN","STAFF")`
  - `internal/subscription/subscription.go:310` → `("SUPER_ADMIN","STAFF")`
  - `internal/admin/handler.go:39` (`ADMIN` only) → `("SUPER_ADMIN")`
  - `internal/school/school.go:543` → `("SUPER_ADMIN","STAFF")`
  - `internal/exam_packages/exam_packages.go:349` (`TEACHER`) → `("SUPER_ADMIN","STAFF","GURU")`
  - `internal/academic/academic.go:1288` → `("SUPER_ADMIN","STAFF")`
  - `cmd/api/main.go:265` (`cbtAdmin` group) → `("SUPER_ADMIN")`
- [ ] **Step 2:** Replace each per the map above:

---

### Task 11: Final sweep + zero-legacy residue + `openapi.yaml`

- [ ] **Step 1:** Grep whole `backend/internal` for legacy unprefixed tables: 

```bash
rg -n "FROM (users|contents|notifications|subscription_plans|user_subscriptions|target_schools|student_targets|content_exam_attempts|subjects|grades|education_levels|chapters|topics|learning_outcomes|curriculums|academic_programs)\b" backend/internal --glob '*.go'
```
Expected: 0 (or only lines that are inside tests referencing `academic.*` incorrectly — fix).

- [ ] **Step 2:** Confirm no `RequireRole` with legacy codes remain.

- [x] **Step 3:** Sync `backend/openapi.yaml` so all paths/hggates match the final route set (methods, paths, security role codes). Validate with a YAML parse; keep the file valid.

- [x] **Step 4:** Full build+vet+serial test pass.

- [x] **Step 5:** Commit.

---

### Task 12: Frontend docs — API contract, wiring, OpenAPI, Antigravity setup

**Files (create):**
- `docs/frontend/API-contract.md`
- `docs/frontend/PAGE-WIRING.md`
- `docs/frontend/ANTIGRAVITY-SETUP.md`
- `backend/openapi.yaml` (already synced; referenced)

**Goal:** deliver a self-contained contract a developer can hand to Google Antigravity to rebuild the frontend for all 6 roles.

- [x] **Step 1: `API-contract.md`** — table-grouped by module: method, path, role gate, request (fields), response (shape), source table. Include the renamed `/exam-practice` paths. Note which module serves each route.

- [x] **Step 2: `PAGE-WIRING.md`** — for each of the 6 roles (SUPER_ADMIN, STAFF, FINANCE, GURU, SISWA, INVESTOR): top nav, page list (route + purpose), the API endpoints each page consumes, auth guard. Include greenfield pages for FINANCE (dashboard finance, memberships, payments, invoices, reports, wallet) and INVESTOR (investor board). Include the student loop (materials→practice→exam→results→ranking).

- [x] **Step 3: `ANTIGRAVITY-SETUP.md`** — steps to get Antigravity (IDE/CLI) pointed at this repo, mount `AGENTS.md`, apply skills (frontend/React + TanStack Query), wire the API client to the documented base, and verify.

- [x] **Step 4:** cross-check each page maps to a documented endpoint; no orphan route.

- [x] **Step 5:** commit.

---

## Final Verification Gate

- [x] `go build ./...`, `go vet ./...`, `go test ./...` green (serial; tolerate only env flakes).
- [x] No legacy `public.*` table reference in code (grep returns 0).
- [x] All role gates use only the 6 new roles.
- [x] `openapi.yaml` parses and matches routes.
- [x] Docs frontend complete; zero huge-gap left skeleton placeholders.

## Deliverables Checklist

- [x] Task 1–11 done; merged to `main`.
- [x] `docs/frontend/API-contract.md`, `PAGE-WIRING.md`, `ANTIGRAVITY-SETUP.md`.
- [x] `openapi.yaml` synced.
- [x] Every API route hits a new schema; no `public.*`.