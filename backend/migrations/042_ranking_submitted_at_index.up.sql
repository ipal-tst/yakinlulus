-- Migration 042: index submitted_at for the monthly leaderboard range scan
CREATE INDEX IF NOT EXISTS idx_content_exam_attempts_submitted_at
    ON content_exam_attempts(submitted_at);

CREATE INDEX IF NOT EXISTS idx_content_exam_attempts_exam_submitted
    ON content_exam_attempts(exam_content_id, submitted_at);
