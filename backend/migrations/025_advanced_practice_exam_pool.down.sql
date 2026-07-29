-- Migration 025 Down: Rollback Advanced Practice & Exam System

-- Drop practice sessions table
DROP TABLE IF EXISTS content_practice_sessions CASCADE;

-- Drop practice sets table
DROP TABLE IF EXISTS content_practice_sets CASCADE;

-- Drop subject blueprints table
DROP TABLE IF EXISTS content_exam_subject_blueprints CASCADE;

-- Drop columns from content_exam_session_questions
ALTER TABLE content_exam_session_questions 
DROP COLUMN IF EXISTS subject_id;

-- Drop columns from content_exam_questions
ALTER TABLE content_exam_questions 
DROP COLUMN IF EXISTS subject_id;

-- Drop columns from content_question_pools
ALTER TABLE content_question_pools 
DROP COLUMN IF EXISTS grade_ids,
DROP COLUMN IF EXISTS tag_filters;

-- Drop indexes
DROP INDEX IF EXISTS idx_content_question_pools_tag_filters;
DROP INDEX IF EXISTS idx_content_exam_session_questions_subject;
DROP INDEX IF EXISTS idx_content_exam_questions_subject;
DROP INDEX IF EXISTS idx_tags_category;
DROP INDEX IF EXISTS idx_content_practice_sets_material;
DROP INDEX IF EXISTS idx_content_practice_sets_practice;
DROP INDEX IF EXISTS idx_content_practice_sessions_user;
DROP INDEX IF EXISTS idx_content_practice_sessions_subject;
DROP INDEX IF EXISTS idx_content_practice_sessions_grade;
DROP INDEX IF EXISTS idx_content_practice_sessions_status;
DROP INDEX IF EXISTS idx_content_exam_subject_blueprints_exam;