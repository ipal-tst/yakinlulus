# Database Access Implementation

**Document** : `backend/09_database_access_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi akses database pada backend YakinLulus.id.

Database Access Layer bertanggung jawab menyediakan akses data yang:

- Aman
- Cepat
- Konsisten
- Type-safe
- Mudah diuji
- Siap diskalakan

YakinLulus.id menggunakan:

- PostgreSQL (Supabase)
- pgx
- sqlc
- Repository Pattern
- Connection Pooling

Seluruh akses database wajib mengikuti standar pada dokumen ini.

---

# 2. Architecture Overview

```text
                 HTTP Request
                      │
                      ▼
                 Application Layer
                      │
                      ▼
               Repository Interface
                      │
                      ▼
        Repository Implementation
                      │
                      ▼
                  sqlc Generated
                      │
                      ▼
                 pgx Connection Pool
                      │
                      ▼
           PostgreSQL (Supabase)
```

Database hanya dapat diakses melalui Repository.

---

# 3. Design Principles

Database Access mengikuti prinsip berikut:

- SQL First
- Type Safe
- Explicit Query
- Repository Pattern
- Transaction Aware
- Connection Pooling
- Prepared Statement
- Fail Fast
- Readability over Magic
- Performance by Default

Tidak menggunakan ORM.

---

# 4. Mengapa Tidak Menggunakan ORM?

Alasan pemilihan `pgx + sqlc` dibanding ORM:

| ORM | sqlc |
|------|------|
| SQL tersembunyi | SQL eksplisit |
| Runtime mapping | Compile-time type checking |
| Sulit mengoptimalkan query | Query sepenuhnya dikontrol |
| Potensi N+1 Query | Query eksplisit |
| Overhead lebih tinggi | Performa tinggi |

Pendekatan ini lebih sesuai untuk aplikasi CBT dan analitik dengan volume data besar.

---

# 5. Database Driver

Driver resmi:

```text
pgx v5
```

Fitur yang dimanfaatkan:

- Connection Pool
- Prepared Statement
- COPY Protocol
- Batch Query
- Context Support
- Transaction Support
- Notice Handler
- LISTEN/NOTIFY (future)

---

# 6. Query Generator

Seluruh query SQL ditulis manual.

Flow:

```text
query.sql

↓

sqlc generate

↓

Generated Go Code

↓

Repository
```

Developer tidak menulis query SQL secara inline di kode Go.

---

# 7. Struktur Database Layer

```text
database/

├── migrations/
├── schema/
├── query/
├── sqlc/
├── seed/
└── fixtures/
```

---

## migrations/

Migration database.

```text
000001_init.up.sql
000001_init.down.sql
```

---

## query/

Semua SQL yang digunakan sqlc.

```text
user.sql
question.sql
exam.sql
answer.sql
material.sql
ranking.sql
analytics.sql
```

---

## sqlc/

Output hasil generate.

```text
db.go
models.go
querier.go
*.sql.go
```

Folder ini tidak diedit secara manual.

---

# 8. Connection Management

Seluruh aplikasi menggunakan satu `pgxpool.Pool`.

```text
Application Startup

↓

Create Pool

↓

Share Pool

↓

Repository
```

Tidak diperbolehkan membuat koneksi baru pada setiap request.

---

# 9. Connection Pool Configuration

Parameter yang direkomendasikan:

```text
Max Connections

Min Connections

Max Conn Lifetime

Max Idle Time

Health Check Period
```

Nilai disesuaikan berdasarkan environment:

- Development
- Staging
- Production

---

# 10. Repository Access Flow

```text
HTTP

↓

Use Case

↓

Repository

↓

Generated sqlc

↓

pgx Pool

↓

PostgreSQL
```

Repository tidak boleh dilewati.

---

# 11. SQL Organization

Satu file SQL untuk satu bounded context.

Contoh:

```text
question.sql

exam.sql

material.sql

user.sql
```

Hindari file SQL yang terlalu besar.

---

# 12. Query Naming Convention

Contoh:

```sql
-- name: GetQuestionByID :one

-- name: CreateQuestion :one

-- name: UpdateQuestion :exec

-- name: DeleteQuestion :exec

-- name: SearchQuestion :many
```

Penamaan harus konsisten dengan Use Case.

---

# 13. Parameter Binding

Seluruh query menggunakan parameter binding.

Contoh:

```sql
WHERE id = $1
```

Tidak diperbolehkan:

```sql
"... WHERE id=" + id
```

Hal ini mencegah SQL Injection.

---

# 14. Mapping Strategy

Mapping dilakukan oleh Repository.

```text
Database Row

↓

sqlc Model

↓

Domain Entity
```

atau

```text
Domain Entity

↓

sqlc Parameter

↓

SQL
```

Domain tidak mengetahui struktur tabel.

---

# 15. Read Operation

Kategori operasi baca:

- FindByID
- Exists
- Search
- List
- Aggregate Query
- Dashboard Query

Gunakan indeks yang sesuai pada kolom filter.

---

# 16. Write Operation

Kategori operasi tulis:

- Insert
- Update
- Soft Delete
- Restore
- Bulk Insert
- Bulk Update

Seluruh operasi tulis dijalankan dalam transaction jika melibatkan lebih dari satu perubahan.

---

# 17. Bulk Operation

Untuk proses besar seperti:

- Import 50.000 soal
- Sinkronisasi data
- Migrasi

Gunakan:

- COPY Protocol (pgx)
- Batch Query
- Chunk Processing

Hindari ribuan operasi `INSERT` satu per satu.

---

# 18. Transaction Support

Repository menerima transaction dari Application Layer.

```text
Application

↓

Begin Transaction

↓

Repository A

↓

Repository B

↓

Commit
```

Repository tidak memulai transaction sendiri.

---

# 19. Context Propagation

Semua operasi database wajib menggunakan `context.Context`.

```text
HTTP Request

↓

Use Case

↓

Repository

↓

pgx
```

Manfaat:

- Timeout
- Cancellation
- Tracing
- Request Scope

---

# 20. Error Handling

Error database dipetakan menjadi error domain/aplikasi.

Contoh:

| Database Error | Application Error |
|----------------|-------------------|
| no rows | ErrNotFound |
| unique violation | ErrDuplicateData |
| foreign key violation | ErrInvalidReference |
| serialization failure | ErrConflict |

Driver error tidak boleh bocor ke Interface Layer.

---

# 21. Retry Strategy

Retry hanya dilakukan untuk error yang bersifat sementara, misalnya:

- Deadlock
- Serialization Failure
- Connection Reset

Retry tidak dilakukan untuk:

- Validation Error
- Duplicate Data
- Business Rule Error

Strategi retry menggunakan exponential backoff dengan jumlah percobaan terbatas.

---

# 22. Performance Optimization

Standar performa:

- Hindari `SELECT *`
- Gunakan prepared statement
- Gunakan indeks yang tepat
- Gunakan batch processing
- Hindari query di dalam loop
- Gunakan pagination
- Gunakan projection jika hanya membutuhkan sebagian kolom

---

# 23. Read vs Write Optimization

Read-heavy workload:

```text
Question Bank

Learning Material

Analytics

Leaderboard
```

Dapat menggunakan:

- Read Replica (future)
- Cache
- Materialized View (future)

Write tetap diarahkan ke primary PostgreSQL.

---

# 24. Cache Integration

Repository dapat menggunakan cache transparan.

```text
Repository

↓

Redis

↓

Cache Hit

↓

Return Data
```

atau

```text
Repository

↓

Redis Miss

↓

PostgreSQL

↓

Update Cache
```

Strategi cache:

- Cache Aside
- TTL
- Cache Invalidation setelah commit

---

# 25. Security Consideration

Seluruh akses database harus memenuhi:

- Parameterized Query
- Least Privilege Database User
- TLS Connection
- Audit Logging
- Tidak mengekspos informasi schema
- Tidak menyimpan secret di source code

Jika menggunakan Supabase Row Level Security (RLS), repository harus tetap memperlakukan RLS sebagai lapisan keamanan tambahan, bukan pengganti validasi bisnis.

---

# 26. Observability

Setiap query penting dicatat sebagai telemetry.

Metric yang dipantau:

- Query Duration
- Slow Query
- Connection Pool Usage
- Transaction Duration
- Error Rate
- Retry Count

Integrasi menggunakan OpenTelemetry.

---

# 27. Testing Strategy

Pengujian dilakukan pada beberapa tingkat:

### Unit Test

Menggunakan mock repository.

### Integration Test

Menggunakan PostgreSQL nyata (lokal atau environment uji).

### Migration Test

Memastikan migration dapat dijalankan naik dan turun tanpa error.

### Performance Test

Mengukur:

- Throughput
- Latency
- Query Cost
- Pool Utilization

---

# 28. Anti-Patterns

Hindari praktik berikut:

### SQL Inline

```go
db.Query("SELECT * FROM question")
```

❌

---

### Query di Handler

```text
Handler

↓

Database
```

❌

---

### Repository Mengandung Business Rule

```text
if score > passingGrade
```

❌

---

### Membuka Koneksi per Request

```text
Request

↓

New Database Connection
```

❌

---

### SELECT *

```sql
SELECT *
```

❌

Gunakan hanya kolom yang dibutuhkan.

---

# 29. Scalability Consideration

Database Access Layer siap mendukung:

- Read Replica
- Multi Region
- Connection Pool Scaling
- CQRS Read Model
- Partitioning
- Sharding (future)
- Vector Database Integration untuk AI

Tanpa mengubah Domain maupun Application Layer.

---

# 30. Future Evolution

Pada fase enterprise, Database Access dapat berkembang menjadi:

```text
Application

↓

Repository

↓

Query Router

↓

Primary PostgreSQL

↓

Read Replica

↓

Analytics Database

↓

Vector Database
```

Pendekatan ini memungkinkan pemisahan workload sesuai karakteristik data.

---

# Summary

Database Access pada YakinLulus.id dibangun dengan pendekatan **SQL First** menggunakan `pgx` dan `sqlc`.

Prinsip utama:

- Repository sebagai satu-satunya akses ke database.
- SQL eksplisit dan type-safe.
- Connection pooling melalui `pgxpool`.
- Transaction dikendalikan oleh Application Layer.
- Context digunakan pada seluruh operasi.
- Observability melalui OpenTelemetry.
- Siap mendukung scaling, CQRS, dan arsitektur enterprise.

Dokumen berikutnya akan membahas bagaimana transaction dikelola secara konsisten di seluruh aplikasi.

> **`backend/10_transaction_management.md`**