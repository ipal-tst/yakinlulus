Berikut **08_database_schema / 05_migration_plan.md**.

Dokumen ini menjelaskan strategi perubahan database dari development sampai production. Karena YakinLulus.id dirancang untuk berkembang dari MVP kecil menjadi platform EdTech besar, migration strategy harus menghindari:

* kehilangan data;
* downtime;
* breaking change;
* kesulitan rollback;
* migrasi besar yang sulit dikontrol.

---

````markdown id="m58x2d"
# 05_migration_plan.md

# YakinLulus.id Question Bank Migration Strategy

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini mendefinisikan strategi migration
database Question Bank.

Migration digunakan untuk mengelola.

- Schema change
- Table creation
- Index
- Constraint
- Data transformation
- Rollback

---

# 2. Migration Principles

Migration mengikuti prinsip.

- Version Controlled
- Repeatable
- Auditable
- Backward Compatible
- Production Safe

---

# 3. Migration Ownership

Database migration dimiliki oleh.

```
Backend Team
```

Dengan review dari.

```
Backend Lead

+

Database Engineer
```

---

# 4. Migration Tool

Recommended.

Go Backend:

```
golang-migrate

atau

goose
```

Alternative.

```
Flyway

Liquibase
```

---

# 5. Migration Structure

Repository.

```
database/

└── migrations/

    ├── public/

    ├── question_bank/

    ├── ai/

    ├── audit/

    └── analytics/
```

---

# 6. File Naming Convention

Format.

```
<version>_<description>.sql
```

Contoh.

```
001_create_question_schema.sql

002_create_questions_table.sql

003_create_question_versions.sql

004_add_question_index.sql
```

---

# 7. Migration Versioning

Migration harus.

- Sequential
- Immutable
- Never edit applied migration

---

Contoh.

Benar:

```
005_add_column.sql
```

Salah:

```
002_create_table.sql

(edit setelah production)
```

---

# 8. Migration Order

Urutan deployment.

```
1.

Create Extension


↓

2.

Create Schema


↓

3.

Create Master Table


↓

4.

Create Core Table


↓

5.

Create Relationship


↓

6.

Create Index


↓

7.

Create Constraint


↓

8.

Seed Data
```

---

# 9. Initial Migration Plan

## Migration 001

Database Extension.

```
uuid-ossp

pgcrypto

pgvector

pg_trgm
```

---

## Migration 002

Create Schema.

```
question_bank

ai

audit

analytics
```

---

## Migration 003

Create Reference Table.

```
subjects

grades

curriculums
```

---

## Migration 004

Create Question Core.

```
questions

question_versions

question_options
```

---

## Migration 005

Create Supporting.

```
reviews

attachments

imports

exports
```

---

## Migration 006

Create AI Tables.

```
embeddings

generation_jobs
```

---

## Migration 007

Create Audit.

```
audit_logs

audit_changes
```

---

# 10. Development Migration Flow

Developer.

```
Create Migration

↓

Run Local Database

↓

Test

↓

Commit

↓

CI Validation
```

---

# 11. Staging Migration Flow

```
Backup

↓

Run Migration

↓

Execute Test

↓

Verify Schema

↓

Performance Check
```

---

# 12. Production Migration Flow

```
Pre Migration

↓

Backup

↓

Maintenance Window

↓

Execute Migration

↓

Verify

↓

Release Application
```

---

# 13. Backward Compatible Migration

Untuk zero downtime.

Gunakan pola.

```
Expand

↓

Migrate Data

↓

Switch Application

↓

Remove Old Column
```

---

# 14. Example Column Change

Tidak langsung.

```
DROP old_column
```

---

Gunakan.

Step 1:

```
ADD new_column
```

Step 2:

```
Application write both
```

Step 3:

```
Copy data
```

Step 4:

```
Remove old_column
```

---

# 15. Data Migration Strategy

Untuk perubahan data.

Gunakan.

```
Migration Script

atau

Background Job
```

---

Contoh.

Mengubah format metadata.

```
Old JSON

↓

New Structure
```

---

# 16. Large Data Migration

Untuk jutaan record.

Tidak dilakukan dalam transaction besar.

Gunakan.

```
Batch Processing

Pagination

Checkpoint
```

---

# 17. Migration Transaction

Default.

```
BEGIN;

migration

COMMIT;
```

---

Untuk migration besar.

Pisahkan.

```
Schema Migration

+

Data Migration
```

---

# 18. Rollback Strategy

Setiap migration wajib memiliki.

```
up migration

down migration
```

---

Contoh.

```
002_create_table.sql

002_create_table_down.sql
```

---

# 19. Rollback Limitation

Tidak semua migration aman rollback.

Contoh.

Data deletion.

```
DROP COLUMN
```

harus memiliki backup.

---

# 20. Migration Testing

Sebelum production.

Test.

```
Fresh Database

Existing Database

Large Dataset

Rollback
```

---

# 21. CI Migration Check

Pipeline.

```
Build

↓

Create Empty DB

↓

Run All Migration

↓

Run Test

↓

Destroy DB
```

---

# 22. Production Migration Safety

Checklist.

```
Backup Available

Migration Reviewed

Rollback Prepared

Monitoring Active

Database Health Checked
```

---

# 23. Schema Version Tracking

Database menyimpan.

```
schema_migrations
```

Berisi.

```
version

applied_at

checksum
```

---

# 24. Migration Monitoring

Monitor.

- Duration
- Lock Time
- Query Impact
- Failed Migration

---

# 25. Lock Management

Migration harus menghindari.

```
Long Table Lock
```

---

Strategi.

- Concurrent Index
- Batch Update
- Online Migration

---

# 26. Index Migration

Untuk tabel besar.

Gunakan.

```sql
CREATE INDEX CONCURRENTLY
```

---

# 27. Environment Migration

Environment.

```
Local

↓

Development

↓

Staging

↓

Production
```

Semua harus menggunakan migration yang sama.

---

# 28. Database Reset Strategy

Development.

Allowed.

```
Drop Database

Rebuild

Seed
```

Production.

Tidak diperbolehkan.

---

# 29. Seed Migration

Data awal.

Contoh.

```
Difficulty Level

Question Status

Default Curriculum
```

---

# 30. Emergency Migration

Jika production issue.

Flow.

```
Incident

↓

Hotfix Migration

↓

Review

↓

Permanent Migration
```

---

# 31. Future Scaling Migration

Persiapan.

```
Partition Table

↓

Create Replica

↓

Move Historical Data
```

---

# 32. Migration Best Practice

Do.

✓ Small migration

✓ Clear purpose

✓ Tested

✓ Documented


Don't.

✗ Manual SQL production

✗ Modify old migration

✗ Massive uncontrolled update

---

# 33. Final Migration Strategy

YakinLulus.id menggunakan.

```
Version Controlled Migration

+

Automated Deployment

+

Backup Before Change

+

Rollback Planning

+

Zero Downtime Pattern
```

Migration menjadi fondasi agar
Question Bank dapat berkembang
dari ribuan sampai jutaan soal
tanpa kehilangan stabilitas.
````

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
03_index_strategy.md
04_constraint_strategy.md
05_migration_plan.md
➡ 06_seed_data.md
07_postgresql_ddl.sql
08_erdiagram.md
```

Selanjutnya kita lanjut ke **06_seed_data.md**.
