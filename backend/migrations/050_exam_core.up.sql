-- Migration 050: exam core - status lookup, exam master, metadata.

CREATE TABLE cbt.exam_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_exam_status_code ON cbt.exam_status(code);

CREATE TABLE cbt.exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    description text,
    exam_type text NOT NULL DEFAULT 'CBT' CHECK (exam_type IN ('TRYOUT','CBT','QUIZ','MID','FINAL','UTBK','AKM')),
    status_id uuid REFERENCES cbt.exam_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_exam_code ON cbt.exam(exam_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_type ON cbt.exam(exam_type);
CREATE INDEX idx_exam_status ON cbt.exam(status_id);
CREATE INDEX idx_exam_owner ON cbt.exam(owner_id);
CREATE TRIGGER trg_exam_updated BEFORE UPDATE ON cbt.exam
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.exam_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    duration_minute int,
    passing_score numeric(5,2),
    certificate boolean NOT NULL DEFAULT false,
    negative_marking boolean NOT NULL DEFAULT false,
    calculator_allowed boolean NOT NULL DEFAULT false,
    fullscreen_required boolean NOT NULL DEFAULT false,
    safe_browser boolean NOT NULL DEFAULT false,
    show_result boolean NOT NULL DEFAULT true,
    show_answer boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id)
);

-- Deferred FK from Phase 4: question.question_exam.exam_id -> cbt.exam.
ALTER TABLE question.question_exam ADD CONSTRAINT fk_question_exam_exam
    FOREIGN KEY (exam_id) REFERENCES cbt.exam(id);
