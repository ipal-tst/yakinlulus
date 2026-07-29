-- Rollback question_type addition
ALTER TABLE questions DROP COLUMN IF EXISTS question_type;