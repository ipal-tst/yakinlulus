-- Migration 081: promotion, recurring billing, finance notification, setting.

CREATE TABLE finance.promotion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(200) NOT NULL,
    description text,
    start_date timestamptz,
    end_date timestamptz,
    discount_type varchar(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value numeric(12,2) NOT NULL DEFAULT 0,
    maximum_discount numeric(12,2),
    minimum_purchase numeric(12,2) NOT NULL DEFAULT 0,
    quota int,
    remaining_quota int,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_promotion_active ON finance.promotion(active);
CREATE TRIGGER trg_promotion_updated BEFORE UPDATE ON finance.promotion
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.recurring_billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES finance.subscription(id) ON DELETE CASCADE,
    scheduled_date timestamptz NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    retry int NOT NULL DEFAULT 0,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recurring_billing_subscription ON finance.recurring_billing(subscription_id);
CREATE INDEX idx_recurring_billing_status ON finance.recurring_billing(status);
CREATE TRIGGER trg_recurring_billing_updated BEFORE UPDATE ON finance.recurring_billing
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.finance_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES finance.invoice(id) ON DELETE SET NULL,
    payment_id uuid REFERENCES finance.payment(id) ON DELETE SET NULL,
    notification_type varchar(40) NOT NULL,
    channel varchar(20),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_finance_notification_user ON finance.finance_notification(user_id);
CREATE INDEX idx_finance_notification_type ON finance.finance_notification(notification_type);
CREATE INDEX idx_finance_notification_status ON finance.finance_notification(status);

CREATE TABLE finance.finance_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key varchar(80) NOT NULL,
    setting_value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_finance_setting_key ON finance.finance_setting(setting_key);
CREATE TRIGGER trg_finance_setting_updated BEFORE UPDATE ON finance.finance_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
