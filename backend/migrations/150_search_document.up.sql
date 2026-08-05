-- Migration 150: search document & category (catalog core).

CREATE TABLE search.search_document (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type varchar(30) NOT NULL
        CHECK (document_type IN ('QUESTION','MATERIAL','VIDEO','BLOG','FAQ','NEWS','EVENT','PAGE','TEACHER','SCHOOL','MEMBERSHIP','ANNOUNCEMENT','AI_DOCUMENT')),
    reference_table varchar(120),
    reference_id uuid,
    title varchar(255) NOT NULL,
    subtitle varchar(500),
    description text,
    content text,
    summary text,
    language varchar(10) NOT NULL DEFAULT 'id',
    slug varchar(255),
    thumbnail text,
    cover_image text,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','INDEXED','ARCHIVED','FAILED')),
    visibility varchar(20) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','PRIVATE','UNLISTED')),
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_search_document_slug ON search.search_document(slug);
CREATE INDEX idx_search_document_type ON search.search_document(document_type);
CREATE INDEX idx_search_document_status ON search.search_document(status);
CREATE INDEX idx_search_document_ref ON search.search_document(reference_table, reference_id);
CREATE INDEX idx_search_document_published ON search.search_document(published_at);
CREATE INDEX idx_search_document_fts ON search.search_document
    USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(description,'') || ' ' || coalesce(content,'')));
CREATE TRIGGER trg_search_document_updated BEFORE UPDATE ON search.search_document
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE search.search_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES search.search_category(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    slug varchar(255) NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_search_category_slug ON search.search_category(slug);
CREATE INDEX idx_search_category_parent ON search.search_category(parent_id);
CREATE TRIGGER trg_search_category_updated BEFORE UPDATE ON search.search_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();