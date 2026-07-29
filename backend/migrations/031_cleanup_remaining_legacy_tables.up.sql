-- Migration 031: Cleanup 12 remaining legacy tables replaced by Unified Content Architecture

DROP TABLE IF EXISTS practice_answers CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS exam_custom_configs CASCADE;
DROP TABLE IF EXISTS exam_blueprints CASCADE;
DROP TABLE IF EXISTS exam_session_questions CASCADE;
DROP TABLE IF EXISTS exam_question_pools CASCADE;
DROP TABLE IF EXISTS exam_participants CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
