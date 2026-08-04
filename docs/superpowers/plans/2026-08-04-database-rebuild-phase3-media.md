# Database Rebuild Phase 3 Implementation Plan (Media / DAM)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `media` (asset management / DAM) — 30 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.3.

**Architecture:** Migrasi berjalan di atas fondasi Phase 0–2 (schema `media` sudah ada dari migrasi 000; helper `shared.set_updated_at()` dari migrasi 001; referensi user dari `identity.user`, organization dari `identity.organization`, role dari `identity.role`). `media.asset` adalah pusat file — domain lain (`question`, `content`, `cms`) akan mereferensikannya via `asset_id`/`asset_reference`.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/030_media_core.{up,down}.sql` s.d. `036_media_delivery.{up,down}.sql` (7 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel (junction pakai composite PK).
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Soft delete `deleted_at` hanya pada tabel master (`media.asset`).
- Enum: `text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- Kolom token/secret tidak plaintext: `asset_share.password_hash` (hash, bukan raw).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner (di luar scope database).
- `media.asset` memakai FK `current_version_id → media.asset_version` yang saling rujuk → selesaikan dengan `ALTER TABLE ADD CONSTRAINT` setelah kedua tabel dibuat.

---

## Task 3A: Media Core — asset, asset_type, storage, version

**Files:**
- Create: `backend/migrations/030_media_core.up.sql`
- Create: `backend/migrations/030_media_core.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `identity.organization` (Phase 1), schema `media` (000), `shared.set_updated_at()` (001).
- Produces: `media.asset` (master file), `media.asset_type`, `media.storage_provider`, `media.asset_storage`, `media.asset_version`. Tabel lain mereferensikan `media.asset` via FK `asset_id`.

- [ ] **Step 1: Tulis `030_media_core.up.sql`**

```sql
-- Migration 030: media core - asset master, type, storage provider, storage, version.

CREATE TABLE media.asset_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    icon text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_asset_type_code ON media.asset_type(code);

CREATE TABLE media.storage_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(120) NOT NULL,
    endpoint text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_storage_provider_code ON media.storage_provider(code);
CREATE TRIGGER trg_storage_provider_updated BEFORE UPDATE ON media.storage_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_storage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES media.storage_provider(id) ON DELETE CASCADE,
    bucket varchar(120) NOT NULL,
    storage_path text,
    public_url text,
    cdn_url text,
    region varchar(60),
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_storage_provider ON media.asset_storage(provider_id);
CREATE TRIGGER trg_asset_storage_updated BEFORE UPDATE ON media.asset_storage
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code varchar(50) NOT NULL,
    original_name varchar(255),
    display_name varchar(255),
    asset_type_id uuid REFERENCES media.asset_type(id) ON DELETE SET NULL,
    mime_type varchar(120),
    extension varchar(20),
    size bigint NOT NULL DEFAULT 0,
    checksum_sha256 varchar(64),
    storage_id uuid REFERENCES media.asset_storage(id) ON DELETE SET NULL,
    current_version_id uuid,
    visibility text NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC','PRIVATE','PROTECTED')),
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED','DELETED')),
    uploaded_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_asset_code ON media.asset(asset_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_asset_checksum ON media.asset(checksum_sha256) WHERE checksum_sha256 IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_asset_type ON media.asset(asset_type_id);
CREATE INDEX idx_asset_storage ON media.asset(storage_id);
CREATE INDEX idx_asset_visibility ON media.asset(visibility);
CREATE INDEX idx_asset_status ON media.asset(status);
CREATE TRIGGER trg_asset_updated BEFORE UPDATE ON media.asset
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    file_name varchar(255),
    storage_path text,
    file_size bigint NOT NULL DEFAULT 0,
    checksum varchar(64),
    uploaded_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    change_note text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id, version)
);
CREATE INDEX idx_asset_version_asset ON media.asset_version(asset_id);

-- Circular FK: asset.current_version_id -> asset_version (resolved after both tables exist).
ALTER TABLE media.asset ADD CONSTRAINT fk_asset_current_version
    FOREIGN KEY (current_version_id) REFERENCES media.asset_version(id);
```

- [ ] **Step 2: Tulis `030_media_core.down.sql`**

```sql
ALTER TABLE media.asset DROP CONSTRAINT IF EXISTS fk_asset_current_version;
DROP TABLE IF EXISTS media.asset_version;
DROP TABLE IF EXISTS media.asset;
DROP TABLE IF EXISTS media.asset_storage;
DROP TABLE IF EXISTS media.storage_provider;
DROP TABLE IF EXISTS media.asset_type;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=030_media_core.up.sql`; `All migrations applied total=15`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **5**
- `SELECT count(*) FROM pg_constraint WHERE conrelid='media.asset'::regclass AND conname='fk_asset_current_version';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media core - asset/type/storage/version (phase 3)"
```

---

## Task 3B: Media Organize — category, folder, tag

**Files:**
- Create: `backend/migrations/031_media_organize.up.sql`
- Create: `backend/migrations/031_media_organize.down.sql`

**Interfaces:**
- Consumes: `media.asset`, `identity.organization`, `identity.user`.
- Produces: `media.asset_category`, `media.asset_folder`, `media.asset_folder_item`, `media.asset_tag`, `media.asset_tag_map`.

- [ ] **Step 1: Tulis `031_media_organize.up.sql`**

```sql
-- Migration 031: media organize - category, folder, tag.

CREATE TABLE media.asset_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES media.asset_category(id) ON DELETE CASCADE,
    code varchar(40) NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_asset_category_code ON media.asset_category(code);
CREATE INDEX idx_asset_category_parent ON media.asset_category(parent_id);

CREATE TABLE media.asset_folder (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES media.asset_folder(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES identity.organization(id) ON DELETE SET NULL,
    name varchar(200) NOT NULL,
    description text,
    path text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (parent_id, name)
);
CREATE INDEX idx_asset_folder_org ON media.asset_folder(organization_id);
CREATE TRIGGER trg_asset_folder_updated BEFORE UPDATE ON media.asset_folder
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_folder_item (
    folder_id uuid NOT NULL REFERENCES media.asset_folder(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    PRIMARY KEY (folder_id, asset_id)
);

CREATE TABLE media.asset_tag (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(80) NOT NULL,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_asset_tag_name ON media.asset_tag(name);

CREATE TABLE media.asset_tag_map (
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES media.asset_tag(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, tag_id)
);
CREATE INDEX idx_asset_tag_map_tag ON media.asset_tag_map(tag_id);
```

- [ ] **Step 2: Tulis `031_media_organize.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_tag_map;
DROP TABLE IF EXISTS media.asset_tag;
DROP TABLE IF EXISTS media.asset_folder_item;
DROP TABLE IF EXISTS media.asset_folder;
DROP TABLE IF EXISTS media.asset_category;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 031; `All migrations applied total=16`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **10**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media organize - category/folder/tag (phase 3)"
```

---

## Task 3C: Media Metadata — metadata, thumbnail, preview, conversion

**Files:**
- Create: `backend/migrations/032_media_metadata.up.sql`
- Create: `backend/migrations/032_media_metadata.down.sql`

**Interfaces:**
- Consumes: `media.asset`.
- Produces: `media.asset_metadata`, `media.asset_thumbnail`, `media.asset_preview`, `media.asset_conversion`.

- [ ] **Step 1: Tulis `032_media_metadata.up.sql`**

```sql
-- Migration 032: media metadata - metadata, thumbnail, preview, conversion.

CREATE TABLE media.asset_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    width int,
    height int,
    duration numeric(10,3),
    pages int,
    dpi int,
    language varchar(16),
    camera varchar(120),
    gps jsonb,
    json_metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id)
);

CREATE TABLE media.asset_thumbnail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    size varchar(20),
    path text,
    width int,
    height int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_thumbnail_asset ON media.asset_thumbnail(asset_id);

CREATE TABLE media.asset_preview (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    preview_path text,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_preview_asset ON media.asset_preview(asset_id);

CREATE TABLE media.asset_conversion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    source_format varchar(20),
    target_format varchar(20) NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED')),
    output_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_conversion_asset ON media.asset_conversion(asset_id);
CREATE INDEX idx_asset_conversion_status ON media.asset_conversion(status);
CREATE TRIGGER trg_asset_conversion_updated BEFORE UPDATE ON media.asset_conversion
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `032_media_metadata.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_conversion;
DROP TABLE IF EXISTS media.asset_preview;
DROP TABLE IF EXISTS media.asset_thumbnail;
DROP TABLE IF EXISTS media.asset_metadata;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 032; `All migrations applied total=17`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **14**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media metadata - metadata/thumbnail/preview/conversion (phase 3)"
```

---

## Task 3D: Media Relation & Share — relation, reference, permission, share

**Files:**
- Create: `backend/migrations/033_media_relation.up.sql`
- Create: `backend/migrations/033_media_relation.down.sql`

**Interfaces:**
- Consumes: `media.asset`, `identity.role`, `identity.user`.
- Produces: `media.asset_relation`, `media.asset_reference`, `media.asset_permission`, `media.asset_share`.

- [ ] **Step 1: Tulis `033_media_relation.up.sql`**

```sql
-- Migration 033: media relation & share - relation, reference (polymorphic), permission, share.

CREATE TABLE media.asset_relation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    child_asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    relation_type varchar(40) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (parent_asset_id, child_asset_id, relation_type)
);
CREATE INDEX idx_asset_relation_child ON media.asset_relation(child_asset_id);

CREATE TABLE media.asset_reference (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    module varchar(60) NOT NULL,
    entity varchar(60) NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_reference_lookup ON media.asset_reference(module, entity, entity_id);
CREATE INDEX idx_asset_reference_asset ON media.asset_reference(asset_id);

CREATE TABLE media.asset_permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    role_id uuid REFERENCES identity.role(id) ON DELETE CASCADE,
    permission text NOT NULL CHECK (permission IN ('READ','WRITE','DELETE','DOWNLOAD')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id, role_id, permission)
);
CREATE INDEX idx_asset_permission_role ON media.asset_permission(role_id);

CREATE TABLE media.asset_share (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    token varchar(64) NOT NULL,
    password_hash text,
    expired_at timestamptz,
    max_download int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_asset_share_token ON media.asset_share(token);
CREATE INDEX idx_asset_share_asset ON media.asset_share(asset_id);
```

- [ ] **Step 2: Tulis `033_media_relation.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_share;
DROP TABLE IF EXISTS media.asset_permission;
DROP TABLE IF EXISTS media.asset_reference;
DROP TABLE IF EXISTS media.asset_relation;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 033; `All migrations applied total=18`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **18**
Cek FK polimorfik (`asset_reference` tanpa FK entity — sesuai konvensi §5):
`SELECT count(*) FROM pg_constraint WHERE conrelid='media.asset_reference'::regclass;` → **1** (hanya FK ke asset)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media relation & share - relation/reference/permission/share (phase 3)"
```

---

## Task 3E: Media Access — download, usage, favorite, comment

**Files:**
- Create: `backend/migrations/034_media_access.up.sql`
- Create: `backend/migrations/034_media_access.down.sql`

**Interfaces:**
- Consumes: `media.asset`, `identity.user`.
- Produces: `media.asset_download`, `media.asset_usage`, `media.asset_favorite`, `media.asset_comment`.

- [ ] **Step 1: Tulis `034_media_access.up.sql`**

```sql
-- Migration 034: media access - download log, usage, favorite, comment.

CREATE TABLE media.asset_download (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    download_time timestamptz NOT NULL DEFAULT NOW(),
    ip varchar(45),
    device text
);
CREATE INDEX idx_asset_download_asset ON media.asset_download(asset_id);
CREATE INDEX idx_asset_download_user ON media.asset_download(user_id);
CREATE INDEX idx_asset_download_time ON media.asset_download(download_time);

CREATE TABLE media.asset_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    module varchar(60),
    entity varchar(60),
    entity_id uuid,
    used_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_usage_asset ON media.asset_usage(asset_id);
CREATE INDEX idx_asset_usage_lookup ON media.asset_usage(module, entity, entity_id);

CREATE TABLE media.asset_favorite (
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, user_id)
);
CREATE INDEX idx_asset_favorite_user ON media.asset_favorite(user_id);

CREATE TABLE media.asset_comment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_comment_asset ON media.asset_comment(asset_id);
CREATE TRIGGER trg_asset_comment_updated BEFORE UPDATE ON media.asset_comment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `034_media_access.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_comment;
DROP TABLE IF EXISTS media.asset_favorite;
DROP TABLE IF EXISTS media.asset_usage;
DROP TABLE IF EXISTS media.asset_download;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 034; `All migrations applied total=19`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **22**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media access - download/usage/favorite/comment (phase 3)"
```

---

## Task 3F: Media Lifecycle — archive, delete queue, scan, AI analysis, processing, audit

**Files:**
- Create: `backend/migrations/035_media_lifecycle.up.sql`
- Create: `backend/migrations/035_media_lifecycle.down.sql`

**Interfaces:**
- Consumes: `media.asset`, `identity.user`.
- Produces: `media.asset_archive`, `media.asset_delete_queue`, `media.asset_scan`, `media.asset_ai_analysis`, `media.asset_processing_job`, `media.asset_audit_log`.

- [ ] **Step 1: Tulis `035_media_lifecycle.up.sql`**

```sql
-- Migration 035: media lifecycle - archive, delete queue, scan, AI analysis, processing job, audit log.

CREATE TABLE media.asset_archive (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    archive_reason text,
    archived_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    archived_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_archive_asset ON media.asset_archive(asset_id);

CREATE TABLE media.asset_delete_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    scheduled_delete timestamptz,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','DELETED','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_delete_queue_status ON media.asset_delete_queue(status);
CREATE TRIGGER trg_asset_delete_queue_updated BEFORE UPDATE ON media.asset_delete_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_scan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    engine varchar(60) NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLEAN','INFECTED','ERROR')),
    scan_result jsonb,
    scanned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_scan_asset ON media.asset_scan(asset_id);
CREATE INDEX idx_asset_scan_status ON media.asset_scan(status);

CREATE TABLE media.asset_ai_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    provider varchar(60),
    analysis_type text NOT NULL CHECK (analysis_type IN ('OCR','QUESTION_PARSE','IMAGE_CLASSIFY')),
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_ai_analysis_asset ON media.asset_ai_analysis(asset_id);

CREATE TABLE media.asset_processing_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    job_type text NOT NULL CHECK (job_type IN ('OCR','TRANSCODE','THUMBNAIL','INDEX')),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_processing_asset ON media.asset_processing_job(asset_id);
CREATE INDEX idx_asset_processing_status ON media.asset_processing_job(status);

CREATE TABLE media.asset_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    action text NOT NULL CHECK (action IN ('UPLOAD','UPDATE','DELETE','DOWNLOAD','RESTORE')),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_audit_log_asset ON media.asset_audit_log(asset_id);
CREATE INDEX idx_asset_audit_log_time ON media.asset_audit_log(created_at);
```

- [ ] **Step 2: Tulis `035_media_lifecycle.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_audit_log;
DROP TABLE IF EXISTS media.asset_processing_job;
DROP TABLE IF EXISTS media.asset_ai_analysis;
DROP TABLE IF EXISTS media.asset_scan;
DROP TABLE IF EXISTS media.asset_delete_queue;
DROP TABLE IF EXISTS media.asset_archive;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 035; `All migrations applied total=20`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **28**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media lifecycle - archive/scan/ai/processing/audit (phase 3)"
```

---

## Task 3G: Media Delivery — cdn_provider, asset_cache

**Files:**
- Create: `backend/migrations/036_media_delivery.up.sql`
- Create: `backend/migrations/036_media_delivery.down.sql`

**Interfaces:**
- Consumes: `media.asset`.
- Produces: `media.cdn_provider`, `media.asset_cache`.

- [ ] **Step 1: Tulis `036_media_delivery.up.sql`**

```sql
-- Migration 036: media delivery - cdn provider, asset cache.

CREATE TABLE media.cdn_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(120) NOT NULL,
    endpoint text,
    region varchar(60),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_cdn_provider_name ON media.cdn_provider(name);
CREATE TRIGGER trg_cdn_provider_updated BEFORE UPDATE ON media.cdn_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid REFERENCES media.asset(id) ON DELETE CASCADE,
    cache_key varchar(255) NOT NULL,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_asset_cache_key ON media.asset_cache(cache_key);
CREATE INDEX idx_asset_cache_asset ON media.asset_cache(asset_id);
```

- [ ] **Step 2: Tulis `036_media_delivery.down.sql`**

```sql
DROP TABLE IF EXISTS media.asset_cache;
DROP TABLE IF EXISTS media.cdn_provider;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 036; `All migrations applied total=21`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='media';` → **30** ✓ (menyelesaikan domain media)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): media delivery - cdn/cache (phase 3) - completes media domain (30 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 3 (Media, 30 tabel) terpenuhi: 7 file migrasi (030–036), 30 tabel sesuai §4.3 katalog 1:1. Semua tabel dalam schema `media`. Tidak ada tabel katalog yang tertinggal (dicek manual terhadap §4.3: asset, asset_version, asset_type, asset_category, asset_folder, asset_folder_item, asset_tag, asset_tag_map, asset_metadata, asset_storage, storage_provider, asset_thumbnail, asset_preview, asset_conversion, asset_relation, asset_reference, asset_permission, asset_share, asset_download, asset_usage, asset_archive, asset_delete_queue, asset_scan, asset_ai_analysis, asset_processing_job, asset_audit_log, cdn_provider, asset_cache, asset_favorite, asset_comment = 30).

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, created_at/updated_at, deleted_at hanya pada `asset`, CHECK enum, indeks unik/FK). Circular FK `asset.current_version_id` diselesaikan via `ALTER TABLE ADD CONSTRAINT` (Task 3A). `asset_reference` polimorfik tanpa FK entity sesuai §5. Semua `*_id` user merujuk `identity.user`; `asset_folder.organization_id` merujuk `identity.organization`; `asset_permission.role_id` merujuk `identity.role` — konsisten dengan Phase 1.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase3-media.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
