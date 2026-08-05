-- Migration 096: daily material (append-only) & membership analytics.

CREATE TABLE analytics.analytics_material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL,
    date date NOT NULL,
    view int NOT NULL DEFAULT 0,
    completed int NOT NULL DEFAULT 0,
    download int NOT NULL DEFAULT 0,
    bookmark int NOT NULL DEFAULT 0,
    share int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    completion_rate numeric(5,2) NOT NULL DEFAULT 0,
    drop_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, material_id)
);
CREATE INDEX idx_analytics_material_material ON analytics.analytics_material(material_id);
CREATE INDEX idx_analytics_material_date ON analytics.analytics_material(date);
-- material_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_package_id uuid NOT NULL,
    date date NOT NULL,
    new_user int NOT NULL DEFAULT 0,
    renewal int NOT NULL DEFAULT 0,
    expired int NOT NULL DEFAULT 0,
    cancel int NOT NULL DEFAULT 0,
    active int NOT NULL DEFAULT 0,
    conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, membership_package_id)
);
CREATE INDEX idx_analytics_membership_pkg ON analytics.analytics_membership(membership_package_id);
CREATE INDEX idx_analytics_membership_date ON analytics.analytics_membership(date);
CREATE TRIGGER trg_analytics_membership_updated BEFORE UPDATE ON analytics.analytics_membership
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- membership_package_id: uuid TANPA FK (event-driven, per 5).
