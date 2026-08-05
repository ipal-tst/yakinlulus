-- Migration 135: parsed option, explanation, metadata.

CREATE TABLE ocr.parsed_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    option_label varchar(10) NOT NULL,
    option_text text,
    option_image text,
    is_answer boolean NOT NULL DEFAULT false,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsed_option_question ON ocr.parsed_option(question_id);

CREATE TABLE ocr.parsed_explanation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    explanation text,
    reference text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE ocr.parsed_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    education_level varchar(20),
    grade varchar(30),
    subject varchar(120),
    chapter varchar(200),
    subchapter varchar(200),
    difficulty varchar(20) CHECK (difficulty IN ('MUDAH','SEDANG','SULIT','HOTS')),
    estimated_duration int,
    question_type varchar(30),
    language varchar(10) DEFAULT 'id',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);
