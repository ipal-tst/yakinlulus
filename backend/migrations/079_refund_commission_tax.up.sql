-- Migration 079: refund, commission, tax.

CREATE TABLE finance.refund (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES finance.payment(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    reason varchar(255),
    status varchar(30) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REJECTED','PROCESSED','COMPLETED')),
    requested_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    approved_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refund_payment ON finance.refund(payment_id);
CREATE INDEX idx_refund_invoice ON finance.refund(invoice_id);
CREATE INDEX idx_refund_status ON finance.refund(status);
CREATE TRIGGER trg_refund_updated BEFORE UPDATE ON finance.refund
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.commission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type varchar(40),
    reference_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    school_id uuid,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    percentage numeric(5,2),
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','CANCELLED')),
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_commission_user ON finance.commission(user_id);
CREATE INDEX idx_commission_status ON finance.commission(status);
CREATE TRIGGER trg_commission_updated BEFORE UPDATE ON finance.commission
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.tax (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country varchar(80) NOT NULL,
    province varchar(80),
    tax_name varchar(120) NOT NULL,
    tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
    effective_from timestamptz NOT NULL,
    effective_until timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tax_country ON finance.tax(country);
