```markdown id="k9v3pt"
# 12_engineering_implementation_guide/cbt_engine/03_exam_session_flow.md

# Exam Session Flow Architecture

## 1. Tujuan

Dokumen ini menjelaskan bagaimana CBT Engine mengelola **Exam Session Lifecycle** ketika seorang siswa mengikuti ujian.

Exam Session adalah instance runtime dari sebuah exam yang menghubungkan:

- exam configuration;
- student;
- question set;
- timer;
- answer state;
- submission;
- scoring.


Konsep utama:

```

Exam Definition

```
    |

    |
```

Exam Session

```
    |

    |
```

Student Attempt

```


Satu exam dapat memiliki banyak session.

Contoh:

```

Try Out UTBK Matematika

```
    |

    +-- Student A Session

    +-- Student B Session

    +-- Student C Session
```

```

---

# 2. Tujuan Exam Session Engine


Exam Session Engine bertanggung jawab terhadap:


```

Session Creation

*

Eligibility Validation

*

Question Assignment

*

Timer Initialization

*

Answer Tracking

*

Session Recovery

*

Submission Handling

```

---

# 3. Exam Session Architecture


```

```
             Student


                |

                |

          CBT Frontend


                |

                |

          CBT API Layer


                |

                |

      Exam Session Service


    +-----------+------------+

    |           |            |

Question    Timer       Answer

Engine      Engine      Engine


                |

                |

          PostgreSQL

                |

                |

             Redis
```

```

---

# 4. Session Lifecycle


Exam session memiliki lifecycle:


```

CREATED

|

INITIALIZED

|

STARTED

|

IN_PROGRESS

|

SUBMITTED

|

GRADED

|

COMPLETED

```

---

# 5. Session State Definition


## CREATED


Session sudah dibuat tetapi belum dimulai.


Contoh:

```

Student klik "Mulai Ujian"

System membuat session

```


Status:

```

CREATED

```


---

## INITIALIZED


System sudah melakukan:


```

Eligibility Check

Question Allocation

Timer Preparation

Session Token Creation

```


---

## STARTED


Ujian resmi dimulai.


Aktivitas:


```

Timer Running

Question Accessible

Answer Accepted

```


---

## IN_PROGRESS


Status aktif.


Student dapat:


```

Navigate Question

Save Answer

Mark Question

Review

```


---

## SUBMITTED


Student mengirim jawaban.


Proses:


```

Lock Session

Validate Answer

Trigger Scoring

```


---

## GRADED


Scoring selesai.


Data:


```

Score

Correct Answer

Wrong Answer

Analytics Event

```


---

## COMPLETED


Semua proses selesai.


---

# 6. Session Creation Flow


Diagram:


```

Student

|

Request Start Exam

|

Authentication

|

Check Exam Availability

|

Check Student Eligibility

|

Create Exam Session

|

Generate Question Set

|

Initialize Timer

|

Return Exam Runtime

```


---

# 7. Eligibility Validation


Sebelum membuat session:


System melakukan:


```

Check User Role

```
    |
```

Check Exam Permission

```
    |
```

Check Attempt Limit

```
    |
```

Check Schedule

```
    |
```

Allow Session

```


Contoh rule:


```

Maximum Attempt = 1

Student Already Submitted

```
    |
```

Reject

```

---

# 8. Question Assignment Flow


Saat session dibuat:


```

Exam Pool

|

Question Selection Algorithm

|

Randomization Engine

|

Generate Session Question

|

Store Assignment

```


Storage:


```

exam_session_questions

```


Tujuan:


- menjaga konsistensi;
- mencegah soal berubah saat ujian berlangsung;
- mendukung audit.


---

# 9. Session Token Management


Setiap session memiliki token.


Contoh:


```

exam_session_token

```


Digunakan untuk:


```

Identify Runtime Session

Prevent Session Hijacking

Answer Validation

Offline Sync

```


---

# 10. Runtime Session Data


Data aktif:


```

Session ID

Student ID

Exam ID

Current Question

Remaining Time

Answer State

Last Activity

```


Data temporary dapat disimpan:


```

Redis

```


Data permanent:


```

PostgreSQL

```


---

# 11. Session Runtime Flow


```

Open Exam

|

Load Session

|

Validate Token

|

Load Current State

|

Display Question

|

Student Action

|

Save State

|

Continue

```


---

# 12. Answer State Management


Setiap soal memiliki state:


```

NOT_VISITED

|

VISITED

|

ANSWERED

|

MARKED

|

ANSWERED_MARKED

```


Contoh:


```

Question 1

ANSWERED

Question 2

MARKED

Question 3

NOT_VISITED

```

---

# 13. Auto Save Mechanism


Jawaban tidak hanya disimpan saat submit.


Flow:


```

Student Select Answer

```
    |
```

Frontend Local State

```
    |
```

API Save Answer

```
    |
```

Database Transaction

```
    |
```

Update Session State

```


---

# 14. Session Recovery


Jika terjadi:


- browser crash;
- internet putus;
- device restart;


Recovery:


```

Student Login Again

```
    |
```

Validate Session

```
    |
```

Load Existing State

```
    |
```

Continue Exam

```


---

# 15. Multiple Device Protection


Rule:


```

One Active Session

```


Jika login device kedua:


Option:


```

Reject

atau

Force Previous Logout

```


---

# 16. Session Timeout Handling


Jika timer habis:


```

Timer Engine

```
    |
```

Session Expired Event

```
    |
```

Lock Answer

```
    |
```

Auto Submit

```
    |
```

Scoring Pipeline

```


---

# 17. Submission Flow


```

Student Click Submit

```
    |
```

Confirm Submission

```
    |
```

Validate Completion

```
    |
```

Lock Session

```
    |
```

Save Final Answer

```
    |
```

Send Scoring Event

```
    |
```

Generate Result

```


---

# 18. Transaction Boundary


Submission harus atomic.


Contoh:


```

BEGIN

Save Answer

Lock Session

Create Submission Record

COMMIT

```


Jika gagal:


```

ROLLBACK

```


---

# 19. Event Generated


Session menghasilkan event:


```

ExamSessionCreated

ExamStarted

AnswerSubmitted

ExamSubmitted

ExamCompleted

```


Digunakan untuk:


- analytics;
- notification;
- audit.


---

# 20. Database Entity Relationship


```

Exam

|

has many

|

Exam Session

|

has many

|

Session Question

|

has many

|

Student Answer

|

one

|

Submission

```


---

# 21. Performance Consideration


Target:


| Operation | Target |
|-|-|
| Create Session | <500ms |
| Load Question | <300ms |
| Save Answer | <100ms |
| Submit Exam | <2s |


---

# 22. Security Consideration


Protection:


```

Session Token Validation

Server Side Timer

Answer Ownership Check

Audit Logging

Rate Limiting

```


---

# 23. Offline Session Consideration


Offline mode:


```

Create Session

```
    |
```

Local Runtime

```
    |
```

Store Answer Locally

```
    |
```

Sync Later

```
    |
```

Server Validation

```


---

# 24. Scalability Strategy


## Phase 1


```

Single CBT Module

PostgreSQL

Redis Session Cache

```


---

## Phase 2


```

Dedicated Session Service

Distributed Cache

Queue Processing

```


---

## Phase 3


```

Independent CBT Runtime Platform

Event Streaming

Horizontal Scaling

```


---

# Summary


Exam Session Flow YakinLulus.id menggunakan:


```

State Machine

*

Persistent Session

*

Fast Runtime Storage

*

Reliable Answer Saving

*

Recovery Capability

*

Secure Submission Flow

```


Desain ini memastikan ujian tetap stabil walaupun jumlah peserta meningkat dari internal testing hingga skala nasional.
```
