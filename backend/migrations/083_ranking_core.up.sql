-- Migration 083: ranking core - category, period, setting.

CREATE TABLE ranking.ranking_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code varchar(50) NOT NULL,
    category_name varchar(200) NOT NULL,
    description text,
    ranking_type varchar(30) NOT NULL CHECK (ranking_type IN ('OVERALL','ACADEMIC','EXAM','PRACTICE','SUBJECT','SPEED','CONSISTENCY','ACHIEVEMENT','STREAK','CUSTOM')),
    scope varchar(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','PROVINCE','CITY','SCHOOL','CLASS','GROUP')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_category_code ON ranking.ranking_category(category_code);
CREATE INDEX idx_ranking_category_type ON ranking.ranking_category(ranking_type);
CREATE TRIGGER trg_ranking_category_updated BEFORE UPDATE ON ranking.ranking_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_period (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name varchar(200) NOT NULL,
    period_type varchar(20) NOT NULL DEFAULT 'WEEKLY' CHECK (period_type IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY','SEMESTER','YEARLY','CUSTOM')),
    start_date timestamptz,
    end_date timestamptz,
    is_closed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_period_type ON ranking.ranking_period(period_type);
CREATE INDEX idx_ranking_period_closed ON ranking.ranking_period(is_closed);

CREATE TABLE ranking.ranking_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key varchar(80) NOT NULL,
    value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_setting_key ON ranking.ranking_setting(key);
CREATE TRIGGER trg_ranking_setting_updated BEFORE UPDATE ON ranking.ranking_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
