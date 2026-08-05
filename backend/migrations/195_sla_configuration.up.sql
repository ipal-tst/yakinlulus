-- Migration 195: sla configuration & report.

CREATE TABLE monitoring.sla_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    availability_target numeric(6,2) NOT NULL DEFAULT 99.9,
    response_target int NOT NULL DEFAULT 300,
    error_rate_target numeric(6,2) NOT NULL DEFAULT 1,
    uptime_target numeric(6,2) NOT NULL DEFAULT 99.9,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service_id)
);
CREATE TRIGGER trg_sla_configuration_updated BEFORE UPDATE ON monitoring.sla_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.sla_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    period varchar(20) NOT NULL,
    uptime numeric(6,2),
    availability numeric(6,2),
    average_response int,
    error_rate numeric(6,2),
    sla_pass boolean NOT NULL DEFAULT true,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sla_report_service ON monitoring.sla_report(service_id);
CREATE INDEX idx_sla_report_period ON monitoring.sla_report(period);