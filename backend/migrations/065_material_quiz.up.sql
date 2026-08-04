-- Migration 065: material quiz & quiz questions.

CREATE TABLE content.material_quiz (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_quiz_material ON content.material_quiz(material_id);

CREATE TABLE content.material_quiz_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid NOT NULL REFERENCES content.material_quiz(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, question_id)
);
CREATE INDEX idx_material_quiz_question_quiz ON content.material_quiz_question(quiz_id);
CREATE INDEX idx_material_quiz_question_q ON content.material_quiz_question(question_id);
