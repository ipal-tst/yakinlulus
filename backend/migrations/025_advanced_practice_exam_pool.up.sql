-- Migration 025: Advanced Practice & Exam System - Pool Extensions
-- Adds grade_ids array, tag_filters, and exam_content_id for multi-pool support

-- ========== 1. EXTEND QUESTION POOLS ==========
-- Add grade_ids array for multi-grade exams (SMA: grade 10, 11, 12)
ALTER TABLE content_question_pools 
ADD COLUMN IF NOT EXISTS grade_ids UUID[] DEFAULT '{}';

-- Add tag_filters JSONB for tag-based exam generation (UTBK, SMPTN, UM)
ALTER TABLE content_question_pools 
ADD COLUMN IF NOT EXISTS tag_filters JSONB DEFAULT '{}';

-- Make exam_content_id nullable to support standalone pools
-- (Already nullable since no NOT NULL constraint in 023)

-- Add index for tag filtering
CREATE INDEX IF NOT EXISTS idx_content_question_pools_tag_filters 
ON content_question_pools USING GIN (tag_filters);

COMMENT ON COLUMN content_question_pools.grade_ids 
IS 'Array of grade IDs for multi-grade exams (e.g., SMA grades 10,11,12). Overrides subject_id grade if set.';

COMMENT ON COLUMN content_question_pools.tag_filters 
IS 'JSONB filter for tag-based selection: {"tags": ["UTBK", "SMPTN"], "operator": "OR"}';


-- ========== 2. CREATE SUBJECT BLUEPRINTS TABLE ==========
-- Per-subject blueprint for mixed-subject exams
CREATE TABLE IF NOT EXISTS content_exam_subject_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    easy_count INT NOT NULL DEFAULT 0 CHECK (easy_count >= 0),
    medium_count INT NOT NULL DEFAULT 0 CHECK (medium_count >= 0),
    hard_count INT NOT NULL DEFAULT 0 CHECK (hard_count >= 0),
    total_questions INT GENERATED ALWAYS AS (easy_count + medium_count + hard_count) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_content_id, subject_id)
);

CREATE INDEX idx_content_exam_subject_blueprints_exam 
ON content_exam_subject_blueprints(exam_content_id);


-- ========== 3. EXTEND SESSION QUESTIONS WITH SUBJECT ==========
-- Add subject_id for per-subject scoring breakdown
ALTER TABLE content_exam_session_questions 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

CREATE INDEX IF NOT EXISTS idx_content_exam_session_questions_subject 
ON content_exam_session_questions(subject_id);

COMMENT ON COLUMN content_exam_session_questions.subject_id 
IS 'Denormalized subject_id for per-subject scoring breakdown';


-- ========== 4. ADD SUBJECT_ID TO EXAM QUESTIONS (for blueprint reference) ==========
ALTER TABLE content_exam_questions 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

CREATE INDEX IF NOT EXISTS idx_content_exam_questions_subject 
ON content_exam_questions(subject_id);


-- ========== 5. TAGS TABLE ENHANCEMENT ==========
-- Ensure tags table has category for SOURCE_TYPE
-- (If tags table exists from earlier migrations, this will work)
-- If not, skip gracefully

-- Add index for tag category if tags table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category) WHERE category IS NOT NULL;
    END IF;
END $$;


-- ========== 6. PRACTICE SETS (for post-material practice) ==========
CREATE TABLE IF NOT EXISTS content_practice_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE, -- The material content
    practice_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE, -- Practice exam content
    questions_count INT NOT NULL DEFAULT 10,
    time_limit_seconds INT DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (content_id, practice_content_id)
);

CREATE INDEX idx_content_practice_sets_material ON content_practice_sets(content_id);
CREATE INDEX idx_content_practice_sets_practice ON content_practice_sets(practice_content_id);


-- ========== 7. STUDENT PRACTICE SESSIONS ==========
CREATE TABLE IF NOT EXISTS content_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_set_id UUID REFERENCES content_practice_sets(id) ON DELETE SET NULL,
    -- For standalone practice (by subject/grade)
    subject_id UUID REFERENCES subjects(id),
    grade_id UUID REFERENCES grades(id),
    -- For tag-based practice
    tag_filter JSONB,
    -- Session state
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUBMITTED','GRADED','EXPIRED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    total_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    time_spent_seconds INT,
    -- Per-subject breakdown (JSONB for flexibility)
    subject_breakdown JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_practice_sessions_user ON content_practice_sessions(user_id);
CREATE INDEX idx_content_practice_sessions_subject ON content_practice_sessions(subject_id);
CREATE INDEX idx_content_practice_sessions_grade ON content_practice_sessions(grade_id);
CREATE INDEX idx_content_practice_sessions_status ON content_practice_sessions(status);