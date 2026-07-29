Dokumen berikutnya adalah **16_service_layer.md**. Ini merupakan jantung dari backend Question Bank karena menjadi batas antara API/Controller dengan Repository. Seluruh business logic harus berada di Service Layer, bukan di controller maupun repository.

Untuk arsitektur yang telah kita bangun (Go + Clean Architecture + DDD + Event-Driven), saya menyarankan Service Layer dipisahkan menjadi beberapa service kecil berdasarkan bounded context, bukan satu `QuestionService` yang sangat besar.

---

````markdown
# 16_service_layer.md

# Question Bank Service Layer Specification

Version : 1.0

---

# 1. Overview

Service Layer bertanggung jawab mengimplementasikan seluruh business logic Question Bank.

Service Layer menjadi penghubung antara:

- API Layer
- Application Layer
- Repository Layer
- AI Engine
- Event Bus
- Cache
- Background Jobs

Service Layer tidak mengetahui implementasi database.

---

# 2. Architecture

```
Controller

↓

DTO

↓

Application Service

↓

Domain Service

↓

Repository

↓

Database
```

---

# 3. Responsibilities

Service Layer bertanggung jawab terhadap:

- Business Rules
- Validation
- Transaction
- Authorization
- Event Publishing
- Cache Invalidation
- Logging
- Audit
- Integration

---

# 4. Service Catalog

Question Bank terdiri dari beberapa service.

```
QuestionService

QuestionVersionService

QuestionReviewService

QuestionSearchService

QuestionImportService

QuestionExportService

QuestionGenerationService

QuestionValidationService

QuestionMetadataService

QuestionStatisticsService
```

Setiap service mempunyai tanggung jawab tunggal.

---

# 5. Question Service

Mengelola Question.

Function.

```
Create

Update Draft

Delete Draft

Publish

Archive

Restore

Clone

Get Detail
```

---

# 6. Question Version Service

Mengelola Version.

Function.

```
Create Version

Compare Version

Rollback Version

Publish Version

Get History
```

---

# 7. Review Service

Mengelola Review Workflow.

```
Assign Reviewer

Approve

Reject

Request Revision

Comment

Review History
```

---

# 8. Search Service

Mengelola pencarian.

```
Search

Suggestion

Autocomplete

Semantic Search

Hybrid Search

Recent Search
```

---

# 9. Import Service

Mengelola Import.

```
Upload

Preview

Validate

Commit

Retry

Report
```

---

# 10. Export Service

Mengelola Export.

```
Request Export

Generate

Notify

Download

Expire
```

---

# 11. AI Generation Service

Mengelola AI.

```
Generate Question

Generate Explanation

Generate Distractor

Generate Metadata

Generate Similar

Generate Story
```

---

# 12. Validation Service

Mengelola Validation.

```
Schema

Business

Metadata

Academic

Security

AI
```

---

# 13. Metadata Service

Mengelola Metadata.

```
Assign

Update

Suggest

Validate

Normalize
```

---

# 14. Statistics Service

Mengelola statistik.

```
Usage

Difficulty

Correct Rate

Exposure

Quality

Popularity
```

---

# 15. Transaction Strategy

Setiap service memiliki transaction boundary.

```
BEGIN

↓

Business Logic

↓

Repository

↓

Event

↓

COMMIT
```

Jika gagal.

↓

ROLLBACK

---

# 16. Service Interaction

```
QuestionService

↓

ValidationService

↓

Repository

↓

Event

↓

Cache
```

---

# 17. Domain Events

Service dapat menghasilkan event.

```
QuestionCreated

QuestionUpdated

QuestionPublished

QuestionArchived

ReviewApproved

ImportCompleted

ExportCompleted
```

---

# 18. Cache Integration

Service bertanggung jawab melakukan.

- Cache Read
- Cache Write
- Cache Invalidate

Repository tidak boleh mengakses cache secara langsung.

---

# 19. Authorization

Service memverifikasi.

- Role
- Permission
- Ownership
- Workflow State

Sebelum melakukan perubahan data.

---

# 20. Error Handling

Service mengembalikan domain error.

Contoh.

```
QuestionNotFound

QuestionAlreadyPublished

VersionConflict

DuplicateQuestion

ValidationFailed

PermissionDenied
```

---

# 21. Idempotency

Operasi berikut wajib idempotent.

- Publish
- Import Commit
- Export Request
- AI Generation Request

Menggunakan Idempotency Key.

---

# 22. Logging

Service mencatat.

- Request ID
- User ID
- Duration
- Result
- Error
- Transaction ID

---

# 23. Performance Target

| Service | Target |
|----------|---------|
| Create Question | < 200 ms |
| Publish | < 300 ms |
| Search | < 300 ms |
| Validation | < 300 ms |
| Import Request | < 500 ms |

---

# 24. Dependency Rules

Service hanya boleh bergantung pada.

- Interface Repository
- Domain Object
- Domain Event
- External Service Interface

Tidak boleh mengakses ORM secara langsung.

---

# 25. Service Composition

```
QuestionService

├── ValidationService

├── MetadataService

├── EventPublisher

├── CacheService

├── Repository

└── AuditService
```

---

# 26. Retry Policy

Retry hanya untuk.

- Event Publish
- External AI
- Object Storage

Tidak untuk transaction database.

---

# 27. Monitoring

Dipantau.

- Success Rate
- Failure Rate
- Latency
- Transaction Duration
- Event Publish Time
- Cache Hit Ratio

---

# 28. Future Roadmap

- Saga Orchestration
- CQRS Command Service
- Workflow Engine
- Rule Engine
- AI Decision Service
- Distributed Transaction
- Service Mesh
````

---

# Rekomendasi Arsitektur

Saya menyarankan **Application Service** dipisahkan dari **Domain Service**.

```text
REST API
     │
     ▼
Application Service
     │
     ├── Authorization
     ├── Transaction
     ├── DTO Mapping
     └── Event Dispatch
     │
     ▼
Domain Service
     │
     ├── Business Rule
     ├── Validation
     ├── Workflow
     └── Domain Logic
     │
     ▼
Repository Interface
```

Dengan pemisahan ini:

* **Application Service** menangani orkestrasi use case (transaction, authorization, audit, event dispatch, DTO).
* **Domain Service** hanya berisi aturan bisnis murni yang dapat digunakan kembali oleh REST API, background worker, scheduler, maupun event consumer.

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/
├── application/
│   ├── question_service.go
│   ├── version_service.go
│   ├── review_service.go
│   ├── search_service.go
│   ├── import_service.go
│   ├── export_service.go
│   └── ai_generation_service.go
│
├── domain/
│   ├── services/
│   │   ├── question_domain_service.go
│   │   ├── review_domain_service.go
│   │   ├── validation_domain_service.go
│   │   └── randomization_domain_service.go
│   └── ...
│
├── repository/
│   └── ...
└── events/
```

### Penyempurnaan untuk YakinLulus.id

Saya juga merekomendasikan agar setiap **Application Service** hanya menangani **satu use case**. Misalnya:

* `CreateQuestionService`
* `PublishQuestionService`
* `ArchiveQuestionService`
* `CloneQuestionService`
* `RequestAIQuestionGenerationService`

Pendekatan ini mengikuti prinsip **Command-Oriented Application Service**, sehingga setiap use case memiliki transaction boundary yang jelas, mudah diuji, dan siap diintegrasikan dengan CQRS apabila di masa depan YakinLulus.id berkembang menjadi arsitektur berskala lebih besar.
