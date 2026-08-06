-- Migration 218: user_notification.channel (legacy Notification DTO exposes channel).

ALTER TABLE notification.user_notification
    ADD COLUMN IF NOT EXISTS channel varchar(20) NOT NULL DEFAULT 'IN_APP';