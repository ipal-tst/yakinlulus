-- Migration 152 down: search keyword, tag & filter.

DROP TABLE IF EXISTS search.search_filter;
DROP TABLE IF EXISTS search.search_tag;
DROP TABLE IF EXISTS search.search_keyword;