-- Migration 059: exam statistics & append-only history tables.

CREATE TABLE cbt.exam_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    average_score numeric(5,2),
    highest_score numeric(5,2),
    lowest_score numeric(5,2),
    std_dev numeric(6,3),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id)
);

CREATE TABLE cbt.question_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    shown_count int NOT NULL DEFAULT 0,
    correct_count int NOT NULL DEFAULT 0,
    wrong_count int NOT NULL DEFAULT 0,
    blank_count int NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE cbt.participant_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    total_score numeric(10,2) NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id)
);

CREATE TABLE cbt.realtime_dashboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_realtime_dashboard_exam ON cbt.realtime_dashboard(exam_id);

CREATE TABLE cbt.exam_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid REFERENCES cbt.exam(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','PUBLISH','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_history_exam ON cbt.exam_history(exam_id);
CREATE INDEX idx_exam_history_time ON cbt.exam_history(created_at);

CREATE TABLE cbt.attempt_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid REFERENCES cbt.exam_attempt(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','START','PAUSE','RESUME','SUBMIT','GRADE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempt_history_attempt ON cbt.attempt_history(attempt_id);
CREATE INDEX idx_attempt_history_time ON cbt.attempt_history(created_at);

CREATE TABLE cbt.grading_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid REFERENCES cbt.exam_attempt(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('GRADE','REGRADE','MANUAL_FIX','AI_REVIEW')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_grading_history_attempt ON cbt.grading_history(attempt_id);
CREATE INDEX idx_grading_history_time ON cbt.grading_history(created_at);

CREATE TABLE cbt.publish_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid REFERENCES cbt.exam(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL,
    published_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_publish_history_exam ON cbt.publish_history(exam_id);
