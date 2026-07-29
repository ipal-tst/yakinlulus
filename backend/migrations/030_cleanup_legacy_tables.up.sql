-- Migration 030: Cleanup Legacy Exams Tables for Unified Content Schema

DROP TABLE IF EXISTS exam_answers CASCADE;
DROP TABLE IF EXISTS exam_sessions CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
