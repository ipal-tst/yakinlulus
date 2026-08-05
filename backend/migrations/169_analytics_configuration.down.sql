-- Migration 169 down: analytics/dashboard, cron/scheduler, integration, feature, backup, maintenance, versioning.

DROP TABLE IF EXISTS config.configuration_audit;
DROP TABLE IF EXISTS config.configuration_history;
DROP TABLE IF EXISTS config.configuration_snapshot;
DROP TABLE IF EXISTS config.configuration_version;
DROP TABLE IF EXISTS config.maintenance_history;
DROP TABLE IF EXISTS config.maintenance_schedule;
DROP TABLE IF EXISTS config.restore_configuration;
DROP TABLE IF EXISTS config.backup_configuration;
DROP TABLE IF EXISTS config.feature_target;
DROP TABLE IF EXISTS config.feature_flag;
DROP TABLE IF EXISTS config.api_integration;
DROP TABLE IF EXISTS config.webhook_configuration;
DROP TABLE IF EXISTS config.integration_provider;
DROP TABLE IF EXISTS config.scheduler_configuration;
DROP TABLE IF EXISTS config.cron_job;
DROP TABLE IF EXISTS config.dashboard_configuration;
DROP TABLE IF EXISTS config.analytics_configuration;