Berikut **10_cbt_runtime_database_schema / 09_session_management.md**.

Dokumen ini menjelaskan lifecycle management dari **CBT Session** sebagai aggregate utama dalam CBT Runtime.

Fokus:

* session creation;
* initialization;
* exam execution;
* resume;
* expiration;
* submission;
* recovery;
* concurrency control.

---

````markdown id="cbt09session"
# 09_session_management.md

# YakinLulus.id CBT Runtime Session Management

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Session adalah representasi satu instance ujian yang dilakukan oleh satu peserta.

Formula:

```
1 Student

+

1 Exam

+

1 Attempt

=

1 CBT Session
```

---

Contoh:

```
Student:

Budi


Exam:

Tryout UTBK Matematika


Attempt:

1


Session:

550e8400-e29b

```

---

# 2. Session Aggregate

CBT Session menjadi aggregate root.

```
cbt_sessions
        |
        |
        +-- cbt_session_questions
        |
        +-- cbt_answers
        |
        +-- cbt_timer_states
        |
        +-- cbt_navigation_states
        |
        +-- cbt_events
        |
        +-- cbt_security_logs

```

---

# 3. Session Lifecycle

State machine:

```
CREATED

   |

   v

INITIALIZED

   |

   v

RUNNING

   |

   +----------+

   |          |

   v          v

PAUSED     SUBMITTED

   |

   |

RUNNING


SUBMITTED

   |

   v

COMPLETED

```

---

# 4. Session Creation

Trigger:

```
Student clicks Start Exam
```

---

Flow:

```
Client

 |

 |

Start Exam Request

 |

 |

Exam Service

 |

 |

CBT Runtime Service

 |

 |

Create Session

```

---

Database:

Insert:

```
cbt_sessions
```

Status:

```
CREATED
```

---

# 5. Session Initialization

Tujuan:

Mempersiapkan runtime environment.

---

Process:

```
Validate Exam

        |

Check Attempt

        |

Generate Question Snapshot

        |

Create Timer

        |

Create Navigation State

        |

Create Progress State

```

---

After success:

```
CREATED

↓

INITIALIZED
```

---

# 6. Question Snapshot Generation

Saat session dibuat:

CBT Runtime mengambil:

```
Question Version

Difficulty

Randomization

Option Order

```

---

Disimpan:

```
cbt_session_questions
```

---

Contoh:

Exam memiliki:

```
100 questions
```

Random selection:

```
40 questions
```

---

Session A:

```
1,5,20,40...
```

Session B:

```
7,9,15,60...
```

---

# 7. Session Start

Saat peserta menekan:

```
Mulai Ujian
```

---

Update:

```sql
UPDATE cbt_sessions

SET

status='RUNNING',

started_at=NOW()

WHERE id=?;

```

---

Generate event:

```
SESSION_STARTED
```

---

# 8. Runtime Validation

Setiap request CBT wajib validasi:

```
Session Exists

        +

Session Owner

        +

Session Status

        +

Token Valid

        +

Time Valid

```

---

# 9. Session Authentication

Setiap session memiliki:

```
session_token
```

---

Request:

```
Authorization:

Bearer session_token
```

---

Validation:

```
Token

+

Device

+

User

```

---

# 10. Concurrent Access Control

Problem:

User membuka:

```
Laptop

+

Phone
```

---

Strategy:

```
Single Active Device
```

---

Rule:

Default:

```
1 session

=

1 trusted device
```

---

Jika device baru:

```
Create Security Event

MULTIPLE_DEVICE
```

---

# 11. Session Heartbeat

Client mengirim:

```
heartbeat
```

periodik.

---

Example:

```
every 30 seconds
```

---

Update:

```
last_activity_at
```

---

Purpose:

Detect:

```
disconnect

abandoned session

network issue
```

---

# 12. Session Timeout

Jika:

```
NOW - last_activity_at

>

timeout threshold
```

---

Action:

```
SESSION_EXPIRED
```

---

Example:

```
30 minutes inactive
```

---

# 13. Pause Session

Digunakan untuk:

```
Network interruption

Temporary suspension

```

---

Transition:

```
RUNNING

↓

PAUSED
```

---

Saat pause:

Store:

```
timer state

navigation state

answer state
```

---

# 14. Resume Session

Flow:

```
User reconnect

        |

Validate Token

        |

Load Session

        |

Restore Timer

        |

Restore Question

        |

Continue Exam

```

---

Transition:

```
PAUSED

↓

RUNNING
```

---

# 15. Timer Synchronization

Timer tidak dipercaya dari client.

Source of truth:

```
Server Time
```

---

Formula:

```
Remaining Time

=

Exam Duration

-

(Server Now - Start Time)

```

---

Client hanya:

```
Display Timer
```

---

# 16. Auto Submit

Jika:

```
remaining_seconds = 0
```

---

System:

```
Lock Answer

Generate Submit Event

Change Status

Calculate Result

```

---

Flow:

```
RUNNING

↓

SUBMITTED

↓

COMPLETED
```

---

# 17. Manual Submit

User klik:

```
Submit Exam
```

---

Validation:

Check:

```
Answered

Flagged

Timer

Confirmation

```

---

Then:

```
SUBMITTED
```

---

# 18. Session Completion

Setelah:

```
Scoring selesai
```

---

Update:

```
COMPLETED
```

---

Generate:

```
SESSION_COMPLETED
```

---

# 19. Session Recovery

Scenario:

```
Browser crash

Internet disconnect

Device restart

```

---

Recovery:

```
Find Active Session

        |

Validate

        |

Restore State

        |

Continue

```

---

# 20. Session Locking

Untuk mencegah race condition:

gunakan:

```
Optimistic Lock
```

---

Field:

```
version_number
```

---

Example:

```
Version 5

Client Update

Version mismatch

Reject

```

---

# 21. Transaction Boundary

Critical transaction:

```
Save Answer

+

Update Progress

+

Create Event
```

---

Atomic:

```
BEGIN

Save Answer

Update Progress

Insert Event

COMMIT

```

---

# 22. Session Failure Handling

Jika error:

```
Database failure

Network failure

Service failure
```

---

Recovery:

```
Retry

Queue

Rollback

```

---

# 23. Session Cleanup

Expired session:

Process:

```
Background Worker
```

---

Action:

```
Mark EXPIRED

Archive Event

Release Resource

```

---

# 24. Session Monitoring Metrics

Monitor:

```
Active Session

Average Duration

Drop Rate

Resume Count

Submit Success Rate

```

---

# 25. Security Monitoring

Session mengawasi:

```
Tab switching

Device change

Token abuse

Clock manipulation

```

---

# 26. API Interaction

Example:

```
POST

/cbt/session/start


GET

/cbt/session/{id}


/POST

/cbt/session/{id}/answer


POST

/cbt/session/{id}/submit

```

---

# 27. Performance Requirement

Target:

```
Create Session

<200ms


Load Session

<100ms


Save Answer

<50ms

```

---

# 28. Final Session Architecture

```

Student

 |

 |

Start Exam

 |

 |

Create Session

 |

 |

Generate Snapshot

 |

 |

Run Timer

 |

 |

Answer

 |

 |

Sync

 |

 |

Submit

 |

 |

Score


```

---

# 29. Conclusion

Session Management memastikan:

- lifecycle ujian terkontrol;
- state konsisten;
- jawaban aman;
- recovery tersedia;
- siap untuk ujian online skala besar.

CBT Session menjadi fondasi utama
runtime execution YakinLulus.id.
