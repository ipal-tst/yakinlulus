-- Migration 168: payment gateway, invoice, tax & membership configuration.

CREATE TABLE config.payment_gateway (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(20) NOT NULL CHECK (provider IN ('MIDTRANS','XENDIT','STRIPE')),
    enabled boolean NOT NULL DEFAULT true,
    server_key varchar(255),
    client_key varchar(255),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_payment_gateway_updated BEFORE UPDATE ON config.payment_gateway
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.invoice_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix varchar(20) NOT NULL DEFAULT 'INV',
    starting_number bigint NOT NULL DEFAULT 1,
    due_day int NOT NULL DEFAULT 1,
    allow_partial boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_invoice_configuration_updated BEFORE UPDATE ON config.invoice_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.tax_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name varchar(120) NOT NULL DEFAULT 'PPN',
    tax_rate numeric(6,2) NOT NULL DEFAULT 11,
    included_price boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_tax_configuration_updated BEFORE UPDATE ON config.tax_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.membership_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_day int NOT NULL DEFAULT 7,
    renewal_day int NOT NULL DEFAULT 3,
    grace_period int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_membership_configuration_updated BEFORE UPDATE ON config.membership_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();