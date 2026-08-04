-- Migration 046: question import & AI parsing - job, row, OCR result, AI parsing.

CREATE TABLE question.question_import_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VALIDATING','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_import_job_status ON question.question_import_job(status);
CREATE TRIGGER trg_question_import_job_updated BEFORE UPDATE ON question.question_import_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_import_row (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES question.question_import_job(id) ON DELETE CASCADE,
    row_no int NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','SKIPPED')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_import_row_job ON question.question_import_row(job_id);

CREATE TABLE question.question_ocr_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    ocr_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ocr_asset ON question.question_ocr_result(asset_id);

CREATE TABLE question.question_ai_parsing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    model_name varchar(120),
    result_json jsonb,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ai_parsing_asset ON question.question_ai_parsing(asset_id);
