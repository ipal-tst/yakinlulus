Berikut **09_exam_database_schema / 04_constraint_strategy.md**.

Dokumen ini mendefinisikan aturan integritas database untuk menjaga:

* validitas data Exam;
* konsistensi CBT runtime;
* mencegah manipulasi hasil ujian;
* menjaga immutable attempt;
* menjamin hubungan dengan Question Bank.

---

````markdown id="ex04constraint"
# 04_constraint_strategy.md

# YakinLulus.id Exam Constraint Strategy

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Constraint strategy memastikan database
menjaga business rule secara native.

Constraint dibagi menjadi:

```
Primary Key

Foreign Key

Unique Constraint

Check Constraint

Exclusion Constraint

Trigger Constraint
```

---

# 2. Constraint Principle

Database harus mencegah:

```
Invalid Exam

Invalid Session

Duplicate Attempt

Invalid Answer

Modified Result

Orphan Data
```

---

# 3. Primary Key Strategy

Semua tabel menggunakan:

```
UUID
```

Format:

```sql
uuid_generate_v4()
```

---

Alasan:

- distributed system ready;
- offline sync support;
- aman untuk API exposure.

---

# 4. Exam Template Constraint

Table:

```
exam_templates
```

---

## Primary Key

```sql
id UUID PRIMARY KEY
```

---

## Name Unique

Tidak boleh ada template duplicate.

```sql
UNIQUE(name)
```

---

## Type Validation

```sql
CHECK(
exam_type IN
(
'PRACTICE',
'TRYOUT',
'SCHOOL_TEST',
'UTBK_SIMULATION'
)
)
```

---

# 5. Exam Constraint

Table:

```
exams
```

---

## Required Field

Wajib:

```
title

exam_type

status

created_by
```

---

## Status Constraint

```sql
CHECK(
status IN
(
'DRAFT',
'READY',
'PUBLISHED',
'ACTIVE',
'COMPLETED',
'ARCHIVED'
)
)
```

---

## Published Rule

Jika:

```
status=PUBLISHED
```

maka:

```
published_at IS NOT NULL
```

Implementasi:

Trigger.

---

# 6. Exam Settings Constraint

Table:

```
exam_settings
```

---

## One To One

Satu exam hanya memiliki satu setting.

```sql
UNIQUE(exam_id)
```

---

## Duration Validation

```sql
CHECK(
duration_minutes > 0
)
```

---

## Attempt Limit

```sql
CHECK(
attempt_limit >=1
)
```

---

# 7. Section Constraint

Table:

```
exam_sections
```

---

## Unique Order

Dalam satu exam:

```
section order
```

tidak boleh duplicate.

```sql
UNIQUE(
exam_id,
order_number
)
```

---

# 8. Question Mapping Constraint

Table:

```
exam_questions
```

---

## Unique Question Position

Satu posisi hanya satu soal.

```sql
UNIQUE(
exam_id,
question_order
)
```

---

## Question Version Required

Tidak boleh:

```
NULL question_version_id
```

---

## Section Validation

Jika exam memiliki section:

```
section_id
```

harus berasal dari exam yang sama.

Trigger:

```
validate_exam_section()
```

---

# 9. Question Rule Constraint

Table:

```
exam_question_rules
```

---

## Question Count

```sql
CHECK(
question_count > 0
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

# 10. Session Constraint

Table:

```
exam_sessions
```

---

## Unique Attempt

User tidak boleh memiliki nomor attempt sama.

```sql
UNIQUE(
exam_id,
user_id,
attempt_number
)
```

---

## Attempt Number

```sql
CHECK(
attempt_number > 0
)
```

---

## Status Validation

```sql
CHECK(
status IN
(
'CREATED',
'STARTED',
'IN_PROGRESS',
'SUBMITTED',
'GRADED',
'COMPLETED'
)
)
```

---

# 11. Session Time Constraint

Rule:

```
finish_time >= start_time
```

---

Constraint:

```sql
CHECK(
finished_at IS NULL

OR

finished_at >= started_at
)
```

---

# 12. Session Question Constraint

Table:

```
session_questions
```

---

## Unique Sequence

Satu session:

```
sequence_number
```

harus unik.

```sql
UNIQUE(
session_id,
sequence_number
)
```

---

## Question Required

```sql
NOT NULL

question_version_id
```

---

# 13. Answer Constraint

Table:

```
student_answers
```

---

## One Answer Per Question

Default:

```sql
UNIQUE(
session_question_id
)
```

---

Alasan:

Current answer state.

---

History perubahan disimpan:

```
answer_events
```

---

# 14. Answer Validation

Selected option:

harus berasal dari:

```
question_options
```

Validasi:

Application Layer

+

Trigger optional.

---

# 15. Result Constraint

Table:

```
exam_results
```

---

## One Result Per Session

```sql
UNIQUE(
session_id
)
```

---

## Score Range

```sql
CHECK(
percentage >=0

AND

percentage <=100
)
```

---

# 16. Score Constraint

Table:

```
exam_scores
```

---

Score tidak boleh negatif.

```sql
CHECK(
raw_score >=0
)
```

---

# 17. Ranking Constraint

Table:

```
exam_rankings
```

---

## Unique Rank

Dalam exam:

```
rank_position
```

unik.

```sql
UNIQUE(
exam_id,
rank_position
)
```

---

## Score Validation

```sql
CHECK(
score >=0
)
```

---

# 18. Schedule Constraint

Table:

```
exam_schedules
```

---

## Valid Period

```sql
CHECK(
end_time > start_time
)
```

---

# 19. Foreign Key Strategy

Default:

```
ON DELETE RESTRICT
```

untuk data penting.

---

Contoh:

```
exam

↓

session

↓

result
```

Tidak boleh cascade delete.

---

# 20. Cascade Delete Allowed

Hanya child temporary:

```
exam_sections

exam_settings

exam_question_rules
```

---

# 21. Immutable Constraint

Data berikut tidak boleh berubah setelah selesai:

```
session_questions

student_answers

exam_results
```

---

Implementasi:

Trigger:

```
prevent_update_after_submit()
```

---

# 22. Submission Protection

Jika:

```
exam_session.status

=

SUBMITTED
```

maka:

Tidak boleh:

```
INSERT answer

UPDATE answer

DELETE answer
```

---

# 23. Offline Sync Constraint

Sync version harus naik.

Rule:

```
new_version > old_version
```

---

# 24. Anti Duplicate Session

Mencegah:

```
1 user

+

1 exam

+

multiple active session
```

---

Partial unique index:

```sql
CREATE UNIQUE INDEX
one_active_session

ON exam_sessions
(
exam_id,
user_id
)

WHERE status='IN_PROGRESS';
```

---

# 25. Audit Constraint

Semua perubahan penting wajib:

```
audit_event
```

---

Event:

```
EXAM_PUBLISHED

SESSION_STARTED

RESULT_RELEASED
```

---

# 26. Trigger List

Trigger yang diperlukan:

```
validate_exam_status_transition

validate_exam_section

prevent_submitted_update

generate_exam_result

create_audit_event
```

---

# 27. Constraint Layering

Validation dibagi:

```
Frontend

↓

API Validation

↓

Service Layer

↓

Database Constraint
```

---

# 28. Final Constraint Architecture

```
Business Rule

      |

Service Layer

      |

Database Constraint

      |

Trigger Protection

```

---

# 29. Conclusion

Constraint strategy memastikan:

- data exam konsisten;
- attempt tidak dapat dimanipulasi;
- hasil ujian immutable;
- CBT runtime aman;
- database siap production scale.
````

---

Status:

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
⬜ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 05_migration_plan.md**.
