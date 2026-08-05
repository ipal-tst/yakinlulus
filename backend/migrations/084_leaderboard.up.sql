-- Migration 084: leaderboard & leaderboard entries.

CREATE TABLE ranking.leaderboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_code varchar(50) NOT NULL,
    leaderboard_name varchar(200) NOT NULL,
    category_id uuid NOT NULL REFERENCES ranking.ranking_category(id) ON DELETE CASCADE,
    period_id uuid REFERENCES ranking.ranking_period(id) ON DELETE SET NULL,
    scope varchar(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','PROVINCE','CITY','SCHOOL','CLASS','GROUP')),
    province_id uuid,
    city_id uuid,
    school_id uuid,
    class_id uuid,
    subject_id uuid,
    exam_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_leaderboard_code ON ranking.leaderboard(leaderboard_code);
CREATE INDEX idx_leaderboard_category ON ranking.leaderboard(category_id);
CREATE INDEX idx_leaderboard_period ON ranking.leaderboard(period_id);
CREATE INDEX idx_leaderboard_active ON ranking.leaderboard(is_active);
CREATE TRIGGER trg_leaderboard_updated BEFORE UPDATE ON ranking.leaderboard
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- Kolom province_id/city_id/school_id/class_id/subject_id/exam_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE ranking.leaderboard_entry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    score numeric(12,2) NOT NULL DEFAULT 0,
    weighted_score numeric(12,2) NOT NULL DEFAULT 0,
    correct_answer int NOT NULL DEFAULT 0,
    wrong_answer int NOT NULL DEFAULT 0,
    unanswered int NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    average_duration int,
    total_exam int NOT NULL DEFAULT 0,
    total_practice int NOT NULL DEFAULT 0,
    total_study_minutes int NOT NULL DEFAULT 0,
    consistency_score numeric(5,2) NOT NULL DEFAULT 0,
    speed_score numeric(5,2) NOT NULL DEFAULT 0,
    achievement_score numeric(5,2) NOT NULL DEFAULT 0,
    streak_score numeric(5,2) NOT NULL DEFAULT 0,
    bonus_score numeric(5,2) NOT NULL DEFAULT 0,
    penalty_score numeric(5,2) NOT NULL DEFAULT 0,
    percentile numeric(5,2),
    previous_rank int,
    rank_change int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (leaderboard_id, user_id)
);
CREATE INDEX idx_leaderboard_entry_rank ON ranking.leaderboard_entry(leaderboard_id, rank_position);
CREATE INDEX idx_leaderboard_entry_user ON ranking.leaderboard_entry(user_id);
CREATE TRIGGER trg_leaderboard_entry_updated BEFORE UPDATE ON ranking.leaderboard_entry
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
