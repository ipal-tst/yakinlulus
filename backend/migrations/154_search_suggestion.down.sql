-- Migration 154 down: search suggestion, synonym & stopword.

DROP TABLE IF EXISTS search.search_stopword;
DROP TABLE IF EXISTS search.search_synonym;
DROP TABLE IF EXISTS search.search_suggestion;