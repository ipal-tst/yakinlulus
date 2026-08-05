-- Migration 162: password policy, ip whitelist/blacklist, security header, auth provider & oauth.

CREATE TABLE config.password_policy (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uppercase_required boolean NOT NULL DEFAULT true,
    lowercase_required boolean NOT NULL DEFAULT true,
    number_required boolean NOT NULL DEFAULT true,
    symbol_required boolean NOT NULL DEFAULT false,
    minimum_length int NOT NULL DEFAULT 8,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_password_policy_updated BEFORE UPDATE ON config.password_policy
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.ip_whitelist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address varchar(45) NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (ip_address)
);

CREATE TABLE config.ip_blacklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address varchar(45) NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (ip_address)
);

CREATE TABLE config.security_header (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    header_name varchar(120) NOT NULL,
    header_value varchar(500),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_security_header_name ON config.security_header(header_name);

CREATE TABLE config.authentication_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(20) NOT NULL CHECK (provider IN ('LOCAL','GOOGLE','MICROSOFT','APPLE')),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);

CREATE TABLE config.oauth_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(20) NOT NULL CHECK (provider IN ('LOCAL','GOOGLE','MICROSOFT','APPLE')),
    client_id varchar(255),
    client_secret varchar(255),
    redirect_uri varchar(500),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_oauth_configuration_updated BEFORE UPDATE ON config.oauth_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();