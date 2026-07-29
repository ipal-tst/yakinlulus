# 05_service_architecture.md

# YakinLulus.id Service Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Service Layer** pada backend YakinLulus.id.

Service Layer merupakan pusat seluruh business logic aplikasi dan menjadi satu-satunya tempat implementasi business rule.

Dokumen ini menjadi standar implementasi seluruh service agar:

* Konsisten
* Mudah diuji
* Mudah dikembangkan
* Aman
* Scalable
* Mendukung Modular Monolith

---

# 2. Service Layer Position

Service berada di antara Controller dan Repository.

```text
HTTP Request

↓

Controller

↓

Request DTO

↓

Validation

↓

Service Layer

↓

Repository

↓

Supabase PostgreSQL
```

Seluruh business rule hanya berada pada Service Layer.

---

# 3. Service Responsibilities

Service bertanggung jawab terhadap:

* Business Rule
* Transaction Management
* Orkestrasi beberapa repository
* Validasi bisnis
* Authorization bisnis
* Audit Trigger
* Domain Event
* Cache Coordination
* Queue Dispatch
* External Service Orchestration

Service **tidak** bertanggung jawab terhadap:

* HTTP Request
* JSON Parsing
* SQL Query
* Database Connection
* HTTP Response
* File Upload Protocol

---

# 4. Service Classification

Backend dibagi menjadi beberapa jenis service.

```text
Application Service

↓

Domain Service

↓

Infrastructure Adapter
```

---

## 4.1 Application Service

Mengorkestrasi satu atau lebih domain.

Contoh:

```text
CreateExam()

StartExam()

SubmitExam()

PublishMaterial()
```

Application Service dapat memanggil beberapa repository dan service lain.

---

## 4.2 Domain Service

Berisi algoritma bisnis yang kompleks.

Contoh:

```text
CalculateScore()

CalculateRanking()

QuestionRandomizer()

AdaptiveLearningEngine()

DifficultyAnalyzer()
```

Domain Service tidak mengetahui HTTP maupun database.

---

## 4.3 Infrastructure Adapter

Menghubungkan service dengan layanan eksternal.

Contoh:

* Supabase Storage
* Redis
* Asynq
* AI Service
* SMTP
* Push Notification

Adapter harus menggunakan interface sehingga implementasi dapat diganti tanpa memengaruhi business logic.

---

# 5. Standard Service Structure

Setiap module memiliki struktur berikut.

```text
service/

service.go

interface.go

impl.go

transaction.go

event.go
```

Contoh:

```text
question/

service/

question_service.go

question_transaction.go

question_event.go
```

---

# 6. Service Interface

Seluruh service harus diekspos melalui interface.

Contoh:

```go
type QuestionService interface {
    Create(ctx context.Context, req CreateQuestionRequest) error
    Update(ctx context.Context, id uuid.UUID, req UpdateQuestionRequest) error
    Archive(ctx context.Context, id uuid.UUID) error
}
```

Controller hanya bergantung pada interface.

---

# 7. Service Dependency

Contoh dependency.

```text
Question Service

↓

Question Repository

↓

Subject Service

↓

Media Service

↓

Audit Service
```

Service tidak boleh mengakses repository milik module lain secara langsung.

---

# 8. Dependency Injection

Seluruh dependency di-inject saat bootstrap aplikasi.

```text
Bootstrap

↓

Container

↓

Question Service

↓

Question Repository

↓

Database
```

Tidak diperbolehkan membuat dependency menggunakan global variable.

---

# 9. Service Communication

Komunikasi sinkron.

```text
Exam Service

↓

Question Service

↓

Question Repository
```

Komunikasi asynchronous.

```text
Exam Finished

↓

Event

↓

Analytics

↓

Ranking

↓

Notification
```

Service tidak saling memanggil melalui HTTP selama masih berada dalam Modular Monolith.

---

# 10. Transaction Boundary

Transaction hanya dibuat pada Application Service.

```text
Begin Transaction

↓

Repository A

↓

Repository B

↓

Repository C

↓

Commit
```

Jika salah satu proses gagal.

```text
Rollback
```

Repository tidak boleh membuat transaction sendiri.

---

# 11. Unit of Work

Satu transaction harus merepresentasikan satu business operation.

Contoh:

Create Exam

```text
Create Exam

↓

Save Exam

↓

Save Rule

↓

Save Question

↓

Commit
```

Bukan beberapa transaction kecil.

---

# 12. Validation Strategy

Validation dibagi menjadi dua.

## Request Validation

Controller

Contoh:

* UUID
* Email
* Enum
* Required

---

## Business Validation

Service

Contoh:

* Soal sudah dipublish
* User sudah aktif
* Kelas tersedia
* Subscription valid
* Ujian sudah dimulai

---

# 13. Authorization Strategy

Controller hanya memastikan user telah terautentikasi.

Service melakukan authorization bisnis.

Contoh:

```text
Guru

↓

Create Exam

↓

Valid?

↓

Allowed?
```

Authorization tidak ditempatkan di repository.

---

# 14. Repository Coordination

Satu service dapat menggunakan beberapa repository.

Contoh:

Question Service

```text
Question Repository

Subject Repository

Chapter Repository

Media Repository
```

Semua diorkestrasi dalam satu service.

---

# 15. Cache Strategy

Service menentukan kapan cache digunakan.

```text
Read

↓

Redis

↓

Miss

↓

Database

↓

Update Cache
```

Repository tidak mengetahui cache.

---

# 16. Queue Strategy

Operasi berat tidak dilakukan secara synchronous.

Contoh:

```text
Generate Report

↓

Push Queue

↓

Worker

↓

Generate PDF
```

Contoh lainnya:

* Email
* AI Generation
* Ranking Rebuild
* Analytics Rebuild
* Export Excel

---

# 17. Event Strategy

Service dapat menerbitkan Domain Event.

Contoh:

```text
Question Published
```

akan menghasilkan:

```text
Audit

Notification

Analytics
```

Service tidak mengetahui siapa subscriber event tersebut.

---

# 18. External Service Pattern

Semua layanan eksternal menggunakan adapter.

Contoh:

```text
Question Generator

↓

AI Adapter

↓

Python AI
```

Contoh lain:

```text
Media Service

↓

Storage Adapter

↓

Supabase Storage
```

Hal ini memudahkan penggantian penyedia layanan.

---

# 19. Service Error Handling

Service hanya mengembalikan domain error.

Contoh:

```text
ErrQuestionNotFound

ErrExamFinished

ErrPermissionDenied

ErrDuplicateEmail

ErrSubscriptionExpired
```

Controller bertugas menerjemahkan domain error menjadi HTTP status code.

---

# 20. Audit Strategy

Business operation penting harus menghasilkan audit.

Contoh:

```text
Create User

Delete Question

Publish Material

Finish CBT

Change Permission
```

Audit dilakukan setelah transaksi berhasil (commit) agar log tidak mencatat operasi yang gagal.

---

# 21. Logging Strategy

Setiap service melakukan structured logging.

Minimal:

```text
Module

Service

Operation

UserID

Duration

Error

RequestID
```

Password, token, OTP, dan data sensitif lainnya tidak boleh dicatat.

---

# 22. AI Service Integration

Seluruh AI melalui AI Adapter.

```text
Question Generator

↓

AI Adapter

↓

Python AI

↓

LLM
```

AI tidak boleh dipanggil langsung dari controller maupun repository.

---

# 23. Supabase Integration

Supabase digunakan sebagai:

* PostgreSQL
* Storage

Service tidak berkomunikasi langsung dengan Supabase SDK untuk operasi database.

Semua akses database tetap melalui Repository (GORM).

Storage diakses melalui Storage Adapter.

---

# 24. Long Running Process

Operasi berikut tidak boleh dilakukan secara synchronous:

* AI Generation
* Export PDF
* Export Excel
* Import Excel
* Ranking Nasional
* Analytics Rebuild
* Backup
* Email Massal

Gunakan Queue + Worker.

---

# 25. Idempotency

Operasi berikut harus idempotent:

* Payment Callback (Future)
* AI Callback
* Submit Exam
* Finish Exam
* Refresh Token
* Retry Queue

Duplikasi request tidak boleh menghasilkan data ganda.

---

# 26. Service Lifecycle

```text
Receive Request

↓

Business Validation

↓

Authorization

↓

Begin Transaction

↓

Repository Operation

↓

Commit

↓

Publish Event

↓

Audit

↓

Response
```

Untuk operasi tanpa perubahan data (read-only), transaction dapat dihilangkan.

---

# 27. Cross Module Orchestration

Contoh Create Exam.

```text
Exam Service

↓

Question Bank Service

↓

Question Service

↓

Academic Service

↓

Save Exam

↓

Commit
```

Contoh Finish CBT.

```text
CBT

↓

Submission

↓

Score

↓

Analytics

↓

Ranking

↓

Gamification

↓

Notification
```

Urutan di atas menjaga setiap modul fokus pada tanggung jawabnya masing-masing.

---

# 28. Background Worker Architecture

Worker hanya menjalankan pekerjaan asynchronous.

Contoh:

```text
Worker

↓

Generate AI Question

↓

Save Result

↓

Notify User
```

Worker menggunakan service yang sama dengan HTTP API sehingga business rule tetap berada pada satu tempat.

---

# 29. Testing Strategy

Service wajib memiliki Unit Test.

Repository menggunakan Integration Test.

Target cakupan:

* Business Rule
* Transaction
* Validation
* Authorization
* Error
* Event
* Cache

Layanan eksternal harus dimock melalui interface pada unit test.

---

# 30. Performance Principle

Service harus:

* Menghindari N+1 Query
* Menggunakan pagination
* Memanfaatkan cache bila sesuai
* Menghindari blocking process
* Menghindari query berulang
* Meminimalkan jumlah round-trip ke database dalam satu use case

Optimasi dilakukan berdasarkan hasil profiling dan load testing, bukan asumsi.

---

# 31. Service Design Rules

Seluruh service wajib mengikuti aturan berikut:

* Tidak mengetahui HTTP.
* Tidak mengetahui SQL.
* Tidak mengetahui implementasi repository.
* Bergantung pada interface.
* Mengelola transaction.
* Mengelola business rule.
* Mengelola orchestration.
* Menghasilkan domain event bila diperlukan.
* Tidak melakukan formatting response API.

---

# 32. Service Interaction Matrix

| Service            | Repository              | External Adapter   | Queue | Event                |
| ------------------ | ----------------------- | ------------------ | ----- | -------------------- |
| Identity           | Credential Repository   | -                  | -     | Login Event          |
| User               | User Repository         | Storage            | -     | User Updated         |
| Material           | Material Repository     | Storage            | ✓     | Material Published   |
| Question           | Question Repository     | -                  | -     | Question Updated     |
| Question Generator | Generation Repository   | AI Adapter         | ✓     | Question Generated   |
| Exam               | Exam Repository         | -                  | -     | Exam Published       |
| CBT                | Session Repository      | Redis              | -     | Exam Started         |
| Submission         | Submission Repository   | -                  | -     | Submission Finalized |
| Analytics          | Analytics Repository    | Redis              | ✓     | Analytics Updated    |
| Ranking            | Ranking Repository      | Redis              | ✓     | Ranking Updated      |
| Notification       | Notification Repository | Email/Push Adapter | ✓     | Notification Sent    |
| Report             | Report Repository       | PDF Adapter        | ✓     | Report Generated     |

---

# 33. Summary

Service Layer merupakan inti dari backend YakinLulus.id. Seluruh business rule, transaction, orkestrasi antar modul, integrasi layanan eksternal, serta koordinasi event ditempatkan pada layer ini.

Dengan pendekatan ini, backend memperoleh karakteristik berikut:

* Business logic terpusat.
* Dependency rendah.
* Mudah diuji menggunakan interface dan mock.
* Mudah dipelihara.
* Siap diskalakan.
* Konsisten dengan Clean Architecture, Modular Monolith, dan DDD Lite.
