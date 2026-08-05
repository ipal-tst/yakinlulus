-- Migration 146: dashboard & KPI snapshot. Partisi tahunan DITUNDA (plain table, UNIQUE (snapshot_date, ...) anti-duplikat).

CREATE TABLE report.report_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    dashboard_name varchar(200) NOT NULL,
    snapshot_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (snapshot_date, dashboard_name)
);
CREATE INDEX idx_report_snapshot_date ON report.report_snapshot(snapshot_date);
CREATE INDEX idx_report_snapshot_dashboard ON report.report_snapshot(dashboard_name);

CREATE TABLE report.report_kpi_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date date NOT NULL,
    kpi_name varchar(120) NOT NULL,
    kpi_value numeric(12,2),
    target numeric(12,2),
    achievement numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (snapshot_date, kpi_name)
);
CREATE INDEX idx_report_kpi_snapshot_date ON report.report_kpi_snapshot(snapshot_date);
CREATE INDEX idx_report_kpi_snapshot_name ON report.report_kpi_snapshot(kpi_name);
