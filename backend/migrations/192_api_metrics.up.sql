-- Migration 192: api metrics, endpoint availability & error metrics.

CREATE TABLE monitoring.api_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    endpoint varchar(500),
    http_method varchar(10),
    request_count int NOT NULL DEFAULT 0,
    success_count int NOT NULL DEFAULT 0,
    failed_count int NOT NULL DEFAULT 0,
    avg_latency numeric(10,2),
    p95_latency numeric(10,2),
    p99_latency numeric(10,2),
    max_latency int,
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_metrics_service ON monitoring.api_metrics(service_id, endpoint);
CREATE INDEX idx_api_metrics_time ON monitoring.api_metrics(captured_at);

CREATE TABLE monitoring.endpoint_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    endpoint varchar(500),
    uptime_percentage numeric(6,2),
    downtime_second bigint,
    availability_status varchar(20) NOT NULL DEFAULT 'UP' CHECK (availability_status IN ('UP','DOWN','DEGRADED')),
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_endpoint_availability_service ON monitoring.endpoint_availability(service_id);
CREATE INDEX idx_endpoint_availability_time ON monitoring.endpoint_availability(captured_at);

CREATE TABLE monitoring.error_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    error_type varchar(120),
    error_count int NOT NULL DEFAULT 0,
    critical_count int NOT NULL DEFAULT 0,
    warning_count int NOT NULL DEFAULT 0,
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_error_metrics_service ON monitoring.error_metrics(service_id);
CREATE INDEX idx_error_metrics_time ON monitoring.error_metrics(captured_at);