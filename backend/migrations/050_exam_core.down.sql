ALTER TABLE question.question_exam DROP CONSTRAINT IF EXISTS fk_question_exam_exam;
DROP TABLE IF EXISTS cbt.exam_metadata;
DROP TABLE IF EXISTS cbt.exam;
DROP TABLE IF EXISTS cbt.exam_status;
