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
