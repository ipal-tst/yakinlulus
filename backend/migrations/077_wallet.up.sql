-- Migration 077: wallet & wallet transactions.

CREATE TABLE finance.wallet (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    balance numeric(12,2) NOT NULL DEFAULT 0,
    locked_balance numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_wallet_updated BEFORE UPDATE ON finance.wallet
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.wallet_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid NOT NULL REFERENCES finance.wallet(id) ON DELETE CASCADE,
    reference_type varchar(40),
    reference_id uuid,
    transaction_type varchar(20) NOT NULL CHECK (transaction_type IN ('TOPUP','PAYMENT','REFUND','BONUS','CASHBACK','WITHDRAW')),
    amount numeric(12,2) NOT NULL DEFAULT 0,
    balance_before numeric(12,2) NOT NULL DEFAULT 0,
    balance_after numeric(12,2) NOT NULL DEFAULT 0,
    description varchar(255),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_transaction_wallet ON finance.wallet_transaction(wallet_id);
CREATE INDEX idx_wallet_transaction_time ON finance.wallet_transaction(created_at);
