-- Down migration for 042 removes the ranking range-scan indexes
DROP INDEX IF EXISTS idx_content_exam_attempts_submitted_at;
DROP INDEX IF EXISTS idx_content_exam_attempts_exam_submitted;
