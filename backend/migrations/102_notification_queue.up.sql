-- Migration 102: notification queue & delivery.

CREATE TABLE notification.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES notification.notification_event(id) ON DELETE CASCADE,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    channel varchar(20) NOT NULL,
    priority int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING','PROCESSING','SUCCESS','FAILED','RETRY','CANCELLED')),
    retry_count int NOT NULL DEFAULT 0,
    worker_id varchar(100),
    locked_at timestamptz,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_queue_event ON notification.notification_queue(event_id);
CREATE INDEX idx_notification_queue_template ON notification.notification_queue(template_id);
CREATE INDEX idx_notification_queue_user ON notification.notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification.notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON notification.notification_queue(scheduled_at);

CREATE TABLE notification.notification_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES notification.notification_queue(id) ON DELETE CASCADE,
    provider varchar(100),
    provider_message_id varchar(200),
    channel varchar(20) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','DELIVERED','READ','FAILED','BOUNCED')),
    request_payload jsonb,
    response_payload jsonb,
    response_time int,
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    failed_reason text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_notification_delivery_provider_msg ON notification.notification_delivery(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_notification_delivery_queue ON notification.notification_delivery(queue_id);
CREATE INDEX idx_notification_delivery_status ON notification.notification_delivery(status);
