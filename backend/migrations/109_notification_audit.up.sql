-- Migration 109: notification statistics & audit log.

CREATE TABLE notification.notification_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    channel varchar(20) NOT NULL,
    total_sent int NOT NULL DEFAULT 0,
    total_delivered int NOT NULL DEFAULT 0,
    total_opened int NOT NULL DEFAULT 0,
    total_clicked int NOT NULL DEFAULT 0,
    total_failed int NOT NULL DEFAULT 0,
    delivery_rate numeric(5,2) NOT NULL DEFAULT 0,
    open_rate numeric(5,2) NOT NULL DEFAULT 0,
    click_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, channel)
);
CREATE INDEX idx_notification_statistics_channel ON notification.notification_statistics(channel);

CREATE TABLE notification.notification_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    actor_role varchar(30),
    action varchar(30) NOT NULL,
    table_name varchar(100) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address varchar(45),
    device varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_audit_actor ON notification.notification_audit_log(actor_id);
CREATE INDEX idx_notification_audit_table ON notification.notification_audit_log(table_name, record_id);
CREATE INDEX idx_notification_audit_time ON notification.notification_audit_log(created_at);
