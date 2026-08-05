# Database Rebuild Phase 15 — Search Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the complete `search` domain (22 tables) in migrations `150–157`.

**Architecture:** Search catalogue (document/category/collection), FTS + vector indexes, query/click/analytics logging, dictionary (synonym/stopword/suggestion), ranking, cache, audit.

**Tech Stack:** Supabase Postgres 15, pgvector (reused from migration 001), GIN FTS index.

## Global Constraints
- Migrations ONLY in range `150_*`..`157_*` (8 files, up+down each).
- Prefix all tables `search.<name>`. Shared conventions from existing migrations.
- pgvector type needs explicit dimension: `vector(1536)` for HNSW index.
- Total = exactly 22 tables.

---

### Task 1: Search document & category (150)
**Files:** Create `backend/migrations/150_search_document.up.sql` / `.down.sql`

Tables: `search_document` (with GIN FTS index), `search_category` (self-ref parent).

- [ ] Commit: `feat(db): search document & category (phase 15)`
- [ ] Verify: `go run cmd/migrate/main.go up` clean.

### Task 2: Search vector & ranking (151)
**Files:** `151_search_vector.up.sql` / `.down.sql`

Tables: `search_vector` (`embedding vector(1536)`, HNSW index), `search_ranking`.

- [ ] Commit + verify.

### Task 3: Search keyword, tag, filter (152)
**Files:** `152_search_keyword.up.sql` / `.down.sql`

Tables: `search_keyword`, `search_tag`, `search_filter`.

- [ ] Commit + verify.

### Task 4: Search query/click/history/saved (153)
**Files:** `153_search_query.up.sql` / `.down.sql`

Tables: `search_query`, `search_click_log`, `search_history`, `search_saved`.

- [ ] Commit + verify.

### Task 5: Search suggestion/synonym/stopword (154)
**Files:** `154_search_suggestion.up.sql` / `.down.sql` — 3 tables.

- [ ] Commit + verify.

### Task 6: Search trending/cache/index log (155)
**Files:** `155_search_trending.up.sql` / `.down.sql` — 3 tables.

- [ ] Commit + verify.

### Task 7: Search collection/setting (156)
**Files:** `156_search_collection.up.sql` / `.down.sql`

Tables: `search_collection`, `search_collection_document` (composite PK), `search_setting`.

- [ ] Commit + verify.

### Task 8: Search analytics & audit (157)
**Files:** `157_search_analytics.up.sql` / `.down.sql` — 2 tables.

- [ ] Commit + verify.

---

## Verification Gate
- `search` schema count live = **22**.
- `_migrations` grew by 8 (total 137 with phases 12–15 applied).

## Deviations
- HNSW index requires a fixed embedding dimension → `vector(1536)`.
- Monthly partitioning on log tables (`search_query/click_log/history`) deferred to later operational task (plain tables + time indexes), consistent with phases 9–14.