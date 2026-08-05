-- Migration 138 down: import template & document version.

DROP TABLE IF EXISTS ocr.document_version;
DROP TABLE IF EXISTS ocr.import_template;