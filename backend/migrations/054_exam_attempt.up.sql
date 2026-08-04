-- Migration 054: exam attempt, random log, attempt question & option.

CREATE TABLE cbt.exam_attempt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    attempt_no int NOT NULL DEFAULT 1,
    started_at timestamptz,
    finished_at timestamptz,
    last_sync timestamptz,
    status text NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED','READY','STARTED','PAUSED','RESUMED','SUBMITTED','GRADING','COMPLETED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id, attempt_no)
);
CREATE INDEX idx_exam_attempt_participant ON cbt.exam_attempt(participant_id);
CREATE INDEX idx_exam_attempt_status ON cbt.exam_attempt(status);
CREATE TRIGGER trg_exam_attempt_updated BEFORE UPDATE ON cbt.exam_attempt
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.exam_random_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    seed int,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_random_log_attempt ON cbt.exam_random_log(attempt_id);

CREATE TABLE cbt.attempt_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    display_order int NOT NULL DEFAULT 0,
    snapshot_version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, display_order)
);
CREATE INDEX idx_attempt_question_attempt ON cbt.attempt_question(attempt_id);
CREATE INDEX idx_attempt_question_q ON cbt.attempt_question(question_id);

CREATE TABLE cbt.attempt_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    option_label varchar(10) NOT NULL,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempt_option_aq ON cbt.attempt_option(attempt_question_id);
