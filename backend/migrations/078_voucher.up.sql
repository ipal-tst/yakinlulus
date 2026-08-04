-- Migration 078: voucher, user voucher, coupon usage.

CREATE TABLE finance.voucher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    title varchar(200),
    description text,
    discount_type varchar(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value numeric(12,2) NOT NULL DEFAULT 0,
    maximum_discount numeric(12,2),
    minimum_purchase numeric(12,2) NOT NULL DEFAULT 0,
    usage_limit int,
    usage_per_user int,
    valid_from timestamptz,
    valid_until timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_voucher_code ON finance.voucher(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_voucher_active ON finance.voucher(is_active);
CREATE TRIGGER trg_voucher_updated BEFORE UPDATE ON finance.voucher
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.user_voucher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id uuid NOT NULL REFERENCES finance.voucher(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    claimed_at timestamptz NOT NULL DEFAULT NOW(),
    expired_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','USED','EXPIRED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (voucher_id, user_id)
);
CREATE INDEX idx_user_voucher_user ON finance.user_voucher(user_id);
CREATE INDEX idx_user_voucher_status ON finance.user_voucher(status);

CREATE TABLE finance.coupon_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id uuid NOT NULL REFERENCES finance.voucher(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    discount_amount numeric(12,2) NOT NULL DEFAULT 0,
    used_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (voucher_id, invoice_id)
);
CREATE INDEX idx_coupon_usage_invoice ON finance.coupon_usage(invoice_id);
CREATE INDEX idx_coupon_usage_user ON finance.coupon_usage(user_id);
