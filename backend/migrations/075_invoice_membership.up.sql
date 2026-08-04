-- Migration 075: invoice & user membership; circular FK resolved via ALTER.

CREATE TABLE finance.invoice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number varchar(50) NOT NULL,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_id uuid,
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    discount numeric(12,2) NOT NULL DEFAULT 0,
    voucher_discount numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    service_fee numeric(12,2) NOT NULL DEFAULT 0,
    total numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','UNPAID','PENDING','PAID','FAILED','EXPIRED','VOID','REFUND')),
    issued_at timestamptz,
    expired_at timestamptz,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_invoice_number ON finance.invoice(invoice_number);
CREATE INDEX idx_invoice_user ON finance.invoice(user_id);
CREATE INDEX idx_invoice_status ON finance.invoice(status);
CREATE INDEX idx_invoice_paid ON finance.invoice(paid_at);
CREATE TRIGGER trg_invoice_updated BEFORE UPDATE ON finance.invoice
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.user_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    invoice_id uuid,
    subscription_id uuid REFERENCES finance.subscription(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','EXPIRED','CANCELLED')),
    active_from timestamptz,
    expired_at timestamptz,
    remaining_day int,
    is_trial boolean NOT NULL DEFAULT false,
    auto_renew boolean NOT NULL DEFAULT true,
    renewal_count int NOT NULL DEFAULT 0,
    cancel_reason varchar(200),
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_membership_user ON finance.user_membership(user_id);
CREATE INDEX idx_user_membership_package ON finance.user_membership(membership_package_id);
CREATE INDEX idx_user_membership_status ON finance.user_membership(status);
CREATE TRIGGER trg_user_membership_updated BEFORE UPDATE ON finance.user_membership
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- Circular FK: invoice.membership_id -> user_membership, user_membership.invoice_id -> invoice.
ALTER TABLE finance.invoice ADD CONSTRAINT fk_invoice_membership
    FOREIGN KEY (membership_id) REFERENCES finance.user_membership(id);
ALTER TABLE finance.user_membership ADD CONSTRAINT fk_user_membership_invoice
    FOREIGN KEY (invoice_id) REFERENCES finance.invoice(id);
