```markdown id="c5x8n1"
# 05_constraint_strategy.md

# PostgreSQL Constraint Strategy

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan strategi constraint database PostgreSQL untuk menjaga integritas data pada platform YakinLulus.

Tujuan:

- Menjaga validitas data.
- Mencegah data corrupt.
- Menegakkan business rule.
- Mengurangi error aplikasi.
- Menentukan validasi yang dilakukan database.
- Menentukan validasi yang dilakukan service layer.

---

# 2. Constraint Philosophy

YakinLulus menggunakan prinsip:

```

Database protects data integrity.

Application protects business behavior.

```

Artinya:

Database bertanggung jawab terhadap:

```

Structural Integrity

Data Consistency

Basic Validation

```

Application bertanggung jawab terhadap:

```

Business Workflow

Authorization

Complex Rules

```

---

# 3. Constraint Type

PostgreSQL constraint yang digunakan:

```

PRIMARY KEY

FOREIGN KEY

UNIQUE

NOT NULL

CHECK

EXCLUSION

DEFAULT

```

---

# 4. Constraint Layering

Constraint dibagi menjadi tiga layer:

```

Database Constraint

```
    ↓
```

Domain Validation

```
    ↓
```

Application Rule

```

---

Contoh:

## Database

Tidak boleh:

```

email = NULL

```

---

## Domain

Tidak boleh:

```

student register tanpa organization

```

---

## Application

Tidak boleh:

```

student mengakses exam sebelum schedule

````

---

# 5. Primary Key Constraint

## Rule

Semua entity wajib memiliki:

```sql
id UUID PRIMARY KEY
````

---

Contoh:

```sql
CREATE TABLE question.question
(
    id UUID PRIMARY KEY
);
```

---

Tujuan:

* Unique identity.
* Stable reference.
* Distributed ready.

---

# 6. NOT NULL Strategy

## Mandatory Field

Field penting wajib:

```sql
NOT NULL
```

---

Contoh:

```sql
CREATE TABLE question.question
(
    id UUID PRIMARY KEY,

    content TEXT NOT NULL,

    status VARCHAR(30) NOT NULL
);
```

---

# 7. Nullable Field Policy

Field boleh NULL jika:

* Optional.
* Belum tersedia.
* Akan diproses kemudian.

---

Contoh:

Question:

```sql
explanation_media_id UUID NULL
```

karena:

```
Soal dapat dibuat tanpa video pembahasan
```

---

# 8. Foreign Key Strategy

## Internal Domain

Menggunakan FK.

Contoh:

```sql
question.question_option

question_id

REFERENCES

question.question(id)
```

---

Tujuan:

* Menjaga relasi.
* Mencegah orphan data.

---

# 9. Cross Domain Reference

Tidak menggunakan database FK.

Contoh:

CBT:

```sql
question_id UUID
```

bukan:

```sql
FOREIGN KEY REFERENCES question.question
```

---

Alasan:

* Domain independence.
* Microservice ready.
* Mengurangi coupling.

---

# 10. ON DELETE Strategy

Default:

```
NO ACTION
```

---

Tidak menggunakan:

```sql
ON DELETE CASCADE
```

untuk data bisnis.

---

Alasan:

Menghindari:

```
Accidental Data Loss
```

---

Contoh:

Tidak:

```
Delete Subject

↓

Delete All Questions
```

---

# 11. Soft Delete Constraint

Semua entity bisnis:

```sql
deleted_at TIMESTAMP NULL
```

---

Active record:

```sql
deleted_at IS NULL
```

---

Deleted record:

```sql
deleted_at IS NOT NULL
```

---

# 12. Unique Constraint Strategy

Digunakan untuk:

* Identity.
* Code reference.
* Business identifier.

---

# User

Email:

```sql
UNIQUE(email)
```

---

Example:

```sql
CREATE UNIQUE INDEX uq_user_email
ON identity.user(email);
```

---

# Academic

Subject code:

```sql
UNIQUE(code)
```

---

# Question

Source reference:

```sql
UNIQUE(source_id)
```

---

# 13. Composite Unique Constraint

Digunakan untuk kombinasi.

---

Contoh:

Satu siswa hanya boleh memiliki satu enrollment:

```sql
student_id

+

course_id
```

Constraint:

```sql
UNIQUE
(
student_id,
course_id
)
```

---

# 14. Check Constraint Strategy

Digunakan untuk validasi sederhana.

---

## Difficulty Level

Contoh:

```sql
CHECK
(
difficulty_level
IN
(
'easy',
'medium',
'hard'
)
)
```

---

## Score

```sql
CHECK
(
score >= 0
AND
score <=100
)
```

---

## Duration

```sql
CHECK
(
duration_minutes > 0
)
```

---

# 15. Status Constraint Strategy

Status menggunakan:

```
VARCHAR
```

dengan:

```
CHECK Constraint
```

---

Contoh:

Question:

```sql
CHECK
(
status IN
(
'draft',
'review',
'published',
'archived'
)
)
```

---

# 16. Academic Domain Constraint

## Education Level

```sql
code NOT NULL

name NOT NULL
```

---

## Grade

Rule:

```
grade_number > 0
```

Constraint:

```sql
CHECK
(
grade_number > 0
)
```

---

## Chapter

Parent:

```sql
parent_id NULL
```

mendukung:

```
Chapter

 └── Sub Chapter
```

---

# 17. Question Domain Constraint

## Question

Mandatory:

```
subject_id

question_type

difficulty_level

status

content
```

---

Constraint:

```sql
content <> ''
```

---

## Question Option

Rule:

Satu question:

```
minimal 2 option
```

dan:

```
minimal 1 correct answer
```

---

Tidak dilakukan database.

Dilakukan:

```
Question Service
```

---

# 18. Learning Resource Constraint

## Course

Mandatory:

```
subject_id

title

status
```

---

## Module

Rule:

```
order_number > 0
```

---

Constraint:

```sql
CHECK(order_number > 0)
```

---

# 19. CBT Constraint

## Exam

Mandatory:

```
title

organization_id

status
```

---

## Exam Configuration

Rule:

Duration:

```sql
duration > 0
```

---

Question count:

```sql
question_count > 0
```

---

## Exam Attempt

Status:

```
created

running

finished

expired
```

---

CHECK:

```sql
status IN (...)
```

---

# 20. Score Constraint

Score harus:

```
0 - 100
```

---

Constraint:

```sql
CHECK
(
score >=0

AND

score <=100
)
```

---

# 21. Learning Constraint

## Progress

Percentage:

```sql
CHECK
(
percentage >=0

AND

percentage <=100
)
```

---

## Study Duration

```sql
CHECK
(
duration_seconds >=0
)
```

---

# 22. Organization Constraint

## Organization

Mandatory:

```
name

type

status
```

---

## Membership

Rule:

Satu user satu role aktif:

```sql
UNIQUE
(
organization_id,

user_id,

role
)
```

---

# 23. Media Constraint

## File Size

Tidak boleh negatif:

```sql
CHECK
(
size_bytes >0
)
```

---

## File Type

Tidak kosong:

```sql
CHECK
(
file_type <> ''
)
```

---

# 24. AI Constraint

## AI Request

Mandatory:

```
model_id

request_type

status
```

---

## Token Usage

```sql
CHECK
(
token_usage >=0
)
```

---

## Cost

```sql
CHECK
(
cost >=0
)
```

---

# 25. Analytics Constraint

Analytics memiliki karakteristik berbeda.

---

## Event

Mandatory:

```
event_type

occurred_at
```

---

## Metric

Value:

```sql
NOT NULL
```

---

Period:

```sql
NOT NULL
```

---

# 26. System Constraint

## Audit Log

Mandatory:

```
user_id

action

timestamp
```

---

Audit:

```
Immutable
```

Tidak boleh update.

---

# 27. Immutable Data Strategy

Data tertentu tidak boleh berubah.

Contoh:

```
Analytics Event

Audit Log

Exam Answer Sheet
```

---

Database:

```
INSERT ONLY
```

---

Update dilakukan melalui:

```
Correction Event
```

---

# 28. Business Rule Outside Database

Tidak semua rule dibuat constraint.

Contoh:

## Tidak di Database

```
Student hanya boleh mengikuti exam satu kali
```

Karena membutuhkan:

```
Time

Permission

Schedule
```

---

Dilakukan oleh:

```
CBT Service
```

---

# 29. Constraint Naming Convention

Format:

```
{type}_{table}_{column}
```

---

Primary Key:

```
pk_question
```

---

Foreign Key:

```
fk_question_option_question
```

---

Unique:

```
uq_user_email
```

---

Check:

```
chk_exam_duration
```

---

# 30. Migration Rule

Semua constraint harus melalui migration.

Contoh:

```
001_create_question.sql

002_add_question_constraint.sql

003_add_question_index.sql
```

---

Tidak:

```
Manual production change
```

---

# 31. Constraint Testing

Setiap migration harus diuji:

```
Valid Data

Invalid Data

Boundary Case

Concurrent Transaction
```

---

Contoh:

Test:

```
score = 101

↓

FAILED
```

---

# 32. Constraint Performance Consideration

Constraint memiliki cost.

Perhatikan:

* Bulk import.
* AI generation.
* Large migration.

---

Untuk import besar:

gunakan:

```
Batch Insert

Validation Pipeline

Staging Table
```

---

# 33. Import Pipeline Strategy

Untuk data besar:

```
Excel Import

↓

Staging Table

↓

Validation

↓

Clean Data

↓

Production Table
```

---

Bukan:

```
Excel

↓

Direct Insert
```

---

# 34. Final Constraint Rule

YakinLulus Constraint Principle:

```
Database prevents invalid structure.

Domain prevents invalid behavior.

Application controls workflow.

Critical data is immutable.

Ownership determines modification rights.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Database Integrity Architecture
```

Digunakan untuk:

* SQL Migration
* Backend Validation
* Data Quality Control
* Import Pipeline
* Security Review

```
---

Tahap berikutnya:

```

06_migration_strategy.md

```

Fokus berikutnya:

- migration workflow
- versioning schema
- zero downtime migration
- rollback strategy
- production deployment
- seed data management
- initial master data loading
- CI/CD database pipeline
```
