Berikut **08_database_schema / 08_erdiagram.md**.

Dokumen ini menjadi penutup tahap **database schema specification**. ERD ini menghubungkan seluruh tabel berdasarkan **physical data model** yang telah dibuat pada dokumen sebelumnya.

---

````markdown id="e8r3d1"
# 08_erdiagram.md

# YakinLulus.id Question Bank Entity Relationship Diagram

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan Entity Relationship Diagram
(ERD) untuk database Question Bank.

ERD dibuat berdasarkan.

- Domain Model
- Entity Catalog
- Logical Data Model
- Physical Database Schema

---

# 2. High Level ERD

```
                           public

                +----------------------+
                | subjects             |
                | grades               |
                | curriculums          |
                +----------+-----------+
                           |
                           |
                           |
+------------------------------------------------+
|                                                |
|              question_bank                     |
|                                                |
|                                                |
|   +-------------+                              |
|   | questions   |                              |
|   +------+------+                              |
|          |                                     |
|          | 1:N                                 |
|          |                                     |
|   +------+---------------+                     |
|   | question_versions    |                     |
|   +------+---------------+                     |
|          |                                     |
|          +-------------+--------------+        |
|                        |              |        |
|                        |              |        |
|              +---------+----+   +-----+------+ |
|              | options      |   | contents   | |
|              +--------------+   +------------+ |
|                                                |
+------------------------------------------------+


                    |

                    |

              ai schema

        +-------------------+

        | embeddings        |

        | generation_jobs   |

        +-------------------+



                    |

                    |

              audit schema

        +-------------------+

        | audit_logs        |

        | audit_changes     |

        +-------------------+

```

---

# 3. Core Question ERD

```
questions

    |

    | 1:N

    |

question_versions

    |

    +----------------+

    |                |

    |                |

options          contents


    |

explanations


```

---

# 4. Question Aggregate Relationship

Question adalah aggregate root.

```
Question

|

+-- Version

      |

      +-- Option

      |

      +-- Content

      |

      +-- Explanation

      |

      +-- Attachment

```

---

# 5. Question Entity

Table:

```
question_bank.questions
```

Relationship.

---

## Has Many

```
questions

1:N

question_versions
```

---

## Has Many

```
questions

1:N

question_reviews
```

---

## Has Many

```
questions

1:N

question_taxonomies
```

---

## Has Many

```
questions

1:N

question_tags
```

---

# 6. Question Version Relationship

Table:

```
question_bank.question_versions
```

---

Relationship.

```
question

1:N

version
```

---

Children.

```
question_options

question_contents

question_explanations

question_attachments
```

---

# 7. Taxonomy Relationship

```
questions

        |

        |

question_taxonomies

        |

        +------------+

        |            |

    subject       grade

        |

    curriculum

        |

    chapter

        |

    topic

```

---

# 8. Review Workflow ERD

```
questions

    |

    |

question_reviews

    |

    |

question_review_comments

```

---

Flow:

```
Question

↓

Review Assignment

↓

Reviewer Comment

↓

Approval Decision
```

---

# 9. Tag Relationship

Many-to-many.

```
questions

      |

      |

question_tags

      |

      |

tags

```

---

# 10. File Attachment Relationship

```
question_versions

        |

        |

question_attachments

        |

        |

Object Storage

```

Database hanya menyimpan reference.

---

# 11. Import Relationship

```
question_import_jobs

        |

        |

question_import_errors

```

---

Flow:

```
Upload Excel

↓

Create Job

↓

Validate Rows

↓

Create Question

↓

Store Error
```

---

# 12. AI Relationship

```
questions

      |

      |

question_embeddings


     


ai_generation_jobs

      |

      |

ai_generation_results

```

---

Flow:

```
Generate Request

↓

AI Job

↓

AI Result

↓

Validation

↓

Create Question Version
```

---

# 13. Audit Relationship

```
Any Entity

      |

      |

audit_logs

      |

      |

audit_changes

```

---

Audit bersifat append-only.

---

# 14. Analytics Relationship

```
questions

      |

      |

question_usage_events

      |

      |

question_metrics

```

---

Analytics tidak mengubah
operational data.

---

# 15. Complete Logical ERD

```

                 subjects
                     |
                     |
                 grades
                     |
                     |
               curriculums
                     |
                     |
                     v


              +--------------+
              |  questions   |
              +------+-------+
                     |
                     |
                     |
              +------+-------+
              | versions    |
              +------+-------+
                     |
        +------------+-------------+
        |            |             |
        v            v             v

    options      contents    explanations


                     |

                     |

               attachments



questions

    |

    +-------------+

    |             |

    v             v


reviews        taxonomy


    |             |

    v             |

comments        tags



questions

    |

    |

 embeddings


questions

    |

    |

analytics


questions

    |

    |

audit


```

---

# 16. Cardinality Summary

| Relationship | Cardinality |
|-|-|
| Question → Version | 1:N |
| Version → Option | 1:N |
| Version → Content | 1:N |
| Version → Attachment | 1:N |
| Question → Review | 1:N |
| Question → Taxonomy | 1:N |
| Question → Tag | N:N |
| Question → Embedding | 1:N |
| Question → Usage Event | 1:N |

---

# 17. Delete Dependency

Delete hierarchy.

```
Question

 |

 +-- Version

       |

       +-- Option

       +-- Content

       +-- Explanation

       +-- Attachment


Question

 |

 +-- Review


Question

 |

 +-- Taxonomy

```

---

# 18. Immutable Relationship

Historical data.

```
Exam Result

        |

        |

Question Version

        |

        |

Question

```

---

# 19. Future Extension Point

ERD siap ditambahkan.

```
Adaptive Learning

        |

Knowledge Graph


Marketplace

        |

Question Package


Multi Tenant

        |

Organization

```

---

# 20. Database Schema Final

Final Question Bank Database:

```
public

├── users
├── roles
├── subjects
├── grades
└── curriculums


question_bank

├── questions
├── question_versions
├── question_contents
├── question_options
├── question_explanations
├── question_reviews
├── question_taxonomies
├── question_tags
├── tags
├── attachments
├── import_jobs
└── export_jobs


ai

├── embeddings
├── generation_jobs
└── generation_results


audit

├── audit_logs
└── audit_changes


analytics

├── usage_events
└── metrics

```

---

# 21. Final Decision

Database Question Bank menggunakan pendekatan:

```
Aggregate Root

        +

Normalized Relational Model

        +

Immutable Versioning

        +

Event Ready Architecture

        +

AI Ready Storage
```

Desain ini siap digunakan sebagai dasar:

- backend implementation;
- PostgreSQL migration;
- repository layer;
- API development;
- CBT integration;
- AI question generation.
````

---

## Status Modul 08_database_schema

Selesai:

```
08_database_schema

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
✅ 07_postgresql_ddl.sql
✅ 08_erdiagram.md
```

Dengan ini **Question Bank Database Specification sudah lengkap**.

Tahap berikutnya yang logis adalah melanjutkan ke:

```
09_backend_implementation/
```

atau jika mengikuti roadmap besar YakinLulus.id:

```
09_exam_database_schema
```

karena setelah Question Bank selesai, domain berikutnya yang bergantung langsung adalah **Exam / CBT Runtime**.
