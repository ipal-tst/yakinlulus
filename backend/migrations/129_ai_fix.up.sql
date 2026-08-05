-- Migration 129: ai generation log, moderation log, deferred material_embedding FK.

CREATE TABLE ai.ai_generation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    prompt_template_id uuid REFERENCES ai.ai_prompt_template(id) ON DELETE SET NULL,
    model varchar(120),
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','CANCELLED')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    error text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz
);
CREATE INDEX idx_ai_generation_log_user ON ai.ai_generation_log(user_id, started_at DESC);
CREATE INDEX idx_ai_generation_log_conversation ON ai.ai_generation_log(conversation_id);

CREATE TABLE ai.ai_moderation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    message_id uuid REFERENCES ai.ai_message(id) ON DELETE SET NULL,
    content text,
    decision varchar(20) NOT NULL CHECK (decision IN ('ALLOW','BLOCK','FLAG')),
    reason varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_moderation_log_user ON ai.ai_moderation_log(user_id);
CREATE INDEX idx_ai_moderation_log_decision ON ai.ai_moderation_log(decision, created_at);

-- Resolve deferred FK promised in 071_material_ai.up.sql.
ALTER TABLE content.material_embedding
  ADD CONSTRAINT fk_material_embedding_embedding_id
  FOREIGN KEY (embedding_id) REFERENCES ai.embedding(id);