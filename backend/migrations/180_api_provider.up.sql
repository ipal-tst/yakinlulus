-- Migration 180: api provider, credential & endpoint (integration core).

CREATE TABLE integration.api_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code varchar(60) NOT NULL,
    provider_name varchar(200) NOT NULL,
    category varchar(30) NOT NULL DEFAULT 'OTHER' CHECK (category IN ('PAYMENT','EMAIL','SMS','WHATSAPP','PUSH','AI','OCR','STORAGE','CDN','AUTH','VIDEO','ANALYTICS','SEARCH','OTHER')),
    vendor varchar(200),
    base_url varchar(500),
    documentation_url varchar(500),
    version varchar(60),
    environment varchar(20) NOT NULL DEFAULT 'SANDBOX' CHECK (environment IN ('SANDBOX','PRODUCTION')),
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE')),
    supports_webhook boolean NOT NULL DEFAULT false,
    supports_retry boolean NOT NULL DEFAULT true,
    supports_batch boolean NOT NULL DEFAULT false,
    supports_async boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_code)
);
CREATE INDEX idx_api_provider_category ON integration.api_provider(category);
CREATE TRIGGER trg_api_provider_updated BEFORE UPDATE ON integration.api_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.api_credential (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    credential_name varchar(120) NOT NULL,
    api_key varchar(500),
    api_secret varchar(500),
    client_id varchar(255),
    client_secret varchar(500),
    access_token text,
    refresh_token text,
    jwt_secret varchar(500),
    certificate text,
    private_key text,
    public_key text,
    expires_at timestamptz,
    is_encrypted boolean NOT NULL DEFAULT true,
    rotation_date timestamptz,
    last_used_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','EXPIRED','REVOKED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_credential_provider ON integration.api_credential(provider_id);
CREATE TRIGGER trg_api_credential_updated BEFORE UPDATE ON integration.api_credential
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.api_endpoint (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    service_name varchar(200),
    endpoint_name varchar(200) NOT NULL,
    base_url varchar(500),
    path varchar(500),
    http_method varchar(10) NOT NULL DEFAULT 'GET' CHECK (http_method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')),
    timeout_seconds int NOT NULL DEFAULT 30,
    content_type varchar(60) NOT NULL DEFAULT 'application/json',
    authentication_type varchar(20) NOT NULL DEFAULT 'API_KEY' CHECK (authentication_type IN ('NONE','API_KEY','JWT','BASIC','BEARER','OAUTH2')),
    rate_limit int,
    retry_enabled boolean NOT NULL DEFAULT true,
    retry_policy jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_endpoint_provider ON integration.api_endpoint(provider_id);
CREATE TRIGGER trg_api_endpoint_updated BEFORE UPDATE ON integration.api_endpoint
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();