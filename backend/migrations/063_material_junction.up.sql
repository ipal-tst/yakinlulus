-- Migration 063: material junctions N:M to academic domain.

CREATE TABLE content.material_subject (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, subject_id)
);
CREATE INDEX idx_material_subject_ref ON content.material_subject(subject_id);

CREATE TABLE content.material_grade (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, grade_id)
);
CREATE INDEX idx_material_grade_ref ON content.material_grade(grade_id);

CREATE TABLE content.material_major (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    major_id uuid NOT NULL REFERENCES academic.major(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, major_id)
);
CREATE INDEX idx_material_major_ref ON content.material_major(major_id);

CREATE TABLE content.material_curriculum (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, curriculum_id)
);
CREATE INDEX idx_material_curriculum_ref ON content.material_curriculum(curriculum_id);

CREATE TABLE content.material_chapter (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, chapter_id)
);
CREATE INDEX idx_material_chapter_ref ON content.material_chapter(chapter_id);

CREATE TABLE content.material_subchapter (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, subchapter_id)
);
CREATE INDEX idx_material_subchapter_ref ON content.material_subchapter(subchapter_id);

CREATE TABLE content.material_topic (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, topic_id)
);
CREATE INDEX idx_material_topic_ref ON content.material_topic(topic_id);

CREATE TABLE content.material_competency (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, competency_id)
);
CREATE INDEX idx_material_competency_ref ON content.material_competency(competency_id);

CREATE TABLE content.material_skill (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, skill_id)
);
CREATE INDEX idx_material_skill_ref ON content.material_skill(skill_id);

CREATE TABLE content.material_tag (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (material_id, tag)
);
