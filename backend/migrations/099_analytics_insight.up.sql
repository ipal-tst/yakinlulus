-- Migration 099: ai recommendation, retention cohort, funnel.

CREATE TABLE analytics.analytics_ai_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    subject_id uuid,
    chapter_id uuid,
    recommended_material uuid[],
    recommended_question_set uuid[],
    confidence_score numeric(5,2) NOT NULL DEFAULT 0,
    reason text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_ai_rec_student ON analytics.analytics_ai_recommendation(student_id);
CREATE INDEX idx_analytics_ai_rec_subject ON analytics.analytics_ai_recommendation(subject_id);
CREATE TRIGGER trg_analytics_ai_rec_updated BEFORE UPDATE ON analytics.analytics_ai_recommendation
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id/subject_id/chapter_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_retention (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    day1 numeric(5,2) NOT NULL DEFAULT 0,
    day7 numeric(5,2) NOT NULL DEFAULT 0,
    day14 numeric(5,2) NOT NULL DEFAULT 0,
    day30 numeric(5,2) NOT NULL DEFAULT 0,
    day60 numeric(5,2) NOT NULL DEFAULT 0,
    day90 numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_analytics_retention_updated BEFORE UPDATE ON analytics.analytics_retention
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_funnel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    visitor int NOT NULL DEFAULT 0,
    register int NOT NULL DEFAULT 0,
    verification int NOT NULL DEFAULT 0,
    membership_trial int NOT NULL DEFAULT 0,
    membership_paid int NOT NULL DEFAULT 0,
    active_student int NOT NULL DEFAULT 0,
    conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_funnel_date ON analytics.analytics_funnel(date);
CREATE TRIGGER trg_analytics_funnel_updated BEFORE UPDATE ON analytics.analytics_funnel
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
