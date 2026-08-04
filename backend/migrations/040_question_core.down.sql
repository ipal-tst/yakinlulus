ALTER TABLE question.question DROP CONSTRAINT IF EXISTS fk_question_current_version;
DROP TABLE IF EXISTS question.question_version;
DROP TABLE IF EXISTS question.question;
DROP TABLE IF EXISTS question.question_status;
