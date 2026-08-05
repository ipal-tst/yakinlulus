# SDD Progress Ledger

## DB Rebuild Phase 11 Queue (plan docs/superpowers/plans/2026-08-05-database-rebuild-phase11-queue.md)
Base commit: 923cd15 (plan doc). Target: 35 tables in queue schema, migrations 110-119.

Task 11A: complete (commits 923cd15..0decf48, review clean). Verified: queue=3, migration 110 applied.
Task 11B: complete (commits 0decf48..5c58bc1, review clean). Verified: queue=5, migration 111 applied.
Task 11C: complete (commits 5c58bc1..338f452, review clean). Verified: queue=8, migration 112 applied.
Task 11D: complete (commits 338f452..2079612, review clean). Verified: queue=10, migration 113 applied.
Task 11E: complete (commits 2079612..3c396a2, review clean). Verified: queue=13, migration 114 applied.
Task 11F: complete (commits 3c396a2..93394c1, review clean). Verified: queue=15, migration 115 applied.
Task 11G: complete (commits 93394c1..22bcd87, review clean). Verified: queue=19, migration 116 applied.
Task 11H: complete (commits 22bcd87..e4d6ac0, review clean). Verified: queue=22, migration 117 applied.
Task 11I: complete (commits e4d6ac0..5ec1c1a, review clean). Verified: queue=27, migration 118 applied.
Task 11J: complete (commits 5ec1c1a..4a97999, review clean). Verified: queue=35, migration 119 applied.
Final review: approve. Queue domain COMPLETE (35 tables).
Note: _migrations count fluctuates during parallel execution (phase 10 applied 100-109 concurrently); phase 11 files 110-119 all applied cleanly.

## DB Rebuild Phase 14 Report (plan docs/superpowers/plans/2026-08-05-database-rebuild-phase14-report.md)
Base commit: c534987 (plan doc). Target: 24 tables in report schema, migrations 140-149.

Task 14A: complete (commit 1bc5aad, review clean). Verified: report=2, migration 140 applied.
Task 14B: complete (commit 363d5e8, review clean). Verified: report=4, migration 141 applied.
Task 14C: complete (commit 21e4afa, review clean). Verified: report=6, migration 142 applied.
Task 14D: complete (commit 40f2e87, review clean). Verified: report=8, migration 143 applied.
Task 14E: complete (commit 72103ec, review clean). Verified: report=10, migration 144 applied.
Task 14F: complete (commit b85b700, review clean). Verified: report=12, migration 145 applied.
Task 14G: complete (commit e23d7fd, review clean). Verified: report=14, migration 146 applied.
Task 14H: complete (commit 9584f5e, review clean). Verified: report=17, migration 147 applied.
Task 14I: complete (commit 6ab7493, review clean). Verified: report=20, migration 148 applied.
Task 14J: complete (commit fe7fc1f, review clean). Verified: report=24, migration 149 applied.
Final review: approve. Report domain COMPLETE (24 tables). _migrations=109 (grew by 10, files 140-149).
Decisions documented: (1) NO physical partitioning — report_job/export/history/delivery/snapshot/kpi_snapshot/audit_log made plain tables with partition-key columns + time indexes, partitioning deferred to later operational task (consistent with phases 9/10). (2) Cross-domain entity refs (student_id/teacher_id/school_id/record_id/actor) uuid without FK (rule §5). (3) report_definition.template_id uuid without FK (forward ref to 141). (4) period varchar(10) + UNIQUE anti-duplicate. (5) report_permission.role_id FK -> identity.role (preexisting 012).
Note: down migrations use plain `DROP TABLE IF EXISTS` (no CASCADE), matching existing convention in phases 10/11 (100/119); reverse-ordered and idempotent. Do NOT merge.
