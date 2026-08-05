-- Migration 180 down: api provider, credential & endpoint.

DROP TABLE IF EXISTS integration.api_endpoint;
DROP TABLE IF EXISTS integration.api_credential;
DROP TABLE IF EXISTS integration.api_provider;