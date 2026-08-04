CREATE TABLE academic.academic_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    active_academic_year uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    active_semester uuid REFERENCES academic.semester(id) ON DELETE SET NULL,
    default_curriculum uuid REFERENCES academic.curriculum(id) ON DELETE SET NULL,
    grading_method varchar(30) DEFAULT 'FLAT',
    minimum_score numeric(5,2) DEFAULT 0,
    passing_score numeric(5,2) DEFAULT 0,
    max_exam_retry int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_academic_config_updated BEFORE UPDATE ON academic.academic_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
