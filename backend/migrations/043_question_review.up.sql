-- Migration 043: question review workflow & history (append-only).

CREATE TABLE question.question_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
    comment text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_review_question ON question.question_review(question_id);
CREATE INDEX idx_question_review_reviewer ON question.question_review(reviewer_id);

CREATE TABLE question.question_approval (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_at timestamptz NOT NULL DEFAULT NOW(),
    approval_note text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE question.question_validation_issue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    issue_type varchar(60) NOT NULL,
    severity varchar(20) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO','WARNING','ERROR')),
    description text,
    resolved boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_validation_question ON question.question_validation_issue(question_id);

CREATE TABLE question.question_duplicate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    duplicate_question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    similarity_score numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, duplicate_question_id)
);
CREATE INDEX idx_question_duplicate_ref ON question.question_duplicate(duplicate_question_id);

CREATE TABLE question.question_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES question.question(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','APPROVE','REVISION','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_history_question ON question.question_history(question_id);
CREATE INDEX idx_question_history_time ON question.question_history(created_at);
