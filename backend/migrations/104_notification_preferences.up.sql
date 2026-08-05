-- Migration 104: notification preferences & user device.

CREATE TABLE notification.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES identity.user(id) ON DELETE CASCADE,
    allow_email boolean NOT NULL DEFAULT true,
    allow_push boolean NOT NULL DEFAULT true,
    allow_sms boolean NOT NULL DEFAULT true,
    allow_whatsapp boolean NOT NULL DEFAULT true,
    allow_in_app boolean NOT NULL DEFAULT true,
    allow_marketing boolean NOT NULL DEFAULT true,
    allow_exam boolean NOT NULL DEFAULT true,
    allow_payment boolean NOT NULL DEFAULT true,
    allow_learning boolean NOT NULL DEFAULT true,
    allow_ai boolean NOT NULL DEFAULT true,
    allow_system boolean NOT NULL DEFAULT true,
    quiet_hour_start time,
    quiet_hour_end time,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_notification_preferences_updated BEFORE UPDATE ON notification.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    device_uuid varchar(200) NOT NULL,
    device_name varchar(200),
    platform varchar(30),
    manufacturer varchar(100),
    model varchar(100),
    os varchar(50),
    app_version varchar(20),
    firebase_token text,
    onesignal_token text,
    last_login timestamptz,
    last_seen timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (device_uuid)
);
CREATE UNIQUE INDEX uq_notification_device_firebase ON notification.notification_device(firebase_token) WHERE firebase_token IS NOT NULL;
CREATE INDEX idx_notification_device_user ON notification.notification_device(user_id);
CREATE INDEX idx_notification_device_active ON notification.notification_device(active);
CREATE TRIGGER trg_notification_device_updated BEFORE UPDATE ON notification.notification_device
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
