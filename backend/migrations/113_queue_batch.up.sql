-- Migration 113: queue batch & batch_job junction.

CREATE TABLE queue.queue_batch (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name varchar(200) NOT NULL,
    total_job int NOT NULL DEFAULT 0,
    completed int NOT NULL DEFAULT 0,
    failed int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (batch_name)
);
CREATE TRIGGER trg_queue_batch_updated BEFORE UPDATE ON queue.queue_batch
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.batch_job (
    batch_id uuid NOT NULL REFERENCES queue.queue_batch(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (batch_id, job_id)
);
CREATE INDEX idx_batch_job_job ON queue.batch_job(job_id);
