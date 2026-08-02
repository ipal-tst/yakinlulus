-- Migration 036: Add missing summary column to question_revisions.
-- The code inserts/selects summary but the column was never created
-- (migration 014 predates the code that uses it).

ALTER TABLE question_revisions ADD COLUMN IF NOT EXISTS summary VARCHAR(255);
