-- Migration 022: Platform simplify + Grade-based RBAC
-- Add grade_id to users, questions, materials, exams
-- Drop generator JSONB columns from questions (platform only stores final data)
-- Drop deprecated VARCHAR topic (use topic_id FK)

-- ========== USERS: add grade_id for student access control ==========
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id);

CREATE INDEX IF NOT EXISTS idx_users_grade_id ON users(grade_id);

COMMENT ON COLUMN users.grade_id IS 'Grade terdaftar siswa. Admin/Staff/Teacher bisa NULL. Student wajib diisi.';

-- ========== QUESTIONS: add grade_id + drop generator columns ==========
-- grade_id is derived from subject_id → subject.grade_id (denormalized for fast filtering)
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id);

CREATE INDEX IF NOT EXISTS idx_questions_grade_id ON questions(grade_id);

-- Drop generator JSONB columns (moved to Generator project)
-- Keep only what platform needs for display/filter
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='difficulty_params') THEN
        ALTER TABLE questions
            DROP COLUMN difficulty_params,
            DROP COLUMN distractor_patterns,
            DROP COLUMN cognitive_skills,
            DROP COLUMN prerequisites,
            DROP COLUMN ai_metadata;
    END IF;
END $$;

-- Drop deprecated VARCHAR topic (use topic_id FK)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='topic') THEN
        ALTER TABLE questions DROP COLUMN topic;
    END IF;
END $$;

-- ========== MATERIALS: add grade_id ==========
-- grade_id derived from subject_id → subject.grade_id
ALTER TABLE materials
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id);

CREATE INDEX IF NOT EXISTS idx_materials_grade_id ON materials(grade_id);

-- ========== EXAMS: add grade_id ==========
ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id);

CREATE INDEX IF NOT EXISTS idx_exams_grade_id ON exams(grade_id);

-- ========== VIEW: User accessible grades (for fast checking) ==========
-- Grade 6 can access SD (4,5,6), Grade 9 can access SMP (7,8,9), Grade 12 can access SMA (10,11,12)
CREATE OR REPLACE VIEW user_accessible_grades AS
SELECT
    u.id AS user_id,
    u.grade_id AS registered_grade,
    CASE
        WHEN u.grade_id IS NULL THEN ARRAY[]::UUID[]
        ELSE (
            SELECT array_agg(g.id)
            FROM grades g
            JOIN education_levels el ON g.education_level_id = el.id
            WHERE
                (g.id = u.grade_id) OR
                (u.grade_id IN (SELECT id FROM grades WHERE name = '6' AND education_level_id = (SELECT id FROM education_levels WHERE code = 'SD')) AND el.code = 'SD') OR
                (u.grade_id IN (SELECT id FROM grades WHERE name = '9' AND education_level_id = (SELECT id FROM education_levels WHERE code = 'SMP')) AND el.code = 'SMP') OR
                (u.grade_id IN (SELECT id FROM grades WHERE name = '12' AND education_level_id = (SELECT id FROM education_levels WHERE code = 'SMA')) AND el.code = 'SMA')
        )
    END AS accessible_grade_ids
FROM users u;

-- ========== TRIGGER: auto-set grade_id on questions from subject ==========
-- When question created/updated via subject_id, auto-set grade_id from subject
CREATE OR REPLACE FUNCTION set_question_grade_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        NEW.grade_id := (SELECT grade_id FROM subjects WHERE id = NEW.subject_id);
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_grade_id ON questions;
CREATE TRIGGER trg_questions_grade_id
    BEFORE INSERT OR UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_question_grade_id();

-- ========== TRIGGER: auto-set grade_id on materials from subject ==========
CREATE OR REPLACE FUNCTION set_material_grade_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        NEW.grade_id := (SELECT grade_id FROM subjects WHERE id = NEW.subject_id);
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materials_grade_id ON materials;
CREATE TRIGGER trg_materials_grade_id
    BEFORE INSERT OR UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION set_material_grade_id();

-- ========== TRIGGER: auto-set grade_id on exams from first question ==========
-- Or from exam_blueprint later. For now nullable, set manually when exam published.
-- Can also derive from exam_questions join questions.