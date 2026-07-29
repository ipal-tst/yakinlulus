-- Migration 024: Rollback data migration (cannot fully undo, just truncate new tables)

TRUNCATE TABLE content_exam_answers CASCADE;
TRUNCATE TABLE content_exam_attempts CASCADE;
TRUNCATE TABLE content_exam_participants CASCADE;
TRUNCATE TABLE content_exam_questions CASCADE;
TRUNCATE TABLE content_exams CASCADE;
TRUNCATE TABLE content_materials CASCADE;
TRUNCATE TABLE content_question_options CASCADE;
TRUNCATE TABLE content_questions CASCADE;
TRUNCATE TABLE contents CASCADE;