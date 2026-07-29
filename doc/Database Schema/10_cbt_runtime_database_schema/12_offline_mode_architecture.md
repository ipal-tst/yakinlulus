Berikut **10_cbt_runtime_database_schema / 12_offline_sync.md**.

Dokumen ini mendefinisikan desain **offline capability** untuk CBT Runtime YakinLulus.id.

Fokus:

* ujian tetap berjalan saat koneksi putus;
* local persistence;
* synchronization protocol;
* conflict resolution;
* data integrity;
* recovery mechanism.

---

````markdown id="cbt12offline"
# 12_offline_sync.md

# YakinLulus.id CBT Runtime Offline Synchronization

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Offline Sync memungkinkan peserta tetap mengerjakan ujian ketika koneksi internet terganggu.

Prinsip utama:

```
Client Continue

        |

Store Locally

        |

Reconnect

        |

Sync Safely

        |

Validate Server

        |

Persist

```

---

# 2. Offline Capability Objective

Target:

```
Network interruption

=

Tidak kehilangan jawaban
```

---

Yang tetap berjalan:

```
Question Navigation

Timer Display

Answer Selection

Progress Tracking

```

---

Yang menunggu:

```
Server Synchronization

Scoring

Analytics

```

---

# 3. Architecture Overview

```

                 Student Device


                       |

                       |

              Local Storage


                       |

                       |

              Sync Manager


                       |

              Internet Available


                       |

                       |

              CBT Runtime API


                       |

                       |

              PostgreSQL


```

---

# 4. Offline Components

Client memiliki:

```
Question Cache

Answer Queue

Event Queue

Session State

Timer State

Device Identity

```

---

# 5. Local Storage Design

Recommended:

Mobile:

```
SQLite
```

---

Web:

```
IndexedDB
```

---

Desktop:

```
SQLite
```

---

# 6. Local Session Storage

Client menyimpan:

```
session_id

session_token

exam_id

expired_time

device_id

```

---

Example:

```json
{
"session_id":
"abc-123",

"status":
"RUNNING",

"expires":
"2026-07-26T12:00:00"
}
```

---

# 7. Local Question Cache

Tujuan:

Saat offline:

```
Question tetap tersedia
```

---

Storage:

```
encrypted local database
```

---

Data:

```
question_id

question_text

options

sequence

```

---

# 8. Answer Queue

Entity:

```
pending_answers
```

---

Structure:

```
id

session_id

question_id

answer

version

timestamp

sync_status

```

---

Example:

```json
{
"question":20,

"answer":"C",

"version":5,

"status":"PENDING"
}
```

---

# 9. Offline Event Queue

Semua aktivitas disimpan.

Example:

```
QUESTION_OPENED

ANSWER_UPDATED

QUESTION_FLAGGED

```

---

Entity:

```
pending_events
```

---

# 10. Sync Trigger

Sync terjadi ketika:

## Automatic

```
Network Reconnected

Periodic Timer

Application Resume
```

---

## Manual

User:

```
Retry Sync
```

---

# 11. Sync Protocol

Flow:

```

Client

 |

 | Sync Request

 v

Sync API

 |

 | Validate

 v

Conflict Resolver

 |

 | Commit

 v

Database


```

---

# 12. Sync Request Format

Example:

```json
{
"session_id":"uuid",

"device_id":"device01",

"answers":[

{
"question":"10",

"value":"B",

"version":3

}

]
}
```

---

# 13. Server Validation

Server melakukan:

```
Authentication

+

Session Validation

+

Device Validation

+

Version Validation

+

Data Validation

```

---

# 14. Version Control

Setiap perubahan memiliki:

```
version_number
```

---

Example:

Server:

```
version 10
```

---

Client:

```
version 11
```

---

Action:

```
Accept
```

---

Client:

```
version 8
```

---

Action:

```
Reject
```

---

# 15. Conflict Resolution Strategy

Strategy:

```
Optimistic Concurrency Control
```

---

Rule:

```
Latest Valid Version Wins
```

---

Priority:

```
1. Higher Version

2. Server Timestamp

3. Device Timestamp

```

---

# 16. Sync Transaction

Setiap batch sync:

```
BEGIN


Validate Batch


Apply Changes


Create Events


Mark Synced


COMMIT

```

---

# 17. Failed Sync Handling

Jika gagal:

Status:

```
FAILED
```

---

Retry:

```
Exponential Backoff
```

---

Example:

```
1 minute

5 minutes

15 minutes

30 minutes
```

---

# 18. Duplicate Sync Protection

Masalah:

Client mengirim request dua kali.

---

Solusi:

Idempotency key:

```
sync_request_id
```

---

Database:

```
unique(sync_request_id)
```

---

# 19. Timer Synchronization Offline

Timer tetap harus valid.

---

Client:

```
Display countdown
```

---

Server:

```
Authority
```

---

Formula:

```
remaining

=

server_remaining

-

offline_duration

```

---

# 20. Offline Time Manipulation Protection

Client tidak dipercaya.

---

Detect:

```
Clock Changed

Time Jump

Negative Duration

```

---

Generate:

```
CLOCK_CHANGED
```

---

# 21. Question Cache Security

Karena soal berada di device:

Protection:

```
Encryption

Token Binding

Expiration

Device Binding

```

---

# 22. Offline Session Expiry

Jika:

```
Exam duration exceeded
```

---

Client:

```
Lock submission
```

---

Server:

```
Reject sync
```

---

# 23. Sync Queue Cleanup

Setelah:

```
SUCCESS
```

---

Client:

```
Delete local queue
```

---

Server:

```
Archive event
```

---

# 24. Offline Recovery Scenario

## Scenario 1

Network disconnect:

```
Exam Running

↓

Save Local

↓

Reconnect

↓

Sync

↓

Continue

```

---

## Scenario 2

Application Crash:

```
Restart App

↓

Restore Session

↓

Load Local State

↓

Continue

```

---

# 25. Multi Device Conflict

Scenario:

```
Laptop

+

Phone

```

---

Policy:

Default:

```
Single Active Device
```

---

Second device:

```
BLOCK

+

Security Event

```

---

# 26. Sync Monitoring Metrics

Monitor:

```
Sync Success Rate

Conflict Rate

Average Sync Delay

Offline Duration

Failed Sync Count

```

---

# 27. Performance Target

Target:

```
Sync Request

<500ms


Answer Recovery

<2 seconds


Session Restore

<3 seconds

```

---

# 28. Database Impact

High write:

```
cbt_sync_queue

cbt_events

cbt_answers
```

---

Recommended:

```
Batch Insert

Partition

Async Processing
```

---

# 29. Future Enhancement

Support:

```
Offline First Mobile App

Peer Sync

Encrypted Exam Package

Edge CBT Server

```

---

# 30. Final Architecture

```

                 CBT Runtime


                      |

                      |

              Synchronization Layer


                      |

        +-------------+-------------+

        |                           |

        v                           v


 Client Local DB              PostgreSQL


        |                           |

        +-------------+-------------+

                      |

                      v


             Event Processing


```

---

# 31. Conclusion

Offline Sync memberikan kemampuan:

- ujian tetap berjalan saat koneksi buruk;
- jawaban tidak hilang;
- konflik dapat diselesaikan;
- integritas ujian tetap terjaga.

Desain ini memungkinkan CBT YakinLulus.id digunakan pada:

```
Sekolah

Daerah dengan internet terbatas

Tryout nasional

Mass examination
```

