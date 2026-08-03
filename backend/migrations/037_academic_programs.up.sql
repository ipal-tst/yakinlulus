-- Migration 037: Create academic_programs table for admin Programs page.
-- The admin UI already references /academic/programs but the table and
-- endpoints never existed (the page previously fell back to mock data).

CREATE TABLE IF NOT EXISTS academic_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    target_type VARCHAR(30) NOT NULL DEFAULT 'SNBT_UTBK'
        CHECK (target_type IN ('SNBT_UTBK', 'MANDIRI_PTN', 'KEDINASAN', 'SIMAK_UI')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ARCHIVED', 'UPCOMING')),
    description TEXT,
    enrolled_students INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_programs_status ON academic_programs(status);
CREATE INDEX IF NOT EXISTS idx_academic_programs_academic_year ON academic_programs(academic_year);
