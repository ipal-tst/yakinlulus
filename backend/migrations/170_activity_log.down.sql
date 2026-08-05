-- Migration 170 down: activity & audit core.

DROP TABLE IF EXISTS audit.audit_snapshot;
DROP TABLE IF EXISTS audit.audit_entity;
DROP TABLE IF EXISTS audit.audit_log;
DROP TABLE IF EXISTS audit.activity_category;
DROP TABLE IF EXISTS audit.activity_type;
DROP TABLE IF EXISTS audit.activity_log;