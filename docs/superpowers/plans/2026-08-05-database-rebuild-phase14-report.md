# Database Rebuild Phase 14 Implementation Plan (Report)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `report` — 24 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.15 (Reporting), menggantikan legacy reporting yang tersebar.

**Architecture:** Katalog report terpusat (`report_category` → `report_definition`), templat & versi (`report_template`, `report_version`), eksekusi/ekspor (`report_job`, `report_export`), riwayat & delivery (`report_history`, `report_delivery`), jadwal & parameter (`report_scheduler`, `report_parameter`), kontrol akses & distribusi (`report_permission`, `report_distribution_list`), snapshot dashboard/KPI (`report_snapshot`, `report_kpi_snapshot`), laporan periodik (`report_finance`, `report_academic`, `report_operational`, `report_student`, `report_teacher`, `report_school`), serta append-only audit + interaksi user (`report_audit_log`, `report_bookmark`, `report_comment`, `report_storage`).

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx/v5) di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_14\<N>\main.go`.

**Files target:** `backend/migrations/140_report_category_definition.up.sql` s.d. `149_report_audit_log_bookmark_comment_storage.up.sql` (10 file pasangan up/down).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` + trigger `shared.set_updated_at()` hanya pada tabel mutable.
- Enum: `varchar`/`text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- JSONB untuk payload/config (`parameter`, `snapshot_data`, `old_data`, `new_data`, `default_value`, `layout`).
- FK lintas schema: `identity.user` (user_id, requested_by, created_by), `identity.role` (report_permission.role_id).
- Migrasi harus `up` bersih, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Tabel append-only (hanya `created_at`, tanpa `updated_at`):** `report_job` (mutable via updated_at karena status), `report_export`, `report_history`, `report_delivery` (mutable via status/sent_at/read_at → updated_at), `report_audit_log`, `report_bookmark`, `report_snapshot`, `report_kpi_snapshot`, `report_finance`, `report_academic`, `report_operational`, `report_student`, `report_teacher`, `report_school`, `report_comment`, `report_storage`. Tabel mutable (punya updated_at + trigger): `report_category`, `report_definition`, `report_template`, `report_scheduler`, `report_permission`, `report_distribution_list`.

**Keputusan desain (deviasi minor, dicatat):**
1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya (`NO physical partitioning`, lihat fase 9 analytics dan fase 10 notification). Katalog §4.15 menandai `report_job`, `report_export`, `report_history`, `report_delivery`, `report_snapshot`, `report_kpi_snapshot`, `report_audit_log` sebagai "Partisi bulanan/tahunan"; seluruhnya dibuat **plain table** dengan **kolom partition-key siap** (`created_at`/`snapshot_date`/`generated_at`/`sent_at`) + **indeks pada kolom waktu** agar mudah dipartisi belakangan. Strategi partisi DITUNDA ke task operasional terpisah.
2. **§5 Cross-Domain Reference Rules:** `report` adalah support domain standalone — mereferensikan `identity.user` dan `identity.role` saja, tidak direferensikan balik. Referensi entitas generik (`student_id`, `teacher_id`, `school_id`, `record_id`, `actor`) sebagai `uuid` TANPA FK.
3. **`report_definition.template_id`** dibuat sebagai kolom `uuid` TANPA FK karena `report_template` dibuat di migrasi 141 (setelah definition di 140) — mematuhi urutan file; konsistensi referensi dijamin app-layer. Documented deviation.
4. **`period`** pada laporan periodik memakai `varchar(10)` (format `YYYY-MM`) + `UNIQUE (period)` (atau `UNIQUE (<entity>_id, period)`) untuk mencegah duplikat agregasi — mengikuti pola snapshot harian fase 9.
5. **`report_permission.role_id`** → `identity.role` (dibuat di 012, sudah ada). Composite `UNIQUE (definition_id, role_id)`.

---

## Task 14A: Katalog report — report_category, report_definition

**Files:**
- Create: `backend/migrations/140_report_category_definition.up.sql`
- Create: `backend/migrations/140_report_category_definition.down.sql`

**Interfaces:**
- Consumes: schema `report` (000), `shared.set_updated_at()` (001), `identity.user` (010).
- Produces: `report.report_category`, `report.report_definition`.

- [ ] **Step 1: Tulis `140_report_category_definition.up.sql`**

```sql
-- Migration 140: report category & definition (catalog core).

CREATE TABLE report.report_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL CHECK (code IN ('ACADEMIC','FINANCE','ANALYTICS','SECURITY','MEMBERSHIP','SYSTEM','SCHOOL','AI')),
    name varchar(200) NOT NULL,
    description text,
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_report_category_code ON report.report_category(code);
CREATE INDEX idx_report_category_active ON report.report_category(active);
CREATE TRIGGER trg_report_category_updated BEFORE UPDATE ON report.report_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_definition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(80) NOT NULL,
    name varchar(200) NOT NULL,
    category_id uuid REFERENCES report.report_category(id) ON DELETE SET NULL,
    description text,
    query_name varchar(200),
    template_id uuid,
    default_format varchar(10) NOT NULL DEFAULT 'PDF' CHECK (default_format IN ('PDF','EXCEL','CSV','JSON','XML')),
    allow_schedule boolean NOT NULL DEFAULT false,
    allow_export boolean NOT NULL DEFAULT true,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_report_definition_code ON report.report_definition(code);
CREATE INDEX idx_report_definition_category ON report.report_definition(category_id);
CREATE INDEX idx_report_definition_active ON report.report_definition(active);
CREATE INDEX idx_report_definition_created_by ON report.report_definition(created_by);
CREATE TRIGGER trg_report_definition_updated BEFORE UPDATE ON report.report_definition
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

> Catatan: `template_id` sengaja tanpa FK (lihat Global Constraints #3).

- [ ] **Step 2: Tulis `140_report_category_definition.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_definition;
DROP TABLE IF EXISTS report.report_category;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/` (config.yaml gitignored sudah dibuat):
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=140_report_category_definition.up.sql`; `All migrations applied total=100`.

Kemudian verifikasi via throwaway Go program (pgx/v5):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='report';` → **2**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report category & definition (phase 14)"
```

---

## Task 14B: Template & versi — report_template, report_version

**Files:**
- Create: `backend/migrations/141_report_template_version.up.sql`
- Create: `backend/migrations/141_report_template_version.down.sql`

**Interfaces:**
- Consumes: schema `report`, `shared.set_updated_at()`.
- Produces: `report.report_template`, `report.report_version`.

- [ ] **Step 1: Tulis `141_report_template_version.up.sql`**

```sql
-- Migration 141: report template & versioning.

CREATE TABLE report.report_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    layout jsonb,
    header text,
    footer text,
    orientation varchar(10) NOT NULL DEFAULT 'PORTRAIT' CHECK (orientation IN ('PORTRAIT','LANDSCAPE')),
    paper_size varchar(20) NOT NULL DEFAULT 'A4',
    logo text,
    theme varchar(50),
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_template_name ON report.report_template(name);
CREATE TRIGGER trg_report_template_updated BEFORE UPDATE ON report.report_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES report.report_template(id) ON DELETE CASCADE,
    version int NOT NULL,
    layout jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, version)
);
CREATE INDEX idx_report_version_template ON report.report_version(template_id);
```

- [ ] **Step 2: Tulis `141_report_template_version.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_version;
DROP TABLE IF EXISTS report.report_template;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=141_report_template_version.up.sql`; `All migrations applied total=101`. Verifier `report` count → **4**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report template & version (phase 14)"
```

---

## Task 14C: Eksekusi & ekspor — report_job, report_export

**Files:**
- Create: `backend/migrations/142_report_job_export.up.sql`
- Create: `backend/migrations/142_report_job_export.down.sql`

**Interfaces:**
- Consumes: schema `report`, `shared.set_updated_at()`, `identity.user`, `report.report_definition` (140).
- Produces: `report.report_job`, `report.report_export`. (Partisi bulanan DITUNDA — plain table + index waktu.)

- [ ] **Step 1: Tulis `142_report_job_export.up.sql`**

```sql
-- Migration 142: report execution job & export artifact. Partisi bulanan DITUNDA (plain table, index pada created_at).

CREATE TABLE report.report_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE SET NULL,
    requested_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    parameter jsonb,
    started_at timestamptz,
    finished_at timestamptz,
    duration_second int,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_job_definition ON report.report_job(definition_id);
CREATE INDEX idx_report_job_requested_by ON report.report_job(requested_by);
CREATE INDEX idx_report_job_status ON report.report_job(status);
CREATE INDEX idx_report_job_created ON report.report_job(created_at);
CREATE TRIGGER trg_report_job_updated BEFORE UPDATE ON report.report_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_export (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES report.report_job(id) ON DELETE CASCADE,
    format varchar(10) NOT NULL CHECK (format IN ('PDF','EXCEL','CSV','JSON','XML')),
    storage_provider varchar(50),
    file_path text,
    file_size bigint NOT NULL DEFAULT 0,
    checksum varchar(64),
    download_count int NOT NULL DEFAULT 0,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_export_job ON report.report_export(job_id);
CREATE INDEX idx_report_export_format ON report.report_export(format);
CREATE INDEX idx_report_export_created ON report.report_export(created_at);
```

- [ ] **Step 2: Tulis `142_report_job_export.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_export;
DROP TABLE IF EXISTS report.report_job;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=142_report_job_export.up.sql`; `All migrations applied total=102`. Verifier `report` count → **6**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report job & export (phase 14)"
```

---

## Task 14D: Riwayat & delivery — report_history, report_delivery

**Files:**
- Create: `backend/migrations/143_report_history_delivery.up.sql`
- Create: `backend/migrations/143_report_history_delivery.down.sql`

**Interfaces:**
- Consumes: schema `report`, `shared.set_updated_at()`, `identity.user`, `report.report_definition` (140), `report.report_job` (142).
- Produces: `report.report_history`, `report.report_delivery`. (Partisi bulanan DITUNDA — index waktu.)

- [ ] **Step 1: Tulis `143_report_history_delivery.up.sql`**

```sql
-- Migration 143: report generation history & delivery. Partisi bulanan DITUNDA (plain table, index waktu).

CREATE TABLE report.report_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    parameter jsonb,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('QUEUED','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    downloaded boolean NOT NULL DEFAULT false,
    downloaded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_history_definition ON report.report_history(definition_id);
CREATE INDEX idx_report_history_user ON report.report_history(user_id);
CREATE INDEX idx_report_history_generated ON report.report_history(generated_at);
CREATE INDEX idx_report_history_downloaded ON report.report_history(downloaded);

CREATE TABLE report.report_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES report.report_job(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL','WHATSAPP','TELEGRAM','DOWNLOAD')),
    recipient varchar(255),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','CANCELLED','READ')),
    sent_at timestamptz,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_delivery_job ON report.report_delivery(job_id);
CREATE INDEX idx_report_delivery_channel ON report.report_delivery(channel);
CREATE INDEX idx_report_delivery_status ON report.report_delivery(status);
CREATE INDEX idx_report_delivery_sent ON report.report_delivery(sent_at);
CREATE TRIGGER trg_report_delivery_updated BEFORE UPDATE ON report.report_delivery
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `143_report_history_delivery.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_delivery;
DROP TABLE IF EXISTS report.report_history;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=143_report_history_delivery.up.sql`; `All migrations applied total=103`. Verifier `report` count → **8**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report history & delivery (phase 14)"
```

---

## Task 14E: Scheduler & parameter — report_scheduler, report_parameter

**Files:**
- Create: `backend/migrations/144_report_scheduler_parameter.up.sql`
- Create: `backend/migrations/144_report_scheduler_parameter.down.sql`

**Interfaces:**
- Consumes: schema `report`, `shared.set_updated_at()`, `identity.user`, `report.report_definition` (140).
- Produces: `report.report_scheduler`, `report.report_parameter`.

- [ ] **Step 1: Tulis `144_report_scheduler_parameter.up.sql`**

```sql
-- Migration 144: report scheduler & parameter definition.

CREATE TABLE report.report_scheduler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE CASCADE,
    cron_expression varchar(100) NOT NULL,
    next_run timestamptz,
    last_run timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_scheduler_definition ON report.report_scheduler(definition_id);
CREATE INDEX idx_report_scheduler_next ON report.report_scheduler(next_run);
CREATE INDEX idx_report_scheduler_active ON report.report_scheduler(active);
CREATE TRIGGER trg_report_scheduler_updated BEFORE UPDATE ON report.report_scheduler
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_parameter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    parameter_name varchar(80) NOT NULL,
    parameter_type varchar(30) NOT NULL DEFAULT 'STRING' CHECK (parameter_type IN ('STRING','INTEGER','BOOLEAN','FLOAT','DATE','DATETIME','JSON','ARRAY')),
    default_value jsonb,
    required boolean NOT NULL DEFAULT false,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, parameter_name)
);
CREATE INDEX idx_report_parameter_definition ON report.report_parameter(definition_id);
```

- [ ] **Step 2: Tulis `144_report_scheduler_parameter.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_parameter;
DROP TABLE IF EXISTS report.report_scheduler;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=144_report_scheduler_parameter.up.sql`; `All migrations applied total=104`. Verifier `report` count → **10**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report scheduler & parameter (phase 14)"
```

---

## Task 14F: Permission & distribusi — report_permission, report_distribution_list

**Files:**
- Create: `backend/migrations/145_report_permission_distribution.up.sql`
- Create: `backend/migrations/145_report_permission_distribution.down.sql`

**Interfaces:**
- Consumes: schema `report`, `shared.set_updated_at()`, `identity.role` (012), `report.report_definition` (140).
- Produces: `report.report_permission`, `report.report_distribution_list`.

- [ ] **Step 1: Tulis `145_report_permission_distribution.up.sql`**

```sql
-- Migration 145: report permission & distribution list.

CREATE TABLE report.report_permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    allow_view boolean NOT NULL DEFAULT false,
    allow_download boolean NOT NULL DEFAULT false,
    allow_schedule boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, role_id)
);
CREATE INDEX idx_report_permission_role ON report.report_permission(role_id);
CREATE TRIGGER trg_report_permission_updated BEFORE UPDATE ON report.report_permission
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_distribution_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    recipient_type varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (recipient_type IN ('EMAIL','WHATSAPP','TELEGRAM','ROLE','USER')),
    recipient varchar(255) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_distribution_definition ON report.report_distribution_list(definition_id);
CREATE INDEX idx_report_distribution_active ON report.report_distribution_list(active);
CREATE TRIGGER trg_report_distribution_updated BEFORE UPDATE ON report.report_distribution_list
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `145_report_permission_distribution.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_distribution_list;
DROP TABLE IF EXISTS report.report_permission;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=145_report_permission_distribution.up.sql`; `All migrations applied total=105`. Verifier `report` count → **12**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report permission & distribution (phase 14)"
```

---

## Task 14G: Snapshot dashboard & KPI — report_snapshot, report_kpi_snapshot

**Files:**
- Create: `backend/migrations/146_report_snapshot_kpi.up.sql`
- Create: `backend/migrations/146_report_snapshot_kpi.down.sql`

**Interfaces:**
- Consumes: schema `report`.
- Produces: `report.report_snapshot`, `report.report_kpi_snapshot`. (Partisi tahunan DITUNDA — index snapshot_date.)

- [ ] **Step 1: Tulis `146_report_snapshot_kpi.up.sql`**

```sql
-- Migration 146: dashboard & KPI snapshot. Partisi tahunan DITUNDA (plain table, UNIQUE (snapshot_date, ...) anti-duplikat).

CREATE TABLE report.report_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    dashboard_name varchar(200) NOT NULL,
    snapshot_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (snapshot_date, dashboard_name)
);
CREATE INDEX idx_report_snapshot_date ON report.report_snapshot(snapshot_date);
CREATE INDEX idx_report_snapshot_dashboard ON report.report_snapshot(dashboard_name);

CREATE TABLE report.report_kpi_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    kpi_name varchar(120) NOT NULL,
    kpi_value numeric(12,2),
    target numeric(12,2),
    achievement numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (snapshot_date, kpi_name)
);
CREATE INDEX idx_report_kpi_snapshot_date ON report.report_kpi_snapshot(snapshot_date);
CREATE INDEX idx_report_kpi_snapshot_name ON report.report_kpi_snapshot(kpi_name);
```

- [ ] **Step 2: Tulis `146_report_snapshot_kpi.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_kpi_snapshot;
DROP TABLE IF EXISTS report.report_snapshot;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=146_report_snapshot_kpi.up.sql`; `All migrations applied total=106`. Verifier `report` count → **14**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report dashboard & kpi snapshot (phase 14)"
```

---

## Task 14H: Laporan periodik agregat — report_finance, report_academic, report_operational

**Files:**
- Create: `backend/migrations/147_report_periodic.up.sql`
- Create: `backend/migrations/147_report_periodic.down.sql`

**Interfaces:**
- Consumes: schema `report`.
- Produces: `report.report_finance`, `report.report_academic`, `report.report_operational`.

- [ ] **Step 1: Tulis `147_report_periodic.up.sql`**

```sql
-- Migration 147: period-based aggregate reports (finance, academic, operational).

CREATE TABLE report.report_finance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    refund numeric(12,2) NOT NULL DEFAULT 0,
    membership numeric(12,2) NOT NULL DEFAULT 0,
    invoice numeric(12,2) NOT NULL DEFAULT 0,
    transaction int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_finance_period ON report.report_finance(period);

CREATE TABLE report.report_academic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    student int NOT NULL DEFAULT 0,
    teacher int NOT NULL DEFAULT 0,
    school int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    completion numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_academic_period ON report.report_academic(period);

CREATE TABLE report.report_operational (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    login int NOT NULL DEFAULT 0,
    active_user int NOT NULL DEFAULT 0,
    error int NOT NULL DEFAULT 0,
    api_request int NOT NULL DEFAULT 0,
    storage bigint NOT NULL DEFAULT 0,
    cpu numeric(5,2),
    memory numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_operational_period ON report.report_operational(period);
```

- [ ] **Step 2: Tulis `147_report_periodic.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_operational;
DROP TABLE IF EXISTS report.report_academic;
DROP TABLE IF EXISTS report.report_finance;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=147_report_periodic.up.sql`; `All migrations applied total=107`. Verifier `report` count → **17**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report finance/academic/operational (phase 14)"
```

---

## Task 14I: Laporan per-entitas — report_student, report_teacher, report_school

**Files:**
- Create: `backend/migrations/148_report_entity.up.sql`
- Create: `backend/migrations/148_report_entity.down.sql`

**Interfaces:**
- Consumes: schema `report`.
- Produces: `report.report_student`, `report.report_teacher`, `report.report_school`. (student_id/teacher_id/school_id uuid TANPA FK — §5.)

- [ ] **Step 1: Tulis `148_report_entity.up.sql`**

```sql
-- Migration 148: per-entity reports (student, teacher, school). entity_id uuid TANPA FK (cross-domain, per 5).

CREATE TABLE report.report_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid,
    period varchar(10) NOT NULL,
    average_score numeric(5,2),
    ranking int,
    attendance numeric(5,2),
    learning_time int NOT NULL DEFAULT 0,
    completion numeric(5,2),
    recommendation text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, period)
);
CREATE INDEX idx_report_student_student ON report.report_student(student_id);
CREATE INDEX idx_report_student_period ON report.report_student(period);

CREATE TABLE report.report_teacher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid,
    period varchar(10) NOT NULL,
    student_count int NOT NULL DEFAULT 0,
    material_created int NOT NULL DEFAULT 0,
    exam_created int NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, period)
);
CREATE INDEX idx_report_teacher_teacher ON report.report_teacher(teacher_id);
CREATE INDEX idx_report_teacher_period ON report.report_teacher(period);

CREATE TABLE report.report_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid,
    period varchar(10) NOT NULL,
    student int NOT NULL DEFAULT 0,
    teacher int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    completion numeric(5,2),
    average_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, period)
);
CREATE INDEX idx_report_school_school ON report.report_school(school_id);
CREATE INDEX idx_report_school_period ON report.report_school(period);
```

- [ ] **Step 2: Tulis `148_report_entity.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_school;
DROP TABLE IF EXISTS report.report_teacher;
DROP TABLE IF EXISTS report.report_student;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=148_report_entity.up.sql`; `All migrations applied total=108`. Verifier `report` count → **20**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report student/teacher/school (phase 14)"
```

---

## Task 14J: Audit, bookmark, komentar, storage — report_audit_log, report_bookmark, report_comment, report_storage

**Files:**
- Create: `backend/migrations/149_report_audit_log_bookmark_comment_storage.up.sql`
- Create: `backend/migrations/149_report_audit_log_bookmark_comment_storage.down.sql`

**Interfaces:**
- Consumes: schema `report`, `identity.user`, `report.report_definition` (140), `report.report_history` (143).
- Produces: `report.report_audit_log`, `report.report_bookmark`, `report.report_comment`, `report.report_storage`. (Completes report domain — 24 tables.)

- [ ] **Step 1: Tulis `149_report_audit_log_bookmark_comment_storage.up.sql`**

```sql
-- Migration 149: audit log, bookmark, comment, storage. Completes report domain (24 tables).

CREATE TABLE report.report_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor uuid,
    action varchar(60) NOT NULL,
    table_name varchar(80) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_audit_actor ON report.report_audit_log(actor);
CREATE INDEX idx_report_audit_table ON report.report_audit_log(table_name);
CREATE INDEX idx_report_audit_created ON report.report_audit_log(created_at);

CREATE TABLE report.report_bookmark (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, definition_id)
);
CREATE INDEX idx_report_bookmark_definition ON report.report_bookmark(definition_id);

CREATE TABLE report.report_comment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_history_id uuid NOT NULL REFERENCES report.report_history(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_comment_history ON report.report_comment(report_history_id);
CREATE INDEX idx_report_comment_user ON report.report_comment(user_id);

CREATE TABLE report.report_storage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(50) NOT NULL,
    bucket varchar(100) NOT NULL,
    path text NOT NULL,
    public_url text,
    checksum varchar(64),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider, bucket, path)
);
CREATE INDEX idx_report_storage_provider ON report.report_storage(provider);
```

> Catatan: `report_audit_log.actor` uuid TANPA FK (cross-domain actor, append-only) — konsisten pola `finance.financial_audit_log`.

- [ ] **Step 2: Tulis `149_report_audit_log_bookmark_comment_storage.down.sql`**

```sql
DROP TABLE IF EXISTS report.report_storage;
DROP TABLE IF EXISTS report.report_comment;
DROP TABLE IF EXISTS report.report_bookmark;
DROP TABLE IF EXISTS report.report_audit_log;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=149_report_audit_log_bookmark_comment_storage.up.sql`; `All migrations applied total=109`. Verifier `report` count → **24**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): report audit/bookmark/comment/storage (phase 14) - completes report domain (24 tables)"
```

---

## Final Verification Gate (BEFORE declaring done)

1. `go run cmd/migrate/main.go up` applies all cleanly → `All migrations applied total=109`.
2. Verifier (throwaway pgx v5, `SELECT count(*) FROM information_schema.tables WHERE table_schema='report';`) reports **24**.
3. `_migrations` grew by exactly 10 (`SELECT count(*) FROM _migrations` → 109).
4. Down migrations reverse-ordered & idempotent (`DROP TABLE IF EXISTS ... CASCADE`) — inspect, don't run down.
5. Append Phase 14 entry to `.superpowers/sdd/progress.md` ledger.
6. Commit final plan doc + ledger + all migration files to `phase-14`.
7. Do NOT merge — merge orchestrated by runbook §5 (`parallel-finish.ps1`).

## Deviations Summary (documented above)

1. **No physical partitioning** — all "Partisi bulanan/tahunan" tables plain, with partition-key columns + time indexes; partitioning deferred to later operational task (consistent with phases 9/10).
2. Cross-domain entity refs (`student_id`, `teacher_id`, `school_id`, `record_id`, `actor`) uuid without FK (§5).
3. `report_definition.template_id` uuid without FK (forward reference to migration 141).
4. `period` as `varchar(10)` + UNIQUE constraints to prevent duplicate aggregation.
5. `report_permission.role_id` FK → `identity.role` (pre-existing 012).
