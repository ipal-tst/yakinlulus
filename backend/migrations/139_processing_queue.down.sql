-- Migration 139 down: processing queue & worker, import statistics & configuration.

DROP TABLE IF EXISTS ocr.import_configuration;
DROP TABLE IF EXISTS ocr.import_statistics;
DROP TABLE IF EXISTS ocr.processing_worker;
DROP TABLE IF EXISTS ocr.processing_queue;