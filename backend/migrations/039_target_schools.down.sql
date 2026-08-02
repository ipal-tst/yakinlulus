-- Migration 039 (down): revert target schools changes

ALTER TABLE student_targets DROP COLUMN IF EXISTS target_school_id;
ALTER TABLE student_targets DROP COLUMN IF EXISTS target_type;
ALTER TABLE student_targets ALTER COLUMN major SET NOT NULL;
ALTER TABLE student_targets ALTER COLUMN passing_score_irt SET NOT NULL;
ALTER TABLE student_targets RENAME COLUMN school_name TO university;

DROP TABLE IF EXISTS target_schools;
