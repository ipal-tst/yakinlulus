-- Migration 038: Create student_targets for the enhanced student profile page
-- (Target Sekolah & Jurusan). Certificates are derived live from the results
-- table (real exam data), so no separate table is needed.

CREATE TABLE IF NOT EXISTS student_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    choice INT NOT NULL DEFAULT 1 CHECK (choice IN (1, 2)),
    university VARCHAR(200) NOT NULL,
    major VARCHAR(200) NOT NULL,
    passing_score_irt INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, choice)
);

CREATE INDEX IF NOT EXISTS idx_student_targets_user ON student_targets(user_id);
