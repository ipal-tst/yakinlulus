-- Migration 125: ai usage daily rollup, usage ledger.

CREATE TABLE ai.ai_usage_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    provider varchar(30),
    model varchar(120),
    purpose varchar(20),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    request_count int NOT NULL DEFAULT 0,
    estimated_cost numeric(18,8) NOT NULL DEFAULT 0,
    UNIQUE (user_id, usage_date, model, purpose)
);
CREATE INDEX idx_ai_usage_daily_user ON ai.ai_usage_daily(user_id, usage_date DESC);

CREATE TABLE ai.ai_usage_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usage_id uuid NOT NULL REFERENCES ai.ai_usage(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token_count int NOT NULL DEFAULT 0,
    cost numeric(18,8) NOT NULL DEFAULT 0,
    debit_credit varchar(10) NOT NULL CHECK (debit_credit IN ('DEBIT','CREDIT')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_ledger_user ON ai.ai_usage_ledger(user_id, created_at);
CREATE INDEX idx_ai_usage_ledger_usage ON ai.ai_usage_ledger(usage_id);