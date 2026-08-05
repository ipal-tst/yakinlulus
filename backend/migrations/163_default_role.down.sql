-- Migration 163 down: default role, permission & academic configuration.

DROP TABLE IF EXISTS config.academic_configuration;
DROP TABLE IF EXISTS config.permission_configuration;
DROP TABLE IF EXISTS config.default_role;