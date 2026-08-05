-- Migration 086: ranking score & user rank summary.

CREATE TABLE ranking.ranking_score (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    category_id uuid REFERENCES ranking.ranking_category(id) ON DELETE SET NULL,
    subject_id uuid,
    exam_session_id uuid,
    score_type varchar(20) NOT NULL CHECK (score_type IN ('EXAM','PRACTICE','HOMEWORK','TRYOUT','DAILY')),
    raw_score numeric(12,2) NOT NULL DEFAULT 0,
    normalized_score numeric(12,2) NOT NULL DEFAULT 0,
    weighted_score numeric(12,2) NOT NULL DEFAULT 0,
    difficulty_factor numeric(5,2) NOT NULL DEFAULT 0,
    speed_factor numeric(5,2) NOT NULL DEFAULT 0,
    accuracy_factor numeric(5,2) NOT NULL DEFAULT 0,
    bonus_factor numeric(5,2) NOT NULL DEFAULT 0,
    penalty_factor numeric(5,2) NOT NULL DEFAULT 0,
    final_score numeric(12,2) NOT NULL DEFAULT 0,
    calculated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_score_user ON ranking.ranking_score(user_id);
CREATE INDEX idx_ranking_score_category ON ranking.ranking_score(category_id);
CREATE INDEX idx_ranking_score_type ON ranking.ranking_score(score_type);
CREATE INDEX idx_ranking_score_calculated ON ranking.ranking_score(calculated_at);
-- Kolom subject_id/exam_session_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE ranking.user_rank_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    global_rank int,
    province_rank int,
    city_rank int,
    school_rank int,
    class_rank int,
    average_rank int,
    best_rank int,
    highest_score numeric(12,2) NOT NULL DEFAULT 0,
    total_leaderboard int NOT NULL DEFAULT 0,
    last_updated timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_rank_summary_updated BEFORE UPDATE ON ranking.user_rank_summary
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
