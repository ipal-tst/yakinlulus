-- Migration 194: alert, alert event & alert notification.

CREATE TABLE monitoring.alert (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_name varchar(200) NOT NULL,
    alert_type varchar(30) NOT NULL DEFAULT 'CUSTOM' CHECK (alert_type IN ('CPU','MEMORY','DATABASE','API','NETWORK','QUEUE','SECURITY','CUSTOM')),
    severity varchar(20) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO','WARNING','HIGH','CRITICAL')),
    condition_expression text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alert_type ON monitoring.alert(alert_type);
CREATE TRIGGER trg_alert_updated BEFORE UPDATE ON monitoring.alert
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.alert_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL REFERENCES monitoring.alert(id) ON DELETE CASCADE,
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE SET NULL,
    trigger_value numeric(12,4),
    threshold numeric(12,4),
    status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
    triggered_at timestamptz NOT NULL DEFAULT NOW(),
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alert_event_alert ON monitoring.alert_event(alert_id);
CREATE INDEX idx_alert_event_status ON monitoring.alert_event(status);

CREATE TABLE monitoring.alert_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_event_id uuid NOT NULL REFERENCES monitoring.alert_event(id) ON DELETE CASCADE,
    channel varchar(20) NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL','SMS','WHATSAPP','PUSH','SLACK','DISCORD','WEBHOOK')),
    recipient varchar(500),
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','FAILED','RETRY')),
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alert_notification_event ON monitoring.alert_notification(alert_event_id);