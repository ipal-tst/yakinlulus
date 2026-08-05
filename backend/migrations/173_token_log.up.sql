-- Migration 173: token/session/device/api logs (append-only).

CREATE TABLE audit.token_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    token_type varchar(30) NOT NULL DEFAULT 'JWT' CHECK (token_type IN ('JWT','REFRESH','OTP','API_KEY','RESET')),
    action varchar(20) NOT NULL DEFAULT 'ISSUED' CHECK (action IN ('ISSUED','REVOKED','EXPIRED','VERIFIED')),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_token_log_user ON audit.token_log(user_id);

CREATE TABLE audit.session_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    session_id uuid,
    ip varchar(45),
    device varchar(120),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_session_log_user ON audit.session_log(user_id);

CREATE TABLE audit.trusted_device_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    device_fingerprint varchar(255),
    device_name varchar(120),
    trusted_at timestamptz NOT NULL DEFAULT NOW(),
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trusted_device_user ON audit.trusted_device_log(user_id);

CREATE TABLE audit.api_request_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    endpoint varchar(500),
    method varchar(10),
    status_code int,
    latency_ms int,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    ip varchar(45),
    request_size int,
    response_size int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_request_log_time ON audit.api_request_log(created_at);
CREATE INDEX idx_api_request_log_endpoint ON audit.api_request_log(endpoint);
CREATE INDEX idx_api_request_log_request_id ON audit.api_request_log(request_id);

CREATE TABLE audit.api_error_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    status_code int,
    error_code varchar(60),
    error_message text,
    stack_trace text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_error_log_request ON audit.api_error_log(request_id);
CREATE INDEX idx_api_error_log_time ON audit.api_error_log(created_at);

CREATE TABLE audit.api_rate_limit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    endpoint varchar(500),
    limit_value int,
    reset_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_rate_limit_user ON audit.api_rate_limit_log(user_id);