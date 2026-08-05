-- Migration 153 down: search query, click log, history & saved.

DROP TABLE IF EXISTS search.search_saved;
DROP TABLE IF EXISTS search.search_history;
DROP TABLE IF EXISTS search.search_click_log;
DROP TABLE IF EXISTS search.search_query;