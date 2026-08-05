-- Migration 122: ai message, tutor session, feedback.

CREATE TABLE ai.ai_message (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    role varchar(20) NOT NULL CHECK (role IN ('USER','ASSISTANT','SYSTEM','TOOL')),
    content text NOT NULL,
    content_type varchar(20) NOT NULL DEFAULT 'TEXT' CHECK (content_type IN ('TEXT','MARKDOWN','CODE','IMAGE','AUDIO')),
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_message_conversation ON ai.ai_message(conversation_id, created_at);
CREATE INDEX idx_ai_message_sender ON ai.ai_message(sender_id);
CREATE TRIGGER trg_ai_message_updated BEFORE UPDATE ON ai.ai_message
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_tutor_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    purpose varchar(30) NOT NULL CHECK (purpose IN ('CHAT','TUTOR','PRACTICE','SUMARIZE','QA')),
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','ABANDONED')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    meta jsonb
);
CREATE INDEX idx_ai_tutor_session_user ON ai.ai_tutor_session(user_id, status);
CREATE INDEX idx_ai_tutor_session_conversation ON ai.ai_tutor_session(conversation_id);

CREATE TABLE ai.ai_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    message_id uuid REFERENCES ai.ai_message(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rating int CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_feedback_user ON ai.ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_message ON ai.ai_feedback(message_id);