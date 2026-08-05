-- Migration 185: oauth client & token.

CREATE TABLE integration.oauth_client (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(20) NOT NULL DEFAULT 'GOOGLE' CHECK (provider IN ('GOOGLE','MICROSOFT','APPLE','FACEBOOK')),
    client_id varchar(255),
    client_secret varchar(500),
    redirect_uri varchar(500),
    scope varchar(500),
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','REVOKED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_oauth_client_updated BEFORE UPDATE ON integration.oauth_client
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE integration.oauth_token (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    provider varchar(20) NOT NULL DEFAULT 'GOOGLE' CHECK (provider IN ('GOOGLE','MICROSOFT','APPLE','FACEBOOK')),
    access_token text,
    refresh_token text,
    expires_at timestamptz,
    scope varchar(500),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_oauth_token_user ON integration.oauth_token(user_id);
CREATE TRIGGER trg_oauth_token_updated BEFORE UPDATE ON integration.oauth_token
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();