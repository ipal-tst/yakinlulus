-- Migration 101: notification provider & event.
-- Deviasi: api_key/secret_key kolom text biasa; enkripsi app-layer.

CREATE TABLE notification.notification_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES notification.notification_channel(id) ON DELETE CASCADE,
    provider_name varchar(100) NOT NULL,
    api_key text,
    secret_key text,
    endpoint text,
    active boolean NOT NULL DEFAULT true,
    priority int NOT NULL DEFAULT 0,
    config jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_provider_channel ON notification.notification_provider(channel_id);
CREATE INDEX idx_notification_provider_active ON notification.notification_provider(active);
CREATE TRIGGER trg_notification_provider_updated BEFORE UPDATE ON notification.notification_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(100) NOT NULL,
    event_type varchar(30) NOT NULL,
    reference_type varchar(50),
    reference_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    payload jsonb,
    priority int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSED','FAILED','CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_event_name ON notification.notification_event(event_name);
CREATE INDEX idx_notification_event_user ON notification.notification_event(user_id);
CREATE INDEX idx_notification_event_status ON notification.notification_event(status);
CREATE INDEX idx_notification_event_scheduled ON notification.notification_event(scheduled_at);
-- Kolom reference_type/reference_id: uuid TANPA FK (event-driven, per 5).
