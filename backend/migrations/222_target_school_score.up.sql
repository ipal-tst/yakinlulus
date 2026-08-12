-- Migration 222: nilai penerimaan per tahun ajaran (desain 03 §2.2).

CREATE TABLE academic.target_school_score (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_school_id uuid NOT NULL REFERENCES academic.target_school(id) ON DELETE CASCADE,
    academic_year varchar(20) NOT NULL,
    min_score int,
    max_score int,
    max_total_score int NOT NULL DEFAULT 400,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (target_school_id, academic_year),
    CHECK (min_score IS NULL OR min_score >= 0),
    CHECK (max_score IS NULL OR max_score <= max_total_score),
    CHECK (min_score IS NULL OR max_score IS NULL OR max_score >= min_score)
);
CREATE INDEX idx_target_score_payung ON academic.target_school_score(target_school_id);

-- backfill dari kolom inline payung (nilai lama) — hanya bila tahun tersedia
INSERT INTO academic.target_school_score (target_school_id, academic_year, min_score, max_score, max_total_score)
SELECT id, academic_year, min_score, max_score, max_total_score
FROM academic.target_school
WHERE academic_year IS NOT NULL AND academic_year <> '' AND deleted_at IS NULL
ON CONFLICT (target_school_id, academic_year) DO NOTHING;
