-- Migration 198 down: monitoring dashboard, widget, incident & maintenance window.

DROP TABLE IF EXISTS monitoring.maintenance_window;
DROP TABLE IF EXISTS monitoring.monitoring_incident;
DROP TABLE IF EXISTS monitoring.dashboard_widget;
DROP TABLE IF EXISTS monitoring.monitoring_dashboard;