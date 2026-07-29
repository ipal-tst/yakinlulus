Berikut **08_database_schema / 04_constraint_strategy.md**.

Dokumen ini mendefinisikan bagaimana PostgreSQL menjaga **data integrity** pada Question Bank. Constraint menjadi lapisan pertahanan kedua setelah business logic di application service.

Prinsip utama:

* Application layer menangani business workflow.
* Database layer memastikan data tidak pernah masuk dalam kondisi invalid.
* Constraint tidak menggantikan domain rule, tetapi menjadi **last line of defense**.

---

````markdown id="c82h91"
# 04_constraint_strategy.md

# YakinLulus.id Question Bank Constraint Strategy

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan strategi constraint
untuk database Question Bank.

Tujuan.

- Menjaga integritas data
- Mencegah invalid state
- Menjamin relational consistency
- Mengurangi data corruption

---

# 2. Constraint Principles

Database constraint mengikuti prinsip.

- Strong Integrity
- Explicit Rule
- Fail Fast
- Transaction Safe
- Maintainable

---

# 3. Constraint Types

PostgreSQL constraint yang digunakan.

```
PRIMARY KEY

FOREIGN KEY

UNIQUE

CHECK

NOT NULL

EXCLUSION

```

---

# 4. Primary Key Strategy

Seluruh entity utama wajib memiliki.

```sql
id UUID PRIMARY KEY
```

---

Contoh.

```sql
questions

id UUID PRIMARY KEY
```

---

# 5. NOT NULL Strategy

Field wajib harus selalu tersedia.

---

## Question

Mandatory.

```
question_code

question_type

status

created_by

created_at
```

---

## Version

Mandatory.

```
question_id

version_number

content

created_by
```

---

# 6. Foreign Key Strategy

Semua relationship penting menggunakan FK.

---

Contoh.

```sql
question_versions.question_id

REFERENCES

questions.id
```

---

# 7. Foreign Key Behavior

## Restrict

Digunakan untuk historical data.

Contoh.

```
question_versions

cannot delete

questions
```

---

## Cascade

Digunakan untuk child data
yang tidak memiliki arti tanpa parent.

Contoh.

```
question_options

↓

question_version
```

---

## Set Null

Digunakan untuk optional reference.

Contoh.

```
reviewer_id
```

---

# 8. Question Constraint

Table:

```
questions
```

---

## Question Code Unique

Rule:

Satu kode soal hanya satu.

```sql
UNIQUE(question_code)
```

---

## Status Validation

```sql
CHECK(
status IN
(
'DRAFT',
'READY_FOR_REVIEW',
'UNDER_REVIEW',
'APPROVED',
'PUBLISHED',
'ARCHIVED',
'DELETED'
)
)
```

---

## Difficulty Validation

```sql
CHECK(
difficulty_level IN
(
'EASY',
'MEDIUM',
'HARD'
)
)
```

---

# 9. Question Version Constraint

Table:

```
question_versions
```

---

## Version Number Unique

Rule:

Tidak boleh ada duplicate version.

```sql
UNIQUE(
question_id,
version_number
)
```

---

## Version Positive

```sql
CHECK(
version_number > 0
)
```

---

# 10. Question Option Constraint

Table:

```
question_options
```

---

## Option Label Unique

Dalam satu soal.

Contoh.

```
A

B

C

D
```

Tidak boleh duplicate.

```sql
UNIQUE(
question_version_id,
option_label
)
```

---

## Correct Answer Validation

Minimal satu jawaban benar.

Business validation dilakukan
di service layer.

Database dapat menggunakan.

```sql
CHECK(
is_correct IN
(
true,
false
)
)
```

---

# 11. Taxonomy Constraint

Table:

```
question_taxonomies
```

---

Rule.

Satu question tidak boleh
memiliki taxonomy duplicate.

```sql
UNIQUE(
question_id,
curriculum_id,
subject_id,
grade_id,
chapter_id,
topic_id
)
```

---

# 12. Review Constraint

Table:

```
question_reviews
```

---

## Review Status

```sql
CHECK(
status IN
(
'ASSIGNED',
'IN_PROGRESS',
'APPROVED',
'REJECTED'
)
)
```

---

## Completion Rule

Jika completed_at tersedia.

Maka status harus selesai.

Diverifikasi service layer.

---

# 13. Attachment Constraint

Table:

```
question_attachments
```

---

## File Size

Tidak boleh negatif.

```sql
CHECK(
file_size > 0
)
```

---

## MIME Validation

Contoh.

Allowed:

```
image/png

image/jpeg

video/mp4
```

---

# 14. Import Constraint

Table:

```
question_import_jobs
```

---

Status.

```sql
CHECK(
status IN
(
'PENDING',
'PROCESSING',
'COMPLETED',
'FAILED'
)
)
```

---

Row Counter.

```sql
CHECK(
success_rows >=0

AND

failed_rows >=0
)
```

---

# 15. Export Constraint

Status.

```sql
CHECK(
status IN
(
'PENDING',
'PROCESSING',
'COMPLETED',
'FAILED'
)
)
```

---

# 16. AI Constraint

Table:

```
ai_generation_jobs
```

---

Status.

```sql
CHECK(
status IN
(
'QUEUED',
'PROCESSING',
'COMPLETED',
'FAILED'
)
)
```

---

# 17. Embedding Constraint

Table:

```
question_embeddings
```

---

Rule.

Satu question
satu embedding aktif
per model.

```sql
UNIQUE(
question_id,
model
)
```

---

# 18. Soft Delete Constraint

Entity dengan soft delete.

Tidak boleh duplicate aktif.

Contoh:

Question Code.

```sql
CREATE UNIQUE INDEX
uq_question_code_active

ON questions(question_code)

WHERE deleted_at IS NULL;
```

---

# 19. Timestamp Constraint

Rule.

updated_at tidak boleh
lebih kecil dari created_at.

```sql
CHECK(
updated_at >= created_at
)
```

---

# 20. JSONB Constraint

JSONB harus valid.

Contoh.

```sql
CHECK(
jsonb_typeof(metadata)
=
'object'
)
```

---

# 21. Immutable Data Constraint

Published Version.

Tidak boleh update.

Implementasi.

- Trigger
- Service Rule

---

Contoh.

```
PUBLISHED

UPDATE CONTENT

BLOCK
```

---

# 22. Transaction Constraint

Operasi berikut harus atomic.

```
Create Question

+

Version

+

Option

+

Audit
```

---

# 23. Delete Protection

Data berikut tidak boleh hard delete.

```
questions

question_versions

exam_used_questions
```

---

# 24. Reference Integrity

Question yang sudah digunakan CBT.

Harus tetap tersedia.

Relationship.

```
CBT Result

↓

Question Version
```

---

# 25. Constraint Error Handling

Database error harus
diterjemahkan oleh backend.

Contoh.

PostgreSQL.

```
23505
unique_violation
```

Mapping.

```
QUESTION_ALREADY_EXISTS
```

---

# 26. Migration Rule

Constraint ditambahkan melalui migration.

Tidak manual production.

---

# 27. Constraint Testing

Semua constraint harus diuji.

Test.

- Insert invalid
- Update invalid
- Delete restricted
- Duplicate data

---

# 28. Performance Consideration

Constraint tidak boleh
menurunkan performa signifikan.

Monitor.

- FK lookup
- Index usage
- Lock

---

# 29. Future Multi Tenant Constraint

Future.

Semua unique constraint
harus mempertimbangkan.

```
tenant_id
```

Contoh.

```
tenant_id

+

question_code
```

---

# 30. Final Constraint Strategy

Constraint utama.

```
Primary Key

Foreign Key

Unique

Status Check

Soft Delete Protection

Version Integrity

Historical Protection

Transaction Integrity
```

Dengan strategi ini database mampu menjaga
integritas Question Bank walaupun terjadi.

- bug aplikasi;
- import data besar;
- integrasi AI;
- concurrent request;
- perubahan service.
````

---

## Catatan desain penting

Ada satu business rule yang **tidak boleh hanya mengandalkan database constraint**:

> "Minimal satu jawaban benar untuk pilihan ganda."

Alasannya:

Database hanya melihat baris `question_options`. Untuk validasi penuh perlu melihat:

```
question_version

        |

        N question_options

        |

count(is_correct=true)
```

Ini adalah **aggregate invariant**, sehingga tempat terbaik adalah:

```
Question Domain Service

+
Database Constraint sebagai backup
```

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
03_index_strategy.md
04_constraint_strategy.md
➡ 05_migration_plan.md
06_seed_data.md
07_postgresql_ddl.sql
08_erdiagram.md
```

Selanjutnya kita lanjutkan ke **05_migration_plan.md**.
