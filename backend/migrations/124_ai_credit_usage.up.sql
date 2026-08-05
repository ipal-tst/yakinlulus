-- Migration 124: ai credit transaction, ai usage.

CREATE TABLE ai.ai_credit_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id uuid NOT NULL REFERENCES ai.ai_credit(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    tx_type varchar(20) NOT NULL CHECK (tx_type IN ('TOPUP','SPEND','REFUND','EXPIRE','ADJUST')),
    amount numeric(18,6) NOT NULL,
    balance_after numeric(18,6) NOT NULL,
    reference_type varchar(30),
    reference_id uuid,
    note text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_credit_tx_credit ON ai.ai_credit_transaction(credit_id, created_at DESC);
CREATE INDEX idx_ai_credit_tx_user ON ai.ai_credit_transaction(user_id, created_at);
CREATE INDEX idx_ai_credit_tx_ref ON ai.ai_credit_transaction(reference_type, reference_id);

CREATE TABLE ai.ai_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    provider varchar(30) NOT NULL,
    model varchar(120) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    estimated_cost numeric(18,8) NOT NULL DEFAULT 0,
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_user ON ai.ai_usage(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_model ON ai.ai_usage(model, created_at);
CREATE INDEX idx_ai_usage_conversation ON ai.ai_usage(conversation_id);