-- Migration 188 down: integration event log, ai provider model & ai usage log.

DROP TABLE IF EXISTS integration.ai_usage_log;
DROP TABLE IF EXISTS integration.ai_provider_model;
DROP TABLE IF EXISTS integration.integration_event_log;