Berikut **08_database_schema / 02_table_specification.md**.

Dokumen ini merupakan turunan langsung dari **Domain Model Question Bank** dan menjadi blueprint sebelum membuat DDL PostgreSQL. Fokusnya adalah:

* daftar seluruh tabel;
* tujuan tabel;
* ownership;
* relasi antar tabel;
* lifecycle;
* alasan desain.

---

````markdown id="t4q8pn"
# 02_table_specification.md

# YakinLulus.id Question Bank Table Specification

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini mendefinisikan
spesifikasi seluruh tabel database
untuk modul Question Bank.

Tabel dirancang berdasarkan.

- Domain Model
- Entity Catalog
- ERD
- Logical Data Model
- Backend Architecture
- Business Rules

---

# 2. Table Classification

Tabel dibagi menjadi.

```
Core Entity

Supporting Entity

Workflow Entity

AI Entity

Audit Entity

Analytics Entity
```

---

# 3. Core Entity Tables

## 3.1 questions

Purpose:

Root aggregate Question Bank.

Menyimpan identitas utama soal.

---

Owner:

question_bank service

---

Primary Key:

```
id
```

---

Important Fields:

```
id

question_code

status

question_type

difficulty_level

subject_id

grade_id

created_by

created_at

updated_at

deleted_at
```

---

Relationship:

```
questions

1 --- N

question_versions
```

---

Business Rule:

- Satu question memiliki banyak version.
- Published question tidak boleh diubah langsung.

---

# 3.2 question_versions

Purpose:

Menyimpan immutable version
dari sebuah question.

---

Primary Key:

```
id
```

---

Fields:

```
id

question_id

version_number

content

answer_key

explanation

status

created_by

created_at
```

---

Relationship:

```
questions

1 --- N

question_versions
```

---

Rule:

Published version immutable.

---

# 3.3 question_contents

Purpose:

Memisahkan konten kompleks soal.

Mendukung.

- Rich text
- Formula
- Image
- Audio
- Video

---

Fields:

```
id

question_version_id

content_type

content_data

order_number
```

---

Example:

```
TEXT

IMAGE

FORMULA

MEDIA
```

---

# 3.4 question_options

Purpose:

Menyimpan pilihan jawaban.

---

Fields:

```
id

question_version_id

option_label

option_text

is_correct

order_number
```

---

Relationship:

```
question_versions

1 --- N

question_options
```

---

# 3.5 question_explanations

Purpose:

Menyimpan pembahasan soal.

---

Fields:

```
id

question_version_id

explanation_type

content

created_at
```

---

Type:

```
TEXT

IMAGE

VIDEO

REFERENCE
```

---

# 4. Taxonomy Tables

---

# 4.1 question_taxonomies

Purpose:

Mapping soal dengan
struktur pendidikan.

---

Fields:

```
id

question_id

curriculum_id

subject_id

grade_id

chapter_id

topic_id
```

---

Relationship:

```
Question

N --- N

Taxonomy
```

---

# 4.2 question_tags

Purpose:

Label tambahan.

Contoh.

```
UTBK

HOTS

OLIMPIADE
```

---

Fields:

```
id

question_id

tag_id
```

---

# 4.3 tags

Purpose:

Master tag.

---

Fields:

```
id

name

category

created_at
```

---

# 5. Review Workflow Tables

---

# 5.1 question_reviews

Purpose:

Menyimpan proses review.

---

Fields:

```
id

question_id

reviewer_id

status

comment

started_at

completed_at
```

---

Status:

```
ASSIGNED

IN_PROGRESS

APPROVED

REJECTED
```

---

# 5.2 question_review_comments

Purpose:

Diskusi reviewer.

---

Fields:

```
id

review_id

user_id

comment

created_at
```

---

# 6. Version Control Tables

---

# 6.1 question_version_history

Purpose:

Tracking perubahan version.

---

Fields:

```
id

question_id

from_version

to_version

change_type

created_by

created_at
```

---

# 7. File Attachment Tables

---

# 7.1 question_attachments

Purpose:

Reference file object storage.

---

Fields:

```
id

question_version_id

file_name

storage_key

mime_type

file_size

created_at
```

---

Relationship:

```
question_versions

1 --- N

question_attachments
```

---

# 8. Import Export Tables

---

# 8.1 question_import_jobs

Purpose:

Tracking import Excel/CSV.

---

Fields:

```
id

file_id

status

total_rows

success_rows

failed_rows

error_report

created_by

created_at
```

---

Status:

```
PENDING

PROCESSING

COMPLETED

FAILED
```

---

# 8.2 question_import_errors

Purpose:

Detail error import.

---

Fields:

```
id

job_id

row_number

error_code

message

payload
```

---

# 8.3 question_export_jobs

Purpose:

Tracking export.

---

Fields:

```
id

format

filter_json

status

file_id

created_by

created_at
```

---

# 9. AI Related Tables

---

# 9.1 ai_generation_jobs

Purpose:

Tracking AI generation process.

---

Fields:

```
id

request_id

model

prompt_id

status

created_by

created_at
```

---

# 9.2 ai_generation_results

Purpose:

Output AI.

---

Fields:

```
id

job_id

generated_content

validation_status

created_at
```

---

# 9.3 question_embeddings

Purpose:

Vector representation.

---

Fields:

```
id

question_id

embedding

model

created_at
```

---

Database:

pgvector

---

# 10. Audit Tables

---

# 10.1 audit.audit_logs

Purpose:

Immutable activity record.

---

Fields:

```
id

user_id

action

entity_type

entity_id

request_id

metadata

created_at
```

---

# 10.2 audit.audit_changes

Purpose:

Before after data.

---

Fields:

```
id

audit_id

old_value

new_value

changed_fields
```

---

# 11. Analytics Tables

---

# 11.1 question_usage_events

Purpose:

Tracking penggunaan soal.

---

Events:

```
USED_IN_EXAM

ANSWERED

FLAGGED

SKIPPED
```

---

# 11.2 question_metrics

Purpose:

Aggregated statistics.

---

Fields:

```
id

question_id

attempt_count

correct_rate

difficulty_score

quality_score
```

---

# 12. Master Reference Tables

Berada di schema public.

---

## subjects

Mata pelajaran.

---

## grades

Jenjang kelas.

---

## curriculums

Kurikulum.

---

## chapters

Bab.

---

## topics

Topik.

---

# 13. Table Relationship Summary

```
questions

|

+-- question_versions

        |

        +-- question_options

        +-- question_contents

        +-- question_explanations

        +-- question_attachments


questions

|

+-- question_reviews


questions

|

+-- question_taxonomies


questions

|

+-- question_embeddings


questions

|

+-- question_usage_events

```

---

# 14. Table Growth Estimation

MVP.

```
questions

10.000


question_versions

50.000
```

---

Production.

```
questions

10.000.000


question_versions

50.000.000


audit_logs

500.000.000
```

---

# 15. Partition Candidate

Future partition.

```
question_versions

audit_logs

question_usage_events
```

---

# 16. Critical Tables

Highest importance.

```
questions

question_versions

question_options

question_reviews

audit_logs
```

---

# 17. Backup Priority

Tier 1.

```
questions

question_versions

```

Tier 2.

```
reviews

taxonomy

```

Tier 3.

```
analytics

cache
```

---

# 18. Final Table Design Decision

Core Question Bank:

```
questions

question_versions

question_contents

question_options

question_explanations

question_reviews

question_taxonomies

question_attachments
```

Support:

```
imports

exports

AI

audit

analytics
```

Desain ini siap diturunkan menjadi:

- Column Specification
- ERD Physical Model
- PostgreSQL DDL
- Migration Script
````

---

Catatan arsitektur:

Ada satu keputusan penting pada desain ini:

**`questions` dan `question_versions` dipisahkan.**

Alasannya:

Contoh kasus CBT:

* Januari 2026 → soal versi 1 dipakai ujian.
* Maret 2026 → guru memperbaiki pembahasan.
* April 2026 → soal versi 2 dibuat.

Riwayat ujian Januari tetap harus menunjuk ke **version 1**, bukan data terbaru.

Ini menjamin:

* reproducible exam;
* audit akademik;
* validasi hasil CBT;
* integritas historis.

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
➡ 03_index_strategy.md
04_constraint_strategy.md
05_migration_plan.md
06_seed_data.md
07_postgresql_ddl.sql
08_erdiagram.md
```

Selanjutnya kita lanjutkan ke **03_index_strategy.md**.
