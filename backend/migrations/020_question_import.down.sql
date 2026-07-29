-- Down: migration 020
DROP TABLE IF EXISTS question_import_rows;
DROP TABLE IF EXISTS question_import_jobs;

ALTER TABLE questions
    DROP COLUMN IF EXISTS topic,
    DROP COLUMN IF EXISTS bloom_level,
    DROP COLUMN IF EXISTS language,
    DROP COLUMN IF EXISTS source;
