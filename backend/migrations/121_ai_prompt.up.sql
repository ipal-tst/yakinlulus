-- Migration 121: ai prompt template, conversation, conversation participant.

CREATE TABLE ai.ai_prompt_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(60) NOT NULL,
    name varchar(200) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    system_prompt text,
    user_template text,
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    version int NOT NULL DEFAULT 1,
    parameters jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code, version)
);
CREATE INDEX idx_ai_prompt_template_active ON ai.ai_prompt_template(is_active, purpose);
CREATE TRIGGER trg_ai_prompt_template_updated BEFORE UPDATE ON ai.ai_prompt_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_conversation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    title varchar(200),
    subject_id uuid REFERENCES academic.subject(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED','CLOSED')),
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_conversation_user ON ai.ai_conversation(user_id);
CREATE INDEX idx_ai_conversation_subject ON ai.ai_conversation(subject_id);
CREATE INDEX idx_ai_conversation_status ON ai.ai_conversation(status, updated_at DESC);
CREATE TRIGGER trg_ai_conversation_updated BEFORE UPDATE ON ai.ai_conversation
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_conversation_participant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    participant_role varchar(20) NOT NULL CHECK (participant_role IN ('OWNER','MEMBER','AI_TUTOR')),
    joined_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id, user_id, participant_role)
);
CREATE INDEX idx_ai_conv_participant_user ON ai.ai_conversation_participant(user_id);