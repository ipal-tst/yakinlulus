-- Migration 191: service metrics, database metrics & redis metrics.

CREATE TABLE monitoring.service_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    instance_id uuid REFERENCES monitoring.service_instance(id) ON DELETE CASCADE,
    metric_time timestamptz NOT NULL DEFAULT NOW(),
    cpu_usage numeric(5,2),
    memory_usage bigint,
    disk_usage bigint,
    network_in bigint,
    network_out bigint,
    request_per_second numeric(10,2),
    error_rate numeric(5,2),
    success_rate numeric(5,2),
    active_connection int,
    queue_length int,
    thread_count int,
    gc_time numeric(10,2),
    uptime numeric(12,2),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_metrics_service ON monitoring.service_metrics(service_id);
CREATE INDEX idx_service_metrics_time ON monitoring.service_metrics(metric_time);

CREATE TABLE monitoring.database_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    database_name varchar(120),
    active_connection int,
    idle_connection int,
    max_connection int,
    transaction_per_second numeric(10,2),
    query_per_second numeric(10,2),
    slow_query int,
    deadlock int,
    cache_hit_ratio numeric(5,2),
    replication_delay numeric(10,2),
    disk_size bigint,
    table_size bigint,
    index_size bigint,
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_database_metrics_name ON monitoring.database_metrics(database_name);
CREATE INDEX idx_database_metrics_time ON monitoring.database_metrics(captured_at);

CREATE TABLE monitoring.redis_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance varchar(120),
    memory_used bigint,
    memory_peak bigint,
    connected_client int,
    key_count int,
    hit_rate numeric(5,2),
    miss_rate numeric(5,2),
    evicted_key bigint,
    expired_key bigint,
    ops_per_second numeric(10,2),
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_redis_metrics_instance ON monitoring.redis_metrics(instance);
CREATE INDEX idx_redis_metrics_time ON monitoring.redis_metrics(captured_at);

CREATE TABLE monitoring.queue_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name varchar(120),
    waiting_job int,
    processing_job int,
    completed_job int,
    failed_job int,
    retry_job int,
    worker_count int,
    avg_processing_time numeric(10,2),
    captured_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_metrics_name ON monitoring.queue_metrics(queue_name);
CREATE INDEX idx_queue_metrics_time ON monitoring.queue_metrics(captured_at);