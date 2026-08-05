-- Migration 178: ai embedding, import/export/bulk update, entity history & restore history (append-only).

CREATE TABLE audit.ai_embedding_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(60),
    model varchar(120),
    dimension int,
    token int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_embedding_log_time ON audit.ai_embedding_log(created_at);

CREATE TABLE audit.import_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file varchar(500),
    module varchar(60),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','PARTIAL','IN_PROGRESS')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_log_user ON audit.import_log(user_id);
CREATE INDEX idx_import_log_time ON audit.import_log(created_at);

CREATE TABLE audit.export_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file varchar(500),
    module varchar(60),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    format varchar(10) CHECK (format IN ('PDF','EXCEL','CSV','JSON','XML')),
    row_count int,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','IN_PROGRESS')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_export_log_user ON audit.export_log(user_id);
CREATE INDEX idx_export_log_time ON audit.export_log(created_at);

CREATE TABLE audit.bulk_update_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module varchar(60),
    affected_rows int,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bulk_update_log_user ON audit.bulk_update_log(user_id);

CREATE TABLE audit.entity_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity varchar(120),
    entity_id uuid,
    version int NOT NULL DEFAULT 1,
    snapshot jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_entity_history_entity ON audit.entity_history(entity, entity_id);
CREATE INDEX idx_entity_history_time ON audit.entity_history(created_at);

CREATE TABLE audit.restore_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity varchar(120),
    entity_id uuid,
    from_version int,
    to_version int,
    restored_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_restore_history_entity ON audit.restore_history(entity, entity_id);