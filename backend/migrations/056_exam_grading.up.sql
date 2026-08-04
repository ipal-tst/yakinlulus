-- Migration 056: exam timer, auto submit, grading result & details.

CREATE TABLE cbt.exam_timer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    remaining_second int NOT NULL DEFAULT 0,
    last_update timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.timer_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_timer_history_attempt ON cbt.timer_history(attempt_id);

CREATE TABLE cbt.auto_submit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('TIMEOUT','MANUAL','DISCONNECT','CHEATING')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.grading_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    score numeric(10,2) NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    passed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.essay_grading (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_answer_id uuid NOT NULL REFERENCES cbt.essay_answer(id) ON DELETE CASCADE,
    grader_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    score numeric(5,2),
    comment text,
    graded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_essay_grading_ea ON cbt.essay_grading(essay_answer_id);
CREATE INDEX idx_essay_grading_grader ON cbt.essay_grading(grader_id);

CREATE TABLE cbt.ai_grading (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    model varchar(120),
    score numeric(5,2),
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_grading_aq ON cbt.ai_grading(attempt_question_id);

CREATE TABLE cbt.grading_detail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    status_correct boolean NOT NULL DEFAULT false,
    score numeric(10,2) NOT NULL DEFAULT 0,
    is_blank boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);
