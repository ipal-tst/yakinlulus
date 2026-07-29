```markdown id="i7k3m2"
# 04_indexing_strategy.md

# PostgreSQL Indexing Strategy

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan strategi indexing PostgreSQL untuk platform YakinLulus.

Tujuan:

- Mempercepat query aplikasi.
- Menentukan index berdasarkan pola akses.
- Menghindari over-indexing.
- Mendukung pertumbuhan data besar.
- Menyiapkan optimasi analytics dan AI.
- Menjaga performa transaksi.

---

# 2. Prinsip Indexing

Index dibuat berdasarkan:

```

Query Pattern

*

Data Access Frequency

*

Data Growth Projection

```

---

Tidak semua kolom dibuat index.

Rule:

```

High Read Frequency

*

High Selectivity

=

Candidate Index

````

---

# 3. PostgreSQL Index Type

YakinLulus menggunakan beberapa tipe index.

---

# 3.1 B-Tree Index

Default PostgreSQL index.

Digunakan untuk:

- Primary Key.
- Foreign reference.
- Sorting.
- Filtering.

Contoh:

```sql
CREATE INDEX idx_question_subject
ON question.question(subject_id);
````

---

# 3.2 Composite Index

Index dengan beberapa kolom.

Digunakan ketika query sering menggunakan kombinasi field.

Contoh:

Query:

```sql
WHERE
organization_id = ?

AND
subject_id = ?

AND
difficulty_level = ?
```

Index:

```sql
CREATE INDEX idx_question_filter
ON question.question
(
 organization_id,
 subject_id,
 difficulty_level
);
```

---

# 3.3 Partial Index

Index berdasarkan kondisi tertentu.

Digunakan untuk:

* Data aktif.
* Published content.
* Status tertentu.

Contoh:

```sql
CREATE INDEX idx_question_published
ON question.question(id)
WHERE status='published';
```

---

# 3.4 GIN Index

Untuk:

* JSONB.
* Full text search.
* Array.

Contoh:

```sql
CREATE INDEX idx_event_payload
ON analytics.event
USING GIN(payload);
```

---

# 3.5 GiST Index

Untuk:

* Similarity search.
* Advanced search.

---

# 3.6 Vector Index

Untuk AI embedding.

Menggunakan:

```
pgvector
```

Contoh:

```sql
CREATE INDEX idx_embedding_vector
ON ai.embedding
USING ivfflat(vector);
```

---

# 4. Universal Index Rule

Semua tabel utama:

## Primary Key

Otomatis:

```
id
```

---

## Foreign Reference

Default index:

```
*_id
```

---

Contoh:

```sql
student_id

question_id

organization_id
```

---

## Timestamp

Untuk tabel besar:

```
created_at

occurred_at
```

---

# 5. Academic Domain Indexing

Schema:

```
academic
```

---

# education_level

Primary:

```
id
```

Index:

```sql
CREATE INDEX idx_education_level_code
ON academic.education_level(code);
```

---

# grade

Query:

```
Get grade by education level
```

Index:

```sql
CREATE INDEX idx_grade_level
ON academic.grade
(
education_level_id
);
```

---

# subject

Index:

```sql
CREATE INDEX idx_subject_code
ON academic.subject(code);
```

Search:

```sql
CREATE INDEX idx_subject_name_search
ON academic.subject
USING gin(name gin_trgm_ops);
```

---

# chapter

Hierarchical lookup:

```sql
CREATE INDEX idx_chapter_subject
ON academic.chapter(subject_id);
```

Parent-child:

```sql
CREATE INDEX idx_chapter_parent
ON academic.chapter(parent_id);
```

---

# 6. Question Domain Indexing

Schema:

```
question
```

Domain ini memiliki data besar.

Target:

```
Millions of Questions
```

---

# question Table

## Primary

```
id
```

---

## Common Query

Filter:

```
Subject

Chapter

Difficulty

Type

Status
```

---

Composite index:

```sql
CREATE INDEX idx_question_search
ON question.question
(
subject_id,
chapter_id,
difficulty_level,
status
);
```

---

Organization filter:

```sql
CREATE INDEX idx_question_org
ON question.question
(
organization_id,
status
);
```

---

Published question:

```sql
CREATE INDEX idx_question_active
ON question.question(id)
WHERE status='published'
AND deleted_at IS NULL;
```

---

Full Text Search

Kolom:

```
content
```

Index:

```sql
CREATE INDEX idx_question_content_search
ON question.question
USING gin(content gin_trgm_ops);
```

---

# question_option

Index:

```sql
CREATE INDEX idx_option_question
ON question.question_option(question_id);
```

---

# question_version

Index:

```sql
CREATE INDEX idx_question_version
ON question.question_version(question_id);
```

---

# 7. Learning Resource Indexing

Schema:

```
learning_resource
```

---

# course

Filter:

```
subject
status
```

Index:

```sql
CREATE INDEX idx_course_subject
ON learning_resource.course(subject_id,status);
```

---

# module

Lookup:

```
course module
```

Index:

```sql
CREATE INDEX idx_module_course
ON learning_resource.module(course_id);
```

---

# lesson

Index:

```sql
CREATE INDEX idx_lesson_module
ON learning_resource.lesson(module_id);
```

---

Search:

```sql
CREATE INDEX idx_lesson_title_search
ON learning_resource.lesson
USING gin(title gin_trgm_ops);
```

---

# 8. CBT Domain Indexing

Schema:

```
cbt
```

Karakter:

```
High Transaction
High Write
```

---

# exam

Filter:

```
organization

status

subject
```

Index:

```sql
CREATE INDEX idx_exam_lookup
ON cbt.exam
(
organization_id,
status,
subject_id
);
```

---

# exam_attempt

Very large table.

Index:

```sql
CREATE INDEX idx_attempt_student
ON cbt.exam_attempt(student_id);
```

---

Exam monitoring:

```sql
CREATE INDEX idx_attempt_exam
ON cbt.exam_attempt(exam_id,status);
```

---

Active attempt:

```sql
CREATE INDEX idx_active_attempt
ON cbt.exam_attempt(student_id)
WHERE status='running';
```

---

# answer_sheet

Largest CBT table.

Index:

```sql
CREATE INDEX idx_answer_attempt
ON cbt.answer_sheet(attempt_id);
```

Question analysis:

```sql
CREATE INDEX idx_answer_question
ON cbt.answer_sheet(question_id);
```

---

# 9. Identity Domain Indexing

Schema:

```
identity
```

---

# user

Unique:

```sql
CREATE UNIQUE INDEX idx_user_email
ON identity.user(email);
```

---

Login:

```sql
CREATE INDEX idx_user_username
ON identity.user(username);
```

---

Status:

```sql
CREATE INDEX idx_user_status
ON identity.user(status);
```

---

# credential

Security lookup:

```sql
CREATE INDEX idx_credential_user
ON identity.credential(user_id);
```

---

# 10. Learning Domain Indexing

Schema:

```
learning
```

---

# enrollment

Index:

```sql
CREATE INDEX idx_enrollment_student
ON learning.enrollment(student_id);
```

Course lookup:

```sql
CREATE INDEX idx_enrollment_course
ON learning.enrollment(course_id);
```

---

# progress

Dashboard query:

```sql
CREATE INDEX idx_progress_student
ON learning.progress(student_id);
```

---

Composite:

```sql
CREATE INDEX idx_progress_lookup
ON learning.progress
(
student_id,
resource_id
);
```

---

# study_history

High growth table.

Index:

```sql
CREATE INDEX idx_history_student_time
ON learning.study_history
(
student_id,
visited_at
);
```

---

# 11. Organization Domain Indexing

Schema:

```
organization
```

---

# organization

Search:

```sql
CREATE INDEX idx_org_name_search
ON organization.organization
USING gin(name gin_trgm_ops);
```

---

# membership

Critical table.

Index:

```sql
CREATE INDEX idx_membership_user
ON organization.membership(user_id);
```

---

Organization lookup:

```sql
CREATE INDEX idx_membership_org
ON organization.membership(organization_id);
```

---

# 12. Media Domain Indexing

Schema:

```
media
```

---

# asset

Search:

```sql
CREATE INDEX idx_asset_filename
ON media.asset
USING gin(file_name gin_trgm_ops);
```

---

Type filtering:

```sql
CREATE INDEX idx_asset_type
ON media.asset(file_type);
```

---

# 13. AI Domain Indexing

Schema:

```
ai
```

---

# ai_request

Index:

```sql
CREATE INDEX idx_ai_request_user
ON ai.ai_request(user_id);
```

---

Model analysis:

```sql
CREATE INDEX idx_ai_model_request
ON ai.ai_request(model_id);
```

---

# embedding

Vector search:

```sql
CREATE INDEX idx_embedding_vector
ON ai.embedding
USING ivfflat(vector);
```

---

Reference:

```sql
CREATE INDEX idx_embedding_reference
ON ai.embedding(reference_id);
```

---

# 14. Analytics Domain Indexing

Schema:

```
analytics
```

---

Analytics memiliki data terbesar.

---

# event

Partition recommended.

Index:

```sql
CREATE INDEX idx_event_user_time
ON analytics.event
(
user_id,
occurred_at
);
```

---

Event analysis:

```sql
CREATE INDEX idx_event_type_time
ON analytics.event
(
event_type,
occurred_at
);
```

---

JSON:

```sql
CREATE INDEX idx_event_payload
ON analytics.event
USING gin(payload);
```

---

# metric

Dashboard query:

```sql
CREATE INDEX idx_metric_reference
ON analytics.metric
(
reference_id,
period
);
```

---

# report

Index:

```sql
CREATE INDEX idx_report_date
ON analytics.report(generated_at);
```

---

# 15. System Domain Indexing

Schema:

```
system
```

---

# audit_log

Very large.

Index:

```sql
CREATE INDEX idx_audit_user_time
ON system.audit_log
(
user_id,
timestamp
);
```

---

Entity tracking:

```sql
CREATE INDEX idx_audit_entity
ON system.audit_log
(
entity,
entity_id
);
```

---

# notification

User inbox:

```sql
CREATE INDEX idx_notification_user
ON system.notification
(
user_id,
status
);
```

---

# 16. Index Naming Convention

Format:

```
idx_{table}_{column}
```

---

Example:

```
idx_question_subject
```

---

Composite:

```
idx_question_subject_chapter
```

---

Unique:

```
uq_{table}_{column}
```

---

Example:

```
uq_user_email
```

---

# 17. Index Maintenance

Monitoring:

```
pg_stat_user_indexes
```

---

Check:

* Unused index.
* Duplicate index.
* Index size.
* Query performance.

---

# 18. Avoid Over Indexing

Tidak membuat index pada:

```
Low cardinality column
```

contoh:

```
gender

boolean flag

small enum
```

kecuali query sangat sering.

---

# 19. Query Optimization Strategy

Urutan optimasi:

```
1. Analyze Query

2. Check Execution Plan

3. Add Index

4. Measure Performance

5. Remove Unused Index
```

---

Tools:

```sql
EXPLAIN ANALYZE
```

---

# 20. Future Scaling Strategy

Jika data meningkat:

## Question Bank

```
Partition by subject/year
```

---

## CBT Answer

```
Partition by exam_date
```

---

## Analytics Event

```
Partition monthly
```

---

## Audit Log

```
Partition monthly
```

---

# 21. Performance Target

| Query Type      | Target |
| --------------- | ------ |
| Primary Lookup  | <10ms  |
| Filter Query    | <100ms |
| Search Query    | <500ms |
| Dashboard Query | <2s    |

---

# 22. Final Index Principle

YakinLulus Index Rule:

```
Index follows query.

Not every column needs index.

Transaction tables need selective index.

Large tables need partition strategy.

Analytics needs read optimization.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Database Performance Architecture
```

Digunakan untuk:

* PostgreSQL Implementation
* Query Optimization
* Backend Development
* Performance Testing
* Database Scaling

```

---

Tahapan berikutnya yang sesuai:

```

05_constraint_strategy.md

```

karena setelah **schema → table → index**, berikutnya kita kunci:

- primary constraint
- unique constraint
- check constraint
- data integrity rule
- soft delete rule
- validation boundary
- transaction consistency.
```
