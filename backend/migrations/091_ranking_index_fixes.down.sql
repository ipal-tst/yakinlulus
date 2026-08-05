-- Migration 091: index remaining ranking FKs + widen aggregate scores.

ALTER TABLE ranking.school_ranking ALTER COLUMN average_score TYPE numeric(5,2);
ALTER TABLE ranking.school_ranking ALTER COLUMN highest_score TYPE numeric(5,2);
ALTER TABLE ranking.class_ranking ALTER COLUMN average_score TYPE numeric(5,2);
ALTER TABLE ranking.class_ranking ALTER COLUMN highest_score TYPE numeric(5,2);
ALTER TABLE ranking.province_ranking ALTER COLUMN average_score TYPE numeric(5,2);
ALTER TABLE ranking.city_ranking ALTER COLUMN average_score TYPE numeric(5,2);

DROP INDEX IF EXISTS idx_ranking_notification_leaderboard;
DROP INDEX IF EXISTS idx_user_ranking_badge_leaderboard;
DROP INDEX IF EXISTS idx_user_ranking_reward_leaderboard;
DROP INDEX IF EXISTS idx_ranking_calculation_job_period;
