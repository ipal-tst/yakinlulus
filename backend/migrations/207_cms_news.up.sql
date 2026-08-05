-- Migration 207: cms news, redirect & sitemap.

CREATE TABLE cms.cms_news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    slug varchar(255) NOT NULL,
    content text,
    cover text,
    category varchar(120),
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);
CREATE INDEX idx_cms_news_status ON cms.cms_news(status);
CREATE TRIGGER trg_cms_news_updated BEFORE UPDATE ON cms.cms_news
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_redirect (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_url varchar(500) NOT NULL,
    to_url varchar(500),
    redirect_type int NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302)),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (from_url)
);
CREATE TRIGGER trg_cms_redirect_updated BEFORE UPDATE ON cms.cms_redirect
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_sitemap (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url varchar(500) NOT NULL,
    priority numeric(4,2) NOT NULL DEFAULT 0.5,
    change_frequency varchar(20) NOT NULL DEFAULT 'MONTHLY' CHECK (change_frequency IN ('ALWAYS','HOURLY','DAILY','WEEKLY','MONTHLY','YEARLY','NEVER')),
    last_modified timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (url)
);