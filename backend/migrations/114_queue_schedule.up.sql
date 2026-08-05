-- Migration 114: queue schedule, cron job, recurring task.

CREATE TABLE queue.queue_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES queue.queue_definition(id) ON DELETE CASCADE,
    cron_expression varchar(100) NOT NULL,
    timezone varchar(60) NOT NULL DEFAULT 'Asia/Jakarta',
    enabled boolean NOT NULL DEFAULT true,
    next_run timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queue_schedule_queue ON queue.queue_schedule(queue_id);
CREATE INDEX idx_queue_schedule_enabled ON queue.queue_schedule(enabled, next_run);
CREATE TRIGGER trg_queue_schedule_updated BEFORE UPDATE ON queue.queue_schedule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.cron_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(200) NOT NULL,
    expression varchar(100) NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_name)
);
CREATE INDEX idx_cron_job_enabled ON queue.cron_job(enabled);
CREATE TRIGGER trg_cron_job_updated BEFORE UPDATE ON queue.cron_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.recurring_task (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    interval_second int NOT NULL DEFAULT 60,
    last_run timestamptz,
    next_run timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE INDEX idx_recurring_task_next ON queue.recurring_task(next_run);
CREATE TRIGGER trg_recurring_task_updated BEFORE UPDATE ON queue.recurring_task
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
