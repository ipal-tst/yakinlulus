# 10_cbt_runtime.md

# YakinLulus.id Backend Specification — CBT Runtime Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

CBT (Computer Based Test) Runtime Module merupakan **execution engine** yang menjalankan seluruh proses ujian secara real-time. Modul ini bertanggung jawab atas lifecycle ujian sejak peserta memulai ujian hingga hasil akhir disimpan.

CBT Runtime merupakan domain paling kritikal pada platform YakinLulus.id karena menangani ribuan sesi ujian secara bersamaan dengan kebutuhan konsistensi data, performa tinggi, dan toleransi terhadap gangguan jaringan.

Modul ini mengimplementasikan fitur-fitur setara platform ujian nasional dan UTBK, termasuk:

* Session Management
* Timer Management
* Question Navigation
* Auto Save
* Resume Session
* Offline Recovery
* Randomized Question Order
* Randomized Option Order
* Answer Validation
* Anti Double Submission
* Auto Submit
* Exam Locking
* Result Processing Trigger

---

# 2. Module Responsibility

CBT Runtime bertanggung jawab terhadap:

* Exam Session
* Student Attempt
* Question Delivery
* Timer Runtime
* Navigation
* Answer Submission
* Auto Save
* Resume Session
* Session Recovery
* Auto Submit
* Session Locking
* Runtime Monitoring

Module ini **tidak bertanggung jawab** terhadap:

* Exam Configuration
* Question Authoring
* Score Analytics
* Learning Material
* Notification Template

---

# 3. Architecture Position

```text id="cbt001"
Question Bank
       │
       ▼
Exam Module
       │
       ▼
========================
 CBT Runtime Engine
========================
       │
 ┌─────┼───────────────┐
 ▼     ▼               ▼
Score Analytics Notification
```

---

# 4. Business Objectives

CBT Runtime dirancang untuk:

* Menjalankan ujian secara stabil.
* Mendukung ribuan sesi aktif.
* Memastikan jawaban tidak hilang.
* Mendukung kondisi jaringan tidak stabil.
* Menjamin integritas hasil ujian.
* Menyediakan pengalaman ujian yang responsif.

---

# 5. Session Lifecycle

```text id="cbt002"
Created

↓

Waiting

↓

Started

↓

Running

↓

Paused (Optional)

↓

Resumed

↓

Finished

↓

Submitted

↓

Scored

↓

Archived
```

---

# 6. Actors

* Student
* Teacher
* Academic Admin
* System Scheduler
* Auto Submit Worker

---

# 7. RBAC

```text id="cbt003"
cbt.start

cbt.resume

cbt.answer

cbt.submit

cbt.review

cbt.monitor
```

---

# 8. Business Rules

### BR-001

Satu peserta hanya boleh memiliki satu session aktif untuk satu exam.

---

### BR-002

Question diambil dari Question Pool yang sudah dibentuk oleh Exam Module.

---

### BR-003

Question Order dapat diacak.

---

### BR-004

Option Order dapat diacak.

---

### BR-005

Jawaban otomatis disimpan setiap perubahan.

---

### BR-006

Auto Submit dilakukan ketika timer habis.

---

### BR-007

Session dapat dipulihkan apabila koneksi terputus.

---

### BR-008

Jawaban terakhir yang tersimpan menjadi jawaban resmi.

---

### BR-009

Perubahan jawaban diperbolehkan selama ujian masih berlangsung.

---

### BR-010

Setelah submit, session menjadi immutable.

---

# 9. Session State Machine

```text id="cbt004"
CREATED

↓

WAITING

↓

RUNNING

↓

FINISHED

↓

SUBMITTED

↓

SCORED
```

State tambahan:

* EXPIRED
* CANCELLED
* INVALIDATED

---

# 10. Data Model

Entity utama:

```text id="cbt005"
exam_sessions

exam_attempts

attempt_questions

attempt_answers

session_events

session_devices

runtime_logs
```

---

# 11. Relationships

```text id="cbt006"
Exam

↓

Exam Session

↓

Attempt

↓

Question

↓

Answer

↓

Score

↓

Analytics
```

---

# 12. Session Metadata

Setiap session memiliki:

* Session ID
* Exam ID
* Student ID
* Device ID
* Browser
* Operating System
* IP Address
* Start Time
* End Time
* Remaining Time
* Status
* Last Activity

---

# 13. Question Delivery Strategy

Pertanyaan dikirim secara:

* Pre-generated Question Pool
* Immutable Sequence
* Random Order
* Secure Payload
* Without Correct Answer

Backend tidak pernah mengirimkan jawaban benar ke client.

---

# 14. Navigation Model

Fitur navigasi:

* Next
* Previous
* Jump Number
* Flag Question
* Unanswered Filter
* Answered Filter
* Review Mode (Opsional)

---

# 15. Timer Strategy

Timer disimpan pada server.

Client hanya menampilkan countdown.

Server menjadi sumber kebenaran (Source of Truth).

Sinkronisasi dilakukan secara periodik.

---

# 16. Auto Save Strategy

Jawaban disimpan ketika:

* Memilih opsi.
* Berpindah soal.
* Interval waktu tertentu.
* Resume Session.
* Submit.

Auto Save bersifat idempotent.

---

# 17. Resume Strategy

Ketika peserta login kembali:

1. Validasi session aktif.
2. Ambil remaining time.
3. Ambil jawaban terakhir.
4. Lanjutkan dari soal terakhir.

---

# 18. Offline Recovery

Apabila koneksi terputus:

* Jawaban disimpan di local storage (frontend).
* Sinkronisasi dilakukan saat koneksi kembali.
* Konflik diselesaikan berdasarkan timestamp terbaru yang valid.

---

# 19. Functional Specification

Fitur:

* Start Exam
* Resume Exam
* Get Question
* Save Answer
* Update Answer
* Flag Question
* Review Navigation
* Submit Exam
* Auto Submit
* Session Recovery
* Runtime Monitoring

---

# 20. DTO

## Start Exam

```json id="cbt007"
{
  "exam_id": "uuid"
}
```

---

## Save Answer

```json id="cbt008"
{
  "question_id": "uuid",
  "selected_option": "C"
}
```

---

## Submit Exam

```json id="cbt009"
{
  "session_id": "uuid"
}
```

---

# 21. API Summary

```text id="cbt010"
POST   /api/v1/cbt/start

GET    /api/v1/cbt/session

GET    /api/v1/cbt/question/{number}

POST   /api/v1/cbt/answer

PUT    /api/v1/cbt/answer

POST   /api/v1/cbt/flag

POST   /api/v1/cbt/resume

POST   /api/v1/cbt/submit

GET    /api/v1/cbt/status
```

---

# 22. Service Layer

```text id="cbt011"
CBTRuntimeService

Start()

Resume()

GetQuestion()

SaveAnswer()

UpdateAnswer()

Flag()

Submit()

AutoSubmit()

Recover()

Monitor()
```

---

# 23. Repository Layer

```text id="cbt012"
SessionRepository

AttemptRepository

AnswerRepository

QuestionRepository

RuntimeLogRepository

DeviceRepository
```

---

# 24. Transaction Flow

```text id="cbt013"
Student

↓

Start Session

↓

Generate Attempt

↓

Load Question Pool

↓

Running

↓

Save Answer

↓

Submit

↓

Score Trigger

↓

Analytics Trigger

↓

Commit
```

---

# 25. Event Publishing

```text id="cbt014"
session.started

session.resumed

question.answered

question.flagged

session.submitted

session.expired

score.generated
```

---

# 26. Background Job

Worker:

* Auto Submit
* Session Timeout
* Runtime Cleanup
* Remaining Time Validation
* Analytics Trigger
* Cache Cleanup

---

# 27. Cache Strategy

Redis digunakan untuk:

* Active Session
* Remaining Time
* Current Question
* Student Runtime Status
* Session Lock

TTL mengikuti durasi ujian dengan buffer tambahan.

---

# 28. Concurrency Strategy

Untuk mencegah konflik:

* Distributed Lock
* Optimistic Locking
* Session Token Validation
* Duplicate Submission Detection

Hanya satu proses yang dapat memodifikasi session pada waktu yang sama.

---

# 29. Security Rules

Implementasi keamanan:

* JWT Authentication
* RBAC Authorization
* Session Validation
* Device Validation
* IP Logging
* Replay Protection
* Double Submit Prevention
* Payload Validation
* Audit Logging

---

# 30. Anti-Cheat Strategy

MVP:

* Fullscreen Detection (Frontend)
* Tab Change Detection
* Multiple Login Detection
* Duplicate Session Blocking
* Device Logging

Roadmap:

* Webcam Monitoring
* AI Proctoring
* Face Recognition
* Screen Recording Detection
* Browser Lockdown
* Clipboard Monitoring

---

# 31. Audit Log

Audit mencatat:

* Session Started
* Session Resumed
* Answer Saved
* Question Flagged
* Auto Submit
* Manual Submit
* Timeout
* Device Change
* Network Disconnect

---

# 32. Error Handling

| Code                    | Description                    |
| ----------------------- | ------------------------------ |
| SESSION_NOT_FOUND       | Session tidak ditemukan        |
| SESSION_EXPIRED         | Session telah berakhir         |
| SESSION_ALREADY_RUNNING | Session sudah aktif            |
| INVALID_QUESTION        | Soal tidak valid               |
| ANSWER_SAVE_FAILED      | Gagal menyimpan jawaban        |
| EXAM_TIME_EXPIRED       | Waktu ujian habis              |
| DUPLICATE_SUBMISSION    | Submit ganda terdeteksi        |
| ACCESS_DENIED           | Tidak berhak mengakses session |

---

# 33. Sequence Diagram

```text id="cbt015"
Student

↓

CBT API

↓

Runtime Service

↓

Redis

↓

Database

↓

Question Pool

↓

Answer Repository

↓

Submit

↓

Score Worker

↓

Analytics
```

---

# 34. Integration

CBT Runtime terintegrasi dengan:

* Authentication
* User Management
* Exam Module
* Question Bank
* Analytics
* Notification
* File Management
* AI Service (Future)

---

# 35. Performance Target

| Metric              | Target   |
| ------------------- | -------- |
| Start Session       | < 500 ms |
| Load Question       | < 150 ms |
| Save Answer         | < 100 ms |
| Resume Session      | < 300 ms |
| Submit Exam         | < 500 ms |
| Concurrent Sessions | ≥ 10.000 |

---

# 36. Test Scenario

### Unit Test

* Start Session
* Resume Session
* Save Answer
* Update Answer
* Submit
* Timer Validation

### Integration Test

* Complete Exam Flow
* Auto Save
* Auto Submit
* Session Recovery
* Question Delivery
* Cache Synchronization

### Load Test

* 10.000 concurrent sessions
* 100 answer submissions/second
* Auto Submit massal
* Redis failover
* Database connection pooling

### Security Test

* Session Hijacking
* Token Replay
* Duplicate Submission
* Broken Access Control
* Session Fixation

---

# 37. Future Enhancement

* Offline CBT Package
* AI Proctoring
* Adaptive CBT
* Voice Answer
* Essay Runtime
* Collaborative Exam
* Multi-Device Monitoring
* Live Invigilator Dashboard
* Real-Time Fraud Detection
* WebSocket-based Live Monitoring

---

# 38. Dependencies

CBT Runtime bergantung pada:

* Authentication
* User Management
* Exam Module
* Question Bank
* Redis
* PostgreSQL (Supabase)
* Notification
* Audit
* Analytics

CBT Runtime menjadi dependency utama bagi:

* Score Engine
* Student Dashboard
* Analytics
* AI Recommendation
* Leaderboard
* Progress Tracking

---

# 39. Acceptance Criteria

Module dinyatakan selesai apabila:

* Session dapat dibuat dan dipulihkan.
* Question Pool berhasil dimuat.
* Jawaban tersimpan otomatis.
* Timer dikendalikan oleh server.
* Auto Submit berjalan saat waktu habis.
* Resume Session berfungsi.
* Randomisasi soal dan opsi berjalan.
* Audit Log tersedia.
* Cache dan locking berjalan dengan benar.
* Unit, Integration, Load, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 40. Summary

CBT Runtime Module merupakan execution engine yang menjalankan seluruh proses ujian secara real-time pada YakinLulus.id. Modul ini dirancang untuk memberikan pengalaman ujian yang stabil, aman, dan skalabel melalui pengelolaan session, timer, auto save, resume, randomisasi, serta mekanisme auto submit. Dengan integrasi erat terhadap Exam Module, Question Bank, Analytics, dan Redis, CBT Runtime menjadi fondasi utama pelaksanaan ujian berbasis komputer yang mampu mendukung implementasi dari skala keluarga hingga simulasi ujian nasional dengan ribuan peserta secara bersamaan.
