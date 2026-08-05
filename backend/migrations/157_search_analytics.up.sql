-- Migration 157: search analytics & audit log.

CREATE TABLE search.search_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    total_query int NOT NULL DEFAULT 0,
    unique_user int NOT NULL DEFAULT 0,
    average_time numeric(8,2) NOT NULL DEFAULT 0,
    cache_hit int NOT NULL DEFAULT 0,
    cache_miss int NOT NULL DEFAULT 0,
    no_result int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);

CREATE TABLE search.search_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    action varchar(30) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','REINDEX','PUBLISH','UNPUBLISH')),
    table_name varchar(120),
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_audit_actor ON search.search_audit_log(actor);
CREATE INDEX idx_search_audit_created ON search.search_audit_log(created_at);