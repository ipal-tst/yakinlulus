-- Migration 055: student/essay answers, answer history, navigation, bookmark, time.

CREATE TABLE cbt.student_answer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    selected_option varchar(10),
    answered_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.essay_answer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    text_answer text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.answer_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_answer_id uuid NOT NULL REFERENCES cbt.student_answer(id) ON DELETE CASCADE,
    previous_value varchar(10),
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_answer_history_sa ON cbt.answer_history(student_answer_id);

CREATE TABLE cbt.navigation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    question_no int NOT NULL,
    visited_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_navigation_log_attempt ON cbt.navigation_log(attempt_id);

CREATE TABLE cbt.bookmark_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.question_time (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);
