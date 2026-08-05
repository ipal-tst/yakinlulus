-- Migration 112: queue job, retry, dead letter.

CREATE TABLE queue.queue_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES queue.queue_definition(id) ON DELETE CASCADE,
    job_type varchar(120) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING','DELAYED','RUNNING','SUCCESS','FAILED','RETRY','DEAD','CANCELLED')),
    payload_id uuid REFERENCES queue.queue_payload(id) ON DELETE SET NULL,
    priority int NOT NULL DEFAULT 10,
    attempt int NOT NULL DEFAULT 0,
    max_attempt int NOT NULL DEFAULT 3,
    worker_id uuid REFERENCES queue.queue_worker(id) ON DELETE SET NULL,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_job_queue_status ON queue.queue_job(queue_id, status)
    WHERE status IN ('WAITING','DELAYED','RUNNING','RETRY');
CREATE INDEX idx_queue_job_payload ON queue.queue_job(payload_id);
CREATE INDEX idx_queue_job_worker ON queue.queue_job(worker_id);
CREATE INDEX idx_queue_job_scheduled ON queue.queue_job(scheduled_at);
CREATE TRIGGER trg_queue_job_updated BEFORE UPDATE ON queue.queue_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_retry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    retry_no int NOT NULL DEFAULT 1,
    error text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, retry_no)
);

CREATE TABLE queue.queue_dead_letter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    reason text,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id)
);
