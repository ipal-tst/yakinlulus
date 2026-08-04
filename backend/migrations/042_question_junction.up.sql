-- Migration 042: question junctions N:M to academic domain.

CREATE TABLE question.question_subject (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, subject_id)
);
CREATE INDEX idx_question_subject_ref ON question.question_subject(subject_id);

CREATE TABLE question.question_grade (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, grade_id)
);
CREATE INDEX idx_question_grade_ref ON question.question_grade(grade_id);

CREATE TABLE question.question_major (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    major_id uuid NOT NULL REFERENCES academic.major(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, major_id)
);
CREATE INDEX idx_question_major_ref ON question.question_major(major_id);

CREATE TABLE question.question_curriculum (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, curriculum_id)
);
CREATE INDEX idx_question_curriculum_ref ON question.question_curriculum(curriculum_id);

CREATE TABLE question.question_chapter (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, chapter_id)
);
CREATE INDEX idx_question_chapter_ref ON question.question_chapter(chapter_id);

CREATE TABLE question.question_subchapter (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, subchapter_id)
);
CREATE INDEX idx_question_subchapter_ref ON question.question_subchapter(subchapter_id);

CREATE TABLE question.question_topic (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_id)
);
CREATE INDEX idx_question_topic_ref ON question.question_topic(topic_id);

CREATE TABLE question.question_competency (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, competency_id)
);
CREATE INDEX idx_question_competency_ref ON question.question_competency(competency_id);

CREATE TABLE question.question_skill (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, skill_id)
);
CREATE INDEX idx_question_skill_ref ON question.question_skill(skill_id);

CREATE TABLE question.question_tag (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (question_id, tag)
);