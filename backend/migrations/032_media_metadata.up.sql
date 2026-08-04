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
