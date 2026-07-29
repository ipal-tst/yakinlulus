Berikut **08_database_schema / 01_schema_design.md**.

Dokumen ini mendefinisikan **logical database schema organization** sebelum masuk ke detail tabel fisik. Fokusnya adalah bagaimana PostgreSQL schema dipisahkan berdasarkan **bounded context**, ownership data, dependency, dan future scalability.

---

````markdown
# 01_schema_design.md

# YakinLulus.id Database Schema Design

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan desain PostgreSQL Schema
untuk YakinLulus.id.

Schema design dibuat berdasarkan.

- Domain Driven Design
- Bounded Context
- Database Architecture
- Backend Architecture
- Future Scalability

---

# 2. Schema Design Principle

Database schema mengikuti prinsip.

## Domain Isolation

Setiap domain memiliki ownership data yang jelas.

---

## Separation of Concern

Data operasional, audit, AI,
dan analytics dipisahkan.

---

## Future Service Extraction

Schema dapat dipisahkan menjadi
database service apabila diperlukan.

---

# 3. High Level Schema Architecture

```
PostgreSQL Database

|

+----------------------+
| public               |
| Shared System Data   |
+----------------------+

|

+----------------------+
| question_bank        |
| Question Domain      |
+----------------------+

|

+----------------------+
| ai                   |
| AI Processing        |
+----------------------+

|

+----------------------+
| audit                |
| Audit Trail          |
+----------------------+

|

+----------------------+
| analytics            |
| Reporting Data       |
+----------------------+

```

---

# 4. Schema Responsibility

## public Schema

Purpose:

Shared infrastructure data.

Berisi.

- User reference
- Role reference
- System configuration

Owner:

Core Platform

---

## question_bank Schema

Purpose:

Core Question Management.

Berisi.

- Question
- Version
- Option
- Review
- Taxonomy
- Import
- Export

Owner:

Question Bank Domain

---

## ai Schema

Purpose:

AI related processing.

Berisi.

- Embedding
- Generation Job
- Prompt
- Validation Result

Owner:

AI Service

---

## audit Schema

Purpose:

Immutable audit records.

Berisi.

- Audit Log
- Change History

Owner:

Security / Compliance

---

## analytics Schema

Purpose:

Read optimized data.

Berisi.

- Question Usage
- Statistics
- Aggregation

Owner:

Analytics Service

---

# 5. Schema Relationship

```
                 public

                   |

        +----------+-----------+

        |                      |

question_bank              audit


        |

        +----------+

                   |

                  ai


        |

                  analytics

```

---

# 6. Cross Schema Dependency Rule

Dependency diperbolehkan.

```
question_bank

        ↓

audit


question_bank

        ↓

ai


question_bank

        ↓

analytics
```

---

Tidak diperbolehkan.

```
audit

        ↓

question_bank


analytics

        ↓

question_bank
```

---

# 7. Question Bank Schema Detail

```
question_bank

├── questions

├── question_versions

├── question_contents

├── question_options

├── question_answers

├── question_explanations

├── question_reviews

├── question_review_comments

├── question_taxonomies

├── question_tags

├── question_attachments

├── question_import_jobs

├── question_export_jobs

└── question_statistics

```

---

# 8. AI Schema Detail

```
ai

├── embeddings

├── generation_jobs

├── generation_results

├── prompt_templates

├── validation_results

└── ai_usage_logs

```

---

# 9. Audit Schema Detail

```
audit

├── audit_logs

├── audit_changes

└── audit_access_logs

```

---

# 10. Analytics Schema Detail

```
analytics

├── question_usage_events

├── question_metrics

├── difficulty_metrics

└── quality_scores

```

---

# 11. Shared Reference Data

Data berikut digunakan oleh banyak domain.

Contoh.

```
subjects

grades

curriculums

users

organizations

```

Lokasi.

```
public
```

atau future:

```
identity schema

education schema
```

---

# 12. Naming Convention

Schema.

snake_case


Table.

plural noun


Column.

snake_case


Example.

```
question_versions

created_at

difficulty_level

```

---

# 13. Table Ownership

Setiap tabel memiliki owner.

Contoh.

```
question_bank.questions

Owner:

Question Service

```

---

# 14. Primary Key Standard

Semua tabel utama.

```
id UUID PRIMARY KEY
```

Contoh.

```
question_id

version_id

review_id

```

---

# 15. Foreign Key Convention

Format.

```
<table>_id
```

Contoh.

```
question_id

subject_id

reviewer_id

```

---

# 16. Timestamp Standard

Semua tabel transactional.

Wajib.

```
created_at

updated_at

```

Format.

```
TIMESTAMP WITH TIME ZONE
```

---

# 17. Soft Delete Standard

Entity yang dapat dihapus.

Memiliki.

```
deleted_at
```

Contoh.

```
questions

attachments

tags

```

---

# 18. JSONB Usage Policy

JSONB digunakan untuk.

- Flexible metadata
- AI response
- External payload

Tidak digunakan untuk.

- Core relational data
- Frequently filtered fields

---

# 19. Example JSONB

Question metadata.

```json
{
 "bloom_level":"C4",
 "competency":"analysis",
 "source":"school_exam"
}
```

---

# 20. Enum Strategy

Tidak menggunakan PostgreSQL ENUM
untuk business status yang sering berubah.

Gunakan.

Reference Table

atau

VARCHAR Constraint

---

# 21. Status Storage

Contoh.

```
question_status

VARCHAR(50)

```

Value.

```
DRAFT

UNDER_REVIEW

PUBLISHED

ARCHIVED

```

---

# 22. Audit Separation

Audit tidak berada
di schema question_bank.

Alasan.

- Security boundary
- Immutable storage
- Different retention

---

# 23. Analytics Separation

Analytics tidak query langsung
ke operational table
untuk reporting berat.

Gunakan.

Event

↓

Aggregation

↓

Analytics Schema

---

# 24. Migration Structure

Folder.

```
database/

migrations/

├── public/

├── question_bank/

├── ai/

├── audit/

└── analytics/

```

---

# 25. Deployment Order

Migration order.

```
1. public

2. question_bank

3. audit

4. ai

5. analytics

```

---

# 26. Future Multi Tenant

Schema siap dikembangkan.

Tambahkan.

```
tenant_id
organization_id

```

pada domain utama.

---

# 27. Future Microservice Extraction

Potensi pemisahan.

```
Question Service

AI Service

Analytics Service

Audit Service

```

---

# 28. Security Boundary

Application role.

Contoh.

```
app_question_service

app_ai_service

app_analytics_service

```

Database role berbeda.

---

# 29. Schema Migration Rule

Perubahan schema harus.

- Migration file
- Review
- Backup
- Rollback plan

---

# 30. Final Schema Decision

Initial Production Schema:

```
public

question_bank

ai

audit

analytics

```

Desain ini dipilih karena.

- sederhana untuk MVP;
- tetap modular;
- mudah scaling;
- siap menuju service-oriented architecture.
````

---

### Catatan desain untuk YakinLulus.id

Pada tahap ini kita sengaja **belum membuat tabel detail**. Urutannya:

```
Schema Design
        ↓
Table Specification
        ↓
Column Definition
        ↓
Index Strategy
        ↓
Constraint Strategy
        ↓
Migration
        ↓
DDL
```

Dokumen berikutnya:

```
08_database_schema/
├── 00_database_overview.md
├── 01_schema_design.md
➡ ├── 02_table_specification.md
├── 03_index_strategy.md
├── 04_constraint_strategy.md
...
```

Selanjutnya kita buat **02_table_specification.md** yang akan mendefinisikan seluruh tabel Question Bank secara detail (purpose, column, relation, lifecycle, dan ownership).
