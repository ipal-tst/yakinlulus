-- Migration 165 down: ai provider, model & parameter configuration.

DROP TABLE IF EXISTS config.ai_parameter;
DROP TABLE IF EXISTS config.ai_model;
DROP TABLE IF EXISTS config.ai_provider;