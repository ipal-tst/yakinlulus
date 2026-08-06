-- Migration 213: academic target school (extends academic.school metadata).

CREATE TABLE academic.target_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES academic.school(id) ON DELETE SET NULL,
    level varchar(20) NOT NULL DEFAULT 'SMP' CHECK (level IN ('SMP','SMA','UNIVERSITY')),
    min_score int,
    max_score int,
    max_total_score int NOT NULL DEFAULT 0,
    subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
    academic_year varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE INDEX idx_target_school_active ON academic.target_school(is_active);
CREATE INDEX idx_target_school_school ON academic.target_school(school_id);