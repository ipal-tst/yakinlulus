-- Migration 165: ai provider, model & parameter configuration.

CREATE TABLE config.ai_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(30) NOT NULL CHECK (provider IN ('OPENAI','GEMINI','ANTHROPIC','OLLAMA')),
    endpoint varchar(500),
    api_key varchar(255),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_ai_provider_updated BEFORE UPDATE ON config.ai_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.ai_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES config.ai_provider(id) ON DELETE CASCADE,
    model_name varchar(120) NOT NULL,
    purpose varchar(20) NOT NULL DEFAULT 'CHAT' CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, model_name, purpose)
);
CREATE TRIGGER trg_ai_model_updated BEFORE UPDATE ON config.ai_model
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.ai_parameter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES config.ai_model(id) ON DELETE CASCADE,
    temperature numeric(4,2) NOT NULL DEFAULT 0.7,
    max_token int NOT NULL DEFAULT 2048,
    top_p numeric(4,2) NOT NULL DEFAULT 0.9,
    frequency_penalty numeric(4,2) NOT NULL DEFAULT 0,
    presence_penalty numeric(4,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (model_id)
);
CREATE TRIGGER trg_ai_parameter_updated BEFORE UPDATE ON config.ai_parameter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();