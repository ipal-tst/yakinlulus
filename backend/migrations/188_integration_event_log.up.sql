-- Migration 188: integration event log, ai provider model & ai usage log.

CREATE TABLE integration.integration_event_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    module varchar(60),
    event_type varchar(30) NOT NULL CHECK (event_type IN ('CONNECT','DISCONNECT','TOKEN_REFRESH','RETRY','TIMEOUT','WEBHOOK','SYNC','ERROR')),
    description text,
    performed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_integration_event_log_provider ON integration.integration_event_log(provider_id);
CREATE INDEX idx_integration_event_log_time ON integration.integration_event_log(created_at);

CREATE TABLE integration.ai_provider_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    model_name varchar(120) NOT NULL,
    version varchar(60),
    context_window int,
    max_output_token int,
    cost_input numeric(12,6),
    cost_output numeric(12,6),
    supports_image boolean NOT NULL DEFAULT false,
    supports_audio boolean NOT NULL DEFAULT false,
    supports_video boolean NOT NULL DEFAULT false,
    supports_function_call boolean NOT NULL DEFAULT false,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DEPRECATED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_provider_model_provider ON integration.ai_provider_model(provider_id);
CREATE TRIGGER trg_ai_provider_model_updated BEFORE UPDATE ON integration.ai_provider_model
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.ai_usage_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE SET NULL,
    model_id uuid REFERENCES integration.ai_provider_model(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    module varchar(60),
    prompt_token int NOT NULL DEFAULT 0,
    completion_token int NOT NULL DEFAULT 0,
    total_token int NOT NULL DEFAULT 0,
    latency_ms int,
    estimated_cost numeric(12,6),
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_log_provider ON integration.ai_usage_log(provider_id);
CREATE INDEX idx_ai_usage_log_user ON integration.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_time ON integration.ai_usage_log(created_at);