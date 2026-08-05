-- Migration 140: report category & definition (catalog core).

CREATE TABLE report.report_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL CHECK (code IN ('ACADEMIC','FINANCE','ANALYTICS','SECURITY','MEMBERSHIP','SYSTEM','SCHOOL','AI')),
    name varchar(200) NOT NULL,
    description text,
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_report_category_code ON report.report_category(code);
CREATE INDEX idx_report_category_active ON report.report_category(active);
CREATE TRIGGER trg_report_category_updated BEFORE UPDATE ON report.report_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_definition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(80) NOT NULL,
    name varchar(200) NOT NULL,
    category_id uuid REFERENCES report.report_category(id) ON DELETE SET NULL,
    description text,
    query_name varchar(200),
    template_id uuid,
    default_format varchar(10) NOT NULL DEFAULT 'PDF' CHECK (default_format IN ('PDF','EXCEL','CSV','JSON','XML')),
    allow_schedule boolean NOT NULL DEFAULT false,
    allow_export boolean NOT NULL DEFAULT true,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_report_definition_code ON report.report_definition(code);
CREATE INDEX idx_report_definition_category ON report.report_definition(category_id);
CREATE INDEX idx_report_definition_active ON report.report_definition(active);
CREATE INDEX idx_report_definition_created_by ON report.report_definition(created_by);
CREATE TRIGGER trg_report_definition_updated BEFORE UPDATE ON report.report_definition
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
