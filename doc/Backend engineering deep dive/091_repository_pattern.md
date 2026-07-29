# 09_repository_pattern.md

# YakinLulus.id Repository Pattern

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar implementasi **Repository Layer** pada backend YakinLulus.id.

Repository Layer bertanggung jawab sebagai satu-satunya lapisan yang melakukan akses ke database PostgreSQL (Supabase).

Tujuan utama:

* Memisahkan business logic dari persistence layer.
* Menstandarkan akses data.
* Mendukung pengujian (testing).
* Mendukung Dependency Injection.
* Mendukung migrasi database di masa depan.

---

# 2. Repository Position

```text
HTTP Request
      │
Controller
      │
Service
      │
Repository
      │
GORM
      │
Supabase PostgreSQL
```

Repository merupakan lapisan paling bawah sebelum database.

---

# 3. Responsibilities

Repository hanya bertanggung jawab terhadap:

* CRUD Database
* Query
* Pagination
* Filtering
* Sorting
* Aggregate Query
* Transaction Participation
* Mapping Entity ↔ Database

Repository **tidak boleh**:

* Menjalankan business logic
* Mengakses HTTP Context
* Mengakses JWT
* Mengirim Email
* Mengirim Notification
* Memanggil AI
* Mengelola Cache
* Melakukan Authorization
* Mengelola Queue

---

# 4. Repository Principles

Repository mengikuti prinsip berikut:

* Single Responsibility
* Interface Driven
* Testable
* Database Agnostic
* Reusable
* Transaction Aware
* Stateless

---

# 5. Repository Architecture

```text
Service
    │
Repository Interface
    │
Repository Implementation
    │
GORM
    │
Supabase PostgreSQL
```

Service hanya mengenal interface.

---

# 6. Repository Structure

Contoh:

```text
question/

repository/

interface.go

question_repository.go

question_query.go

question_transaction.go
```

---

# 7. Repository Interface

Contoh:

```go
type QuestionRepository interface {
    Create(ctx context.Context, tx *gorm.DB, entity *Question) error

    Update(ctx context.Context, tx *gorm.DB, entity *Question) error

    Delete(ctx context.Context, tx *gorm.DB, id uuid.UUID) error

    FindByID(ctx context.Context, id uuid.UUID) (*Question, error)

    FindMany(ctx context.Context, filter QuestionFilter) ([]Question, error)

    Exists(ctx context.Context, id uuid.UUID) (bool, error)

    Count(ctx context.Context, filter QuestionFilter) (int64, error)
}
```

Repository menerima `*gorm.DB` hanya untuk operasi yang berada di dalam transaction. Untuk operasi read biasa, implementasi menggunakan koneksi default repository.

---

# 8. Standard CRUD Operations

Minimal setiap repository memiliki:

* Create
* Update
* Delete (Soft Delete bila berlaku)
* FindByID
* FindMany
* Exists
* Count

Repository dapat memiliki operasi tambahan sesuai kebutuhan domain.

---

# 9. Query Object Pattern

Query kompleks menggunakan Filter Object.

Contoh:

```go
type QuestionFilter struct {
    SubjectID    uuid.UUID
    GradeID      uuid.UUID
    ChapterID    uuid.UUID
    Difficulty   string
    Status       string
    Search       string
    Page         int
    Limit        int
    Sort         string
    Order        string
}
```

Hindari method seperti:

```text
FindBySubjectAndGradeAndDifficultyAndStatus(...)
```

---

# 10. Pagination Pattern

Repository menerima parameter:

```go
type Pagination struct {
    Page  int
    Limit int
}
```

Repository mengembalikan:

```go
type PageResult[T any] struct {
    Items      []T
    Total      int64
    Page       int
    Limit      int
    TotalPages int
}
```

---

# 11. Sorting Pattern

Sorting dilakukan menggunakan whitelist.

Contoh:

```text
created_at

updated_at

name

difficulty
```

Kolom di luar whitelist ditolak.

---

# 12. Filtering Pattern

Filtering menggunakan Query Object.

Contoh:

```text
Subject

Grade

Difficulty

Status

Published

CreatedBy
```

Repository tidak menerima raw SQL dari client.

---

# 13. Search Pattern

Search menggunakan PostgreSQL Full Text Search atau `ILIKE`, bergantung pada kebutuhan dan ukuran dataset.

Contoh:

```text
Question

Material

Subject
```

Strategi pencarian dipilih berdasarkan performa dan hasil profiling.

---

# 14. Aggregate Query

Repository dapat menyediakan aggregate.

Contoh:

```text
Count

Average

Maximum

Minimum

Sum
```

Business interpretation tetap berada di Service.

---

# 15. Transaction Pattern

Transaction dibuat oleh Service.

Contoh:

```text
Service

↓

db.Begin()

↓

Repository A

↓

Repository B

↓

Commit
```

Repository tidak memanggil:

```go
db.Begin()
```

---

# 16. Read Repository

Read operation:

```text
FindByID

FindMany

Count

Exists
```

Tidak mengubah state database.

---

# 17. Write Repository

Write operation:

```text
Create

Update

Delete

Restore
```

Seluruh write mengikuti transaction bila merupakan bagian dari workflow yang lebih besar.

---

# 18. Soft Delete Strategy

Entity penting menggunakan Soft Delete.

Contoh:

* User
* Question
* Material
* Exam

Kolom:

```text
deleted_at
```

Query normal tidak mengembalikan data yang telah dihapus secara logis.

---

# 19. Hard Delete

Hard delete hanya digunakan untuk:

* Temporary Table
* Queue Metadata
* Cache Metadata
* Log dengan retention tertentu
* Data yang memang dirancang untuk dihapus permanen

Penghapusan permanen mengikuti kebijakan retensi data.

---

# 20. Optimistic Locking

Entity yang sering diperbarui dapat menggunakan versioning.

Contoh:

```text
version
```

Flow:

```text
Read

↓

Update

↓

Version Check

↓

Save
```

Jika versi berubah maka update ditolak.

---

# 21. Row Locking

Gunakan row locking hanya bila diperlukan.

Contoh:

* Finish Exam
* Payment (Future)
* Subscription (Future)

Gunakan `SELECT ... FOR UPDATE` secara terbatas untuk menghindari contention.

---

# 22. Eager Loading

Gunakan preload seperlunya.

Contoh:

```text
Question

↓

Options

↓

Explanation
```

Hindari preload seluruh relasi tanpa kebutuhan.

---

# 23. Lazy Loading

Relasi besar diambil menggunakan query terpisah.

Contoh:

```text
Material

↓

Video

↓

Attachment
```

---

# 24. Repository Error

Repository hanya mengembalikan:

* Database Error
* Not Found
* Duplicate Key
* Constraint Error
* Connection Error

Repository tidak mengembalikan business error.

---

# 25. Error Mapping

Contoh:

```text
Unique Constraint

↓

ErrDuplicateKey

↓

Service

↓

Duplicate Email
```

Konversi ke business error dilakukan pada Service Layer.

---

# 26. GORM Guidelines

Gunakan:

* Context-aware query (`WithContext`)
* Prepared Statement (bila sesuai)
* Select field seperlunya
* Preload seperlunya
* Batch Insert
* Batch Update bila memungkinkan

Hindari:

* Raw SQL tanpa alasan kuat
* `SELECT *`
* Nested loop query
* Query dalam loop (N+1)

---

# 27. Context Propagation

Seluruh repository method menerima:

```go
context.Context
```

Digunakan untuk:

* Timeout
* Cancellation
* Tracing
* Logging Correlation

---

# 28. Supabase PostgreSQL Guidelines

Repository menggunakan PostgreSQL standar.

Supabase hanya bertindak sebagai:

* PostgreSQL Database
* Managed Infrastructure

Repository tidak bergantung pada Supabase SDK untuk operasi database.

---

# 29. Query Performance

Target:

* Simple Query < 100 ms
* Complex Query < 300 ms

Seluruh query harus:

* Menggunakan index yang sesuai.
* Menghindari sequential scan bila tidak diperlukan.
* Menghindari query berulang.

Optimasi dilakukan berdasarkan `EXPLAIN ANALYZE` dan hasil monitoring produksi.

---

# 30. Bulk Operations

Repository mendukung:

* Batch Insert
* Batch Update
* Batch Soft Delete

Gunakan ukuran batch yang dapat dikonfigurasi untuk menghindari query yang terlalu besar.

---

# 31. Repository Testing

Repository diuji menggunakan Integration Test.

Pengujian mencakup:

* CRUD
* Pagination
* Filtering
* Sorting
* Transaction
* Constraint
* Soft Delete

Database pengujian harus terisolasi dari lingkungan produksi.

---

# 32. Repository Dependency Rules

Repository hanya boleh bergantung pada:

* GORM
* Database Driver
* Entity
* Query Object
* Context

Repository tidak boleh bergantung pada:

* Controller
* Service
* HTTP Package
* JWT
* Middleware

---

# 33. Repository Package Layout

```text
question/

repository/

interface.go

question_repository.go

question_query.go

question_filter.go

question_mapper.go
```

Untuk repository sederhana, beberapa file dapat digabungkan selama tetap mudah dipelihara.

---

# 34. Repository Naming Convention

Gunakan nama eksplisit.

Contoh:

```text
FindByID

FindMany

Create

Update

Delete

Exists

Count
```

Hindari:

```text
Process()

Handle()

Execute()

DoSomething()
```

---

# 35. Specification Pattern (Future)

Untuk query yang sangat kompleks, gunakan Specification Pattern.

Contoh:

```text
QuestionSpecification

ExamSpecification

MaterialSpecification
```

Hal ini menjaga repository tetap sederhana ketika kebutuhan query berkembang.

---

# 36. Read/Write Separation (Future)

Apabila performa menjadi bottleneck, repository dapat dipisahkan menjadi:

```text
Read Repository

↓

Read Replica

Write Repository

↓

Primary Database
```

Perubahan ini tidak mengubah kontrak Service karena bergantung pada interface.

---

# 37. Repository Checklist

Sebelum repository di-merge:

* Tidak ada business logic.
* Menggunakan context.
* Menggunakan interface.
* Mendukung transaction.
* Mendukung pagination bila diperlukan.
* Mendukung filtering bila diperlukan.
* Menggunakan whitelist untuk sorting.
* Memiliki integration test.
* Tidak menghasilkan N+1 query.

---

# 38. Summary

Repository Layer pada YakinLulus.id menjadi satu-satunya pintu akses ke Supabase PostgreSQL. Dengan pendekatan Interface + Repository Pattern, backend memperoleh:

* Pemisahan yang jelas antara business logic dan persistence.
* Kemudahan pengujian melalui dependency injection.
* Fleksibilitas migrasi teknologi database di masa depan.
* Query yang konsisten dan terstandarisasi.
* Fondasi yang siap berkembang menuju arsitektur enterprise maupun microservices.
