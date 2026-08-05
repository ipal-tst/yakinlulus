-- Migration 156 down: search collection, collection document & setting.

DROP TABLE IF EXISTS search.search_setting;
DROP TABLE IF EXISTS search.search_collection_document;
DROP TABLE IF EXISTS search.search_collection;