-- Migration 193 down: tracing transaction & span.

DROP TABLE IF EXISTS monitoring.tracing_span;
DROP TABLE IF EXISTS monitoring.tracing_transaction;