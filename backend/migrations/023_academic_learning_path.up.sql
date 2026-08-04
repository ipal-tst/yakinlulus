CREATE TABLE academic.learning_path (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id uuid REFERENCES academic.grade(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    description text,
    estimated_hours int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_learning_path_grade_subject ON academic.learning_path(grade_id, subject_id);

CREATE TABLE academic.learning_path_topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id uuid NOT NULL REFERENCES academic.learning_path(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    sequence_no int NOT NULL DEFAULT 0,
    UNIQUE (learning_path_id, sequence_no)
);
CREATE INDEX idx_lp_topic_topic ON academic.learning_path_topic(topic_id);
