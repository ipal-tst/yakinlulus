-- Migration 167: sms, push & notification template configuration.

CREATE TABLE config.sms_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(40),
    api_key varchar(255),
    sender_name varchar(40),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_sms_configuration_updated BEFORE UPDATE ON config.sms_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.push_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(40),
    api_key varchar(255),
    app_id varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_push_configuration_updated BEFORE UPDATE ON config.push_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.notification_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL','PUSH','WHATSAPP','SMS','IN_APP')),
    code varchar(120) NOT NULL,
    subject varchar(500),
    body text,
    variables jsonb,
    language varchar(10) NOT NULL DEFAULT 'id',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (channel, code, language)
);
CREATE TRIGGER trg_notification_template_updated BEFORE UPDATE ON config.notification_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();