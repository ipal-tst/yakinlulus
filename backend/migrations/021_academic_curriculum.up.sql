CREATE TABLE academic.curriculum (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    version varchar(30),
    effective_year int,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_curriculum_code ON academic.curriculum(code);
CREATE TRIGGER trg_curriculum_updated BEFORE UPDATE ON academic.curriculum
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    description text,
    icon text,
    color varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_subject_code ON academic.subject(code);
CREATE TRIGGER trg_subject_updated BEFORE UPDATE ON academic.subject
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.curriculum_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    education_level_id uuid REFERENCES academic.education_level(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    major_id uuid REFERENCES academic.major(id) ON DELETE CASCADE,
    semester_id uuid REFERENCES academic.semester(id) ON DELETE CASCADE,
    is_required boolean NOT NULL DEFAULT true,
    credit int NOT NULL DEFAULT 0,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_curriculum_subject
  ON academic.curriculum_subject(curriculum_id, subject_id, education_level_id, grade_id, major_id);
CREATE INDEX idx_curriculum_subject_subject ON academic.curriculum_subject(subject_id);