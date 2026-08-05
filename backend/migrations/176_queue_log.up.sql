-- Migration 176: queue/websocket/worker/notification logs (append-only).

CREATE TABLE audit.queue_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name varchar(120),
    event varchar(60),
    job_count int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_log_name ON audit.queue_log(queue_name);
CREATE INDEX idx_queue_log_time ON audit.queue_log(created_at);

CREATE TABLE audit.websocket_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    connection_id uuid,
    event varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_websocket_log_user ON audit.websocket_log(user_id);
CREATE INDEX idx_websocket_log_time ON audit.websocket_log(created_at);

CREATE TABLE audit.worker_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type varchar(120),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED','RETRY')),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_job_type ON audit.worker_job(job_type);

CREATE TABLE audit.worker_retry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid,
    attempt int NOT NULL DEFAULT 1,
    last_error text,
    next_retry_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_retry_job ON audit.worker_retry(job_id);

CREATE TABLE audit.worker_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name varchar(120),
    pending int NOT NULL DEFAULT 0,
    processing int NOT NULL DEFAULT 0,
    failed int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_queue_name ON audit.worker_queue(queue_name);

CREATE TABLE audit.notification_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL','WA','SMS','PUSH')),
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('QUEUED','SENT','FAILED','READ')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_log_user ON audit.notification_log(user_id);
CREATE INDEX idx_notification_log_time ON audit.notification_log(created_at);