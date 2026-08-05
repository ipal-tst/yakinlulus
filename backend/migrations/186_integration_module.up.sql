-- Migration 186: integration module, provider health check & incident.

CREATE TABLE integration.integration_module (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    module_name varchar(200) NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    priority int NOT NULL DEFAULT 0,
    fallback_provider varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_integration_module_provider ON integration.integration_module(provider_id);
CREATE TRIGGER trg_integration_module_updated BEFORE UPDATE ON integration.integration_module
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.provider_health_check (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'UP' CHECK (status IN ('UP','DOWN','DEGRADED')),
    latency_ms int,
    http_code int,
    checked_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_provider_health_check_provider ON integration.provider_health_check(provider_id);
CREATE INDEX idx_provider_health_check_time ON integration.provider_health_check(checked_at);

CREATE TABLE integration.provider_incident (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    description text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    resolved_at timestamptz,
    impact_level varchar(20) NOT NULL DEFAULT 'MEDIUM' CHECK (impact_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED','MONITORING')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_provider_incident_provider ON integration.provider_incident(provider_id);
CREATE INDEX idx_provider_incident_status ON integration.provider_incident(status);