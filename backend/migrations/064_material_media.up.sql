-- Migration 064: material media - attachment, thumbnail, subtitle, transcript.

CREATE TABLE content.material_attachment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    attachment_type varchar(20) NOT NULL DEFAULT 'SUPPORT' CHECK (attachment_type IN ('PRIMARY','SUPPORT','DOWNLOAD')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_attachment_material ON content.material_attachment(material_id);
CREATE INDEX idx_material_attachment_asset ON content.material_attachment(asset_id);

CREATE TABLE content.material_thumbnail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_subtitle (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    language varchar(16) NOT NULL DEFAULT 'id',
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, language)
);
CREATE INDEX idx_material_subtitle_asset ON content.material_subtitle(asset_id);

CREATE TABLE content.material_transcript (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
