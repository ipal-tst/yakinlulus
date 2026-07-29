```markdown id="q7m3vx"
# 12_engineering_implementation_guide/cbt_engine/09_sync_engine.md

# Sync Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Sync Engine** pada CBT Engine YakinLulus.id.

Sync Engine bertanggung jawab melakukan sinkronisasi data antara:

- local exam runtime;
- mobile/web client;
- backend CBT service;
- database utama.

Tujuan utama:

```

Reliable Data Synchronization

*

Offline Recovery

*

Conflict Resolution

*

Data Integrity

*

High Availability

```

---

# 2. Konsep Sync Engine

Dalam mode online:


```

Student Action

```
  |

  |
```

CBT API

```
  |

  |
```

Database

```

Dalam mode offline:


```

Student Action

```
  |

  |
```

Local Storage

```
  |

  |
```

Sync Queue

```
  |

  |
```

Sync Engine

```
  |

  |
```

Backend

```
  |

  |
```

Database

```

---

# 3. Responsibility

Sync Engine menangani:


```

Detect Connection

Queue Management

Upload Pending Data

Download Server State

Conflict Resolution

Retry Mechanism

Sync Validation

Sync Audit

```

---

# 4. Sync Architecture


```

```
             Client Application


                     |

                     |

              Sync Manager


    +----------------+----------------+

    |                                 |
```

Local Queue                    Local Database

```
    |

    |
```

Sync Worker

```
    |

    |

  CBT API


    |

    |

Sync Service


    |

    |
```

PostgreSQL

```

---

# 5. Sync Data Types


Data yang disinkronkan:


## Answer Data


```

Question Answer

Answer Update

Answer Timestamp

```

---

## Session State


```

Exam Progress

Current Question

Timer State

Session Status

```

---

## Event Data


```

Exam Started

Question Visited

Answer Changed

Exam Submitted

```

---

# 6. Sync Direction


Terdapat dua arah:


## Client To Server


Push:


```

Local Answer

```
  |
```

Sync Queue

```
  |
```

Server

```


---

## Server To Client


Pull:


```

Server State

```
  |
```

Sync Response

```
  |
```

Client Update

```

---

# 7. Sync Lifecycle


```

IDLE

|

DETECT_CHANGE

|

QUEUE_CREATED

|

SYNC_PROCESS

|

VALIDATION

|

COMPLETED

|

CONFIRMED

```

---

# 8. Sync Queue Design


Setiap perubahan masuk queue.


Entity:


```

sync_queue

```


Structure:


```

id

device_id

session_id

event_type

payload

status

retry_count

created_at

synced_at

```

---

# 9. Queue Status


State:


```

PENDING

|

PROCESSING

|

SYNCED

|

FAILED

|

RETRY

```

---

# 10. Sync Process


Flow:


```

Application Detect Internet

```
    |
```

Read Pending Queue

```
    |
```

Create Sync Batch

```
    |
```

Send To Server

```
    |
```

Validate

```
    |
```

Commit Transaction

```
    |
```

Return Confirmation

```
    |
```

Remove Queue Item

```

---

# 11. Batch Synchronization


Tidak mengirim satu per satu.


Contoh:


```

100 Answers

````

Dikirim:


```json
{
 "session_id":"abc",
 "events":[
   {
    "type":"ANSWER_UPDATE",
    "question":1,
    "answer":"A"
   },
   {
    "type":"ANSWER_UPDATE",
    "question":2,
    "answer":"C"
   }
 ]
}
````

---

# 12. Idempotent Sync

Sync harus aman jika request dikirim ulang.

Menggunakan:

```
event_id

+

sync_token

+

timestamp

```

Contoh:

```
Event:

ANSWER_UPDATE_001

```

Jika diterima dua kali:

```
Process Once

Ignore Duplicate

```

---

# 13. Conflict Resolution

Konflik terjadi ketika:

```
Local State

        vs

Server State

```

Contoh:

Offline:

```
Question 5 = A

```

Server:

```
Question 5 = C

```

Strategy:

```
Timestamp Comparison

+

Session Validation

+

Audit Record

```

---

# 14. Conflict Rule

Prioritas:

```
1. Valid Session

2. Latest Timestamp

3. Server Authority

4. Manual Review

```

---

# 15. Sync API Design

Endpoint:

```
POST

/api/v1/sync/events

```

Request:

```json
{
 "session_id":"123",
 "events":[
  {
   "event_id":"001",
   "type":"ANSWER_UPDATE",
   "payload":{
     "question_id":10,
     "answer":"B"
   }
  }
 ]
}
```

Response:

```json
{
 "success":true,
 "processed":10,
 "failed":0
}
```

---

# 16. Retry Mechanism

Jika gagal:

```
Sync Failed


      |

Increase Retry Count


      |

Backoff Delay


      |

Retry

```

Strategy:

```
1 minute

5 minutes

15 minutes

```

---

# 17. Network Detection

Client melakukan:

```
Connection Check

+

Background Sync Trigger

```

Trigger:

```
Application Open

Network Available

Timer Interval

User Action

```

---

# 18. Sync Security

Protection:

```
Authentication Token

Session Validation

Encrypted Payload

Device Binding

Request Signature

```

---

# 19. Sync Transaction

Server process:

```
BEGIN


Validate Session


Validate Event


Save Data


Update Sync Status


COMMIT

```

Jika gagal:

```
ROLLBACK

```

---

# 20. Sync Event Architecture

Event:

```
AnswerSyncStarted

AnswerSyncCompleted

AnswerSyncFailed

ConflictDetected

SessionRecovered

```

---

# 21. Monitoring

Metric:

```
Sync Success Rate

Sync Failure Rate

Average Sync Time

Conflict Count

Queue Size

```

---

# 22. Performance Requirement

Target:

| Operation          | Target     |
| ------------------ | ---------- |
| Sync 100 Answers   | <2 seconds |
| Conflict Detection | <500ms     |
| Queue Processing   | Real-time  |

---

# 23. Failure Scenario

## Network Lost During Sync

```
Upload Started


        |

Connection Lost


        |

Keep Queue


        |

Retry Later

```

---

## Partial Success

Example:

```
100 Events Sent


95 Success

5 Failed

```

System:

```
Commit Success

Retry Failed Items

```

---

# 24. Offline Security Model

Question package:

```
Encrypted

+

Signed

+

Expiration Controlled

```

Answer queue:

```
Encrypted Local Storage

```

---

# 25. Scalability Strategy

## Phase 1

```
Embedded Sync Module

REST API

Local Queue

```

---

## Phase 2

```
Dedicated Sync Service

Message Queue

Worker Processing

```

---

## Phase 3

```
Distributed Sync Platform

Event Streaming

Multi Region Support

```

---

# 26. Implementation Recommendation

MVP:

```
Flutter Sync Manager

SQLite Queue

REST Sync Endpoint

Redis Worker Queue

PostgreSQL Persistence

```

Backend:

```
Go Sync Module

Background Worker

Transaction Processing

```

---

# Summary

Sync Engine YakinLulus.id menggunakan:

```
Offline Queue

+

Batch Synchronization

+

Idempotent Event Processing

+

Conflict Resolution

+

Secure Data Transfer

+

Recovery Mechanism

```

Dengan desain ini, CBT tetap dapat berjalan pada jaringan tidak stabil tanpa kehilangan jawaban dan tetap menjaga integritas data ujian.
