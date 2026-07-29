```markdown id="r5k8zq"
# 12_engineering_implementation_guide/mobile/09_exam_runtime_mobile.md

# Mobile Exam Runtime Implementation

## 1. Tujuan

Dokumen ini menjelaskan rancangan implementasi CBT Exam Runtime pada aplikasi mobile YakinLulus.id.

Exam Runtime merupakan komponen paling kritikal karena harus menangani:

- pelaksanaan ujian;
- loading question package;
- timer;
- navigasi soal;
- penyimpanan jawaban;
- offline execution;
- synchronization;
- integrity validation.


Target utama:

- ujian tetap berjalan walaupun koneksi terputus;
- jawaban tidak hilang;
- state dapat dipulihkan;
- keamanan ujian terjaga;
- pengalaman pengguna setara platform CBT profesional.


---

# 2. Mobile CBT Architecture Overview


Architecture:


```

```
             Mobile CBT Runtime


                    |

          Exam Runtime Controller


                    |

    +---------------+---------------+

    |                               |
```

Question Engine                 Timer Engine

```
    |                               |
```

Answer Engine                   Session Manager

```
    |                               |

    +---------------+---------------+

                    |

            Local Storage


                    |

              Sync Engine


                    |

              Backend API
```

```id="k9h2av"


---

# 3. Exam Runtime Component


Komponen utama:


```

ExamRuntime

├── SessionManager

├── QuestionEngine

├── NavigationEngine

├── TimerEngine

├── AnswerEngine

├── ValidationEngine

└── SyncManager

```id="3d1jbf"


---

# 4. Exam Lifecycle


Lifecycle:


```

Created

|

Downloaded

|

Prepared

|

Started

|

Running

|

Submitted

|

Synced

|

Completed

```id="5z4g8n"


---

# 5. Exam Preparation Flow


Sebelum ujian:


```

Student Start Exam

```
    |
```

Validate Permission

```
    |
```

Download Exam Package

```
    |
```

Verify Package

```
    |
```

Store Local

```
    |
```

Initialize Runtime

```
    |
```

Ready

````id="5c0q4m"


---

# 6. Exam Package Structure


Package:


```json
{
  "exam_id": "EX001",
  "duration": 120,
  "question_count": 40,
  "questions": [],
  "rules": {},
  "version": 1
}
````

Isi:

````
Exam Metadata

Question Data

Answer Option

Configuration

Security Rules

``` id="0b3s6m"


---

# 7. Session Management


Setiap ujian memiliki session.


Entity:


````

ExamSession

{

sessionId

examId

studentId

deviceId

startTime

status

remainingTime

}

```id="a3n8bv"


---

# 8. Session State Machine


```

INITIALIZED

```
  |
```

READY

```
  |
```

STARTED

```
  |
```

IN_PROGRESS

```
  |
```

SUBMITTED

```
  |
```

SYNCED

```
  |
```

COMPLETED

```id="2b7x6f"


---

# 9. Question Engine


Responsibility:

- load question;
- display question;
- manage question state.


Flow:


```

Current Question

```
    |
```

Question Engine

```
    |
```

Question State

```
    |
```

UI Rendering

```id="5u9zq2"


---

# 10. Question Loading Strategy


Tidak load seluruh soal ke UI.


Strategy:


```

Question Package

```
    |
```

Local Database

```
    |
```

Load By Index

```
    |
```

Render Question

```id="5h9k7w"


Keuntungan:

- hemat memory;
- performa lebih baik;
- scalable untuk jumlah besar soal.


---

# 11. Navigation Engine


Mendukung:


```

Next Question

Previous Question

Jump Question

Flag Question

Review Question

```id="5h8d0m"


State:


```

Question Navigation State

{

currentIndex

answered

flagged

visited

}

```id="m7p4bc"


---

# 12. Timer Engine


Timer harus independent dari UI.


Architecture:


```

Timer Service

```
    |
```

Timer State

```
    |
```

Exam Controller

```
    |
```

Timer Widget

```id="0t6qfk"


---

# 13. Timer Synchronization


Timer menggunakan:


```

Server Timestamp

*

Local Countdown

*

Validation

```id="w1x6rk"


Flow:


```

Exam Start

```
    |
```

Receive Server Time

```
    |
```

Calculate Expiration

```
    |
```

Run Local Timer

```
    |
```

Periodic Check

```id="q2z4sx"


---

# 14. Timer Failure Handling


Scenario:

Application closed.


Recovery:


```

Open Application

```
    |
```

Load Session

```
    |
```

Calculate Remaining Time

```
    |
```

Resume Exam

```id="j3f8zk"


---

# 15. Answer Engine


Responsibility:


- menerima jawaban;
- validasi;
- menyimpan;
- sync.


Flow:


```

Student Select Answer

```
    |
```

Answer Engine

```
    |
```

Validate

```
    |
```

Save Local

```
    |
```

Queue Sync

```id="8q4nxv"


---

# 16. Answer State


Entity:


```

StudentAnswer

{

questionId

selectedOption

timestamp

syncStatus

}

```id="n4k7mx"


---

# 17. Auto Save Mechanism


Jawaban disimpan:


```

Immediately

```id="0z4s9q"


Bukan:


```

After Submit Button

```id="r8v2cj"


Tujuan:

- mencegah kehilangan data;
- mendukung offline.


---

# 18. Exam UI State


State:


```

ExamState

├── Session

├── CurrentQuestion

├── AnswerMap

├── Timer

├── Navigation

├── SyncStatus

└── Error

```id="7y3p9m"


---

# 19. Offline Exam Runtime Flow


```

Start Exam

```
    |
```

Disable Network

```
    |
```

Continue Exam

```
    |
```

Save Answer Local

```
    |
```

Finish Exam

```
    |
```

Reconnect

```
    |
```

Sync Submission

```
    |
```

Server Validation

```id="4w8z9p"


---

# 20. Anti Cheat Consideration


Mobile CBT harus memiliki proteksi:


## Session Validation


Validasi:


```

User

Device

Session Token

Exam Token

```id="g6n4kp"


---

## Application Protection


Implementasi:

- detect app background;
- detect session interruption;
- prevent duplicate session.


---

# 21. Exam Integrity


Setiap event penting dicatat:


```

Exam Event

{

eventType

timestamp

device

metadata

}

```id="k2s9bd"


Contoh:


```

START_EXAM

ANSWER_CHANGE

APP_BACKGROUND

SUBMIT_EXAM

SYNC_SUCCESS

```id="w5j7pc"


---

# 22. Runtime Error Handling


Error:


```

Question Load Failed

Timer Error

Storage Error

Sync Error

```id="3h8qvk"


Recovery:


```

Retry

Restore State

Notify User

Continue

```id="d4m6xr"


---

# 23. Performance Optimization


Strategi:


## Question Cache


```

Current Question

*

Next Question

```id="h5n2pw"


---

## Image Optimization


Soal dengan gambar:


```

Compressed Image

Local Cache

Lazy Loading

```id="8q6sbt"


---

## Memory Management


Hindari:


```

Load All Question Widget

```id="0h3x8m"


---

# 24. Testing Strategy


Testing wajib:


## Functional Test


```

Start Exam

Answer Question

Navigate

Submit

```id="m7v2fk"


---

## Offline Test


```

Start Exam

Disconnect Internet

Answer

Restart App

Continue

Sync

```id="k9q4ws"


---

## Failure Test


```

App Crash

Battery Lost

Network Failure

```id="z5w1cy"


---

# 25. Scalability Consideration


Architecture siap:


## Large Exam


```

100+

500+

1000+

Questions

```id="8d5m7p"


---

## Massive User Exam


Future:


```

Millions Concurrent Students

Distributed CBT Backend

```id="4f9j2k"


---

# 26. Future Evolution


Roadmap:


Phase 1:


```

Offline CBT Basic Runtime

```id="8g2p4m"


Phase 2:


```

Advanced Proctoring

Device Monitoring

```id="1w6v9r"


Phase 3:


```

AI Assisted Examination

Adaptive Testing

```id="6m8z1n"


---

# Summary


Mobile Exam Runtime YakinLulus.id menggunakan:


```

Local CBT Runtime

*

Offline First Execution

*

Independent Timer Engine

*

Automatic Answer Persistence

*

Sync Queue

*

Exam Integrity Validation

```id="q3x8nb"


Architecture ini memungkinkan:

- ujian berjalan stabil;
- jawaban aman;
- recovery saat gangguan;
- siap mendukung CBT skala besar.
```
