-- Migration 196 down: synthetic monitor & result.

DROP TABLE IF EXISTS monitoring.synthetic_result;
DROP TABLE IF EXISTS monitoring.synthetic_monitor;