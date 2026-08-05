-- Migration 100: notification template & channel.

CREATE TABLE notification.notification_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    category varchar(30) NOT NULL CHECK (category IN ('SYSTEM','EXAM','LEARNING','MEMBERSHIP','PAYMENT','SECURITY','PROMOTION','REMINDER','AI','ANNOUNCEMENT')),
    title_template text,
    body_template text,
    email_subject varchar(300),
    email_template text,
    whatsapp_template text,
    sms_template text,
    push_title varchar(200),
    push_body text,
    variables jsonb,
    language varchar(10) NOT NULL DEFAULT 'id',
    version int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code, version, language)
);
CREATE INDEX idx_notification_template_category ON notification.notification_template(category);
CREATE INDEX idx_notification_template_active ON notification.notification_template(is_active);
CREATE INDEX idx_notification_template_created_by ON notification.notification_template(created_by);
CREATE TRIGGER trg_notification_template_updated BEFORE UPDATE ON notification.notification_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_channel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL CHECK (code IN ('EMAIL','PUSH','WHATSAPP','SMS','IN_APP','TELEGRAM')),
    name varchar(100) NOT NULL,
    provider varchar(100),
    active boolean NOT NULL DEFAULT true,
    priority int NOT NULL DEFAULT 0,
    rate_limit_per_minute int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_notification_channel_code ON notification.notification_channel(code);
CREATE INDEX idx_notification_channel_active ON notification.notification_channel(active);
CREATE TRIGGER trg_notification_channel_updated BEFORE UPDATE ON notification.notification_channel
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
