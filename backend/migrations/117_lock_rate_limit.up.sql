-- Migration 117: distributed lock, rate limit, rate limit log.

CREATE TABLE queue.distributed_lock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lock_key varchar(200) NOT NULL,
    owner varchar(200),
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (lock_key)
);
CREATE TRIGGER trg_distributed_lock_updated BEFORE UPDATE ON queue.distributed_lock
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.rate_limit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(200) NOT NULL,
    limit_count int NOT NULL DEFAULT 100,
    window_second int NOT NULL DEFAULT 60,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (service)
);
CREATE TRIGGER trg_rate_limit_updated BEFORE UPDATE ON queue.rate_limit
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.rate_limit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(200) NOT NULL,
    key varchar(200),
    allowed boolean NOT NULL DEFAULT true,
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_log_service ON queue.rate_limit_log(service, requested_at);
CREATE INDEX idx_rate_limit_log_allowed ON queue.rate_limit_log(allowed);
