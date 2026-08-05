-- Migration 192 down: api metrics, endpoint availability & error metrics.

DROP TABLE IF EXISTS monitoring.error_metrics;
DROP TABLE IF EXISTS monitoring.endpoint_availability;
DROP TABLE IF EXISTS monitoring.api_metrics;