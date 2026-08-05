-- Migration 128: ai recommendation, recommendation feedback, weak topic.

CREATE TABLE ai.ai_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rec_type varchar(20) NOT NULL CHECK (rec_type IN ('WEAK_TOPIC','MATERIAL','PRACTICE','EXAM','TUTOR')),
    recommended_entity_type varchar(30),
    recommended_entity_id uuid,
    reason text,
    confidence numeric(6,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source varchar(30) NOT NULL CHECK (source IN ('RAG','RULE','HYBRID','MATERIAL_EMBEDDING')),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, rec_type, recommended_entity_type, recommended_entity_id)
);
CREATE INDEX idx_ai_recommendation_user ON ai.ai_recommendation(user_id, created_at DESC, confidence DESC);
CREATE INDEX idx_ai_recommendation_entity ON ai.ai_recommendation(recommended_entity_type, recommended_entity_id);

CREATE TABLE ai.ai_recommendation_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id uuid NOT NULL REFERENCES ai.ai_recommendation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    feedback varchar(20) NOT NULL CHECK (feedback IN ('ACCEPTED','REJECTED','IGNORED')),
    comment text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_recommendation_fb_rec ON ai.ai_recommendation_feedback(recommendation_id);
CREATE INDEX idx_ai_recommendation_fb_user ON ai.ai_recommendation_feedback(user_id);

CREATE TABLE ai.weak_topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    topic_id uuid REFERENCES academic.topic(id) ON DELETE CASCADE,
    mastery_level numeric(6,4) NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 1),
    reason jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_id)
);
CREATE INDEX idx_weak_topic_user ON ai.weak_topic(user_id, mastery_level);
CREATE TRIGGER trg_weak_topic_updated BEFORE UPDATE ON ai.weak_topic
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();