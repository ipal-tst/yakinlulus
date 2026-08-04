-- Migration 076: payment, payment transaction, gateway log.

CREATE TABLE finance.payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    payment_method varchar(40),
    payment_channel varchar(40),
    gateway varchar(40),
    amount numeric(12,2) NOT NULL DEFAULT 0,
    fee numeric(12,2) NOT NULL DEFAULT 0,
    net_amount numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED')),
    payment_time timestamptz,
    gateway_reference varchar(120),
    gateway_transaction_id varchar(120),
    approval_code varchar(80),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_payment_gateway_tx ON finance.payment(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_payment_invoice ON finance.payment(invoice_id);
CREATE INDEX idx_payment_user ON finance.payment(user_id);
CREATE INDEX idx_payment_status ON finance.payment(status);
CREATE TRIGGER trg_payment_updated BEFORE UPDATE ON finance.payment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.payment_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES finance.payment(id) ON DELETE CASCADE,
    event_type varchar(40),
    gateway_status varchar(40),
    request_payload jsonb,
    response_payload jsonb,
    signature text,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_transaction_payment ON finance.payment_transaction(payment_id);

CREATE TABLE finance.payment_gateway_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway varchar(40),
    endpoint varchar(200),
    request jsonb,
    response jsonb,
    http_status int,
    latency int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_gateway_log_gateway ON finance.payment_gateway_log(gateway);
CREATE INDEX idx_payment_gateway_log_time ON finance.payment_gateway_log(created_at);
