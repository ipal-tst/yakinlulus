-- Migration 179 down: merge/consent/privacy/retention/anonymization/archive logs, partition & retention.

DROP TABLE IF EXISTS audit.log_retention;
DROP TABLE IF EXISTS audit.log_partition;
DROP TABLE IF EXISTS audit.archive_log;
DROP TABLE IF EXISTS audit.anonymization_log;
DROP TABLE IF EXISTS audit.retention_log;
DROP TABLE IF EXISTS audit.privacy_log;
DROP TABLE IF EXISTS audit.consent_log;
DROP TABLE IF EXISTS audit.merge_history;