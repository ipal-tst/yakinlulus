-- Migration 116: workflow, workflow step, execution, task dependency.

CREATE TABLE queue.workflow (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    description text,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE INDEX idx_workflow_status ON queue.workflow(status);
CREATE TRIGGER trg_workflow_updated BEFORE UPDATE ON queue.workflow
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.workflow_step (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES queue.workflow(id) ON DELETE CASCADE,
    step_order int NOT NULL DEFAULT 0,
    job_type varchar(120) NOT NULL,
    config jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (workflow_id, step_order)
);
CREATE INDEX idx_workflow_step_workflow ON queue.workflow_step(workflow_id, step_order);
CREATE TRIGGER trg_workflow_step_updated BEFORE UPDATE ON queue.workflow_step
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE queue.workflow_execution (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES queue.workflow(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCESS','FAILED','CANCELLED')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workflow_execution_workflow ON queue.workflow_execution(workflow_id, started_at);
CREATE INDEX idx_workflow_execution_status ON queue.workflow_execution(status);

CREATE TABLE queue.task_dependency (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    depends_on uuid NOT NULL REFERENCES queue.queue_job(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (task, depends_on)
);
CREATE INDEX idx_task_dependency_depends ON queue.task_dependency(depends_on);
