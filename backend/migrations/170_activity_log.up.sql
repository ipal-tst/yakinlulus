-- Migration 170: activity & audit core (append-only).

CREATE TABLE audit.activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    organization_id uuid,
    module varchar(60),
    entity varchar(120),
    entity_id uuid,
    action varchar(20) NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','READ','DOWNLOAD','EXPORT','IMPORT','APPROVE','PUBLISH','RESTORE')),
    metadata jsonb,
    ip_address varchar(45),
    device varchar(120),
    browser varchar(120),
    platform varchar(60),
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_user ON audit.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON audit.activity_log(entity, entity_id);
CREATE INDEX idx_activity_log_created ON audit.activity_log(created_at);
CREATE INDEX idx_activity_log_request ON audit.activity_log(request_id);

CREATE TABLE audit.activity_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL CHECK (code IN ('LOGIN','LOGOUT','CREATE','UPDATE','DELETE','EXPORT','IMPORT','VIEW')),
    name varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);

CREATE TABLE audit.activity_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(30) NOT NULL CHECK (name IN ('SECURITY','ACADEMIC','FINANCE','SYSTEM','AI')),
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);

CREATE TABLE audit.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    entity_type varchar(120),
    entity_id uuid,
    action varchar(30) NOT NULL,
    before_data jsonb,
    after_data jsonb,
    reason text,
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit.audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit.audit_log(created_at);

CREATE TABLE audit.audit_entity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name varchar(120) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (entity_name)
);

CREATE TABLE audit.audit_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type varchar(120),
    entity_id uuid,
    snapshot jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_snapshot_entity ON audit.audit_snapshot(entity_type, entity_id);
CREATE INDEX idx_audit_snapshot_created ON audit.audit_snapshot(created_at);