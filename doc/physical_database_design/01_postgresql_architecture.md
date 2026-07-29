```markdown id="p9k4x2"
# 01_postgresql_architecture.md

# PostgreSQL Database Architecture

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan rancangan arsitektur database PostgreSQL untuk platform YakinLulus.

Tujuan:

- Menentukan strategi database utama.
- Mendukung modular architecture.
- Mendukung pertumbuhan data besar.
- Menjaga isolasi antar domain.
- Mendukung transaksi akademik.
- Mendukung analytics dan AI pipeline.
- Menyiapkan migrasi menuju distributed architecture.

---

# 2. Database Architecture Principle

YakinLulus menggunakan pendekatan:

```

Modular Monolith Database Architecture

*

Domain Oriented Schema Design

```

Pada fase awal:

```

1 PostgreSQL Instance

```
    |
```

Multiple Domain Schema

```

---

# 3. Evolution Strategy

Database berkembang bertahap:

## Phase 1

```

Single PostgreSQL Instance

Single Application

Multiple Schema

```

Target:

```

0 - 100.000 user

```

---

## Phase 2

```

PostgreSQL Primary

*

Read Replica

*

Analytics Database

```

Target:

```

100.000 - 1.000.000 user

```

---

## Phase 3

```

Domain Database Separation

*

Microservice

*

Event Driven

```

Target:

```

1.000.000+ user

```

---

# 4. High Level Architecture

```

```
                Application Layer


                      |

                      |


              PostgreSQL Cluster


                      |
```

---

academic_schema

question_schema

learning_resource_schema

cbt_schema

identity_schema

learning_schema

organization_schema

media_schema

ai_schema

analytics_schema

system_schema

---

```

---

# 5. Database Ownership Model

Setiap domain memiliki schema sendiri.

Format:

```

{domain}_schema

```

---

Contoh:

```

academic_schema

question_schema

cbt_schema

```

---

Tidak:

```

all_tables_in_public_schema

```

---

# 6. PostgreSQL Schema Mapping

| Domain | PostgreSQL Schema |
|-|-|
| Master Academic | academic |
| Question Bank | question |
| Learning Resource | learning_resource |
| CBT Engine | cbt |
| User Management | identity |
| Learning | learning |
| Organization | organization |
| Media | media |
| AI | ai |
| Analytics | analytics |
| System | system |

---

# 7. Database Layer Separation

YakinLulus memiliki tiga kategori database.

---

# 7.1 Operational Database

Purpose:

Transaksi aplikasi.

Berisi:

```

User

Question

Exam

Learning Progress

Organization

```

Karakteristik:

- ACID transaction.
- Strong consistency.
- Normalized.

---

# 7.2 Analytics Database

Purpose:

Analisa data.

Berisi:

```

Fact Table

Dimension Table

Aggregated Metric

```

Karakteristik:

- Read optimized.
- Denormalized.
- Heavy query.

---

# 7.3 AI Data Storage

Purpose:

AI processing.

Berisi:

```

Embedding

Vector Data

AI Result

Training Dataset

```

---

# 8. PostgreSQL Version

Minimum:

```

PostgreSQL 16+

````

Alasan:

- Improved performance.
- Better indexing.
- JSONB improvement.
- Partitioning improvement.
- Extension support.

---

# 9. Extension Strategy

Extension yang digunakan:

---

## UUID

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
````

Digunakan untuk:

```
UUID Generation
```

---

## Full Text Search

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Digunakan untuk:

```
Question Search

Material Search
```

---

## Vector Search

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Digunakan oleh:

```
AI Embedding

Semantic Search
```

---

## Monitoring

Optional:

```
pg_stat_statements
```

Untuk:

```
Query Performance Monitoring
```

---

# 10. Primary Key Strategy

Semua tabel menggunakan:

```
UUID
```

Format:

```sql
id UUID PRIMARY KEY
```

---

Contoh:

```sql
CREATE TABLE question.question
(
 id UUID PRIMARY KEY
);
```

---

# 11. UUID Generation Strategy

Menggunakan:

```
UUID v7
```

atau:

```
Time Ordered UUID
```

Alasan:

* Index lebih efisien.
* Sorting berdasarkan waktu.
* Cocok untuk distributed system.

---

# 12. Naming Convention

## Schema

Snake case.

Contoh:

```
learning_resource
```

---

## Table

Singular noun.

Benar:

```
question.question
```

Tidak:

```
questions.questions
```

---

## Column

Snake case.

Contoh:

```
created_at

updated_at

deleted_at
```

---

# 13. Common Audit Column

Semua entity utama memiliki:

```sql
created_at

updated_at

created_by

updated_by

deleted_at
```

---

Contoh:

```sql
CREATE TABLE question.question
(
 id UUID PRIMARY KEY,

 created_at TIMESTAMP,

 updated_at TIMESTAMP,

 deleted_at TIMESTAMP
);
```

---

# 14. Soft Delete Strategy

Tidak menggunakan:

```sql
DELETE FROM table
```

untuk data bisnis.

---

Menggunakan:

```sql
deleted_at
```

---

Contoh:

Active:

```
deleted_at IS NULL
```

Deleted:

```
deleted_at != NULL
```

---

# 15. Tenant Architecture

YakinLulus mendukung:

```
Multi Organization

Multi School

Multi Tenant
```

---

Semua domain bisnis memiliki:

```sql
organization_id UUID
```

---

Contoh:

```sql
question.question

id

organization_id

content
```

---

# 16. Transaction Boundary

Transaction hanya berada dalam satu domain.

Contoh:

CBT:

```
Create Exam

+

Create Exam Configuration

+

Create Exam Schedule
```

satu transaction.

---

Tidak:

```
CBT Transaction

+

Update Question Database
```

---

# 17. Cross Schema Reference

Aturan:

Tidak menggunakan:

```sql
Foreign Key
```

antar schema domain.

---

Contoh:

Tidak:

```sql
FOREIGN KEY(question_id)

REFERENCES question.question(id)
```

---

Menggunakan:

```sql
question_id UUID
```

---

Validasi melalui:

```
Service Layer

API

Event
```

---

# 18. Index Strategy Overview

Setiap tabel utama memiliki:

## Primary Index

```
id
```

---

## Foreign Reference Index

Contoh:

```
student_id

question_id

organization_id
```

---

## Time Index

Untuk:

```
created_at

occurred_at
```

---

# 19. JSONB Usage Policy

JSONB digunakan untuk data fleksibel.

Contoh:

```
Metadata

Configuration

AI Parameter

Event Payload
```

---

Tidak digunakan untuk:

```
Core Business Entity
```

---

Salah:

```
question_content JSONB
```

untuk seluruh soal.

---

Benar:

```
question

question_option

question_metadata JSONB
```

---

# 20. Large Data Strategy

Data besar:

## Media

Disimpan:

```
Object Storage
```

Database hanya:

```
metadata
```

---

## Analytics Event

Menggunakan:

```
Partition Table
```

---

## AI Embedding

Menggunakan:

```
Vector Index
```

---

# 21. Backup Strategy

## Daily Backup

```
Full Backup
```

---

## Continuous Backup

Menggunakan:

```
WAL Archive
```

---

## Recovery Target

Target:

```
RPO < 15 menit

RTO < 1 jam
```

---

# 22. Security Architecture

Database access menggunakan:

```
Application User

Read User

Migration User

Analytics User
```

---

Tidak:

```
Application menggunakan postgres superuser
```

---

# 23. Environment Separation

Minimal:

```
Development

Staging

Production
```

---

Masing-masing:

```
Database terpisah

Credential terpisah
```

---

# 24. Migration Strategy

Menggunakan:

```
Version Controlled Migration
```

Contoh:

```
001_create_user_table.sql

002_create_question_table.sql

003_add_index_question.sql
```

---

Tidak:

```
Manual edit production database
```

---

# 25. ORM Strategy

ORM diperbolehkan:

```
Django ORM

SQLAlchemy

GORM
```

---

Tetapi:

Query kompleks menggunakan:

```
Raw SQL
```

---

# 26. Read / Write Separation

Future:

```
Application

    |

    | Write

    ▼

Primary PostgreSQL


    |

    | Replication


    ▼


Read Replica
```

---

Digunakan untuk:

* Dashboard.
* Reporting.
* Search.

---

# 27. Monitoring

Monitoring:

```
Database CPU

Memory

Connection

Slow Query

Lock

Transaction
```

---

Tools:

```
Prometheus

Grafana

pg_stat_statements
```

---

# 28. Performance Target

Target awal:

| Metric          | Target |
| --------------- | ------ |
| API Query       | <200ms |
| Simple Lookup   | <50ms  |
| Dashboard Query | <2s    |
| Search          | <500ms |

---

# 29. Future Scaling

Mendukung:

```
Vertical Scaling

Read Replica

Partitioning

Sharding

Database Separation
```

---

# 30. Final Architecture Rule

YakinLulus Database Principle:

```
One Domain

=

One Schema Ownership


One Entity

=

One Data Owner


One Database

=

Multiple Isolated Domains


Future Ready

=

Event Driven Migration
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Physical Database Architecture Foundation
```

Digunakan untuk:

* Schema Design
* Table Design
* Backend Implementation
* DevOps Deployment
* Database Scaling

