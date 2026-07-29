Berikut **09_exam_database_schema / 05_migration_plan.md**.

Dokumen ini mendefinisikan strategi migrasi database untuk modul **Exam** agar deployment dapat dilakukan secara aman melalui environment:

```
Development
      |
      |
Staging
      |
      |
Production
```

Strategi mengikuti prinsip:

* version controlled migration;
* backward compatible deployment;
* zero/minimal downtime;
* aman terhadap data CBT yang sedang berjalan.

---

````markdown id="ex05migration"
# 05_migration_plan.md

# YakinLulus.id Exam Database Migration Plan

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan strategi migrasi
database untuk modul Exam.

Migration bertanggung jawab terhadap:

- pembuatan schema;
- pembuatan tabel;
- perubahan struktur;
- indexing;
- constraint;
- data migration.

---

# 2. Migration Principle

Migration harus memenuhi:

```
Repeatable

Versioned

Rollback Capable

Auditable

Production Safe
```

---

# 3. Migration Tool

Rekomendasi:

```
Go Backend

+

golang-migrate

atau

Atlas

atau

Flyway
```

---

Untuk stack YakinLulus.id:

Recommended:

```
golang-migrate
```

karena backend menggunakan Go.

---

# 4. Migration Directory

Struktur:

```
database/

migrations/

├── 0001_create_exam_schema.up.sql

├── 0001_create_exam_schema.down.sql


├── 0002_create_exam_template.up.sql

├── 0002_create_exam_template.down.sql


├── 0003_create_exam_core.up.sql

├── 0003_create_exam_core.down.sql


├── 0004_create_question_mapping.up.sql

├── 0004_create_question_mapping.down.sql


├── 0005_create_exam_runtime.up.sql

├── 0005_create_exam_runtime.down.sql


├── 0006_create_answer_system.up.sql

├── 0006_create_answer_system.down.sql


├── 0007_create_scoring.up.sql

├── 0007_create_scoring.down.sql


├── 0008_create_ranking.up.sql

├── 0008_create_ranking.down.sql


├── 0009_create_indexes.up.sql

├── 0009_create_indexes.down.sql


└── 0010_create_constraints.up.sql

```

---

# 5. Migration Sequence

Urutan deployment:

```
Extension

↓

Schema

↓

Master Table

↓

Exam Table

↓

Question Mapping

↓

Runtime Table

↓

Answer Table

↓

Result Table

↓

Index

↓

Constraint

↓

Seed Data
```

---

# 6. Phase 1
# Create Schema

Migration:

```
0001_create_exam_schema
```

Create:

```sql
CREATE SCHEMA exam;
```

---

Dependency:

```
public

question_bank
```

harus tersedia.

---

# 7. Phase 2
# Exam Master

Migration:

```
0002_create_exam_template
```

Create:

```
exam_templates
```

---

Migration:

```
0003_create_exam_core
```

Create:

```
exams

exam_settings

exam_sections

exam_schedules
```

---

# 8. Phase 3
# Question Integration

Migration:

```
0004_create_question_mapping
```

Create:

```
exam_question_sets

exam_questions

exam_question_rules
```

---

Dependency:

```
question_bank.question_versions
```

---

# 9. Phase 4
# CBT Runtime

Migration:

```
0005_create_exam_runtime
```

Create:

```
exam_sessions

session_questions
```

---

Critical migration.

Harus dilakukan:

```
maintenance window
```

jika production traffic tinggi.

---

# 10. Phase 5
# Answer System

Migration:

```
0006_create_answer_system
```

Create:

```
student_answers

answer_events
```

---

Karena high write:

Tambahkan:

```
partition planning
```

---

# 11. Phase 6
# Scoring

Migration:

```
0007_create_scoring
```

Create:

```
exam_results

exam_scores
```

---

# 12. Phase 7
# Ranking

Migration:

```
0008_create_ranking
```

Create:

```
exam_rankings

ranking_snapshots
```

---

# 13. Phase 8
# Index Deployment

Migration:

```
0009_create_indexes
```

---

Production recommendation:

Gunakan:

```sql
CREATE INDEX CONCURRENTLY
```

untuk tabel besar.

Contoh:

```sql
CREATE INDEX CONCURRENTLY
idx_student_answers_session
ON exam.student_answers(session_id);
```

---

# 14. Phase 9
# Constraint Deployment

Migration:

```
0010_create_constraints
```

---

Constraint:

```
Foreign Key

Unique

Check

Trigger
```

---

# 15. Seed Data

Migration:

```
0011_seed_exam_data
```

---

Data awal:

```
Exam Type

Practice

Tryout

Simulation
```

---

# 16. Rollback Strategy

Setiap migration memiliki:

```
.up.sql

.down.sql
```

---

Contoh:

Up:

```
CREATE TABLE exams
```

Down:

```
DROP TABLE exams
```

---

# 17. Production Migration Strategy

Gunakan:

```
Expand

↓

Migrate

↓

Contract
```

---

Contoh:

## Expand

Tambah column:

```
new_score
```

---

## Migrate

Copy data:

```
old_score

↓

new_score
```

---

## Contract

Hapus:

```
old_score
```

---

# 18. Zero Downtime Strategy

Untuk tabel besar:

```
student_answers

answer_events
```

gunakan:

```
Create new structure

↓

Backfill

↓

Switch application

↓

Remove old
```

---

# 19. Data Migration

Jika migrasi membutuhkan perubahan data:

gunakan:

```
background worker
```

bukan:

```
single transaction
```

---

Contoh:

```
10 million answers

```

diproses:

```
batch 1000 rows
```

---

# 20. Migration Testing

Sebelum production:

Test:

```
Fresh Install

Upgrade Existing DB

Rollback

Data Integrity

Performance
```

---

# 21. Migration Checklist

## Development

```
[ ] migration success

[ ] rollback success

[ ] test data valid
```

---

## Staging

```
[ ] production-like data

[ ] performance test

[ ] load test
```

---

## Production

```
[ ] backup database

[ ] migration approval

[ ] monitoring enabled

[ ] rollback ready
```

---

# 22. Backup Before Migration

Wajib:

```
Full PostgreSQL Backup
```

---

Command:

```bash
pg_dump

```

---

Backup:

```
before_exam_migration.sql
```

---

# 23. Migration Monitoring

Monitor:

```
Migration duration

Locking

Deadlock

Query latency

Connection usage
```

---

# 24. Large Table Policy

Untuk:

```
student_answers

answer_events

activity_logs
```

gunakan:

```
partition migration
```

---

# 25. Future Migration

Disiapkan untuk:

```
Adaptive Testing

AI Scoring

IRT Model

Proctoring Data

Certification
```

---

# 26. Final Migration Architecture

```
Migration Files

        |

        |

CI/CD Pipeline

        |

        |

Staging Database

        |

        |

Production Database

```

---

# 27. Conclusion

Migration strategy Exam memastikan:

- deployment aman;
- perubahan schema terkontrol;
- downtime minimal;
- data ujian tetap valid;
- siap scale besar.
````

---

Status:

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 06_seed_data.md**.
