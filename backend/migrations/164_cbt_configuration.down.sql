-- Migration 164 down: cbt, grading & timer configuration.

DROP TABLE IF EXISTS config.timer_configuration;
DROP TABLE IF EXISTS config.grading_configuration;
DROP TABLE IF EXISTS config.cbt_configuration;