CREATE TABLE academic.academic_year (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    start_date date,
    end_date date,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_academic_year_code ON academic.academic_year(code);
CREATE TRIGGER trg_academic_year_updated BEFORE UPDATE ON academic.academic_year
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.semester (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id uuid NOT NULL REFERENCES academic.academic_year(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    order_no int NOT NULL DEFAULT 1,
    start_date date,
    end_date date,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (academic_year_id, order_no)
);
CREATE TRIGGER trg_semester_updated BEFORE UPDATE ON academic.semester
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.education_level (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(100) NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    icon text,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_education_level_code ON academic.education_level(code);

CREATE TABLE academic.grade (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES academic.education_level(id) ON DELETE CASCADE,
    code varchar(10) NOT NULL,
    name varchar(60) NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (education_level_id, code)
);
CREATE INDEX idx_grade_level ON academic.grade(education_level_id);

CREATE TABLE academic.major (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES academic.education_level(id) ON DELETE CASCADE,
    code varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (education_level_id, code)
);
CREATE INDEX idx_major_level ON academic.major(education_level_id);
