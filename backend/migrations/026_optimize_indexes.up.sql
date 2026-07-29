-- Migration 026: Add high-performance indexes for question bank and content queries
-- Accelerates ORDER BY created_at DESC and filtered searches

-- Index on questions.created_at for fast descending pagination
CREATE INDEX IF NOT EXISTS idx_questions_created_at 
ON questions(created_at DESC);

-- Composite index for subject-filtered question listing
CREATE INDEX IF NOT EXISTS idx_questions_subject_created 
ON questions(subject_id, created_at DESC);

-- Composite index for status + difficulty filtering
CREATE INDEX IF NOT EXISTS idx_questions_status_difficulty 
ON questions(status, difficulty);

-- Index on contents.created_at for unified content pagination
CREATE INDEX IF NOT EXISTS idx_contents_created_at 
ON contents(created_at DESC);

-- Composite index on contents (subject_id, content_type, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_contents_subject_type_created 
ON contents(subject_id, content_type, created_at DESC);
