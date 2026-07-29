````markdown
# Application Layer Implementation

**Document** : `backend/06_application_layer_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan standar implementasi **Application Layer** pada backend YakinLulus.id.

Application Layer bertanggung jawab mengorkestrasi seluruh proses bisnis dengan menghubungkan:

- Interface Layer
- Domain Layer
- Infrastructure Layer

Application Layer **tidak menyimpan business rule inti**, tetapi mengatur bagaimana business rule dijalankan.

---

# 2. Posisi Application Layer

```text
              Interface Layer
                     │
                     ▼
          =====================
           Application Layer
          =====================
                     │
                     ▼
              Domain Layer
                     ▲
                     │
          Infrastructure Layer
```

Application Layer menjadi "orchestrator" dari seluruh sistem.

---

# 3. Tanggung Jawab

Application Layer bertanggung jawab terhadap:

- Menjalankan Use Case
- Mengatur Transaction Boundary
- Memanggil Repository
- Mengorkestrasi beberapa Domain
- Mengelola Domain Event
- Mapping DTO ↔ Domain
- Authorization berbasis Use Case
- Integrasi dengan service eksternal melalui interface

Application Layer **bukan tempat**:

- SQL
- HTTP
- Business Rule inti
- JSON Processing
- Framework Logic

---

# 4. Struktur Folder

```text
application/

├── dto/
├── command/
├── query/
├── usecase/
├── service/
├── mapper/
├── authorization/
├── event/
└── pipeline/
```

---

# 5. DTO (Data Transfer Object)

DTO digunakan sebagai media pertukaran data antar layer.

Contoh:

```text
CreateQuestionRequest

CreateExamRequest

SubmitAnswerRequest

UpdateMaterialRequest
```

DTO tidak memiliki business behavior.

Contoh alur:

```text
HTTP Request

↓

Request DTO

↓

Use Case

↓

Domain
```

---

# 6. Command

Command merepresentasikan operasi yang mengubah state.

Contoh:

```text
CreateExamCommand

SubmitAnswerCommand

PublishQuestionCommand

ImportQuestionCommand

RegisterStudentCommand
```

Karakteristik:

- Write Operation
- Memiliki side effect
- Biasanya menggunakan transaction

---

# 7. Query

Query digunakan untuk membaca data.

Contoh:

```text
GetQuestionDetailQuery

GetExamResultQuery

GetRankingQuery

SearchMaterialQuery
```

Karakteristik:

- Tidak mengubah data
- Tidak membuka transaction (kecuali diperlukan)
- Optimized untuk read

---

# 8. Use Case

Setiap proses bisnis direpresentasikan sebagai satu Use Case.

Contoh:

```text
CreateExamUseCase

SubmitAnswerUseCase

StartExamUseCase

FinishExamUseCase

ImportQuestionUseCase
```

Satu Use Case menangani satu tujuan bisnis.

---

# 9. Standar Implementasi Use Case

Setiap Use Case memiliki pola:

```text
Receive Request

↓

Validate Authorization

↓

Load Aggregate

↓

Execute Business Logic

↓

Persist Data

↓

Publish Event

↓

Return Response
```

---

# 10. Service

Application Service digunakan untuk:

- koordinasi antar Use Case;
- workflow kompleks;
- orkestrasi beberapa Aggregate.

Contoh:

```text
ExamWorkflowService

QuestionImportService

AnalyticsService

NotificationService
```

Application Service tidak menggantikan Domain Service.

---

# 11. Mapper

Mapper mengubah representasi data.

Contoh:

```text
DTO

↓

Entity
```

atau

```text
Entity

↓

Response DTO
```

Mapper tidak boleh mengandung business rule.

---

# 12. Authorization

Authorization dilakukan pada level Use Case.

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

Authorization dilakukan sebelum menjalankan business process.

---

# 13. Transaction Management

Application Layer menentukan batas transaction.

Flow:

```text
Begin Transaction

↓

Execute Use Case

↓

Repository

↓

Commit

↓

Publish Event
```

Jika gagal:

```text
Rollback
```

Domain tidak membuka transaction.

---

# 14. Repository Coordination

Application Layer dapat menggunakan lebih dari satu Repository.

Contoh:

```text
QuestionRepository

ExamRepository

MaterialRepository

StudentRepository
```

Semua koordinasi dilakukan di Use Case.

---

# 15. Domain Event Dispatch

Setelah transaction berhasil:

```text
Commit

↓

Publish Event

↓

Notification

Analytics

Ranking

AI
```

Event tidak dipublikasikan sebelum transaction berhasil.

---

# 16. Dependency Injection

Semua dependency diberikan melalui constructor.

Contoh:

```text
CreateExamUseCase

↓

ExamRepository

QuestionRepository

EventPublisher

Logger

TransactionManager
```

Tidak diperbolehkan membuat dependency secara langsung di dalam Use Case.

---

# 17. Pipeline

Workflow yang panjang dapat dipecah menjadi pipeline.

Contoh:

```text
Import Excel

↓

Validate

↓

Parse

↓

Transform

↓

Save

↓

Publish Event
```

Setiap tahap bersifat independen.

---

# 18. CQRS Ready

Application Layer dipersiapkan untuk CQRS.

```text
Command

↓

Write Model
```

```text
Query

↓

Read Model
```

Pada MVP keduanya masih dapat menggunakan database yang sama.

---

# 19. Error Handling

Application Layer menangani:

- Repository Error
- Domain Error
- Authorization Error
- Validation Error
- External Service Error

Seluruh error diterjemahkan menjadi Application Error sebelum dikirim ke Interface Layer.

---

# 20. Validation Flow

Validasi dilakukan bertingkat.

```text
HTTP Validation

↓

Application Validation

↓

Domain Validation
```

Contoh:

**HTTP Validation**

- field wajib
- format UUID
- format email

**Application Validation**

- user memiliki akses
- resource tersedia

**Domain Validation**

- aturan bisnis
- invariant

---

# 21. Logging

Application Layer melakukan logging terhadap:

- eksekusi Use Case
- durasi proses
- kegagalan workflow
- external dependency
- transaction

Business Rule di Domain tidak bergantung pada logger.

---

# 22. Idempotency

Use Case tertentu harus bersifat idempotent.

Contoh:

```text
Submit Payment

Submit Exam

Finish Exam

Import Batch
```

Request yang sama tidak boleh menghasilkan efek ganda.

---

# 23. Long Running Process

Proses yang memerlukan waktu lama dipindahkan ke Worker.

Contoh:

```text
Upload File

↓

Queue

↓

Worker

↓

Thumbnail
```

atau

```text
Import 50.000 Soal

↓

Queue

↓

Worker

↓

Processing
```

Application Layer hanya membuat job.

---

# 24. Cross Module Orchestration

Contoh:

```text
Finish Exam

↓

Update Score

↓

Generate Ranking

↓

Create Analytics

↓

Send Notification

↓

AI Recommendation
```

Semua koordinasi dilakukan melalui:

- Application Service
- Domain Event

Bukan melalui pemanggilan langsung antar Entity.

---

# 25. Retry Strategy

Untuk operasi eksternal:

```text
AI API

Storage

SMTP

Webhook
```

Retry dilakukan pada Infrastructure atau Worker, bukan di Domain.

Application Layer menentukan kebijakan kapan retry diperlukan.

---

# 26. Testing Strategy

Application Layer diuji menggunakan:

```text
Mock Repository

Mock Event Publisher

Mock Queue

Mock Storage
```

Tidak memerlukan:

- PostgreSQL
- Redis
- Supabase
- HTTP Server

Fokus pengujian adalah alur Use Case.

---

# 27. Anti-Patterns

Hindari pola berikut.

### SQL di Use Case

```text
SELECT ...

❌
```

---

### HTTP Client Langsung

```text
http.Client

❌
```

---

### Business Rule Berat

```text
if score > passingGrade ...

❌
```

Seharusnya berada di Domain.

---

### Mengakses Database Tanpa Repository

```text
pgx.Query()

❌
```

---

### Memanggil Handler Lain

```text
Handler A

↓

Handler B

❌
```

Seluruh komunikasi dilakukan melalui Use Case atau Service.

---

# 28. Security Consideration

Application Layer membantu keamanan dengan:

- validasi authorization;
- kontrol transaction;
- pembatasan akses resource;
- orkestrasi event yang aman;
- memastikan side effect hanya terjadi setelah commit.

---

# 29. Scalability Consideration

Struktur ini mendukung:

- CQRS
- Event Driven Architecture
- Background Worker
- Distributed Transaction (future)
- Service Extraction
- Horizontal Scaling

Tanpa mengubah kontrak Use Case.

---

# 30. Future Evolution

Application Layer dirancang agar siap mendukung:

- Saga Pattern
- Workflow Engine
- Event Bus (NATS/Kafka/RabbitMQ)
- Multi Tenant
- Read Model terpisah
- AI Workflow
- Serverless Worker

---

# Summary

Application Layer merupakan penghubung antara Interface, Domain, dan Infrastructure.

Prinsip implementasi:

- Mengorkestrasi Use Case.
- Menentukan transaction boundary.
- Mengelola repository.
- Memublikasikan Domain Event.
- Memisahkan Command dan Query.
- Tidak menyimpan business rule inti.
- Siap berkembang menuju CQRS dan Event Driven Architecture.

Dengan struktur ini, setiap proses bisnis memiliki alur yang jelas, mudah diuji, dan tetap konsisten terhadap prinsip Clean Architecture.
