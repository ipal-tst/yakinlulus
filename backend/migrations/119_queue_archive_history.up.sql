-- Migration 119: metrics, archive, history, notification queue. Completes queue domain (35 tables).

CREATE TABLE queue.queue_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue varchar(200) NOT NULL,
    avg_latency numeric(12,2) NOT NULL DEFAULT 0,
    throughput numeric(12,2) NOT NULL DEFAULT 0,
    success_rate numeric(5,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_metrics_queue ON queue.queue_metrics(queue, observed_at);

CREATE TABLE queue.worker_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    jobs_processed int NOT NULL DEFAULT 0,
    avg_duration_ms numeric(12,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_metrics_worker ON queue.worker_metrics(worker_id, observed_at);

CREATE TABLE queue.scheduler_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES queue.queue_schedule(id) ON DELETE CASCADE,
    missed_runs int NOT NULL DEFAULT 0,
    avg_latency_ms numeric(12,2) NOT NULL DEFAULT 0,
    observed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_metrics_schedule ON queue.scheduler_metrics(schedule_id, observed_at);

CREATE TABLE queue.archived_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_job_id uuid,
    queue_id uuid,
    job_type varchar(120),
    status varchar(20),
    payload_id uuid,
    priority int,
    attempt int,
    max_attempt int,
    worker_id uuid,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    archived_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archived_job_queue ON queue.archived_job(queue_id, archived_at);
CREATE INDEX idx_archived_job_type ON queue.archived_job(job_type);

CREATE TABLE queue.archived_payload (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb,
    checksum varchar(64),
    archived_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archived_payload_time ON queue.archived_payload(archived_at);

CREATE TABLE queue.job_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_history_job ON queue.job_history(job_id, changed_at);
CREATE INDEX idx_job_history_status ON queue.job_history(status);

CREATE TABLE queue.worker_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL,
    performed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_history_worker ON queue.worker_history(worker_id, performed_at);

CREATE TABLE queue.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid REFERENCES queue.queue_definition(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL','WHATSAPP','PUSH','SMS','IN_APP')),
    recipient varchar(255),
    template_code varchar(120),
    subject varchar(255),
    body text,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','CANCELLED')),
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_queue_channel ON queue.notification_queue(channel, status);
CREATE INDEX idx_notification_queue_queue ON queue.notification_queue(queue_id);
CREATE TRIGGER trg_notification_queue_updated BEFORE UPDATE ON queue.notification_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
