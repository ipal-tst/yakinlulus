-- Migration 051: exam junctions N:M to academic domain.

CREATE TABLE cbt.exam_subject (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, subject_id)
);
CREATE INDEX idx_exam_subject_ref ON cbt.exam_subject(subject_id);

CREATE TABLE cbt.exam_grade (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, grade_id)
);
CREATE INDEX idx_exam_grade_ref ON cbt.exam_grade(grade_id);

CREATE TABLE cbt.exam_curriculum (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, curriculum_id)
);
CREATE INDEX idx_exam_curriculum_ref ON cbt.exam_curriculum(curriculum_id);

CREATE TABLE cbt.exam_chapter (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, chapter_id)
);
CREATE INDEX idx_exam_chapter_ref ON cbt.exam_chapter(chapter_id);

CREATE TABLE cbt.exam_topic (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, topic_id)
);
CREATE INDEX idx_exam_topic_ref ON cbt.exam_topic(topic_id);

CREATE TABLE cbt.exam_competency (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, competency_id)
);
CREATE INDEX idx_exam_competency_ref ON cbt.exam_competency(competency_id);

CREATE TABLE cbt.exam_tag (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (exam_id, tag)
);
