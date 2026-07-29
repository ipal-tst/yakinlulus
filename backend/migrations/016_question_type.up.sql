-- Add question_type to questions table
ALTER TABLE questions
ADD COLUMN question_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE_CHOICE' CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE'));

COMMENT ON COLUMN questions.question_type IS 'SINGLE_CHOICE=Pilihan Ganda Biasa, MULTIPLE_CHOICE=Pilihan Ganda Kompleks (MCMA), TRUE_FALSE=Benar/Salah atau Sesuai/Tidak';