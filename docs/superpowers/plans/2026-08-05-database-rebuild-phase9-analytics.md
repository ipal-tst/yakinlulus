# Database Rebuild Phase 9 Implementation Plan (Analytics)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `analytics` (event store & snapshot) — 20 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.9, menggantikan `analytics_*`/`statistik_*` legacy. Phase 9 berjalan **paralel** di worktree `yl-phase-9` (branch `phase-9`), rentang migrasi `092–099` per runbook §2.

**Architecture:** Mekanisme per design doc §4.9: append-only event store → background worker → snapshot harian → dashboard cache & KPI/report/leaderboard/rekomendasi AI. `analytics_events`/`analytics_session` menangkap event mentah; tabel `analytics_*_daily`/snapshot menyimpan agregat harian per entitas; `analytics_dashboard_cache`/`kpi`/`report`/`leaderboard`/`ai_recommendation`/`retention`/`funnel` melengkapi domain.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up` dari `backend/`, verifikasi via throwaway Go program (pgx/v5) di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_p9\main.go`.

**Files target:** `backend/migrations/092_analytics_event_store.{up,down}.sql` s.d. `099_analytics_insight.{up,down}.sql` (8 pasang file).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` hanya pada tabel mutable + trigger `shared.set_updated_at()`.
- Enum: `text`/`varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Uang `numeric(12,2)`, persen/rating `numeric(5,2)`, count `int`.
- JSONB untuk payload/metadata.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- Migrasi harus `up` bersih, dibungkus transaksi (runner sudah tx per file). Jangan sentuh kode Go runner.
- **Deviasi minor (dicatat):**
  1. **Tidak ada partisi fisik** — design §4.9 menyebut "Partisi bulanan/tahunan" untuk `analytics_events`, `analytics_exam`, `analytics_question`, `analytics_material`, `analytics_session`, `analytics_finance`, `analytics_daily_summary`, tetapi konsisten dengan semua fase sebelumnya (`NO physical partitioning`); strategi partisi ditunda. Kolom `event_time`/`date` tetap diindeks.
  2. **§5 Cross-Domain Reference Rules:** `analytics` membaca dari `cbt`/`question`/`content`/`finance` — **event-driven, TANPA FK langsung yang membuat kunci**. Karena itu SEMUA kolom referensi lintas-entitas non-user (`student_id`, `teacher_id`, `school_id`, `membership_id`, `exam_id`, `attempt_id`, `question_id`, `material_id`, `chapter_id`, `subject_id`, `class_id`) dibuat `uuid` TANPA FK. **HANYA** `user_id` (dan `generated_by` di `analytics_report`) memakai FK ke `identity.user` (pusat identitas, tidak membuat siklus).
  3. **Append-only (tanpa `updated_at`):** `analytics_events`, `analytics_exam`, `analytics_question`, `analytics_material`, `analytics_session`, `analytics_finance`, `analytics_daily_summary`. Tabel snapshot lainnya mutable → `updated_at` + trigger.
  4. Tabel agregat harian memakai `UNIQUE (date, <entity>_id)` (satu snapshot per entitas per hari) sebagai kunci snapshot.

---

## Task 9A: Event Store — analytics_events, analytics_session

**Files:**
- Create: `backend/migrations/092_analytics_event_store.up.sql`
- Create: `backend/migrations/092_analytics_event_store.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001), `identity.user`.
- Produces: `analytics.analytics_events`, `analytics.analytics_session` (append-only).

- [ ] **Step 1: Tulis `092_analytics_event_store.up.sql`**

```sql
-- Migration 092: analytics event store & session (append-only).

CREATE TABLE analytics.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time timestamptz NOT NULL DEFAULT NOW(),
    event_type varchar(30) NOT NULL,
    event_name varchar(120) NOT NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    student_id uuid,
    teacher_id uuid,
    school_id uuid,
    membership_id uuid,
    exam_id uuid,
    attempt_id uuid,
    question_id uuid,
    material_id uuid,
    chapter_id uuid,
    subject_id uuid,
    class_id uuid,
    device varchar(120),
    browser varchar(120),
    platform varchar(50),
    os varchar(50),
    app_version varchar(30),
    ip_address varchar(45),
    country varchar(100),
    province varchar(100),
    city varchar(100),
    latitude numeric(10,7),
    longitude numeric(10,7),
    session_id varchar(100),
    duration_second int,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
-- Kolom student_id/teacher_id/school_id/membership_id/exam_id/attempt_id/question_id/
-- material_id/chapter_id/subject_id/class_id: uuid TANPA FK (event-driven, per 5).
CREATE INDEX idx_analytics_events_time ON analytics.analytics_events(event_time);
CREATE INDEX idx_analytics_events_type ON analytics.analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics.analytics_events(session_id);
CREATE INDEX idx_analytics_events_exam ON analytics.analytics_events(exam_id);
CREATE INDEX idx_analytics_events_question ON analytics.analytics_events(question_id);
CREATE INDEX idx_analytics_events_material ON analytics.analytics_events(material_id);
CREATE INDEX idx_analytics_events_subject ON analytics.analytics_events(subject_id);
CREATE INDEX idx_analytics_events_event ON analytics.analytics_events(event_type, event_time);

CREATE TABLE analytics.analytics_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id varchar(100) NOT NULL,
    student_id uuid,
    login_time timestamptz NOT NULL DEFAULT NOW(),
    logout_time timestamptz,
    duration int,
    device varchar(120),
    platform varchar(50),
    browser varchar(120),
    ip varchar(45),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_analytics_session_id ON analytics.analytics_session(session_id);
CREATE INDEX idx_analytics_session_student ON analytics.analytics_session(student_id);
CREATE INDEX idx_analytics_session_login ON analytics.analytics_session(login_time);
```

- [ ] **Step 2: Tulis `092_analytics_event_store.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_session;
DROP TABLE IF EXISTS analytics.analytics_events;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: applied 092; `All migrations applied total=72`.

Kemudian via `verify_p9/main.go` (`$env:PSCHEMA='analytics'`, `$env:PEXPECT='2'`):
`SELECT count(*) FROM information_schema.tables WHERE table_schema='analytics';` → **2**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics event store & session (phase 9)"
```

---

## Task 9B: Snapshot User — analytics_student, analytics_teacher

**Files:**
- Create: `backend/migrations/093_analytics_user_daily.up.sql`
- Create: `backend/migrations/093_analytics_user_daily.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001).
- Produces: `analytics.analytics_student`, `analytics.analytics_teacher`.

- [ ] **Step 1: Tulis `093_analytics_user_daily.up.sql`**

```sql
-- Migration 093: daily student & teacher analytics snapshot.

CREATE TABLE analytics.analytics_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    date date NOT NULL,
    total_login int NOT NULL DEFAULT 0,
    total_learning_time int NOT NULL DEFAULT 0,
    total_exam int NOT NULL DEFAULT 0,
    total_question int NOT NULL DEFAULT 0,
    correct_answer int NOT NULL DEFAULT 0,
    wrong_answer int NOT NULL DEFAULT 0,
    empty_answer int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    lowest_score numeric(5,2) NOT NULL DEFAULT 0,
    mastery_percentage numeric(5,2) NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    speed_answer int NOT NULL DEFAULT 0,
    streak_day int NOT NULL DEFAULT 0,
    xp int NOT NULL DEFAULT 0,
    level int NOT NULL DEFAULT 1,
    ranking int,
    coins int NOT NULL DEFAULT 0,
    badge int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, student_id)
);
CREATE INDEX idx_analytics_student_student ON analytics.analytics_student(student_id);
CREATE INDEX idx_analytics_student_date ON analytics.analytics_student(date);
CREATE TRIGGER trg_analytics_student_updated BEFORE UPDATE ON analytics.analytics_student
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_teacher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL,
    date date NOT NULL,
    total_student int NOT NULL DEFAULT 0,
    active_student int NOT NULL DEFAULT 0,
    total_exam_created int NOT NULL DEFAULT 0,
    total_exam_approved int NOT NULL DEFAULT 0,
    total_question_created int NOT NULL DEFAULT 0,
    total_material_created int NOT NULL DEFAULT 0,
    average_student_score numeric(5,2) NOT NULL DEFAULT 0,
    average_completion numeric(5,2) NOT NULL DEFAULT 0,
    average_learning_time int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, teacher_id)
);
CREATE INDEX idx_analytics_teacher_teacher ON analytics.analytics_teacher(teacher_id);
CREATE INDEX idx_analytics_teacher_date ON analytics.analytics_teacher(date);
CREATE TRIGGER trg_analytics_teacher_updated BEFORE UPDATE ON analytics.analytics_teacher
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- teacher_id: uuid TANPA FK (event-driven, per 5).
```

- [ ] **Step 2: Tulis `093_analytics_user_daily.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_teacher;
DROP TABLE IF EXISTS analytics.analytics_student;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 093; `All migrations applied total=73`.
`analytics` tables → **4**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics student/teacher daily snapshot (phase 9)"
```

---

## Task 9C: Snapshot Akademik — analytics_school, analytics_subject, analytics_chapter

**Files:**
- Create: `backend/migrations/094_analytics_academic_daily.up.sql`
- Create: `backend/migrations/094_analytics_academic_daily.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001).
- Produces: `analytics.analytics_school`, `analytics.analytics_subject`, `analytics.analytics_chapter`.

- [ ] **Step 1: Tulis `094_analytics_academic_daily.up.sql`**

```sql
-- Migration 094: daily school/subject/chapter analytics snapshot.

CREATE TABLE analytics.analytics_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL,
    date date NOT NULL,
    active_student int NOT NULL DEFAULT 0,
    active_teacher int NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    learning_hour int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    average_completion numeric(5,2) NOT NULL DEFAULT 0,
    ranking int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, school_id)
);
CREATE INDEX idx_analytics_school_school ON analytics.analytics_school(school_id);
CREATE INDEX idx_analytics_school_date ON analytics.analytics_school(date);
CREATE TRIGGER trg_analytics_school_updated BEFORE UPDATE ON analytics.analytics_school
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- school_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid NOT NULL,
    date date NOT NULL,
    student int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    average_accuracy numeric(5,2) NOT NULL DEFAULT 0,
    average_speed int NOT NULL DEFAULT 0,
    completion numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, subject_id)
);
CREATE INDEX idx_analytics_subject_subject ON analytics.analytics_subject(subject_id);
CREATE INDEX idx_analytics_subject_date ON analytics.analytics_subject(date);
CREATE TRIGGER trg_analytics_subject_updated BEFORE UPDATE ON analytics.analytics_subject
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- subject_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_chapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid NOT NULL,
    date date NOT NULL,
    view int NOT NULL DEFAULT 0,
    exercise int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    mastery numeric(5,2) NOT NULL DEFAULT 0,
    weakness jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, chapter_id)
);
CREATE INDEX idx_analytics_chapter_chapter ON analytics.analytics_chapter(chapter_id);
CREATE INDEX idx_analytics_chapter_date ON analytics.analytics_chapter(date);
CREATE TRIGGER trg_analytics_chapter_updated BEFORE UPDATE ON analytics.analytics_chapter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- chapter_id: uuid TANPA FK (event-driven, per 5).
```

- [ ] **Step 2: Tulis `094_analytics_academic_daily.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_chapter;
DROP TABLE IF EXISTS analytics.analytics_subject;
DROP TABLE IF EXISTS analytics.analytics_school;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 094; `All migrations applied total=74`.
`analytics` tables → **7**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics school/subject/chapter daily snapshot (phase 9)"
```

---

## Task 9D: Snapshot Exam & Question — analytics_exam, analytics_question

**Files:**
- Create: `backend/migrations/095_analytics_exam_question.up.sql`
- Create: `backend/migrations/095_analytics_exam_question.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000).
- Produces: `analytics.analytics_exam`, `analytics.analytics_question` (append-only).

- [ ] **Step 1: Tulis `095_analytics_exam_question.up.sql`**

```sql
-- Migration 095: daily exam & question analytics (append-only).

CREATE TABLE analytics.analytics_exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL,
    date date NOT NULL,
    participant int NOT NULL DEFAULT 0,
    finished int NOT NULL DEFAULT 0,
    unfinished int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    lowest_score numeric(5,2) NOT NULL DEFAULT 0,
    pass_rate numeric(5,2) NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    average_correct numeric(5,2) NOT NULL DEFAULT 0,
    average_wrong numeric(5,2) NOT NULL DEFAULT 0,
    average_blank numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, exam_id)
);
CREATE INDEX idx_analytics_exam_exam ON analytics.analytics_exam(exam_id);
CREATE INDEX idx_analytics_exam_date ON analytics.analytics_exam(date);
-- exam_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL,
    date date NOT NULL,
    shown int NOT NULL DEFAULT 0,
    answered int NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    difficulty_index numeric(5,2) NOT NULL DEFAULT 0,
    discrimination_index numeric(5,2) NOT NULL DEFAULT 0,
    reliability numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, question_id)
);
CREATE INDEX idx_analytics_question_question ON analytics.analytics_question(question_id);
CREATE INDEX idx_analytics_question_date ON analytics.analytics_question(date);
-- question_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.
```

- [ ] **Step 2: Tulis `095_analytics_exam_question.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_question;
DROP TABLE IF EXISTS analytics.analytics_exam;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 095; `All migrations applied total=75`.
`analytics` tables → **9**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics exam/question daily snapshot (phase 9)"
```

---

## Task 9E: Snapshot Material & Membership — analytics_material, analytics_membership

**Files:**
- Create: `backend/migrations/096_analytics_material_membership.up.sql`
- Create: `backend/migrations/096_analytics_material_membership.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001).
- Produces: `analytics.analytics_material` (append-only), `analytics.analytics_membership`.

- [ ] **Step 1: Tulis `096_analytics_material_membership.up.sql`**

```sql
-- Migration 096: daily material (append-only) & membership analytics.

CREATE TABLE analytics.analytics_material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL,
    date date NOT NULL,
    view int NOT NULL DEFAULT 0,
    completed int NOT NULL DEFAULT 0,
    download int NOT NULL DEFAULT 0,
    bookmark int NOT NULL DEFAULT 0,
    share int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    completion_rate numeric(5,2) NOT NULL DEFAULT 0,
    drop_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, material_id)
);
CREATE INDEX idx_analytics_material_material ON analytics.analytics_material(material_id);
CREATE INDEX idx_analytics_material_date ON analytics.analytics_material(date);
-- material_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_package_id uuid NOT NULL,
    date date NOT NULL,
    new_user int NOT NULL DEFAULT 0,
    renewal int NOT NULL DEFAULT 0,
    expired int NOT NULL DEFAULT 0,
    cancel int NOT NULL DEFAULT 0,
    active int NOT NULL DEFAULT 0,
    conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, membership_package_id)
);
CREATE INDEX idx_analytics_membership_pkg ON analytics.analytics_membership(membership_package_id);
CREATE INDEX idx_analytics_membership_date ON analytics.analytics_membership(date);
CREATE TRIGGER trg_analytics_membership_updated BEFORE UPDATE ON analytics.analytics_membership
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- membership_package_id: uuid TANPA FK (event-driven, per 5).
```

- [ ] **Step 2: Tulis `096_analytics_material_membership.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_membership;
DROP TABLE IF EXISTS analytics.analytics_material;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 096; `All migrations applied total=76`.
`analytics` tables → **11**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics material/membership daily snapshot (phase 9)"
```

---

## Task 9F: Snapshot Finance & Ringkasan — analytics_finance, analytics_daily_summary

**Files:**
- Create: `backend/migrations/097_analytics_finance_summary.up.sql`
- Create: `backend/migrations/097_analytics_finance_summary.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000).
- Produces: `analytics.analytics_finance`, `analytics.analytics_daily_summary` (append-only).

- [ ] **Step 1: Tulis `097_analytics_finance_summary.up.sql`**

```sql
-- Migration 097: finance & daily summary analytics (append-only).

CREATE TABLE analytics.analytics_finance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    transaction int NOT NULL DEFAULT 0,
    refund int NOT NULL DEFAULT 0,
    failed_payment int NOT NULL DEFAULT 0,
    average_transaction numeric(12,2) NOT NULL DEFAULT 0,
    arpu numeric(12,2) NOT NULL DEFAULT 0,
    ltv numeric(12,2) NOT NULL DEFAULT 0,
    mrr numeric(12,2) NOT NULL DEFAULT 0,
    arr numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_finance_date ON analytics.analytics_finance(date);
-- Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_daily_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    new_user int NOT NULL DEFAULT 0,
    active_user int NOT NULL DEFAULT 0,
    new_student int NOT NULL DEFAULT 0,
    new_teacher int NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    question_answered int NOT NULL DEFAULT 0,
    material_view int NOT NULL DEFAULT 0,
    membership_purchase int NOT NULL DEFAULT 0,
    income numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_daily_summary_date ON analytics.analytics_daily_summary(date);
-- Append-only, tanpa updated_at.
```

- [ ] **Step 2: Tulis `097_analytics_finance_summary.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_daily_summary;
DROP TABLE IF EXISTS analytics.analytics_finance;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 097; `All migrations applied total=77`.
`analytics` tables → **13**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics finance & daily summary (phase 9)"
```

---

## Task 9G: Cache, KPI, Report, Leaderboard

**Files:**
- Create: `backend/migrations/098_analytics_dashboard.up.sql`
- Create: `backend/migrations/098_analytics_dashboard.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001), `identity.user`.
- Produces: `analytics.analytics_dashboard_cache`, `analytics.analytics_kpi`, `analytics.analytics_report`, `analytics.analytics_leaderboard`.

- [ ] **Step 1: Tulis `098_analytics_dashboard.up.sql`**

```sql
-- Migration 098: dashboard cache, kpi, report, leaderboard.

CREATE TABLE analytics.analytics_dashboard_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_type varchar(30) NOT NULL,
    owner_type varchar(30),
    owner_id uuid,
    cache_key varchar(120) NOT NULL,
    cache_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (dashboard_type, owner_type, owner_id, cache_key)
);
CREATE INDEX idx_analytics_dashboard_cache_key ON analytics.analytics_dashboard_cache(cache_key);
CREATE INDEX idx_analytics_dashboard_cache_owner ON analytics.analytics_dashboard_cache(owner_type, owner_id);
CREATE TRIGGER trg_analytics_dashboard_cache_updated BEFORE UPDATE ON analytics.analytics_dashboard_cache
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_kpi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name varchar(120) NOT NULL,
    period varchar(30) NOT NULL,
    value numeric(12,2) NOT NULL DEFAULT 0,
    target numeric(12,2) NOT NULL DEFAULT 0,
    achievement numeric(5,2) NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ON_TRACK','BEHIND','ACHIEVED','MISSED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_kpi_name ON analytics.analytics_kpi(kpi_name);
CREATE INDEX idx_analytics_kpi_period ON analytics.analytics_kpi(period);
CREATE INDEX idx_analytics_kpi_status ON analytics.analytics_kpi(status);
CREATE TRIGGER trg_analytics_kpi_updated BEFORE UPDATE ON analytics.analytics_kpi
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name varchar(200) NOT NULL,
    report_type varchar(30) NOT NULL,
    period_start date,
    period_end date,
    generated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    file_url text,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','GENERATING','READY','FAILED','ARCHIVED')),
    generated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_report_type ON analytics.analytics_report(report_type);
CREATE INDEX idx_analytics_report_status ON analytics.analytics_report(status);
CREATE INDEX idx_analytics_report_generated ON analytics.analytics_report(generated_at);
CREATE INDEX idx_analytics_report_by ON analytics.analytics_report(generated_by);
CREATE TRIGGER trg_analytics_report_updated BEFORE UPDATE ON analytics.analytics_report
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_leaderboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(30) NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid,
    class_id uuid,
    subject_id uuid,
    score numeric(12,2) NOT NULL DEFAULT 0,
    xp int NOT NULL DEFAULT 0,
    ranking int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period, student_id, subject_id)
);
CREATE INDEX idx_analytics_leaderboard_period ON analytics.analytics_leaderboard(period, ranking);
CREATE INDEX idx_analytics_leaderboard_student ON analytics.analytics_leaderboard(student_id);
CREATE INDEX idx_analytics_leaderboard_subject ON analytics.analytics_leaderboard(subject_id);
CREATE TRIGGER trg_analytics_leaderboard_updated BEFORE UPDATE ON analytics.analytics_leaderboard
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id/school_id/class_id/subject_id: uuid TANPA FK (event-driven, per 5).
```

- [ ] **Step 2: Tulis `098_analytics_dashboard.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_leaderboard;
DROP TABLE IF EXISTS analytics.analytics_report;
DROP TABLE IF EXISTS analytics.analytics_kpi;
DROP TABLE IF EXISTS analytics.analytics_dashboard_cache;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 098; `All migrations applied total=78`.
`analytics` tables → **17**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics dashboard cache/kpi/report/leaderboard (phase 9)"
```

---

## Task 9H: AI Recommendation, Retention, Funnel

**Files:**
- Create: `backend/migrations/099_analytics_insight.up.sql`
- Create: `backend/migrations/099_analytics_insight.down.sql`

**Interfaces:**
- Consumes: schema `analytics` (000), `shared.set_updated_at()` (001).
- Produces: `analytics.analytics_ai_recommendation`, `analytics.analytics_retention`, `analytics.analytics_funnel`.

- [ ] **Step 1: Tulis `099_analytics_insight.up.sql`**

```sql
-- Migration 099: ai recommendation, retention cohort, funnel.

CREATE TABLE analytics.analytics_ai_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    subject_id uuid,
    chapter_id uuid,
    recommended_material uuid[],
    recommended_question_set uuid[],
    confidence_score numeric(5,2) NOT NULL DEFAULT 0,
    reason text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_ai_rec_student ON analytics.analytics_ai_recommendation(student_id);
CREATE INDEX idx_analytics_ai_rec_subject ON analytics.analytics_ai_recommendation(subject_id);
CREATE TRIGGER trg_analytics_ai_rec_updated BEFORE UPDATE ON analytics.analytics_ai_recommendation
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id/subject_id/chapter_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_retention (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    day1 numeric(5,2) NOT NULL DEFAULT 0,
    day7 numeric(5,2) NOT NULL DEFAULT 0,
    day14 numeric(5,2) NOT NULL DEFAULT 0,
    day30 numeric(5,2) NOT NULL DEFAULT 0,
    day60 numeric(5,2) NOT NULL DEFAULT 0,
    day90 numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_analytics_retention_updated BEFORE UPDATE ON analytics.analytics_retention
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_funnel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    visitor int NOT NULL DEFAULT 0,
    register int NOT NULL DEFAULT 0,
    verification int NOT NULL DEFAULT 0,
    membership_trial int NOT NULL DEFAULT 0,
    membership_paid int NOT NULL DEFAULT 0,
    active_student int NOT NULL DEFAULT 0,
    conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_funnel_date ON analytics.analytics_funnel(date);
CREATE TRIGGER trg_analytics_funnel_updated BEFORE UPDATE ON analytics.analytics_funnel
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `099_analytics_insight.down.sql`**

```sql
DROP TABLE IF EXISTS analytics.analytics_funnel;
DROP TABLE IF EXISTS analytics.analytics_retention;
DROP TABLE IF EXISTS analytics.analytics_ai_recommendation;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 099; `All migrations applied total=79`.
`analytics` tables → **20** ✓ (menyelesaikan domain analytics)

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): analytics ai recommendation/retention/funnel (phase 9) - completes analytics domain (20 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 9 (Analytics, 20 tabel) terpenuhi: 8 file migrasi (092–099), 20 tabel sesuai §4.9 katalog. Daftar 1:1 — analytics_events, analytics_student, analytics_teacher, analytics_school, analytics_exam, analytics_question, analytics_material, analytics_subject, analytics_chapter, analytics_membership, analytics_finance, analytics_daily_summary, analytics_dashboard_cache, analytics_kpi, analytics_report, analytics_leaderboard, analytics_ai_recommendation, analytics_retention, analytics_session, analytics_funnel = 20.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, CHECK enum, indeks FK/komposit/unik, `numeric(12,2)` untuk uang, `numeric(5,2)` untuk persen, `int` untuk count). Semua kolom referensi lintas-entitas non-user (`student_id`, `teacher_id`, `school_id`, `membership_id`, `exam_id`, `attempt_id`, `question_id`, `material_id`, `chapter_id`, `subject_id`, `class_id`, `membership_package_id`) dibuat `uuid` tanpa FK — konsisten dengan §5 (event-driven, TANPA FK yang membuat kunci). Hanya `user_id` dan `generated_by` (`analytics_report`) yang ber-FK ke `identity.user`.

**Append-only:** `analytics_events`, `analytics_exam`, `analytics_question`, `analytics_material`, `analytics_session`, `analytics_finance`, `analytics_daily_summary` tanpa `updated_at`/trigger. Tabel snapshot mutable memakai `updated_at` + trigger `shared.set_updated_at()`.

**Cacat design yang dihindari:** tidak ada partisi fisik (ditunda, konsisten fase 0–8); tidak ada FK ke cbt/question/content/finance yang menciptakan kunci; snapshot harian memakai `UNIQUE (date, <entity>_id)` untuk mencegah duplikat agregasi; `analytics_finance`/`analytics_daily_summary`/`analytics_retention`/`analytics_funnel` memakai `date UNIQUE`.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-05-database-rebuild-phase9-analytics.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
