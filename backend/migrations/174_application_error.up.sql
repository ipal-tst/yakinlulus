-- Migration 174: application/database/worker/frontend errors, system event & config change (append-only).

CREATE TABLE audit.application_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(120),
    module varchar(120),
    error_code varchar(60),
    message text,
    stack_trace text,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_application_error_time ON audit.application_error(created_at);
CREATE INDEX idx_application_error_service ON audit.application_error(service);

CREATE TABLE audit.database_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    db_error_code varchar(60),
    message text,
    query text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_database_error_time ON audit.database_error(created_at);

CREATE TABLE audit.worker_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid,
    error text,
    stack_trace text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_worker_error_job ON audit.worker_error(job_id);

CREATE TABLE audit.frontend_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    url varchar(500),
    message text,
    stack_trace text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_frontend_error_time ON audit.frontend_error(created_at);

CREATE TABLE audit.system_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(120),
    event varchar(120),
    started_at timestamptz,
    finished_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_system_event_service ON audit.system_event(service);
CREATE INDEX idx_system_event_time ON audit.system_event(created_at);

CREATE TABLE audit.configuration_change (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key varchar(120),
    old_value jsonb,
    new_value jsonb,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_configuration_change_time ON audit.configuration_change(created_at);