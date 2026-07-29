```markdown id="m6s9p2"
# 06_migration_strategy.md

# PostgreSQL Migration Strategy

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan strategi migration database PostgreSQL untuk platform YakinLulus.

Tujuan:

- Mengelola perubahan schema secara aman.
- Menjaga konsistensi database antar environment.
- Mendukung continuous deployment.
- Menghindari perubahan database manual.
- Mendukung rollback dan recovery.
- Menyiapkan scaling jangka panjang.

---

# 2. Migration Philosophy

YakinLulus menggunakan prinsip:

```

Database Schema is Code

```

Artinya:

Database bukan konfigurasi manual.

Database adalah bagian dari source code.

---

Semua perubahan harus melalui:

```

Migration File

↓

Version Control

↓

CI/CD Pipeline

↓

Database Deployment

```

---

# 3. Environment Strategy

Database memiliki beberapa environment:

```

Development

↓

Testing

↓

Staging

↓

Production

```

---

Setiap environment memiliki:

- Database sendiri.
- Migration history sendiri.
- Credential sendiri.

---

# 4. Migration Ownership

Database migration dimiliki oleh:

```

Backend Team

*

Database Administrator

```

---

Tidak boleh:

```

Developer langsung ALTER DATABASE Production

```

---

# 5. Migration Tool

Rekomendasi:

## Django

Menggunakan:

```

Django Migration Framework

```

---

## Golang

Menggunakan:

```

golang-migrate

atau

Atlas

```

---

## SQL Native

Menggunakan:

```

Versioned SQL Migration

```

---

# 6. Migration Structure

Standard folder:

```

database/

└── migrations/

```
├── 0001_initial_schema.sql

├── 0002_create_academic_domain.sql

├── 0003_create_question_domain.sql

├── 0004_add_question_index.sql

└── 0005_add_constraints.sql
```

```

---

# 7. Migration Naming Convention

Format:

```

{sequence}_{description}

```

---

Contoh:

```

0001_create_user_table.sql

0002_create_question_table.sql

0003_add_question_search_index.sql

```

---

Tidak:

```

fix.sql

new.sql

update.sql

```

---

# 8. Migration Version Table

Database menyimpan:

```

migration_history

````

---

Structure:

```sql
CREATE TABLE system.migration_history
(
    id UUID PRIMARY KEY,

    version VARCHAR(50),

    name VARCHAR(255),

    executed_at TIMESTAMP,

    checksum VARCHAR(255)
);
````

---

Fungsi:

* Tracking migration.
* Audit.
* Recovery.

---

# 9. Initial Database Migration

Initial deployment:

```
0001_initial_schema
```

berisi:

* Schema creation.
* Extension.
* Base table.
* Basic constraint.

---

Contoh:

```
CREATE SCHEMA academic;

CREATE SCHEMA question;

CREATE SCHEMA cbt;

CREATE SCHEMA identity;
```

---

# 10. Schema Migration Order

Urutan migration:

```
1. Extension

↓

2. Schema

↓

3. Master Data

↓

4. Core Entity

↓

5. Relationship

↓

6. Constraint

↓

7. Index

↓

8. Seed Data
```

---

# 11. Domain Migration Order

Karena dependency:

```
System

↓

Identity

↓

Organization

↓

Academic

↓

Question Bank

↓

Learning Resource

↓

CBT

↓

Learning

↓

Media

↓

AI

↓

Analytics
```

---

Alasan:

Identity dan Academic menjadi dependency banyak domain.

---

# 12. Extension Migration

Migration pertama:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

Digunakan untuk:

* UUID.
* Search.
* AI embedding.

---

# 13. Table Migration Rule

Setiap tabel:

harus memiliki:

```
CREATE TABLE

Primary Key

Audit Column

Basic Constraint
```

---

Contoh:

```sql
CREATE TABLE question.question
(
 id UUID PRIMARY KEY,

 content TEXT NOT NULL,

 created_at TIMESTAMP NOT NULL,

 updated_at TIMESTAMP NOT NULL
);
```

---

# 14. Migration Atomicity

Migration harus atomic.

Contoh:

```
BEGIN;

CREATE TABLE;

CREATE INDEX;

ALTER CONSTRAINT;

COMMIT;
```

---

Jika gagal:

```
ROLLBACK
```

---

# 15. Migration Transaction Rule

Default:

```
Transactional Migration
```

---

Exception:

Large operation:

```
CREATE INDEX CONCURRENTLY
```

---

Karena:

```
Tidak lock table lama
```

---

# 16. Zero Downtime Migration

Untuk production.

Prinsip:

```
Expand

↓

Migrate Data

↓

Switch Application

↓

Contract
```

---

# 17. Expand Phase

Tambahkan perubahan baru.

Contoh:

Tambahkan kolom:

```sql
ALTER TABLE user_account

ADD COLUMN display_name TEXT;
```

---

Aplikasi lama tetap berjalan.

---

# 18. Migrate Phase

Isi data baru.

Contoh:

```
username

↓

display_name
```

---

Menggunakan:

```
Background Job
```

---

# 19. Switch Phase

Aplikasi mulai menggunakan:

```
display_name
```

---

---

# 20. Contract Phase

Hapus field lama.

Contoh:

```sql
DROP COLUMN username_old;
```

---

Dilakukan setelah:

```
Semua service sudah migrasi.
```

---

# 21. Breaking Change Rule

Tidak boleh langsung:

```
Rename Column

↓

Deploy
```

---

Contoh buruk:

```sql
ALTER TABLE user

RENAME COLUMN name TO full_name;
```

---

Karena aplikasi lama gagal.

---

# 22. Safe Column Rename

Metode:

```
Add New Column

↓

Copy Data

↓

Update Application

↓

Remove Old Column
```

---

# 23. Large Data Migration

Untuk data besar:

Tidak:

```
UPDATE million rows
```

langsung.

---

Gunakan:

```
Batch Processing
```

---

Contoh:

```
1000 rows

↓

Commit

↓

1000 rows

↓

Commit
```

---

# 24. Index Migration Strategy

Index besar:

gunakan:

```sql
CREATE INDEX CONCURRENTLY
```

---

Contoh:

```sql
CREATE INDEX CONCURRENTLY idx_question_subject

ON question.question(subject_id);
```

---

Keuntungan:

* Tidak lock table.
* Production friendly.

---

# 25. Foreign Key Migration

Untuk data besar:

Gunakan:

```
NOT VALID
```

---

Contoh:

```sql
ALTER TABLE answer_sheet

ADD CONSTRAINT fk_question

FOREIGN KEY(question_id)

REFERENCES question.question(id)

NOT VALID;
```

---

Validasi kemudian:

```sql
VALIDATE CONSTRAINT
```

---

# 26. Seed Data Strategy

Seed dibagi:

## System Seed

Wajib.

Contoh:

```
Roles

Permissions

Default Configuration
```

---

## Master Seed

Contoh:

```
Education Level

Subject

Difficulty Level
```

---

## Demo Seed

Hanya development.

---

# 27. Master Data Versioning

Master data memiliki:

```
code
```

sebagai identifier.

---

Contoh:

Education:

```
SD

SMP

SMA
```

---

Bukan:

```
id=1
```

---

Karena ID dapat berubah.

---

# 28. Rollback Strategy

Setiap migration harus memiliki:

```
UP

DOWN
```

---

Contoh:

Forward:

```sql
CREATE TABLE question;
```

Rollback:

```sql
DROP TABLE question;
```

---

# 29. Production Rollback Rule

Rollback hanya dilakukan jika:

* Deployment gagal.
* Data tidak berubah.
* Tidak menyebabkan kehilangan data.

---

Untuk perubahan destructive:

gunakan:

```
Forward Fix Migration
```

---

# 30. Database Backup Before Migration

Production migration wajib:

```
Backup

↓

Migration

↓

Verification
```

---

Backup:

* Snapshot.
* Point in Time Recovery.

---

# 31. Migration Verification

Setelah migration:

Check:

```
Table exists

Constraint valid

Index created

Query works

Application healthy
```

---

# 32. CI/CD Migration Pipeline

Workflow:

```
Git Push

↓

Run Migration Test

↓

Build Application

↓

Deploy Staging

↓

Run Integration Test

↓

Approve

↓

Production Migration
```

---

# 33. Migration Testing

Testing:

## Schema Test

```
Database structure correct
```

---

## Data Test

```
Existing data valid
```

---

## Performance Test

```
Query still fast
```

---

# 34. Migration Audit

Semua migration tercatat:

```
Who

When

What

Environment
```

---

Contoh:

```
Developer A

2026-07-25

Added question index

Production
```

---

# 35. Database Migration Security

Migration production:

hanya role:

```
database_admin
```

---

Application user:

tidak memiliki:

```
ALTER

DROP

CREATE
```

---

# 36. Multi Tenant Migration

Jika menggunakan:

```
organization_id
```

migration tidak boleh:

```
Hardcode tenant
```

---

Semua tenant harus ikut schema update.

---

# 37. Disaster Recovery

Jika migration gagal:

```
Stop Deployment

↓

Restore Backup

↓

Analyze Error

↓

Create Fix Migration
```

---

# 38. Migration Documentation

Setiap migration harus memiliki:

```
Purpose

Affected Tables

Risk

Rollback Plan
```

---

Contoh:

```
0008_add_exam_schedule

Purpose:
Add CBT scheduling

Risk:
Medium

Rollback:
Remove columns
```

---

# 39. Final Migration Rule

YakinLulus Migration Principle:

```
Database changes are controlled.

Every change is versioned.

Production changes are automated.

Breaking changes are gradual.

Data safety is priority.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Database Deployment Architecture
```

Digunakan untuk:

* Backend Development
* DevOps Pipeline
* Production Deployment
* Database Governance

```

---

Tahap berikutnya yang sesuai:

```

07_backup_recovery_strategy.md

```

karena setelah migration, database architecture perlu dilengkapi dengan:

- backup policy
- restore procedure
- point in time recovery
- disaster recovery plan
- RPO/RTO target
- production database protection
```
