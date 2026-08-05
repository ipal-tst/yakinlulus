-- Migration 206: cms faq, testimonial, partner & event.

CREATE TABLE cms.cms_faq (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category varchar(120),
    question varchar(500) NOT NULL,
    answer text,
    sort_order int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_faq_updated BEFORE UPDATE ON cms.cms_faq
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_testimonial (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    photo text,
    school varchar(200),
    city varchar(120),
    rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    content text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_testimonial_updated BEFORE UPDATE ON cms.cms_testimonial
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_partner (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    logo text,
    website varchar(500),
    priority int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_partner_updated BEFORE UPDATE ON cms.cms_partner
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    description text,
    banner text,
    start_time timestamptz,
    end_time timestamptz,
    location varchar(300),
    registration_url varchar(500),
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','CANCELLED','ENDED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_event_status ON cms.cms_event(status);
CREATE TRIGGER trg_cms_event_updated BEFORE UPDATE ON cms.cms_event
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();