-- Migration 186 down: integration module, provider health check & incident.

DROP TABLE IF EXISTS integration.provider_incident;
DROP TABLE IF EXISTS integration.provider_health_check;
DROP TABLE IF EXISTS integration.integration_module;