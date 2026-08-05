-- Migration 120: ai provider, model, model pricing.

CREATE TABLE ai.ai_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL CHECK (code IN ('OPENAI','ANTHROPIC','GOOGLE','MISTRAL','LOCAL','OTHER')),
    name varchar(120) NOT NULL,
    base_url text,
    api_key_ref text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);
CREATE TRIGGER trg_ai_provider_updated BEFORE UPDATE ON ai.ai_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES ai.ai_provider(id) ON DELETE CASCADE,
    model_name varchar(120) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    dimension int,
    context_window int,
    max_tokens int,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, model_name)
);
CREATE INDEX idx_ai_model_provider ON ai.ai_model(provider_id);
CREATE INDEX idx_ai_model_purpose ON ai.ai_model(purpose);
CREATE INDEX idx_ai_model_active ON ai.ai_model(is_active);
CREATE TRIGGER trg_ai_model_updated BEFORE UPDATE ON ai.ai_model
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_model_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES ai.ai_model(id) ON DELETE CASCADE,
    currency char(3) NOT NULL DEFAULT 'IDR',
    input_cost numeric(18,8) NOT NULL DEFAULT 0,
    output_cost numeric(18,8) NOT NULL DEFAULT 0,
    effective_from timestamptz NOT NULL DEFAULT NOW(),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_model_pricing_model ON ai.ai_model_pricing(model_id);
CREATE TRIGGER trg_ai_model_pricing_updated BEFORE UPDATE ON ai.ai_model_pricing
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();