-- Migration 182 down: webhook event, webhook log & api retry queue.

DROP TABLE IF EXISTS integration.api_retry_queue;
DROP TABLE IF EXISTS integration.webhook_log;
DROP TABLE IF EXISTS integration.webhook_event;