-- Migration 142: report execution job & export artifact. Partisi bulanan DITUNDA (plain table, index pada created_at).

CREATE TABLE report.report_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE SET NULL,
    requested_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    parameter jsonb,
    started_at timestamptz,
    finished_at timestamptz,
    duration_second int,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_job_definition ON report.report_job(definition_id);
CREATE INDEX idx_report_job_requested_by ON report.report_job(requested_by);
CREATE INDEX idx_report_job_status ON report.report_job(status);
CREATE INDEX idx_report_job_created ON report.report_job(created_at);
CREATE TRIGGER trg_report_job_updated BEFORE UPDATE ON report.report_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE report.report_export (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES report.report_job(id) ON DELETE CASCADE,
    format varchar(10) NOT NULL CHECK (format IN ('PDF','EXCEL','CSV','JSON','XML')),
    storage_provider varchar(50),
    file_path text,
    file_size bigint NOT NULL DEFAULT 0,
    checksum varchar(64),
    download_count int NOT NULL DEFAULT 0,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_export_job ON report.report_export(job_id);
CREATE INDEX idx_report_export_format ON report.report_export(format);
CREATE INDEX idx_report_export_created ON report.report_export(created_at);
