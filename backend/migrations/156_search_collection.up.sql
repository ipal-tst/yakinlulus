-- Migration 156: search collection, collection document & setting.

CREATE TABLE search.search_collection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(120) NOT NULL,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);
CREATE TRIGGER trg_search_collection_updated BEFORE UPDATE ON search.search_collection
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE search.search_collection_document (
    collection_id uuid NOT NULL REFERENCES search.search_collection(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES search.search_document(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection_id, document_id)
);
CREATE INDEX idx_search_coll_doc_document ON search.search_collection_document(document_id);

CREATE TABLE search.search_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key varchar(120) NOT NULL,
    setting_value jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (setting_key)
);
CREATE TRIGGER trg_search_setting_updated BEFORE UPDATE ON search.search_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();