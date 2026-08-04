-- Migration 062: material content - block, section, section block, table of content, history.

CREATE TABLE content.material_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_version_id uuid NOT NULL REFERENCES content.material_version(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','VIDEO','AUDIO','LATEX','TABLE','SVG','GRAPH','CODE','HTML','MARKDOWN','QUIZ','CALLOUT','TIMELINE','EMBED','ACCORDION','CHECKLIST')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_block_version ON content.material_block(material_version_id);
CREATE INDEX idx_material_block_asset ON content.material_block(asset_id);

CREATE TABLE content.material_section (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_version_id uuid NOT NULL REFERENCES content.material_version(id) ON DELETE CASCADE,
    title varchar(200),
    description text,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_section_version ON content.material_section(material_version_id);

CREATE TABLE content.material_section_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid NOT NULL REFERENCES content.material_section(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','VIDEO','AUDIO','LATEX','TABLE','SVG','GRAPH','CODE','HTML','MARKDOWN','QUIZ','CALLOUT','TIMELINE','EMBED','ACCORDION','CHECKLIST')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_section_block_section ON content.material_section_block(section_id);
CREATE INDEX idx_material_section_block_asset ON content.material_section_block(asset_id);

CREATE TABLE content.material_table_of_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES content.material_table_of_content(id) ON DELETE SET NULL,
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_toc_material ON content.material_table_of_content(material_id);
CREATE INDEX idx_material_toc_parent ON content.material_table_of_content(parent_id);

CREATE TABLE content.material_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid REFERENCES content.material(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','APPROVE','PUBLISH','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_history_material ON content.material_history(material_id);
CREATE INDEX idx_material_history_time ON content.material_history(created_at);
