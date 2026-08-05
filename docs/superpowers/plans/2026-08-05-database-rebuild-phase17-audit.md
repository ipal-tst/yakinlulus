# Database Rebuild Phase 17 — Audit Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the complete `audit` domain (62 tables) in migrations `170–179`.

**Architecture:** Append-only audit/logging domain. Covers activity & audit trails, auth/security logs, API & error logs, infra/ops logs (deployment/backup/performance/cache), worker/notification logs, AI logs, data-lifecycle logs (consent/privacy/retention/anonymization/archive), partition & retention tracking.

**Tech Stack:** Supabase Postgres 15.

## Global Constraints
- Migrations ONLY in range `170_*`..`179_*` (10 files, up+down each).
- Prefix all tables `audit.<name>`.
- **Append-only**: no `updated_at`, no UPDATE triggers. All tables have `created_at timestamptz`.
- Include `request_id uuid` (and `trace_id` where relevant) for correlation.
- Partitioning deferred (plain tables + time indexes), consistent with 9–16.
- Total = exactly 62 tables.

---

### Task 1: Activity & audit core (170)
`activity_log`, `activity_type`, `activity_category`, `audit_log`, `audit_entity`, `audit_snapshot` — 6 tables.
- [ ] Commit `feat(db): audit core (phase 17)`; verify `up` clean.

### Task 2: Auth logs (171)
`login_log`, `logout_log`, `password_change_log`, `password_reset_log`, `otp_log`, `mfa_log` — 6 tables.
- [ ] Commit + verify.

### Task 3: Role & security logs (172)
`role_change_log`, `permission_change_log`, `access_denied_log`, `security_event`, `suspicious_activity`, `account_lock_log` — 6 tables.
- [ ] Commit + verify.

### Task 4: Token/session/device/API logs (173)
`token_log`, `session_log`, `trusted_device_log`, `api_request_log`, `api_error_log`, `api_rate_limit_log` — 6 tables.
- [ ] Commit + verify.

### Task 5: Error & system logs (174)
`application_error`, `database_error`, `worker_error`, `frontend_error`, `system_event`, `configuration_change` — 6 tables.
- [ ] Commit + verify.

### Task 6: Ops logs (175)
`deployment_log`, `backup_log`, `restore_log`, `performance_log`, `slow_query_log`, `cache_log` — 6 tables.
- [ ] Commit + verify.

### Task 7: Worker/notification logs (176)
`queue_log`, `websocket_log`, `worker_job`, `worker_retry`, `worker_queue`, `notification_log` — 6 tables.
- [ ] Commit + verify.

### Task 8: Notification delivery + AI logs (177)
`notification_delivery`, `notification_open`, `ai_request_log`, `ai_generation_log`, `ai_chat_log`, `ai_ocr_log` — 6 tables.
- [ ] Commit + verify.

### Task 9: AI embedding + import/export/history (178)
`ai_embedding_log`, `import_log`, `export_log`, `bulk_update_log`, `entity_history`, `restore_history` — 6 tables.
- [ ] Commit + verify.

### Task 10: Lifecycle logs (179)
`merge_history`, `consent_log`, `privacy_log`, `retention_log`, `anonymization_log`, `archive_log`, `log_partition`, `log_retention` — 8 tables.
- [ ] Commit + verify.

---

## Verification Gate
- `audit` schema count live = **62**.
- `_migrations` grew by 10.

## Deviations
- Physical monthly partitioning deferred (plain tables + time-column indexes), consistent with phases 9–16.
- `ai_ocr_log.asset_id` FK → `media.asset(id)`; all user refs `identity.user(id)` ON DELETE SET NULL to preserve audit trails.