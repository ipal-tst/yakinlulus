Berikut **09_exam_database_schema / 03_index_strategy.md**.

Dokumen ini mendefinisikan strategi indexing PostgreSQL untuk modul Exam.

Karakteristik Exam berbeda dengan Question Bank:

* Question Bank dominan **search dan filtering**.
* Exam dominan **high concurrency runtime**.

Query paling kritis:

* peserta mulai ujian;
* load soal session;
* autosave jawaban;
* submit exam;
* scoring;
* ranking.

---

````markdown id="ex03idx"
# 03_index_strategy.md

# YakinLulus.id Exam Database Index Strategy

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan strategi index
untuk database Exam.

Tujuan:

- Mempercepat CBT runtime.
- Mendukung concurrent user.
- Mengurangi query latency.
- Menjaga performa transaksi.

---

# 2. Index Design Principle

Index dibuat berdasarkan:

```
Runtime Access Pattern

+

Query Frequency

+

Data Growth

+

Concurrency
```

---

# 3. Index Priority Level

## Critical

Digunakan CBT runtime.

```
exam_sessions

session_questions

student_answers
```

---

## High

Digunakan exam management.

```
exams

exam_questions

exam_results
```

---

## Medium

Administrative.

```
templates

schedule

ranking
```

---

# 4. Exam Table Index

Table:

```
exam.exams
```

---

## Status Filtering

Query:

```
SELECT *
FROM exams
WHERE status='PUBLISHED'
```

Index:

```sql
CREATE INDEX idx_exam_status
ON exam.exams(status);
```

---

## Creator Lookup

```sql
CREATE INDEX idx_exam_creator
ON exam.exams(created_by);
```

---

## Exam Type

```sql
CREATE INDEX idx_exam_type
ON exam.exams(exam_type);
```

---

## Published Exam

Partial index:

```sql
CREATE INDEX idx_active_exam
ON exam.exams(
published_at
)
WHERE status='PUBLISHED';
```

---

# 5. Exam Template Index

Table:

```
exam_templates
```

---

```sql
CREATE INDEX idx_exam_template_type
ON exam.exam_templates(
exam_type
);
```

---

# 6. Exam Settings Index

Table:

```
exam_settings
```

---

Karena one-to-one.

Index:

```sql
CREATE UNIQUE INDEX uq_exam_settings_exam
ON exam.exam_settings(
exam_id
);
```

---

# 7. Exam Section Index

Table:

```
exam_sections
```

---

Untuk load section:

```sql
CREATE INDEX idx_exam_section_order
ON exam.exam_sections(
exam_id,
order_number
);
```

---

# 8. Exam Question Index

Table:

```
exam_questions
```

---

## Load Exam Question

Query CBT:

```
SELECT questions
WHERE exam_id=?
ORDER BY order
```

Index:

```sql
CREATE INDEX idx_exam_questions_runtime
ON exam.exam_questions(
exam_id,
question_order
);
```

---

## Section Question

```sql
CREATE INDEX idx_exam_questions_section
ON exam.exam_questions(
section_id,
question_order
);
```

---

## Question Version Lookup

```sql
CREATE INDEX idx_exam_questions_version
ON exam.exam_questions(
question_version_id
);
```

---

# 9. Question Rule Index

Table:

```
exam_question_rules
```

---

Random selection query:

```
WHERE exam_id=?
```

Index:

```sql
CREATE INDEX idx_question_rules_exam
ON exam.exam_question_rules(
exam_id
);
```

---

# 10. Exam Session Index

Table:

```
exam_sessions
```

Ini tabel paling penting.

---

## User Active Session

Query:

```
Find active exam
for user
```

Index:

```sql
CREATE INDEX idx_session_user_status
ON exam.exam_sessions(
user_id,
status
);
```

---

## Exam Participant

Query:

```
all participant
```

Index:

```sql
CREATE INDEX idx_session_exam
ON exam.exam_sessions(
exam_id
);
```

---

## Active Session Recovery

Untuk reconnect.

```sql
CREATE INDEX idx_session_recovery
ON exam.exam_sessions(
device_id,
status,
last_sync_at
);
```

---

## Prevent Duplicate Attempt

Unique:

```sql
CREATE UNIQUE INDEX uq_exam_attempt
ON exam.exam_sessions(
exam_id,
user_id,
attempt_number
);
```

---

# 11. Session Question Index

Table:

```
session_questions
```

Critical CBT table.

---

## Load Question List

Query:

```
session_id

ORDER BY sequence
```

Index:

```sql
CREATE INDEX idx_session_questions_order
ON exam.session_questions(
session_id,
sequence_number
);
```

---

## Question Access

```sql
CREATE INDEX idx_session_question_lookup
ON exam.session_questions(
id
);
```

---

# 12. Student Answer Index

Table:

```
student_answers
```

High write volume.

---

## Load Answers

Query:

```
session_question_id
```

Index:

```sql
CREATE INDEX idx_student_answer_question
ON exam.student_answers(
session_question_id
);
```

---

## User Submission

```sql
CREATE INDEX idx_student_answer_session
ON exam.student_answers(
session_id
);
```

---

## Answer History

```sql
CREATE INDEX idx_answer_history
ON exam.student_answers(
session_id,
answered_at
);
```

---

# 13. Answer Event Index

Table:

```
answer_events
```

---

High volume.

Index:

```sql
CREATE INDEX idx_answer_event_session
ON exam.answer_events(
session_id,
created_at
);
```

---

# 14. Result Index

Table:

```
exam_results
```

---

## User Result

```sql
CREATE INDEX idx_result_user
ON exam.exam_results(
user_id,
generated_at DESC
);
```

---

## Exam Result

```sql
CREATE INDEX idx_result_exam
ON exam.exam_results(
session_id
);
```

---

# 15. Score Index

Table:

```
exam_scores
```

---

```sql
CREATE INDEX idx_score_result
ON exam.exam_scores(
result_id
);
```

---

# 16. Ranking Index

Table:

```
exam_rankings
```

---

## Leaderboard

Query:

```
exam_id

ORDER BY rank_position
```

Index:

```sql
CREATE INDEX idx_ranking_leaderboard
ON exam.exam_rankings(
exam_id,
rank_position
);
```

---

## User Ranking

```sql
CREATE INDEX idx_user_ranking
ON exam.exam_rankings(
user_id,
exam_id
);
```

---

# 17. Schedule Index

Table:

```
exam_schedules
```

---

Upcoming exam query:

```sql
CREATE INDEX idx_schedule_active
ON exam.exam_schedules(
start_time,
end_time
);
```

---

# 18. Offline Sync Index

Table:

```
exam_sync_logs
```

---

```sql
CREATE INDEX idx_sync_session
ON exam.exam_sync_logs(
session_id,
status
);
```

---

# 19. Activity Log Index

Table:

```
exam_activity_logs
```

---

High growth.

Index:

```sql
CREATE INDEX idx_exam_activity_session
ON exam.exam_activity_logs(
session_id,
created_at
);
```

---

# 20. Composite Index CBT Runtime

Query paling sering:

```
Load exam

↓

Load session

↓

Load questions

↓

Load answers
```

Index chain:

```
exam_sessions

(user_id,status)


        ↓


session_questions

(session_id,sequence_number)


        ↓


student_answers

(session_question_id)

```

---

# 21. Partial Index

Active session:

```sql
CREATE INDEX idx_active_sessions
ON exam.exam_sessions(
user_id
)
WHERE status IN
(
'STARTED',
'IN_PROGRESS'
);
```

---

# 22. Partition Related Index

Future partition.

Candidate:

```
student_answers

answer_events

activity_logs
```

---

Partition index:

```
created_at

+

session_id
```

---

# 23. Index Maintenance

Monitor:

```
pg_stat_user_indexes

pg_stat_database
```

---

Check:

```
Index hit ratio

Unused index

Index size

Bloat
```

---

# 24. Performance Target

Target:

## Load Exam

```
<100ms
```

---

## Load Question Session

```
<200ms
```

---

## Save Answer

```
<50ms
```

---

## Submit Exam

```
<2s
```

---

# 25. Index Trade Off

Tambah index:

Benefit:

```
Fast Read
```

Cost:

```
Storage

Write Overhead

Maintenance
```

---

# 26. Final Index Architecture

Critical:

```
exam_sessions

├── user_id,status
├── exam_id
└── device_id,status


session_questions

├── session_id,sequence


student_answers

├── session_question_id
├── session_id


exam_questions

├── exam_id,order

```

---

# 27. Conclusion

Strategi index Exam difokuskan pada:

```
Fast CBT Runtime

+

High Concurrent Access

+

Reliable Submission

+

Fast Analytics
```

Dengan desain ini Exam Database siap menangani
dari puluhan peserta MVP sampai jutaan attempt
pada skala platform EdTech.
````

---

Status:

```
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
⬜ 04_constraint_strategy.md
⬜ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 04_constraint_strategy.md**.
