-- Migration 103: notification history & user inbox.

CREATE TABLE notification.notification_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL,
    title varchar(300),
    body text,
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING','SENT','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_history_user ON notification.notification_history(user_id);
CREATE INDEX idx_notification_history_template ON notification.notification_history(template_id);
CREATE INDEX idx_notification_history_channel ON notification.notification_history(channel);
CREATE INDEX idx_notification_history_time ON notification.notification_history(created_at);

CREATE TABLE notification.user_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    notification_history_id uuid REFERENCES notification.notification_history(id) ON DELETE SET NULL,
    title varchar(300) NOT NULL,
    body text,
    image_url text,
    action_url text,
    action_type varchar(30),
    icon varchar(120),
    badge int NOT NULL DEFAULT 0,
    priority int NOT NULL DEFAULT 0,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_notification_user ON notification.user_notification(user_id, is_read);
CREATE INDEX idx_user_notification_history ON notification.user_notification(notification_history_id);
CREATE INDEX idx_user_notification_read ON notification.user_notification(is_read);
CREATE TRIGGER trg_user_notification_updated BEFORE UPDATE ON notification.user_notification
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
