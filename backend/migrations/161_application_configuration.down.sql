-- Migration 161 down: application, branding, localization & security configuration.

DROP TABLE IF EXISTS config.security_configuration;
DROP TABLE IF EXISTS config.localization_configuration;
DROP TABLE IF EXISTS config.branding_configuration;
DROP TABLE IF EXISTS config.application_configuration;