-- Migration: rollback add exam metadata jsonb column

DROP INDEX IF EXISTS idx_exam_metadata;

ALTER TABLE cbt.exam DROP COLUMN metadata;
