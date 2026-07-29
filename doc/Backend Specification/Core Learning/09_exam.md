# 09_exam.md

# YakinLulus.id Backend Specification — Exam Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Exam Module bertanggung jawab mengelola seluruh konfigurasi ujian pada platform YakinLulus.id. Modul ini menjadi penghubung antara **Question Bank** dan **CBT Runtime**, serta menyediakan mekanisme pembuatan, pengaturan, publikasi, dan pengelolaan berbagai jenis ujian.

Modul ini hanya mengelola **definisi ujian (Exam Definition)**, sedangkan proses pengerjaan ujian oleh peserta dikelola oleh **CBT Runtime Module**.

Exam Module mendukung berbagai skenario seperti:

* Latihan Soal
* Quiz
* Ulangan Harian
* PTS
* PAS
* Try Out
* Simulasi UTBK
* Ujian Sekolah
* Placement Test

---

# 2. Module Responsibility

Exam Module bertanggung jawab terhadap:

* Exam Master
* Exam Blueprint
* Exam Configuration
* Question Mapping
* Question Pool
* Randomization Configuration
* Exam Rule
* Exam Publishing
* Exam Scheduling
* Exam Eligibility
* Exam Versioning
* Exam Duplication

Module ini **tidak bertanggung jawab** terhadap:

* Student Attempt
* Timer Runtime
* Auto Save
* Anti Cheat
* Answer Submission
* Score Calculation

---

# 3. Architecture Position

```text
Question Bank
      │
      ▼
 Exam Module
      │
      ▼
 CBT Runtime
      │
      ▼
 Analytics
```

---

# 4. Business Objectives

Exam Module dirancang untuk:

* Menyusun ujian berdasarkan blueprint akademik.
* Mendukung bank soal skala besar.
* Mendukung randomisasi soal.
* Mendukung banyak jenis ujian.
* Mendukung konfigurasi fleksibel.
* Menjadi sumber konfigurasi CBT Engine.

---

# 5. Exam Lifecycle

```text
Draft

↓

Configured

↓

Reviewed

↓

Published

↓

Scheduled

↓

Active

↓

Completed

↓

Archived
```

---

# 6. Actors

* Platform Admin
* Academic Admin
* Teacher
* School Admin
* AI Service (Future)

---

# 7. RBAC

```text
exam.read

exam.create

exam.update

exam.publish

exam.schedule

exam.archive

exam.duplicate
```

---

# 8. Business Rules

### BR-001

Exam wajib memiliki minimal satu Subject.

---

### BR-002

Exam wajib memiliki minimal satu Question Pool.

---

### BR-003

Exam dapat menggunakan lebih dari satu Subject (contoh: UTBK/TKA).

---

### BR-004

Question hanya boleh berasal dari Question Bank yang berstatus Active.

---

### BR-005

Question tidak boleh muncul lebih dari satu kali dalam satu attempt.

---

### BR-006

Jumlah soal yang ditampilkan dapat lebih sedikit dari jumlah soal dalam pool.

---

### BR-007

Randomisasi mengikuti blueprint ujian.

---

### BR-008

Perubahan Exam menghasilkan versi baru.

---

# 9. Supported Exam Type

MVP

* Practice
* Quiz
* Daily Test
* Mid Test (PTS)
* Final Test (PAS)
* Try Out
* School Exam
* UTBK Simulation

Future

* Adaptive Exam
* Placement Test
* Certification Exam
* Olympiad
* Diagnostic Test

---

# 10. Exam Blueprint

Blueprint menentukan komposisi soal.

Contoh:

| Subject    | Chapter | Difficulty | Total |
| ---------- | ------- | ---------: | ----: |
| Matematika | Bab 1   |       Easy |    10 |
| Matematika | Bab 2   |     Medium |    15 |
| Matematika | Bab 3   |       Hard |    15 |

Blueprint menjadi dasar proses randomisasi.

---

# 11. Data Model

Entity utama:

```text
exams

exam_versions

exam_subjects

exam_blueprints

exam_question_pool

exam_rules

exam_schedules

exam_participants

exam_statistics
```

---

# 12. Relationships

```text
Question Bank

↓

Question Pool

↓

Exam

↓

CBT Runtime

↓

Analytics
```

---

# 13. Exam Metadata

Metadata meliputi:

* Exam Code
* Exam Name
* Description
* Exam Type
* Curriculum
* Education Level
* Grade
* Duration
* Passing Score
* Status
* Version

---

# 14. Exam Rule

Rule yang dapat dikonfigurasi:

* Duration
* Passing Grade
* Total Question
* Shuffle Question
* Shuffle Option
* Show Result
* Show Explanation
* Allow Resume
* Allow Review
* Maximum Attempt
* Exam Window
* Time Zone

---

# 15. Question Selection Strategy

Metode:

* Manual Selection
* Blueprint Based
* Random Pool
* AI Recommendation (Future)

Randomisasi memperhatikan:

* Subject
* Chapter
* Difficulty
* Tag
* Exclusion Rule

---

# 16. Use Cases

Academic Admin

* Membuat ujian.
* Mengatur blueprint.
* Publish ujian.

Teacher

* Membuat latihan.
* Menentukan soal.
* Mengatur jadwal.

Student

* Tidak memiliki akses langsung ke modul ini.

---

# 17. Functional Specification

Fitur:

* Create Exam
* Update Exam
* Duplicate Exam
* Versioning
* Schedule Exam
* Publish Exam
* Archive Exam
* Configure Rule
* Configure Blueprint
* Configure Pool
* Search Exam

---

# 18. DTO

## Create Exam

```json
{
  "name": "Try Out UTBK 2027",
  "exam_type": "TRY_OUT",
  "duration": 120,
  "total_question": 100
}
```

---

## Response

```json
{
  "id": "uuid",
  "status": "DRAFT"
}
```

---

# 19. Validation Rules

| Field          | Rule                     |
| -------------- | ------------------------ |
| Name           | Required                 |
| Exam Type      | Enum                     |
| Duration       | > 0                      |
| Total Question | > 0                      |
| Blueprint      | Required sebelum Publish |
| Rule           | Required                 |

---

# 20. API Summary

```text
GET    /api/v1/exams

GET    /api/v1/exams/{id}

POST   /api/v1/exams

PUT    /api/v1/exams/{id}

DELETE /api/v1/exams/{id}

POST   /api/v1/exams/{id}/publish

POST   /api/v1/exams/{id}/duplicate

POST   /api/v1/exams/{id}/schedule

POST   /api/v1/exams/{id}/archive
```

---

# 21. Service Layer

```text
ExamService

Create()

Update()

Publish()

Archive()

Duplicate()

Schedule()

ConfigureBlueprint()

ConfigureRule()

GenerateQuestionPool()

Search()
```

---

# 22. Repository Layer

```text
ExamRepository

BlueprintRepository

RuleRepository

QuestionPoolRepository

ScheduleRepository

StatisticsRepository
```

---

# 23. Transaction Flow

```text
Create Exam

↓

Validation

↓

Save Exam

↓

Save Blueprint

↓

Save Rule

↓

Generate Pool

↓

Audit

↓

Commit
```

---

# 24. Event Publishing

```text
exam.created

exam.updated

exam.published

exam.scheduled

exam.archived

exam.duplicated

exam.question_pool.generated
```

---

# 25. Background Job

Job:

* Question Pool Generation
* Schedule Activation
* Schedule Expiration
* Cache Refresh
* Statistics Aggregation
* Notification Trigger

---

# 26. Cache Strategy

Redis menyimpan:

* Exam Detail
* Active Exam
* Exam Rule
* Question Pool
* Blueprint

TTL

```text
1 Hour
```

---

# 27. Search Strategy

Filter:

* Exam Name
* Type
* Subject
* Curriculum
* Status
* Created By
* Date
* Published

Sorting:

* Name
* Created Date
* Schedule
* Status

---

# 28. File Storage

Asset:

* Cover Image
* Banner
* Instruction PDF
* Exam Attachment

Supabase Storage:

```text
exam-banner/

exam-attachment/

exam-cover/
```

---

# 29. Security Rules

* JWT Authentication
* RBAC Authorization
* Blueprint Validation
* Question Pool Validation
* Audit Logging
* Soft Delete

---

# 30. Audit Log

Audit mencatat:

* Exam Created
* Exam Updated
* Blueprint Updated
* Publish
* Schedule
* Archive
* Duplicate

---

# 31. Error Handling

| Code                   | Description           |
| ---------------------- | --------------------- |
| EXAM_NOT_FOUND         | Ujian tidak ditemukan |
| INVALID_BLUEPRINT      | Blueprint tidak valid |
| INVALID_RULE           | Rule tidak valid      |
| QUESTION_POOL_EMPTY    | Pool soal kosong      |
| EXAM_ALREADY_ACTIVE    | Ujian sudah aktif     |
| EXAM_ALREADY_SCHEDULED | Jadwal sudah ada      |

---

# 32. Sequence Diagram

```text
Teacher

↓

Exam API

↓

Exam Service

↓

Question Pool Service

↓

Repository

↓

Database

↓

Redis

↓

Audit

↓

Response
```

---

# 33. Integration

Exam Module terintegrasi dengan:

* Authentication
* User Management
* School Management
* Curriculum
* Subject
* Chapter
* Question Bank
* CBT Runtime
* Analytics
* Notification
* File Management

Exam Module menjadi sumber konfigurasi utama bagi CBT Runtime.

---

# 34. Performance Target

| Metric        | Target   |
| ------------- | -------- |
| Create Exam   | < 300 ms |
| Publish Exam  | < 500 ms |
| Generate Pool | < 2 s    |
| Search Exam   | < 300 ms |
| Exam Detail   | < 150 ms |

---

# 35. Test Scenario

### Unit Test

* Create Exam
* Update Exam
* Duplicate Exam
* Publish Exam
* Generate Blueprint
* Validation Rule

### Integration Test

* CRUD Exam
* Question Pool
* Schedule
* Notification
* Cache Refresh

### Security Test

* Unauthorized Access
* Invalid Blueprint
* Invalid Pool
* Soft Delete
* Broken Access Control

---

# 36. Future Enhancement

* Adaptive Exam
* AI Blueprint Generator
* Automatic Question Balancing
* Competency-Based Exam
* Multi-Section Exam
* Parallel Exam Session
* Offline Exam Package
* Exam Template Marketplace
* AI Difficulty Optimizer

---

# 37. Dependencies

Module bergantung pada:

* Authentication
* User Management
* Curriculum
* Subject
* Chapter
* Question Bank
* Redis
* Supabase Storage
* Notification
* Audit

Exam Module menjadi dependency langsung bagi:

* CBT Runtime
* Analytics
* AI Recommendation
* Student Dashboard

---

# 38. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD Exam berjalan.
* Blueprint dapat dikonfigurasi.
* Rule dapat dikonfigurasi.
* Question Pool berhasil dibuat.
* Publish berjalan.
* Schedule berjalan.
* Cache diperbarui otomatis.
* Audit Log tersedia.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 39. Summary

Exam Module merupakan lapisan konfigurasi ujian pada YakinLulus.id yang menghubungkan Question Bank dengan CBT Runtime. Modul ini menyediakan mekanisme penyusunan blueprint, pengaturan aturan ujian, pembentukan question pool, penjadwalan, dan publikasi ujian secara fleksibel. Dengan dukungan versioning, randomisasi, serta integrasi dengan Analytics dan Notification, modul ini menjadi fondasi utama untuk pelaksanaan berbagai jenis evaluasi pembelajaran, mulai dari latihan harian hingga simulasi UTBK berskala besar.
