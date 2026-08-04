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
