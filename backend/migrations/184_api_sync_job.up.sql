-- Migration 184: api sync job & history.

CREATE TABLE integration.api_sync_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    job_name varchar(200) NOT NULL,
    module varchar(60),
    sync_direction varchar(20) NOT NULL DEFAULT 'IMPORT' CHECK (sync_direction IN ('IMPORT','EXPORT','BIDIRECTIONAL')),
    schedule varchar(120),
    cron_expression varchar(120),
    last_sync timestamptz,
    next_sync timestamptz,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','FAILED','SUCCESS')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_sync_job_provider ON integration.api_sync_job(provider_id);
CREATE TRIGGER trg_api_sync_job_updated BEFORE UPDATE ON integration.api_sync_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.api_sync_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES integration.api_sync_job(id) ON DELETE CASCADE,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz,
    duration_ms int,
    record_processed int NOT NULL DEFAULT 0,
    success_count int NOT NULL DEFAULT 0,
    failed_count int NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCESS','FAILED','PARTIAL')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_sync_history_job ON integration.api_sync_history(job_id);
CREATE INDEX idx_api_sync_history_time ON integration.api_sync_history(started_at);