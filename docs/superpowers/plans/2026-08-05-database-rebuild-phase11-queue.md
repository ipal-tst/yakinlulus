# Database Rebuild Phase 11 Implementation Plan (Queue & Scheduler)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `queue` (scheduler & queue) — 35 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.12, menggantikan semua `queue_*`/`worker_*`/`cron_*` legacy.

**Architecture:** Mekanisme per design doc §4.12: queue definition → job lifecycle (WAITING/DELAYED/RUNNING/SUCCESS/FAILED/RETRY/DEAD/CANCELLED) → retry + dead-letter; worker fleet + heartbeat + history; batch jobs (junction `batch_job`); scheduling (schedule/cron/recurring) + workflow (steps/execution/dependency); locking + rate limiting; monitor & metrics snapshot; archive + history + notification queue. Queue adalah **support domain standalone** (design doc §5) — TIDAK ada FK ke `identity.user` ataupun domain lain; payload job memakai `payload_id` ke `queue.queue_payload`.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up` (dari `backend/`), verifikasi via throwaway Go program (pgx) di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_p11\main.go`.

**Files target:** `backend/migrations/110_queue_priority.up.sql` s.d. `119_queue_archive_history.up.sql` (10 file pasangan, range 110–119 sesuai runbook §2).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel (junction `batch_job` memakai composite PK).
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Enum: `text`/`varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec; partial index `(queue_id, status)` untuk `queue_job`.
- JSONB untuk payload/config.
- Migrasi harus `up` bersih, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya; strategi partisi ditunda.
  2. **§5 Cross-Domain Reference Rules:** `queue` standalone — SEMUA kolom referensi dibuat uuid ber-FK **internal** ke tabel queue (queue_definition/queue_payload/queue_worker/queue_job/queue_batch/queue_schedule/workflow). **TIDAK ada** FK ke identity/user atau domain lain. `archived_job` (mirror queue_job) memakai kolom snapshot TANPA FK.
  3. **Tabel append-only** (tanpa `updated_at`, tanpa trigger): `queue_retry`, `queue_dead_letter`, `rate_limit_log`, `job_history`, `worker_history`, `scheduler_history`, `archived_job`, `archived_payload`.
  4. Kolom bernama reserved/ambigu: `interval` → `interval_second`, `limit` → `limit_count` (deviasi dari label katalog, mempertahankan semantik).
  5. Tabel monitor/metrics menyertakan `observed_at` (snapshot time) agar berguna sebagai timeseries snapshot.

---

## Task 11A: Priority, Definition, Payload

**Files:**
- Create: `backend/migrations/110_queue_priority.up.sql`
- Create: `backend/migrations/110_queue_priority.down.sql`

**Interfaces:**
- Consumes: schema `queue` (000), `shared.set_updated_at()` (001).
- Produces: `queue.queue_priority`, `queue.queue_definition`, `queue.queue_payload`.

- [ ] **Step 1: Tulis `110_queue_priority.up.sql`**

```sql
-- Migration 110: queue priority, queue definition, queue payload.

CREATE TABLE queue.queue_priority (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(20) NOT NULL CHECK (name IN ('LOW','NORMAL','HIGH','CRITICAL')),
    weight int NOT NULL DEFAULT 10,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE TRIGGER trg_queue_priority_updated BEFORE UPDATE ON queue.queue_priority
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_definition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name varchar(120) NOT NULL,
    description text,
    max_retry int NOT NULL DEFAULT 3,
    retry_delay_second int NOT NULL DEFAULT 60,
    priority int NOT NULL DEFAULT 10,
    visibility_timeout int NOT NULL DEFAULT 30,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_queue_definition_name ON queue.queue_definition(queue_name);
CREATE INDEX idx_queue_definition_enabled ON queue.queue_definition(enabled, priority);
CREATE TRIGGER trg_queue_definition_updated BEFORE UPDATE ON queue.queue_definition
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_payload (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb NOT NULL,
    checksum varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_queue_payload_checksum ON queue.queue_payload(checksum);
```

- [ ] **Step 2: Tulis `110_queue_priority.down.sql`**

```sql
DROP TABLE IF EXISTS queue.queue_payload;
DROP TABLE IF EXISTS queue.queue_definition;
DROP TABLE IF EXISTS queue.queue_priority;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=110_queue_priority.up.sql`; `All migrations applied total=72`.

Verifikasi via throwaway Go (pgx, `$env:PQURL`): `SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **3**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): queue priority/definition/payload (phase 11)"
```

---

## Task 11B: Worker & Heartbeat

**Files:**
- Create: `backend/migrations/111_queue_worker.up.sql`
- Create: `backend/migrations/111_queue_worker.down.sql`

**Interfaces:**
- Consumes: schema `queue`, `shared.set_updated_at()`.
- Produces: `queue.queue_worker`, `queue.worker_heartbeat` (append-only).

- [ ] **Step 1: Tulis `111_queue_worker.up.sql`**

```sql
-- Migration 111: queue worker & worker heartbeat.

CREATE TABLE queue.queue_worker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name varchar(120) NOT NULL,
    hostname varchar(200),
    ip varchar(45),
    version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE','BUSY','PAUSED','DOWN')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    heartbeat timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (worker_name)
);
CREATE INDEX idx_queue_worker_status ON queue.queue_worker(status);
CREATE TRIGGER trg_queue_worker_updated BEFORE UPDATE ON queue.queue_worker
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.worker_heartbeat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    cpu numeric(5,2),
    memory numeric(5,2),
    queue_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_heartbeat_worker ON queue.worker_heartbeat(worker_id, created_at);
```

- [ ] **Step 2: Tulis `111_queue_worker.down.sql`**

```sql
DROP TABLE IF EXISTS queue.worker_heartbeat;
DROP TABLE IF EXISTS queue.queue_worker;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 111; `All migrations applied total=73`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **5**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): queue worker & heartbeat (phase 11)"
```

---

## Task 11C: Job, Retry, Dead Letter

**Files:**
- Create: `backend/migrations/112_queue_job.up.sql`
- Create: `backend/migrations/112_queue_job.down.sql`

**Interfaces:**
- Consumes: `queue.queue_definition`, `queue.queue_payload`, `queue.queue_worker`.
- Produces: `queue.queue_job`, `queue.queue_retry`, `queue.queue_dead_letter` (keduanya append-only).

- [ ] **Step 1: Tulis `112_queue_job.up.sql`**

```sql
-- Migration 112: queue job, retry, dead letter.

CREATE TABLE queue.queue_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES queue.queue_definition(id) ON DELETE CASCADE,
    job_type varchar(120) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING','DELAYED','RUNNING','SUCCESS','FAILED','RETRY','DEAD','CANCELLED')),
    payload_id uuid REFERENCES queue.queue_payload(id) ON DELETE SET NULL,
    priority int NOT NULL DEFAULT 10,
    attempt int NOT NULL DEFAULT 0,
    max_attempt int NOT NULL DEFAULT 3,
    worker_id uuid REFERENCES queue.queue_worker(id) ON DELETE SET NULL,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_job_queue_status ON queue.queue_job(queue_id, status)
    WHERE status IN ('WAITING','DELAYED','RUNNING','RETRY');
CREATE INDEX idx_queue_job_payload ON queue.queue_job(payload_id);
CREATE INDEX idx_queue_job_worker ON queue.queue_job(worker_id);
CREATE INDEX idx_queue_job_scheduled ON queue.queue_job(scheduled_at);
CREATE TRIGGER trg_queue_job_updated BEFORE UPDATE ON queue.queue_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_retry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    retry_no int NOT NULL DEFAULT 1,
    error text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, retry_no)
);

CREATE TABLE queue.queue_dead_letter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    reason text,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id)
);
```

- [ ] **Step 2: Tulis `112_queue_job.down.sql`**

```sql
DROP TABLE IF EXISTS queue.queue_dead_letter;
DROP TABLE IF EXISTS queue.queue_retry;
DROP TABLE IF EXISTS queue.queue_job;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 112; `All migrations applied total=74`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **8**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): queue job/retry/dead letter (phase 11)"
```

---

## Task 11D: Batch & Batch-Job Junction

**Files:**
- Create: `backend/migrations/113_queue_batch.up.sql`
- Create: `backend/migrations/113_queue_batch.down.sql`

**Interfaces:**
- Consumes: `queue.queue_job`.
- Produces: `queue.queue_batch`, `queue.batch_job` (junction, composite PK).

- [ ] **Step 1: Tulis `113_queue_batch.up.sql`**

```sql
-- Migration 113: queue batch & batch_job junction.

CREATE TABLE queue.queue_batch (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name varchar(200) NOT NULL,
    total_job int NOT NULL DEFAULT 0,
    completed int NOT NULL DEFAULT 0,
    failed int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (batch_name)
);
CREATE TRIGGER trg_queue_batch_updated BEFORE UPDATE ON queue.queue_batch
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.batch_job (
    batch_id uuid NOT NULL REFERENCES queue.queue_batch(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (batch_id, job_id)
);
CREATE INDEX idx_batch_job_job ON queue.batch_job(job_id);
```

- [ ] **Step 2: Tulis `113_queue_batch.down.sql`**

```sql
DROP TABLE IF EXISTS queue.batch_job;
DROP TABLE IF EXISTS queue.queue_batch;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 113; `All migrations applied total=75`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **10**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): queue batch & batch-job junction (phase 11)"
```

---

## Task 11E: Schedule, Cron, Recurring Task

**Files:**
- Create: `backend/migrations/114_queue_schedule.up.sql`
- Create: `backend/migrations/114_queue_schedule.down.sql`

**Interfaces:**
- Consumes: `queue.queue_definition`.
- Produces: `queue.queue_schedule`, `queue.cron_job`, `queue.recurring_task`.

- [ ] **Step 1: Tulis `114_queue_schedule.up.sql`**

```sql
-- Migration 114: queue schedule, cron job, recurring task.

CREATE TABLE queue.queue_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES queue.queue_definition(id) ON DELETE CASCADE,
    cron_expression varchar(100) NOT NULL,
    timezone varchar(60) NOT NULL DEFAULT 'Asia/Jakarta',
    enabled boolean NOT NULL DEFAULT true,
    next_run timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_schedule_queue ON queue.queue_schedule(queue_id);
CREATE INDEX idx_queue_schedule_enabled ON queue.queue_schedule(enabled, next_run);
CREATE TRIGGER trg_queue_schedule_updated BEFORE UPDATE ON queue.queue_schedule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.cron_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(200) NOT NULL,
    expression varchar(100) NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_name)
);
CREATE INDEX idx_cron_job_enabled ON queue.cron_job(enabled);
CREATE TRIGGER trg_cron_job_updated BEFORE UPDATE ON queue.cron_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.recurring_task (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    interval_second int NOT NULL DEFAULT 60,
    last_run timestamptz,
    next_run timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE INDEX idx_recurring_task_next ON queue.recurring_task(next_run);
CREATE TRIGGER trg_recurring_task_updated BEFORE UPDATE ON queue.recurring_task
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `114_queue_schedule.down.sql`**

```sql
DROP TABLE IF EXISTS queue.recurring_task;
DROP TABLE IF EXISTS queue.cron_job;
DROP TABLE IF EXISTS queue.queue_schedule;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 114; `All migrations applied total=76`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **13**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): queue schedule/cron/recurring task (phase 11)"
```

---

## Task 11F: Scheduler History & Scheduled Event

**Files:**
- Create: `backend/migrations/115_scheduler_event.up.sql`
- Create: `backend/migrations/115_scheduler_event.down.sql`

**Interfaces:**
- Consumes: `queue.queue_job`, `queue.queue_schedule`, `queue.cron_job`, `queue.recurring_task`.
- Produces: `queue.scheduler_history` (append-only), `queue.scheduled_event`.

- [ ] **Step 1: Tulis `115_scheduler_event.up.sql`**

```sql
-- Migration 115: scheduler history & scheduled event.

CREATE TABLE queue.scheduler_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type varchar(30),
    job_id uuid REFERENCES queue.queue_job(id) ON DELETE SET NULL,
    schedule_id uuid REFERENCES queue.queue_schedule(id) ON DELETE SET NULL,
    cron_job_id uuid REFERENCES queue.cron_job(id) ON DELETE SET NULL,
    task_id uuid REFERENCES queue.recurring_task(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','SKIPPED','RUNNING')),
    error text,
    run_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_history_run ON queue.scheduler_history(run_at);
CREATE INDEX idx_scheduler_history_status ON queue.scheduler_history(status);
CREATE INDEX idx_scheduler_history_job ON queue.scheduler_history(job_id);

CREATE TABLE queue.scheduled_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(200) NOT NULL,
    trigger_at timestamptz NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','TRIGGERED','CANCELLED','EXPIRED')),
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduled_event_trigger ON queue.scheduled_event(trigger_at, status);
```

- [ ] **Step 2: Tulis `115_scheduler_event.down.sql`**

```sql
DROP TABLE IF EXISTS queue.scheduled_event;
DROP TABLE IF EXISTS queue.scheduler_history;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 115; `All migrations applied total=77`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **15**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): scheduler history & scheduled event (phase 11)"
```

---

## Task 11G: Workflow — Step, Execution, Dependency

**Files:**
- Create: `backend/migrations/116_workflow.up.sql`
- Create: `backend/migrations/116_workflow.down.sql`

**Interfaces:**
- Consumes: `queue.queue_job`.
- Produces: `queue.workflow`, `queue.workflow_step`, `queue.workflow_execution`, `queue.task_dependency`.

- [ ] **Step 1: Tulis `116_workflow.up.sql`**

```sql
-- Migration 116: workflow, workflow step, execution, task dependency.

CREATE TABLE queue.workflow (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    description text,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE INDEX idx_workflow_status ON queue.workflow(status);
CREATE TRIGGER trg_workflow_updated BEFORE UPDATE ON queue.workflow
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.workflow_step (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES queue.workflow(id) ON DELETE CASCADE,
    step_order int NOT NULL DEFAULT 0,
    job_type varchar(120) NOT NULL,
    config jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (workflow_id, step_order)
);
CREATE INDEX idx_workflow_step_workflow ON queue.workflow_step(workflow_id, step_order);
CREATE TRIGGER trg_workflow_step_updated BEFORE UPDATE ON queue.workflow_step
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.workflow_execution (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES queue.workflow(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCESS','FAILED','CANCELLED')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workflow_execution_workflow ON queue.workflow_execution(workflow_id, started_at);
CREATE INDEX idx_workflow_execution_status ON queue.workflow_execution(status);

CREATE TABLE queue.task_dependency (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    depends_on uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (task, depends_on)
);
CREATE INDEX idx_task_dependency_depends ON queue.task_dependency(depends_on);
```

- [ ] **Step 2: Tulis `116_workflow.down.sql`**

```sql
DROP TABLE IF EXISTS queue.task_dependency;
DROP TABLE IF EXISTS queue.workflow_execution;
DROP TABLE IF EXISTS queue.workflow_step;
DROP TABLE IF EXISTS queue.workflow;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 116; `All migrations applied total=78`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **19**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): workflow/step/execution/dependency (phase 11)"
```

---

## Task 11H: Distributed Lock & Rate Limit

**Files:**
- Create: `backend/migrations/117_lock_rate_limit.up.sql`
- Create: `backend/migrations/117_lock_rate_limit.down.sql`

**Interfaces:**
- Consumes: schema `queue`.
- Produces: `queue.distributed_lock`, `queue.rate_limit`, `queue.rate_limit_log` (append-only).

- [ ] **Step 1: Tulis `117_lock_rate_limit.up.sql`**

```sql
-- Migration 117: distributed lock, rate limit, rate limit log.

CREATE TABLE queue.distributed_lock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lock_key varchar(200) NOT NULL,
    owner varchar(200),
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (lock_key)
);
CREATE TRIGGER trg_distributed_lock_updated BEFORE UPDATE ON queue.distributed_lock
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.rate_limit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(200) NOT NULL,
    limit_count int NOT NULL DEFAULT 100,
    window_second int NOT NULL DEFAULT 60,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service)
);
CREATE TRIGGER trg_rate_limit_updated BEFORE UPDATE ON queue.rate_limit
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.rate_limit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(200) NOT NULL,
    key varchar(200),
    allowed boolean NOT NULL DEFAULT true,
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_log_service ON queue.rate_limit_log(service, requested_at);
CREATE INDEX idx_rate_limit_log_allowed ON queue.rate_limit_log(allowed);
```

- [ ] **Step 2: Tulis `117_lock_rate_limit.down.sql`**

```sql
DROP TABLE IF EXISTS queue.rate_limit_log;
DROP TABLE IF EXISTS queue.rate_limit;
DROP TABLE IF EXISTS queue.distributed_lock;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 117; `All migrations applied total=79`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **22**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): distributed lock & rate limit (phase 11)"
```

---

## Task 11I: Services & Monitors

**Files:**
- Create: `backend/migrations/118_service_monitor.up.sql`
- Create: `backend/migrations/118_service_monitor.down.sql`

**Interfaces:**
- Consumes: `queue.queue_worker`, `queue.queue_schedule`.
- Produces: `queue.background_service`, `queue.service_health`, `queue.queue_monitor`, `queue.worker_monitor`, `queue.scheduler_monitor`.

- [ ] **Step 1: Tulis `118_service_monitor.up.sql`**

```sql
-- Migration 118: background service, service health, queue/worker/scheduler monitors.

CREATE TABLE queue.background_service (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name varchar(200) NOT NULL,
    version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'STOPPED' CHECK (status IN ('RUNNING','STOPPED','PAUSED','ERROR')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service_name)
);
CREATE INDEX idx_background_service_status ON queue.background_service(status);
CREATE TRIGGER trg_background_service_updated BEFORE UPDATE ON queue.background_service
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.service_health (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name varchar(200) NOT NULL,
    status varchar(20) NOT NULL CHECK (status IN ('HEALTHY','DEGRADED','DOWN','UNKNOWN')),
    checked_at timestamptz NOT NULL DEFAULT NOW(),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_health_name ON queue.service_health(service_name, checked_at);

CREATE TABLE queue.queue_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue varchar(200) NOT NULL,
    waiting int NOT NULL DEFAULT 0,
    running int NOT NULL DEFAULT 0,
    failed int NOT NULL DEFAULT 0,
    dead int NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_monitor_queue ON queue.queue_monitor(queue, observed_at);

CREATE TABLE queue.worker_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL CHECK (status IN ('IDLE','BUSY','PAUSED','DOWN')),
    job_running int NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_monitor_worker ON queue.worker_monitor(worker_id, observed_at);

CREATE TABLE queue.scheduler_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES queue.queue_schedule(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','MISSED','ERROR','PAUSED')),
    last_run_at timestamptz,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_monitor_schedule ON queue.scheduler_monitor(schedule_id, observed_at);
```

- [ ] **Step 2: Tulis `118_service_monitor.down.sql`**

```sql
DROP TABLE IF EXISTS queue.scheduler_monitor;
DROP TABLE IF EXISTS queue.worker_monitor;
DROP TABLE IF EXISTS queue.queue_monitor;
DROP TABLE IF EXISTS queue.service_health;
DROP TABLE IF EXISTS queue.background_service;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 118; `All migrations applied total=80`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **27**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): background service & monitors (phase 11)"
```

---

## Task 11J: Metrics, Archive, History, Notification Queue

**Files:**
- Create: `backend/migrations/119_queue_archive_history.up.sql`
- Create: `backend/migrations/119_queue_archive_history.down.sql`

**Interfaces:**
- Consumes: `queue.queue_worker`, `queue.queue_schedule`, `queue.queue_job`, `queue.queue_definition`.
- Produces: `queue.queue_metrics`, `queue.worker_metrics`, `queue.scheduler_metrics`, `queue.archived_job`, `queue.archived_payload`, `queue.job_history`, `queue.worker_history`, `queue.notification_queue`.

- [ ] **Step 1: Tulis `119_queue_archive_history.up.sql`**

```sql
-- Migration 119: metrics, archive, history, notification queue. Completes queue domain (35 tables).

CREATE TABLE queue.queue_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue varchar(200) NOT NULL,
    avg_latency numeric(12,2) NOT NULL DEFAULT 0,
    throughput numeric(12,2) NOT NULL DEFAULT 0,
    success_rate numeric(5,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_metrics_queue ON queue.queue_metrics(queue, observed_at);

CREATE TABLE queue.worker_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    jobs_processed int NOT NULL DEFAULT 0,
    avg_duration_ms numeric(12,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_metrics_worker ON queue.worker_metrics(worker_id, observed_at);

CREATE TABLE queue.scheduler_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES queue.queue_schedule(id) ON DELETE CASCADE,
    missed_runs int NOT NULL DEFAULT 0,
    avg_latency_ms numeric(12,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_metrics_schedule ON queue.scheduler_metrics(schedule_id, observed_at);

CREATE TABLE queue.archived_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_job_id uuid,
    queue_id uuid,
    job_type varchar(120),
    status varchar(20),
    payload_id uuid,
    priority int,
    attempt int,
    max_attempt int,
    worker_id uuid,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    archived_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archived_job_queue ON queue.archived_job(queue_id, archived_at);
CREATE INDEX idx_archived_job_type ON queue.archived_job(job_type);

CREATE TABLE queue.archived_payload (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb,
    checksum varchar(64),
    archived_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archived_payload_time ON queue.archived_payload(archived_at);

CREATE TABLE queue.job_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_history_job ON queue.job_history(job_id, changed_at);
CREATE INDEX idx_job_history_status ON queue.job_history(status);

CREATE TABLE queue.worker_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL,
    performed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_history_worker ON queue.worker_history(worker_id, performed_at);

CREATE TABLE queue.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid REFERENCES queue.queue_definition(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL','WHATSAPP','PUSH','SMS','IN_APP')),
    recipient varchar(255),
    template_code varchar(120),
    subject varchar(255),
    body text,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','CANCELLED')),
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_queue_channel ON queue.notification_queue(channel, status);
CREATE INDEX idx_notification_queue_queue ON queue.notification_queue(queue_id);
CREATE TRIGGER trg_notification_queue_updated BEFORE UPDATE ON queue.notification_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `119_queue_archive_history.down.sql`**

```sql
DROP TABLE IF EXISTS queue.notification_queue;
DROP TABLE IF EXISTS queue.worker_history;
DROP TABLE IF EXISTS queue.job_history;
DROP TABLE IF EXISTS queue.archived_payload;
DROP TABLE IF EXISTS queue.archived_job;
DROP TABLE IF EXISTS queue.scheduler_metrics;
DROP TABLE IF EXISTS queue.worker_metrics;
DROP TABLE IF EXISTS queue.queue_metrics;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 119; `All migrations applied total=81`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='queue';` → **35** ✓ (menyelesaikan domain queue)

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): metrics/archive/history/notification-queue (phase 11) - completes queue domain (35 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 11 (Queue & Scheduler, 35 tabel) terpenuhi: 10 file migrasi (110–119), 35 tabel sesuai §4.12 katalog. Daftar 1:1 — queue_definition, queue_job, queue_payload, queue_retry, queue_dead_letter, queue_priority, queue_worker, worker_heartbeat, queue_batch, batch_job, queue_schedule, cron_job, recurring_task, scheduler_history, scheduled_event, workflow, workflow_step, workflow_execution, task_dependency, distributed_lock, rate_limit, rate_limit_log, background_service, service_health, queue_monitor, worker_monitor, scheduler_monitor, queue_metrics, worker_metrics, scheduler_metrics, archived_job, archived_payload, job_history, worker_history, notification_queue = 35.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, CHECK enum, indeks FK/komposit/unik, `numeric(12,2)` untuk latency/throughput, `numeric(5,2)` untuk persen/CPU/memori). `batch_job` junction memakai composite PK `(batch_id, job_id)`. Partial index `(queue_id, status)` pada `queue_job` sesuai katalog. Semua FK **internal** ke tabel queue — TIDAK ada FK ke identity/user (queue standalone per §5). `archived_job`/`archived_payload` append-only snapshot TANPA FK.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (queue lama sudah dihapus di Phase 0); retry & dead-letter append-only; job history append-only; locking via distributed_lock bukan advisory row-lock tunggal; monitor/metrics snapshot (`observed_at`) terpisah dari mutable master (queue_worker), konsisten dengan prior phase; kolom reserved (`interval`, `limit`) diganti `interval_second`, `limit_count` agar tidak ambigu.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-05-database-rebuild-phase11-queue.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
