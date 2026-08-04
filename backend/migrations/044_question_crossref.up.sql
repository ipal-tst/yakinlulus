-- Migration 044: question cross-reference (FK to cbt/content added in their phases).

CREATE TABLE question.question_exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    exam_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, exam_id)
);
CREATE INDEX idx_question_exam_exam ON question.question_exam(exam_id);
-- FK exam_id -> cbt.exam ditambahkan di Phase 5 (ALTER TABLE ADD CONSTRAINT).

CREATE TABLE question.question_practice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    practice_set_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, practice_set_id)
);
CREATE INDEX idx_question_practice_set ON question.question_practice(practice_set_id);
-- FK practice_set_id -> content.practice_set ditambahkan di Phase 6.

CREATE TABLE question.question_learning_material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    material_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, material_id)
);
CREATE INDEX idx_question_material ON question.question_learning_material(material_id);
-- FK material_id -> content.material ditambahkan di Phase 6.

CREATE TABLE question.question_ai_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    ai_model varchar(120),
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ai_usage_question ON question.question_ai_usage(question_id);
