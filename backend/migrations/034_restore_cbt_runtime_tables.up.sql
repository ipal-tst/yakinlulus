-- Migration 034: Restore tables dropped by 030/031 that cbt_runtime needs
-- and add missing columns to unified tables.
-- Uses IF NOT EXISTS so it's safe whether or not 030/031 were applied.
-- FKs now reference unified tables (contents, content_exam_questions, content_question_options)
-- instead of the legacy tables that were dropped.

ALTER TABLE content_exams ADD COLUMN IF NOT EXISTS negative_marking DECIMAL(5,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    difficulty VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    points DECIMAL(5,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_question_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
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
    CONSTRAINT valid_pool_size CHECK (questions_per_student <= total_pool_size)
);

CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES contents(id),
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

CREATE TABLE IF NOT EXISTS exam_session_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    assigned_option_order UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_answers (
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

CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE UNIQUE,
    exam_id UUID NOT NULL REFERENCES contents(id),
    user_id UUID NOT NULL REFERENCES users(id),
    total_questions INT NOT NULL,
    answered_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    passing_grade DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
