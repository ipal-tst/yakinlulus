Berikut **24_sequence_diagram.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan interaksi antar komponen CBT Runtime menggunakan sequence diagram untuk memahami lifecycle ujian dari login sampai hasil akhir.

```markdown id="seq24cbt"
# 24_sequence_diagram.md

# YakinLulus.id CBT Sequence Diagram Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Sequence Diagram menggambarkan komunikasi antar komponen sistem selama proses CBT berjalan.

Tujuan:

- memahami alur runtime;
- mendokumentasikan interaksi service;
- membantu implementasi backend;
- mempermudah debugging;
- menjadi referensi developer.

---

# 2. System Participants


Komponen utama:


```

Student

Frontend Application

API Gateway

Authentication Service

CBT Runtime Service

Session Engine

Question Engine

Answer Engine

Timer Engine

Scoring Engine

Auto Grading Engine

Database

Cache

Event System

Background Worker

```


---

# 3. Login Sequence


## Flow


```

Student

|

| Login Request

|

Frontend

|

| Authenticate

|

Auth Service

|

| Validate User

|

Database

|

| User Data

|

Auth Service

|

| JWT Token

|

Frontend

|

| Login Success

Student

```


---

# 4. Exam Start Sequence


## Flow


```

Student

|

| Start Exam

|

CBT Runtime

|

| Validate Permission

|

Session Engine

|

| Create Session

|

Database

|

| Save Session

|

Cache

|

| Store Runtime State

|

Question Engine

|

| Generate Question Set

|

Frontend

|

| Display Question

Student

```


---

# 5. Exam Validation Sequence


Before starting:


```

CBT Runtime

|

| Check

+----------------+

|                |

v                v

Exam Schedule   Attempt Limit

|                |

+----------------+

```
    |

    v
```

Allow / Reject

```


---

# 6. Question Loading Sequence


```

Student

|

| Request Question

Frontend

|

| API Request

CBT Runtime

|

| Check Cache

Cache

|

+------------+

|            |

Hit          Miss

|            |

|            v

|       Database

|

v

Return Question

Frontend

|

Display Question

```


---

# 7. Answer Submission Sequence


```

Student

|

| Select Answer

Frontend

|

| Submit Answer

Answer Engine

|

| Validate Answer

|

+--------------+

|              |

Valid        Invalid

|              |

v              v

Save Answer    Reject

|

Database

|

Store Answer

|

Event System

|

ANSWER_SUBMITTED

```


---

# 8. Autosave Answer Sequence


Digunakan untuk:

- mencegah kehilangan jawaban;
- mendukung offline mode.


```

Frontend

|

| Autosave

Answer Engine

|

| Store Draft

Cache

|

| Temporary Save

Background Sync

|

| Persist

Database

```


---

# 9. Timer Synchronization Sequence


```

Timer Engine

|

| Get Time

Cache

|

| Timer State

|

CBT Runtime

|

| Compare

Database Server Time

|

Return Remaining Time

Frontend

|

Display Timer

```


---

# 10. Offline Sync Sequence


```

Student Device

|

| Store Local Event

Local Storage

|

Connection Available

|

Sync Request

API

|

Validate Event

Sync Engine

|

Check Duplicate

Database

|

Save Event

Event System

|

Publish Event

```


---

# 11. Question Randomization Sequence


```

Exam Created

|

Load Blueprint

|

Randomization Engine

|

Select Question Pool

|

Apply Difficulty Distribution

|

Generate Exam Snapshot

|

Save Snapshot

Database

|

Session Start

|

Deliver Questions

```


---

# 12. Exam Submit Sequence


```

Student

|

| Submit Exam

Frontend

|

CBT Runtime

|

Lock Session

Session Engine

|

Save Final Answers

Answer Engine

|

Create Scoring Job

Background Queue

|

Worker

|

Start Grading

```


---

# 13. Auto Grading Sequence


```

Background Worker

|

Load Answers

|

Auto Grading Engine

|

Load Answer Key

Database

|

Compare Answer

|

Generate Evaluation

|

Send Result

Scoring Pipeline

```


---

# 14. Scoring Sequence


```

Scoring Engine

|

Load Evaluation Result

|

Calculate Score

|

Apply Weight

|

Generate Final Result

|

Save Result

Database

|

Publish Event

RESULT_GENERATED

```


---

# 15. Result Publishing Sequence


```

Scoring Engine

|

Result Ready

|

Event System

|

RESULT_PUBLISHED

|

Notification Service

|

Notify Student

Frontend

|

Display Result

```


---

# 16. Score Recalculation Sequence


Scenario:

Answer key berubah.


```

Admin

|

Request Recalculate

|

Scoring Engine

|

Load Previous Result

|

Apply New Rule

|

Generate New Score

|

Audit Log

|

Save Version

```


---

# 17. Admin Question Update Sequence


```

Admin

|

Edit Question

|

Question Service

|

Validate Change

|

Database

|

Save New Version

|

Audit Logger

|

Record Change

|

Event Published

```


---

# 18. Security Detection Sequence


```

Security Monitor

|

Detect Anomaly

|

Security Service

|

Validate Event

|

Create Security Event

|

Audit Log

|

Notify Admin

```


---

# 19. Large Exam Processing Sequence


Untuk ribuan peserta:


```

Student

|

Submit Exam

|

API

|

Create Job

|

Queue

|

Worker Pool

|

Parallel Processing

+-------------+

|             |

Score       Analytics

|             |

Database

```


---

# 20. Full CBT Lifecycle Sequence


```

LOGIN

|

START EXAM

|

CREATE SESSION

|

LOAD SNAPSHOT

|

ANSWER QUESTIONS

|

SYNC ANSWERS

|

SUBMIT EXAM

|

AUTO GRADING

|

SCORING

|

GENERATE RESULT

|

PUBLISH RESULT

|

ANALYTICS UPDATE

```


---

# 21. Error Handling Sequence


```

Component

|

Error Occurs

|

Error Handler

|

Classify Error

|

Retry?

+---------+

|         |

Yes       No

|         |

Retry    Log

|

Notify User/Admin

```


---

# 22. Event Driven Flow


```

CBT Runtime

|

Create Event

|

Event Store

|

Event Consumer

+----------+----------+

|                     |

Analytics           Audit

|                     |

AI Engine        Monitoring

```


---

# 23. Database Interaction Pattern


Standard:


```

Request

|

Service Layer

|

Business Logic

|

Repository

|

Database

```


Tidak:


```

Frontend

|

Direct Database

```


---

# 24. Cache Interaction Pattern


```

Service

|

Check Cache

|

+--------+

|        |

Hit      Miss

|        |

Return   Database

```
       |

       v


    Update Cache
```

```


---

# 25. Security Flow


```

Request

|

Authentication

|

Authorization

|

Validation

|

Business Process

|

Audit

|

Response

```


---

# 26. Future Enhancement


Support:


```

Real Time WebSocket Event

Live Monitoring Dashboard

AI Proctoring Event

Distributed Tracing

```


---

# 27. Final Architecture


```

```
                 Student


                    |

                    |

              Frontend App


                    |

                    |

                API Layer


                    |

    +---------------+---------------+

    |               |               |

    v               v               v
```

Session         Question        Answer

```
    |               |               |

    +---------------+---------------+

                    |

                    v


             CBT Runtime Core


                    |

    +---------------+---------------+

    |                               |

    v                               v


 Scoring                       Event System


    |                               |

    v                               v


Result                         Analytics
```

```


---

# 28. Conclusion


Sequence Diagram memberikan gambaran:

- bagaimana komponen CBT berkomunikasi;
- bagaimana data bergerak;
- bagaimana proses ujian berjalan;
- bagaimana error ditangani;
- bagaimana sistem melakukan scaling.


Dengan dokumentasi ini developer dapat membangun CBT Runtime secara modular dan terukur.


```

Family MVP CBT

```
    |

    v
```

School CBT System

```
    |

    v
```

Large Scale Assessment Platform

