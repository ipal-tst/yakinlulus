-- Migration 216: backfill legacy inbox columns onto notification.user_notification
-- to keep the existing Notification JSON contract (status/reference/delivered/archived).

ALTER TABLE notification.user_notification
    ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','SENT','FAILED')),
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
    ADD COLUMN IF NOT EXISTS reference_type varchar(60),
    ADD COLUMN IF NOT EXISTS reference_id uuid,
    ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_user_notification_status ON notification.user_notification(status);
CREATE INDEX IF NOT EXISTS idx_user_notification_archived ON notification.user_notification(archived_at);

UPDATE notification.user_notification
SET status = 'SENT', delivered_at = COALESCE(delivered_at, created_at)
WHERE status = 'PENDING';