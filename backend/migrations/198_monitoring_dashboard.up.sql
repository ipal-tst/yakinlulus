-- Migration 198: monitoring dashboard, widget, incident & maintenance window.

CREATE TABLE monitoring.monitoring_dashboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_name varchar(200) NOT NULL,
    description text,
    layout_json jsonb,
    visibility varchar(20) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE','PUBLIC','TEAM')),
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_monitoring_dashboard_updated BEFORE UPDATE ON monitoring.monitoring_dashboard
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.dashboard_widget (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id uuid NOT NULL REFERENCES monitoring.monitoring_dashboard(id) ON DELETE CASCADE,
    widget_name varchar(200),
    widget_type varchar(120),
    chart_type varchar(120),
    query text,
    position jsonb,
    size jsonb,
    refresh_interval int NOT NULL DEFAULT 60,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dashboard_widget_dashboard ON monitoring.dashboard_widget(dashboard_id);
CREATE TRIGGER trg_dashboard_widget_updated BEFORE UPDATE ON monitoring.dashboard_widget
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE monitoring.monitoring_incident (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_no varchar(60) NOT NULL,
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE SET NULL,
    severity varchar(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    title varchar(200) NOT NULL,
    description text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    resolved_at timestamptz,
    root_cause text,
    resolution text,
    status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','INVESTIGATING','RESOLVED','CLOSED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (incident_no)
);
CREATE INDEX idx_monitoring_incident_service ON monitoring.monitoring_incident(service_id);
CREATE INDEX idx_monitoring_incident_status ON monitoring.monitoring_incident(status);

CREATE TABLE monitoring.maintenance_window (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    description text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_maintenance_window_service ON monitoring.maintenance_window(service_id);
CREATE INDEX idx_maintenance_window_time ON monitoring.maintenance_window(start_time);