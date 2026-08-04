CREATE TABLE academic.school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn varchar(20),
    name varchar(200) NOT NULL,
    province varchar(100),
    city varchar(100),
    district varchar(100),
    address text,
    phone varchar(30),
    email varchar(255),
    website text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_school_npsn ON academic.school(npsn) WHERE npsn IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_school_active ON academic.school(is_active);
CREATE TRIGGER trg_school_updated BEFORE UPDATE ON academic.school
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.school_class (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES academic.school(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE SET NULL,
    major_id uuid REFERENCES academic.major(id) ON DELETE SET NULL,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE SET NULL,
    name varchar(120) NOT NULL,
    capacity int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_school_class_school ON academic.school_class(school_id);

CREATE TABLE academic.teacher_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_id uuid REFERENCES academic.school(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE CASCADE,
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    major_id uuid REFERENCES academic.major(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, school_id, subject_id, grade_id, major_id)
);

CREATE TABLE academic.teacher_homeroom (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    school_class_id uuid NOT NULL REFERENCES academic.school_class(id) ON DELETE CASCADE,
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, school_class_id, academic_year_id)
);

CREATE TABLE academic.academic_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id uuid REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    semester_id uuid REFERENCES academic.semester(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    event_type varchar(20) CHECK (event_type IN ('PTS','PAS','LIBUR','PPDB','UTBK','AKM','TKA')),
    start_date date,
    end_date date,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_academic_event_range ON academic.academic_event(start_date, end_date);
