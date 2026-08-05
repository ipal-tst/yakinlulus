-- Migration 141: report template & versioning.

CREATE TABLE report.report_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    layout jsonb,
    header text,
    footer text,
    orientation varchar(10) NOT NULL DEFAULT 'PORTRAIT' CHECK (orientation IN ('PORTRAIT','LANDSCAPE')),
    paper_size varchar(20) NOT NULL DEFAULT 'A4',
    logo text,
    theme varchar(50),
    version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_template_name ON report.report_template(name);
CREATE TRIGGER trg_report_template_updated BEFORE UPDATE ON report.report_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES report.report_template(id) ON DELETE CASCADE,
    version int NOT NULL,
    layout jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, version)
);
CREATE INDEX idx_report_version_template ON report.report_version(template_id);
