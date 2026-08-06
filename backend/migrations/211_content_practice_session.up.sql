-- Migration 211: practice session master (genuine schema gap; practice module
-- had no dedicated session table in the new schema design).
CREATE TABLE content.practice_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    subject_id uuid,
    grade_id uuid,
    status text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','GRADED','SUBMITTED')),
    total_score numeric(10,2) NOT NULL DEFAULT 0,
    max_score numeric(10,2) NOT NULL DEFAULT 0,
    answered_count int NOT NULL DEFAULT 0,
    correct_count int NOT NULL DEFAULT 0,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_practice_session_student ON content.practice_session(student_id);
CREATE INDEX idx_practice_session_status ON content.practice_session(status);
-- subject_id/grade_id: uuid TANPA FK, polymorphic reference ke academic (no FK per design).
CREATE TRIGGER trg_practice_session_updated BEFORE UPDATE ON content.practice_session
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();