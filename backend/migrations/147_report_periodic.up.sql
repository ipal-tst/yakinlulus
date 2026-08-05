-- Migration 147: period-based aggregate reports (finance, academic, operational).

CREATE TABLE report.report_finance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    refund numeric(12,2) NOT NULL DEFAULT 0,
    membership numeric(12,2) NOT NULL DEFAULT 0,
    invoice numeric(12,2) NOT NULL DEFAULT 0,
    transaction int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_finance_period ON report.report_finance(period);

CREATE TABLE report.report_academic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    student int NOT NULL DEFAULT 0,
    teacher int NOT NULL DEFAULT 0,
    school int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    completion numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_academic_period ON report.report_academic(period);

CREATE TABLE report.report_operational (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(10) NOT NULL,
    login int NOT NULL DEFAULT 0,
    active_user int NOT NULL DEFAULT 0,
    error int NOT NULL DEFAULT 0,
    api_request int NOT NULL DEFAULT 0,
    storage bigint NOT NULL DEFAULT 0,
    cpu numeric(5,2),
    memory numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);
CREATE INDEX idx_report_operational_period ON report.report_operational(period);
