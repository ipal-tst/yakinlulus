-- Migration 171: login/logout/password/otp/mfa logs (append-only).

CREATE TABLE audit.login_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    email varchar(255),
    login_time timestamptz NOT NULL DEFAULT NOW(),
    logout_time timestamptz,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','LOCKED')),
    ip varchar(45),
    device varchar(120),
    browser varchar(120),
    location varchar(255),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_log_user ON audit.login_log(user_id);
CREATE INDEX idx_login_log_time ON audit.login_log(login_time);
CREATE INDEX idx_login_log_status ON audit.login_log(status);

CREATE TABLE audit.logout_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    logout_time timestamptz NOT NULL DEFAULT NOW(),
    ip varchar(45),
    device varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_logout_log_user ON audit.logout_log(user_id);

CREATE TABLE audit.password_change_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    ip varchar(45),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_change_log_user ON audit.password_change_log(user_id);

CREATE TABLE audit.password_reset_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    email varchar(255),
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    status varchar(20) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','SENT','USED','EXPIRED','FAILED')),
    ip varchar(45),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_reset_log_user ON audit.password_reset_log(user_id);

CREATE TABLE audit.otp_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL','SMS','WA','TOTP')),
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','VERIFIED','EXPIRED','FAILED')),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_log_user ON audit.otp_log(user_id);

CREATE TABLE audit.mfa_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    method varchar(20) NOT NULL CHECK (method IN ('TOTP','EMAIL','SMS','WA')),
    status varchar(20) NOT NULL DEFAULT 'ENABLED' CHECK (status IN ('ENABLED','DISABLED','VERIFIED','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mfa_log_user ON audit.mfa_log(user_id);