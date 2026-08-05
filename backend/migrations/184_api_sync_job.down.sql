-- Migration 184 down: api sync job & history.

DROP TABLE IF EXISTS integration.api_sync_history;
DROP TABLE IF EXISTS integration.api_sync_job;