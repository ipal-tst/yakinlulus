-- Migration 134 down: ai_parsing_job & parsed_question.

DROP TABLE IF EXISTS ocr.parsed_question;
DROP TABLE IF EXISTS ocr.ai_parsing_job;
