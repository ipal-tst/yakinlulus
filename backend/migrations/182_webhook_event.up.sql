-- Migration 182: webhook event, webhook log & api retry queue.

CREATE TABLE integration.webhook_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    event_name varchar(200) NOT NULL,
    event_type varchar(60),
    description text,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhook_event_provider ON integration.webhook_event(provider_id);
CREATE TRIGGER trg_webhook_event_updated BEFORE UPDATE ON integration.webhook_event
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.webhook_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    event_id uuid REFERENCES integration.webhook_event(id) ON DELETE SET NULL,
    request_id uuid,
    headers jsonb,
    payload jsonb,
    signature varchar(255),
    signature_valid boolean,
    status varchar(20) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','PROCESSED','FAILED','RETRY')),
    processing_time int,
    response jsonb,
    retry_count int NOT NULL DEFAULT 0,
    received_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhook_log_request ON integration.webhook_log(request_id);
CREATE INDEX idx_webhook_log_time ON integration.webhook_log(received_at);

CREATE TABLE integration.api_retry_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    endpoint_id uuid REFERENCES integration.api_endpoint(id) ON DELETE CASCADE,
    payload jsonb,
    attempt int NOT NULL DEFAULT 0,
    max_attempt int NOT NULL DEFAULT 3,
    next_retry timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED','CANCELLED')),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_retry_queue_request ON integration.api_retry_queue(request_id);
CREATE INDEX idx_api_retry_queue_status ON integration.api_retry_queue(status);
CREATE TRIGGER trg_api_retry_queue_updated BEFORE UPDATE ON integration.api_retry_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();