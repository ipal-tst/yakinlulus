-- Migration 190: monitored service & service instance (monitoring core).

CREATE TABLE monitoring.monitored_service (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code varchar(60) NOT NULL,
    service_name varchar(200) NOT NULL,
    service_type varchar(30) NOT NULL DEFAULT 'API' CHECK (service_type IN ('API','BACKEND','FRONTEND','DATABASE','REDIS','QUEUE','WORKER','STORAGE','SEARCH','AI','PAYMENT','AUTH','EMAIL','SMS','WHATSAPP','OCR','OTHER')),
    host_name varchar(200),
    ip_address varchar(45),
    port int,
    environment varchar(20) NOT NULL DEFAULT 'DEV' CHECK (environment IN ('LOCAL','DEV','STAGING','PRODUCTION')),
    version varchar(60),
    health_endpoint varchar(500),
    owner varchar(120),
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service_code)
);
CREATE INDEX idx_monitored_service_type ON monitoring.monitored_service(service_type);
CREATE TRIGGER trg_monitored_service_updated BEFORE UPDATE ON monitoring.monitored_service
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.service_instance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    instance_name varchar(200),
    container_name varchar(200),
    pod_name varchar(200),
    node_name varchar(200),
    hostname varchar(200),
    ip_address varchar(45),
    zone varchar(120),
    region varchar(120),
    status varchar(20) NOT NULL DEFAULT 'STARTING' CHECK (status IN ('STARTING','RUNNING','STOPPED','FAILED')),
    started_at timestamptz,
    last_heartbeat timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_instance_service ON monitoring.service_instance(service_id);
CREATE INDEX idx_service_instance_status ON monitoring.service_instance(status);
CREATE TRIGGER trg_service_instance_updated BEFORE UPDATE ON monitoring.service_instance
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.health_check (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    instance_id uuid REFERENCES monitoring.service_instance(id) ON DELETE CASCADE,
    check_type varchar(20) NOT NULL DEFAULT 'HTTP' CHECK (check_type IN ('HTTP','TCP','PING','SQL','REDIS','QUEUE','CUSTOM')),
    status varchar(20) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY','UNHEALTHY','DEGRADED')),
    response_time_ms int,
    http_status int,
    message text,
    checked_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_health_check_service ON monitoring.health_check(service_id);
CREATE INDEX idx_health_check_time ON monitoring.health_check(checked_at);