-- Migration 187 down: idempotency key, api batch job & item.

DROP TABLE IF EXISTS integration.api_batch_item;
DROP TABLE IF EXISTS integration.api_batch_job;
DROP TABLE IF EXISTS integration.idempotency_key;