-- Migration 197 down: capacity forecast, business metrics, worker metrics & storage metrics.

DROP TABLE IF EXISTS monitoring.storage_metrics;
DROP TABLE IF EXISTS monitoring.worker_metrics;
DROP TABLE IF EXISTS monitoring.business_metrics;
DROP TABLE IF EXISTS monitoring.capacity_forecast;