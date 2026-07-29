```markdown id="s8m2k9"
# 02_schema_design.md

# PostgreSQL Schema Design

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan rancangan schema PostgreSQL berdasarkan domain architecture YakinLulus.

Tujuan:

- Memisahkan data berdasarkan bounded context.
- Menjaga domain ownership.
- Mengurangi coupling antar modul.
- Memudahkan pengembangan backend.
- Mendukung scaling database.
- Menyiapkan migrasi ke microservice.

---

# 2. Schema Design Principle

YakinLulus menggunakan:

```

Database per Application

Schema per Domain

```

Pada fase awal:

```

PostgreSQL Database

```
    |

    ├── academic
    ├── question
    ├── learning_resource
    ├── cbt
    ├── identity
    ├── learning
    ├── organization
    ├── media
    ├── ai
    ├── analytics
    └── system
```

```

---

# 3. Schema Isolation Principle

Setiap schema memiliki:

```

Own Tables

Own Migration

Own Business Logic

Own Permission

```

---

Contoh:

```

question schema

```
owns:

question
question_version
answer_option
```

```

---

CBT hanya memiliki:

```

cbt.exam

cbt.exam_attempt

cbt.answer_sheet

```

dengan reference:

```

question_id UUID

```

---

# 4. PostgreSQL Schema List

| No | Schema | Domain | Purpose |
|-|-|-|-|
| 1 | academic | Master Academic | Struktur akademik |
| 2 | question | Question Bank | Bank soal |
| 3 | learning_resource | Learning Resource | Materi belajar |
| 4 | cbt | CBT Engine | Sistem ujian |
| 5 | identity | User Management | User dan security |
| 6 | learning | Learning | Aktivitas belajar |
| 7 | organization | Organization | Institusi |
| 8 | media | Media | File dan asset |
| 9 | ai | AI | Artificial Intelligence |
| 10 | analytics | Analytics | Statistik dan insight |
| 11 | system | System | Infrastruktur |

---

# 5. Academic Schema

Schema:

```

academic

```

---

## Responsibility

Menyimpan master akademik.

---

## Tables

```

academic.education_level

academic.grade

academic.subject

academic.curriculum

academic.chapter

academic.competency

academic.learning_objective

```

---

## Dependency

Dipakai oleh:

```

question

learning_resource

cbt

learning

analytics

```

---

## Ownership

```

Master Academic Domain

```

---

# 6. Question Schema

Schema:

```

question

```

---

## Responsibility

Bank soal.

---

## Tables

```

question.question

question.question_version

question.question_option

question.question_explanation

question.question_source

question.question_review

```

---

## Reference

Memiliki:

```

subject_id

chapter_id

competency_id

media_id

```

---

## Tidak memiliki FK:

```

academic.subject

media.asset

```

---

# 7. Learning Resource Schema

Schema:

```

learning_resource

```

---

## Responsibility

Konten pembelajaran.

---

## Tables

```

learning_resource.course

learning_resource.module

learning_resource.lesson

learning_resource.topic

learning_resource.content

```

---

## Reference:

```

subject_id

media_id

```

---

# 8. CBT Schema

Schema:

```

cbt

```

---

## Responsibility

Engine ujian.

---

## Tables

```

cbt.exam

cbt.exam_configuration

cbt.exam_schedule

cbt.exam_attempt

cbt.question_assignment

cbt.answer_sheet

cbt.exam_result

```

---

## Reference:

```

question_id

student_id

organization_id

```

---

## Important Rule

CBT menyimpan:

```

question_id

```

bukan:

```

question_content

```

---

# 9. Identity Schema

Schema:

```

identity

```

---

## Responsibility

Authentication dan authorization.

---

## Tables

```

identity.user

identity.credential

identity.role

identity.permission

identity.user_role

identity.session

```

---

## Security Rule

Credential terisolasi.

Tidak boleh dibaca domain lain.

---

# 10. Learning Schema

Schema:

```

learning

```

---

## Responsibility

Tracking proses belajar.

---

## Tables

```

learning.enrollment

learning.progress

learning.study_history

learning.achievement

learning.learning_goal

```

---

## Reference:

```

user_id

resource_id

subject_id

```

---

# 11. Organization Schema

Schema:

```

organization

```

---

## Responsibility

Multi tenant dan institusi.

---

## Tables

```

organization.organization

organization.school

organization.class_group

organization.membership

organization.teacher_assignment

```

---

## Reference:

```

user_id

```

---

# 12. Media Schema

Schema:

```

media

```

---

## Responsibility

Digital asset management.

---

## Tables

```

media.asset

media.file

media.storage_object

media.processing_job

```

---

## Storage:

Database:

```

metadata

```

Object Storage:

```

binary file

```

---

# 13. AI Schema

Schema:

```

ai

```

---

## Responsibility

AI processing.

---

## Tables

```

ai.ai_request

ai.ai_job

ai.ai_model

ai.prompt_template

ai.generation_result

ai.embedding

```

---

## Vector Support

Menggunakan:

```

pgvector

```

---

# 14. Analytics Schema

Schema:

```

analytics

```

---

## Responsibility

Analytical processing.

---

## Tables

```

analytics.event

analytics.event_property

analytics.metric

analytics.dashboard

analytics.report

analytics.snapshot

```

---

## Characteristic

Berbeda dengan transactional schema.

Menggunakan:

```

denormalized structure

```

---

# 15. System Schema

Schema:

```

system

```

---

## Responsibility

Platform support.

---

## Tables

```

system.audit_log

system.notification

system.configuration

system.job

system.feature_flag

system.security_log

```

---

# 16. Schema Permission Model

PostgreSQL role:

```

application_user

migration_user

analytics_user

readonly_user

```

---

## Application User

Access:

```

Read/Write

Application Schema

```

---

## Analytics User

Access:

```

Read Only

Operational Schema

```

---

## Migration User

Access:

```

DDL Permission

```

---

# 17. Cross Schema Access Rule

Default:

```

DENY

```

---

Access melalui:

```

API

Service Layer

Event

```

---

Tidak:

```

Direct Table Access

```

---

# 18. Public Schema Policy

Default PostgreSQL:

```

public

```

tidak digunakan untuk business table.

---

Contoh:

Tidak:

```

public.users
public.questions

```

---

Gunakan:

```

identity.user

question.question

```

---

# 19. Common Reference Pattern

Semua schema bisnis memiliki:

```

organization_id

created_at

updated_at

deleted_at

```

---

Contoh:

```

question.question

id

organization_id

subject_id

created_at

```

---

# 20. Schema Migration Structure

Folder:

```

migrations
|
├── academic
|
├── question
|
├── cbt
|
├── identity
|
└── analytics

```

---

Contoh:

```

question/
001_create_question.sql
002_create_question_version.sql
003_add_index.sql

```

---

# 21. Schema Naming Rule

Format:

```

lowercase_snake_case

```

---

Benar:

```

learning_resource

```

---

Salah:

```

LearningResource

LearningResourceSchema

```

---

# 22. Future Database Separation

Jika traffic meningkat:

Saat ini:

```

postgresql

├ academic
├ question
├ cbt
└ learning

```

---

Future:

```

academic_db

question_db

cbt_db

analytics_db

```

---

Tanpa perubahan besar karena:

```

domain ownership sudah jelas

```

---

# 23. Schema Dependency Direction

Dependency harus satu arah.

```

identity
|
▼

organization

```
 |
 ▼
```

academic

```
 |
 ▼
```

question

```
 |
 ▼
```

cbt

```
 |
 ▼
```

analytics

```

---

Tidak boleh circular dependency.

Contoh salah:

```

question

↓

cbt

↓

question

```

---

# 24. Schema Design Summary

| Schema | Data Type | Pattern |
|-|-|-|
| academic | Master | Normalized |
| question | Content | Normalized |
| learning_resource | Content | Normalized |
| cbt | Transaction | ACID |
| identity | Security | Highly Controlled |
| learning | Transaction | Normalized |
| organization | Master/Tenant | Normalized |
| media | Metadata | Reference |
| ai | Processing | Hybrid |
| analytics | Reporting | Denormalized |
| system | Infrastructure | Controlled |

---

# 25. Final Architecture Rule

YakinLulus Schema Principle:

```

One Domain

↓

One Schema

↓

One Data Owner

↓

Controlled Access

↓

Future Database Separation Ready

```

---

# Status

Document:

```

APPROVED

```

Role:

```

Physical Database Design Specification

```

Digunakan untuk:

- Backend Development
- Database Migration
- API Architecture
- DevOps Deployment
- Future Scaling
```

---

Tahap berikutnya yang tepat:

```
03_table_design.md
```

Karena setelah schema ditentukan, kita masuk ke desain **tabel fisik PostgreSQL**:

* nama tabel
* kolom
* tipe data
* primary key
* index
* constraint
* audit field
* partition candidate
* relasi antar tabel.
