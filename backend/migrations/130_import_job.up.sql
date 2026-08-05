-- Migration 130: import job & import file.

CREATE TABLE ocr.import_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number varchar(50) NOT NULL,
    job_name varchar(200),
    module varchar(30) NOT NULL DEFAULT 'OTHER' CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    job_type varchar(20) NOT NULL DEFAULT 'IMPORT' CHECK (job_type IN ('OCR','IMPORT','OCR_AI','IMPORT_AI','MIGRATION')),
    source_type varchar(20) NOT NULL DEFAULT 'FILE' CHECK (source_type IN ('PDF','DOCX','PPTX','IMAGE','EXCEL','CSV','ZIP')),
    status varchar(20) NOT NULL DEFAULT 'UPLOADED'
        CHECK (status IN ('UPLOADED','VALIDATING','PROCESSING','OCR','AI_PARSING','REVIEW','APPROVED','IMPORTING','COMPLETED','FAILED','CANCELLED')),
    priority int NOT NULL DEFAULT 0,
    uploaded_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    assigned_reviewer uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_import_job_number ON ocr.import_job(job_number);
CREATE INDEX idx_import_job_status ON ocr.import_job(status);
CREATE INDEX idx_import_job_uploaded_by ON ocr.import_job(uploaded_by);
CREATE INDEX idx_import_job_reviewer ON ocr.import_job(assigned_reviewer);
CREATE TRIGGER trg_import_job_updated BEFORE UPDATE ON ocr.import_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.import_file (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    original_filename varchar(255) NOT NULL,
    stored_filename varchar(255),
    storage_provider varchar(60),
    bucket varchar(120),
    path text,
    mime_type varchar(120),
    extension varchar(20),
    file_size bigint NOT NULL DEFAULT 0,
    total_pages int NOT NULL DEFAULT 0,
    checksum varchar(64),
    version int NOT NULL DEFAULT 1,
    is_encrypted boolean NOT NULL DEFAULT false,
    uploaded_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_file_job ON ocr.import_file(job_id);
CREATE INDEX idx_import_file_checksum ON ocr.import_file(checksum);
