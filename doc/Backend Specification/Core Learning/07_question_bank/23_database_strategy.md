Berikutnya adalah **23_database_strategy.md**. Ini adalah salah satu dokumen paling penting karena menjadi jembatan antara **LDM/ERD** dan implementasi PostgreSQL.

Untuk YakinLulus.id, saya menyarankan strategi **Database First**, bukan ORM First. Artinya, desain database menjadi sumber utama, sementara ORM/SQLC hanyalah alat untuk mengaksesnya.

---

````markdown
# 23_database_strategy.md

# Question Bank Database Strategy

Version : 1.0

---

# 1. Overview

Database Strategy mendefinisikan bagaimana Question Bank
menggunakan PostgreSQL sebagai Source of Truth.

Dokumen ini mencakup:

- Data Organization
- Transaction Strategy
- Partitioning
- Indexing
- Performance
- Backup
- Replication
- Scalability

---

# 2. Database Principles

Question Bank mengikuti prinsip.

- PostgreSQL First
- Normalized Core Data
- Denormalized Read Model
- ACID Transaction
- Immutable History
- Soft Delete
- Event Driven

---

# 3. Source of Truth

PostgreSQL merupakan satu-satunya sumber data utama.

Tidak ada cache maupun search engine
yang menjadi sumber utama.

Semua sinkronisasi berasal dari PostgreSQL.

---

# 4. Database Organization

Logical Schema.

```
question_bank

metadata

review

statistics

audit

integration

system
```

Semua schema berada
dalam satu PostgreSQL Cluster.

---

# 5. Core Tables

Aggregate utama.

```
question

question_version

question_option

question_metadata

question_attachment

question_review

question_statistics

question_embedding
```

---

# 6. Lookup Tables

Lookup dipisahkan.

```
subject

grade

curriculum

chapter

topic

learning_objective

difficulty

taxonomy

tag
```

Lookup bersifat relatif stabil.

---

# 7. Read Models

Projection.

```
question_summary

question_search

question_dashboard

question_recommendation
```

Projection digunakan untuk query cepat.

---

# 8. Normalization Strategy

Core Data.

3NF

Lookup.

Normalized

Analytics.

Denormalized

Search.

Projection

---

# 9. Primary Key Strategy

Seluruh tabel menggunakan.

UUID v7

Keuntungan.

- scalable
- sortable
- distributed
- collision rendah

---

# 10. Foreign Key Strategy

Semua relasi menggunakan FK.

ON UPDATE RESTRICT

ON DELETE RESTRICT

Soft Delete digunakan
untuk menjaga integritas data.

---

# 11. Soft Delete

Menggunakan.

```
deleted_at

deleted_by
```

Data tidak dihapus permanen
kecuali melalui proses khusus.

---

# 12. Version Strategy

Question immutable.

Perubahan membuat
Question Version baru.

Published Version
tidak diubah.

---

# 13. Transaction Strategy

Menggunakan.

READ COMMITTED

Default Isolation.

SERIALIZABLE
digunakan hanya bila diperlukan.

---

# 14. Lock Strategy

Default.

Optimistic Lock

Menggunakan.

```
version_number
```

Pessimistic Lock
digunakan untuk Publish.

---

# 15. Index Strategy

Index.

Primary Key

Foreign Key

Unique

Partial

Composite

GIN

GIN Trigram

BRIN

Vector

---

# 16. Partial Index

Contoh.

Published Question

```
WHERE status='published'
```

Draft.

```
WHERE status='draft'
```

Mengurangi ukuran index.

---

# 17. Composite Index

Contoh.

```
subject

grade

chapter

difficulty
```

Untuk query akademik.

---

# 18. Full Text Search

Menggunakan.

```
tsvector

tsquery

GIN
```

Digunakan pada.

Stem

Explanation

Tag

Keyword

---

# 19. JSONB Strategy

JSONB digunakan
hanya untuk data fleksibel.

Contoh.

AI Metadata

OCR Metadata

External Metadata

Prompt Configuration

---

# 20. Large Object Strategy

File tidak disimpan
di PostgreSQL.

Disimpan pada Object Storage.

Database hanya menyimpan.

```
URL

Hash

Size

Mime

Storage Provider
```

---

# 21. Partition Strategy

Partition hanya digunakan
untuk tabel besar.

Contoh.

audit_log

event

statistics

import_log

Export Job

Belum digunakan
pada Question utama.

---

# 22. Connection Pool

Menggunakan.

PgBouncer

Target.

100–300 Connection

Disesuaikan deployment.

---

# 23. Read Replica

Future.

```
Primary

↓

Replica

↓

Search

Analytics

Reporting
```

Write tetap menuju Primary.

---

# 24. Backup Strategy

Backup.

Daily Full

Hourly WAL

Weekly Snapshot

Recovery diuji berkala.

---

# 25. Recovery Strategy

Mendukung.

Point In Time Recovery (PITR)

Recovery Objective
ditentukan oleh kebijakan operasional.

---

# 26. Migration Strategy

Semua perubahan schema.

↓

Migration File

↓

Review

↓

Deploy

↓

Rollback Plan

Migration harus versioned.

---

# 27. Database Security

Menggunakan.

TLS

Least Privilege

Role Based Access

Credential Rotation

Audit Log

---

# 28. Performance Target

| Metric | Target |
|----------|---------|
| Insert | < 20 ms |
| Update | < 20 ms |
| Search | < 300 ms |
| Aggregate Load | < 100 ms |
| Publish | < 300 ms |

---

# 29. Monitoring

Dipantau.

- Slow Query
- Lock Wait
- Deadlock
- WAL Size
- Replication Lag
- Index Usage
- Connection Usage

---

# 30. Future Roadmap

- PostgreSQL Cluster
- Read Replica
- Partitioning
- Logical Replication
- Sharding
- Multi Region
- Data Warehouse Integration
````

---

# Rekomendasi Arsitektur Database

Saya menyarankan pemisahan database secara logis menggunakan schema PostgreSQL, bukan langsung memisahkan ke banyak database.

```text
PostgreSQL Cluster
│
├── question_bank
│   ├── question
│   ├── question_version
│   ├── question_option
│   ├── question_attachment
│   └── question_embedding
│
├── metadata
│   ├── subject
│   ├── chapter
│   ├── topic
│   └── taxonomy
│
├── review
│   ├── question_review
│   └── review_comment
│
├── statistics
│   ├── question_statistics
│   └── question_usage
│
├── audit
│   ├── audit_log
│   └── outbox_event
│
└── integration
    ├── import_job
    ├── export_job
    └── ai_generation_job
```

---

# Penyempurnaan Khusus untuk YakinLulus.id

Berdasarkan seluruh desain yang telah dibuat, saya merekomendasikan beberapa prinsip tambahan:

### 1. SQL-first Development

* Semua DDL dikelola melalui migration.
* Hindari ORM yang menghasilkan schema secara otomatis.
* Jadikan migration sebagai satu-satunya sumber perubahan struktur database.

### 2. UUID v7 + BIGINT Sequence

Gunakan kombinasi:

* **UUID v7** sebagai primary key publik untuk seluruh entitas.
* **BIGINT sequence** opsional sebagai nomor internal yang mudah diurutkan dan digunakan untuk kebutuhan administrasi atau pelaporan.

### 3. Projection Terpisah

Pisahkan tabel operasional dari tabel proyeksi:

* `question_*` → transaksi dan konsistensi.
* `question_search`, `question_dashboard`, `question_recommendation` → query cepat dan reporting.

Dengan demikian, perubahan pada kebutuhan pencarian atau dashboard tidak akan memengaruhi desain tabel inti.

### 4. Siap untuk Skalabilitas

Meskipun MVP hanya menggunakan satu PostgreSQL instance, seluruh desain harus siap berkembang ke:

* Read Replica untuk beban baca tinggi.
* Partitioning pada tabel log dan statistik.
* Logical Replication untuk analitik.
* Event-driven projection untuk CQRS di masa depan.

Pendekatan ini memberikan fondasi database yang stabil untuk pertumbuhan YakinLulus.id tanpa memerlukan migrasi arsitektur besar ketika jumlah soal, pengguna, dan aktivitas meningkat secara signifikan.
