-- Relasi siswa ↔ kelas (gap: schema akademik tidak memiliki relasi siswa ke kelas).
CREATE TABLE academic.student_enrollment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_id uuid REFERENCES academic.school(id) ON DELETE CASCADE,
    school_class_id uuid REFERENCES academic.school_class(id) ON DELETE SET NULL,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE SET NULL,
    major_id uuid REFERENCES academic.major(id) ON DELETE SET NULL,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRANSFERRED','GRADUATED','DROPPED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, academic_year_id)
);
CREATE INDEX idx_student_enrollment_school ON academic.student_enrollment(school_id);
CREATE INDEX idx_student_enrollment_class ON academic.student_enrollment(school_class_id);
CREATE TRIGGER trg_student_enrollment_updated BEFORE UPDATE ON academic.student_enrollment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();