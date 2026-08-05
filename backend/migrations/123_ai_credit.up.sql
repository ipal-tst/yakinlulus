-- Migration 123: ai credit, credit package, credit package item.

CREATE TABLE ai.ai_credit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    balance numeric(18,6) NOT NULL DEFAULT 0,
    currency char(3) NOT NULL DEFAULT 'IDR',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_ai_credit_updated BEFORE UPDATE ON ai.ai_credit
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_credit_package (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    credit_amount numeric(18,6) NOT NULL,
    price numeric(18,6) NOT NULL,
    currency char(3) NOT NULL DEFAULT 'IDR',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);
CREATE INDEX idx_ai_credit_package_active ON ai.ai_credit_package(is_active);
CREATE TRIGGER trg_ai_credit_package_updated BEFORE UPDATE ON ai.ai_credit_package
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_credit_package_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES ai.ai_credit_package(id) ON DELETE CASCADE,
    item_type varchar(20) NOT NULL CHECK (item_type IN ('CREDIT','TOKEN','MESSAGE')),
    quantity numeric(18,6) NOT NULL DEFAULT 0,
    unit varchar(20) DEFAULT 'token'
);
CREATE INDEX idx_ai_credit_package_item_pkg ON ai.ai_credit_package_item(package_id);