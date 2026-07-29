Berikut **10_cbt_runtime_database_schema / 05_migration_plan.md**.

Dokumen ini mendefinisikan strategi migrasi database CBT Runtime dari development hingga production.

Fokus:

* versioned migration;
* zero downtime deployment;
* data safety;
* rollback;
* schema evolution.

---

````markdown id="cbt05migration"
# 05_migration_plan.md

# YakinLulus.id CBT Runtime Migration Plan

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Migration plan mendefinisikan bagaimana perubahan database CBT Runtime dilakukan secara aman.

CBT Runtime memiliki karakteristik:

```
High Transaction

Real-time Data

Active User Session

Academic Integrity Requirement
```

Sehingga perubahan database harus:

- predictable;
- reversible;
- low downtime;
- backward compatible.

---

# 2. Migration Principle

CBT Runtime menggunakan:

```
Version Controlled Migration

+

Forward Compatible Schema

+

Backward Compatible Deployment
```

---

# 3. Migration Tool

Recommended:

```
Go:

golang-migrate

atau

Atlas


Python:

Alembic
```

---

Untuk backend YakinLulus.id:

Recommended:

```
Go Migration Tool

+

SQL Migration Files
```

---

# 4. Migration Structure

Directory:

```
database/

└── migrations/

    ├── 001_create_cbt_schema.sql

    ├── 002_create_sessions.sql

    ├── 003_create_questions.sql

    ├── 004_create_answers.sql

    ├── 005_create_timer.sql

    ├── 006_create_sync.sql

    ├── 007_create_events.sql

    └── 008_add_indexes.sql

```

---

# 5. Migration Naming Convention

Format:

```
{number}_{description}.sql
```

Example:

```
001_create_cbt_schema.sql

002_add_session_token.sql

003_add_answer_version.sql
```

---

# 6. Initial Migration

## Version

```
001
```

Create:

```
cbt_runtime schema
```

---

SQL:

```sql
CREATE SCHEMA cbt_runtime;
```

---

Create:

```
cbt_sessions

cbt_session_questions

cbt_answers

```

---

# 7. Migration Phase

Migration dilakukan melalui:

```
Development

        |

        |

Testing

        |

        |

Staging

        |

        |

Production

```

---

# 8. Development Migration

Karakteristik:

```
Fast iteration

Reset database allowed
```

---

Command:

```
drop schema

recreate migration
```

---

Tidak digunakan pada production.

---

# 9. Staging Migration

Tujuan:

Validasi:

```
Schema compatibility

Performance

Data migration

Rollback
```

---

Test:

```
Migration execution

Seed data

Load test

Rollback
```

---

# 10. Production Migration Strategy

Production menggunakan:

```
Expand

Migrate

Contract
```

---

# 11. Expand Phase

Tambah struktur baru.

Contoh:

Tambah kolom:

```
sync_version
```

---

Migration:

```sql
ALTER TABLE cbt_answers

ADD COLUMN sync_version INTEGER;
```

---

Tidak menghapus field lama.

---

# 12. Application Compatibility

Setelah expand:

Application lama:

```
tetap berjalan
```

Application baru:

```
mulai memakai field baru
```

---

# 13. Data Migration Phase

Jika diperlukan:

Contoh:

Mengisi:

```
sync_version
```

---

Batch migration:

```sql
UPDATE cbt_answers

SET sync_version=1

WHERE sync_version IS NULL;
```

---

Untuk data besar:

gunakan:

```
chunk processing
```

---

# 14. Contract Phase

Setelah semua service menggunakan schema baru:

hapus:

```
old column

old constraint

old index
```

---

Contoh:

```sql
ALTER TABLE cbt_answers

DROP COLUMN old_field;
```

---

# 15. Zero Downtime Migration

CBT Runtime harus mendukung:

```
Active Exam

+

Schema Upgrade
```

---

Aturan:

Tidak boleh:

```
DROP TABLE

LOCK TABLE besar

ALTER blocking column
```

ketika ujian berlangsung.

---

# 16. Migration Window

Recommended:

```
Low traffic period
```

Contoh:

```
00:00 - 04:00 WIB
```

---

Tidak melakukan migration:

```
Saat CBT Nasional

Saat Tryout besar
```

---

# 17. Transaction Migration

Migration kecil:

gunakan:

```sql
BEGIN;

migration;

COMMIT;
```

---

Migration besar:

gunakan:

```
online migration
```

---

# 18. Index Migration

Index besar:

gunakan:

```sql
CREATE INDEX CONCURRENTLY
```

---

Contoh:

```sql
CREATE INDEX CONCURRENTLY idx_answer_session

ON cbt_runtime.cbt_answers(session_id);
```

---

Keuntungan:

Tidak blocking write.

---

# 19. Constraint Migration

Untuk tabel besar:

gunakan:

```
NOT VALID
```

---

Example:

```sql
ALTER TABLE cbt_answers

ADD CONSTRAINT chk_answer

CHECK(answer_value IS NOT NULL)

NOT VALID;
```

---

Validasi kemudian:

```sql
VALIDATE CONSTRAINT
```

---

# 20. Rollback Strategy

Setiap migration harus memiliki:

```
UP migration

DOWN migration
```

---

Example:

```
001_create_table.up.sql

001_create_table.down.sql
```

---

# 21. Backup Before Migration

Production wajib:

```
Full backup

+

Schema backup

+

Migration snapshot
```

---

Checklist:

```
Backup success

Migration tested

Rollback tested
```

---

# 22. Migration Failure Handling

Jika gagal:

```
STOP deployment

CHECK error

ROLLBACK

RESTORE if needed
```

---

Tidak:

```
force continue
```

---

# 23. Large Table Migration

Table besar:

```
cbt_answers

cbt_events

cbt_security_logs
```

---

Gunakan:

```
Batch migration

Pagination

Background worker
```

---

Example:

```
1000 rows/batch
```

---

# 24. Production Deployment Flow

```
Create Migration

        |

Review SQL

        |

Run Test

        |

Backup Database

        |

Apply Migration

        |

Verify Schema

        |

Deploy Application

        |

Monitor

```

---

# 25. Schema Version Tracking

Table:

```
schema_migrations
```

---

Example:

| Version | Status |
|-|-|
|001|Applied|
|002|Applied|
|003|Pending|

---

# 26. Migration Monitoring

Monitor:

```
Migration duration

Lock time

Query performance

Error rate
```

---

# 27. Emergency Rollback

Scenario:

```
Migration causes CBT failure
```

Action:

```
Stop deployment

Rollback application

Rollback migration

Restore backup
```

---

# 28. Migration Rules

Forbidden:

```
DROP COLUMN langsung

DROP TABLE langsung

Mass update tanpa batch

Migration tanpa backup
```

---

# 29. Future Scaling

Jika data besar:

Tambahkan:

```
Partition migration

Read replica migration

Archive migration
```

---

# 30. Final Migration Architecture

```

Developer

   |

Migration File

   |

CI Pipeline

   |

Staging DB

   |

Production DB


```

---

# 31. Conclusion

Migration strategy CBT Runtime memastikan:

- perubahan database aman;
- ujian aktif tidak terganggu;
- rollback tersedia;
- schema dapat berkembang;
- platform siap scale.

CBT Runtime database dapat berevolusi
tanpa mengorbankan reliability ujian.
````

