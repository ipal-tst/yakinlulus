-- Migration 094: daily school/subject/chapter analytics snapshot.

CREATE TABLE analytics.analytics_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL,
    date date NOT NULL,
    active_student int NOT NULL DEFAULT 0,
    active_teacher int NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    learning_hour int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    average_completion numeric(5,2) NOT NULL DEFAULT 0,
    ranking int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, school_id)
);
CREATE INDEX idx_analytics_school_school ON analytics.analytics_school(school_id);
CREATE INDEX idx_analytics_school_date ON analytics.analytics_school(date);
CREATE TRIGGER trg_analytics_school_updated BEFORE UPDATE ON analytics.analytics_school
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- school_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_subject (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid NOT NULL,
    date date NOT NULL,
    student int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    average_accuracy numeric(5,2) NOT NULL DEFAULT 0,
    average_speed int NOT NULL DEFAULT 0,
    completion numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, subject_id)
);
CREATE INDEX idx_analytics_subject_subject ON analytics.analytics_subject(subject_id);
CREATE INDEX idx_analytics_subject_date ON analytics.analytics_subject(date);
CREATE TRIGGER trg_analytics_subject_updated BEFORE UPDATE ON analytics.analytics_subject
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- subject_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_chapter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid NOT NULL,
    date date NOT NULL,
    view int NOT NULL DEFAULT 0,
    exercise int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    mastery numeric(5,2) NOT NULL DEFAULT 0,
    weakness jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, chapter_id)
);
CREATE INDEX idx_analytics_chapter_chapter ON analytics.analytics_chapter(chapter_id);
CREATE INDEX idx_analytics_chapter_date ON analytics.analytics_chapter(date);
CREATE TRIGGER trg_analytics_chapter_updated BEFORE UPDATE ON analytics.analytics_chapter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- chapter_id: uuid TANPA FK (event-driven, per 5).
