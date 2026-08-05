-- Migration 157 down: search analytics & audit log.

DROP TABLE IF EXISTS search.search_audit_log;
DROP TABLE IF EXISTS search.search_analytics;