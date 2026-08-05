-- Migration 091: index remaining ranking FKs + widen aggregate scores.

CREATE INDEX idx_ranking_calculation_job_period ON ranking.ranking_calculation_job(period_id);
CREATE INDEX idx_user_ranking_reward_leaderboard ON ranking.user_ranking_reward(leaderboard_id);
CREATE INDEX idx_user_ranking_badge_leaderboard ON ranking.user_ranking_badge(leaderboard_id);
CREATE INDEX idx_ranking_notification_leaderboard ON ranking.ranking_notification(leaderboard_id);

ALTER TABLE ranking.school_ranking ALTER COLUMN average_score TYPE numeric(12,2);
ALTER TABLE ranking.school_ranking ALTER COLUMN highest_score TYPE numeric(12,2);
ALTER TABLE ranking.class_ranking ALTER COLUMN average_score TYPE numeric(12,2);
ALTER TABLE ranking.class_ranking ALTER COLUMN highest_score TYPE numeric(12,2);
ALTER TABLE ranking.province_ranking ALTER COLUMN average_score TYPE numeric(12,2);
ALTER TABLE ranking.city_ranking ALTER COLUMN average_score TYPE numeric(12,2);
