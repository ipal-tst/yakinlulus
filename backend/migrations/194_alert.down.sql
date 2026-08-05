-- Migration 194 down: alert, alert event & alert notification.

DROP TABLE IF EXISTS monitoring.alert_notification;
DROP TABLE IF EXISTS monitoring.alert_event;
DROP TABLE IF EXISTS monitoring.alert;