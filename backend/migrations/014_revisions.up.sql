CREATE TABLE question_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    explanation TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    changed_by UUID REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_question_revisions_question_rev ON question_revisions (question_id, revision);
CREATE INDEX idx_question_revisions_question_id ON question_revisions (question_id);
CREATE INDEX idx_question_revisions_changed_by ON question_revisions (changed_by);
