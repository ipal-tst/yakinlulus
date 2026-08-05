-- Migration 183: api rate limit, usage statistics & error catalog.

CREATE TABLE integration.api_rate_limit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    endpoint_id uuid REFERENCES integration.api_endpoint(id) ON DELETE CASCADE,
    window_type varchar(20) NOT NULL DEFAULT 'MINUTE' CHECK (window_type IN ('SECOND','MINUTE','HOUR','DAY')),
    limit_request int NOT NULL DEFAULT 0,
    remaining_request int NOT NULL DEFAULT 0,
    reset_time timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_rate_limit_provider ON integration.api_rate_limit(provider_id);
CREATE TRIGGER trg_api_rate_limit_updated BEFORE UPDATE ON integration.api_rate_limit
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.api_usage_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    endpoint_id uuid REFERENCES integration.api_endpoint(id) ON DELETE CASCADE,
    date date NOT NULL,
    total_request int NOT NULL DEFAULT 0,
    success_request int NOT NULL DEFAULT 0,
    failed_request int NOT NULL DEFAULT 0,
    avg_latency numeric(10,2),
    max_latency int,
    min_latency int,
    total_data_sent bigint,
    total_data_received bigint,
    estimated_cost numeric(12,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, endpoint_id, date)
);
CREATE INDEX idx_api_usage_statistics_date ON integration.api_usage_statistics(date);

CREATE TABLE integration.api_error_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    error_code varchar(60) NOT NULL,
    error_name varchar(200),
    description text,
    severity varchar(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    recommended_action text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, error_code)
);