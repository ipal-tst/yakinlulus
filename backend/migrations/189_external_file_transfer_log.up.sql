-- Migration 189: external file transfer log, callback queue & api configuration.

CREATE TABLE integration.external_file_transfer_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    operation varchar(20) NOT NULL DEFAULT 'UPLOAD' CHECK (operation IN ('UPLOAD','DOWNLOAD','DELETE','MOVE','COPY')),
    filename varchar(255),
    mime_type varchar(120),
    size bigint,
    duration_ms int,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','IN_PROGRESS')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_file_transfer_provider ON integration.external_file_transfer_log(provider_id);
CREATE INDEX idx_file_transfer_time ON integration.external_file_transfer_log(created_at);

CREATE TABLE integration.callback_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    request_id uuid,
    callback_url varchar(500),
    payload jsonb,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','RETRY')),
    retry_count int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_callback_queue_request ON integration.callback_queue(request_id);
CREATE INDEX idx_callback_queue_status ON integration.callback_queue(status);

CREATE TABLE integration.api_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    key varchar(120) NOT NULL,
    value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, key)
);
CREATE TRIGGER trg_api_configuration_updated BEFORE UPDATE ON integration.api_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();