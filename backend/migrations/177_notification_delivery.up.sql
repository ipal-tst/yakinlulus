-- Migration 177: notification delivery/open and ai request/generation/chat/ocr logs (append-only).

CREATE TABLE audit.notification_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid,
    channel varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL','WA','SMS','PUSH')),
    provider varchar(60),
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('QUEUED','SENT','FAILED','RETRY')),
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_delivery_time ON audit.notification_delivery(created_at);

CREATE TABLE audit.notification_open (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    opened_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_open_user ON audit.notification_open(user_id);

CREATE TABLE audit.ai_request_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(60),
    model varchar(120),
    token int,
    latency_ms int,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_request_log_user ON audit.ai_request_log(user_id);
CREATE INDEX idx_ai_request_log_time ON audit.ai_request_log(created_at);

CREATE TABLE audit.ai_generation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    type varchar(60),
    input_tokens int,
    output_tokens int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_generation_log_request ON audit.ai_generation_log(request_id);

CREATE TABLE audit.ai_chat_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    session_id uuid,
    message text,
    response text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_chat_log_user ON audit.ai_chat_log(user_id);
CREATE INDEX idx_ai_chat_log_time ON audit.ai_chat_log(created_at);

CREATE TABLE audit.ai_ocr_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    duration_ms int,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','PENDING')),
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_ocr_log_time ON audit.ai_ocr_log(created_at);