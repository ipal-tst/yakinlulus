# Repository Pattern Implementation

**Document** : `backend/08_repository_pattern_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Repository Pattern** pada backend YakinLulus.id.

Repository Pattern berfungsi sebagai lapisan abstraksi antara **Domain Layer** dan **Infrastructure Layer**, sehingga Domain tidak memiliki pengetahuan mengenai:

- PostgreSQL
- Supabase
- sqlc
- pgx
- Redis
- Cache
- Storage
- External Service

Repository menjadi satu-satunya mekanisme untuk melakukan persistence terhadap Aggregate dan Entity.

---

# 2. Repository dalam Clean Architecture

Repository berada pada dua layer yang berbeda.

```text
Domain Layer

Repository Interface

↓

Infrastructure Layer

Repository Implementation
```

Diagram dependency:

```text
Application

↓

Repository Interface

↓

Repository Implementation

↓

PostgreSQL
```

Application tidak mengetahui implementasi repository.

---

# 3. Tujuan Repository

Repository bertanggung jawab untuk:

- Menyimpan Aggregate
- Mengambil Aggregate
- Memperbarui Aggregate
- Menghapus Aggregate
- Menyediakan query yang dibutuhkan oleh Domain

Repository **tidak bertanggung jawab** terhadap:

- Business Rule
- Authorization
- HTTP
- Validation Format
- JSON
- Logging Business

---

# 4. Repository Structure

Contoh struktur module.

```text
modules/

question/

├── domain/
│
│   └── repository/
│       └── question_repository.go
│
├── infrastructure/
│
│   └── persistence/
│
│       ├── postgres/
│       │
│       │   ├── repository.go
│       │   ├── mapper.go
│       │   └── queries.go
│       │
│       └── cache/
│           └── repository.go
```

---

# 5. Repository Interface

Repository selalu didefinisikan pada Domain.

Contoh:

```go
type QuestionRepository interface {
    Create(ctx context.Context, question *Question) error
    Update(ctx context.Context, question *Question) error
    Delete(ctx context.Context, id QuestionID) error

    FindByID(ctx context.Context, id QuestionID) (*Question, error)
    FindByCode(ctx context.Context, code QuestionCode) (*Question, error)

    Exists(ctx context.Context, code QuestionCode) (bool, error)
}
```

Repository hanya mendefinisikan kontrak.

---

# 6. Repository Implementation

Implementasi repository berada di Infrastructure.

```text
Infrastructure

↓

PostgreSQL

↓

pgx

↓

sqlc
```

Repository tidak boleh dipanggil langsung oleh HTTP Handler.

---

# 7. Repository Flow

```text
HTTP

↓

Use Case

↓

Repository Interface

↓

Repository PostgreSQL

↓

sqlc

↓

pgx Pool

↓

Supabase PostgreSQL
```

---

# 8. Aggregate Persistence

Repository bekerja terhadap Aggregate.

Contoh:

```text
Exam Aggregate

↓

ExamRepository
```

Bukan:

```text
QuestionTable

↓

Direct SQL
```

Repository memahami model Domain, bukan struktur tabel.

---

# 9. Mapping Strategy

Mapping dilakukan pada Infrastructure Layer.

```text
Database Row

↓

Persistence Model

↓

Domain Entity
```

dan

```text
Domain Entity

↓

Persistence Model

↓

SQL Parameter
```

Domain tidak mengetahui proses mapping.

---

# 10. sqlc Integration

Seluruh query SQL ditulis secara manual.

```text
SQL File

↓

sqlc generate

↓

Generated Code

↓

Repository
```

Repository menggunakan generated code dari sqlc, bukan menulis query secara inline.

---

# 11. Repository Naming

Gunakan format berikut.

```text
<Question>Repository

<User>Repository

<Exam>Repository

<Material>Repository
```

Implementasi:

```text
PostgresQuestionRepository

PostgresExamRepository
```

---

# 12. Read vs Write Repository

Untuk MVP:

```text
Single Repository
```

Untuk enterprise siap dipisahkan menjadi:

```text
Command Repository

↓

Write Database
```

```text
Query Repository

↓

Read Database
```

Struktur saat ini harus memudahkan evolusi ke CQRS.

---

# 13. Query Responsibility

Repository hanya menyediakan query yang memang dibutuhkan Use Case.

Contoh:

```text
FindByID()

FindByCode()

FindByExam()

Search()

Exists()
```

Hindari repository generik dengan method yang tidak memiliki tujuan bisnis.

---

# 14. Search Strategy

Operasi pencarian dipisahkan dari Aggregate retrieval.

Contoh:

```text
SearchQuestion()

SearchExam()

SearchStudent()
```

Search menggunakan filter yang eksplisit.

---

# 15. Pagination

Repository mendukung pagination.

Standar:

```text
Page

Limit

Sort

Filter
```

Gunakan cursor pagination untuk dataset besar seperti:

- Ranking
- Question Bank
- Analytics
- Activity Log

Offset pagination masih diperbolehkan untuk dataset kecil.

---

# 16. Transaction Support

Repository tidak membuat transaction.

Repository menerima transaction dari Application Layer.

```text
Application

↓

Begin Transaction

↓

Repository

↓

Commit
```

Dengan demikian beberapa repository dapat berbagi transaction yang sama.

---

# 17. Optimistic Locking

Entity yang sering diperbarui mendukung versioning.

```text
Version

↓

Update

↓

Version + 1
```

Jika version berubah:

```text
Conflict Error
```

Contoh:

- Exam
- Material
- Question
- User Profile

---

# 18. Soft Delete

Entity tertentu menggunakan soft delete.

Contoh:

```text
Question

Material

User

Exam Template
```

Field standar:

```text
deleted_at
deleted_by
```

Repository secara default hanya mengembalikan data yang belum dihapus.

---

# 19. Bulk Operation

Repository mendukung operasi massal.

Contoh:

```text
Bulk Import Question

Bulk Update Difficulty

Bulk Archive

Bulk Restore
```

Operasi dilakukan menggunakan batch processing untuk mengurangi round-trip database.

---

# 20. Cache Strategy

Repository dapat menggunakan cache sebagai lapisan tambahan.

```text
Application

↓

Repository

↓

Redis Cache

↓

PostgreSQL
```

Aturan:

- Cache bersifat transparan bagi Application.
- Cache invalidation terjadi setelah commit transaction.

---

# 21. Error Mapping

Repository menerjemahkan error database menjadi error Domain/Application.

Contoh:

```text
Unique Constraint

↓

ErrDuplicateQuestionCode
```

```text
No Rows

↓

ErrQuestionNotFound
```

Repository tidak mengembalikan error mentah dari driver database ke Application Layer.

---

# 22. Performance Strategy

Optimasi repository:

- Gunakan prepared statement melalui pgx/sqlc.
- Hindari N+1 Query.
- Gunakan batch query jika memungkinkan.
- Pilih kolom yang dibutuhkan saja.
- Gunakan index yang sesuai.
- Hindari `SELECT *`.

---

# 23. Read Model Optimization

Untuk data analitik atau dashboard:

```text
Repository

↓

Read Model

↓

DTO
```

Tidak selalu perlu memuat Aggregate lengkap.

Contoh:

- Dashboard
- Leaderboard
- Statistik
- Ringkasan hasil ujian

---

# 24. Anti-Patterns

### SQL di Use Case

```text
Use Case

↓

SELECT ...

❌
```

---

### Repository Berisi Business Rule

```text
Repository

↓

if score > passing grade

❌
```

---

### Handler Mengakses sqlc

```text
Handler

↓

Generated Query

❌
```

---

### Domain Mengakses pgx

```text
Entity

↓

pgx.Query()

❌
```

---

### Generic Repository

```text
Save()

Load()

Update()

Delete()

Untuk semua Entity

❌
```

Repository harus mengikuti bahasa bisnis (ubiquitous language).

---

# 25. Security Consideration

Repository harus:

- Menggunakan parameterized query.
- Tidak membangun SQL melalui string concatenation.
- Membatasi data yang dikembalikan.
- Menyaring soft deleted record.
- Mendukung Row Level Security (RLS) bila digunakan.
- Tidak mengekspos informasi internal database.

---

# 26. Scalability Consideration

Repository dirancang agar mendukung:

- Read Replica.
- Sharding (future).
- CQRS.
- Cache Layer.
- Distributed Database.
- Multi-region deployment.

Semua perubahan tersebut tidak memengaruhi Domain maupun Application.

---

# 27. Future Evolution

Repository Pattern telah dipersiapkan untuk mendukung:

- Multi Database Provider.
- PostgreSQL Read Replica.
- Event Sourcing Read Model.
- Elasticsearch/OpenSearch untuk pencarian.
- Vector Database untuk AI.
- Multi Tenant Repository.
- Hybrid Storage.

---

# Summary

Repository Pattern pada YakinLulus.id menerapkan prinsip **Persistence Ignorance**, di mana Domain dan Application tidak mengetahui detail penyimpanan data.

Prinsip implementasi:

- Repository Interface berada di Domain.
- Repository Implementation berada di Infrastructure.
- SQL ditulis manual dan dihasilkan melalui `sqlc`.
- `pgx` digunakan sebagai PostgreSQL driver.
- Transaction dikendalikan oleh Application Layer.
- Mapping dilakukan di Infrastructure.
- Repository menggunakan bahasa bisnis, bukan struktur tabel.

Dengan pendekatan ini, lapisan persistence menjadi terisolasi, mudah diuji, berkinerja tinggi, dan siap berkembang menuju arsitektur enterprise.