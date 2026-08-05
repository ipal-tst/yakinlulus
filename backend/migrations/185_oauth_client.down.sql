-- Migration 185 down: oauth client & token.

DROP TABLE IF EXISTS integration.oauth_token;
DROP TABLE IF EXISTS integration.oauth_client;