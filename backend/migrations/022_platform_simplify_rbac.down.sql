-- Migration 022: Rollback platform simplify + RBAC

DROP TRIGGER IF EXISTS trg_materials_grade_id ON materials;
DROP FUNCTION IF EXISTS set_material_grade_id();
DROP TRIGGER IF EXISTS trg_questions_grade_id ON questions;
DROP FUNCTION IF EXISTS set_question_grade_id();
DROP VIEW IF EXISTS user_accessible_grades;

DROP INDEX IF EXISTS idx_exams_grade_id;
ALTER TABLE exams DROP COLUMN IF EXISTS grade_id;

DROP INDEX IF EXISTS idx_materials_grade_id;
ALTER TABLE materials DROP COLUMN IF EXISTS grade_id;

DROP INDEX IF EXISTS idx_questions_grade_id;
ALTER TABLE questions DROP COLUMN IF EXISTS grade_id;

-- Re-add generator JSONB columns (if needed for rollback)
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS difficulty_params JSONB,
    ADD COLUMN IF NOT EXISTS distractor_patterns JSONB,
    ADD COLUMN IF NOT EXISTS cognitive_skills JSONB,
    ADD COLUMN IF NOT EXISTS prerequisites JSONB,
    ADD COLUMN IF NOT EXISTS ai_metadata JSONB,
    ADD COLUMN IF NOT EXISTS topic VARCHAR(255);

DROP INDEX IF EXISTS idx_users_grade_id;
ALTER TABLE users DROP COLUMN IF EXISTS grade_id;