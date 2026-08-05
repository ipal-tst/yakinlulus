-- Migration 085: ranking formula & calculation job.

CREATE TABLE ranking.ranking_formula (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_name varchar(120) NOT NULL,
    category_id uuid REFERENCES ranking.ranking_category(id) ON DELETE SET NULL,
    description text,
    accuracy_weight numeric(5,2) NOT NULL DEFAULT 0,
    speed_weight numeric(5,2) NOT NULL DEFAULT 0,
    difficulty_weight numeric(5,2) NOT NULL DEFAULT 0,
    consistency_weight numeric(5,2) NOT NULL DEFAULT 0,
    streak_weight numeric(5,2) NOT NULL DEFAULT 0,
    achievement_weight numeric(5,2) NOT NULL DEFAULT 0,
    bonus_weight numeric(5,2) NOT NULL DEFAULT 0,
    penalty_weight numeric(5,2) NOT NULL DEFAULT 0,
    formula_expression text,
    version int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_formula_category ON ranking.ranking_formula(category_id);
CREATE INDEX idx_ranking_formula_active ON ranking.ranking_formula(is_active);
CREATE TRIGGER trg_ranking_formula_updated BEFORE UPDATE ON ranking.ranking_formula
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_calculation_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(200) NOT NULL,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    period_id uuid REFERENCES ranking.ranking_period(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    total_user int NOT NULL DEFAULT 0,
    processed_user int NOT NULL DEFAULT 0,
    duration_ms int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_calculation_job_status ON ranking.ranking_calculation_job(status);
CREATE INDEX idx_ranking_calculation_job_leaderboard ON ranking.ranking_calculation_job(leaderboard_id);
CREATE TRIGGER trg_ranking_calculation_job_updated BEFORE UPDATE ON ranking.ranking_calculation_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
