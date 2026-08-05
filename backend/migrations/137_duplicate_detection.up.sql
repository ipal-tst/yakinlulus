-- Migration 137: duplicate detection, import batch, import result, import error.

CREATE TABLE ocr.duplicate_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    similar_question uuid REFERENCES ocr.parsed_question(id) ON DELETE SET NULL,
    similarity_score numeric(6,5),
    algorithm varchar(30),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','DISMISSED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_duplicate_detection_question ON ocr.duplicate_detection(question_id);

CREATE TABLE ocr.import_batch (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    batch_no int NOT NULL DEFAULT 1,
    total_record int NOT NULL DEFAULT 0,
    success_record int NOT NULL DEFAULT 0,
    failed_record int NOT NULL DEFAULT 0,
    processing_time int,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','PARTIAL')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, batch_no)
);
CREATE INDEX idx_import_batch_job ON ocr.import_batch(job_id);
CREATE TRIGGER trg_import_batch_updated BEFORE UPDATE ON ocr.import_batch
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.import_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid REFERENCES ocr.import_batch(id) ON DELETE CASCADE,
    target_table varchar(120),
    record_id uuid,
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_result_batch ON ocr.import_result(batch_id);
CREATE INDEX idx_import_result_target ON ocr.import_result(target_table, record_id);

CREATE TABLE ocr.import_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    page int,
    line int,
    error_type varchar(60),
    description text,
    raw_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_error_job ON ocr.import_error(job_id);