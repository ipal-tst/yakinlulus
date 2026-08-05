-- Migration 203: cms tag, post tag & comment.

CREATE TABLE cms.cms_tag (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    slug varchar(255) NOT NULL,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);

CREATE TABLE cms.cms_post_tag (
    post_id uuid NOT NULL REFERENCES cms.cms_post(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES cms.cms_tag(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX idx_cms_post_tag_tag ON cms.cms_post_tag(tag_id);

CREATE TABLE cms.cms_comment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES cms.cms_post(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    parent_comment uuid REFERENCES cms.cms_comment(id) ON DELETE CASCADE,
    content text,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','SPAM')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_comment_post ON cms.cms_comment(post_id);
CREATE INDEX idx_cms_comment_status ON cms.cms_comment(status);
CREATE TRIGGER trg_cms_comment_updated BEFORE UPDATE ON cms.cms_comment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();