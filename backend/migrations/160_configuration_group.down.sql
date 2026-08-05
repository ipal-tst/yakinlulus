-- Migration 160 down: configuration group, definition, value & environment.

DROP TABLE IF EXISTS config.configuration_value;
DROP TABLE IF EXISTS config.configuration_definition;
DROP TABLE IF EXISTS config.environment;
DROP TABLE IF EXISTS config.configuration_group;