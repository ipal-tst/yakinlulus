-- Migration 035: media lifecycle - archive, delete queue, scan, AI analysis, processing job, audit log.

CREATE TABLE media.asset_archive (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    archive_reason text,
    archived_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    archived_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_archive_asset ON media.asset_archive(asset_id);

CREATE TABLE media.asset_delete_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    scheduled_delete timestamptz,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','DELETED','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_delete_queue_status ON media.asset_delete_queue(status);
CREATE TRIGGER trg_asset_delete_queue_updated BEFORE UPDATE ON media.asset_delete_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE media.asset_scan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    engine varchar(60) NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLEAN','INFECTED','ERROR')),
    scan_result jsonb,
    scanned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_scan_asset ON media.asset_scan(asset_id);
CREATE INDEX idx_asset_scan_status ON media.asset_scan(status);

CREATE TABLE media.asset_ai_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    provider varchar(60),
    analysis_type text NOT NULL CHECK (analysis_type IN ('OCR','QUESTION_PARSE','IMAGE_CLASSIFY')),
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_ai_analysis_asset ON media.asset_ai_analysis(asset_id);

CREATE TABLE media.asset_processing_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    job_type text NOT NULL CHECK (job_type IN ('OCR','TRANSCODE','THUMBNAIL','INDEX')),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_processing_asset ON media.asset_processing_job(asset_id);
CREATE INDEX idx_asset_processing_status ON media.asset_processing_job(status);

CREATE TABLE media.asset_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    action text NOT NULL CHECK (action IN ('UPLOAD','UPDATE','DELETE','DOWNLOAD','RESTORE')),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asset_audit_log_asset ON media.asset_audit_log(asset_id);
CREATE INDEX idx_asset_audit_log_time ON media.asset_audit_log(created_at);
