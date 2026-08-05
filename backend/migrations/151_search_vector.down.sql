-- Migration 151 down: search vector & ranking.

DROP TABLE IF EXISTS search.search_ranking;
DROP TABLE IF EXISTS search.search_vector;