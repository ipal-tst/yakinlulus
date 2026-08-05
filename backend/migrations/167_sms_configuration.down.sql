-- Migration 167 down: sms, push & notification template configuration.

DROP TABLE IF EXISTS config.notification_template;
DROP TABLE IF EXISTS config.push_configuration;
DROP TABLE IF EXISTS config.sms_configuration;