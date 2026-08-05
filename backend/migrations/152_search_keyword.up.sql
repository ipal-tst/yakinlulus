-- Migration 152: search keyword, tag & filter.

CREATE TABLE search.search_keyword (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES search.search_document(id) ON DELETE CASCADE,
    keyword varchar(120) NOT NULL,
    weight numeric(8,4) NOT NULL DEFAULT 1,
    frequency int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, keyword)
);
CREATE INDEX idx_search_keyword_document ON search.search_keyword(document_id);
CREATE INDEX idx_search_keyword_word ON search.search_keyword(keyword);

CREATE TABLE search.search_tag (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES search.search_document(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    weight numeric(8,4) NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, tag)
);
CREATE INDEX idx_search_tag_document ON search.search_tag(document_id);
CREATE INDEX idx_search_tag_name ON search.search_tag(tag);

CREATE TABLE search.search_filter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type varchar(30) NOT NULL
        CHECK (document_type IN ('QUESTION','MATERIAL','VIDEO','BLOG','FAQ','NEWS','EVENT','PAGE','TEACHER','SCHOOL','MEMBERSHIP','ANNOUNCEMENT','AI_DOCUMENT')),
    filter_name varchar(120) NOT NULL,
    filter_key varchar(120) NOT NULL,
    filter_type varchar(30) NOT NULL DEFAULT 'TEXT' CHECK (filter_type IN ('TEXT','NUMBER','DATE','BOOLEAN','SELECT','MULTI_SELECT')),
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_type, filter_key)
);