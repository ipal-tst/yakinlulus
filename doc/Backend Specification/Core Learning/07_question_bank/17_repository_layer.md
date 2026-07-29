Selanjutnya adalah **17_repository_layer.md**. Dokumen ini mendefinisikan bagaimana Question Bank berinteraksi dengan PostgreSQL tanpa membocorkan detail database ke Service Layer.

Untuk YakinLulus.id, saya **tidak menyarankan Generic Repository**. Sebaiknya gunakan **Repository per Aggregate Root** sesuai DDD, sehingga query kompleks tetap optimal dan business intent tetap jelas.

---

````markdown
# 17_repository_layer.md

# Question Bank Repository Layer Specification

Version : 1.0

---

# 1. Overview

Repository Layer bertanggung jawab menyediakan akses data bagi Domain dan Application Service.

Repository menyembunyikan implementasi persistence sehingga business logic
tidak bergantung pada PostgreSQL, ORM, maupun query SQL.

Repository merupakan satu-satunya layer yang berinteraksi langsung dengan database.

---

# 2. Repository Architecture

```
Application Service

↓

Domain Service

↓

Repository Interface

↓

Repository Implementation

↓

PostgreSQL
```

---

# 3. Responsibilities

Repository bertanggung jawab terhadap:

- Load Aggregate
- Persist Aggregate
- Query Data
- Pagination
- Optimized SQL
- Transaction Participation
- Locking
- Projection Query

Repository tidak boleh mengandung business rule.

---

# 4. Repository Catalog

Question Bank memiliki repository berikut.

```
QuestionRepository

QuestionVersionRepository

QuestionReviewRepository

QuestionMetadataRepository

QuestionAttachmentRepository

QuestionSearchRepository

QuestionStatisticsRepository

QuestionImportRepository

QuestionExportRepository

QuestionEmbeddingRepository
```

---

# 5. Question Repository

Mengelola Aggregate Question.

Function.

```
Create()

Update()

DeleteDraft()

FindByID()

FindByCode()

Exists()

Clone()

Archive()

Restore()
```

---

# 6. Version Repository

```
CreateVersion()

FindCurrent()

FindPublished()

FindHistory()

Rollback()

Compare()
```

---

# 7. Metadata Repository

```
SaveMetadata()

UpdateMetadata()

LoadMetadata()

FindBySubject()

FindByChapter()
```

---

# 8. Search Repository

Mengelola query pencarian.

```
Search()

Autocomplete()

Suggestion()

HybridSearch()

SemanticSearch()
```

---

# 9. Statistics Repository

```
UpdateUsage()

UpdateCorrectRate()

UpdateExposure()

LoadStatistics()
```

---

# 10. Import Repository

```
CreateImportJob()

SaveBatch()

SaveRow()

SaveError()

UpdateStatus()
```

---

# 11. Export Repository

```
CreateExportJob()

UpdateProgress()

GenerateManifest()

FindJob()

ExpireJob()
```

---

# 12. Embedding Repository

```
SaveEmbedding()

UpdateEmbedding()

FindNearest()

SimilaritySearch()
```

---

# 13. Repository Pattern

Repository menggunakan Interface.

```
QuestionRepository

↓

Postgres Repository

↓

SQL
```

Service tidak mengetahui implementasi.

---

# 14. Aggregate Loading

Repository mengembalikan Aggregate lengkap.

Contoh.

Question

↓

Current Version

↓

Metadata

↓

Option

↓

Attachment

↓

Statistics

Aggregate dimuat sesuai kebutuhan use case.

---

# 15. Read Model

Untuk query kompleks digunakan Read Model.

Contoh.

```
Question Summary

Question Search

Dashboard

Analytics
```

Read Model tidak digunakan untuk update.

---

# 16. Query Strategy

Repository dapat menggunakan.

- Query Builder
- Raw SQL
- Prepared Statement

Query dipilih berdasarkan performa.

---

# 17. Pagination

Didukung.

Offset Pagination

↓

Cursor Pagination

↓

Streaming (Future)

---

# 18. Transaction

Repository ikut dalam transaction yang dibuat Service.

Repository tidak membuka transaction sendiri.

```
BEGIN

↓

Repository

↓

Repository

↓

Repository

↓

COMMIT
```

---

# 19. Locking Strategy

Menggunakan.

Optimistic Lock

↓

Version Number

Untuk operasi tertentu.

Pessimistic Lock

↓

FOR UPDATE

---

# 20. Concurrency

Repository harus aman terhadap.

- Lost Update
- Dirty Read
- Double Publish
- Duplicate Import

---

# 21. Batch Operations

Repository mendukung.

```
Batch Insert

Batch Update

Batch Delete

Bulk Metadata Update
```

---

# 22. Soft Delete

Question tidak dihapus permanen.

```
deleted_at

deleted_by
```

Repository secara default mengabaikan data yang sudah dihapus.

---

# 23. Projection

Projection digunakan untuk.

- Search Result
- Dashboard
- Statistics
- Analytics
- Recommendation

Projection tidak mengembalikan Aggregate penuh.

---

# 24. Error Handling

Repository mengembalikan Domain Error.

Contoh.

```
NotFound

DuplicateKey

UniqueViolation

ForeignKeyViolation

Deadlock

Timeout
```

---

# 25. Performance Target

| Operation | Target |
|-----------|---------|
| FindByID | < 50 ms |
| Search | < 300 ms |
| Batch Insert | < 2 detik |
| Save Aggregate | < 100 ms |

---

# 26. Database Objects

Repository menggunakan.

```
question

question_version

question_metadata

question_option

question_attachment

question_statistics

question_embedding

import_job

export_job
```

---

# 27. Monitoring

Dipantau.

- Query Duration
- Slow Query
- Lock Wait
- Deadlock
- Cache Miss
- Connection Pool

---

# 28. Future Roadmap

- Read Replica
- CQRS Read Repository
- Sharding
- Partition Repository
- Distributed Query
- Multi Database Support
````

---

# Rekomendasi Arsitektur

Saya menyarankan repository dipisahkan menjadi **Command Repository** dan **Query Repository** sejak awal, meskipun belum menerapkan CQRS penuh.

```text
                    Service
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
Command Repository             Query Repository
        │                             │
        ▼                             ▼
 Aggregate SQL                Optimized Read SQL
        │                             │
        └──────────────┬──────────────┘
                       ▼
                  PostgreSQL
```

Keuntungan pendekatan ini:

* Query dashboard tidak membebani Aggregate.
* Search dapat menggunakan SQL khusus, Full Text Search, atau `pgvector`.
* Aggregate tetap kecil dan fokus pada konsistensi data.
* Mudah di-upgrade menjadi CQRS di masa depan.

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/repository/
│
├── command/
│   ├── question_repository.go
│   ├── version_repository.go
│   ├── metadata_repository.go
│   ├── review_repository.go
│   └── attachment_repository.go
│
├── query/
│   ├── search_repository.go
│   ├── dashboard_repository.go
│   ├── statistics_repository.go
│   ├── recommendation_repository.go
│   └── export_repository.go
│
├── postgres/
│   ├── question_command_pg.go
│   ├── question_query_pg.go
│   ├── metadata_pg.go
│   └── embedding_pg.go
│
└── mapper/
    ├── aggregate_mapper.go
    ├── projection_mapper.go
    └── dto_mapper.go
```

## Penyempurnaan untuk YakinLulus.id

Saya merekomendasikan setiap repository menggunakan **Specification Pattern** untuk query yang kompleks. Misalnya:

* `QuestionSearchSpecification`
* `QuestionEligibilitySpecification`
* `QuestionBlueprintSpecification`
* `QuestionSimilaritySpecification`
* `QuestionReviewQueueSpecification`

Dengan demikian, filter yang sama dapat digunakan secara konsisten oleh Search, Selection Engine, AI Generation, Import Validation, maupun CBT Blueprint tanpa menduplikasi logika query di berbagai repository. Ini juga mempermudah pengujian dan optimasi query secara terpusat.
