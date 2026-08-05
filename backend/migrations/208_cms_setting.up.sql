-- Migration 208: cms setting, language & translation.

CREATE TABLE cms.cms_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key varchar(120) NOT NULL,
    setting_value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (setting_key)
);
CREATE TRIGGER trg_cms_setting_updated BEFORE UPDATE ON cms.cms_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_language (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(10) NOT NULL,
    name varchar(120) NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);

CREATE TABLE cms.cms_translation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid NOT NULL REFERENCES cms.cms_language(id) ON DELETE CASCADE,
    table_name varchar(120),
    record_id uuid,
    field_name varchar(120),
    translated_text text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (language_id, table_name, record_id, field_name)
);
CREATE INDEX idx_cms_translation_language ON cms.cms_translation(language_id);
CREATE INDEX idx_cms_translation_record ON cms.cms_translation(table_name, record_id);