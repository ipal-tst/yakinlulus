-- Migration 039: Target Sekolah multi-jenjang (SMP/SMA/Universitas)
-- Master data sekolah + ambang nilai, dikelola admin & di-update tahunan.

CREATE TABLE IF NOT EXISTS target_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    level VARCHAR(20) NOT NULL
        CHECK (level IN ('SMP','SMA','UNIVERSITY')),
    min_score INT,
    max_score INT,
    max_total_score INT NOT NULL DEFAULT 400,
    subjects JSONB NOT NULL DEFAULT '[]',
    academic_year VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_schools_level ON target_schools(level);
CREATE INDEX IF NOT EXISTS idx_target_schools_active ON target_schools(is_active);

ALTER TABLE student_targets
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(20)
        CHECK (target_type IN ('SMP','SMA','UNIVERSITY'));
ALTER TABLE student_targets
    ADD COLUMN IF NOT EXISTS target_school_id UUID
        REFERENCES target_schools(id) ON DELETE SET NULL;
ALTER TABLE student_targets
    RENAME COLUMN university TO school_name;
ALTER TABLE student_targets
    ALTER COLUMN major DROP NOT NULL;
ALTER TABLE student_targets
    ALTER COLUMN passing_score_irt DROP NOT NULL;
