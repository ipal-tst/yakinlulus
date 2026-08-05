-- Migration 172: role/permission change, access denied, security & suspicious logs (append-only).

CREATE TABLE audit.role_change_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_role varchar(60),
    new_role varchar(60),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_role_change_log_target ON audit.role_change_log(target_user);

CREATE TABLE audit.permission_change_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    permission varchar(120),
    old_value jsonb,
    new_value jsonb,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_permission_change_log_perm ON audit.permission_change_log(permission);

CREATE TABLE audit.access_denied_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    endpoint varchar(500),
    reason text,
    ip varchar(45),
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_access_denied_log_user ON audit.access_denied_log(user_id);
CREATE INDEX idx_access_denied_log_time ON audit.access_denied_log(created_at);

CREATE TABLE audit.security_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event varchar(40) NOT NULL CHECK (event IN ('FAILED_LOGIN','TOKEN_EXPIRED','SQL_INJECTION','XSS','CSRF','FILE_SCAN')),
    ip varchar(45),
    severity varchar(20) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARNING','CRITICAL')),
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_event_type ON audit.security_event(event);
CREATE INDEX idx_security_event_time ON audit.security_event(created_at);

CREATE TABLE audit.suspicious_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    activity text,
    risk_score numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suspicious_activity_user ON audit.suspicious_activity(user_id);

CREATE TABLE audit.account_lock_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    reason text,
    locked_at timestamptz NOT NULL DEFAULT NOW(),
    unlocked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_account_lock_log_user ON audit.account_lock_log(user_id);