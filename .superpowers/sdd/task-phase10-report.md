# Phase 10 Report — Notification Domain (20 tables)

**Status:** COMPLETE
**Worktree:** `D:\Project\EdTech\yl-phase-10` (branch `phase-10`)
**Plan:** `docs/superpowers/plans/2026-08-05-database-rebuild-phase10-notification.md`
**Date:** 2026-08-05

## Summary

Domain `notification` built per design doc §4.11 (Notification, 20 tables). Mechanism: event → template → queue → channel router → delivery → inbox. Standalone support domain; references `identity.user` only, not referenced back (§5).

## Migration files created (range 100–109, 10 up/down pairs)

| File | Tables |
|---|---|
| `100_notification_template.up/.down.sql` | notification_template, notification_channel |
| `101_notification_provider.up/.down.sql` | notification_provider, notification_event |
| `102_notification_queue.up/.down.sql` | notification_queue, notification_delivery |
| `103_notification_history.up/.down.sql` | notification_history, user_notification |
| `104_notification_preferences.up/.down.sql` | notification_preferences, notification_device |
| `105_notification_read_log.up/.down.sql` | notification_read_log, broadcast |
| `106_announcement_campaign.up/.down.sql` | announcement, campaign |
| `107_notification_webhook.up/.down.sql` | notification_webhook, notification_retry |
| `108_notification_scheduler.up/.down.sql` | notification_scheduler, notification_rule |
| `109_notification_audit.up/.down.sql` | notification_statistics, notification_audit_log |

## Commits (branch phase-10)

```
6502191 docs: phase 10 progress ledger
48eef7c feat(db): notification statistics & audit log (phase 10) - completes notification domain (20 tables)
941cebe feat(db): notification scheduler & rule (phase 10)
35eb21e feat(db): notification webhook & retry (phase 10)
72c0f53 feat(db): announcement & campaign (phase 10)
3e190a3 feat(db): notification read log & broadcast (phase 10)
32b1183 feat(db): notification preferences & device (phase 10)
8df3453 feat(db): notification history & user inbox (phase 10)
4c247e9 feat(db): notification queue & delivery (phase 10)
3af9926 feat(db): notification provider & event (phase 10)
e997e06 feat(db): notification template & channel (phase 10)
43112c5 docs: database rebuild phase 10 notification plan
```

## Final verification counts

- `notification` tables live: **20** (all §4.11 names present, missing=[]).
- Phase-10 migration files applied: **10** (100–109, all in `_migrations`).
- Runner state: idempotent — `go run cmd/migrate/main.go up` → `All migrations applied total=81` (71 pre-phase + 10 phase-10).
- `_migrations` raw count: 97 at final check — inflated by parallel phases (phase 9 analytics 092–099 and phase 11 queue 110+ applied concurrently on the shared DB). This is expected; ranges are disjoint and filename-sorted so no collision.
- Core schemas live: 8 (identity/academic/media/question/cbt/content/finance/ranking) — untouched.

## Convention verification

- PK `id uuid DEFAULT gen_random_uuid()` on all 20 tables. ✓
- `created_at timestamptz NOT NULL DEFAULT NOW()` on all 20. ✓
- `updated_at` + `shared.set_updated_at()` trigger ONLY on mutable tables (11): notification_template, notification_channel, notification_provider, user_notification, notification_preferences, notification_device, broadcast, announcement, campaign, notification_scheduler, notification_rule. ✓
- Append-only tables (no updated_at, per instructions) 9: notification_event, notification_queue, notification_delivery, notification_history, notification_read_log, notification_webhook, notification_retry, notification_statistics, notification_audit_log. ✓
- Enums as `varchar` + CHECK (no CREATE TYPE). ✓
- JSONB: variables, payload, request_payload, response_payload, target_filter, condition, config, old_data, new_data. ✓
- 13 FKs → `identity.user` (user_id ×7, created_by ×4, updated_by ×1, actor_id ×1). ✓
- Internal FKs: queue→event/template, delivery→queue, retry→delivery, history→template, user_notification→history, read_log→user_notification, provider→channel, broadcast/campaign/rule/scheduler→template. ✓
- Unique: (code,version,language) template; channel.code; provider_message_id partial; device_uuid + firebase_token partial; (delivery_id,retry_number); (event_name,channel) rule; (date,channel) statistics; user_id preferences. ✓
- All FK + common filter columns indexed. ✓
- Down files: reverse-dependency order, `DROP TABLE IF EXISTS`, idempotent. ✓

## Recorded deviations

1. **No physical partitioning** — consistent with all prior phases; catalog's "Partisi bulanan/tahunan" deferred, time/scheduled columns indexed instead.
2. **`notification_provider.api_key`/`secret_key`** as plain `text` (catalog says encrypted) — secret encryption is an app-layer concern (required deviation per task instructions).
3. **Generic cross-domain refs** (`reference_type`/`reference_id`, `record_id`) as uuid/varchar without FK — §5 event-driven rule.
4. Nullable unique columns use **partial unique indexes** (`WHERE col IS NOT NULL`).

## Concerns

- `_migrations` count is shared across parallel phases; final merge-time verification (runbook §7 gate #3: `_migrations` = 71 + phase files) must be re-run after all phases merge. Notification table count (20) and my 10 filenames in `_migrations` are the authoritative per-phase signals.
- Two transient connection flakes during verification returned `notification=0`; immediate re-query confirmed the true count (10 and 18). Not a schema issue.
- `backend/config.yaml` was copied from repo root into the worktree (file is gitignored, needed by runner) — not committed, no diff.

## Not done (by design)

- No merge to `main` — `parallel-finish.ps1` handles that after all phases report.
