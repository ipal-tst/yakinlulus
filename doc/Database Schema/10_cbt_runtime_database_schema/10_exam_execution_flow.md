Berikut **10_cbt_runtime_database_schema / 10_exam_execution_flow.md**.

Dokumen ini mendefinisikan alur teknis lengkap bagaimana ujian dieksekusi dari awal sampai selesai pada CBT Runtime.

Fokus:

* exam launch;
* question loading;
* answer processing;
* timer enforcement;
* autosave;
* offline recovery;
* submission;
* result handoff.

---

````markdown id="cbt10execution"
# 10_exam_execution_flow.md

# YakinLulus.id CBT Runtime Exam Execution Flow

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Exam Execution Flow menjelaskan bagaimana sebuah ujian berjalan setelah peserta memulai CBT.

Lifecycle:

```
Prepare

↓

Initialize

↓

Execute

↓

Monitor

↓

Submit

↓

Evaluate

```

---

# 2. High Level Flow

```

Student

 |

 |

Open Exam

 |

 |

Create Session

 |

 |

Generate Snapshot

 |

 |

Start Runtime

 |

 |

Load Question

 |

 |

Answer Question

 |

 |

Save State

 |

 |

Submit Exam

 |

 |

Calculate Result


```

---

# 3. Actors

Komponen yang terlibat:

```
Student Client

CBT Runtime Service

Exam Service

Question Service

Scoring Service

Event Service

Notification Service

Database

Cache

```

---

# 4. Exam Launch Flow

## Step 1

Student memilih ujian.

Request:

```
GET /exam/{exam_id}
```

---

System melakukan:

```
Check Enrollment

Check Schedule

Check Availability

Check Attempt Limit

```

---

# 5. Create CBT Session

Request:

```
POST /cbt/session/start
```

---

Validation:

```
User Valid

Exam Active

Attempt Available

No Active Session

```

---

Create:

```
cbt_sessions
```

Initial state:

```
CREATED
```

---

Event:

```
SESSION_CREATED
```

---

# 6. Question Snapshot Generation

Setelah session dibuat:

Runtime meminta:

```
Question Service
```

---

Input:

```
exam_id

question_rule

difficulty_rule

randomization_rule
```

---

Process:

```
Filter Questions

↓

Select Questions

↓

Randomize Order

↓

Randomize Options

↓

Save Snapshot

```

---

Output:

```
cbt_session_questions
```

---

# 7. Runtime Initialization

Create:

```
Timer State

Navigation State

Progress State

```

---

Database transaction:

```
BEGIN


Insert Session Question

Insert Timer

Insert Navigation

Insert Progress


COMMIT

```

---

Session:

```
CREATED

↓

INITIALIZED
```

---

# 8. Exam Start Flow

Student klik:

```
MULAI UJIAN
```

---

Request:

```
POST /cbt/session/start/{id}
```

---

Update:

```
status=RUNNING

started_at=current_time
```

---

Event:

```
SESSION_STARTED
```

---

# 9. Question Delivery Flow

Student request:

```
GET /cbt/session/{id}/question/{number}
```

---

Runtime:

```
Find Session

↓

Validate Permission

↓

Find Snapshot

↓

Load Question Version

↓

Return Question

```

---

Response:

```json
{
"number":1,

"text":"Question content",

"options":[
"A",
"B",
"C",
"D"
]
}
```

---

# 10. Question State Update

Ketika question dibuka:

Update:

```
question_status

=

OPENED
```

---

Event:

```
QUESTION_OPENED
```

---

# 11. Answer Submission Flow

Student memilih:

```
Answer B
```

---

Request:

```
POST /answer
```

Payload:

```json
{
"question_id":
"uuid",

"answer":
"B"
}
```

---

Process:

```
Validate Session

↓

Validate Question

↓

Save Answer

↓

Update Progress

↓

Create Event

```

---

Transaction:

```
BEGIN


INSERT answer


UPDATE progress


INSERT event


COMMIT

```

---

# 12. Autosave Flow

CBT menggunakan:

```
Auto Save
```

---

Interval:

```
5-10 seconds
```

---

Tujuan:

Prevent:

```
Browser Crash

Network Failure

Power Loss

```

---

# 13. Offline Mode Flow

Scenario:

```
Internet Disconnect
```

---

Client:

```
Continue Exam

Store Local Queue

```

---

Local:

```
Answer Event

Timestamp

Version

```

---

Saat online:

```
Sync Queue

↓

Server Validation

↓

Persist

```

---

# 14. Sync Conflict Handling

Scenario:

```
Same answer

Different version
```

---

Rule:

```
Higher Version Wins
```

---

Example:

Server:

```
Version 5
Answer A
```

Client:

```
Version 6
Answer C
```

Result:

```
Accept Client
```

---

# 15. Timer Execution Flow

Timer source:

```
Server
```

---

Client:

```
Display Only
```

---

Formula:

```
Remaining Time

=

Duration

-

Elapsed Server Time

```

---

# 16. Timer Warning Event

Threshold:

Example:

```
10 minutes

5 minutes

1 minute

```

---

Generate:

```
TIMER_WARNING
```

---

# 17. Question Navigation Flow

Student:

```
Next

Previous

Jump Question

Flag Question

```

---

Update:

```
cbt_navigation_states
```

---

Example:

```json
{
"current":25,

"flagged":[10,15]
}
```

---

# 18. Progress Calculation

Formula:

```
Completion %

=

Answered Question

/

Total Question

x

100

```

---

Example:

```
Answered:

30


Total:

40


Progress:

75%

```

---

# 19. Anti Cheat Monitoring Flow

Runtime listens:

```
Browser Event

Device Event

Network Event

```

---

Example:

User:

```
Switch Tab
```

---

Create:

```
cbt_security_logs
```

Event:

```
TAB_SWITCH
```

---

# 20. Manual Submit Flow

Student:

```
Submit Exam
```

---

Validation:

```
Session Active

Timer Valid

Answer Saved

```

---

Update:

```
RUNNING

↓

SUBMITTED

```

---

# 21. Auto Submit Flow

Condition:

```
remaining_seconds = 0
```

---

System:

```
Lock Session

Save Pending Answer

Submit

Generate Result Event

```

---

# 22. Result Processing Flow

After submit:

Runtime sends:

```
Result Event
```

to:

```
Scoring Service
```

---

Flow:

```
CBT Runtime

        |

        |

Scoring Engine

        |

        |

Analytics

```

---

# 23. Completion Flow

After scoring:

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

# 24. Complete Sequence

```

Student

 |

 | Start

 v

Session Service

 |

 | Create

 v

CBT Session

 |

 | Snapshot

 v

Question Runtime

 |

 | Execute

 v

Answer Storage

 |

 | Submit

 v

Scoring Service

 |

 | Result

 v

Analytics


```

---

# 25. Failure Recovery

## Browser Crash

```
Reconnect

↓

Restore Session

↓

Continue
```

---

## Network Failure

```
Offline Queue

↓

Sync

↓

Continue
```

---

## Server Failure

```
Retry

↓

Recover Transaction

↓

Resume

```

---

# 26. Performance Requirement

Target:

| Operation | Target |
|-|-|
| Start Session | <200ms |
| Load Question | <100ms |
| Save Answer | <50ms |
| Sync Event | <200ms |
| Submit Exam | <500ms |

---

# 27. Final Architecture

```

              CBT EXECUTION


                 SESSION


                    |

       +------------+------------+

       |                         |

       v                         v


 QUESTION ENGINE            TIMER ENGINE


       |

       |

 ANSWER ENGINE


       |

       |

 EVENT ENGINE


       |

       |

 RESULT ENGINE


```

---

# 28. Conclusion

Exam Execution Flow memastikan:

- ujian berjalan deterministik;
- jawaban tersimpan aman;
- offline mode tersedia;
- timer valid;
- anti-cheat terintegrasi;
- hasil dapat diproses secara reliable.

CBT Runtime siap menjadi engine ujian
setara platform assessment modern.

````

