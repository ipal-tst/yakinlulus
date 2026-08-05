# Database Rebuild Phase 16 — Config Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the complete `config` domain (52 tables) in migrations `160–169`.

**Architecture:** Configuration catalogue (group/definition/value/environment), domain-specific singleton configs (application, security, cbt, ai, storage, payment, membership), integration/webhook/feature-flag, versioning + history + audit.

**Tech Stack:** Supabase Postgres 15. Secrets stored varchar, app-layer encrypted (documented deviation).

## Global Constraints
- Migrations ONLY in range `160_*`..`169_*` (10 files, up+down each).
- Prefix all tables `config.<name>`.
- Secret columns (api_key, secret, password, token) plain varchar — app-layer encryption (per design doc).
- Total = exactly 52 tables.

---

### Task 1: Configuration core (160)
`configuration_group`, `environment`, `configuration_definition`, `configuration_value` — 4 tables.
- [ ] Commit: `feat(db): config core (phase 16)`; verify `up` clean.

### Task 2: Application & security base (161)
`application_configuration`, `branding_configuration`, `localization_configuration`, `security_configuration` — 4 tables.
- [ ] Commit + verify.

### Task 3: Auth & policy (162)
`password_policy`, `ip_whitelist`, `ip_blacklist`, `security_header`, `authentication_provider`, `oauth_configuration` — 6 tables.
- [ ] Commit + verify.

### Task 4: Role & academic (163)
`default_role`, `permission_configuration`, `academic_configuration` — 3 tables.
- [ ] Commit + verify.

### Task 5: CBT config (164)
`cbt_configuration`, `grading_configuration`, `timer_configuration` — 3 tables.
- [ ] Commit + verify.

### Task 6: AI config (165)
`ai_provider`, `ai_model`, `ai_parameter` — 3 tables.
- [ ] Commit + verify.

### Task 7: Storage & channels (166)
`storage_configuration`, `image_configuration`, `video_configuration`, `email_configuration`, `whatsapp_configuration` — 5 tables.
- [ ] Commit + verify.

### Task 8: Notification channels (167)
`sms_configuration`, `push_configuration`, `notification_template` — 3 tables.
- [ ] Commit + verify.

### Task 9: Payment & membership (168)
`payment_gateway`, `invoice_configuration`, `tax_configuration`, `membership_configuration` — 4 tables.
- [ ] Commit + verify.

### Task 10: Ops, flags & versioning (169)
`analytics_configuration`, `dashboard_configuration`, `cron_job`, `scheduler_configuration`, `integration_provider`, `webhook_configuration`, `api_integration`, `feature_flag`, `feature_target`, `backup_configuration`, `restore_configuration`, `maintenance_schedule`, `maintenance_history`, `configuration_version`, `configuration_snapshot`, `configuration_history`, `configuration_audit` — 17 tables.
- [ ] Commit + verify.

---

## Verification Gate
- `config` schema count live = **52**.
- `_migrations` grew by 10.

## Deviations
- Secrets as varchar, app-layer encryption (design doc §2 note).
- `ai_provider/ai_model/ai_parameter` are config-domain duplicates of ai-domain tables (separate schema namespace, per design note) — no cross-schema FK.
- `cron_job` name overlaps queue domain — namespaced by schema.