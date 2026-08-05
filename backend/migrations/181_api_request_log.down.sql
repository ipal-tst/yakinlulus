-- Migration 181 down: api request/response log & webhook endpoint.

DROP TABLE IF EXISTS integration.webhook_endpoint;
DROP TABLE IF EXISTS integration.api_response_log;
DROP TABLE IF EXISTS integration.api_request_log;