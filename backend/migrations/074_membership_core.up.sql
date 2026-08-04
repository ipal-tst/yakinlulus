-- Migration 074: membership core - package, feature, subscription, payment method.

CREATE TABLE finance.membership_package (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    slug varchar(200) NOT NULL,
    package_type varchar(20) NOT NULL DEFAULT 'monthly' CHECK (package_type IN ('trial','monthly','quarterly','semester','yearly','lifetime')),
    level varchar(20) NOT NULL DEFAULT 'basic' CHECK (level IN ('basic','premium','pro','enterprise')),
    duration_day int,
    price numeric(12,2) NOT NULL DEFAULT 0,
    discount_price numeric(12,2),
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    max_device int NOT NULL DEFAULT 1,
    max_login int NOT NULL DEFAULT 1,
    max_student int NOT NULL DEFAULT 1,
    max_teacher int NOT NULL DEFAULT 1,
    is_trial boolean NOT NULL DEFAULT false,
    trial_day int,
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    sort_order int NOT NULL DEFAULT 0,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_membership_package_code ON finance.membership_package(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_membership_package_slug ON finance.membership_package(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_membership_package_type ON finance.membership_package(package_type);
CREATE INDEX idx_membership_package_active ON finance.membership_package(is_active);
CREATE TRIGGER trg_membership_package_updated BEFORE UPDATE ON finance.membership_package
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.package_feature (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    feature_code varchar(50) NOT NULL,
    feature_name varchar(120) NOT NULL,
    feature_value varchar(120),
    is_unlimited boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (membership_package_id, feature_code)
);
CREATE INDEX idx_package_feature_package ON finance.package_feature(membership_package_id);

CREATE TABLE finance.subscription (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    billing_cycle varchar(20),
    next_billing_date timestamptz,
    last_billing_date timestamptz,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','CANCELLED','EXPIRED','FAILED')),
    payment_method varchar(40),
    gateway varchar(40),
    retry_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscription_user ON finance.subscription(user_id);
CREATE INDEX idx_subscription_package ON finance.subscription(membership_package_id);
CREATE INDEX idx_subscription_status ON finance.subscription(status);
CREATE TRIGGER trg_subscription_updated BEFORE UPDATE ON finance.subscription
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.payment_method (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(120) NOT NULL,
    category varchar(40),
    gateway varchar(40),
    is_active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_payment_method_code ON finance.payment_method(code);
