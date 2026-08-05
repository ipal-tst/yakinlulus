-- Migration 143: report generation history & delivery. Partisi bulanan DITUNDA (plain table, index waktu).

CREATE TABLE report.report_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid REFERENCES report.report_definition(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    parameter jsonb,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('QUEUED','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    downloaded boolean NOT NULL DEFAULT false,
    downloaded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_history_definition ON report.report_history(definition_id);
CREATE INDEX idx_report_history_user ON report.report_history(user_id);
CREATE INDEX idx_report_history_generated ON report.report_history(generated_at);
CREATE INDEX idx_report_history_downloaded ON report.report_history(downloaded);

CREATE TABLE report.report_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES report.report_job(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL','WHATSAPP','TELEGRAM','DOWNLOAD')),
    recipient varchar(255),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','CANCELLED','READ')),
    sent_at timestamptz,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_delivery_job ON report.report_delivery(job_id);
CREATE INDEX idx_report_delivery_channel ON report.report_delivery(channel);
CREATE INDEX idx_report_delivery_status ON report.report_delivery(status);
CREATE INDEX idx_report_delivery_sent ON report.report_delivery(sent_at);
CREATE TRIGGER trg_report_delivery_updated BEFORE UPDATE ON report.report_delivery
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
