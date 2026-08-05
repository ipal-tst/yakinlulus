-- Migration 169: analytics/dashboard, cron/scheduler, integration, feature, backup, maintenance, versioning.

CREATE TABLE config.analytics_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id varchar(120),
    provider varchar(40),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_analytics_configuration_updated BEFORE UPDATE ON config.analytics_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.dashboard_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    layout jsonb,
    refresh_second int NOT NULL DEFAULT 60,
    default_period varchar(20) NOT NULL DEFAULT 'WEEK' CHECK (default_period IN ('DAY','WEEK','MONTH','QUARTER','YEAR')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_dashboard_configuration_updated BEFORE UPDATE ON config.dashboard_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.cron_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(120) NOT NULL,
    cron_expression varchar(120) NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    last_run timestamptz,
    next_run timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_name)
);
CREATE TRIGGER trg_cron_job_updated BEFORE UPDATE ON config.cron_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.scheduler_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timezone varchar(60) NOT NULL DEFAULT 'Asia/Jakarta',
    heartbeat_check boolean NOT NULL DEFAULT true,
    retry_policy jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_scheduler_configuration_updated BEFORE UPDATE ON config.scheduler_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.integration_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(20) NOT NULL CHECK (provider IN ('SLACK','GOOGLE','ZOOM','TELEGRAM','WEBHOOK')),
    name varchar(200),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_integration_provider_updated BEFORE UPDATE ON config.integration_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.webhook_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url varchar(500) NOT NULL,
    secret varchar(255),
    events jsonb,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_webhook_configuration_updated BEFORE UPDATE ON config.webhook_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.api_integration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    base_url varchar(500),
    auth_type varchar(30) NOT NULL DEFAULT 'API_KEY' CHECK (auth_type IN ('API_KEY','OAUTH2','JWT','BASIC')),
    api_key varchar(255),
    config jsonb,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_api_integration_updated BEFORE UPDATE ON config.api_integration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.feature_flag (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(120) NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    rollout_percentage int NOT NULL DEFAULT 100,
    environment varchar(20) NOT NULL DEFAULT 'PRODUCTION' CHECK (environment IN ('DEV','STAGING','UAT','PRODUCTION')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code, environment)
);
CREATE TRIGGER trg_feature_flag_updated BEFORE UPDATE ON config.feature_flag
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.feature_target (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id uuid NOT NULL REFERENCES config.feature_flag(id) ON DELETE CASCADE,
    target_type varchar(20) NOT NULL DEFAULT 'USER' CHECK (target_type IN ('USER','ROLE','ORGANIZATION','PERCENTAGE')),
    target_value varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (flag_id, target_type, target_value)
);
CREATE INDEX idx_feature_target_flag ON config.feature_target(flag_id);

CREATE TABLE config.backup_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency varchar(30) NOT NULL DEFAULT 'DAILY' CHECK (frequency IN ('HOURLY','DAILY','WEEKLY','MONTHLY')),
    retention int NOT NULL DEFAULT 30,
    compression boolean NOT NULL DEFAULT true,
    storage varchar(60),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_backup_configuration_updated BEFORE UPDATE ON config.backup_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.restore_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    allowed_sources jsonb,
    conflict_policy varchar(30) NOT NULL DEFAULT 'SKIP' CHECK (conflict_policy IN ('SKIP','OVERWRITE','RENAME')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_restore_configuration_updated BEFORE UPDATE ON config.restore_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.maintenance_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    start timestamptz NOT NULL,
    finish timestamptz,
    message text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_maintenance_schedule_updated BEFORE UPDATE ON config.maintenance_schedule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.maintenance_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid REFERENCES config.maintenance_schedule(id) ON DELETE SET NULL,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz,
    note text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_maintenance_history_schedule ON config.maintenance_history(schedule_id);

CREATE TABLE config.configuration_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version int NOT NULL,
    published_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (version)
);

CREATE TABLE config.configuration_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id uuid NOT NULL REFERENCES config.configuration_version(id) ON DELETE CASCADE,
    snapshot jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (version_id)
);

CREATE TABLE config.configuration_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    before_json jsonb,
    after_json jsonb,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_configuration_history_changed_at ON config.configuration_history(changed_at);

CREATE TABLE config.configuration_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    config varchar(120),
    old jsonb,
    new jsonb,
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_configuration_audit_user ON config.configuration_audit(user_id);
CREATE INDEX idx_configuration_audit_created ON config.configuration_audit(created_at);