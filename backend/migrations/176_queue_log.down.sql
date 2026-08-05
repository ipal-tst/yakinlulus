-- Migration 176 down: queue/websocket/worker/notification logs.

DROP TABLE IF EXISTS audit.notification_log;
DROP TABLE IF EXISTS audit.worker_queue;
DROP TABLE IF EXISTS audit.worker_retry;
DROP TABLE IF EXISTS audit.worker_job;
DROP TABLE IF EXISTS audit.websocket_log;
DROP TABLE IF EXISTS audit.queue_log;