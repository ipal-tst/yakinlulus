```markdown id="r8k2mv"
# 12_engineering_implementation_guide/cbt_engine/06_answer_engine.md

# Answer Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Answer Engine** pada CBT Engine YakinLulus.id.

Answer Engine bertanggung jawab mengelola seluruh proses jawaban siswa selama ujian:

- menerima jawaban;
- menyimpan jawaban sementara;
- melakukan validasi;
- sinkronisasi jawaban;
- menjaga konsistensi data;
- menangani offline answer state;
- memastikan jawaban tidak hilang.


Target utama:


```

Fast Response

*

Reliable Storage

*

Data Consistency

*

Offline Recovery

*

Auditability

```id="8xw3my"


---

# 2. Konsep Dasar


Jawaban siswa adalah data kritikal.

Arsitektur tidak boleh hanya mengandalkan submit akhir.


Bad approach:


```

Student Answer

```
    |
```

Temporary Browser Memory

```
    |
```

Submit Exam

```
    |
```

Save Database

```id="n1t9qm"


Risiko:

- browser crash;
- koneksi terputus;
- data hilang;
- user kehilangan progress.


---

Recommended approach:


```

Student Action

```
  |
```

Local State

```
  |
```

Answer API

```
  |
```

Persistent Storage

```
  |
```

Sync State

```id="x8w4kd"


---

# 3. Answer Engine Architecture


```

```
             Student


                |

                |

          Exam Interface


                |

                |

          Answer Engine


    +-----------+------------+

    |           |            |
```

Validation   Storage      Sync

```
    |           |            |

    +-----------+------------+

                |

          PostgreSQL


                |

             Redis


                |

          Event Queue
```

```id="q7mz3p"


---

# 4. Responsibility


Answer Engine menangani:


```

Answer Creation

Answer Update

Answer Validation

Answer Persistence

Answer Synchronization

Answer Recovery

Submission Lock

Audit Logging

```id="y5m8qx"


---

# 5. Answer Lifecycle


Jawaban memiliki lifecycle:


```

EMPTY

|

SELECTED

|

SAVED

|

UPDATED

|

LOCKED

|

SUBMITTED

|

GRADED

```id="b6n3vz"


---

# 6. Answer State Definition


## EMPTY


Belum ada jawaban.


```

question_id

answer = NULL

```id="x9c4ka"


---

## SELECTED


Student memilih opsi.


Contoh:


```

Question 10

Selected:

Option B

```id="p3h8sx"


---

## SAVED


Jawaban tersimpan.


Storage:


```

Database

atau

Temporary Cache

```id="m2r9vq"


---

## UPDATED


Student mengganti jawaban.


Contoh:


```

Before:

A

After:

C

```id="j4w7kd"


---

## LOCKED


Jawaban tidak dapat diubah.


Trigger:


```

Exam Submit

Timer Expired

```id="u8q1pz"


---

## SUBMITTED


Jawaban final dikirim.


---

# 7. Answer Data Model


Entity utama:


```

student_answers

```id="w3y6tm"


Structure:


```

id

session_id

question_id

selected_answer

answer_metadata

answered_at

updated_at

status

```id="s7n2qc"


---

# 8. Answer Save Flow


Normal flow:


```

Student Select Answer

```
    |
```

Frontend Update State

```
    |
```

Send Answer Request

```
    |
```

Validate Session

```
    |
```

Validate Question

```
    |
```

Save Answer

```
    |
```

Return Success

````id="d9v4kx"


---

# 9. Answer API Pattern


Request:


```json
{
 "session_id":"xxx",
 "question_id":"123",
 "answer":"B"
}
``` id="9a4mkw"


Response:


```json
{
 "success":true,
 "saved_at":"2026-07-26T08:00:00Z"
}
``` id="h6p1zn"


---

# 10. Idempotency Strategy


Answer submission harus idempotent.


Contoh:


Request:


````

Save Question 10 = B

```id="f5m2qx"


Dikirim dua kali:


```

Result tetap:

Question 10 = B

```id="k7y4tp"


Implementasi:


```

idempotency_key

*

session_id

*

question_id

```id="p3q8mw"


---

# 11. Answer Validation


Sebelum save:


System melakukan:


```

Check Session Active

```
    |
```

Check Question Belongs To Session

```
    |
```

Check Permission

```
    |
```

Validate Answer Format

```
    |
```

Save

```id="v4m8nx"


---

# 12. Fast Answer Storage


Untuk CBT real-time:


Gunakan kombinasi:


```

Redis

*

PostgreSQL

```id="t6z2qw"


Flow:


```

Answer Request

```
  |
```

Redis Update

```
  |
```

Async Persistence

```
  |
```

PostgreSQL

````id="h8m3vy"


---

# 13. Persistent Storage Strategy


PostgreSQL tetap menjadi source of truth.


Redis hanya:


- temporary state;
- performance optimization.


---

# 14. Batch Answer Sync


Untuk efisiensi:


Client dapat mengirim:


```json
{
 "answers":[
  {
   "question_id":1,
   "answer":"A"
  },
  {
   "question_id":2,
   "answer":"C"
  }
 ]
}
``` id="m5q8xn"


Digunakan untuk:


- offline mode;
- koneksi buruk;
- mobile.


---

# 15. Answer Conflict Handling


Scenario:


Device A:

````

Question 5 = A

```


Device B:

```

Question 5 = C

```


Resolution:


```

Latest Timestamp Wins

```id="y7k2vm"


Dengan audit:


```

old_answer

new_answer

device

timestamp

```id="r4p9sx"


---

# 16. Offline Answer Architecture


```

Mobile/Web Client

```
    |
```

Local Database

```
    |
```

Offline Answer Queue

```
    |
```

Connection Available

```
    |
```

Sync Engine

```
    |
```

Server Validation

```
    |
```

Database

```id="k6n3wp"


---

# 17. Answer Recovery


Jika browser crash:


```

Login Again

```
  |
```

Restore Session

```
  |
```

Load Saved Answers

```
  |
```

Continue Exam

```id="q9x5mv"


---

# 18. Submission Lock


Ketika submit:


Transaction:


```

BEGIN

Lock Session

Validate Answers

Save Final State

Create Submission

COMMIT

```id="c3v7nz"


---

# 19. Answer Event


Event:


```

AnswerCreated

AnswerUpdated

AnswerSynced

AnswerSubmitted

```id="e8m4qx"


Consumer:


```

Analytics

Audit

Scoring Engine

```id="w2k7mc"


---

# 20. Security Consideration


Protection:


```

Session Ownership Validation

Encrypted Transport

Rate Limiting

Audit Trail

Answer Manipulation Detection

```id="n5p8zy"


---

# 21. Performance Requirement


Target:


| Operation | Target |
|-|-|
| Save Answer | <100ms |
| Batch Sync | <500ms |
| Load Answers | <300ms |
| Submit Final | <2s |


---

# 22. Failure Handling


Jika save gagal:


```

API Error

```
  |
```

Retry Queue

```
  |
```

Resend

```
  |
```

Confirm Saved

```id="x6v3qp"


---

# 23. Testing Strategy


Test:


```

Concurrent Answer Save

Network Failure

Duplicate Request

Offline Sync

Session Expired

Mass Student Submission

```id="u9m4kd"


---

# 24. Scalability Strategy


## Phase 1


```

Modular Monolith

PostgreSQL

Redis Cache

```id="v7q2mx"


---

## Phase 2


```

Queue Based Persistence

Dedicated Worker

Read Optimization

```id="g4n8zs"


---

## Phase 3


```

Distributed Answer Service

Event Streaming

High Throughput Storage

```id="z5m1kw"


---

# 25. Implementation Recommendation


MVP:


```

Go Answer Module

PostgreSQL Transaction

Redis Temporary Cache

Queue Worker

REST API

```id="p6x9vn"


Tidak perlu:


```

Separate Microservice

Complex Event Infrastructure

```id="k2m7ws"


---

# Summary


Answer Engine YakinLulus.id menggunakan:


```

Reliable Answer Persistence

*

Fast Runtime Storage

*

Idempotent API

*

Offline Support

*

Recovery Mechanism

*

Audit Trail

```


Dengan desain ini, jawaban siswa tetap aman meskipun terjadi gangguan jaringan, browser crash, atau peningkatan jumlah peserta ujian.
```
