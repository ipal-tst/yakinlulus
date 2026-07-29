CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','FINISHED','TERMINATED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    remaining_seconds INT,
    violation_score INT NOT NULL DEFAULT 0,
    is_terminated BOOLEAN NOT NULL DEFAULT false,
    final_score DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);

CREATE TABLE exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_question_id UUID NOT NULL REFERENCES exam_questions(id),
    selected_option_id UUID REFERENCES question_options(id),
    is_doubtful BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    client_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, exam_question_id)
);

CREATE INDEX idx_exam_answers_session_id ON exam_answers(session_id);

CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN (
        'FULLSCREEN_EXIT','TAB_SWITCH','KEYBOARD_SHORTCUT','DEVTOOLS_OPEN','COPY_ATTEMPT','MULTIPLE_IP','SUSPICIOUS_ACTIVITY'
    )),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_violations_session_id ON violations(session_id);