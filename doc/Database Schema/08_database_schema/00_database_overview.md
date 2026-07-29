Kita masuk ke tahap **08_database_schema**.
Pada tahap ini kita menurunkan seluruh hasil:

* Domain Modeling
* Entity Catalog
* ERD
* Logical Data Model (LDM)
* Database Architecture
* Question Bank Specification
* Backend Architecture

menjadi **Physical Database Design** untuk PostgreSQL.

Dokumen pertama:

# 00_database_overview.md

---

````markdown id="d8k91p"
# 00_database_overview.md

# YakinLulus.id Database Schema Overview

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan rancangan database
untuk modul Question Bank YakinLulus.id.

Database dirancang untuk mendukung.

- Question Repository
- CBT Engine Integration
- AI Question Generation
- Search
- Analytics
- Versioning
- Audit
- File Management

---

# 2. Database Design Goals

Database harus mampu.

- Menyimpan jutaan soal
- Mendukung multiple curriculum
- Mendukung versioning
- Menjaga historical integrity
- Mendukung AI embedding
- Mendukung high performance query
- Mendukung scalability

---

# 3. Database Technology

Primary Database.

```
PostgreSQL 16+
```

Extension.

```
uuid-ossp

pgcrypto

pgvector

pg_trgm

unaccent

btree_gin

btree_gist
```

---

# 4. Database Architecture Position

Question Bank menggunakan
database sebagai bagian dari
modular monolith architecture.

```
                    Application Layer

                           |

                    Question Service

                           |

                    Repository Layer

                           |

                    PostgreSQL

        +------------------+----------------+

        |                  |                |

    Question Data     Metadata Data    Audit Data

        |

    pgvector

```

---

# 5. Database Responsibility

Database bertanggung jawab terhadap.

## Persistence

Menyimpan seluruh
Question Aggregate.

---

## Integrity

Menjaga.

- Foreign Key
- Constraint
- Unique Rule
- Transaction

---

## Query Performance

Mendukung.

- Search
- Filtering
- Reporting
- Analytics

---

## Historical Data

Menyimpan.

- Version History
- Audit Trail
- Review History

---

# 6. Database Boundary

Question Bank Database
memiliki boundary.

```
Question Bank Context

├── Question
├── Question Version
├── Question Option
├── Question Metadata
├── Review
├── Taxonomy
├── Attachment Reference
├── AI Generation
├── Embedding
└── Audit
```

---

# 7. Database Not Responsible For

Database tidak menangani.

- Business Workflow Logic
- AI Processing
- File Processing
- Notification Delivery
- Recommendation Algorithm

Hal tersebut berada pada
application/service layer.

---

# 8. Database Naming Convention

Menggunakan.

snake_case

Contoh.

```
question_bank

question_versions

question_reviews
```

---

# 9. Primary Key Strategy

Menggunakan UUID.

Format.

```
uuid
```

Alasan.

- Distributed ready
- Aman untuk API exposure
- Tidak mudah ditebak
- Mendukung future microservice

---

# 10. Timestamp Convention

Semua tabel utama memiliki.

```
created_at

updated_at
```

Format.

```
TIMESTAMP WITH TIME ZONE
```

---

# 11. Soft Delete Strategy

Entity tertentu menggunakan.

```
deleted_at
```

Bukan hard delete.

Digunakan pada.

- Question
- Attachment
- Metadata

---

# 12. Schema Organization

Database menggunakan PostgreSQL schema.

```
public

question_bank

audit

analytics

ai
```

---

# 13. Question Bank Schema

Schema utama.

```
question_bank
```

Berisi.

```
questions

question_versions

question_options

question_reviews

question_taxonomies

question_statistics
```

---

# 14. AI Schema

```
ai
```

Berisi.

```
question_embeddings

ai_generation_jobs

ai_prompts

ai_validation_results
```

---

# 15. Audit Schema

```
audit
```

Berisi.

```
audit_logs

audit_changes
```

---

# 16. File Reference

File tidak disimpan langsung
di database.

Database hanya menyimpan metadata.

Contoh.

```
question_attachment

        |

        object_storage_key

        |

        S3 Compatible Storage
```

---

# 17. Data Classification

## Critical Data

- Question
- Answer
- Explanation
- Version

---

## Operational Data

- Review
- Import Job
- Export Job

---

## Supporting Data

- Tags
- Metadata
- Statistics

---

# 18. Transaction Boundary

Transaction utama.

```
Create Question

Question

+

Version

+

Metadata

+

Audit
```

Semua harus berhasil
atau rollback.

---

# 19. Consistency Model

Core Question Data.

Strong Consistency


Analytics.

Eventually Consistent


Search Index.

Eventually Consistent


Embedding.

Eventually Consistent

---

# 20. Scaling Strategy

Initial.

```
Single PostgreSQL Instance
```

Future.

```
Read Replica

↓

Partitioning

↓

Distributed PostgreSQL
```

---

# 21. Partition Strategy

Future partition candidate.

```
question_versions

audit_logs

analytics_events
```

berdasarkan.

- created_at
- tenant_id
- curriculum

---

# 22. Index Strategy Overview

Index digunakan untuk.

- Primary lookup
- Filtering
- Search
- Sorting
- Relationship

---

# 23. Search Support

Database mendukung.

## Keyword

PostgreSQL Full Text Search


## Similarity

pg_trgm


## Semantic

pgvector

---

# 24. Migration Strategy

Menggunakan.

Versioned Migration.

Contoh.

```
001_create_question_tables.sql

002_add_question_version.sql

003_add_embedding.sql
```

---

# 25. Backup Strategy

Database termasuk
critical data.

Mendukung.

- Daily Backup
- Point In Time Recovery
- Replication

---

# 26. Security

Database security.

- Role Based Access
- Least Privilege
- Encryption
- Audit Access

---

# 27. Development Environment

Local.

```
Docker PostgreSQL

+

Migration

+

Seed Data
```

---

# 28. Production Environment

Recommended.

```
PostgreSQL Cluster

Connection Pool

Backup System

Monitoring

Alerting
```

---

# 29. Performance Target

Target awal.

```
Question Lookup

< 50 ms


Search

< 300 ms


Write Transaction

< 200 ms
```

---

# 30. Future Capability

Database harus siap mendukung.

- Multi Tenant
- School Management
- Marketplace Question
- AI Tutor
- Knowledge Graph
- Adaptive Learning
````

---

## Catatan Arsitektur

Untuk YakinLulus.id, saya menyarankan **jangan membuat database terpisah per modul pada fase awal**.

Gunakan pendekatan:

```
                    PostgreSQL

                         |

        +----------------+----------------+

        |                |                |

 question_bank       cbt_runtime       analytics

        |

        ai

        |

       audit
```

Alasannya:

1. **MVP lebih cepat dikembangkan**
2. Transaction antar domain masih mudah
3. Query lintas modul lebih sederhana
4. Migration lebih mudah
5. Tetap siap dipisahkan menjadi service ketika traffic sudah besar

---

Dokumen berikutnya:

```
08_database_schema/
│
├── 00_database_overview.md
➡ ├── 01_schema_design.md
├── 02_table_specification.md
├── 03_index_strategy.md
...
```

Selanjutnya kita lanjut ke **01_schema_design.md**.
