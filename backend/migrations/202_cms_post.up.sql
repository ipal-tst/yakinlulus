-- Migration 202: cms post, post version & category.

CREATE TABLE cms.cms_post (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(255) NOT NULL,
    title varchar(300) NOT NULL,
    excerpt text,
    content text,
    cover_image text,
    category_id uuid,
    author_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
    published_at timestamptz,
    reading_time int NOT NULL DEFAULT 0,
    view_count int NOT NULL DEFAULT 0,
    like_count int NOT NULL DEFAULT 0,
    share_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);
CREATE INDEX idx_cms_post_author ON cms.cms_post(author_id);
CREATE INDEX idx_cms_post_status ON cms.cms_post(status);
CREATE TRIGGER trg_cms_post_updated BEFORE UPDATE ON cms.cms_post
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_post_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES cms.cms_post(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    content text,
    editor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, version)
);
CREATE INDEX idx_cms_post_version_post ON cms.cms_post_version(post_id);

CREATE TABLE cms.cms_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES cms.cms_category(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    slug varchar(255) NOT NULL,
    description text,
    icon varchar(120),
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);
CREATE INDEX idx_cms_category_parent ON cms.cms_category(parent_id);
CREATE TRIGGER trg_cms_category_updated BEFORE UPDATE ON cms.cms_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();