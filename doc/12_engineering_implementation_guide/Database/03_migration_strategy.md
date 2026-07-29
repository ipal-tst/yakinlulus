```markdown id="p5r8nz"
# 12_engineering_implementation_guide/database/03_migration_strategy.md

# Database Migration Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi migration database YakinLulus.id.

Migration strategy memastikan perubahan database:

- aman;
- terkontrol;
- dapat direview;
- dapat diuji;
- dapat di-deploy ke production tanpa merusak sistem berjalan.


Database migration menjadi mekanisme resmi untuk perubahan:

```

Table

Column

Index

Constraint

Relationship

Data Transformation

```id="m2k8xa"


---

# 2. Migration Principle


YakinLulus menggunakan prinsip:


```

Migration First Development

*

Version Controlled Database

*

Backward Compatible Change

*

Automated Deployment

```id="8s4q1p"


---

# 3. Migration Architecture


Diagram:


```

Developer

|

Create Migration File

|

Git Repository

|

CI Validation

|

Staging Database

|

Production Database

```id="j7k4nz"


---

# 4. Migration Responsibility


Migration bertanggung jawab terhadap:


## Schema Change


Contoh:


```

CREATE TABLE

ALTER TABLE

CREATE INDEX

ADD CONSTRAINT

```id="x8m3qa"


---

## Data Migration


Contoh:


```

Convert Old Data

Populate New Column

Normalize Data

```id="4n8v1x"


---

## Database Optimization


Contoh:


```

Create Index

Analyze Table

Partition Setup

```id="r5q7mz"


---

# 5. Migration Tool


Backend Go menggunakan salah satu:


Recommended:


```

golang-migrate

```id="z8q3pw"


Alternatif:


```

Atlas

goose

dbmate

```id="6k2n9v"


---

# 6. Migration Folder Structure


Standard:


```

database/

├── migrations/

│

├── 000001_init_schema.up.sql

├── 000001_init_schema.down.sql

│

├── 000002_create_users.up.sql

├── 000002_create_users.down.sql

│

└── 000003_create_question_bank.up.sql

```id="4d7x1m"


---

# 7. Migration Naming Convention


Format:


```

<number>_<description>

```id="q5v8ny"


Contoh:


```

000001_initial_schema

000002_create_users_table

000003_add_question_metadata

```id="h6m3pq"


Aturan:


- nama harus jelas;
- tidak menggunakan nama developer;
- tidak menggunakan tanggal sebagai identifier utama.


---

# 8. Migration File Structure


Setiap migration memiliki:


```

UP Migration

DOWN Migration

````id="v4r8nx"


---

## UP Migration


Melakukan perubahan:


Contoh:


```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE
);
````

---

## DOWN Migration

Rollback:

```sql
DROP TABLE users;
```

---

# 9. Migration Lifecycle

Flow:

````
Create Migration


        |

Local Testing


        |

Code Review


        |

CI Validation


        |

Staging Deploy


        |

Production Deploy

``` id="p7k3mw"


---

# 10. Initial Database Migration


Migration pertama:


````

000001_initial_schema

```id="m8q2vx"


Berisi:


```

Create Schema

Create Extensions

Create Base Tables

Create Enum

Create Common Functions

````id="x4k7pz"


---

# 11. PostgreSQL Extension Management


Extension yang digunakan:


## UUID


```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
````

---

## Full Text Search

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Vector Database Future

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

untuk AI/RAG.

---

# 12. Migration Ordering

Migration harus linear:

````
000001

 |

000002

 |

000003

 |

000004

``` id="q7m2vr"


Tidak diperbolehkan:


````

000004 depends on 000006

```id="z9x5kc"


---

# 13. Database Migration State


Database menyimpan:


```

schema_migrations

````id="n3w8mp"


Structure:


```sql
CREATE TABLE schema_migrations (

version BIGINT PRIMARY KEY,

dirty BOOLEAN,

applied_at TIMESTAMP

);

````

---

# 14. Development Migration Workflow

Developer:

````
Modify Entity


        |

Create Migration


        |

Run Migration


        |

Generate Test Data


        |

Run Application


``` id="h4p8qm"


---

# 15. Backend Integration


Saat aplikasi start:


````

Application Boot

```
    |
```

Check Migration Version

```
    |
```

Apply Pending Migration

```
    |
```

Start Server

```id="x9m5kr"


Untuk production:


lebih disarankan:

```

CI/CD Pipeline

```
    |
```

Migration Step

```
    |
```

Application Deployment

````id="f7v3qn"


---

# 16. Backward Compatible Migration


Aturan:


Perubahan database harus kompatibel dengan aplikasi lama.


Contoh:


Tambahkan kolom:


```sql
ALTER TABLE questions

ADD COLUMN explanation_video TEXT NULL;

````

Aman karena:

* kolom optional;
* aplikasi lama tetap berjalan.

---

# 17. Breaking Migration Strategy

Tidak langsung:

````
Remove Column

Rename Column

Change Data Type

``` id="s5m8vx"


Gunakan:


````

Expand

```
    |
```

Migrate

```
    |
```

Switch

```
    |
```

Cleanup

````id="v6q2zn"


---

# 18. Large Data Migration


Untuk data besar:


Jangan:


```sql
UPDATE million_rows;

````

Gunakan batch:

````
1000 rows

commit

1000 rows

commit

``` id="p2x7mq"


---

# 19. Transaction Migration


Migration kecil:


```sql
BEGIN;

ALTER TABLE questions ADD COLUMN status;

COMMIT;

````

---

Migration besar:

gunakan:

````
Chunk Processing

Progress Tracking

Rollback Strategy

``` id="d5m8kx"


---

# 20. Migration Testing


## Fresh Install Test


````

Empty Database

```
    |
```

Run All Migration

```
    |
```

Application Running

```id="j8n4qx"


---

## Upgrade Test


```

Old Database

```
    |
```

Apply New Migration

```
    |
```

Verify Data

```id="z3p7vm"


---

## Rollback Test


```

Migration Failed

```
    |
```

Execute Down Migration

```
    |
```

Restore State

```id="k5q8nx"


---

# 21. Production Migration Workflow


```

Backup Database

```
    |
```

Run Migration Dry Run

```
    |
```

Deploy Migration

```
    |
```

Verify Schema

```
    |
```

Deploy Application

```
    |
```

Monitor

```id="y8m2qp"


---

# 22. Migration Failure Handling


Jika gagal:


```

Migration Error

```
    |
```

Stop Deployment

```
    |
```

Analyze Error

```
    |
```

Rollback

```
    |
```

Fix Migration

```id="w4k7nz"


---

# 23. Zero Downtime Migration


Digunakan untuk:


```

Large Production Database

High Traffic

Critical System

```id="m9p3qx"


Pattern:


```

Phase 1

Add New Structure

```
    |
```

Phase 2

Dual Write

```
    |
```

Phase 3

Switch Read

```
    |
```

Phase 4

Remove Old Structure

```id="c7v2mx"


---

# 24. Migration Security


Rules:


```

Production Migration

Only CI/CD User

No Manual Access

Audit Required

```id="b5n8qw"


---

# 25. Migration Documentation


Setiap migration wajib memiliki:


```

Purpose

Affected Table

Data Impact

Rollback Plan

Testing Result

```id="r2x6mv"


---

# 26. Future Scalability


## Phase 1


```

Single PostgreSQL

Sequential Migration

Manual Approval

```id="x7m3kp"


---

## Phase 2


```

Automated Migration Pipeline

Database Validation

Rollback Automation

```id="g4q8nz"


---

## Phase 3


```

Distributed Database Migration

Multiple Service Database

Schema Registry

```id="n8v5mx"


---

# Summary


Migration strategy YakinLulus.id:


```

Version Controlled Migration

*

Automated Deployment

*

Backward Compatible Change

*

Rollback Support

*

Production Safety

```


Dengan strategi ini, perubahan database dapat berjalan aman dari fase MVP sampai platform EdTech skala besar.
```
