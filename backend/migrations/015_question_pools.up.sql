-- Question pools for dynamic CBT exam generation
-- Each exam can have one question pool defining how to select questions for each student session

CREATE TABLE exam_question_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_ids UUID[] DEFAULT '{}',
    easy_pct INT NOT NULL CHECK (easy_pct >= 0 AND easy_pct <= 100),
    medium_pct INT NOT NULL CHECK (medium_pct >= 0 AND medium_pct <= 100),
    hard_pct INT NOT NULL CHECK (hard_pct >= 0 AND hard_pct <= 100),
    total_pool_size INT NOT NULL CHECK (total_pool_size >= 1),
    questions_per_student INT NOT NULL CHECK (questions_per_student >= 1),
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_pct_sum CHECK (easy_pct + medium_pct + hard_pct = 100),
    CONSTRAINT valid_pool_size CHECK (questions_per_student <= total_pool_size),
    UNIQUE (exam_id)
);

CREATE INDEX idx_exam_question_pools_exam ON exam_question_pools(exam_id);

-- Per-session selected questions with randomized order and shuffled options
CREATE TABLE exam_session_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    assigned_option_order UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_session_questions_session ON exam_session_questions(session_id);
CREATE INDEX idx_exam_session_questions_order ON exam_session_questions(session_id, display_order);