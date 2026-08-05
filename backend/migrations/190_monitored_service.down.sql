-- Migration 190 down: monitored service & service instance.

DROP TABLE IF EXISTS monitoring.health_check;
DROP TABLE IF EXISTS monitoring.service_instance;
DROP TABLE IF EXISTS monitoring.monitored_service;