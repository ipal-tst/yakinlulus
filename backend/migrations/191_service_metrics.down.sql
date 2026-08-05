-- Migration 191 down: service metrics, database metrics & redis metrics.

DROP TABLE IF EXISTS monitoring.queue_metrics;
DROP TABLE IF EXISTS monitoring.redis_metrics;
DROP TABLE IF EXISTS monitoring.database_metrics;
DROP TABLE IF EXISTS monitoring.service_metrics;