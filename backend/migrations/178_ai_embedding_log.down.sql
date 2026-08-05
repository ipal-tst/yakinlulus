-- Migration 178 down: ai embedding, import/export/bulk update, entity history & restore history.

DROP TABLE IF EXISTS audit.restore_history;
DROP TABLE IF EXISTS audit.entity_history;
DROP TABLE IF EXISTS audit.bulk_update_log;
DROP TABLE IF EXISTS audit.export_log;
DROP TABLE IF EXISTS audit.import_log;
DROP TABLE IF EXISTS audit.ai_embedding_log;