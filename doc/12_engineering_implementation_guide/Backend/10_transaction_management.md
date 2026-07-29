````markdown
# Transaction Management

**Document** : `backend/10_transaction_management.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Transaction Management** pada backend YakinLulus.id.

Transaction Management memastikan bahwa setiap proses bisnis yang melibatkan perubahan data berjalan secara:

- Atomic
- Consistent
- Isolated
- Durable (ACID)

Tujuan utamanya adalah menjaga integritas data meskipun terjadi:

- Error aplikasi
- Kegagalan database
- Gangguan jaringan
- Concurrent update
- System crash

---

# 2. Prinsip Dasar

Transaction hanya digunakan ketika sebuah Use Case melakukan perubahan data (write operation).

Contoh:

- Create Exam
- Publish Question
- Import Question
- Submit Answer
- Finish Exam
- Update Material
- Register Student

Operasi baca (read-only) tidak memerlukan transaction kecuali terdapat kebutuhan konsistensi khusus.

---

# 3. Transaction Boundary

Transaction dimulai dan diakhiri di **Application Layer**, bukan di Repository.

```text
HTTP Request
      │
      ▼
Application Use Case
      │
Begin Transaction
      │
Repository A
      │
Repository B
      │
Repository C
      │
Commit
      │
Publish Event
```

Jika terjadi kegagalan:

```text
Rollback
```

---

# 4. Ownership

Hanya Use Case yang boleh:

- Begin Transaction
- Commit
- Rollback

Repository tidak diperbolehkan membuat transaction sendiri.

---

# 5. Architecture

```text
Handler

↓

Use Case

↓

Transaction Manager

↓

Repository

↓

PostgreSQL
```

Transaction Manager bertindak sebagai abstraksi sehingga Domain tidak mengetahui implementasi database.

---

# 6. Transaction Manager Interface

Contoh interface:

```go
type TransactionManager interface {
    WithinTransaction(
        ctx context.Context,
        fn func(ctx context.Context) error,
    ) error
}
```

Implementasi berada pada Infrastructure Layer.

---

# 7. Transaction Flow

```text
Receive Request

↓

Authorization

↓

Begin Transaction

↓

Execute Domain Logic

↓

Repository Operation

↓

Commit

↓

Publish Domain Event

↓

Return Response
```

Jika salah satu langkah gagal sebelum commit:

```text
Rollback

↓

Return Error
```

---

# 8. Unit of Work

Satu transaction merepresentasikan satu **Unit of Work**.

Contoh:

```
Create Exam
```

meliputi:

- membuat exam
- menyimpan konfigurasi
- menyimpan question pool
- menyimpan metadata

Seluruh proses harus berhasil bersama-sama.

---

# 9. Nested Transaction

Nested transaction tidak digunakan.

Jika sebuah Use Case memanggil service lain, service tersebut harus menggunakan transaction yang sama.

```text
Use Case

↓

Transaction

↓

Service A

↓

Service B

↓

Repository
```

---

# 10. Repository Participation

Repository menerima executor transaction.

```text
Transaction

↓

Repository

↓

Query
```

Repository tidak mengetahui apakah request berasal dari transaction atau bukan.

---

# 11. Commit Strategy

Commit hanya dilakukan jika:

- seluruh validasi berhasil
- seluruh repository berhasil
- seluruh aggregate valid
- tidak ada error

Setelah commit berhasil:

```text
Publish Domain Event
```

---

# 12. Rollback Strategy

Rollback dilakukan ketika:

- validation gagal
- repository gagal
- database error
- panic
- context timeout
- context cancelled

Rollback harus dilakukan otomatis.

---

# 13. Panic Recovery

Jika terjadi panic:

```text
panic

↓

Recover

↓

Rollback

↓

Logging

↓

Return Error
```

Hal ini mencegah transaction menggantung.

---

# 14. Domain Event

Domain Event tidak boleh dipublikasikan sebelum commit.

Urutan yang benar:

```text
Commit

↓

Publish Event
```

Bukan:

```text
Publish Event

↓

Commit
```

Karena dapat menyebabkan inkonsistensi jika commit gagal.

---

# 15. Outbox Pattern (Future)

Untuk komunikasi lintas service atau worker, gunakan Outbox Pattern.

```text
Transaction

↓

Business Data

+

Outbox Event

↓

Commit

↓

Worker

↓

Publish Event
```

Keuntungan:

- tidak kehilangan event
- tidak terjadi publish tanpa commit
- cocok untuk Event Driven Architecture

---

# 16. Isolation Level

Default isolation:

```text
READ COMMITTED
```

Gunakan level lebih tinggi hanya bila diperlukan.

| Isolation Level | Penggunaan |
|-----------------|------------|
| Read Committed | Default |
| Repeatable Read | Reporting tertentu |
| Serializable | Operasi finansial atau sangat kritis |

---

# 17. Optimistic Locking

Untuk entity yang sering diperbarui:

```text
version

↓

Update

↓

version + 1
```

Jika versi berubah:

```text
Conflict

↓

Retry atau Return Error
```

Contoh:

- Exam
- Question
- Material
- User Profile

---

# 18. Deadlock Handling

Jika database mendeteksi deadlock:

```text
Rollback

↓

Retry
```

Retry:

- maksimal beberapa kali
- exponential backoff
- hanya untuk error yang bersifat sementara

---

# 19. Long Running Process

Proses yang memerlukan waktu lama tidak boleh berada di dalam transaction.

Contoh yang harus dipindahkan ke Worker:

- Upload File
- AI Processing
- Import besar
- Video Processing
- Email
- Push Notification

Transaction hanya menyimpan metadata atau membuat job.

---

# 20. External Service

Jangan memanggil layanan eksternal di dalam transaction.

Contoh yang tidak diperbolehkan:

```text
Begin Transaction

↓

Save Exam

↓

Call AI API

↓

Commit
```

Yang benar:

```text
Commit

↓

Publish Event

↓

Worker

↓

AI API
```

---

# 21. Timeout

Setiap transaction memiliki timeout.

Contoh:

```text
5–30 detik
```

Disesuaikan berdasarkan jenis operasi.

Jika timeout tercapai:

```text
Rollback
```

---

# 22. Context Propagation

Transaction selalu menggunakan `context.Context`.

```text
Request

↓

Context

↓

Transaction

↓

Repository
```

Context membawa:

- timeout
- cancellation
- tracing
- request ID

---

# 23. Logging

Setiap transaction penting dicatat.

Minimal informasi:

- Transaction ID
- Use Case
- Duration
- Status
- Rollback Reason
- Error
- Retry Count

Logging menggunakan structured logging (Zap).

---

# 24. Monitoring

Metric yang dipantau:

- Commit Count
- Rollback Count
- Transaction Duration
- Timeout
- Deadlock
- Retry Count
- Failure Rate

Integrasi menggunakan OpenTelemetry dan Prometheus.

---

# 25. Testing Strategy

Minimal pengujian:

### Success

Commit berhasil.

### Validation Error

Rollback.

### Repository Error

Rollback.

### Panic

Rollback.

### Timeout

Rollback.

### Deadlock

Retry.

### Concurrent Update

Conflict terdeteksi.

---

# 26. Anti-Patterns

### Transaction di Repository

```text
Repository

↓

Begin Transaction

❌
```

---

### Transaction Terlalu Panjang

```text
Begin

↓

Upload File

↓

AI

↓

Email

↓

Commit

❌
```

---

### Publish Event Sebelum Commit

```text
Publish Event

↓

Commit

❌
```

---

### Nested Transaction

```text
Transaction

↓

Transaction

❌
```

---

### External API di Dalam Transaction

```text
Commit Menunggu AI

❌
```

---

# 27. Security Consideration

Transaction Management membantu keamanan dengan:

- menjaga integritas data;
- mencegah partial update;
- memastikan rollback saat gagal;
- menjaga konsistensi audit log;
- mendukung recovery ketika terjadi panic.

---

# 28. Scalability Consideration

Strategi ini mendukung:

- Horizontal Scaling
- Event Driven Architecture
- CQRS
- Worker
- Outbox Pattern
- Distributed Processing

Dengan menjaga transaction tetap singkat, throughput sistem akan meningkat.

---

# 29. Future Evolution

Transaction Management telah dipersiapkan untuk mendukung:

- Outbox Pattern
- Saga Pattern
- Distributed Transaction Orchestration
- Event Bus (Kafka/NATS/RabbitMQ)
- Multi-region deployment
- Multi-tenant transaction policy

Implementasi tersebut dapat ditambahkan tanpa mengubah kontrak Use Case.

---

# Summary

Transaction Management pada YakinLulus.id mengikuti prinsip bahwa **Application Layer adalah pemilik transaction**.

Prinsip utama:

- Transaction dimulai di Use Case.
- Repository tidak membuat transaction.
- Commit hanya dilakukan setelah seluruh proses berhasil.
- Rollback otomatis pada setiap kegagalan.
- Domain Event dipublikasikan setelah commit.
- Proses berat dipindahkan ke Worker.
- Siap berkembang menuju Outbox Pattern dan arsitektur Event Driven.

Pendekatan ini menjaga integritas data, meningkatkan performa, dan memastikan backend tetap konsisten pada skala enterprise.
````
