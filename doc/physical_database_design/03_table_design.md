```markdown id="t4m7q2"
# 03_table_design.md

# PostgreSQL Table Design Specification

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan standar desain tabel PostgreSQL untuk seluruh domain YakinLulus.

Tujuan:

- Menentukan struktur fisik database.
- Menentukan standar kolom.
- Menentukan primary key.
- Menentukan foreign reference.
- Menentukan indexing strategy.
- Menentukan constraint.
- Menjaga konsistensi antar domain.
- Menyiapkan database untuk scaling.

---

# 2. Table Design Principle

YakinLulus menggunakan:

```

Domain Driven Database Design

*

Normalized Relational Model

```


Target normalisasi:

```

3NF

```


Pengecualian:

```

Analytics

Event Storage

AI Vector Storage

```

menggunakan:

```

Denormalized Model

````

---

# 3. General Table Structure

Semua business table menggunakan struktur dasar:

```sql
CREATE TABLE schema.entity
(
    id UUID PRIMARY KEY,

    organization_id UUID,

    created_at TIMESTAMP NOT NULL,

    updated_at TIMESTAMP NOT NULL,

    created_by UUID,

    updated_by UUID,

    deleted_at TIMESTAMP
);
````

---

# 4. Primary Key Strategy

## Standard

Semua tabel menggunakan:

```
UUID
```

---

Format:

```sql
id UUID PRIMARY KEY
```

---

Contoh:

```sql
question.question

id UUID
```

---

# 5. UUID Generation

Menggunakan:

```
UUID v7
```

atau:

```
time ordered UUID
```

Alasan:

* Index friendly.
* Sorting lebih baik.
* Mendukung distributed system.

---

# 6. Audit Column Standard

Semua tabel utama:

| Column     | Type      | Purpose       |
| ---------- | --------- | ------------- |
| id         | UUID      | Primary Key   |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update   |
| created_by | UUID      | Creator       |
| updated_by | UUID      | Modifier      |
| deleted_at | timestamp | Soft delete   |

---

# 7. Organization Reference

Karena YakinLulus mendukung:

```
Multi Tenant
```

maka tabel bisnis menggunakan:

```sql
organization_id UUID
```

---

Contoh:

```sql
question.question

id

organization_id

subject_id

content
```

---

# 8. Foreign Key Strategy

## Internal Domain

Menggunakan FK.

Contoh:

```sql
question.question_version

question_id
```

referensi:

```
question.question
```

---

## Cross Domain

Tidak menggunakan database FK.

Contoh:

Tidak:

```sql
FOREIGN KEY(question_id)

REFERENCES question.question(id)
```

---

Menggunakan:

```
Reference ID
+
Service Validation
```

---

# 9. Naming Convention

## Table

Singular.

Benar:

```
question
```

Salah:

```
questions
```

---

## Column

Snake case.

Benar:

```
created_at
```

Salah:

```
createdAt
```

---

# 10. Data Type Standard

| Data         | PostgreSQL Type |
| ------------ | --------------- |
| ID           | UUID            |
| Text pendek  | VARCHAR         |
| Text panjang | TEXT            |
| Status       | VARCHAR / ENUM  |
| Flag         | BOOLEAN         |
| Timestamp    | TIMESTAMP       |
| Date         | DATE            |
| Number       | INTEGER         |
| Decimal      | NUMERIC         |
| Metadata     | JSONB           |
| Vector       | VECTOR          |

---

# 11. Status Field Convention

Status menggunakan:

```
VARCHAR
```

bukan ENUM PostgreSQL.

---

Contoh:

```sql
status VARCHAR(30)
```

Nilai:

```
draft

published

archived
```

---

Alasan:

* Mudah berubah.
* Mudah migrasi.
* Tidak membutuhkan ALTER TYPE.

---

# 12. JSONB Policy

JSONB hanya untuk:

```
Flexible Data
```

---

Contoh:

Benar:

```sql
metadata JSONB
```

---

Tidak:

```sql
question_data JSONB
```

untuk seluruh entity.

---

# 13. Academic Domain Table Design

Schema:

```
academic
```

---

## education_level

Purpose:

Jenjang pendidikan.

```sql
id

code

name

description

created_at
```

---

Contoh:

```
SD

SMP

SMA
```

---

## grade

Purpose:

Kelas.

```sql
id

education_level_id

grade_number

name
```

---

## subject

Purpose:

Mata pelajaran.

```sql
id

code

name
```

---

## curriculum

Purpose:

Kurikulum.

```sql
id

name

year

status
```

---

## chapter

Purpose:

Bab materi.

```sql
id

subject_id

parent_id

name
```

---

# 14. Question Domain Table Design

Schema:

```
question
```

---

## question

Main table.

```sql
id

organization_id

subject_id

chapter_id

difficulty_level

question_type

status

content

created_at
```

---

## question_version

Untuk versioning.

```sql
id

question_id

version_number

content

created_at
```

---

## question_option

Pilihan jawaban.

```sql
id

question_id

option_label

option_text

is_correct
```

---

## question_explanation

Pembahasan.

```sql
id

question_id

content

media_id
```

---

## question_source

Sumber soal.

```sql
id

question_id

source_name

source_type
```

---

# 15. Learning Resource Table Design

Schema:

```
learning_resource
```

---

## course

```sql
id

subject_id

title

description

status
```

---

## module

```sql
id

course_id

title

order_number
```

---

## lesson

```sql
id

module_id

title

content_type

media_id
```

---

## topic

```sql
id

lesson_id

title
```

---

# 16. CBT Domain Table Design

Schema:

```
cbt
```

---

## exam

```sql
id

organization_id

title

subject_id

status
```

---

## exam_configuration

```sql
id

exam_id

duration

question_count

randomization
```

---

## exam_attempt

```sql
id

exam_id

student_id

started_at

finished_at

status
```

---

## answer_sheet

```sql
id

attempt_id

question_id

answer

is_correct
```

---

## exam_result

```sql
id

attempt_id

score

grade

generated_at
```

---

# 17. Identity Domain Table Design

Schema:

```
identity
```

---

## user

```sql
id

username

email

status
```

---

## credential

```sql
id

user_id

password_hash

last_login
```

---

## role

```sql
id

name
```

---

## permission

```sql
id

code

description
```

---

# 18. Learning Domain Table Design

Schema:

```
learning
```

---

## enrollment

```sql
id

student_id

course_id

status
```

---

## progress

```sql
id

student_id

resource_id

percentage
```

---

## study_history

```sql
id

student_id

resource_id

duration

visited_at
```

---

# 19. Organization Domain Table Design

Schema:

```
organization
```

---

## organization

```sql
id

name

type

status
```

---

## school

```sql
id

organization_id

name

address
```

---

## membership

```sql
id

organization_id

user_id

role
```

---

# 20. Media Domain Table Design

Schema:

```
media
```

---

## asset

```sql
id

file_name

file_type

storage_path

size
```

---

## processing_job

```sql
id

asset_id

status

result
```

---

# 21. AI Domain Table Design

Schema:

```
ai
```

---

## ai_request

```sql
id

user_id

model_id

request_type
```

---

## generation_result

```sql
id

request_id

output

status
```

---

## embedding

```sql
id

reference_id

vector
```

---

# 22. Analytics Domain Table Design

Schema:

```
analytics
```

---

## event

```sql
id

event_type

user_id

occurred_at

payload JSONB
```

---

## metric

```sql
id

metric_type

reference_id

value

period
```

---

## report

```sql
id

name

file_id

generated_at
```

---

# 23. System Domain Table Design

Schema:

```
system
```

---

## audit_log

```sql
id

user_id

action

entity

entity_id

timestamp
```

---

## notification

```sql
id

user_id

type

message

status
```

---

# 24. Index Standard

Setiap tabel utama:

## Primary Index

```sql
PRIMARY KEY(id)
```

---

## Foreign Reference Index

Contoh:

```sql
CREATE INDEX idx_question_subject

ON question.question(subject_id);
```

---

## Time Index

Untuk:

```
created_at

occurred_at
```

---

# 25. Unique Constraint

Data tertentu menggunakan:

```sql
UNIQUE
```

Contoh:

User:

```
email
```

Question:

```
source_code
```

---

# 26. Soft Delete Rule

Semua entity:

```sql
deleted_at TIMESTAMP NULL
```

---

Query default:

```sql
WHERE deleted_at IS NULL
```

---

# 27. Partition Candidate

Tabel yang berpotensi besar:

## Analytics Event

Partition:

```
monthly
```

---

## Study History

Partition:

```
yearly
```

---

## Audit Log

Partition:

```
monthly
```

---

# 28. Large Text Handling

Konten besar:

```
TEXT
```

atau:

```
Media Reference
```

---

Contoh:

Pembahasan video:

```
media_id
```

bukan:

```
video_binary
```

---

# 29. Database Security

Setiap schema memiliki permission:

```
owner_role

application_role

readonly_role
```

---

Tidak:

```
public access
```

---

# 30. Final Table Design Rule

YakinLulus Table Principle:

```
Every table has one owner.

Every entity has stable UUID.

Every domain controls lifecycle.

Every reference has clear ownership.

Every large dataset has scaling strategy.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Physical Database Table Design Specification
```

Digunakan untuk:

* SQL Migration
* ORM Model Design
* Backend Development
* Database Review
* Performance Optimization

```
