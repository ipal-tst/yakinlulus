-- Migration 195 down: sla configuration & report.

DROP TABLE IF EXISTS monitoring.sla_report;
DROP TABLE IF EXISTS monitoring.sla_configuration;