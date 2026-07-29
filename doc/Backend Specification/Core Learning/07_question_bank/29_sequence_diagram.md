Selanjutnya adalah **29_sequence_diagram.md**. Saya menyarankan dokumen ini menggunakan **Mermaid Sequence Diagram** agar dapat langsung dirender di GitHub, GitLab, Obsidian, MkDocs, Docusaurus, maupun berbagai tool dokumentasi modern.

Untuk modul Question Bank, sequence diagram sebaiknya tidak hanya mencakup CRUD, tetapi juga seluruh business flow utama yang telah didefinisikan pada PRD, Backend Architecture, dan Database Specification.

---

````markdown
# 29_sequence_diagram.md

# Question Bank Sequence Diagram

Version : 1.0

---

# 1. Overview

Dokumen ini berisi sequence diagram utama
pada modul Question Bank.

Diagram menggunakan Mermaid
agar dapat dirender secara otomatis
oleh berbagai platform dokumentasi.

---

# 2. Create Question

```mermaid
sequenceDiagram

actor Teacher

participant API

participant Service

participant Repository

participant PostgreSQL

participant Outbox

Teacher->>API: Create Question

API->>Service: Validate Request

Service->>Repository: Save Aggregate

Repository->>PostgreSQL: INSERT Question

PostgreSQL-->>Repository: OK

Repository-->>Service: Aggregate

Service->>Repository: Save Outbox Event

Repository->>PostgreSQL: INSERT Outbox

PostgreSQL-->>Repository: OK

Repository-->>Service: Commit

Service-->>API: Success

API-->>Teacher: 201 Created
```

---

# 3. Publish Question

```mermaid
sequenceDiagram

actor Admin

participant API

participant Service

participant Repository

participant PostgreSQL

participant Outbox

participant Search

participant AI

Admin->>API: Publish

API->>Service: Validate

Service->>Repository: Load Aggregate

Repository->>PostgreSQL: SELECT

Repository-->>Service: Question

Service->>Repository: Update Version

Repository->>PostgreSQL: UPDATE

Repository->>PostgreSQL: INSERT Outbox

Repository-->>Service: Commit

Service-->>API: Success

Outbox->>Search: Reindex

Outbox->>AI: Generate Embedding
```

---

# 4. Review Question

```mermaid
sequenceDiagram

actor Reviewer

participant API

participant Service

participant Repository

participant PostgreSQL

Reviewer->>API: Approve Review

API->>Service: Validate

Service->>Repository: Save Review

Repository->>PostgreSQL: INSERT Review

Repository->>PostgreSQL: UPDATE Status

Repository-->>Service: Commit

Service-->>API: Success
```

---

# 5. Search Question

```mermaid
sequenceDiagram

actor User

participant API

participant Cache

participant Search

participant PostgreSQL

User->>API: Search

API->>Cache: Lookup

alt Cache Hit

Cache-->>API: Result

else Cache Miss

API->>Search: Query

Search->>PostgreSQL: Search

PostgreSQL-->>Search: Result

Search-->>API: Result

API->>Cache: Save

end

API-->>User: Response
```

---

# 6. Semantic Search

```mermaid
sequenceDiagram

actor User

participant API

participant Embedding

participant PGVector

participant PostgreSQL

User->>API: Search

API->>Embedding: Generate Query Vector

Embedding-->>API: Vector

API->>PGVector: Similarity Search

PGVector-->>API: Candidate

API->>PostgreSQL: Load Metadata

PostgreSQL-->>API: Detail

API-->>User: Result
```

---

# 7. Import Question

```mermaid
sequenceDiagram

actor Admin

participant API

participant Storage

participant JobQueue

participant Worker

participant PostgreSQL

Admin->>API: Upload Excel

API->>Storage: Save File

Storage-->>API: Success

API->>JobQueue: Create Import Job

API-->>Admin: Accepted

JobQueue->>Worker: Execute

Worker->>PostgreSQL: Import Batch

PostgreSQL-->>Worker: Success
```

---

# 8. Export Question

```mermaid
sequenceDiagram

actor Admin

participant API

participant Queue

participant Worker

participant Storage

Admin->>API: Export

API->>Queue: Create Job

API-->>Admin: Accepted

Queue->>Worker: Generate File

Worker->>Storage: Upload

Storage-->>Worker: Success
```

---

# 9. AI Question Generation

```mermaid
sequenceDiagram

actor Teacher

participant API

participant Queue

participant AI

participant Validation

participant PostgreSQL

Teacher->>API: Generate Question

API->>Queue: Create Job

API-->>Teacher: Accepted

Queue->>AI: Generate

AI-->>Validation: Draft

Validation-->>PostgreSQL: Save Draft
```

---

# 10. Duplicate Detection

```mermaid
sequenceDiagram

participant Question

participant Embedding

participant PGVector

participant Reviewer

Question->>Embedding: Generate Vector

Embedding->>PGVector: Store

PGVector-->>Embedding: Similarity

Embedding-->>Reviewer: Duplicate Alert
```

---

# 11. Attachment Upload

```mermaid
sequenceDiagram

actor User

participant API

participant Storage

participant PostgreSQL

User->>API: Upload

API->>Storage: Store Object

Storage-->>API: Object Key

API->>PostgreSQL: Save Metadata

API-->>User: Success
```

---

# 12. Cache Invalidation

```mermaid
sequenceDiagram

participant Publish

participant Outbox

participant Cache

Publish->>Outbox: Event

Outbox->>Cache: Invalidate

Cache-->>Outbox: OK
```

---

# 13. Event Publishing

```mermaid
sequenceDiagram

participant Service

participant PostgreSQL

participant Outbox

participant Broker

participant Consumer

Service->>PostgreSQL: Commit

Service->>Outbox: Save Event

Outbox->>Broker: Publish

Broker->>Consumer: Deliver
```

---

# 14. Audit Logging

```mermaid
sequenceDiagram

participant Service

participant Audit

participant PostgreSQL

Service->>Audit: Create Audit

Audit->>PostgreSQL: Save

PostgreSQL-->>Audit: Success
```

---

# 15. Background Job Retry

```mermaid
sequenceDiagram

participant Worker

participant Queue

participant Retry

Worker->>Queue: Failed

Queue->>Retry: Schedule Retry

Retry->>Worker: Execute Again
```

---

# 16. Future Diagrams

Dokumen ini akan diperluas dengan.

- Bulk Import
- Adaptive Learning
- Recommendation Engine
- AI RAG Pipeline
- CQRS Projection
- Distributed Transaction
- Multi Region Synchronization
````

---

# Rekomendasi Penyempurnaan

Untuk YakinLulus.id, saya menyarankan **seluruh sequence diagram dibagi menjadi tiga kategori** agar dokumentasi tetap mudah dipelihara.

## 1. User Flow

```text
Teacher → Create Question
Reviewer → Review
Admin → Publish
Student → Search
```

Berfokus pada interaksi aktor dengan sistem.

---

## 2. System Flow

```text
API
↓
Application Service
↓
Repository
↓
Database
↓
Outbox
↓
Event Broker
```

Berfokus pada alur internal backend.

---

## 3. Infrastructure Flow

```text
API
↓
Redis
↓
PostgreSQL
↓
Object Storage
↓
Message Broker
↓
Background Worker
```

Berfokus pada interaksi dengan komponen infrastruktur.

---

# Diagram yang Direkomendasikan untuk Fase Berikutnya

Saat modul lain (Material, CBT Runtime, Analytics, AI, Notification) selesai, saya menyarankan menambahkan sequence diagram lintas bounded context, misalnya:

* **Question Bank → CBT Runtime** (sinkronisasi soal setelah publish)
* **Question Bank → AI Engine** (embedding dan RAG)
* **Question Bank → Analytics** (penggunaan soal dan pembaruan statistik)
* **Question Bank → Notification** (notifikasi review atau import selesai)
* **Question Bank → File Management** (unggah dan pemrosesan aset)

Dengan pendekatan ini, dokumentasi tidak hanya menggambarkan alur di dalam modul Question Bank, tetapi juga hubungan antarmodul yang menjadi inti arsitektur YakinLulus.id.
