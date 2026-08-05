-- Migration 181: api request/response log & webhook endpoint.

CREATE TABLE integration.api_request_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    endpoint_id uuid REFERENCES integration.api_endpoint(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    module varchar(60),
    request_method varchar(10),
    request_url varchar(500),
    request_headers jsonb,
    request_body jsonb,
    payload_hash varchar(64),
    request_size int,
    sent_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_request_log_request ON integration.api_request_log(request_id);
CREATE INDEX idx_api_request_log_provider ON integration.api_request_log(provider_id);
CREATE INDEX idx_api_request_log_sent ON integration.api_request_log(sent_at);

CREATE TABLE integration.api_response_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    status_code int,
    response_headers jsonb,
    response_body jsonb,
    response_size int,
    latency_ms int,
    success boolean NOT NULL DEFAULT true,
    provider_reference varchar(255),
    error_code varchar(60),
    error_message text,
    received_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_response_log_request ON integration.api_response_log(request_id);
CREATE INDEX idx_api_response_log_time ON integration.api_response_log(received_at);

CREATE TABLE integration.webhook_endpoint (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    endpoint_name varchar(200) NOT NULL,
    url varchar(500),
    secret_key varchar(500),
    signature_algorithm varchar(20) NOT NULL DEFAULT 'HMAC' CHECK (signature_algorithm IN ('HMAC','SHA256','RSA','NONE')),
    is_active boolean NOT NULL DEFAULT true,
    verification_enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhook_endpoint_provider ON integration.webhook_endpoint(provider_id);
CREATE TRIGGER trg_webhook_endpoint_updated BEFORE UPDATE ON integration.webhook_endpoint
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();