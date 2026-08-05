-- Migration 115: scheduler history & scheduled event.

CREATE TABLE queue.scheduler_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type varchar(30),
    job_id uuid REFERENCES queue.queue_job(id) ON DELETE SET NULL,
    schedule_id uuid REFERENCES queue.queue_schedule(id) ON DELETE SET NULL,
    cron_job_id uuid REFERENCES queue.cron_job(id) ON DELETE SET NULL,
    task_id uuid REFERENCES queue.recurring_task(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','SKIPPED','RUNNING')),
    error text,
    run_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduler_history_run ON queue.scheduler_history(run_at);
CREATE INDEX idx_scheduler_history_status ON queue.scheduler_history(status);
CREATE INDEX idx_scheduler_history_job ON queue.scheduler_history(job_id);

CREATE TABLE queue.scheduled_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(200) NOT NULL,
    trigger_at timestamptz NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','TRIGGERED','CANCELLED','EXPIRED')),
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduled_event_trigger ON queue.scheduled_event(trigger_at, status);
