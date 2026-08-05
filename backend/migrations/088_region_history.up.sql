-- Migration 088: province/city ranking & ranking history.

CREATE TABLE ranking.province_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_province_ranking_region ON ranking.province_ranking(region_id);
CREATE INDEX idx_province_ranking_leaderboard ON ranking.province_ranking(leaderboard_id);

CREATE TABLE ranking.city_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_city_ranking_region ON ranking.city_ranking(region_id);
CREATE INDEX idx_city_ranking_leaderboard ON ranking.city_ranking(leaderboard_id);

CREATE TABLE ranking.ranking_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    old_rank int,
    new_rank int,
    rank_difference int,
    old_score numeric(12,2),
    new_score numeric(12,2),
    changed_reason varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_history_user ON ranking.ranking_history(user_id);
CREATE INDEX idx_ranking_history_leaderboard ON ranking.ranking_history(leaderboard_id);
CREATE INDEX idx_ranking_history_time ON ranking.ranking_history(created_at);
