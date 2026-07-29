Saya menyarankan **19_transaction_flow.md** menjadi spesifikasi transaksi bisnis (business transaction), bukan transaksi database semata. Dokumen ini mendefinisikan batas transaksi, urutan proses, kompensasi jika terjadi kegagalan, serta event yang dipublikasikan.

Untuk YakinLulus.id yang menggunakan PostgreSQL + Background Jobs + AI + Event-Driven Architecture, pemisahan antara **database transaction** dan **business transaction** sangat penting.

---

````markdown
# 19_transaction_flow.md

# Question Bank Transaction Flow

Version : 1.0

---

# 1. Overview

Transaction Flow mendefinisikan seluruh alur transaksi bisnis
pada Question Bank.

Tujuan:

- menjaga konsistensi data
- menghindari partial update
- menentukan transaction boundary
- menentukan rollback policy
- menentukan event publishing
- mendukung background processing

---

# 2. Transaction Principles

Seluruh transaksi mengikuti prinsip.

- Atomic
- Consistent
- Isolated
- Durable

(ACID)

Namun proses asynchronous
tidak berada dalam transaksi database yang sama.

---

# 3. Transaction Types

Question Bank memiliki beberapa jenis transaksi.

- Create Question
- Update Draft
- Publish Question
- Review Question
- Import Question
- Export Question
- AI Generation
- Archive Question
- Restore Question
- Clone Question

---

# 4. Create Question Flow

```
Request

↓

Authorization

↓

Validation

↓

Create Aggregate

↓

Save Database

↓

Commit

↓

Publish Event

↓

Invalidate Cache
```

Database transaction berakhir sebelum event dipublikasikan.

---

# 5. Update Draft Flow

```
Load Aggregate

↓

Optimistic Lock Check

↓

Validation

↓

Update

↓

Commit

↓

Publish Event
```

---

# 6. Publish Question Flow

```
Load Draft

↓

Validation

↓

Review Status Check

↓

Create Published Version

↓

Update Current Version

↓

Commit

↓

QuestionPublished Event

↓

Search Reindex

↓

Embedding Queue
```

Embedding tidak dijalankan di dalam transaksi.

---

# 7. Review Flow

```
Reviewer Action

↓

Validation

↓

Review Decision

↓

Save Review

↓

Commit

↓

Review Event
```

---

# 8. Import Flow

```
Upload

↓

Parse

↓

Validate

↓

Batch Transaction

↓

Commit Batch

↓

Queue Next Batch
```

Setiap batch memiliki transaction sendiri.

---

# 9. Export Flow

```
Request

↓

Create Export Job

↓

Commit

↓

Queue Generator

↓

Generate File

↓

Upload Storage

↓

Complete Job
```

Export tidak menggunakan transaction panjang.

---

# 10. AI Generation Flow

```
Create AI Job

↓

Commit

↓

Background Worker

↓

LLM

↓

Validation

↓

Draft Creation

↓

Commit

↓

Review Queue
```

LLM tidak pernah dipanggil
di dalam transaction database.

---

# 11. Clone Question

```
Load Aggregate

↓

Create New Aggregate

↓

Save

↓

Commit

↓

Publish Event
```

---

# 12. Archive Flow

```
Load

↓

Permission Check

↓

Archive

↓

Commit

↓

Invalidate Cache

↓

Archive Event
```

---

# 13. Restore Flow

```
Load

↓

Validation

↓

Restore

↓

Commit

↓

Restore Event
```

---

# 14. Transaction Boundary

Database Transaction hanya mencakup.

- Insert
- Update
- Delete
- Version Update
- Audit Log

Tidak mencakup.

- AI
- Redis
- Email
- Notification
- Object Storage
- Search Index
- Embedding

---

# 15. Event Publishing

Event dipublikasikan
setelah commit berhasil.

```
COMMIT

↓

Outbox

↓

Message Broker

↓

Consumer
```

Menggunakan Transactional Outbox Pattern.

---

# 16. Rollback Strategy

Rollback terjadi jika.

- Validation Failed
- Constraint Error
- Deadlock
- Duplicate Key
- Optimistic Lock Failed

Background job tidak ikut di-rollback.

---

# 17. Compensation Strategy

Untuk proses asynchronous.

Contoh.

```
Export Failed

↓

Update Job Status

↓

Retry

↓

Notify User
```

---

# 18. Locking Strategy

Default.

Optimistic Lock.

Operasi tertentu.

Pessimistic Lock.

Contoh.

Publish Version.

---

# 19. Concurrency

Harus mencegah.

- Lost Update
- Dirty Write
- Double Publish
- Duplicate Import

---

# 20. Retry Policy

Retry hanya untuk.

- Event Publish
- Storage Upload
- AI Provider
- Search Index

Tidak untuk.

Database Constraint Error

---

# 21. Idempotency

Harus didukung oleh.

- Publish
- Clone
- Import Commit
- Export Request
- AI Request

Menggunakan Idempotency Key.

---

# 22. Failure Scenario

Jika event gagal.

```
Commit Success

↓

Outbox Retry

↓

Publish
```

Jika AI gagal.

```
AI Failed

↓

Retry Queue

↓

Failed Queue
```

---

# 23. Audit

Setiap transaksi menyimpan.

- Transaction ID
- Request ID
- User
- Time
- Duration
- Status

---

# 24. Database Objects

```
question

question_version

review

audit_log

outbox_event

import_job

export_job

ai_generation_job
```

---

# 25. Domain Events

```
QuestionCreated

QuestionUpdated

QuestionPublished

QuestionArchived

QuestionRestored

ReviewCompleted

ImportCompleted

ExportCompleted

AIQuestionGenerated
```

---

# 26. Monitoring

Dipantau.

- Transaction Duration
- Commit Time
- Rollback Count
- Deadlock Count
- Retry Count
- Event Delay

---

# 27. Performance Target

| Transaction | Target |
|-------------|---------|
| Create | < 200 ms |
| Publish | < 300 ms |
| Update | < 200 ms |
| Archive | < 100 ms |
| Import Batch | < 5 detik |

---

# 28. Future Roadmap

- Saga Pattern
- Distributed Transaction
- CQRS Command Bus
- Workflow Engine
- Event Replay
- Transaction Replay
````

---

# Rekomendasi Arsitektur

Saya menyarankan menggunakan **Transactional Outbox Pattern** sejak MVP. Jangan pernah melakukan pola seperti ini:

```go
BEGIN
INSERT question
CALL AI
UPDATE redis
SEND notification
COMMIT
```

Sebagai gantinya:

```text
REST API
     │
     ▼
Application Service
     │
     ▼
BEGIN TRANSACTION
     │
     ├── Save Aggregate
     ├── Save Audit Log
     ├── Save Outbox Event
     ▼
COMMIT
     │
     ▼
Outbox Processor
     │
     ├── Search Index
     ├── Redis
     ├── AI Queue
     ├── Notification
     └── Analytics
```

Dengan pola ini:

* transaksi database tetap singkat dan konsisten;
* kegagalan pada AI, Redis, object storage, atau message broker tidak membatalkan perubahan data utama;
* event dapat dipublikasikan ulang (retry) tanpa risiko kehilangan data;
* sistem lebih siap berkembang menjadi arsitektur event-driven dan microservices di masa depan.

Untuk YakinLulus.id, pola ini akan sangat membantu karena modul Question Bank, CBT Runtime, Analytics, AI, dan Notification semuanya akan bereaksi terhadap event yang sama tanpa membuat transaksi database menjadi kompleks.
