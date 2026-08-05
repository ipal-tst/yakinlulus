-- Migration 107: notification webhook & retry.

CREATE TABLE notification.notification_webhook (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(100),
    endpoint text,
    request jsonb,
    response jsonb,
    http_status int,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_webhook_provider ON notification.notification_webhook(provider);
CREATE INDEX idx_notification_webhook_status ON notification.notification_webhook(http_status);

CREATE TABLE notification.notification_retry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid NOT NULL REFERENCES notification.notification_delivery(id) ON DELETE CASCADE,
    retry_number int NOT NULL DEFAULT 1,
    next_retry timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED')),
    reason text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (delivery_id, retry_number)
);
CREATE INDEX idx_notification_retry_next ON notification.notification_retry(next_retry);
CREATE INDEX idx_notification_retry_status ON notification.notification_retry(status);
