-- Migration 171 down: login/logout/password/otp/mfa logs.

DROP TABLE IF EXISTS audit.mfa_log;
DROP TABLE IF EXISTS audit.otp_log;
DROP TABLE IF EXISTS audit.password_reset_log;
DROP TABLE IF EXISTS audit.password_change_log;
DROP TABLE IF EXISTS audit.logout_log;
DROP TABLE IF EXISTS audit.login_log;