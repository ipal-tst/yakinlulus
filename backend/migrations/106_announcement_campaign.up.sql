-- Migration 106: announcement & campaign.

CREATE TABLE notification.announcement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    content text,
    cover_image text,
    category varchar(50),
    publish_at timestamptz,
    expired_at timestamptz,
    is_popup boolean NOT NULL DEFAULT false,
    priority int NOT NULL DEFAULT 0,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_announcement_category ON notification.announcement(category);
CREATE INDEX idx_announcement_publish ON notification.announcement(publish_at);
CREATE INDEX idx_announcement_created_by ON notification.announcement(created_by);
CREATE TRIGGER trg_announcement_updated BEFORE UPDATE ON notification.announcement
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.campaign (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name varchar(200) NOT NULL,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    start_date timestamptz,
    end_date timestamptz,
    target_filter jsonb,
    estimated_recipient int NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','RUNNING','PAUSED','COMPLETED','CANCELLED')),
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_campaign_template ON notification.campaign(template_id);
CREATE INDEX idx_campaign_status ON notification.campaign(status);
CREATE INDEX idx_campaign_dates ON notification.campaign(start_date, end_date);
CREATE INDEX idx_campaign_created_by ON notification.campaign(created_by);
CREATE TRIGGER trg_campaign_updated BEFORE UPDATE ON notification.campaign
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
