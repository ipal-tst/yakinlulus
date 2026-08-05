-- Migration 205: cms banner, widget, component & menu.

CREATE TABLE cms.cms_banner (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    subtitle varchar(500),
    image text,
    mobile_image text,
    button_text varchar(120),
    button_link varchar(500),
    position int NOT NULL DEFAULT 0,
    priority int NOT NULL DEFAULT 0,
    start_date timestamptz,
    end_date timestamptz,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','SCHEDULED','EXPIRED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_banner_status ON cms.cms_banner(status);
CREATE TRIGGER trg_cms_banner_updated BEFORE UPDATE ON cms.cms_banner
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_widget (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    widget_type varchar(120),
    config jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_widget_updated BEFORE UPDATE ON cms.cms_widget
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_component (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name varchar(200) NOT NULL,
    component_type varchar(120),
    component_schema jsonb,
    version varchar(30) NOT NULL DEFAULT '1.0',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (component_name, version)
);
CREATE TRIGGER trg_cms_component_updated BEFORE UPDATE ON cms.cms_component
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_menu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    location varchar(20) NOT NULL DEFAULT 'HEADER' CHECK (location IN ('HEADER','FOOTER','SIDEBAR','MOBILE')),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_menu_updated BEFORE UPDATE ON cms.cms_menu
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cms.cms_menu_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id uuid NOT NULL REFERENCES cms.cms_menu(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES cms.cms_menu_item(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    url varchar(500),
    icon varchar(120),
    sort_order int NOT NULL DEFAULT 0,
    target varchar(20) NOT NULL DEFAULT 'SELF' CHECK (target IN ('SELF','BLANK','PARENT')),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cms_menu_item_menu ON cms.cms_menu_item(menu_id);
CREATE TRIGGER trg_cms_menu_item_updated BEFORE UPDATE ON cms.cms_menu_item
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();