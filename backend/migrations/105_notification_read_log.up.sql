-- Migration 105: notification read log & broadcast.

CREATE TABLE notification.notification_read_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid NOT NULL REFERENCES notification.user_notification(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    opened_at timestamptz,
    clicked_at timestamptz,
    device varchar(200),
    platform varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_read_log_notification ON notification.notification_read_log(notification_id);
CREATE INDEX idx_notification_read_log_user ON notification.notification_read_log(user_id);

CREATE TABLE notification.broadcast (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    description text,
    target_type varchar(20) NOT NULL DEFAULT 'ALL' CHECK (target_type IN ('ALL','STUDENT','TEACHER','STAFF','SCHOOL','PREMIUM','FREE')),
    target_filter jsonb,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','SENDING','SENT','CANCELLED','FAILED')),
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_broadcast_target ON notification.broadcast(target_type);
CREATE INDEX idx_broadcast_status ON notification.broadcast(status);
CREATE INDEX idx_broadcast_template ON notification.broadcast(template_id);
CREATE INDEX idx_broadcast_created_by ON notification.broadcast(created_by);
CREATE TRIGGER trg_broadcast_updated BEFORE UPDATE ON notification.broadcast
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
