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
