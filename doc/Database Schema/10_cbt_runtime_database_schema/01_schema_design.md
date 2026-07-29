Berikut **10_cbt_runtime_database_schema / 01_schema_design.md**.

Dokumen ini mendefinisikan desain schema database khusus untuk **CBT Runtime Engine**.

Fokus:

* runtime execution;
* session state;
* question snapshot;
* answer transaction;
* synchronization;
* event tracking.

---

````markdown
# 01_schema_design.md

# YakinLulus.id CBT Runtime Database Schema Design

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime Schema adalah database layer
yang menangani eksekusi ujian secara real-time.

Schema ini berbeda dengan:

```
Exam Schema
```

karena Exam Schema menyimpan:

```
Definition

Configuration

Question Mapping
```

sedangkan CBT Runtime menyimpan:

```
Execution State

Student Progress

Answer State

Runtime Event
```

---

# 2. Database Schema Boundary

CBT Runtime menggunakan schema:

```
cbt_runtime
```

---

Struktur:

```
PostgreSQL

├── public

├── user

├── question_bank

├── exam

└── cbt_runtime

```

---

# 3. Design Principle

CBT Runtime menggunakan prinsip:

```
Immutable Snapshot

+

State Machine

+

Event Driven

+

Offline First
```

---

# 4. Runtime Data Model

High level:

```

              Exam Service

                    |

                    |

            Create CBT Session

                    |

                    v


          +------------------+

          | cbt_sessions     |

          +------------------+

                    |

                    |

          +------------------+

          | cbt_questions    |

          +------------------+

                    |

                    |

          +------------------+

          | cbt_answers      |

          +------------------+

                    |

                    |

          +------------------+

          | cbt_events       |

          +------------------+


```

---

# 5. Core Entity Design

CBT Runtime memiliki entity:

```
CBT Session

CBT Question Instance

CBT Answer

Timer State

Navigation State

Synchronization State

Runtime Event

Security Event

```

---

# 6. Schema Structure

```
cbt_runtime

|

├── cbt_sessions

|

├── cbt_session_questions

|

├── cbt_answers

|

├── cbt_timer_states

|

├── cbt_navigation_states

|

├── cbt_sync_queue

|

├── cbt_events

|

└── cbt_security_logs

```

---

# 7. CBT Session Design

## Entity

```
cbt_sessions
```

---

Purpose:

Merepresentasikan satu attempt ujian.

Contoh:

```
User A

UTBK Simulation

Attempt 1

Session XYZ

```

---

Relationship:

```
exam

1:N

cbt_session


user

1:N

cbt_session
```

---

Lifecycle:

```
CREATED

↓

INITIALIZED

↓

RUNNING

↓

PAUSED

↓

SUBMITTED

↓

COMPLETED

↓

EXPIRED

```

---

# 8. Question Snapshot Design

## Entity

```
cbt_session_questions
```

---

Purpose:

Menyimpan soal yang diberikan
kepada peserta.

---

Mengapa snapshot?

Karena:

```
Question Bank dapat berubah

tetapi

ujian yang sedang berjalan
tidak boleh berubah
```

---

Data snapshot:

```
question_version_id

sequence_number

option_order

score_weight

```

---

# 9. Answer State Design

Entity:

```
cbt_answers
```

---

Menyimpan:

```
Current Answer

Answer Timestamp

Sync Status

Validation Status

```

---

Tidak menyimpan:

```
Question Content
```

---

# 10. Timer State Design

Entity:

```
cbt_timer_states
```

---

Tujuan:

Mendukung:

```
Resume Exam

Offline Mode

Reconnect

Auto Submit
```

---

Data:

```
start_time

remaining_seconds

last_update

server_timestamp
```

---

# 11. Navigation State Design

Entity:

```
cbt_navigation_states
```

---

Menyimpan:

```
current_question

visited_question

flagged_question

review_list
```

---

Contoh:

```
Question 1

DONE


Question 2

FLAGGED


Question 3

NOT_VISITED

```

---

# 12. Synchronization Design

Entity:

```
cbt_sync_queue
```

---

Purpose:

Offline synchronization.

---

Flow:

```
Mobile Device

        |

        |

Local Queue

        |

        |

CBT Sync Service

        |

        |

PostgreSQL

```

---

# 13. Event Store Design

Entity:

```
cbt_events
```

---

Menyimpan event:

```
SESSION_STARTED

QUESTION_OPENED

ANSWER_CHANGED

SESSION_SUBMITTED

```

---

Digunakan untuk:

```
Analytics

Audit

AI Recommendation

Fraud Detection

```

---

# 14. Security Event Design

Entity:

```
cbt_security_logs
```

---

Menyimpan:

```
Tab switched

Fullscreen exit

Network disconnect

Multiple device

Suspicious activity

```

---

# 15. Data Ownership

| Data | Owner |
|-|-|
| Exam Definition | Exam Service |
| Question Content | Question Bank |
| Session Execution | CBT Runtime |
| Answer State | CBT Runtime |
| Score Calculation | Scoring Service |
| Analytics Event | Analytics Service |

---

# 16. Transaction Boundary

Transaction utama:

## Save Answer

```
BEGIN

Update Answer

Update Session Progress

Create Event

Update Sync State

COMMIT

```

---

# 17. Consistency Model

CBT Runtime menggunakan:

```
Strong Consistency

untuk:

Answer

Submission

Result


Eventual Consistency

untuk:

Analytics

Ranking

Notification

```

---

# 18. Offline Architecture

Database mendukung:

```
Client State

+

Server State

+

Sync State

```

---

Conflict resolution:

```
Latest Valid Version

+

Server Timestamp

+

Session Ownership

```

---

# 19. Partition Strategy

Future candidate:

```
cbt_answers

cbt_events

cbt_security_logs

```

Partition:

```
created_at

atau

exam_id

```

---

# 20. Cache Boundary

Redis digunakan untuk:

```
Active Session

Timer

Question Delivery

Progress State

```

---

PostgreSQL tetap menjadi:

```
Source of Truth
```

---

# 21. Scaling Model

Phase 1:

```
Single PostgreSQL

Single CBT Service

Redis Cache
```

---

Phase 2:

```
Read Replica

CBT Worker

Event Queue
```

---

Phase 3:

```
Distributed Runtime Cluster

Partitioned Database

Dedicated Sync Service
```

---

# 22. Final Schema Architecture

```

                 EXAM SERVICE

                      |

                      |

              cbt_runtime


        +-------------+--------------+

        |             |              |

        v             v              v


    Session       Runtime       Event

    State        Answer        Stream



        |

        |

     Analytics

```

---

# 23. Conclusion

CBT Runtime Schema dirancang sebagai:

```
Execution Database

+

Offline Ready Engine

+

High Concurrency System

+

Audit Friendly Platform

```

Desain ini menjadi fondasi implementasi CBT
setara platform ujian nasional/UTBK.
````

