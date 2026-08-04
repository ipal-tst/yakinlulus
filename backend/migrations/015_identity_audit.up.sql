CREATE TABLE identity.login_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    login_time timestamptz NOT NULL DEFAULT NOW(),
    logout_time timestamptz,
    ip varchar(45),
    country varchar(100),
    city varchar(100),
    browser text,
    device text,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('FAILED','SUCCESS','LOCKED'))
);
CREATE INDEX idx_login_history_user ON identity.login_history(user_id);
CREATE INDEX idx_login_history_time ON identity.login_history(login_time);

CREATE TABLE identity.activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    module varchar(60),
    action text NOT NULL,
    entity varchar(60),
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_user ON identity.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON identity.activity_log(entity, entity_id);
CREATE INDEX idx_activity_log_time ON identity.activity_log(created_at);

CREATE TABLE identity.security_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    event varchar(40) NOT NULL CHECK (event IN ('FAILED_LOGIN','OTP','PASSWORD_CHANGE','ROLE_CHANGE','MFA')),
    ip varchar(45),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_log_user ON identity.security_log(user_id);
CREATE INDEX idx_security_log_time ON identity.security_log(created_at);

CREATE TABLE identity.impersonation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    target_user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    reason text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz
);
CREATE INDEX idx_impersonation_admin ON identity.impersonation_log(admin_id);

CREATE TABLE identity.user_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    old_status varchar(20),
    new_status varchar(20) NOT NULL,
    reason text,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_status_history_user ON identity.user_status_history(user_id);
