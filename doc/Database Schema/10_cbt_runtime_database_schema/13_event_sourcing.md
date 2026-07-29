Berikut **10_cbt_runtime_database_schema / 13_event_sourcing.md**.

Dokumen ini mendefinisikan strategi **event sourcing** pada CBT Runtime.

Fokus:

* audit akademik;
* immutable activity history;
* reconstruction session;
* analytics pipeline;
* fraud detection;
* integration dengan event-driven architecture.

---

````markdown id="cbt13event"
# 13_event_sourcing.md

# YakinLulus.id CBT Runtime Event Sourcing Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime menggunakan pendekatan hybrid:

```
State Database

+

Event Log
```

Bukan full event sourcing.

---

Architecture:

```
Current State

    |

    |

PostgreSQL Tables


+

Historical Events

    |

    |

Event Store

```

---

# 2. Why Event Sourcing for CBT?

Dalam sistem ujian, histori sangat penting.

Contoh:

```
Student menjawab A

kemudian mengganti B

kemudian mengganti C
```

Final answer:

```
C
```

Tetapi histori harus tetap ada:

```
A → B → C
```

---

# 3. Event Sourcing Scope

Yang menggunakan event sourcing:

```
Answer Changes

Question Navigation

Session Lifecycle

Security Events

Synchronization Events
```

---

Tidak menggunakan:

```
Master Question

User Profile

Exam Configuration

```

---

# 4. Event Store Entity

Table:

```
cbt_events
```

---

Structure:

```
event_id

aggregate_id

event_type

payload

timestamp

actor

metadata

```

---

# 5. Aggregate Concept

CBT Runtime aggregate:

```
CBT Session
```

---

Aggregate ID:

```
session_id
```

---

Semua event terkait:

```
1 Session
```

---

# 6. Event Structure

Example:

```json
{
"id":
"event-123",

"aggregate":
"session-abc",

"type":
"ANSWER_UPDATED",

"timestamp":
"2026-07-26T10:00:00",

"payload":
{
"question":10,

"old_answer":"A",

"new_answer":"C"
}

}
```

---

# 7. Event Categories

## Session Events

```
SESSION_CREATED

SESSION_INITIALIZED

SESSION_STARTED

SESSION_PAUSED

SESSION_RESUMED

SESSION_SUBMITTED

SESSION_COMPLETED

SESSION_EXPIRED
```

---

# 8. Question Events

```
QUESTION_LOADED

QUESTION_OPENED

QUESTION_VISITED

QUESTION_FLAGGED

QUESTION_UNFLAGGED
```

---

# 9. Answer Events

```
ANSWER_CREATED

ANSWER_UPDATED

ANSWER_REMOVED

ANSWER_SYNCED

ANSWER_CONFLICT
```

---

# 10. Security Events

```
TAB_SWITCH

FULLSCREEN_EXIT

MULTIPLE_DEVICE_LOGIN

CLOCK_CHANGED

INVALID_TOKEN

```

---

# 11. Event Flow

```

User Action


     |

     |

Runtime Service


     |

     |

Database Transaction


     |

     +----------------+

     |                |

     v                v


Update State      Insert Event


```

---

# 12. Transaction Pattern

Critical operation:

Answer Update

---

Transaction:

```sql
BEGIN;


UPDATE cbt_answers;


UPDATE cbt_progress_states;


INSERT cbt_events;


COMMIT;

```

---

Guarantee:

```
State

+

History

```

selalu konsisten.

---

# 13. Event Immutability

Event tidak boleh:

```
UPDATE

DELETE
```

---

Setelah insert:

```
Permanent Record
```

---

Implementasi:

```
Database Permission

+

Trigger Protection
```

---

# 14. Event Replay

Tujuan:

Membangun ulang state.

---

Example:

Events:

```
SESSION_CREATED

QUESTION_OPENED

ANSWER_UPDATED

ANSWER_UPDATED

SESSION_SUBMITTED
```

---

Replay:

```
Initial State

+

Events

=

Current State
```

---

# 15. Session Reconstruction

Scenario:

Audit:

"Bagaimana peserta mengerjakan ujian?"

---

System:

Query:

```
session_id
```

---

Replay:

```
Timeline

Question Activity

Answer History

Security Events
```

---

# 16. Audit Academic Integrity

Event sourcing memungkinkan:

Menjawab:

```
Kapan soal dibuka?

Kapan jawaban berubah?

Berapa lama mengerjakan?

Apakah pindah tab?
```

---

# 17. Analytics Integration

Event dapat dikirim ke:

```
Analytics Service

Data Warehouse

AI Analysis
```

---

Flow:

```
CBT Runtime

 |

 |

Event Stream

 |

 |

Analytics Pipeline

```

---

# 18. Event Publishing

Recommended:

```
Outbox Pattern
```

---

Flow:

```
Database Transaction


      |

      |

Outbox Event


      |

      |

Message Broker


      |

      |

Consumer

```

---

# 19. Outbox Table

Future:

```
cbt_event_outbox
```

---

Columns:

```
id

event_type

payload

published

created_at
```

---

# 20. Event Ordering

Masalah:

Event datang tidak berurutan.

---

Solusi:

gunakan:

```
sequence_number
```

---

Example:

```
1 SESSION_STARTED

2 QUESTION_OPENED

3 ANSWER_UPDATED

```

---

# 21. Event Versioning

Karena payload berubah.

---

Example:

Version 1:

```json
{
"answer":"A"
}
```

---

Version 2:

```json
{
"old":"A",
"new":"B"
}
```

---

Field:

```
event_version
```

---

# 22. Event Retention

Policy:

Academic event:

```
Minimum 2 years
```

---

Security event:

```
Minimum 2-5 years
```

---

# 23. Event Partitioning

Karena volume besar:

Table:

```
cbt_events
```

---

Partition:

```
created_at
```

---

Example:

```
cbt_events_2026_01

cbt_events_2026_02

```

---

# 24. Event Query Pattern

Common:

## Session Timeline

```sql
SELECT *

FROM cbt_events

WHERE session_id=?

ORDER BY created_at;
```

---

## Security Analysis

```sql
SELECT *

FROM cbt_events

WHERE event_type='TAB_SWITCH';
```

---

# 25. Event Storage Optimization

Gunakan:

```
JSONB payload

GIN index

Partition

Compression
```

---

# 26. Security Event Processing

Security event:

```
Generated

        |

Risk Scoring

        |

Alert

        |

Action
```

---

Example:

```
10 tab switch

+

Multiple device

=

High Risk
```

---

# 27. Event Driven Architecture

Future:

```

CBT Runtime


    |

    |

Event Bus


    |

+---+---+---+

|       |   |

Analytics AI Notification


```

---

# 28. Event Failure Handling

Jika publish gagal:

```
Event tetap aman di database
```

---

Retry worker:

```
Background Job
```

---

# 29. Performance Requirement

Event insert:

```
<20ms
```

---

Tidak boleh:

```
Block Answer Transaction
```

---

# 30. Final Event Architecture

```

             CBT Session


                  |

                  |

            Runtime State


                  |

                  |

             Event Store


                  |

        +---------+---------+

        |                   |

        v                   v


   Analytics          Security


```

---

# 31. Conclusion

Event sourcing CBT Runtime memberikan:

- audit lengkap;
- histori jawaban;
- forensic capability;
- analytics real-time;
- integrasi AI;
- academic integrity.

Dengan pendekatan hybrid event sourcing,
CBT Runtime tetap cepat sekaligus memiliki
rekam jejak lengkap.

