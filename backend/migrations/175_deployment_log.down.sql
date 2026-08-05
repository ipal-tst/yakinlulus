-- Migration 175 down: deployment/backup/restore/performance/slow query/cache logs.

DROP TABLE IF EXISTS audit.cache_log;
DROP TABLE IF EXISTS audit.slow_query_log;
DROP TABLE IF EXISTS audit.performance_log;
DROP TABLE IF EXISTS audit.restore_log;
DROP TABLE IF EXISTS audit.backup_log;
DROP TABLE IF EXISTS audit.deployment_log;