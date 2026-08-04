# Database Rebuild Phase 0–2 Implementation Plan (Foundation, Identity, Academic)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun fondasi database baru (drop semua legacy + namespace schemas + helper) lalu domain `identity` (35 tabel) dan `academic` (23 tabel) sesuai design doc.

**Architecture:** Multi-schema Postgres (bounded-context) menggantikan satu schema `public` yang berantakan. Konvensi global diterapkan sejak migrasi 000. Runner migrasi (Go `AutoMigrate`) tetap dipakai; file `.sql` lama dihapus dan diganti penomoran ulang dari `000`.

**Tech Stack:** PostgreSQL 16, golang-migrate-style runner (`backend/pkg/database/migrate.go`), `go run cmd/migrate/main.go up`.

**Files target:**
- `backend/migrations/` — hapus SEMUA file `*.up.sql` dan `*.down.sql` lama (63 file), ganti dengan urutan baru.
- File baru Phase 0: `000_clean_slate_and_schemas.{up,down}.sql`, `001_functions_and_extensions.{up,down}.sql`
- File baru Phase 1: `010_..015_` (identity)
- File baru Phase 2: `020_..025_` (academic)

---

## Global Constraints

Semua tugas mematuhi **Global Conventions** dari `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` (§2), khususnya:

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama: `snake_case` singular; kolom referensi `<entity>_id`.
- Timestamp: `created_at timestamptz NOT NULL DEFAULT NOW()` (wajib); `updated_at` untuk tabel mutable.
- Soft delete: `deleted_at timestamptz NULL` pada tabel master.
- Enum: `text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks FK + filter umum; indeks unik sesuai spec.
- Setiap migrasi harus bisa `up` bersih dari nol di DB kosong, berbasis transaksi (runner sudah membungkus tx).
- Jangan sentuh kode Go runner (di luar scope database), kecuali mutlak perlu — catat sebagai follow-up.

---

## Task 0A: Clean Slate & Namespace Schemas

**Files:**
- Create: `backend/migrations/000_clean_slate_and_schemas.up.sql`
- Create: `backend/migrations/000_clean_slate_and_schemas.down.sql`

**Interfaces:**
- Consumes: tidak ada.
- Produces: schema `public` baru (bersih) berisi `_migrations` compat, plus 21 schema namespace: `identity, academic, media, question, cbt, content, finance, ranking, analytics, cms, notification, queue, ai, ocr, report, search, config, audit, integration, monitoring, shared`.

- [ ] **Step 1: Hapus semua file migrasi lama**

Hapus seluruh `backend/migrations/*.sql` yang ada (63 file). Gunakan perintah di `backend/`:
```bash
Remove-Item migrations\*.sql -Force
```
Verifikasi: `Get-ChildItem migrations | Measure-Object` → Count = 0.

- [ ] **Step 2: Tulis `000_clean_slate_and_schemas.up.sql`**

```sql
-- Migration 000: Clean slate. Remove ALL legacy objects and recreate schema.
-- NOTE: the runner creates _migrations in schema public before running files,
-- so we DROP SCHEMA public CASCADE then recreate _migrations with identical shape.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Recreate the runner's tracking table (same shape AutoMigrate expects).
CREATE TABLE public._migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop any legacy extension we no longer rely on being at old state (idempotent).
-- Namespace schemas per bounded-context.
CREATE SCHEMA identity;
CREATE SCHEMA academic;
CREATE SCHEMA media;
CREATE SCHEMA question;
CREATE SCHEMA cbt;
CREATE SCHEMA content;
CREATE SCHEMA finance;
CREATE SCHEMA ranking;
CREATE SCHEMA analytics;
CREATE SCHEMA cms;
CREATE SCHEMA notification;
CREATE SCHEMA queue;
CREATE SCHEMA ai;
CREATE SCHEMA ocr;
CREATE SCHEMA report;
CREATE SCHEMA search;
CREATE SCHEMA config;
CREATE SCHEMA audit;
CREATE SCHEMA integration;
CREATE SCHEMA monitoring;
CREATE SCHEMA shared;
```

- [ ] **Step 3: Tulis `000_clean_slate_and_schemas.down.sql`**

```sql
-- Down: restore a plain public schema only (cannot restore dropped legacy data).
DROP SCHEMA IF EXISTS monitoring CASCADE;
DROP SCHEMA IF EXISTS integration CASCADE;
DROP SCHEMA IF EXISTS audit CASCADE;
DROP SCHEMA IF EXISTS config CASCADE;
DROP SCHEMA IF EXISTS search CASCADE;
DROP SCHEMA IF EXISTS report CASCADE;
DROP SCHEMA IF EXISTS ocr CASCADE;
DROP SCHEMA IF EXISTS ai CASCADE;
DROP SCHEMA IF EXISTS queue CASCADE;
DROP SCHEMA IF EXISTS notification CASCADE;
DROP SCHEMA IF EXISTS cms CASCADE;
DROP SCHEMA IF EXISTS analytics CASCADE;
DROP SCHEMA IF EXISTS ranking CASCADE;
DROP SCHEMA IF EXISTS finance CASCADE;
DROP SCHEMA IF EXISTS content CASCADE;
DROP SCHEMA IF EXISTS cbt CASCADE;
DROP SCHEMA IF EXISTS question CASCADE;
DROP SCHEMA IF EXISTS media CASCADE;
DROP SCHEMA IF EXISTS academic CASCADE;
DROP SCHEMA IF EXISTS identity CASCADE;
DROP SCHEMA IF EXISTS shared CASCADE;
```

- [ ] **Step 4: Verifikasi migrasi up bersih**

Dari `backend/`, pastikan DB target kosong/siap, lalu:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=000_clean_slate_and_schemas.up.sql`; `All migrations applied total=1`.

- [ ] **Step 5: Verify schemas exist**

```bash
go run cmd/dbcheck/main.go
# atau via psql:
psql "$DATABASE_URL" -c "SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','pg_toast') ORDER BY 1;"
```
Expected: `public` (dengan `_migrations`), dan 21 namespace lain tercantum.

- [ ] **Step 6: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): clean slate + namespace schemas (phase 0)"
```

---

## Task 0B: Shared Functions & Naming Tooling

**Files:**
- Create: `backend/migrations/001_functions_and_extensions.up.sql`
- Create: `backend/migrations/001_functions_and_extensions.down.sql`

**Interfaces:**
- Consumes: `migrations` dir kosong + schema dari Task 0A.
- Produces (di schema `shared`): fungsi `shared.set_updated_at()` trigger, dan fungsi `shared.set_identity_scope()` NOOP (placeholder utk definisi scope ABAC lintas fase). Menerbitkan extension `pgcrypto` (tidak wajib, gen_random_uuid built-in) dan `vector` (dibutuhkan Phase search) bila tersedia — dibuat `IF NOT EXISTS` supaya aman bila ekstensi belum terinstall.

- [ ] **Step 1: Tulis `001_functions_and_extensions.up.sql`**

```sql
-- Migration 001: shared functions, triggers, extensions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Sets updated_at = NOW() on BEFORE UPDATE. Attach to tables that have updated_at.
CREATE OR REPLACE FUNCTION shared.set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Tulis `001_functions_and_extensions.down.sql`**

```sql
DROP FUNCTION IF EXISTS shared.set_updated_at();
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: `000..` dan `001..` applied; `All migrations applied total=2`.
Query: `SELECT proname FROM pg_proc WHERE proname='set_updated_at';` → `set_updated_at`.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): shared functions + extensions (phase 0)"
```

---

# PHASE 1 — `identity` (35 tabel)

## Task 1A: User & Profile

**Files:**
- Create: `backend/migrations/010_identity_user.up.sql` / `.down.sql`

**Interfaces:**
- Produces schema `identity`: `user`, `user_profile`, `user_address`, `user_identity`.
- Lainnya memakai `identity.user` untuk FK `*_id` yang menunjuk user.

- [ ] **Step 1: Tulis `010_identity_user.up.sql`**

```sql
CREATE TABLE identity.user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(100) NOT NULL,
    email varchar(255),
    phone varchar(30),
    password_hash text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE','INACTIVE','LOCKED','PENDING')),
    avatar text,
    last_login_at timestamptz,
    email_verified boolean NOT NULL DEFAULT false,
    phone_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_user_username ON identity.user(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_email ON identity.user(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_phone ON identity.user(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_status ON identity.user(status);
CREATE TRIGGER trg_user_updated BEFORE UPDATE ON identity.user
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_profile (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    full_name varchar(200),
    gender varchar(20),
    birth_place varchar(200),
    birth_date date,
    religion varchar(50),
    nationality varchar(100),
    photo text,
    bio text,
    language varchar(16) DEFAULT 'id',
    timezone varchar(64) DEFAULT 'Asia/Jakarta',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_profile_user ON identity.user_profile(user_id);
CREATE TRIGGER trg_user_profile_updated BEFORE UPDATE ON identity.user_profile
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_address (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    province varchar(100),
    city varchar(100),
    district varchar(100),
    village varchar(100),
    postal_code varchar(10),
    address text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_address_user ON identity.user_address(user_id);
CREATE TRIGGER trg_user_address_updated BEFORE UPDATE ON identity.user_address
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_identity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    identity_type varchar(20) NOT NULL DEFAULT 'KTP' CHECK (identity_type IN ('KTP','NISN','NIP','OTHER')),
    identity_number varchar(50) NOT NULL,
    issued_date date,
    expired_date date,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_identity_num ON identity.user_identity(identity_type, identity_number);
```

- [ ] **Step 2: Tulis `010_identity_user.down.sql`**

```sql
DROP TABLE IF EXISTS identity.user_identity;
DROP TABLE IF EXISTS identity.user_address;
DROP TABLE IF EXISTS identity.user_profile;
DROP TABLE IF EXISTS identity.user;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: total bertambah; `\d identity.user` menampilkan kolom. Cek indeks unik ada. Kirim query FK:
```sql
SELECT conname FROM pg_constraint WHERE conrelid='identity.user_profile'::regclass;
```
Expected: constraint FK `user_profile_user_id_fkey` ada. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity user & profile (phase 1)"
```

---

## Task 1B: Organization

**Files:**
- Create: `backend/migrations/011_identity_organization.up.sql` / `.down.sql`

**Interfaces:**
- Produces `identity.organization`, `identity.organization_member`.
- Dipakai `user_role`, `asset_folder`, `config.configuration_value`.

- [ ] **Step 1: Tulis `011_identity_organization.up.sql`**

```sql
CREATE TABLE identity.organization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    type text NOT NULL DEFAULT 'COMPANY' CHECK (type IN ('SYSTEM','SCHOOL','PARTNER','COMPANY')),
    description text,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_org_code ON identity.organization(code) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON identity.organization
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.organization_member (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT NOW(),
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','REMOVED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_org_member ON identity.organization_member(organization_id, user_id);
```

- [ ] **Step 2: Tulis `011_identity_organization.down.sql`**

```sql
DROP TABLE IF EXISTS identity.organization_member;
DROP TABLE IF EXISTS identity.organization;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 011. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity organization (phase 1)"
```

---

## Task 1C: RBAC & ABAC

**Files:**
- Create: `backend/migrations/012_identity_rbac.up.sql` / `.down.sql`

**Interfaces:**
- Produces `role`, `permission_module`, `permission_resource`, `permission`, `role_permission`, `permission_scope`, `user_role`, `user_permission_override`, `menu`, `role_menu`.
- Dipakai: `report.report_permission`, `media.asset_permission`, `config.default_role`.

- [ ] **Step 1: Tulis `012_identity_rbac.up.sql`**

```sql
CREATE TABLE identity.role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    priority int NOT NULL DEFAULT 0,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_role_code ON identity.role(code) WHERE deleted_at IS NULL;

CREATE TABLE identity.permission_module (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(100) NOT NULL,
    icon text,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_module_code ON identity.permission_module(code);

CREATE TABLE identity.permission_resource (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL REFERENCES identity.permission_module(id) ON DELETE CASCADE,
    code varchar(60) NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_resource_code ON identity.permission_resource(code);

CREATE TABLE identity.permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id uuid NOT NULL REFERENCES identity.permission_resource(id) ON DELETE CASCADE,
    code varchar(80) NOT NULL,
    name varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_permission_code ON identity.permission(code);
CREATE INDEX idx_permission_resource ON identity.permission(resource_id);

CREATE TABLE identity.role_permission (
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES identity.permission(id) ON DELETE CASCADE,
    allow boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE identity.permission_scope (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(60),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_scope_code ON identity.permission_scope(code);

CREATE TABLE identity.user_role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES identity.organization(id) ON DELETE SET NULL,
    scope_id uuid REFERENCES identity.permission_scope(id) ON DELETE SET NULL,
    start_date date,
    end_date date,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_role_user ON identity.user_role(user_id);
CREATE INDEX idx_user_role_role ON identity.user_role(role_id);

CREATE TABLE identity.user_permission_override (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES identity.permission(id) ON DELETE CASCADE,
    allow boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, permission_id)
);

CREATE TABLE identity.menu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES identity.menu(id) ON DELETE CASCADE,
    title varchar(120) NOT NULL,
    icon text,
    route text,
    sort_order int NOT NULL DEFAULT 0,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE INDEX idx_menu_parent ON identity.menu(parent_id);

CREATE TABLE identity.role_menu (
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    menu_id uuid NOT NULL REFERENCES identity.menu(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, menu_id)
);
```

- [ ] **Step 2: Tulis `012_identity_rbac.down.sql`**

```sql
DROP TABLE IF EXISTS identity.role_menu;
DROP TABLE IF EXISTS identity.menu;
DROP TABLE IF EXISTS identity.user_permission_override;
DROP TABLE IF EXISTS identity.user_role;
DROP TABLE IF EXISTS identity.permission_scope;
DROP TABLE IF EXISTS identity.role_permission;
DROP TABLE IF EXISTS identity.permission;
DROP TABLE IF EXISTS identity.permission_resource;
DROP TABLE IF EXISTS identity.permission_module;
DROP TABLE IF EXISTS identity.role;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 012. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity RBAC/ABAC (phase 1)"
```

---

## Task 1D: Auth, Session & Security

**Files:**
- Create: `backend/migrations/013_identity_auth.up.sql` / `.down.sql`

**Interfaces:**
- Produces `login_session`, `device`, `trusted_device`, `otp_request`, `password_history`, `password_reset`, `email_verification`, `api_token`, `mfa_configuration`, `refresh_token_blacklist`, `user_agreement`.

- [ ] **Step 1: Tulis `013_identity_auth.up.sql`**

```sql
CREATE TABLE identity.login_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    access_token text NOT NULL,
    refresh_token text,
    expired_at timestamptz NOT NULL,
    logout_at timestamptz,
    ip varchar(45),
    device text,
    browser text,
    os text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_session_user ON identity.login_session(user_id);
CREATE INDEX idx_login_session_refresh ON identity.login_session(refresh_token);

CREATE TABLE identity.device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    device_uuid varchar(64) NOT NULL,
    device_name varchar(200),
    platform varchar(20),
    last_active timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_device ON identity.device(user_id, device_uuid);

CREATE TABLE identity.trusted_device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id uuid NOT NULL REFERENCES identity.device(id) ON DELETE CASCADE,
    verified_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE identity.otp_request (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    type varchar(10) NOT NULL CHECK (type IN ('EMAIL','SMS','WA')),
    code varchar(16) NOT NULL,
    expired_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_user ON identity.otp_request(user_id);

CREATE TABLE identity.password_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_history_user ON identity.password_history(user_id);

CREATE TABLE identity.password_reset (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_reset_token ON identity.password_reset(token);

CREATE TABLE identity.email_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_verification_token ON identity.email_verification(token);

CREATE TABLE identity.api_token (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    scope text,
    expired_at timestamptz,
    last_used timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_api_token ON identity.api_token(token);

CREATE TABLE identity.mfa_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    method varchar(10) NOT NULL CHECK (method IN ('TOTP','EMAIL','SMS','WA')),
    secret text,
    is_enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_mfa_user ON identity.mfa_configuration(user_id);
CREATE TRIGGER trg_mfa_updated BEFORE UPDATE ON identity.mfa_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.refresh_token_blacklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_blacklist_token ON identity.refresh_token_blacklist(token);

CREATE TABLE identity.user_agreement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    agreement_type varchar(20) NOT NULL CHECK (agreement_type IN ('PRIVACY','TERM')),
    version varchar(30) NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_agreement ON identity.user_agreement(user_id, agreement_type, version);
```

- [ ] **Step 2: Tulis `013_identity_auth.down.sql`**

```sql
DROP TABLE IF EXISTS identity.user_agreement;
DROP TABLE IF EXISTS identity.refresh_token_blacklist;
DROP TABLE IF EXISTS identity.mfa_configuration;
DROP TABLE IF EXISTS identity.api_token;
DROP TABLE IF EXISTS identity.email_verification;
DROP TABLE IF EXISTS identity.password_reset;
DROP TABLE IF EXISTS identity.password_history;
DROP TABLE IF EXISTS identity.otp_request;
DROP TABLE IF EXISTS identity.trusted_device;
DROP TABLE IF EXISTS identity.device;
DROP TABLE IF EXISTS identity.login_session;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 013. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity auth/session/security (phase 1)"
```

---

## Task 1E: Preferences & Status

**Files:**
- Create: `backend/migrations/014_identity_preference.up.sql` / `.down.sql`

**Interfaces:**
- Produces `notification_preference`, `user_setting`, `user_preference`.

- [ ] **Step 1: Tulis `014_identity_preference.up.sql`**

```sql
CREATE TABLE identity.notification_preference (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    email boolean NOT NULL DEFAULT true,
    push boolean NOT NULL DEFAULT true,
    sms boolean NOT NULL DEFAULT false,
    whatsapp boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_notif_pref_updated BEFORE UPDATE ON identity.notification_preference
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    theme varchar(30) DEFAULT 'system',
    language varchar(16) DEFAULT 'id',
    timezone varchar(64) DEFAULT 'Asia/Jakarta',
    dashboard_layout text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_setting_updated BEFORE UPDATE ON identity.user_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_preference (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    favorite_subject text,
    difficulty text,
    study_target text,
    daily_target int,
    learning_style text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_pref_updated BEFORE UPDATE ON identity.user_preference
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `014_identity_preference.down.sql`**

```sql
DROP TABLE IF EXISTS identity.user_preference;
DROP TABLE IF EXISTS identity.user_setting;
DROP TABLE IF EXISTS identity.notification_preference;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 014. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity preferences & settings (phase 1)"
```

---

## Task 1F: Identity Audit Logs

**Files:**
- Create: `backend/migrations/015_identity_audit.up.sql` / `.down.sql`

**Interfaces:**
- Produces `login_history`, `activity_log`, `security_log`, `impersonation_log`, `user_status_history`. Tabel ini append-only (partisi bulanan opsional di migrasi berikutnya; di sini non-partisi sederhana, penamaan konsisten schema `identity`).

- [ ] **Step 1: Tulis `015_identity_audit.up.sql`**

```sql
CREATE TABLE identity.login_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    login_time timestamptz NOT NULL DEFAULT NOW(),
    logout_time timestamptz,
    ip varchar(45),
    country varchar(100),
    city varchar(100),
    browser text,
    device text,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('FAILED','SUCCESS','LOCKED'))
);
CREATE INDEX idx_login_history_user ON identity.login_history(user_id);
CREATE INDEX idx_login_history_time ON identity.login_history(login_time);

CREATE TABLE identity.activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    module varchar(60),
    action text NOT NULL,
    entity varchar(60),
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_user ON identity.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON identity.activity_log(entity, entity_id);
CREATE INDEX idx_activity_log_time ON identity.activity_log(created_at);

CREATE TABLE identity.security_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    event varchar(40) NOT NULL CHECK (event IN ('FAILED_LOGIN','OTP','PASSWORD_CHANGE','ROLE_CHANGE','MFA')),
    ip varchar(45),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_log_user ON identity.security_log(user_id);
CREATE INDEX idx_security_log_time ON identity.security_log(created_at);

CREATE TABLE identity.impersonation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    target_user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    reason text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz
);
CREATE INDEX idx_impersonation_admin ON identity.impersonation_log(admin_id);

CREATE TABLE identity.user_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    old_status varchar(20),
    new_status varchar(20) NOT NULL,
    reason text,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_status_history_user ON identity.user_status_history(user_id);
```

- [ ] **Step 2: Tulis `015_identity_audit.down.sql`**

```sql
DROP TABLE IF EXISTS identity.user_status_history;
DROP TABLE IF EXISTS identity.impersonation_log;
DROP TABLE IF EXISTS identity.security_log;
DROP TABLE IF EXISTS identity.activity_log;
DROP TABLE IF EXISTS identity.login_history;
```

- [ ] **Step 3: Verifikasi** — jalankan `go run cmd/migrate/main.go up`; expected total=6 (+3 tasks 0). `SELECT count(*) FROM information_schema.tables WHERE table_schema='identity';` → **17** (16 tabel + ?). Hitung: user,user_profile,user_address,user_identity,organization,organization_member,role,permission_module,permission_resource,permission,role_permission,permission_scope,user_role,user_permission_override,menu,role_menu,login_session,device,trusted_device,otp_request,password_history,password_reset,email_verification,api_token,mfa_configuration,refresh_token_blacklist,user_agreement,notification_preference,user_setting,user_preference,login_history,activity_log,security_log,impersonation_log,user_status_history = **35**.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): identity audit logs (phase 1) - completes identity domain (35 tables)"
```

---

# PHASE 2 — `academic` (23 tabel)

**Prereq:** Phase 1 selesai. FK ke `identity.user` (teacher_id) menggunakan `identity.user`.

## Task 2A: Academic Year, Semester, Level, Grade, Major

**Files:**
- Create: `backend/migrations/020_academic_core.up.sql` / `.down.sql`

- [ ] **Step 1: Tulis `020_academic_core.up.sql`**

```sql
CREATE TABLE academic.academic_year (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    start_date date,
    end_date date,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_academic_year_code ON academic.academic_year(code);
CREATE TRIGGER trg_academic_year_updated BEFORE UPDATE ON academic.academic_year
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.semester (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id uuid NOT NULL REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    order_no int NOT NULL DEFAULT 1,
    start_date date,
    end_date date,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (academic_year_id, order_no)
);
CREATE TRIGGER trg_semester_updated BEFORE UPDATE ON academic.semester
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.education_level (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(100) NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    icon text,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_education_level_code ON academic.education_level(code);

CREATE TABLE academic.grade (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES academic.education_level(id) ON DELETE CASCADE,
    code varchar(10) NOT NULL,
    name varchar(60) NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (education_level_id, code)
);
CREATE INDEX idx_grade_level ON academic.grade(education_level_id);

CREATE TABLE academic.major (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES academic.education_level(id) ON DELETE CASCADE,
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (education_level_id, code)
);
CREATE INDEX idx_major_level ON academic.major(education_level_id);
```

- [ ] **Step 2: Tulis `020_academic_core.down.sql`**

```sql
DROP TABLE IF EXISTS academic.major;
DROP TABLE IF EXISTS academic.grade;
DROP TABLE IF EXISTS academic.education_level;
DROP TABLE IF EXISTS academic.semester;
DROP TABLE IF EXISTS academic.academic_year;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic core - year/semester/level/grade/major (phase 2)"
```

---

## Task 2B: Curriculum & Subject

**Files:**
- Create: `backend/migrations/021_academic_curriculum.up.sql` / `.down.sql`

- [ ] **Step 1: Tulis `021_academic_curriculum.up.sql`**

```sql
CREATE TABLE academic.curriculum (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    version varchar(30),
    effective_year int,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_curriculum_code ON academic.curriculum(code);
CREATE TRIGGER trg_curriculum_updated BEFORE UPDATE ON academic.curriculum
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    description text,
    icon text,
    color varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_subject_code ON academic.subject(code);
CREATE TRIGGER trg_subject_updated BEFORE UPDATE ON academic.subject
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.curriculum_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    education_level_id uuid REFERENCES academic.education_level(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    major_id uuid REFERENCES academic.major(id) ON DELETE CASCADE,
    semester_id uuid REFERENCES academic.semester(id) ON DELETE CASCADE,
    is_required boolean NOT NULL DEFAULT true,
    credit int NOT NULL DEFAULT 0,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_curriculum_subject
  ON academic.curriculum_subject(curriculum_id, subject_id, education_level_id, grade_id, major_id);
CREATE INDEX idx_curriculum_subject_subject ON academic.curriculum_subject(subject_id);
```

- [ ] **Step 2: Tulis `021_academic_curriculum.down.sql`**

```sql
DROP TABLE IF EXISTS academic.curriculum_subject;
DROP TABLE IF EXISTS academic.subject;
DROP TABLE IF EXISTS academic.curriculum;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic curriculum & subject (phase 2)"
```

---

## Task 2C: Chapter, Subchapter, Competency, Outcome, Topic, Skill

**Files:**
- Create: `backend/migrations/022_academic_structure.up.sql` / `.down.sql`

- [ ] **Step 1: Tulis `022_academic_structure.up.sql`**

```sql
CREATE TABLE academic.chapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_subject_id uuid NOT NULL REFERENCES academic.curriculum_subject(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    description text,
    estimated_minutes int,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chapter_cs ON academic.chapter(curriculum_subject_id);
CREATE TRIGGER trg_chapter_updated BEFORE UPDATE ON academic.chapter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.subchapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    description text,
    estimated_minutes int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subchapter_chapter ON academic.subchapter(chapter_id);

CREATE TABLE academic.competency (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid REFERENCES academic.chapter(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    description text,
    difficulty_level varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_competency_chapter ON academic.competency(chapter_id);

CREATE TABLE academic.learning_outcome (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    title varchar(250) NOT NULL,
    description text,
    blooms_level varchar(20) CHECK (blooms_level IN ('REMEMBER','UNDERSTAND','APPLY','ANALYZE','EVALUATE','CREATE')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_outcome_competency ON academic.learning_outcome(competency_id);

CREATE TABLE academic.topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    description text,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_topic_subchapter ON academic.topic(subchapter_id);

CREATE TABLE academic.skill (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_skill_code ON academic.skill(code);

CREATE TABLE academic.topic_skill (
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, skill_id)
);
```

- [ ] **Step 2: Tulis `022_academic_structure.down.sql`**

```sql
DROP TABLE IF EXISTS academic.topic_skill;
DROP TABLE IF EXISTS academic.skill;
DROP TABLE IF EXISTS academic.topic;
DROP TABLE IF EXISTS academic.learning_outcome;
DROP TABLE IF EXISTS academic.competency;
DROP TABLE IF EXISTS academic.subchapter;
DROP TABLE IF EXISTS academic.chapter;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic structure - chapter/topic/competency/outcome (phase 2)"
```

---

## Task 2D: Learning Path

**Files:**
- Create: `backend/migrations/023_academic_learning_path.up.sql` / `.down.sql`

- [ ] **Step 1: Tulis `023_academic_learning_path.up.sql`**

```sql
CREATE TABLE academic.learning_path (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    description text,
    estimated_hours int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_learning_path_grade_subject ON academic.learning_path(grade_id, subject_id);

CREATE TABLE academic.learning_path_topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id uuid NOT NULL REFERENCES academic.learning_path(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    sequence_no int NOT NULL DEFAULT 0,
    UNIQUE (learning_path_id, sequence_no)
);
CREATE INDEX idx_lp_topic_topic ON academic.learning_path_topic(topic_id);
```

- [ ] **Step 2: Tulis `023_academic_learning_path.down.sql`**

```sql
DROP TABLE IF EXISTS academic.learning_path_topic;
DROP TABLE IF EXISTS academic.learning_path;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic learning path (phase 2)"
```

---

## Task 2E: School & Calendar Events

**Files:**
- Create: `backend/migrations/024_academic_school.up.sql` / `.down.sql`

**Interfaces:**
- Produces `school`, `school_class`, `teacher_subject` (FK teacher → `identity.user`), `teacher_homeroom`, `academic_event`. Dipakai `finance.commission`, `ranking` (school scope).

- [ ] **Step 1: Tulis `024_academic_school.up.sql`**

```sql
CREATE TABLE academic.school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn varchar(20),
    name varchar(200) NOT NULL,
    province varchar(100),
    city varchar(100),
    district varchar(100),
    address text,
    phone varchar(30),
    email varchar(255),
    website text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_school_npsn ON academic.school(npsn) WHERE npsn IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_school_active ON academic.school(is_active);
CREATE TRIGGER trg_school_updated BEFORE UPDATE ON academic.school
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.school_class (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES academic.school(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE SET NULL,
    major_id uuid REFERENCES academic.major(id) ON DELETE SET NULL,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    name varchar(120) NOT NULL,
    capacity int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_school_class_school ON academic.school_class(school_id);

CREATE TABLE academic.teacher_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_id uuid REFERENCES academic.school(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    major_id uuid REFERENCES academic.major(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, school_id, subject_id, grade_id, major_id)
);

CREATE TABLE academic.teacher_homeroom (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_class_id uuid NOT NULL REFERENCES academic.school_class(id) ON DELETE CASCADE,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, school_class_id, academic_year_id)
);

CREATE TABLE academic.academic_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    semester_id uuid REFERENCES academic.semester(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    event_type varchar(20) CHECK (event_type IN ('PTS','PAS','LIBUR','PPDB','UTBK','AKM','TKA')),
    start_date date,
    end_date date,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_academic_event_range ON academic.academic_event(start_date, end_date);
```

- [ ] **Step 2: Tulis `024_academic_school.down.sql`**

```sql
DROP TABLE IF EXISTS academic.academic_event;
DROP TABLE IF EXISTS academic.teacher_homeroom;
DROP TABLE IF EXISTS academic.teacher_subject;
DROP TABLE IF EXISTS academic.school_class;
DROP TABLE IF EXISTS academic.school;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; commit setelah lulus. Verifikasi FK lintas schema: `SELECT conname FROM pg_constraint WHERE conrelid='academic.teacher_subject'::regclass AND confrelid='identity.user'::regclass;`.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic school & calendar (phase 2)"
```

---

## Task 2F: Academic Configuration

**Files:**
- Create: `backend/migrations/025_academic_config.up.sql` / `.down.sql`

**Interfaces:**
- Produces `academic.academic_configuration`.

- [ ] **Step 1: Tulis `025_academic_config.up.sql`**

```sql
CREATE TABLE academic.academic_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    active_academic_year uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    active_semester uuid REFERENCES academic.semester(id) ON DELETE SET NULL,
    default_curriculum uuid REFERENCES academic.curriculum(id) ON DELETE SET NULL,
    grading_method varchar(30) DEFAULT 'FLAT',
    minimum_score numeric(5,2) DEFAULT 0,
    passing_score numeric(5,2) DEFAULT 0,
    max_exam_retry int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_academic_config_updated BEFORE UPDATE ON academic.academic_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `025_academic_config.down.sql`**

```sql
DROP TABLE IF EXISTS academic.academic_configuration;
```

- [ ] **Step 3: Verifikasi** — `go run cmd/migrate/main.go up`; verifikasi jumlah tabel akademik = 23:
```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema='academic';
```
Expected: 23. Commit setelah lulus.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): academic configuration (phase 2) - completes academic domain (23 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 0–2 terpenuhi: Foundation (2 file), Identity (6 file, 35 tabel), Academic (6 file, 23 tabel). Konvensi §2 diterapkan (uuid PK, snake_case, timestamps, soft-delete pada master, CHECK enum, indeks unik/FK). Task 0A menangani pitfall `_migrations` saat drop `public` (recreate di dalam migrasi).

**Placeholder scan:** tidak ada TBD/TODO; semua SQL lengkap per task. Enum & indeks eksplisit.

**Type/name consistency:** seluruh schema namespace & nama tabel konsisten dengan design doc §4.1–4.2. Satu penyesuaian disengaja: `permission_scope` dihubungkan via `user_role.scope_id` (ABAC) — nama kolom dan referensi konsisten antar task (rbac → dipakai role_menu, dst.).

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase0-2.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**