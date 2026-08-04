CREATE TABLE identity.login_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    access_token text NOT NULL,
    refresh_token text,
    expired_at timestamptz NOT NULL,
    logout_at timestamptz,
    ip varchar(45),
    device text,
    browser text,
    os text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_session_user ON identity.login_session(user_id);
CREATE INDEX idx_login_session_refresh ON identity.login_session(refresh_token);

CREATE TABLE identity.device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    device_uuid varchar(64) NOT NULL,
    device_name varchar(200),
    platform varchar(20),
    last_active timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_device ON identity.device(user_id, device_uuid);

CREATE TABLE identity.trusted_device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id uuid NOT NULL REFERENCES identity.device(id) ON DELETE CASCADE,
    verified_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE identity.otp_request (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    type varchar(10) NOT NULL CHECK (type IN ('EMAIL','SMS','WA')),
    code varchar(16) NOT NULL,
    expired_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_user ON identity.otp_request(user_id);

CREATE TABLE identity.password_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_history_user ON identity.password_history(user_id);

CREATE TABLE identity.password_reset (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_reset_token ON identity.password_reset(token);

CREATE TABLE identity.email_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_verification_token ON identity.email_verification(token);

CREATE TABLE identity.api_token (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token text NOT NULL,
    scope text,
    expired_at timestamptz,
    last_used timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_api_token ON identity.api_token(token);

CREATE TABLE identity.mfa_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    method varchar(10) NOT NULL CHECK (method IN ('TOTP','EMAIL','SMS','WA')),
    secret text,
    is_enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_mfa_user ON identity.mfa_configuration(user_id);
CREATE TRIGGER trg_mfa_updated BEFORE UPDATE ON identity.mfa_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.refresh_token_blacklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL,
    expired_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_blacklist_token ON identity.refresh_token_blacklist(token);

CREATE TABLE identity.user_agreement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    agreement_type varchar(20) NOT NULL CHECK (agreement_type IN ('PRIVACY','TERM')),
    version varchar(30) NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_agreement ON identity.user_agreement(user_id, agreement_type, version);
