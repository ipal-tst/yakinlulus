-- Migration 153: search query, click log, history & saved.

CREATE TABLE search.search_query (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    keyword varchar(255) NOT NULL,
    normalized_keyword varchar(255),
    language varchar(10) DEFAULT 'id',
    search_type varchar(20) NOT NULL DEFAULT 'GENERAL' CHECK (search_type IN ('GENERAL','QUESTION','MATERIAL','VIDEO','TEACHER','SCHOOL')),
    result_count int NOT NULL DEFAULT 0,
    duration_ms int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_query_user ON search.search_query(user_id);
CREATE INDEX idx_search_query_created ON search.search_query(created_at);
CREATE INDEX idx_search_query_keyword ON search.search_query(normalized_keyword);

CREATE TABLE search.search_click_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id uuid REFERENCES search.search_query(id) ON DELETE CASCADE,
    document_id uuid REFERENCES search.search_document(id) ON DELETE SET NULL,
    position int NOT NULL DEFAULT 0,
    clicked_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_click_log_query ON search.search_click_log(query_id);
CREATE INDEX idx_search_click_log_document ON search.search_click_log(document_id);
CREATE INDEX idx_search_click_log_time ON search.search_click_log(clicked_at);

CREATE TABLE search.search_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    keyword varchar(255) NOT NULL,
    searched_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_history_user ON search.search_history(user_id, searched_at);
CREATE INDEX idx_search_history_time ON search.search_history(searched_at);

CREATE TABLE search.search_saved (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    keyword varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, keyword)
);