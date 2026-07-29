-- Migration 020: question metadata columns + import tracking
-- Align with Entity Catalog: QB-001 through QB-008

-- ========== QUESTIONS: add metadata columns ==========
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS topic VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(20) CHECK (bloom_level IN ('C1','C2','C3','C4','C5','C6')),
    ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'id',
    ADD COLUMN IF NOT EXISTS source VARCHAR(50);

COMMENT ON COLUMN questions.topic IS 'Topik/Sub-topik soal (contoh: Fungsi Kuadrat, Eksponen)';
COMMENT ON COLUMN questions.bloom_level IS 'Taksonomi Bloom: C1=Remember, C2=Understand, C3=Apply, C4=Analyze, C5=Evaluate, C6=Create';
COMMENT ON COLUMN questions.language IS 'Bahasa soal: id=Indonesia, en=English';
COMMENT ON COLUMN questions.source IS 'Asal soal: Manual, AI, Import Excel, Kemendikbud, Sekolah, Guru, Publisher';

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_bloom ON questions(bloom_level);
CREATE INDEX IF NOT EXISTS idx_questions_language ON questions(language);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);

-- ========== IMPORT JOBS ==========
CREATE TABLE IF NOT EXISTS question_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')),
    error_log TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON question_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON question_import_jobs(created_by);

-- ========== IMPORT ROWS ==========
CREATE TABLE IF NOT EXISTS question_import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES question_import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB NOT NULL,
    errors TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PARSED','VALIDATED','IMPORTED','ERROR','SKIPPED')),
    question_id UUID REFERENCES questions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_rows_job_id ON question_import_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON question_import_rows(status);
CREATE INDEX IF NOT EXISTS idx_import_rows_question_id ON question_import_rows(question_id);
