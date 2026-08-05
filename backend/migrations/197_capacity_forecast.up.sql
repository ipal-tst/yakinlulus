-- Migration 197: capacity forecast, business metrics, worker metrics & storage metrics.

CREATE TABLE monitoring.capacity_forecast (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    forecast_date date NOT NULL,
    predicted_cpu numeric(6,2),
    predicted_memory bigint,
    predicted_storage bigint,
    predicted_bandwidth bigint,
    prediction_model varchar(120),
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_capacity_forecast_service ON monitoring.capacity_forecast(service_id);
CREATE INDEX idx_capacity_forecast_date ON monitoring.capacity_forecast(forecast_date);

CREATE TABLE monitoring.business_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date date NOT NULL,
    active_user int,
    online_user int,
    new_registration int,
    active_exam int,
    completed_exam int,
    question_answered bigint,
    revenue numeric(16,2),
    conversion_rate numeric(6,2),
    retention_rate numeric(6,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (metric_date)
);

CREATE TABLE monitoring.worker_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name varchar(120),
    job_running int,
    job_success int,
    job_failed int,
    avg_duration numeric(10,2),
    memory_usage bigint,
    cpu_usage numeric(5,2),
    heartbeat timestamptz,
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_metrics_name ON monitoring.worker_metrics(worker_name);
CREATE INDEX idx_worker_metrics_time ON monitoring.worker_metrics(captured_at);

CREATE TABLE monitoring.storage_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(60),
    bucket varchar(120),
    used_storage bigint,
    free_storage bigint,
    object_count bigint,
    upload_count bigint,
    download_count bigint,
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_storage_metrics_provider ON monitoring.storage_metrics(provider, bucket);
CREATE INDEX idx_storage_metrics_time ON monitoring.storage_metrics(captured_at);