-- Migration 137 down: duplicate detection, import batch, import result, import error.

DROP TABLE IF EXISTS ocr.import_error;
DROP TABLE IF EXISTS ocr.import_result;
DROP TABLE IF EXISTS ocr.import_batch;
DROP TABLE IF EXISTS ocr.duplicate_detection;