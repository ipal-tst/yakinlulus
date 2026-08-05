-- Migration 155: search trending, cache & index log.

CREATE TABLE search.search_trending (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    keyword varchar(120) NOT NULL,
    total_search int NOT NULL DEFAULT 0,
    ranking int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, keyword)
);
CREATE INDEX idx_search_trending_date ON search.search_trending(date, ranking);

CREATE TABLE search.search_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key varchar(255) NOT NULL,
    query_hash varchar(64) NOT NULL,
    response jsonb,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (cache_key)
);
CREATE INDEX idx_search_cache_expired ON search.search_cache(expired_at);

CREATE TABLE search.search_index_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES search.search_document(id) ON DELETE CASCADE,
    operation varchar(20) NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE','REINDEX')),
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','PENDING')),
    duration int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_index_log_document ON search.search_index_log(document_id);
CREATE INDEX idx_search_index_log_created ON search.search_index_log(created_at);