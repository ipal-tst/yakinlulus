# Use Case Implementation

**Document** : `backend/07_usecase_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan standar implementasi **Use Case** pada backend YakinLulus.id.

Use Case merupakan implementasi dari **Application Business Flow** yang mengorkestrasi seluruh proses bisnis dengan memanfaatkan Domain Layer tanpa menyimpan business rule inti.

Setiap fitur yang dapat dilakukan pengguna harus direpresentasikan sebagai satu atau lebih Use Case.

Contoh:

- Login
- Create Question
- Publish Question
- Import Question
- Create Exam
- Start Exam
- Submit Answer
- Finish Exam
- Generate Ranking

Use Case menjadi pintu masuk seluruh business process.

---

# 2. Posisi Use Case

```text
HTTP Handler
WebSocket
Worker
Scheduler
CLI

        │

        ▼

Application Layer

        │

   Use Case

        │

        ▼

Domain Layer

        ▲

Infrastructure
```

Use Case berada di Application Layer.

---

# 3. Tujuan Use Case

Use Case bertanggung jawab untuk:

- menerima request dari Interface Layer;
- melakukan authorization;
- mengambil Aggregate yang diperlukan;
- mengorkestrasi Domain;
- menjalankan transaction;
- menyimpan perubahan melalui Repository;
- mempublikasikan Domain Event;
- mengembalikan response.

Use Case **tidak** bertanggung jawab terhadap:

- HTTP
- SQL
- JSON
- Framework
- UI
- Database Driver

---

# 4. Karakteristik Use Case

Setiap Use Case harus memiliki karakteristik berikut:

- Single Responsibility
- Stateless
- Deterministic
- Testable
- Idempotent (bila diperlukan)
- Transaction-aware
- Framework Independent

---

# 5. Standar Struktur

```text
application/

usecase/

├── auth/
├── user/
├── question/
├── material/
├── exam/
├── cbt/
├── scoring/
├── ranking/
├── analytics/
├── notification/
├── ai/
└── file/
```

Setiap bounded context memiliki kumpulan Use Case sendiri.

---

# 6. Contoh Struktur Use Case

```text
question/

├── create_question.go
├── update_question.go
├── publish_question.go
├── archive_question.go
├── delete_question.go
├── import_question.go
└── search_question.go
```

Setiap file hanya berisi satu Use Case.

---

# 7. Naming Convention

Gunakan format:

```text
<Action><Resource>UseCase
```

Contoh:

```text
CreateQuestionUseCase

UpdateQuestionUseCase

PublishQuestionUseCase

StartExamUseCase

SubmitAnswerUseCase

FinishExamUseCase

GenerateRankingUseCase
```

Hindari nama umum seperti:

```text
QuestionService

ProcessData

Manager

Utility
```

---

# 8. Standard Execution Flow

Seluruh Use Case mengikuti pola berikut.

```text
Receive Request

↓

Validate Request

↓

Authorization

↓

Load Aggregate

↓

Execute Business Logic

↓

Persist Changes

↓

Commit Transaction

↓

Publish Domain Event

↓

Return Response
```

---

# 9. Use Case Lifecycle

```text
Interface Layer

↓

Request DTO

↓

Use Case

↓

Domain

↓

Repository

↓

Response DTO
```

Tidak boleh ada akses langsung dari Handler ke Repository.

---

# 10. Input

Input berupa DTO.

Contoh:

```text
CreateExamRequest

SubmitAnswerRequest

ImportQuestionRequest
```

DTO berasal dari Interface Layer.

---

# 11. Output

Output berupa Response DTO.

Contoh:

```text
CreateExamResponse

ExamDetailResponse

QuestionListResponse
```

Domain Entity tidak dikembalikan langsung ke Interface Layer.

---

# 12. Authorization

Authorization dilakukan di awal eksekusi.

Contoh:

```text
Teacher

↓

Create Exam

✓
```

```text
Student

↓

Create Exam

✗
```

Authorization dilakukan melalui Authorization Service atau Policy.

---

# 13. Transaction Flow

Use Case menentukan transaction boundary.

```text
Begin Transaction

↓

Business Process

↓

Repository

↓

Commit

↓

Publish Event
```

Jika terjadi kegagalan:

```text
Rollback
```

---

# 14. Repository Usage

Use Case hanya mengenal interface repository.

```text
QuestionRepository

ExamRepository

StudentRepository
```

Tidak boleh mengenal:

```text
pgx

sqlc

SQL

Redis
```

---

# 15. Aggregate Coordination

Satu Use Case dapat menggunakan beberapa Aggregate.

Contoh:

```text
Finish Exam

↓

Exam Aggregate

↓

Answer Aggregate

↓

Score Aggregate
```

Koordinasi dilakukan melalui Application Layer.

---

# 16. Domain Event

Event dipublikasikan setelah transaction berhasil.

Contoh:

```text
Answer Submitted

↓

AnswerSubmittedEvent

↓

Analytics

↓

Ranking

↓

Notification
```

Event tidak boleh dipublikasikan sebelum commit.

---

# 17. Validation Flow

Validasi dilakukan bertahap.

```text
Request Validation

↓

Authorization

↓

Business Validation

↓

Persist
```

Business validation tetap berada di Domain.

---

# 18. Error Flow

```text
Validation Error

↓

Business Error

↓

Repository Error

↓

Unexpected Error
```

Use Case menerjemahkan error menjadi Application Error.

---

# 19. Logging Strategy

Use Case mencatat:

- mulai eksekusi;
- durasi;
- kegagalan;
- retry;
- external dependency;
- transaction.

Logging dilakukan secara terstruktur menggunakan Zap.

---

# 20. Long Running Process

Proses berat dipindahkan ke Worker.

Contoh:

```text
Import Excel

↓

Queue

↓

Worker

↓

Import
```

Use Case hanya membuat Job.

---

# 21. Idempotency

Gunakan Idempotency Key untuk operasi penting.

Contoh:

```text
Submit Exam

Payment

Import

Registration
```

Request yang sama tidak boleh diproses dua kali.

---

# 22. Cross Module Communication

Gunakan Application Service atau Domain Event.

Contoh:

```text
Finish Exam

↓

Scoring

↓

Ranking

↓

Analytics

↓

Notification
```

Hindari pemanggilan langsung antar repository dari module lain jika melanggar batas bounded context.

---

# 23. Dependency Injection

Semua dependency diinjeksikan melalui constructor.

Contoh dependency:

```text
Repository

Transaction Manager

Event Publisher

Clock

ID Generator

Authorization Service

Logger
```

Tidak diperbolehkan membuat instance dependency di dalam Use Case.

---

# 24. Concurrency

Use Case harus aman dijalankan secara paralel.

Perhatikan:

- optimistic locking bila diperlukan;
- transaction isolation;
- distributed lock untuk resource bersama (future);
- idempotency.

---

# 25. Testing Strategy

Setiap Use Case wajib memiliki Unit Test.

Minimal skenario:

- Success
- Validation Failed
- Authorization Failed
- Business Rule Failed
- Repository Failed
- Transaction Failed
- Event Publish Failed (jika relevan)

Target:

```text
Business Path Coverage ≥ 90%
```

---

# 26. Anti-Patterns

### SQL di Use Case

```text
SELECT ...

❌
```

---

### HTTP Client

```text
http.Client

❌
```

---

### Redis Client

```text
redis.Get()

❌
```

---

### JSON Marshal

```text
json.Marshal()

❌
```

---

### Business Rule Berat

```text
if score > passingGrade

❌
```

Business rule harus berada di Domain.

---

### Handler Memanggil Repository

```text
Handler

↓

Repository

❌
```

Harus melalui Use Case.

---

# 27. Security Consideration

Use Case menjadi lapisan kontrol keamanan dengan:

- authorization berbasis role dan policy;
- validasi kepemilikan resource;
- audit terhadap aksi penting;
- pembatasan side effect;
- memastikan event hanya dipublikasikan setelah commit.

---

# 28. Scalability Consideration

Implementasi ini mendukung:

- CQRS
- Event Driven Architecture
- Worker terdistribusi
- Multi Queue
- Horizontal Scaling
- Service Extraction

Tanpa mengubah kontrak Use Case.

---

# 29. Future Evolution

Use Case telah dipersiapkan untuk:

- Saga Pattern
- Workflow Engine
- Internal Event Bus
- External Event Bus (Kafka/NATS/RabbitMQ)
- AI Orchestration
- Multi Tenant
- Distributed Command Handling

---

# Summary

Use Case merupakan implementasi proses bisnis pada Application Layer.

Prinsip implementasi:

- Satu Use Case untuk satu tujuan bisnis.
- Stateless dan mudah diuji.
- Mengorkestrasi Domain tanpa menyimpan business rule.
- Menentukan transaction boundary.
- Menggunakan Repository melalui interface.
- Memublikasikan Domain Event setelah commit.
- Mendukung CQRS dan Event Driven Architecture.

Dengan standar ini, seluruh proses bisnis pada YakinLulus.id akan memiliki alur yang konsisten, mudah dipelihara, dan siap berkembang menuju skala enterprise.