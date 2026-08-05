# Database Rebuild Phase 18 — Integration Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the complete `integration` domain (28 tables) in migrations `180–189`.

**Architecture:** API provider/credential/endpoint catalogue, request/response/webhook logging, retry & rate-limit, sync jobs, OAuth, batch processing, AI model/usage, file transfer, callbacks, config.

**Tech Stack:** Supabase Postgres 15. Secrets stored varchar, app-layer encrypted.

## Global Constraints
- Migrations ONLY in range `180_*`..`189_*` (10 files, up+down each).
- Prefix all tables `integration.<name>`. FK to `identity.user(id)` / `media` where defined.
- Total = exactly 28 tables.

---

### Task 1: Provider core (180) — `api_provider`, `api_credential`, `api_endpoint`.
- [ ] Commit + verify.

### Task 2: Request/webhook logs (181) — `api_request_log`, `api_response_log`, `webhook_endpoint`.
- [ ] Commit + verify.

### Task 3: Webhook processing (182) — `webhook_event`, `webhook_log`, `api_retry_queue`.
- [ ] Commit + verify.

### Task 4: Rate limit & usage (183) — `api_rate_limit`, `api_usage_statistics`, `api_error_catalog`.
- [ ] Commit + verify.

### Task 5: Sync (184) — `api_sync_job`, `api_sync_history`.
- [ ] Commit + verify.

### Task 6: OAuth (185) — `oauth_client`, `oauth_token`.
- [ ] Commit + verify.

### Task 7: Module & health (186) — `integration_module`, `provider_health_check`, `provider_incident`.
- [ ] Commit + verify.

### Task 8: Idempotency & batch (187) — `idempotency_key`, `api_batch_job`, `api_batch_item`.
- [ ] Commit + verify.

### Task 9: AI & events (188) — `integration_event_log`, `ai_provider_model`, `ai_usage_log`.
- [ ] Commit + verify.

### Task 10: File/callback/config (189) — `external_file_transfer_log`, `callback_queue`, `api_configuration`.
- [ ] Commit + verify.

---

## Verification Gate
- `integration` schema count live = **28**. `_migrations` grew by 10.

## Deviations
- Secrets plain varchar (app-layer encryption), consistent with phase 16.
- `api_usage_statistics` monthly partitioning deferred (plain table + date unique index), consistent with 9–17.