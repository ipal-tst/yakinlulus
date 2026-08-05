-- Migration 089: ranking reward & badge.

CREATE TABLE ranking.ranking_reward (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    minimum_rank int,
    maximum_rank int,
    reward_type varchar(20) NOT NULL CHECK (reward_type IN ('BADGE','POINT','COIN','CERTIFICATE','MEMBERSHIP','TROPHY')),
    reward_value varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_reward_leaderboard ON ranking.ranking_reward(leaderboard_id);

CREATE TABLE ranking.user_ranking_reward (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    reward_id uuid NOT NULL REFERENCES ranking.ranking_reward(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    received_at timestamptz NOT NULL DEFAULT NOW(),
    claimed_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','EXPIRED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, reward_id)
);
CREATE INDEX idx_user_ranking_reward_reward ON ranking.user_ranking_reward(reward_id);
CREATE INDEX idx_user_ranking_reward_status ON ranking.user_ranking_reward(status);

CREATE TABLE ranking.ranking_badge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_code varchar(50) NOT NULL,
    badge_name varchar(120) NOT NULL,
    icon varchar(120),
    color varchar(30),
    description text,
    level varchar(20) NOT NULL DEFAULT 'BRONZE' CHECK (level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_badge_code ON ranking.ranking_badge(badge_code);

CREATE TABLE ranking.user_ranking_badge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES ranking.ranking_badge(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    earned_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);
CREATE INDEX idx_user_ranking_badge_badge ON ranking.user_ranking_badge(badge_id);
