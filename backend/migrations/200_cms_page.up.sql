-- Migration 200: cms page & page block (cms core).

CREATE TABLE cms.cms_page (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(255) NOT NULL,
    title varchar(300) NOT NULL,
    subtitle varchar(500),
    description text,
    page_type varchar(20) NOT NULL DEFAULT 'CUSTOM' CHECK (page_type IN ('HOME','ABOUT','CONTACT','FAQ','PRIVACY','TERM','LANDING','CUSTOM')),
    template varchar(120),
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
    visibility varchar(20) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','PRIVATE','UNLISTED')),
    cover_image text,
    thumbnail text,
    author_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    editor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);
CREATE INDEX idx_cms_page_type ON cms.cms_page(page_type);
CREATE INDEX idx_cms_page_status ON cms.cms_page(status);
CREATE INDEX idx_cms_page_author ON cms.cms_page(author_id);
CREATE TRIGGER trg_cms_page_updated BEFORE UPDATE ON cms.cms_page
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_page_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES cms.cms_page(id) ON DELETE CASCADE,
    component_type varchar(120),
    component_name varchar(200),
    sort_order int NOT NULL DEFAULT 0,
    config jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_page_block_page ON cms.cms_page_block(page_id, sort_order);
CREATE TRIGGER trg_cms_page_block_updated BEFORE UPDATE ON cms.cms_page_block
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();