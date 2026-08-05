-- Migration 209: cms form, contact & subscriber.

CREATE TABLE cms.cms_form (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    form_key varchar(120) NOT NULL,
    description text,
    fields jsonb,
    success_message text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (form_key)
);
CREATE TRIGGER trg_cms_form_updated BEFORE UPDATE ON cms.cms_form
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_contact (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name varchar(200),
    phone varchar(60),
    email varchar(200),
    subject varchar(300),
    message text,
    status varchar(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','READ','REPLIED','CLOSED')),
    source varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_contact_status ON cms.cms_contact(status);
CREATE TRIGGER trg_cms_contact_updated BEFORE UPDATE ON cms.cms_contact
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_subscriber (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(200) NOT NULL,
    name varchar(200),
    subscribed_at timestamptz NOT NULL DEFAULT NOW(),
    status varchar(20) NOT NULL DEFAULT 'SUBSCRIBED' CHECK (status IN ('SUBSCRIBED','UNSUBSCRIBED','BOUNCED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (email)
);
CREATE INDEX idx_cms_subscriber_status ON cms.cms_subscriber(status);