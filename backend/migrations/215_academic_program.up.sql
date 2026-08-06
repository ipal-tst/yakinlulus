-- Migration 215: academic.program (replaces legacy curriculums/programs used by academic delete cascade).

CREATE TABLE academic.program (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(200) NOT NULL,
    education_level_id uuid REFERENCES academic.education_level(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_academic_program_code ON academic.program(code) WHERE deleted_at IS NULL;