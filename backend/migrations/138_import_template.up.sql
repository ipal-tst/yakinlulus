-- Migration 138: import template & document version.

CREATE TABLE ocr.import_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module varchar(30) CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    template_name varchar(120) NOT NULL,
    template_version varchar(30) NOT NULL DEFAULT '1.0',
    schema_json jsonb,
    sample_file text,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (module, template_name, template_version)
);
CREATE INDEX idx_import_template_module ON ocr.import_template(module);
CREATE TRIGGER trg_import_template_updated BEFORE UPDATE ON ocr.import_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.document_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES ocr.import_file(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    change_log text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, version)
);
CREATE INDEX idx_document_version_file ON ocr.document_version(file_id);