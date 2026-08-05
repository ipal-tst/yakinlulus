-- Migration 150 down: search document & category.

DROP TABLE IF EXISTS search.search_category;
DROP TABLE IF EXISTS search.search_document;