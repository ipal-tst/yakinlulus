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