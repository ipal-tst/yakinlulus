Berikut **09_exam_database_schema / 02_table_specification.md**.

Dokumen ini mendefinisikan seluruh tabel dalam domain **Exam Database** berdasarkan:

* Exam Domain Model
* CBT Runtime Architecture
* Question Bank Schema
* Scoring Requirement
* Analytics Requirement
* Offline CBT Requirement

Fokus desain:

* exam sebagai aggregate root;
* question snapshot;
* immutable student attempt;
* separation antara runtime dan result.

---

````markdown id="et02ts"
# 02_table_specification.md

# YakinLulus.id Exam Table Specification

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan spesifikasi
tabel database untuk modul Exam.

---

# 2. Table Classification

Tabel dibagi menjadi:

```
Exam Definition

Question Mapping

Runtime

Answer

Scoring

Ranking

Schedule

Audit Support
```

---

# 3. Exam Definition Tables

---

# 3.1 exam_templates

## Purpose

Menyimpan template konfigurasi ujian.

Contoh:

```
UTBK Simulation Template

School Exam Template
```

---

## Owner

exam service

---

## Primary Key

```
id
```

---

## Main Fields

```
id

name

exam_type

description

default_duration

configuration_json

created_by

created_at

updated_at
```

---

## Relationship

```
exam_templates

1:N

exams
```

---

# 3.2 exams

## Purpose

Aggregate root Exam.

---

## Main Fields

```
id

template_id

title

description

exam_type

status

visibility

created_by

published_at

created_at

updated_at
```

---

## Relationship

```
exam_templates

1:N

exams


exams

1:N

exam_sections


exams

1:N

exam_sessions
```

---

## Lifecycle

```
DRAFT

READY

PUBLISHED

ACTIVE

COMPLETED

ARCHIVED
```

---

# 3.3 exam_settings

## Purpose

Konfigurasi detail exam.

---

## Fields

```
id

exam_id

duration_minutes

attempt_limit

navigation_mode

random_question

random_option

show_result

result_release_time

settings_json
```

---

## Relationship

```
exam

1:1

exam_settings
```

---

# 3.4 exam_sections

## Purpose

Mendukung ujian multi bagian.

Contoh:

```
TPS

Literasi

Numerasi
```

---

## Fields

```
id

exam_id

name

description

order_number

duration_minutes
```

---

Relationship:

```
exam

1:N

sections
```

---

# 3.5 exam_schedules

## Purpose

Jadwal pelaksanaan ujian.

---

Fields:

```
id

exam_id

start_time

end_time

timezone

status
```

---

Relationship:

```
exam

1:N

schedule
```

---

# 4. Question Mapping Tables

---

# 4.1 exam_question_sets

## Purpose

Menyimpan konfigurasi pemilihan soal.

---

Fields:

```
id

exam_id

selection_type

total_question

rule_json

created_at
```

---

Selection Type:

```
MANUAL

RANDOM

HYBRID
```

---

# 4.2 exam_questions

## Purpose

Mapping soal ke exam.

---

Important:

Menyimpan reference ke:

```
question_version_id
```

---

Fields:

```
id

exam_id

section_id

question_version_id

question_order

score_weight

created_at
```

---

Relationship:

```
exam

1:N

exam_questions
```

---

# 4.3 exam_question_rules

## Purpose

Rule random selection.

---

Example:

```
Matematika

Grade 12

Medium

20 soal
```

---

Fields:

```
id

exam_id

subject_id

grade_id

chapter_id

difficulty_level

question_count

rule_priority
```

---

# 5. Runtime Tables

---

# 5.1 exam_sessions

## Purpose

Attempt peserta.

---

Fields:

```
id

exam_id

user_id

attempt_number

status

started_at

finished_at

device_id

offline_token

last_sync_at
```

---

Relationship:

```
exam

1:N

exam_sessions
```

---

Status:

```
CREATED

STARTED

IN_PROGRESS

SUBMITTED

GRADED

COMPLETED
```

---

# 5.2 session_questions

## Purpose

Snapshot soal saat ujian dimulai.

---

Fields:

```
id

session_id

question_version_id

sequence_number

option_order

visited

flagged

created_at
```

---

Relationship:

```
exam_session

1:N

session_questions
```

---

Important:

Tabel ini memastikan:

```
Student A

dan

Student B

dapat menerima urutan berbeda
```

---

# 6. Answer Tables

---

# 6.1 student_answers

## Purpose

Menyimpan jawaban peserta.

---

Fields:

```
id

session_question_id

selected_option

answer_text

is_correct

answer_time_ms

answered_at

updated_at
```

---

Relationship:

```
session_question

1:N

student_answer
```

---

# 6.2 answer_events

## Purpose

Event history jawaban.

Mendukung offline sync.

---

Fields:

```
id

session_id

question_id

event_type

payload

created_at
```

---

Event:

```
ANSWER_SELECTED

ANSWER_CHANGED

QUESTION_FLAGGED

QUESTION_VIEWED
```

---

# 7. Scoring Tables

---

# 7.1 exam_results

## Purpose

Hasil akhir peserta.

---

Fields:

```
id

session_id

user_id

status

total_score

percentage

passed

generated_at
```

---

Relationship:

```
exam_session

1:1

exam_result
```

---

# 7.2 exam_scores

## Purpose

Detail scoring.

---

Fields:

```
id

result_id

category

raw_score

weighted_score

normalized_score
```

---

Example:

```
Matematika

Raw:

35

IRT:

720
```

---

# 8. Ranking Tables

---

# 8.1 exam_rankings

## Purpose

Ranking peserta.

---

Fields:

```
id

exam_id

result_id

user_id

rank_position

score

calculated_at
```

---

Relationship:

```
exam

1:N

ranking
```

---

# 8.2 ranking_snapshots

## Purpose

History ranking.

---

Fields:

```
id

exam_id

snapshot_date

ranking_data

created_at
```

---

# 9. Offline Synchronization Tables

---

# 9.1 exam_sync_logs

## Purpose

Tracking sync offline.

---

Fields:

```
id

session_id

device_id

sync_version

status

synced_at
```

---

Status:

```
PENDING

SYNCING

SUCCESS

FAILED
```

---

# 10. Audit Support Tables

---

# 10.1 exam_activity_logs

## Purpose

Tracking aktivitas ujian.

---

Events:

```
EXAM_STARTED

QUESTION_OPENED

ANSWER_CHANGED

EXAM_SUBMITTED
```

---

Fields:

```
id

session_id

event_type

metadata

created_at
```

---

# 11. Relationship Summary

```
exam_templates

        |

        |

       exams

        |

        +----------------+

        |                |

 sections          settings


        |

        |

exam_questions

        |

        |

question_version


        |

        |

exam_sessions

        |

        |

session_questions

        |

        |

student_answers

        |

        |

exam_results

        |

        |

exam_scores

        |

        |

exam_rankings

```

---

# 12. Critical Tables

Performance critical:

```
exam_sessions

session_questions

student_answers

exam_results
```

---

# 13. High Growth Tables

Expected growth:

```
student_answers

answer_events

exam_activity_logs
```

---

# 14. Partition Candidate

Future partition:

```
student_answers

answer_events

exam_activity_logs
```

Based on:

```
created_at
```

---

# 15. Immutable Tables

Tidak boleh berubah:

```
session_questions

student_answers

exam_results
```

---

# 16. Final Table Architecture

Core:

```
exams

exam_questions

exam_sessions

session_questions

student_answers

exam_results
```

Support:

```
templates

settings

schedule

ranking

sync

audit
```

---

# 17. Final Decision

Exam database menggunakan:

```
Exam Aggregate

+

Question Version Snapshot

+

Immutable Attempt Data

+

Separated Scoring

+

Analytics Ready Event Storage
```

Desain ini siap diturunkan menjadi:

- index strategy;
- constraint strategy;
- migration;
- PostgreSQL DDL;
- CBT runtime implementation.
````

---

Status:

```
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
⬜ 03_index_strategy.md
⬜ 04_constraint_strategy.md
⬜ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 03_index_strategy.md**.
