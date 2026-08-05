-- Migration 097: finance & daily summary analytics (append-only).

CREATE TABLE analytics.analytics_finance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    transaction int NOT NULL DEFAULT 0,
    refund int NOT NULL DEFAULT 0,
    failed_payment int NOT NULL DEFAULT 0,
    average_transaction numeric(12,2) NOT NULL DEFAULT 0,
    arpu numeric(12,2) NOT NULL DEFAULT 0,
    ltv numeric(12,2) NOT NULL DEFAULT 0,
    mrr numeric(12,2) NOT NULL DEFAULT 0,
    arr numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_finance_date ON analytics.analytics_finance(date);
-- Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_daily_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    new_user int NOT NULL DEFAULT 0,
    active_user int NOT NULL DEFAULT 0,
    new_student int NOT NULL DEFAULT 0,
    new_teacher int NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    question_answered int NOT NULL DEFAULT 0,
    material_view int NOT NULL DEFAULT 0,
    membership_purchase int NOT NULL DEFAULT 0,
    income numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_daily_summary_date ON analytics.analytics_daily_summary(date);
-- Append-only, tanpa updated_at.
