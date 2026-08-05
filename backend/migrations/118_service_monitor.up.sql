-- Migration 118: background service, service health, queue/worker/scheduler monitors.

CREATE TABLE queue.background_service (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name varchar(200) NOT NULL,
    version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'STOPPED' CHECK (status IN ('RUNNING','STOPPED','PAUSED','ERROR')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service_name)
);
CREATE INDEX idx_background_service_status ON queue.background_service(status);
CREATE TRIGGER trg_background_service_updated BEFORE UPDATE ON queue.background_service
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.service_health (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name varchar(200) NOT NULL,
    status varchar(20) NOT NULL CHECK (status IN ('HEALTHY','DEGRADED','DOWN','UNKNOWN')),
    checked_at timestamptz NOT NULL DEFAULT NOW(),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_health_name ON queue.service_health(service_name, checked_at);

CREATE TABLE queue.queue_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue varchar(200) NOT NULL,
    waiting int NOT NULL DEFAULT 0,
    running int NOT NULL DEFAULT 0,
    failed int NOT NULL DEFAULT 0,
    dead int NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_monitor_queue ON queue.queue_monitor(queue, observed_at);

CREATE TABLE queue.worker_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL CHECK (status IN ('IDLE','BUSY','PAUSED','DOWN')),
    job_running int NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_monitor_worker ON queue.worker_monitor(worker_id, observed_at);

CREATE TABLE queue.scheduler_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES queue.queue_schedule(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','MISSED','ERROR','PAUSED')),
    last_run_at timestamptz,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_monitor_schedule ON queue.scheduler_monitor(schedule_id, observed_at);
