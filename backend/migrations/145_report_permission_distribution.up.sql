-- Migration 145: report permission & distribution list.

CREATE TABLE report.report_permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    allow_view boolean NOT NULL DEFAULT false,
    allow_download boolean NOT NULL DEFAULT false,
    allow_schedule boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, role_id)
);
CREATE INDEX idx_report_permission_role ON report.report_permission(role_id);
CREATE TRIGGER trg_report_permission_updated BEFORE UPDATE ON report.report_permission
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_distribution_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    recipient_type varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (recipient_type IN ('EMAIL','WHATSAPP','TELEGRAM','ROLE','USER')),
    recipient varchar(255) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_distribution_definition ON report.report_distribution_list(definition_id);
CREATE INDEX idx_report_distribution_active ON report.report_distribution_list(active);
CREATE TRIGGER trg_report_distribution_updated BEFORE UPDATE ON report.report_distribution_list
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
