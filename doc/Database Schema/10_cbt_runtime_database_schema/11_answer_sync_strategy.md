Berikut **10_cbt_runtime_database_schema / 11_answer_processing.md**.

Dokumen ini mendefinisikan mekanisme pemrosesan jawaban peserta pada CBT Runtime.

Fokus:

* answer lifecycle;
* validation;
* persistence;
* autosave;
* offline synchronization;
* answer locking;
* scoring handoff;
* integrity protection.

---

````markdown id="cbt11answer"
# 11_answer_processing.md

# YakinLulus.id CBT Runtime Answer Processing

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Answer Processing adalah proses menangani seluruh aktivitas jawaban peserta selama ujian berlangsung.

Mulai dari:

```
Student Select Answer

        |

Validation

        |

Persist Answer

        |

Update Progress

        |

Generate Event

        |

Sync

        |

Submit For Scoring
```

---

# 2. Answer Aggregate

Entity utama:

```
cbt_answers
```

---

Relationship:

```
CBT Session

      |

      |

Session Question

      |

      |

Answer

```

---

# 3. Answer Lifecycle

State:

```
EMPTY

 |

 v

SELECTED

 |

 v

SAVED

 |

 v

SYNCED

 |

 v

LOCKED

 |

 v

SCORED

```

---

# 4. Answer Types

CBT Runtime mendukung:

## MVP

```
MULTIPLE_CHOICE
```

---

Future:

```
ESSAY

NUMERIC

MATCHING

UPLOAD

```

---

# 5. Answer Submission Flow

Student:

```
Pilih Jawaban B
```

---

Client request:

```
POST

/cbt/session/{id}/answer
```

---

Payload:

```json
{
"session_question_id":
"uuid",

"answer_value":
"B",

"client_version":
3,

"timestamp":
"2026-07-26T10:00:00"
}
```

---

# 6. Server Validation Pipeline

Urutan validasi:

```
1. Authentication

2. Session Validation

3. Timer Validation

4. Question Validation

5. Answer Validation

6. Version Validation

7. Persistence

```

---

# 7. Session Validation

Check:

```
Session Exists

AND

Owner Match

AND

Status RUNNING

```

---

Reject jika:

```
COMPLETED

EXPIRED

SUBMITTED
```

---

# 8. Question Validation

Check:

```
Question belongs to Session

Question sequence valid

Question not removed

```

---

Example:

Invalid:

```
Student submit answer

untuk question dari exam lain
```

---

# 9. Answer Validation

Untuk multiple choice:

Allowed:

```
A

B

C

D

E

```

---

Invalid:

```
Z

NULL

UNKNOWN
```

---

# 10. Save Answer Transaction

Database transaction:

```
BEGIN


INSERT / UPDATE cbt_answers


UPDATE cbt_progress_states


INSERT cbt_events


COMMIT

```

---

Tujuan:

Atomic operation.

---

# 11. Upsert Strategy

Karena:

```
Student dapat mengganti jawaban
```

digunakan:

```
UPSERT
```

---

Example:

First:

```
Question 1 = A
```

---

Change:

```
Question 1 = C
```

---

Database:

```
UPDATE existing answer
```

---

# 12. Answer Versioning

Setiap perubahan:

```
sync_version++
```

---

Example:

Initial:

```
Version 1

Answer A
```

---

Change:

```
Version 2

Answer C
```

---

Purpose:

```
Offline conflict detection
```

---

# 13. Optimistic Locking

Field:

```
sync_version
```

---

Update rule:

```
client_version

=

server_version

```

---

Jika tidak:

```
Conflict
```

---

# 14. Answer History

Current answer:

```
cbt_answers
```

---

History:

```
cbt_events
```

---

Example:

Timeline:

```
10:01

Answer A


10:03

Change C


10:05

Change B

```

---

Event:

```
ANSWER_CREATED

ANSWER_UPDATED

```

---

# 15. Autosave Mechanism

Client melakukan:

```
periodic save
```

---

Interval:

```
5-10 seconds
```

---

Trigger:

```
Answer Changed

OR

Timer Interval

```

---

# 16. Offline Answer Processing

Saat offline:

Client menyimpan:

```
answer

timestamp

version

device_id

```

---

Local queue:

```
pending_answers
```

---

Ketika online:

```
Sync Service

      |

      |

Validation

      |

      |

Database

```

---

# 17. Offline Conflict Resolution

Scenario:

Device A:

```
Answer A

Version 5
```

---

Device B:

```
Answer C

Version 6
```

---

Rule:

```
Highest Version Wins
```

---

Conflict event:

```
ANSWER_CONFLICT
```

---

# 18. Answer Locking

Setelah:

```
SESSION_SUBMITTED
```

---

Answer menjadi:

```
READ ONLY
```

---

Tidak boleh:

```
UPDATE

DELETE

INSERT

```

---

# 19. Bulk Answer Sync

Untuk mobile:

Request:

```
POST /sync/answers
```

---

Payload:

```json
{
"answers":[

{
"id":"1",
"value":"A"
},

{
"id":"2",
"value":"C"
}

]
}
```

---

Processing:

```
Batch Validation

Batch Transaction

Batch Event

```

---

# 20. Progress Update

Setelah answer tersimpan:

Update:

```
answered_count
```

---

Formula:

```
answered_count

=

COUNT(answer)
```

---

Progress:

```
answered_count

/

total_question

x100

```

---

# 21. Event Generation

Setiap perubahan answer:

Create:

```
cbt_events
```

---

Example:

```json
{
"type":
"ANSWER_UPDATED",

"question":
10,

"old":
"A",

"new":
"C"
}
```

---

# 22. Scoring Handoff

Saat submit:

Runtime mengirim:

```
Answer Snapshot
```

ke:

```
Scoring Service
```

---

Payload:

```json
{
"session_id":

"answers":[

{
"question_id":"1",
"answer":"B"
}

]
}
```

---

# 23. Answer Integrity Protection

Protection:

```
Session Validation

Question Ownership

Version Check

Immutable Submit

Audit Event

```

---

# 24. Performance Optimization

Critical operation:

```
Save Answer
```

Target:

```
<50ms
```

---

Strategy:

```
Prepared Statement

Connection Pool

Redis Cache

Batch Sync

```

---

# 25. Failure Handling

## Database Failure

Action:

```
Rollback

Retry

Queue

```

---

## Network Failure

Action:

```
Local Storage

Retry Sync

```

---

## Duplicate Request

Action:

```
Idempotency Key

```

---

# 26. Idempotency

Setiap answer request:

memiliki:

```
request_id
```

---

Jika request sama:

```
return previous result
```

---

# 27. Security Consideration

Jangan simpan:

```
raw client trust

client timer

client score

```

---

Server authority:

```
Answer State

Timestamp

Scoring

```

---

# 28. Monitoring Metrics

Monitor:

```
Answer Save Latency

Sync Failure Rate

Conflict Rate

Average Changes

```

---

# 29. Final Architecture

```

              Student Client


                    |

                    |

              Answer API


                    |

                    |

          Answer Processing Service


                    |

       +------------+------------+

       |                         |

       v                         v


 PostgreSQL              Event Store


       |

       |

 Scoring Engine


```

---

# 30. Conclusion

Answer Processing memastikan:

- jawaban tidak hilang;
- perubahan tercatat;
- offline mode aman;
- conflict dapat diselesaikan;
- hasil ujian dapat dipercaya.

CBT Runtime memiliki mekanisme
answer handling yang siap untuk
assessment berskala besar.

````

---

Status:

```text
10_cbt_runtime_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
✅ 07_postgresql_ddl.sql
✅ 08_erdiagram.md
✅ 09_session_management.md
✅ 10_exam_execution_flow.md
✅ 11_answer_processing.md

⬜ 12_offline_sync.md
```

Berikutnya:

**10_cbt_runtime_database_schema / 12_offline_sync.md**.
