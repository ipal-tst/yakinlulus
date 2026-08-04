CREATE TABLE academic.chapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_subject_id uuid NOT NULL REFERENCES academic.curriculum_subject(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    description text,
    estimated_minutes int,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chapter_cs ON academic.chapter(curriculum_subject_id);
CREATE TRIGGER trg_chapter_updated BEFORE UPDATE ON academic.chapter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE academic.subchapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    description text,
    estimated_minutes int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subchapter_chapter ON academic.subchapter(chapter_id);

CREATE TABLE academic.competency (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid REFERENCES academic.chapter(id) ON DELETE CASCADE,
    code varchar(30),
    title varchar(200) NOT NULL,
    description text,
    difficulty_level varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_competency_chapter ON academic.competency(chapter_id);

CREATE TABLE academic.learning_outcome (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    title varchar(250) NOT NULL,
    description text,
    blooms_level varchar(20) CHECK (blooms_level IN ('REMEMBER','UNDERSTAND','APPLY','ANALYZE','EVALUATE','CREATE')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_outcome_competency ON academic.learning_outcome(competency_id);

CREATE TABLE academic.topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    description text,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_topic_subchapter ON academic.topic(subchapter_id);

CREATE TABLE academic.skill (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_skill_code ON academic.skill(code);

CREATE TABLE academic.topic_skill (
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, skill_id)
);