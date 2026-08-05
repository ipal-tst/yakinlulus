-- Migration 196: synthetic monitor & result.

CREATE TABLE monitoring.synthetic_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_name varchar(200) NOT NULL,
    url varchar(500) NOT NULL,
    method varchar(10) NOT NULL DEFAULT 'GET' CHECK (method IN ('GET','POST','PUT','DELETE','HEAD')),
    interval_second int NOT NULL DEFAULT 60,
    expected_status int NOT NULL DEFAULT 200,
    expected_response text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_synthetic_monitor_enabled ON monitoring.synthetic_monitor(enabled);
CREATE TRIGGER trg_synthetic_monitor_updated BEFORE UPDATE ON monitoring.synthetic_monitor
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.synthetic_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id uuid NOT NULL REFERENCES monitoring.synthetic_monitor(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','TIMEOUT')),
    response_time int,
    http_status int,
    error text,
    checked_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_synthetic_result_monitor ON monitoring.synthetic_result(monitor_id);
CREATE INDEX idx_synthetic_result_time ON monitoring.synthetic_result(checked_at);