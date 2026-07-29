```markdown id="x4m8qz"
# 12_engineering_implementation_guide/database/05_indexing_strategy.md

# Database Indexing Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi indexing PostgreSQL untuk YakinLulus.id.

Indexing digunakan untuk meningkatkan performa query terutama pada:

- pencarian soal;
- filtering materi;
- exam runtime;
- answer submission;
- analytics;
- dashboard student;
- ranking.


Target:

- query cepat;
- latency rendah;
- scalable untuk jutaan record;
- menghindari full table scan.


---

# 2. Indexing Principle


YakinLulus menggunakan prinsip:


```

Index berdasarkan Query Pattern

*

Measure Before Optimize

*

Avoid Over Indexing

```


Index bukan dibuat untuk semua kolom.

Index hanya dibuat berdasarkan:

- frekuensi akses;
- pola query;
- ukuran tabel;
- kebutuhan performance.


---

# 3. Database Query Flow


Tanpa index:


```

Application

```
|
```

SQL Query

```
|
```

PostgreSQL

```
|
```

Sequential Scan

```
|
```

Scan Semua Row

```


Dengan index:


```

Application

```
|
```

SQL Query

```
|
```

PostgreSQL

```
|
```

Index Lookup

```
|
```

Target Row

```


---

# 4. Index Type


PostgreSQL menyediakan beberapa index.


## 4.1 B-Tree Index


Default index.


Digunakan untuk:


```

Equality

Sorting

Range Query

````


Contoh:


```sql
CREATE INDEX idx_users_email
ON auth.users(email);
````

---

## 4.2 Composite Index

Index lebih dari satu kolom.

Contoh:

Query:

```sql
WHERE
subject_id = ?
AND difficulty = ?
```

Index:

```sql
CREATE INDEX idx_question_filter
ON question_bank.questions
(subject_id, difficulty);
```

---

## 4.3 GIN Index

Untuk:

```
JSONB

Array

Full Text Search

```

Contoh:

```sql
CREATE INDEX idx_question_metadata
ON question_bank.questions
USING GIN(metadata);
```

---

## 4.4 Partial Index

Index dengan kondisi tertentu.

Contoh:

Hanya active question:

```sql
CREATE INDEX idx_active_questions
ON question_bank.questions(id)
WHERE status='ACTIVE';
```

---

# 5. Primary Key Index

Semua tabel utama:

```sql
id UUID PRIMARY KEY
```

otomatis membuat:

```
Unique B-Tree Index

```

Contoh:

```sql
users_pkey
questions_pkey
exam_sessions_pkey
```

---

# 6. Foreign Key Index

Foreign key wajib diperhatikan.

Contoh:

```sql
questions.subject_id
```

Index:

```sql
CREATE INDEX idx_questions_subject
ON question_bank.questions(subject_id);
```

Digunakan untuk:

* join;
* filtering;
* relationship traversal.

---

# 7. Authentication Index Strategy

## Users

Query:

```sql
SELECT *
FROM users
WHERE email=?;
```

Index:

```sql
CREATE UNIQUE INDEX idx_users_email
ON auth.users(email);
```

---

## Session Token

```sql
CREATE INDEX idx_sessions_token
ON auth.sessions(token);
```

---

# 8. Academic Domain Index

## Subject

Query:

```sql
WHERE grade_id=?
```

Index:

```sql
CREATE INDEX idx_subject_grade
ON academic.subjects(grade_id);
```

---

## Chapter

Query:

```sql
WHERE subject_id=?
```

Index:

```sql
CREATE INDEX idx_chapter_subject
ON academic.chapters(subject_id);
```

---

# 9. Question Bank Index Strategy

Question Bank merupakan tabel high traffic.

Target query:

```
Filter

Search

Random Selection

Difficulty

Taxonomy

```

---

## Question Filtering

Query:

```sql
WHERE
subject_id

AND

grade_id

AND

difficulty
```

Index:

```sql
CREATE INDEX idx_question_filter
ON question_bank.questions
(
grade_id,
subject_id,
difficulty
);
```

---

## Question Randomization

CBT membutuhkan:

```
Available Question Pool

Random Selection

```

Index:

```sql
CREATE INDEX idx_question_pool
ON question_bank.questions
(
subject_id,
status
);
```

---

## Question Search

Untuk:

```
Keyword Search

Explanation Search

```

Gunakan:

```sql
GIN + pg_trgm
```

Contoh:

```sql
CREATE INDEX idx_question_search
ON question_bank.questions
USING GIN(search_vector);
```

---

# 10. Learning Material Index

Query:

```sql
WHERE
subject_id

AND

chapter_id
```

Index:

```sql
CREATE INDEX idx_material_lookup
ON learning.materials
(
subject_id,
chapter_id
);
```

---

# 11. Exam Index Strategy

Exam table:

Query:

```sql
WHERE
school_id

AND

status
```

Index:

```sql
CREATE INDEX idx_exam_status
ON exam.exams
(
school_id,
status
);
```

---

# 12. CBT Runtime Index Strategy

CBT memiliki traffic tertinggi.

## Exam Session

Query:

```sql
Find Active Session

```

Index:

```sql
CREATE INDEX idx_session_active
ON cbt.exam_sessions
(
student_id,
status
);
```

---

## Student Answer

Query:

```sql
Get Answers By Session

```

Index:

```sql
CREATE INDEX idx_answers_session
ON cbt.student_answers
(
session_id
);
```

---

## Answer Submission

Index:

```sql
CREATE INDEX idx_submission_session
ON cbt.submissions
(
session_id
);
```

---

# 13. Analytics Index Strategy

Analytics memiliki volume besar.

Contoh:

```sql
events
```

Query:

```sql
WHERE
user_id

AND

created_at
```

Index:

```sql
CREATE INDEX idx_event_user_time
ON analytics.events
(
user_id,
created_at
);
```

---

# 14. Time Based Index

Untuk tabel besar:

Contoh:

```
analytics.events

notification_logs

audit_logs

```

Index:

```sql
(created_at)
```

Karena query:

```sql
WHERE created_at BETWEEN
date1 AND date2
```

---

# 15. JSONB Index Strategy

Beberapa data menggunakan JSONB:

Contoh:

```
Question Metadata

AI Metadata

Configuration

```

Gunakan:

```sql
GIN Index
```

Contoh:

```sql
CREATE INDEX idx_metadata
ON question_bank.questions
USING GIN(metadata);
```

---

# 16. Index Naming Convention

Format:

```
idx_<table>_<column>

```

Contoh:

```
idx_users_email

idx_questions_subject

idx_answers_session

```

Primary key:

```
<table>_pkey

```

---

# 17. Index Monitoring

Monitor:

```
Index Usage

Unused Index

Index Size

Query Performance

```

Tools:

```
EXPLAIN ANALYZE

pg_stat_user_indexes

pg_stat_statements

```

---

# 18. Query Analysis

Sebelum membuat index:

Gunakan:

```sql
EXPLAIN ANALYZE
SELECT ...
```

Periksa:

```
Seq Scan

Index Scan

Cost

Execution Time

```

---

# 19. Avoid Over Indexing

Terlalu banyak index menyebabkan:

```
INSERT Lambat

UPDATE Lambat

Storage Besar

Maintenance Berat

```

Rule:

```
Read Heavy Table

More Index


Write Heavy Table

Selective Index

```

---

# 20. Index Migration Strategy

Index dibuat melalui migration.

Contoh:

```sql
CREATE INDEX CONCURRENTLY
idx_questions_subject
ON question_bank.questions(subject_id);
```

Untuk production gunakan:

```
CONCURRENTLY

```

agar tidak lock table.

---

# 21. Scaling Strategy

## Phase 1

```
Single PostgreSQL

Optimized Index

EXPLAIN Review

```

---

## Phase 2

```
Read Replica

Query Optimization

Materialized View

```

---

## Phase 3

```
Dedicated Search Engine

ElasticSearch/OpenSearch

Analytics Warehouse

```

---

# 22. Index Checklist

Sebelum production:

```
✅ Primary Key Indexed

✅ Foreign Key Reviewed

✅ Critical Query Indexed

✅ Slow Query Analyzed

✅ Index Migration Tested

✅ No Duplicate Index

```

---

# Summary

Indexing strategy YakinLulus.id:

```
Query Driven Index

+

PostgreSQL Native Index

+

Domain Specific Optimization

+

Production Safe Migration

+

Continuous Performance Review

```

Dengan strategi ini database dapat menangani:

* ribuan siswa;
* jutaan soal;
* jutaan answer record;
* analytics dengan volume besar.
