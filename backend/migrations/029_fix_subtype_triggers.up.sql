-- Migration 029: Drop invalid updated_at triggers on subtype tables
DROP TRIGGER IF EXISTS trg_content_questions_updated_at ON content_questions;
DROP TRIGGER IF EXISTS trg_content_materials_updated_at ON content_materials;
DROP TRIGGER IF EXISTS trg_content_exams_updated_at ON content_exams;
