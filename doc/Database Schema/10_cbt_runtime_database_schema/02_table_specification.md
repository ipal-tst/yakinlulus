Berikut **10_cbt_runtime_database_schema / 02_table_specification.md**.

Dokumen ini mendefinisikan detail seluruh tabel pada schema **cbt_runtime**.

Fokus utama:

* runtime execution;
* session persistence;
* answer integrity;
* offline synchronization;
* event tracking;
* security monitoring.

---

````markdown id="cbt02table"
# 02_table_specification.md

# YakinLulus.id CBT Runtime Table Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime Database menyimpan seluruh data
yang terjadi ketika peserta menjalankan ujian.

Berbeda dengan Exam Database:

```
Exam Database

=
What exam is


CBT Runtime Database

=
How exam runs
```

---

# 2. Table Classification

Tabel dibagi menjadi:

```
Session Management

Question Runtime

Answer Runtime

Timer Management

Navigation Management

Synchronization

Event Tracking

Security Tracking
```

---

# 3. cbt_sessions

## Purpose

Menyimpan instance ujian yang sedang dikerjakan
oleh seorang user.

---

## Example

```
User:

Budi


Exam:

Tryout UTBK 2026


Session:

abc-123

```

---

## Table

```
cbt_runtime.cbt_sessions
```

---

## Columns

| Column | Type | Description |
|-|-|-|
| id | UUID | Primary key |
| exam_id | UUID | Reference exam |
| user_id | UUID | Participant |
| attempt_number | INT | Attempt ke |
| session_token | VARCHAR | Secure token |
| status | VARCHAR | Session state |
| started_at | TIMESTAMP | Start time |
| finished_at | TIMESTAMP | Finish time |
| device_id | VARCHAR | Device identifier |
| client_type | VARCHAR | Web/mobile |
| last_activity_at | TIMESTAMP | Last activity |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Update time |

---

## Status

```
CREATED

INITIALIZED

RUNNING

PAUSED

SUBMITTED

COMPLETED

EXPIRED
```

---

# 4. cbt_session_questions

## Purpose

Snapshot daftar soal yang diberikan
kepada peserta.

---

## Why Snapshot?

Karena:

```
Question Bank

dapat berubah


CBT Session

harus tetap sama
```

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| question_version_id | UUID |
| sequence_number | INT |
| option_order | JSONB |
| question_status | VARCHAR |
| opened_at | TIMESTAMP |
| created_at | TIMESTAMP |

---

## Example

Original Question:

```
A
B
C
D
```

Randomized:

```
C
A
D
B
```

disimpan:

```json
{
"C":1,
"A":2,
"D":3,
"B":4
}
```

---

# 5. cbt_answers

## Purpose

Menyimpan jawaban peserta.

---

## Design

Current state storage.

History:

```
cbt_events
```

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_question_id | UUID |
| answer_value | VARCHAR |
| answer_payload | JSONB |
| is_synced | BOOLEAN |
| answered_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Example

Multiple Choice:

```
answer_value='B'
```

---

Future:

Essay:

```json
{
"text":
"Penjelasan siswa"
}
```

---

# 6. cbt_timer_states

## Purpose

Menyimpan state timer ujian.

---

## Problem

Timer tidak boleh hanya berada di browser.

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| duration_seconds | INT |
| remaining_seconds | INT |
| started_at | TIMESTAMP |
| last_sync_at | TIMESTAMP |
| server_time | TIMESTAMP |

---

## Example

Exam:

```
120 minutes
```

State:

```
Remaining:

5420 seconds
```

---

# 7. cbt_navigation_states

## Purpose

Menyimpan posisi navigasi peserta.

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| current_question_number | INT |
| visited_questions | JSONB |
| flagged_questions | JSONB |
| updated_at | TIMESTAMP |

---

## Example

```json
{
"visited":[1,2,3,4],

"flagged":[5,8]
}
```

---

# 8. cbt_sync_queue

## Purpose

Queue sinkronisasi offline.

---

## Flow

```
Mobile/Web Client

        |

        |

Sync Queue

        |

        |

CBT Server

```

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| event_type | VARCHAR |
| payload | JSONB |
| version | INT |
| sync_status | VARCHAR |
| created_at | TIMESTAMP |
| synced_at | TIMESTAMP |

---

## Status

```
PENDING

PROCESSING

SUCCESS

FAILED
```

---

# 9. cbt_events

## Purpose

Event log seluruh aktivitas runtime.

---

## Event Example

```
SESSION_CREATED

SESSION_STARTED

QUESTION_OPENED

ANSWER_CHANGED

EXAM_SUBMITTED

```

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| event_type | VARCHAR |
| entity_id | UUID |
| payload | JSONB |
| created_at | TIMESTAMP |

---

# 10. cbt_security_logs

## Purpose

Mencatat aktivitas mencurigakan.

---

## Examples

```
Exit Fullscreen

Change Tab

Multiple Device Login

Clock Manipulation

Network Abuse
```

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| event_type | VARCHAR |
| severity | VARCHAR |
| metadata | JSONB |
| created_at | TIMESTAMP |

---

## Severity

```
LOW

MEDIUM

HIGH

CRITICAL
```

---

# 11. cbt_session_devices

## Purpose

Tracking device yang digunakan.

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| device_fingerprint | VARCHAR |
| browser_info | JSONB |
| ip_address | INET |
| created_at | TIMESTAMP |

---

# 12. cbt_progress_states

## Purpose

Menyimpan progress pengerjaan.

---

## Columns

| Column | Type |
|-|-|
| id | UUID |
| session_id | UUID |
| total_question | INT |
| answered_count | INT |
| unanswered_count | INT |
| flagged_count | INT |
| completion_percentage | NUMERIC |

---

# 13. Relationship Model

```

cbt_sessions

        |

        |

        +----------------+

        |                |

        v                v


cbt_session_questions   cbt_timer_states


        |

        |

        v


cbt_answers


        |

        |

        v


cbt_events



cbt_sessions

        |

        |

cbt_security_logs


```

---

# 14. Critical Runtime Tables

High transaction:

```
cbt_answers

cbt_sync_queue

cbt_events
```

---

High read:

```
cbt_session_questions

cbt_timer_states

cbt_navigation_states
```

---

# 15. Immutable Tables

Setelah submit:

```
cbt_session_questions

cbt_answers

cbt_events
```

tidak boleh dimodifikasi.

---

# 16. Data Retention

Policy:

## Active Exam

```
Permanent
```

---

## Event Log

```
Minimum 1 year
```

---

## Security Log

```
Minimum 2 years
```

---

# 17. Future Extension

Siap ditambahkan:

```
cbt_proctoring_events

cbt_ai_monitoring

cbt_behavior_analysis

cbt_eye_tracking

```

---

# 18. Final Table Architecture

```

                  SESSION


                     |

       +-------------+-------------+

       |             |             |

       v             v             v


   QUESTION       TIMER        NAVIGATION


       |

       |

     ANSWER


       |

       |

    EVENT


       |

       |

   ANALYTICS


```

---

# 19. Conclusion

Table design CBT Runtime memastikan:

- session aman;
- soal konsisten;
- jawaban reliable;
- offline sync tersedia;
- audit lengkap;
- siap menangani concurrent exam execution.

````

---

Status:

```text
10_cbt_runtime_database_schema/

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

**10_cbt_runtime_database_schema / 03_index_strategy.md**.
