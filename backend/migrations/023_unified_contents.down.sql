-- Migration 023: Rollback unified contents

-- Drop triggers
DROP TRIGGER IF EXISTS trg_content_exams_updated_at ON content_exams;
DROP TRIGGER IF EXISTS trg_content_materials_updated_at ON content_materials;
DROP TRIGGER IF EXISTS trg_content_questions_updated_at ON content_questions;
DROP TRIGGER IF EXISTS trg_contents_updated_at ON contents;

-- Drop tables (subtypes first, then base)
DROP TABLE IF EXISTS content_exam_session_questions;
DROP TABLE IF EXISTS content_question_pools;
DROP TABLE IF EXISTS content_exam_answers;
DROP TABLE IF EXISTS content_exam_attempts;
DROP TABLE IF EXISTS content_exam_participants;
DROP TABLE IF EXISTS content_exam_blueprints;
DROP TABLE IF EXISTS content_exam_questions;
DROP TABLE IF EXISTS content_exams;
DROP TABLE IF EXISTS content_learning_progress;
DROP TABLE IF EXISTS content_materials;
DROP TABLE IF EXISTS content_question_options;
DROP TABLE IF EXISTS content_questions;
DROP TABLE IF EXISTS contents;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();