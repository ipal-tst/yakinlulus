-- Migration 136 down: parsing review, validation rule & result.

DROP TABLE IF EXISTS ocr.validation_result;
DROP TABLE IF EXISTS ocr.import_validation_rule;
DROP TABLE IF EXISTS ocr.parsing_review;