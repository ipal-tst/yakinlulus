# 10_cbt_runtime_database_schema

## 00_database_overview.md

```markdown
# 00_database_overview.md

# YakinLulus.id CBT Runtime Database Overview

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime adalah engine yang menjalankan
proses Computer Based Test secara real-time.

Module ini bertanggung jawab terhadap:

- exam execution;
- student session;
- question delivery;
- answer collection;
- synchronization;
- submission;
- runtime integrity.

---

# 2. Design Objective

CBT Runtime harus memenuhi:

```

High Availability

Low Latency

Data Integrity

Offline Support

Auditability

Scalability

```

---

# 3. Runtime Architecture Position

```

```
            Question Bank

                 |

                 |

                Exam

                 |

                 |

          CBT Runtime Engine

                 |

    +------------+-------------+

    |                          |

    v                          v
```

Answer Service            Scoring Service

```
    |

    |
```

Analytics Pipeline

```

---

# 4. Core Responsibility

CBT Runtime mengelola:

## Session Lifecycle

```

CREATE

START

RUNNING

PAUSED

SUBMITTED

SYNCED

COMPLETED

```

---

## Question Runtime

```

Generate Question Set

Shuffle Question

Shuffle Option

Deliver Question

Track Progress

```

---

## Answer Runtime

```

Receive Answer

Validate

Store

Sync

Finalize

```

---

# 5. Runtime Data Characteristics

CBT Runtime memiliki karakteristik:

## High Read

Contoh:

```

Load Question

Load Session State

Load Timer

```

---

## High Write

Contoh:

```

Answer Save

Question Event

Sync Event

```

---

## High Concurrency

Contoh:

```

1000 students

start simultaneously

```

---

# 6. Runtime Database Principle

CBT menggunakan:

```

Operational Database

*

Event Store

*

Cache Layer

```

---

# 7. Database Boundary

CBT Runtime memiliki data sendiri:

```

cbt_runtime

```

---

Tidak menyimpan:

```

Question Content

Exam Definition

User Profile

```

---

Reference:

```

question_version_id

exam_id

user_id

```

---

# 8. Main Entity

Entity utama:

```

Runtime Session

Runtime Question

Runtime Answer

Sync Queue

Timer State

Navigation State

Security Event

```

---

# 9. Core Tables Overview

```

cbt_sessions

cbt_questions

cbt_answers

cbt_sync_queue

cbt_timer_states

cbt_navigation_states

cbt_events

cbt_security_logs

```

---

# 10. Runtime Flow

```

Student Login

```
  |
```

Create CBT Session

```
  |
```

Generate Question Snapshot

```
  |
```

Start Timer

```
  |
```

Answer Questions

```
  |
```

Autosave

```
  |
```

Submit

```
  |
```

Finalize

```
  |
```

Send Result

```

---

# 11. Transaction Principle

Critical transaction:

```

Answer Submission

```

harus atomic:

```

BEGIN

Save Answer

Update Progress

Create Event

COMMIT

```

---

# 12. Offline First Design

CBT Runtime mendukung:

```

Online Mode

Offline Mode

Hybrid Mode

```

---

Offline membutuhkan:

```

Local Session ID

Sync Token

Version Number

Conflict Resolution

```

---

# 13. Performance Target

Target:

## Session Creation

```

<500ms

```

---

## Load Question

```

<200ms

```

---

## Save Answer

```

<100ms

```

---

## Submit Exam

```

<2 seconds

```

---

# 14. Scalability Target

Design awal:

```

10 users

```

---

Architecture mampu berkembang:

```

10.000 concurrent users

*

Distributed CBT Worker

*

Read Replica

*

Cache Layer

```

---

# 15. Security Objective

CBT Runtime melindungi:

```

Question Exposure

Answer Manipulation

Session Hijacking

Replay Attack

Offline Data Tampering

```

---

# 16. Integration

CBT Runtime terhubung dengan:

```

Exam Service

Question Bank Service

User Service

Scoring Service

Analytics Service

Notification Service

AI Service

```

---

# 17. Final Architecture Decision

CBT Runtime menggunakan:

```

PostgreSQL

*

Redis

*

Event Queue

*

Object Storage

*

Local Device Storage

```

---

# 18. Conclusion

CBT Runtime Database dirancang sebagai:

```

Real-time Exam Execution Engine

*

Offline Capable System

*

Secure Assessment Platform

*

Analytics Ready Runtime

```

Module ini menjadi fondasi utama
pengalaman ujian YakinLulus.id.
```

