-- Migration 221: data siswa & rombel per tahun ajaran (desain 02 §2.2).

CREATE TABLE academic.school_demographic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES academic.school(id) ON DELETE CASCADE,
    academic_year varchar(20) NOT NULL,
    total_students int NOT NULL DEFAULT 0 CHECK (total_students >= 0),
    total_rombel int NOT NULL DEFAULT 0 CHECK (total_rombel >= 0),
    grade_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, academic_year)
);
CREATE INDEX idx_school_demographic_school ON academic.school_demographic(school_id);
