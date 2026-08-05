-- Migration 201: cms page version, publish & seo.

CREATE TABLE cms.cms_page_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES cms.cms_page(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    title varchar(300),
    content text,
    editor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (page_id, version)
);
CREATE INDEX idx_cms_page_version_page ON cms.cms_page_version(page_id);

CREATE TABLE cms.cms_page_publish (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES cms.cms_page(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED','PUBLISHED')),
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_at timestamptz,
    scheduled_publish timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_page_publish_page ON cms.cms_page_publish(page_id);
CREATE TRIGGER trg_cms_page_publish_updated BEFORE UPDATE ON cms.cms_page_publish
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_page_seo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES cms.cms_page(id) ON DELETE CASCADE,
    meta_title varchar(300),
    meta_description text,
    meta_keyword varchar(500),
    canonical_url varchar(500),
    robots varchar(200),
    og_title varchar(300),
    og_description text,
    og_image text,
    schema_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (page_id)
);
CREATE TRIGGER trg_cms_page_seo_updated BEFORE UPDATE ON cms.cms_page_seo
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();