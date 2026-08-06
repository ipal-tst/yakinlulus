DROP INDEX IF EXISTS idx_user_notification_archived;
DROP INDEX IF EXISTS idx_user_notification_status;
ALTER TABLE notification.user_notification
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS reference_id,
    DROP COLUMN IF EXISTS reference_type,
    DROP COLUMN IF EXISTS delivered_at,
    DROP COLUMN IF EXISTS status;