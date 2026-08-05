-- Migration 199: monitoring configuration.

CREATE TABLE monitoring.monitoring_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key varchar(120) NOT NULL,
    config_value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (config_key)
);
CREATE TRIGGER trg_monitoring_configuration_updated BEFORE UPDATE ON monitoring.monitoring_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();