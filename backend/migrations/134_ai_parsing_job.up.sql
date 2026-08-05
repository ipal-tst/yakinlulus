-- Migration 134: AI parsing job & parsed question.

CREATE TABLE ocr.ai_parsing_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    provider varchar(30),
    model varchar(100),
    prompt_version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','SUCCESS','FAILED')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    cost numeric(12,4) NOT NULL DEFAULT 0,
    duration_ms int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_parsing_job_job ON ocr.ai_parsing_job(job_id);
CREATE INDEX idx_ai_parsing_job_status ON ocr.ai_parsing_job(status);
CREATE TRIGGER trg_ai_parsing_job_updated BEFORE UPDATE ON ocr.ai_parsing_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.parsed_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    question_number int,
    question_text text,
    question_image text,
    difficulty varchar(20) CHECK (difficulty IN ('MUDAH','SEDANG','SULIT','HOTS')),
    subject_prediction varchar(120),
    chapter_prediction varchar(200),
    topic_prediction varchar(200),
    confidence numeric(5,4),
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsed_question_job ON ocr.parsed_question(job_id);
CREATE INDEX idx_parsed_question_status ON ocr.parsed_question(status);
CREATE TRIGGER trg_parsed_question_updated BEFORE UPDATE ON ocr.parsed_question
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
