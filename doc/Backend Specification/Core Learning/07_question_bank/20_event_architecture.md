Dokumen berikutnya adalah **20_event_architecture.md**. Mengingat keseluruhan backend YakinLulus.id sudah dirancang menggunakan **Event-Driven Architecture**, modul Question Bank sebaiknya tidak melakukan integrasi langsung dengan CBT, Analytics, AI, Search, atau Notification. Semua komunikasi antarmodul dilakukan melalui **Domain Events**.

Dokumen ini akan menjadi fondasi integrasi seluruh backend.

---

````markdown
# 20_event_architecture.md

# Question Bank Event Architecture

Version : 1.0

---

# 1. Overview

Question Bank menggunakan Event-Driven Architecture (EDA)
untuk berkomunikasi dengan modul lain.

Seluruh perubahan penting pada Question Bank
menghasilkan Domain Event.

Event dikonsumsi oleh:

- CBT Runtime
- Analytics
- AI Engine
- Search Engine
- Notification
- Audit
- File Management
- Recommendation Engine

Question Bank tidak memanggil modul lain secara langsung.

---

# 2. Architecture

```
Question Service
       │
       ▼
Domain Event
       │
       ▼
Outbox Table
       │
       ▼
Event Publisher
       │
       ▼
Message Broker
       │
       ├─────────────┐
       ▼             ▼
Search         Analytics
       ▼             ▼
Notification     AI
       ▼             ▼
CBT Runtime   Recommendation
```

---

# 3. Event Principles

Semua event harus memenuhi prinsip.

- Immutable
- Versioned
- Idempotent
- Ordered (per Aggregate)
- Traceable
- Serializable

---

# 4. Event Categories

Question Bank menghasilkan beberapa kategori event.

Academic

Lifecycle

Review

Import

Export

AI

Search

Metadata

Statistics

---

# 5. Lifecycle Events

```
QuestionCreated

QuestionUpdated

QuestionPublished

QuestionArchived

QuestionRestored

QuestionDeleted
```

---

# 6. Version Events

```
QuestionVersionCreated

QuestionVersionPublished

QuestionVersionRolledBack

QuestionVersionCompared
```

---

# 7. Review Events

```
QuestionSubmittedForReview

ReviewAssigned

ReviewApproved

ReviewRejected

ReviewRevisionRequested
```

---

# 8. Import Events

```
ImportStarted

ImportBatchStarted

ImportBatchCompleted

QuestionImported

ImportCompleted

ImportFailed
```

---

# 9. Export Events

```
ExportRequested

ExportStarted

ExportCompleted

ExportFailed

ExportExpired
```

---

# 10. AI Events

```
QuestionGenerationRequested

QuestionGenerated

ExplanationGenerated

DistractorGenerated

MetadataGenerated

EmbeddingGenerated
```

---

# 11. Search Events

```
QuestionIndexed

QuestionReindexed

QuestionRemovedFromIndex

SearchCacheInvalidated
```

---

# 12. Statistics Events

```
QuestionUsed

QuestionAnswered

QuestionExposureUpdated

QuestionDifficultyUpdated

QuestionStatisticsUpdated
```

---

# 13. Metadata Events

```
MetadataAssigned

MetadataUpdated

MetadataValidated
```

---

# 14. Event Payload

Minimal payload.

```json
{
  "event_id": "",
  "event_name": "",
  "aggregate_id": "",
  "aggregate_type": "question",
  "aggregate_version": 1,
  "occurred_at": "",
  "user_id": "",
  "request_id": "",
  "payload": {}
}
```

---

# 15. Event Versioning

Setiap event memiliki versi.

Contoh.

```
QuestionPublished.v1

↓

QuestionPublished.v2
```

Breaking change dibuat melalui versi baru.

---

# 16. Event Ordering

Ordering dijamin
per Aggregate ID.

```
Question A

↓

Created

↓

Updated

↓

Published

↓

Archived
```

Tidak dijamin secara global.

---

# 17. Event Delivery

Menggunakan.

At Least Once Delivery

Consumer harus idempotent.

---

# 18. Event Publishing

```
Save Aggregate

↓

Save Outbox

↓

Commit

↓

Publisher

↓

Broker
```

Menggunakan Transactional Outbox Pattern.

---

# 19. Event Consumer

Setiap consumer bertanggung jawab terhadap prosesnya sendiri.

Contoh.

Search

↓

Reindex

Analytics

↓

Update Dashboard

Notification

↓

Send Message

---

# 20. Retry Strategy

Jika publish gagal.

```
Retry

↓

Exponential Backoff

↓

Dead Letter Queue
```

---

# 21. Dead Letter Queue

Event yang gagal diproses
dipindahkan ke DLQ.

Administrator dapat.

- Replay
- Inspect
- Delete

---

# 22. Event Idempotency

Consumer menyimpan.

```
event_id
```

Jika event pernah diproses.

↓

Ignore

---

# 23. Event Storage

Outbox menyimpan.

- Event ID
- Aggregate
- Payload
- Status
- Retry Count
- Created At

---

# 24. Event Security

Payload tidak boleh berisi.

- Password
- Token
- API Key
- Prompt Rahasia
- Data Sensitif

Gunakan reference ID jika diperlukan.

---

# 25. Event Monitoring

Dipantau.

- Publish Rate
- Consumer Lag
- Retry Count
- DLQ Count
- Throughput
- Processing Time

---

# 26. Database Objects

```
outbox_event

event_consumer

event_retry

event_dead_letter
```

---

# 27. Integration Matrix

| Event | Consumer |
|--------|----------|
| QuestionPublished | Search, CBT, Analytics |
| ReviewApproved | Analytics |
| QuestionArchived | Search |
| ImportCompleted | Analytics |
| AIQuestionGenerated | Review Workflow |
| MetadataUpdated | Search |

---

# 28. Failure Handling

Jika consumer gagal.

```
Retry

↓

DLQ

↓

Replay
```

Publisher tidak melakukan rollback terhadap transaksi database.

---

# 29. Performance Target

| Metric | Target |
|---------|---------|
| Publish Delay | < 2 detik |
| Consumer Processing | < 500 ms |
| Retry Interval | Configurable |
| DLQ Recovery | Manual / Scheduled |

---

# 30. Future Roadmap

- Kafka Integration
- NATS Integration
- RabbitMQ Cluster
- Event Replay Service
- Event Sourcing
- CQRS Projection
- Workflow Engine
- Distributed Saga
````

---

# Rekomendasi Arsitektur

Untuk YakinLulus.id, saya menyarankan pemisahan tiga komponen utama:

```text
Application Service
        │
        ▼
Domain Event Factory
        │
        ▼
Outbox Repository
        │
   (Database Commit)
        │
        ▼
Outbox Publisher
        │
        ▼
Message Broker
        │
 ┌──────┼────────┬──────────┬─────────┐
 ▼      ▼        ▼          ▼         ▼
Search  CBT   Analytics    AI   Notification
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/events/
│
├── domain/
│   ├── question_created.go
│   ├── question_published.go
│   ├── review_approved.go
│   ├── metadata_updated.go
│   └── ...
│
├── publisher/
│   ├── outbox_publisher.go
│   ├── broker.go
│   └── retry.go
│
├── consumer/
│   ├── search_consumer.go
│   ├── analytics_consumer.go
│   ├── ai_consumer.go
│   ├── notification_consumer.go
│   └── cbt_consumer.go
│
├── outbox/
│   ├── repository.go
│   ├── dispatcher.go
│   └── cleanup.go
│
└── envelope/
    ├── event.go
    ├── metadata.go
    └── serializer.go
```

## Penyempurnaan untuk YakinLulus.id

Karena platform ini terdiri dari beberapa bounded context (Question Bank, Material, CBT Runtime, Analytics, AI, Notification, File Management), saya merekomendasikan penggunaan **Event Envelope** yang seragam di seluruh sistem.

Selain payload bisnis, setiap event sebaiknya membawa metadata standar seperti:

* `event_id`
* `event_type`
* `event_version`
* `aggregate_id`
* `aggregate_version`
* `correlation_id`
* `causation_id`
* `request_id`
* `tenant_id` (jika nanti mendukung multi-tenant)
* `occurred_at`
* `producer`

Dengan metadata tersebut, event dapat ditelusuri secara end-to-end melalui seluruh layanan, mempermudah observability, audit, replay, dan debugging ketika sistem berkembang menjadi lebih besar.
