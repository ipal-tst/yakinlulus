-- Migration 214: identity.student_target (per-user ranked school choices).
-- Lives under the identity schema (user's own domain) alongside identity.user_profile.

CREATE TABLE identity.student_target (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    choice int NOT NULL DEFAULT 1 CHECK (choice IN (1,2)),
    target_type varchar(30),
    target_school_id uuid REFERENCES academic.school(id) ON DELETE SET NULL,
    school_name varchar(200),
    major varchar(120),
    passing_score_irt numeric(10,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_student_target_user_choice ON identity.student_target(user_id, choice);
CREATE INDEX idx_student_target_user ON identity.student_target(user_id);