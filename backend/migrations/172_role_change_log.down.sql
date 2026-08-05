-- Migration 172 down: role/permission change, access denied, security & suspicious logs.

DROP TABLE IF EXISTS audit.account_lock_log;
DROP TABLE IF EXISTS audit.suspicious_activity;
DROP TABLE IF EXISTS audit.security_event;
DROP TABLE IF EXISTS audit.access_denied_log;
DROP TABLE IF EXISTS audit.permission_change_log;
DROP TABLE IF EXISTS audit.role_change_log;