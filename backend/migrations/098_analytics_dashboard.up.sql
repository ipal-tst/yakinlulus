-- Migration 098: dashboard cache, kpi, report, leaderboard.

CREATE TABLE analytics.analytics_dashboard_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_type varchar(30) NOT NULL,
    owner_type varchar(30),
    owner_id uuid,
    cache_key varchar(120) NOT NULL,
    cache_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (dashboard_type, owner_type, owner_id, cache_key)
);
CREATE INDEX idx_analytics_dashboard_cache_key ON analytics.analytics_dashboard_cache(cache_key);
CREATE INDEX idx_analytics_dashboard_cache_owner ON analytics.analytics_dashboard_cache(owner_type, owner_id);
CREATE TRIGGER trg_analytics_dashboard_cache_updated BEFORE UPDATE ON analytics.analytics_dashboard_cache
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_kpi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name varchar(120) NOT NULL,
    period varchar(30) NOT NULL,
    value numeric(12,2) NOT NULL DEFAULT 0,
    target numeric(12,2) NOT NULL DEFAULT 0,
    achievement numeric(5,2) NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ON_TRACK','BEHIND','ACHIEVED','MISSED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_kpi_name ON analytics.analytics_kpi(kpi_name);
CREATE INDEX idx_analytics_kpi_period ON analytics.analytics_kpi(period);
CREATE INDEX idx_analytics_kpi_status ON analytics.analytics_kpi(status);
CREATE TRIGGER trg_analytics_kpi_updated BEFORE UPDATE ON analytics.analytics_kpi
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name varchar(200) NOT NULL,
    report_type varchar(30) NOT NULL,
    period_start date,
    period_end date,
    generated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    file_url text,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','GENERATING','READY','FAILED','ARCHIVED')),
    generated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_report_type ON analytics.analytics_report(report_type);
CREATE INDEX idx_analytics_report_status ON analytics.analytics_report(status);
CREATE INDEX idx_analytics_report_generated ON analytics.analytics_report(generated_at);
CREATE INDEX idx_analytics_report_by ON analytics.analytics_report(generated_by);
CREATE TRIGGER trg_analytics_report_updated BEFORE UPDATE ON analytics.analytics_report
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE analytics.analytics_leaderboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period varchar(30) NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid,
    class_id uuid,
    subject_id uuid,
    score numeric(12,2) NOT NULL DEFAULT 0,
    xp int NOT NULL DEFAULT 0,
    ranking int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (period, student_id, subject_id)
);
CREATE INDEX idx_analytics_leaderboard_period ON analytics.analytics_leaderboard(period, ranking);
CREATE INDEX idx_analytics_leaderboard_student ON analytics.analytics_leaderboard(student_id);
CREATE INDEX idx_analytics_leaderboard_subject ON analytics.analytics_leaderboard(subject_id);
CREATE TRIGGER trg_analytics_leaderboard_updated BEFORE UPDATE ON analytics.analytics_leaderboard
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id/school_id/class_id/subject_id: uuid TANPA FK (event-driven, per 5).
