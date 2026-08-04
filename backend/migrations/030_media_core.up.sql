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
