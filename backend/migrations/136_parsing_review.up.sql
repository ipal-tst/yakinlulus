-- Migration 136: parsing review, validation rule & result.

CREATE TABLE ocr.parsing_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    reviewer uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'REVISION' CHECK (status IN ('APPROVED','REJECTED','REVISION')),
    notes text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsing_review_question ON ocr.parsing_review(question_id);
CREATE INDEX idx_parsing_review_reviewer ON ocr.parsing_review(reviewer);

CREATE TABLE ocr.import_validation_rule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name varchar(120) NOT NULL,
    module varchar(30) CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    validation_type varchar(20) NOT NULL CHECK (validation_type IN ('REGEX','AI','SCRIPT')),
    rule_expression text,
    error_message text,
    severity varchar(20) NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('WARNING','ERROR')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (rule_name, module)
);

CREATE TABLE ocr.validation_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    rule_id uuid REFERENCES ocr.import_validation_rule(id) ON DELETE SET NULL,
    object_type varchar(20) NOT NULL DEFAULT 'FILE' CHECK (object_type IN ('FILE','QUESTION','OPTION','IMAGE')),
    object_id uuid,
    status varchar(20) NOT NULL DEFAULT 'PASSED' CHECK (status IN ('PASSED','FAILED')),
    message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_validation_result_job ON ocr.validation_result(job_id);
CREATE INDEX idx_validation_result_rule ON ocr.validation_result(rule_id);
