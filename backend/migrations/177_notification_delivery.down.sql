-- Migration 177 down: notification delivery/open and ai request/generation/chat/ocr logs.

DROP TABLE IF EXISTS audit.ai_ocr_log;
DROP TABLE IF EXISTS audit.ai_chat_log;
DROP TABLE IF EXISTS audit.ai_generation_log;
DROP TABLE IF EXISTS audit.ai_request_log;
DROP TABLE IF EXISTS audit.notification_open;
DROP TABLE IF EXISTS audit.notification_delivery;