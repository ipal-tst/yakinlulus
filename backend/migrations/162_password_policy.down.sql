-- Migration 162 down: password policy, ip lists, security header, auth provider & oauth.

DROP TABLE IF EXISTS config.oauth_configuration;
DROP TABLE IF EXISTS config.authentication_provider;
DROP TABLE IF EXISTS config.security_header;
DROP TABLE IF EXISTS config.ip_blacklist;
DROP TABLE IF EXISTS config.ip_whitelist;
DROP TABLE IF EXISTS config.password_policy;