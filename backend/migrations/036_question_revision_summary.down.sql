-- Migration 036 (down): remove summary column added in up migration

ALTER TABLE question_revisions DROP COLUMN IF EXISTS summary;
