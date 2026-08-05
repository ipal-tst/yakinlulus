-- Migration 155 down: search trending, cache & index log.

DROP TABLE IF EXISTS search.search_index_log;
DROP TABLE IF EXISTS search.search_cache;
DROP TABLE IF EXISTS search.search_trending;