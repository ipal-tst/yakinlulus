-- Migration 057: proctor & monitoring - live monitor, heartbeat, logs, detection.

CREATE TABLE cbt.live_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    current_question int,
    remaining_time int,
    status varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);
CREATE TRIGGER trg_live_monitor_updated BEFORE UPDATE ON cbt.live_monitor
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.heartbeat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    client_id varchar(64),
    status varchar(30) NOT NULL DEFAULT 'ONLINE',
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_heartbeat_attempt ON cbt.heartbeat(attempt_id);

CREATE TABLE cbt.connection_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event varchar(60) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_connection_log_attempt ON cbt.connection_log(attempt_id);

CREATE TABLE cbt.cheating_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event text NOT NULL CHECK (event IN ('TAB_CHANGE','COPY','PASTE','SCREENSHOT','WINDOW_BLUR')),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cheating_log_attempt ON cbt.cheating_log(attempt_id);

CREATE TABLE cbt.browser_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event varchar(60) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_browser_log_attempt ON cbt.browser_log(attempt_id);

CREATE TABLE cbt.camera_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_camera_log_attempt ON cbt.camera_log(attempt_id);

CREATE TABLE cbt.face_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_face_detection_attempt ON cbt.face_detection(attempt_id);

CREATE TABLE cbt.microphone_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_microphone_detection_attempt ON cbt.microphone_detection(attempt_id);
