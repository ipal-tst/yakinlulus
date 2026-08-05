-- Migration 090: achievement, streak, notification, statistic.

CREATE TABLE ranking.ranking_achievement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_code varchar(50) NOT NULL,
    achievement_name varchar(120) NOT NULL,
    score_bonus numeric(12,2) NOT NULL DEFAULT 0,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_achievement_code ON ranking.ranking_achievement(achievement_code);

CREATE TABLE ranking.user_ranking_achievement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES ranking.ranking_achievement(id) ON DELETE CASCADE,
    earned_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);
CREATE INDEX idx_user_ranking_achievement_ach ON ranking.user_ranking_achievement(achievement_id);

CREATE TABLE ranking.ranking_streak (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    current_streak int NOT NULL DEFAULT 0,
    longest_streak int NOT NULL DEFAULT 0,
    total_day int NOT NULL DEFAULT 0,
    last_activity date,
    streak_score numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_ranking_streak_updated BEFORE UPDATE ON ranking.ranking_streak
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    notification_type varchar(20) NOT NULL CHECK (notification_type IN ('RANK_UP','RANK_DOWN','NEW_BADGE','NEW_REWARD')),
    title varchar(200),
    message text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_notification_user ON ranking.ranking_notification(user_id);
CREATE INDEX idx_ranking_notification_read ON ranking.ranking_notification(is_read);

CREATE TABLE ranking.ranking_statistic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    participant_count int NOT NULL DEFAULT 0,
    average_score numeric(12,2) NOT NULL DEFAULT 0,
    median_score numeric(12,2) NOT NULL DEFAULT 0,
    highest_score numeric(12,2) NOT NULL DEFAULT 0,
    lowest_score numeric(12,2) NOT NULL DEFAULT 0,
    standard_deviation numeric(12,2) NOT NULL DEFAULT 0,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_statistic_leaderboard ON ranking.ranking_statistic(leaderboard_id);
