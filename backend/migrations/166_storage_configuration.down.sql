-- Migration 166 down: storage, image, video, email & whatsapp configuration.

DROP TABLE IF EXISTS config.whatsapp_configuration;
DROP TABLE IF EXISTS config.email_configuration;
DROP TABLE IF EXISTS config.video_configuration;
DROP TABLE IF EXISTS config.image_configuration;
DROP TABLE IF EXISTS config.storage_configuration;