-- Migration 040: question core - status lookup, question master, version.

CREATE TABLE question.question_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_question_status_code ON question.question_status(code);

CREATE TABLE question.question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code varchar(50) NOT NULL,
    question_type text NOT NULL DEFAULT 'SINGLE_CHOICE' CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','ESSAY','SHORT_ANSWER','MATCHING','COMPLEX_MULTIPLE','NUMERIC','OTHER')),
    current_version_id uuid,
    status_id uuid REFERENCES question.question_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_question_code ON question.question(question_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_question_type ON question.question(question_type);
CREATE INDEX idx_question_status ON question.question(status_id);
CREATE INDEX idx_question_owner ON question.question(owner_id);
CREATE TRIGGER trg_question_updated BEFORE UPDATE ON question.question
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    version_no int NOT NULL DEFAULT 1,
    change_summary text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    is_current boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, version_no)
);
CREATE INDEX idx_question_version_question ON question.question_version(question_id);
CREATE INDEX idx_question_version_current ON question.question_version(question_id) WHERE is_current;

-- Circular FK: question.current_version_id -> question_version (resolved after both tables exist).
ALTER TABLE question.question ADD CONSTRAINT fk_question_current_version
    FOREIGN KEY (current_version_id) REFERENCES question.question_version(id);
