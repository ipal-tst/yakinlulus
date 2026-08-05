-- Migration 173 down: token/session/device/api logs.

DROP TABLE IF EXISTS audit.api_rate_limit_log;
DROP TABLE IF EXISTS audit.api_error_log;
DROP TABLE IF EXISTS audit.api_request_log;
DROP TABLE IF EXISTS audit.trusted_device_log;
DROP TABLE IF EXISTS audit.session_log;
DROP TABLE IF EXISTS audit.token_log;