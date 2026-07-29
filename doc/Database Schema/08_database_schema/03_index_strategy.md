Berikut **08_database_schema / 03_index_strategy.md**.

Dokumen ini menentukan strategi indexing PostgreSQL untuk Question Bank. Karena modul ini memiliki pola akses yang sangat beragam:

* transactional write;
* pencarian soal;
* filtering berdasarkan taxonomy;
* CBT question selection;
* semantic search;
* analytics;
* audit query;

maka indexing harus dirancang berdasarkan **access pattern**, bukan sekadar menambahkan index pada semua foreign key.

---

````markdown id="m3k8p2"
# 03_index_strategy.md

# YakinLulus.id Question Bank Index Strategy

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan strategi indexing
untuk database Question Bank.

Tujuan.

- Mempercepat query utama
- Mengurangi sequential scan
- Mendukung search
- Mendukung CBT runtime
- Menjaga performa write

---

# 2. Index Principles

Index mengikuti prinsip.

- Based on Query Pattern
- Minimal but Effective
- Measure Before Add
- Monitor Usage
- Remove Unused Index

---

# 3. Index Type Strategy

PostgreSQL index yang digunakan.

---

## B-Tree

Default index.

Digunakan untuk.

- Primary key
- Foreign key
- Sorting
- Filtering

---

## GIN

Digunakan untuk.

- JSONB
- Full Text Search
- Array

---

## GiST

Digunakan untuk.

- Range query
- Similarity

---

## HNSW / IVFFlat

Digunakan untuk.

- Vector similarity search

---

# 4. Primary Key Index

Semua tabel menggunakan UUID.

Contoh.

```sql
PRIMARY KEY(id)
```

PostgreSQL otomatis membuat
B-Tree index.

---

# 5. Question Table Index

Table:

```
question_bank.questions
```

---

## Primary Lookup

```sql
CREATE INDEX idx_questions_id
ON question_bank.questions(id);
```

---

## Status Filtering

Query:

```
SELECT *
FROM questions
WHERE status='PUBLISHED';
```

Index:

```sql
CREATE INDEX idx_questions_status
ON question_bank.questions(status);
```

---

## Author Query

```sql
CREATE INDEX idx_questions_created_by
ON question_bank.questions(created_by);
```

---

## Subject Filtering

```sql
CREATE INDEX idx_questions_subject
ON question_bank.questions(subject_id);
```

---

## Difficulty Filtering

```sql
CREATE INDEX idx_questions_difficulty
ON question_bank.questions(difficulty_level);
```

---

# 6. Composite Question Index

CBT membutuhkan query seperti:

```
Subject

+

Grade

+

Difficulty

+

Status
```

Index:

```sql
CREATE INDEX idx_questions_selection
ON question_bank.questions(
subject_id,
grade_id,
difficulty_level,
status
);
```

---

# 7. Question Version Index

Table:

```
question_versions
```

---

## Question Lookup

```sql
CREATE INDEX idx_question_versions_question
ON question_bank.question_versions(question_id);
```

---

## Latest Version

Query:

```
WHERE question_id=?
ORDER BY version_number DESC
```

Index:

```sql
CREATE INDEX idx_question_versions_latest
ON question_bank.question_versions(
question_id,
version_number DESC
);
```

---

# 8. Question Option Index

Table:

```
question_options
```

---

Index:

```sql
CREATE INDEX idx_question_options_version
ON question_bank.question_options(
question_version_id
);
```

---

# 9. Taxonomy Index

Table:

```
question_taxonomies
```

---

## Curriculum Filtering

```sql
CREATE INDEX idx_question_taxonomy_curriculum
ON question_bank.question_taxonomies(
curriculum_id
);
```

---

## Subject + Grade

```sql
CREATE INDEX idx_question_taxonomy_subject_grade
ON question_bank.question_taxonomies(
subject_id,
grade_id
);
```

---

## Topic Search

```sql
CREATE INDEX idx_question_taxonomy_topic
ON question_bank.question_taxonomies(
topic_id
);
```

---

# 10. Search Index Strategy

Question content membutuhkan
multiple search method.

---

# 10.1 Full Text Search

Column:

```
question_text
```

Index:

```sql
CREATE INDEX idx_question_search
ON question_bank.question_versions
USING GIN(
to_tsvector(
'indonesian',
content
)
);
```

---

# 10.2 Trigram Search

Untuk typo search.

Extension:

```
pg_trgm
```

Index:

```sql
CREATE INDEX idx_question_trgm
ON question_bank.question_versions
USING GIN(content gin_trgm_ops);
```

---

# 11. JSONB Index

Jika metadata menggunakan JSONB.

Contoh.

```json
{
"bloom":"C4",
"competency":"analysis"
}
```

Index:

```sql
CREATE INDEX idx_question_metadata
ON question_bank.questions
USING GIN(metadata);
```

---

# 12. Review Index

Table:

```
question_reviews
```

---

## Reviewer Queue

Query:

```
reviewer_id

status
```

Index:

```sql
CREATE INDEX idx_review_queue
ON question_bank.question_reviews(
reviewer_id,
status
);
```

---

## Pending Review

```sql
CREATE INDEX idx_pending_review
ON question_bank.question_reviews(
status,
created_at
);
```

---

# 13. Attachment Index

Table:

```
question_attachments
```

Index:

```sql
CREATE INDEX idx_attachment_question
ON question_bank.question_attachments(
question_version_id
);
```

---

# 14. Import Job Index

Table:

```
question_import_jobs
```

---

Worker query:

```
status=PENDING
```

Index:

```sql
CREATE INDEX idx_import_queue
ON question_bank.question_import_jobs(
status,
created_at
);
```

---

# 15. Export Job Index

```sql
CREATE INDEX idx_export_queue
ON question_bank.question_export_jobs(
status,
created_at
);
```

---

# 16. AI Embedding Index

Table:

```
ai.question_embeddings
```

---

Vector index.

Example:

```sql
CREATE INDEX idx_question_embedding
ON ai.question_embeddings
USING hnsw
(
embedding vector_cosine_ops
);
```

---

# 17. Audit Index

Table:

```
audit.audit_logs
```

High volume table.

---

## Entity Lookup

```sql
CREATE INDEX idx_audit_entity
ON audit.audit_logs(
entity_type,
entity_id
);
```

---

## User Activity

```sql
CREATE INDEX idx_audit_user
ON audit.audit_logs(
user_id,
created_at DESC
);
```

---

## Time Range

```sql
CREATE INDEX idx_audit_time
ON audit.audit_logs(
created_at DESC
);
```

---

# 18. Analytics Index

Analytics table
lebih banyak read.

---

Example:

```sql
CREATE INDEX idx_question_metrics_question
ON analytics.question_metrics(
question_id
);
```

---

# 19. Partial Index

Untuk data aktif.

Contoh.

Query:

```
Published Question
```

Index:

```sql
CREATE INDEX idx_active_questions
ON question_bank.questions(
subject_id,
grade_id
)
WHERE status='PUBLISHED'
AND deleted_at IS NULL;
```

---

# 20. Unique Index

Contoh.

Question code.

```sql
CREATE UNIQUE INDEX uq_question_code
ON question_bank.questions(
question_code
);
```

---

Version uniqueness.

```sql
CREATE UNIQUE INDEX uq_question_version
ON question_bank.question_versions(
question_id,
version_number
);
```

---

# 21. Index Maintenance

Monitoring.

```
pg_stat_user_indexes
```

Periksa.

- unused index
- scan count
- size
- bloat

---

# 22. Index Rule

Tidak membuat index untuk.

- Semua column
- Low cardinality field tanpa alasan
- Kolom JSONB kecil
- Field yang jarang query

---

# 23. Write Performance Impact

Setiap index menambah.

- INSERT cost
- UPDATE cost
- Storage

Karena itu index harus
berdasarkan kebutuhan nyata.

---

# 24. Query Plan Validation

Gunakan.

```sql
EXPLAIN ANALYZE
```

Untuk validasi.

---

# 25. Production Monitoring

Monitor.

- Slow Query
- Index Hit Ratio
- Sequential Scan
- Index Size
- Query Latency

---

# 26. Future Optimization

Jika data besar.

Tambahkan.

- Partition Index
- Covering Index
- BRIN Index
- Materialized View

---

# 27. Final Index Strategy

Core index.

```
questions

├── status
├── subject
├── grade
├── difficulty
├── selection composite

question_versions

├── question_id
├── version_number

question_taxonomies

├── subject
├── grade
├── topic

question_reviews

├── reviewer
├── status

audit_logs

├── entity
├── user
├── timestamp

embeddings

└── vector similarity
```

---

# 28. Performance Target

Dengan strategi index ini.

Target.

```
Question Lookup

<50ms


Filtered Search

<300ms


CBT Selection Query

<200ms


Semantic Search

<500ms
```
````

---

## Catatan desain penting untuk CBT Runtime

Index paling kritikal nantinya bukan hanya search, tetapi **question selection algorithm**.

Contoh query CBT:

> Ambil 40 soal Matematika kelas 12, tingkat sulit campuran, belum pernah muncul pada paket siswa ini.

Maka index utama:

```text
questions
        |
        |
(subject_id,
 grade_id,
 difficulty_level,
 status)

        +
        
student_question_history
```

akan menjadi bottleneck utama.

Karena itu nanti saat masuk modul **10_cbt_runtime**, kita perlu membuat index khusus untuk:

* exam generation;
* randomization;
* duplicate avoidance;
* adaptive testing.

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
03_index_strategy.md
➡ 04_constraint_strategy.md
05_migration_plan.md
06_seed_data.md
07_postgresql_ddl.sql
08_erdiagram.md
```

Selanjutnya kita lanjutkan ke **04_constraint_strategy.md**.
