# Database Rebuild Phase 19 — Monitoring Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the complete `monitoring` domain (28 tables) in migrations `190–199`.

**Architecture:** Service/instance registry, health checks, metrics collectors (service/db/redis/queue/api/error), tracing, alerts, SLA, synthetic monitoring, capacity/business/storage/worker metrics, dashboards, incidents, maintenance, config.

**Tech Stack:** Supabase Postgres 15.

## Global Constraints
- Migrations ONLY in range `190_*`..`199_*` (10 files, up+down each).
- Prefix all tables `monitoring.<name>`. FK to `identity.user(id)` for created_by.
- Total = exactly 28 tables.

---

### Task 1: Service registry (190) — `monitored_service`, `service_instance`, `health_check`.
- [ ] Commit + verify.

### Task 2: Base metrics (191) — `service_metrics`, `database_metrics`, `redis_metrics`, `queue_metrics`.
- [ ] Commit + verify.

### Task 3: API metrics (192) — `api_metrics`, `endpoint_availability`, `error_metrics`.
- [ ] Commit + verify.

### Task 4: Tracing (193) — `tracing_transaction`, `tracing_span`.
- [ ] Commit + verify.

### Task 5: Alert (194) — `alert`, `alert_event`, `alert_notification`.
- [ ] Commit + verify.

### Task 6: SLA (195) — `sla_configuration`, `sla_report`.
- [ ] Commit + verify.

### Task 7: Synthetic (196) — `synthetic_monitor`, `synthetic_result`.
- [ ] Commit + verify.

### Task 8: Capacity & domain metrics (197) — `capacity_forecast`, `business_metrics`, `worker_metrics`, `storage_metrics`.
- [ ] Commit + verify.

### Task 9: Dashboard & incident (198) — `monitoring_dashboard`, `dashboard_widget`, `monitoring_incident`, `maintenance_window`.
- [ ] Commit + verify.

### Task 10: Config (199) — `monitoring_configuration`.
- [ ] Commit + verify.

---

## Verification Gate
- `monitoring` schema count live = **28**. `_migrations` grew by 10.

## Deviations
- Metrics tables are append-only snapshots (no per-row updates), consistent with audit conventions.
- No physical partitioning; time-column indexes used.