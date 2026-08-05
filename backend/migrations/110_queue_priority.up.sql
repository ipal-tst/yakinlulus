-- Migration 110: queue priority, queue definition, queue payload.

CREATE TABLE queue.queue_priority (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(20) NOT NULL CHECK (name IN ('LOW','NORMAL','HIGH','CRITICAL')),
    weight int NOT NULL DEFAULT 10,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE TRIGGER trg_queue_priority_updated BEFORE UPDATE ON queue.queue_priority
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_definition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name varchar(120) NOT NULL,
    description text,
    max_retry int NOT NULL DEFAULT 3,
    retry_delay_second int NOT NULL DEFAULT 60,
    priority int NOT NULL DEFAULT 10,
    visibility_timeout int NOT NULL DEFAULT 30,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_queue_definition_name ON queue.queue_definition(queue_name);
CREATE INDEX idx_queue_definition_enabled ON queue.queue_definition(enabled, priority);
CREATE TRIGGER trg_queue_definition_updated BEFORE UPDATE ON queue.queue_definition
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.queue_payload (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb NOT NULL,
    checksum varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_queue_payload_checksum ON queue.queue_payload(checksum);
