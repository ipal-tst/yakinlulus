-- Migration 154: search suggestion, synonym & stopword.

CREATE TABLE search.search_suggestion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword varchar(120) NOT NULL,
    popularity int NOT NULL DEFAULT 0,
    language varchar(10) NOT NULL DEFAULT 'id',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (keyword, language)
);
CREATE INDEX idx_search_suggestion_popularity ON search.search_suggestion(popularity DESC);
CREATE INDEX idx_search_suggestion_active ON search.search_suggestion(active);

CREATE TABLE search.search_synonym (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word varchar(120) NOT NULL,
    synonym varchar(120) NOT NULL,
    language varchar(10) NOT NULL DEFAULT 'id',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (word, synonym, language)
);
CREATE INDEX idx_search_synonym_word ON search.search_synonym(word);

CREATE TABLE search.search_stopword (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word varchar(80) NOT NULL,
    language varchar(10) NOT NULL DEFAULT 'id',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (word, language)
);