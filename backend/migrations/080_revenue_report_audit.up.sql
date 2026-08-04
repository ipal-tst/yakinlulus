-- Migration 080: revenue summary, financial report, financial audit log.

CREATE TABLE finance.revenue_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    refund numeric(12,2) NOT NULL DEFAULT 0,
    transaction_count int NOT NULL DEFAULT 0,
    new_subscription int NOT NULL DEFAULT 0,
    renewal int NOT NULL DEFAULT 0,
    cancel int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);

CREATE TABLE finance.financial_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name varchar(200) NOT NULL,
    period_start timestamptz,
    period_end timestamptz,
    report_type varchar(40),
    generated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    file_url text,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_report_type ON finance.financial_report(report_type);

CREATE TABLE finance.financial_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    actor_role varchar(40),
    action varchar(60) NOT NULL,
    table_name varchar(80) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address varchar(45),
    device varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_audit_actor ON finance.financial_audit_log(actor_id);
CREATE INDEX idx_financial_audit_table ON finance.financial_audit_log(table_name);
CREATE INDEX idx_financial_audit_time ON finance.financial_audit_log(created_at);
