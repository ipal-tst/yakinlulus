-- Migration 183 down: api rate limit, usage statistics & error catalog.

DROP TABLE IF EXISTS integration.api_error_catalog;
DROP TABLE IF EXISTS integration.api_usage_statistics;
DROP TABLE IF EXISTS integration.api_rate_limit;