-- Migration 108: notification scheduler & rule.

CREATE TABLE notification.notification_scheduler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    cron_expression varchar(100) NOT NULL,
    next_run timestamptz,
    last_run timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_scheduler_template ON notification.notification_scheduler(template_id);
CREATE INDEX idx_notification_scheduler_next ON notification.notification_scheduler(next_run);
CREATE INDEX idx_notification_scheduler_active ON notification.notification_scheduler(active);
CREATE TRIGGER trg_notification_scheduler_updated BEFORE UPDATE ON notification.notification_scheduler
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_rule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(100) NOT NULL,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL,
    priority int NOT NULL DEFAULT 0,
    delay_second int NOT NULL DEFAULT 0,
    condition jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (event_name, channel)
);
CREATE INDEX idx_notification_rule_template ON notification.notification_rule(template_id);
CREATE INDEX idx_notification_rule_active ON notification.notification_rule(active);
CREATE TRIGGER trg_notification_rule_updated BEFORE UPDATE ON notification.notification_rule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
