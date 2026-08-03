-- Migration 041: Remove gamification (XP/level/streak/badges) feature tables
DROP TABLE IF EXISTS xp_transactions;
DROP TABLE IF EXISTS user_levels;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS user_streaks;
