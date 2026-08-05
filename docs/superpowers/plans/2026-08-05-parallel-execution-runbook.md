# Database Rebuild — Parallel Execution Runbook (Phase 9–20)

> **For agentic workers:** This runbook covers executing the remaining 12 phases (9–20) of the Yakinlulus.id database rebuild **in parallel**. Use with superpowers:subagent-driven-development inside each per-phase worktree. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Phase 0–8 complete (commit `3625411`, 71 migration files `000–091`, 8 schemas live: identity=35, academic=23, media=30, question=38, cbt=55, content=48, finance=24, ranking=25). DB is a single Supabase Postgres; migrations apply via `go run cmd/migrate/main.go up` from `backend/` (files sorted by `NNN_` prefix, tracked in `_migrations`, tx per file).

---

## 1. Which Phases Can Run in Parallel

**Dependency rule (design doc §3 + §5):** a phase depends on another only via FK references it makes, or via a deferred-FK ALTER it must add to an earlier phase's table. Support domains (queue, notification, audit, integration, monitoring, config, search, report, cms, ai, ocr) are **standalone** — core domains do not FK back to them (§5).

Resolved dependency graph:

```
Phase 9  Analytics   → identity.user (FK). Reads cbt/question/content/finance event-driven (NO FK). PARALLEL.
Phase 10 Notification → identity.user (FK). PARALLEL.
Phase 11 Queue        → standalone (§5). PARALLEL.
Phase 12 AI           → identity.user; ADDS deferred FK content.material_embedding.embedding_id → ai.* (promised in 071). Content done → ready. PARALLEL.
Phase 13 OCR          → media.asset (FK). Media done → ready. PARALLEL.
Phase 14 Report       → identity.user (FK). PARALLEL.
Phase 15 Search       → standalone (§5). PARALLEL.
Phase 16 Config       → standalone. PARALLEL.
Phase 17 Audit        → identity.user (FK, actor). PARALLEL.
Phase 18 Integration  → standalone. PARALLEL.
Phase 19 Monitoring   → standalone. PARALLEL.
Phase 20 CMS          → identity.user (FK), media.asset (optional). PARALLEL.
```

**Conclusion: Phases 9–20 are mutually independent and can ALL be executed in parallel**, each in its own git worktree. They share only the already-applied foundation (identity/schemas/shared/media). No FK cycles, no shared files.

The only cross-phase coordination needed is the **migration number allocation** below (each phase gets a disjoint decade), so worktrees never collide when merged.

## 2. Migration Number Allocation (disjoint per phase)

Current last file: `091`. Allocation (each phase writes only inside its own range):

| Phase | Range | Tables (spec) |
|---|---|---|
| 9 Analytics | `092–099` | 20 |
| 10 Notification | `100–109` | 20 |
| 11 Queue | `110–119` | 35 |
| 12 AI | `120–129` | (conceptual, detail in phase; must resolve deferred FK to content.material_embedding) |
| 13 OCR | `130–139` | 28 |
| 14 Report | `140–149` | 24 |
| 15 Search | `150–159` | 22 |
| 16 Config | `160–169` | 52 |
| 17 Audit | `170–179` | 62 |
| 18 Integration | `180–189` | 28 |
| 19 Monitoring | `190–199` | 28 |
| 20 CMS | `200–209` | 31 |

Rules: never write a file outside your phase's range; never renumber another phase's files. When merged, `NNN_` prefixes sort cleanly in any merge order.

## 3. Worktree Strategy

Create one git worktree per phase. Each worktree is a full checkout on branch `phase-N`; the shared DB is the single apply target. Because migration numbers are disjoint, concurrent `go run cmd/migrate/main.go up` runs (each in its own worktree) do not collide.

```powershell
# from repo root, e.g. phases 9, 10, 11:
git worktree add ../yl-phase-9 -b phase-9
git worktree add ../yl-phase-10 -b phase-10
git worktree add ../yl-phase-11 -b phase-11
```

Worktrees are created by `parallel-setup.ps1` (see §6).

## 4. Per-Phase Execution Loop (agent instructions)

Each phase executes the **same loop**, in its own worktree, using subagent-driven development:

1. `cd ../yl-phase-<N>` (the worktree).
2. Write the phase plan to `docs/superpowers/plans/2026-08-05-database-rebuild-phase<N>-<domain>.md` following the established pattern (Phase 4–8 plans as reference), with:
   - Exact table count + names from design doc §4.N catalog.
   - Tasks sized 2–8 tables, each with full verbatim SQL, verification step (`go run cmd/migrate/main.go up`, expected `All migrations applied total=X`), and commit message.
   - Migration files ONLY in the allocated range (§2).
   - Documented deviations (no partitioning, FK-less event-driven cols for analytics/ranking reads, etc.).
3. Generate task briefs via `bash <skills>/task-brief <plan> <taskN>`.
4. Execute tasks via subagent-driven-development: dispatch implementer per task (transcribe SQL verbatim, apply via runner, verify via throwaway pgx program in `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_<phase>_<N>\main.go`), then task reviewer, then final whole-branch review.
5. Append progress to `.superpowers/sdd/progress.md` (the ledger).
6. Commit each task + final plan doc to the worktree branch `phase-N`.
7. Run `parallel-verify.ps1 -Phase N -ExpectedTables <count>` to confirm the schema table count live.
8. Report DONE; do NOT merge yet — see §5.

**Environment facts for implementers:**
- DB URL: `postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10`
- Throwaway verifier pattern: write/overwrite `main.go` (pgx/v5), run with `$env:PQURL = <url>; go run main.go`.
- Task briefs and review packages: use the subagent-driven-development scripts (`task-brief`, `review-package`) — bash is at `C:\Users\Administrator\AppData\Local\hermes\git\bin\bash.exe`.
- `git add` from worktree root uses `backend/migrations/...` paths (repo layout nests migrations under `backend/`).

## 5. Merge Back

Phases merge back to `main` in any order (disjoint migration numbers guarantee no file conflicts). Merge sequence per phase:

```powershell
# from repo root on main, per phase:
git checkout main
git merge --no-ff phase-9 -m "feat(db): phase 9 analytics"
git worktree remove ../yl-phase-9
git branch -d phase-9
```

`parallel-finish.ps1 -Phase 9` does this for one phase. After each merge, run `go run cmd/migrate/main.go up` once and re-verify the merged schema counts.

## 6. Scripts

| Script | Purpose |
|---|---|
| `parallel-setup.ps1 -Phases 9,10,11` | Creates a git worktree + branch `phase-N` for each listed phase. |
| `parallel-verify.ps1 -Phase 9 -ExpectedTables 20` | Queries `information_schema` for the phase's schema and asserts the live table count. |
| `parallel-finish.ps1 -Phase 9` | Merges `phase-N` into `main` (`--no-ff`), removes worktree + branch. |
| `parallel-execute.sh <phase> <domain> <tables>` | Bash driver (Hermes-CLI friendly): sets up worktree, prints per-phase instructions, runs the plan-writing scaffold. |

Scripts live in `.superpowers/sdd/parallel/`. They assume: repo root = current dir, DB URL above, `bash` available, PowerShell 5.1+.

## 7. Verification Gate (per phase, before merge)

1. `go run cmd/migrate/main.go up` applies every file in the phase's range cleanly.
2. `parallel-verify.ps1` reports the exact expected table count for the schema.
3. `_migrations` row count = 71 + (files in this phase's range).
4. All deferred FKs promised by earlier phases are resolved (only Phase 12's `content.material_embedding.embedding_id → ai.*` remains — it is this phase's job).
5. Down migrations are reverse-dependency-ordered and idempotent.
6. Global conventions (§2) hold; ledger and final review clean.

---

## Self-Review

**Coverage:** all 12 remaining phases (9–20) addressed, each mapped to a disjoint migration range, a worktree, a verify script, and a finish script. The dependency analysis (§1) cites the design doc rules that justify full parallelism.

**No placeholders:** the loop in §4 is the same loop already executed 8 times (Phase 0–8); §6 names concrete scripts that are created alongside this runbook.

**Consistency:** migration ranges (§2) are disjoint and ascending; script names (§6) match the actual files in `.superpowers/sdd/parallel/`.

**Caveat to record in ledger:** parallel `go run cmd/migrate/main.go up` runs are safe only because ranges are disjoint AND the runner sorts by filename (not by insertion order). If two phases ever need the same `NNN_` prefix, serialize those phases.
