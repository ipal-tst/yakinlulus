-- Migration 072: practice set + questions; resolve deferred question_practice FK from Phase 4.

CREATE TABLE content.practice_set (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_set_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    description text,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_practice_set_code ON content.practice_set(practice_set_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_practice_set_owner ON content.practice_set(owner_id);
CREATE TRIGGER trg_practice_set_updated BEFORE UPDATE ON content.practice_set
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.practice_set_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_set_id uuid NOT NULL REFERENCES content.practice_set(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    question_order int NOT NULL DEFAULT 0,
    score numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (practice_set_id, question_id)
);
CREATE INDEX idx_practice_set_question_set ON content.practice_set_question(practice_set_id);
CREATE INDEX idx_practice_set_question_q ON content.practice_set_question(question_id);

-- Deferred FK from Phase 4: question.question_practice.practice_set_id -> content.practice_set.
ALTER TABLE question.question_practice ADD CONSTRAINT fk_question_practice
    FOREIGN KEY (practice_set_id) REFERENCES content.practice_set(id);
