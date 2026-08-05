-- Migration 135 down: parsed option, explanation, metadata.

DROP TABLE IF EXISTS ocr.parsed_metadata;
DROP TABLE IF EXISTS ocr.parsed_explanation;
DROP TABLE IF EXISTS ocr.parsed_option;
