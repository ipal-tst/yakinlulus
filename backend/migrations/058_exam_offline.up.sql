-- Migration 058: offline sync - sync status, log, conflict.

CREATE TABLE cbt.offline_sync (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    last_sync timestamptz,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SYNCING','SYNCED','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);
CREATE TRIGGER trg_offline_sync_updated BEFORE UPDATE ON cbt.offline_sync
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_log_attempt ON cbt.sync_log(attempt_id);

CREATE TABLE cbt.sync_conflict (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    detail_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_conflict_attempt ON cbt.sync_conflict(attempt_id);
