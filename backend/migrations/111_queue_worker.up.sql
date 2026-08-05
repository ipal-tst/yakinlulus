-- Migration 111: queue worker & worker heartbeat.

CREATE TABLE queue.queue_worker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name varchar(120) NOT NULL,
    hostname varchar(200),
    ip varchar(45),
    version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE','BUSY','PAUSED','DOWN')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    heartbeat timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (worker_name)
);
CREATE INDEX idx_queue_worker_status ON queue.queue_worker(status);
CREATE TRIGGER trg_queue_worker_updated BEFORE UPDATE ON queue.queue_worker
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.worker_heartbeat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES queue.queue_worker(id) ON DELETE CASCADE,
    cpu numeric(5,2),
    memory numeric(5,2),
    queue_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_heartbeat_worker ON queue.worker_heartbeat(worker_id, created_at);
