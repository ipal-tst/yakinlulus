-- Migration 035: System Settings for AI Configuration

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description)
VALUES 
  ('ai_endpoint', 'https://api.openai.com/v1', 'AI Provider Endpoint Base URL'),
  ('ai_api_key', '', 'AI Provider API Key'),
  ('ai_model', 'gpt-4o-mini', 'AI Vision Model ID')
ON CONFLICT (key) DO NOTHING;
