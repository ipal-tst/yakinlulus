-- Migration 174 down: application/database/worker/frontend errors, system event & config change.

DROP TABLE IF EXISTS audit.configuration_change;
DROP TABLE IF EXISTS audit.system_event;
DROP TABLE IF EXISTS audit.frontend_error;
DROP TABLE IF EXISTS audit.worker_error;
DROP TABLE IF EXISTS audit.database_error;
DROP TABLE IF EXISTS audit.application_error;