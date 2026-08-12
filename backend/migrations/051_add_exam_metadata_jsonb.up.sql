-- Migration: add exam metadata jsonb column

ALTER TABLE cbt.exam ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb NOT NULL;

CREATE INDEX idx_exam_metadata ON cbt.exam USING GIN (metadata);
