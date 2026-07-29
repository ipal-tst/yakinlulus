-- Migration 023: Unified contents base table
-- Consolidates questions, materials, exams into single base + subtypes
-- Run AFTER migration 022 (grade_id, RBAC)

-- ========== 1. CREATE BASE TABLE ==========
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('QUESTION','MATERIAL','EXAM','PRACTICE_SET','FLASHCARD')),
    grade_id UUID NOT NULL REFERENCES grades(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    chapter_id UUID REFERENCES chapters(id),
    topic_id UUID REFERENCES topics(id),
    lo_id UUID REFERENCES learning_outcomes(id),
    title VARCHAR(500),
    body TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED','ONGOING','COMPLETED')),
    created_by UUID NOT NULL REFERENCES users(id),
    metadata JSONB NOT NULL DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contents_grade_id ON contents(grade_id);
CREATE INDEX idx_contents_subject_id ON contents(subject_id);
CREATE INDEX idx_contents_chapter_id ON contents(chapter_id);
CREATE INDEX idx_contents_topic_id ON contents(topic_id);
CREATE INDEX idx_contents_lo_id ON contents(lo_id);
CREATE INDEX idx_contents_type_grade ON contents(content_type, grade_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_by ON contents(created_by);
CREATE INDEX idx_contents_published_at ON contents(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_contents_metadata_gin ON contents USING GIN (metadata);

COMMENT ON TABLE contents IS 'Unified base table for all content types. Subtypes in content_questions, content_materials, content_exams.';
COMMENT ON COLUMN contents.metadata IS 'Type-specific: question={difficulty,bloom_level,score,time}; material={format,duration}; exam={duration,passing_score,shuffle}';

-- ========== 2. SUBTYPE: QUESTIONS ==========
CREATE TABLE content_questions (
    content_id UUID PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
    question_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE_CHOICE' CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','ESSAY','SHORT_ANSWER')),
    difficulty VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    bloom_level VARCHAR(2) CHECK (bloom_level IN ('C1','C2','C3','C4','C5','C6')),
    thinking_level VARCHAR(10) CHECK (thinking_level IN ('LOTS','MOTS','HOTS')),
    language VARCHAR(2) DEFAULT 'id' CHECK (language IN ('id','en')),
    source VARCHAR(20) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','AI_GENERATED','IMPORTED')),
    stimulus_id UUID REFERENCES question_stimuli(id),
    subtopic_id UUID REFERENCES learning_outcomes(id),
    score DECIMAL(5,2) DEFAULT 1.0,
    negative_score DECIMAL(5,2) DEFAULT 0.0,
    estimated_time INT DEFAULT 60,
    explanation TEXT
);

CREATE INDEX idx_content_questions_difficulty ON content_questions(difficulty);
CREATE INDEX idx_content_questions_bloom ON content_questions(bloom_level);

-- Question options (replaces question_options)
CREATE TABLE content_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    explanation TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_question_options_content ON content_question_options(content_id);

-- ========== 3. SUBTYPE: MATERIALS ==========
CREATE TABLE content_materials (
    content_id UUID PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
    content_format VARCHAR(20) NOT NULL DEFAULT 'MARKDOWN' CHECK (content_format IN ('TEXT','RICH_TEXT','MARKDOWN','VIDEO','PDF','AUDIO','INTERACTIVE')),
    estimated_duration INT,
    read_count INT NOT NULL DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT false,
    prerequisites JSONB DEFAULT '[]'
);

-- ========== 3b. LEARNING PROGRESS (updated FK to contents) ==========
CREATE TABLE content_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, content_id)
);

CREATE INDEX idx_learning_progress_user_content ON content_learning_progress(user_id, content_id);
CREATE INDEX idx_learning_progress_content ON content_learning_progress(content_id);

-- ========== 4. SUBTYPE: EXAMS ==========
CREATE TABLE content_exams (
    content_id UUID PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    passing_score DECIMAL(5,2) DEFAULT 0,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    max_attempts INT DEFAULT 1,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    blueprint JSONB DEFAULT '{}'
);

CREATE INDEX idx_content_exams_time ON content_exams(start_time, end_time);

-- ========== 5. EXAM QUESTIONS (links exams to questions) ==========
-- Replaces exam_questions, uses content_ids
CREATE TABLE content_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    question_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    points DECIMAL(5,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_content_id, question_content_id)
);

CREATE INDEX idx_content_exam_questions_exam ON content_exam_questions(exam_content_id);
CREATE INDEX idx_content_exam_questions_question ON content_exam_questions(question_content_id);

-- ========== 6. EXAM BLUEPRINT ==========
CREATE TABLE content_exam_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE UNIQUE,
    easy_count INT NOT NULL DEFAULT 0,
    medium_count INT NOT NULL DEFAULT 0,
    hard_count INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== 7. EXAM PARTICIPANTS ==========
CREATE TABLE content_exam_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_content_id, user_id)
);

CREATE INDEX idx_content_exam_participants_exam ON content_exam_participants(exam_content_id);
CREATE INDEX idx_content_exam_participants_user ON content_exam_participants(user_id);

-- ========== 7b. QUESTION POOLS ==========
CREATE TABLE content_question_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE UNIQUE,
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

CREATE INDEX idx_content_question_pools_exam ON content_question_pools(exam_content_id);

-- ========== 7c. EXAM ATTEMPTS ==========
CREATE TABLE content_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUBMITTED','GRADED','EXPIRED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    total_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    time_spent_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_exam_attempts_exam ON content_exam_attempts(exam_content_id);
CREATE INDEX idx_content_exam_attempts_user ON content_exam_attempts(user_id);
CREATE INDEX idx_content_exam_attempts_status ON content_exam_attempts(status);

-- ========== 7d. EXAM SESSION QUESTIONS (per-session selected questions) ==========
CREATE TABLE content_exam_session_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES content_exam_attempts(id) ON DELETE CASCADE,
    exam_question_id UUID NOT NULL REFERENCES content_exam_questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    assigned_option_order UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_exam_session_questions_session ON content_exam_session_questions(session_id);
CREATE INDEX idx_content_exam_session_questions_order ON content_exam_session_questions(session_id, display_order);

-- ========== 7e. EXAM ANSWERS ==========
CREATE TABLE content_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES content_exam_attempts(id) ON DELETE CASCADE,
    question_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    selected_options UUID[] DEFAULT '{}',
    text_answer TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(10,2),
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, question_content_id)
);

CREATE INDEX idx_content_exam_answers_attempt ON content_exam_answers(attempt_id);
CREATE INDEX idx_content_exam_answers_question ON content_exam_answers(question_content_id);

-- ========== 8. MIGRATE DATA: QUESTIONS ==========
-- Insert into contents
INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, topic_id, lo_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
SELECT
    q.id,
    'QUESTION',
    COALESCE(q.grade_id, s.grade_id),
    q.subject_id,
    q.chapter_id,
    q.topic_id,
    NULL, -- lo_id not in original schema
    LEFT(q.content, 500),
    q.content,
    q.status,
    q.created_by,
    jsonb_build_object(
        'difficulty', q.difficulty,
        'question_type', q.question_type,
        'bloom_level', q.bloom_level,
        'thinking_level', q.thinking_level,
        'language', q.language,
        'source', q.source,
        'score', q.score,
        'negative_score', q.negative_score,
        'estimated_time', q.estimated_time
    ),
    q.published_at,
    q.created_at,
    q.updated_at
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE q.grade_id IS NOT NULL OR s.grade_id IS NOT NULL;

-- Insert into content_questions
INSERT INTO content_questions (content_id, question_type, difficulty, bloom_level, thinking_level, language, source, subtopic_id, stimulus_id, score, negative_score, estimated_time, explanation)
SELECT
    q.id,
    q.question_type,
    q.difficulty,
    q.bloom_level,
    q.thinking_level,
    q.language,
    q.source,
    q.subtopic_id,
    q.stimulus_id,
    q.score,
    q.negative_score,
    q.estimated_time,
    q.explanation
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE q.grade_id IS NOT NULL OR s.grade_id IS NOT NULL;

-- Insert options
INSERT INTO content_question_options (content_id, label, option_text, is_correct, explanation, display_order, created_at)
SELECT
    qo.question_id,
    qo.label,
    qo.content,
    qo.is_correct,
    NULL, -- explanation not in original schema
    qo.display_order,
    qo.created_at
FROM question_options qo
JOIN questions q ON q.id = qo.question_id
JOIN subjects s ON q.subject_id = s.id
WHERE q.grade_id IS NOT NULL OR s.grade_id IS NOT NULL;

-- ========== 9. MIGRATE DATA: MATERIALS ==========
INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
SELECT
    m.id,
    'MATERIAL',
    COALESCE(m.grade_id, s.grade_id),
    m.subject_id,
    m.chapter_id,
    m.title,
    COALESCE(m.content, ''),
    m.status,
    m.created_by,
    jsonb_build_object(
        'content_format', m.content_type,
        'estimated_duration', m.estimated_duration,
        'read_count', m.read_count
    ),
    m.published_at,
    m.created_at,
    m.updated_at
FROM materials m
JOIN subjects s ON m.subject_id = s.id
WHERE m.grade_id IS NOT NULL OR s.grade_id IS NOT NULL;

INSERT INTO content_materials (content_id, content_format, estimated_duration, read_count, is_preview)
SELECT
    m.id,
    m.content_type,
    m.estimated_duration,
    m.read_count,
    false
FROM materials m
JOIN subjects s ON m.subject_id = s.id
WHERE m.grade_id IS NOT NULL OR s.grade_id IS NOT NULL;

-- ========== 10. MIGRATE DATA: EXAMS ==========
INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
SELECT
    e.id,
    'EXAM',
    e.grade_id,
    -- Removed reference to s.subject_id as exams table does not have it
    (SELECT q.subject_id FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = e.id LIMIT 1),
    NULL, -- exams don't have chapter_id directly
    e.title,
    COALESCE(e.description, ''),
    e.status,
    e.created_by,
    jsonb_build_object(
        'duration_minutes', e.duration_minutes,
        'passing_score', e.passing_score,
        'shuffle_questions', e.shuffle_questions,
        'shuffle_options', e.shuffle_options,
        'max_attempts', e.max_attempts,
        'start_time', e.start_time,
        'end_time', e.end_time
    ),
    CASE WHEN e.status = 'PUBLISHED' THEN e.start_time ELSE NULL END,
    e.created_at,
    e.updated_at
FROM exams e
WHERE e.grade_id IS NOT NULL;

INSERT INTO content_exams (content_id, description, duration_minutes, passing_score, shuffle_questions, shuffle_options, max_attempts, start_time, end_time, blueprint)
SELECT
    e.id,
    e.description,
    e.duration_minutes,
    e.passing_score,
    e.shuffle_questions,
    e.shuffle_options,
    e.max_attempts,
    e.start_time,
    e.end_time,
    jsonb_build_object(
        'easy', COALESCE(eb.easy_count, 0),
        'medium', COALESCE(eb.medium_count, 0),
        'hard', COALESCE(eb.hard_count, 0)
    )
FROM exams e
LEFT JOIN exam_blueprints eb ON e.id = eb.exam_id
WHERE e.grade_id IS NOT NULL;

-- Exam questions
INSERT INTO content_exam_questions (exam_content_id, question_content_id, display_order, points, created_at)
SELECT
    eq.exam_id,
    eq.question_id,
    eq.display_order,
    eq.points,
    eq.created_at
FROM exam_questions eq
JOIN contents ce ON eq.exam_id = ce.id AND ce.content_type = 'EXAM'
JOIN contents cq ON eq.question_id = cq.id AND cq.content_type = 'QUESTION';

-- Exam blueprints
INSERT INTO content_exam_blueprints (exam_content_id, easy_count, medium_count, hard_count, total_questions, created_at)
SELECT
    eb.exam_id,
    eb.easy_count,
    eb.medium_count,
    eb.hard_count,
    eb.total_questions,
    eb.created_at
FROM exam_blueprints eb
JOIN contents c ON eb.exam_id = c.id AND c.content_type = 'EXAM';

-- ========== 11. MIGRATE DATA: EXAM PARTICIPANTS (Old exam_participants table) ==========
INSERT INTO content_exam_participants (exam_content_id, user_id, created_at)
SELECT
    ep.exam_id,
    ep.user_id,
    ep.created_at
FROM exam_participants ep
JOIN contents c ON ep.exam_id = c.id AND c.content_type = 'EXAM'
ON CONFLICT (exam_content_id, user_id) DO NOTHING;

-- ========== 12. MIGRATE DATA: EXAM SESSIONS -> content_exam_attempts ==========
INSERT INTO content_exam_attempts (id, exam_content_id, user_id, attempt_number, status, started_at, submitted_at, total_score, max_score, time_spent_seconds, created_at)
SELECT
    es.id,
    es.exam_id,
    es.user_id,
    1, -- attempt_number not in original schema
    CASE es.status
        WHEN 'ACTIVE' THEN 'IN_PROGRESS'
        WHEN 'FINISHED' THEN 'SUBMITTED'
        WHEN 'TERMINATED' THEN 'EXPIRED'
        ELSE 'EXPIRED'
    END,
    es.started_at,
    es.finished_at,
    es.final_score,
    NULL, -- max_score not in original
    CASE WHEN es.finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (es.finished_at - es.started_at))::INT ELSE NULL END,
    es.created_at
FROM exam_sessions es
JOIN contents c ON c.id = es.exam_id AND c.content_type = 'EXAM'
ON CONFLICT (id) DO NOTHING;

-- ========== 13. MIGRATE DATA: EXAM ANSWERS -> content_exam_answers ==========
INSERT INTO content_exam_answers (attempt_id, question_content_id, selected_options, text_answer, is_correct, points_earned, graded_by, graded_at, created_at)
SELECT
    ea.session_id,
    eq.question_id,
    CASE WHEN ea.selected_option_id IS NOT NULL THEN ARRAY[ea.selected_option_id] ELSE ARRAY[]::UUID[] END,
    NULL, -- text_answer not in original
    ea.is_correct,
    ea.points_earned,
    NULL, -- graded_by not in original
    NULL, -- graded_at not in original
    ea.created_at
FROM exam_answers ea
JOIN content_exam_attempts cea ON cea.id = ea.session_id
JOIN exam_questions eq ON eq.id = ea.exam_question_id
JOIN contents q ON q.id = eq.question_id AND q.content_type = 'QUESTION'
ON CONFLICT (attempt_id, question_content_id) DO NOTHING;

-- ========== 14. TRIGGERS FOR UPDATED_AT ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contents_updated_at ON contents;
CREATE TRIGGER trg_contents_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_content_questions_updated_at ON content_questions;
DROP TRIGGER IF EXISTS trg_content_materials_updated_at ON content_materials;
DROP TRIGGER IF EXISTS trg_content_exams_updated_at ON content_exams;