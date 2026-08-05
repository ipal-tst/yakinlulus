-- Migration 144: report scheduler & parameter definition.

CREATE TABLE report.report_scheduler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE CASCADE,
    cron_expression varchar(100) NOT NULL,
    next_run timestamptz,
    last_run timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_scheduler_definition ON report.report_scheduler(definition_id);
CREATE INDEX idx_report_scheduler_next ON report.report_scheduler(next_run);
CREATE INDEX idx_report_scheduler_active ON report.report_scheduler(active);
CREATE TRIGGER trg_report_scheduler_updated BEFORE UPDATE ON report.report_scheduler
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_parameter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    parameter_name varchar(80) NOT NULL,
    parameter_type varchar(30) NOT NULL DEFAULT 'STRING' CHECK (parameter_type IN ('STRING','INTEGER','BOOLEAN','FLOAT','DATE','DATETIME','JSON','ARRAY')),
    default_value jsonb,
    required boolean NOT NULL DEFAULT false,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, parameter_name)
);
CREATE INDEX idx_report_parameter_definition ON report.report_parameter(definition_id);
