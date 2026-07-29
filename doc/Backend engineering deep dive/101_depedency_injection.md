# 10_dependency_injection.md

# YakinLulus.id Dependency Injection Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Dependency Injection (DI)** pada backend YakinLulus.id.

Dependency Injection digunakan untuk mengelola seluruh object lifecycle, dependency wiring, dan composition root sehingga setiap module memiliki dependency yang jelas, mudah diuji, dan mudah dipelihara.

Dokumen ini menjadi standar implementasi seluruh dependency pada backend.

---

# 2. Goals

Dependency Injection bertujuan untuk:

* Menghilangkan tight coupling.
* Mempermudah Unit Testing.
* Mendukung Interface-based Programming.
* Mendukung Modular Monolith.
* Mempermudah migrasi menuju Microservices.
* Menyediakan Composition Root yang tunggal.

---

# 3. DI Principles

Seluruh implementasi mengikuti prinsip berikut:

* Constructor Injection
* Interface First
* Explicit Dependency
* No Global State
* Composition Root
* Single Responsibility
* Immutable Dependency
* Dependency Inversion Principle

---

# 4. High Level Architecture

```text id="m4j31k"
Application

↓

Bootstrap

↓

Container

↓

Module Provider

↓

Controller

↓

Service

↓

Repository

↓

Database
```

Seluruh dependency dibuat saat aplikasi melakukan bootstrap.

---

# 5. Composition Root

Composition Root berada pada:

```text id="v0q6m9"
cmd/server/main.go

↓

internal/app/bootstrap.go

↓

internal/app/container.go
```

Seluruh object dibuat hanya dari lokasi tersebut.

Tidak diperbolehkan membuat object bisnis secara acak di dalam controller atau service.

---

# 6. Bootstrap Flow

```text id="g6p1ne"
Load Environment

↓

Load Configuration

↓

Initialize Logger

↓

Initialize Database

↓

Initialize Redis

↓

Initialize Storage

↓

Initialize Queue

↓

Initialize External Services

↓

Build Container

↓

Register Routes

↓

Start HTTP Server
```

Setiap langkah harus gagal secara eksplisit (fail fast) apabila dependency wajib tidak dapat diinisialisasi.

---

# 7. Dependency Graph

```text id="0nzwnv"
Controller

↓

Service

↓

Repository

↓

Database
```

Shared dependency:

```text id="v2c2ha"
Logger

Validator

Redis

Storage

Queue

Configuration
```

---

# 8. Constructor Injection

Seluruh dependency diinjeksikan melalui constructor.

Contoh:

```go id="2j6rxl"
type QuestionService struct {
    repo       QuestionRepository
    audit      AuditService
    eventBus   EventBus
    logger     Logger
}

func NewQuestionService(
    repo QuestionRepository,
    audit AuditService,
    eventBus EventBus,
    logger Logger,
) *QuestionService {
    return &QuestionService{
        repo: repo,
        audit: audit,
        eventBus: eventBus,
        logger: logger,
    }
}
```

Dependency tidak boleh di-set melalui setter setelah object dibuat.

---

# 9. Interface-Based Dependency

Service hanya mengenal interface.

```go id="wj4n7i"
type QuestionRepository interface {
    FindByID(...)
}
```

Implementasi:

```go id="yg1m5s"
type questionRepository struct {
    db *gorm.DB
}
```

Controller juga bergantung pada interface service.

---

# 10. Container Structure

```text id="ix55lb"
internal/app/

container.go

bootstrap.go

provider.go

router.go
```

---

# 11. Container Responsibilities

Container bertanggung jawab untuk:

* Membangun dependency.
* Menyimpan singleton.
* Melakukan wiring antar module.
* Menyediakan dependency kepada router.

Container tidak boleh berisi business logic.

---

# 12. Recommended Container Structure

```go id="2n5w1x"
type Container struct {
    Config      *Config
    DB          *gorm.DB
    Redis       *redis.Client
    Storage     StorageAdapter
    Queue       QueueAdapter
    Logger      Logger
    Validator   Validator
    EventBus    EventBus

    IdentityModule IdentityModule
    UserModule     UserModule
    QuestionModule QuestionModule
    ExamModule     ExamModule
    CBTModule      CBTModule
}
```

Container hanya menyimpan dependency yang telah selesai diinisialisasi.

---

# 13. Module Provider Pattern

Setiap module memiliki provider sendiri.

Contoh:

```text id="b4frps"
question/

provider.go
```

Isi provider:

```text id="90q8w9"
Repository

↓

Service

↓

Controller
```

Provider mengembalikan satu objek module yang siap digunakan.

---

# 14. Module Composition

Contoh:

```text id="s1d6vk"
Question Module

↓

Question Repository

↓

Question Service

↓

Question Controller
```

Module lain hanya menggunakan interface service yang diekspos.

---

# 15. Module Registration Flow

```text id="q8v5ya"
Build Repository

↓

Build Service

↓

Build Controller

↓

Register Route
```

Seluruh modul mengikuti urutan yang sama.

---

# 16. Object Lifecycle

Object dibagi menjadi beberapa lifecycle.

| Type            | Lifecycle |
| --------------- | --------- |
| Config          | Singleton |
| Logger          | Singleton |
| Database        | Singleton |
| Redis           | Singleton |
| Storage Adapter | Singleton |
| Queue Adapter   | Singleton |
| Validator       | Singleton |
| Event Bus       | Singleton |
| Repository      | Singleton |
| Service         | Singleton |
| Controller      | Singleton |

Karena backend Gin bersifat stateless, singleton aman selama dependency tidak menyimpan state request.

---

# 17. Request Scope

Data berikut **bukan** singleton:

* Context
* JWT Claims
* Request DTO
* Response DTO
* Request ID
* User Context

Semuanya dibuat untuk setiap request.

---

# 18. Shared Dependencies

Shared dependency:

```text id="9n0qyg"
Logger

Validator

Clock

UUID Generator

Configuration

Event Bus

Cache

Metrics
```

Gunakan interface untuk dependency yang mungkin diganti implementasinya.

---

# 19. Database Injection

Repository menerima:

```go id="ml3w1g"
*gorm.DB
```

Service tidak boleh menerima database secara langsung kecuali service yang memang bertugas mengelola transaction boundary.

---

# 20. External Adapter Injection

Adapter:

```text id="s0ob4i"
Supabase Storage

Redis

SMTP

Push Notification

Python AI

Object Storage
```

Seluruh adapter menggunakan interface.

---

# 21. Transaction Injection

Transaction diteruskan oleh Service.

```text id="t4u71r"
Service

↓

Transaction

↓

Repository
```

Repository tidak membuat transaction sendiri.

---

# 22. Configuration Injection

Configuration dimuat satu kali.

```text id="2uxk03"
Environment

↓

Config Loader

↓

Config Struct

↓

Container
```

Konfigurasi bersifat read-only selama aplikasi berjalan, kecuali konfigurasi yang memang dirancang untuk dimuat ulang.

---

# 23. Logger Injection

Gunakan satu instance logger.

```text id="bnq7g7"
Logger

↓

Controller

↓

Service

↓

Repository
```

Logger menerima context untuk membawa Request ID dan informasi tracing.

---

# 24. Validator Injection

Validator dibuat satu kali.

```text id="f4gxzq"
Validator

↓

Controller
```

Custom validator didaftarkan saat bootstrap.

---

# 25. Event Bus Injection

```text id="jhn59x"
Event Bus

↓

Question Service

↓

Exam Service

↓

Analytics Service
```

Event bus tidak mengetahui business logic.

---

# 26. Queue Injection

Queue Adapter:

```text id="0e53m3"
Asynq

↓

Queue Interface

↓

Service
```

Service hanya mengenal interface queue.

---

# 27. Storage Injection

```text id="p0rj9e"
Storage Interface

↓

Supabase Storage Adapter

↓

Media Service
```

Apabila penyedia storage berubah di masa depan, perubahan hanya terjadi pada adapter.

---

# 28. AI Adapter Injection

```text id="pvgd5f"
AI Interface

↓

Python AI Adapter

↓

Question Generator
```

Question Generator tidak mengetahui implementasi AI tertentu.

---

# 29. Avoiding Circular Dependency

Tidak diperbolehkan:

```text id="srdk2z"
Question Service

↓

Exam Service

↓

Question Service
```

Solusi:

* Gunakan interface.
* Pisahkan domain.
* Gunakan Domain Event.
* Gunakan orchestration pada Application Service.

---

# 30. Dependency Rules

Diizinkan:

```text id="7v6g7q"
Controller

↓

Service

↓

Repository
```

Tidak diizinkan:

```text id="fwwey3"
Repository

↓

Controller
```

atau

```text id="whqqgj"
Repository

↓

Service
```

---

# 31. Testing with DI

Dependency Injection memudahkan mocking.

Contoh:

```go id="u6v8hf"
mockRepository

↓

QuestionService

↓

Unit Test
```

Tidak diperlukan database nyata untuk unit test service.

---

# 32. Module Isolation

Setiap module hanya mengekspor interface yang diperlukan.

Contoh:

```go id="3m2s9z"
type QuestionModule interface {
    Service() QuestionService
}
```

Implementasi internal tetap tersembunyi.

---

# 33. Bootstrap Error Handling

Jika dependency gagal dibuat:

* Database gagal terkoneksi.
* Redis gagal (jika wajib).
* Storage gagal diinisialisasi.
* Queue gagal diinisialisasi.
* Konfigurasi tidak valid.

Maka aplikasi tidak dijalankan (fail fast).

---

# 34. Future Scalability

Ketika modul dipisahkan menjadi microservice:

Saat ini:

```text id="oqjq2j"
QuestionService
```

Menjadi:

```text id="7j3nzb"
QuestionClient Interface
```

Container hanya mengganti implementasi interface tanpa mengubah business logic.

---

# 35. Anti-Patterns

Tidak diperbolehkan:

* Service membuat repository sendiri (`NewRepository()`).
* Controller membuat service sendiri.
* Menggunakan global variable untuk dependency.
* Singleton yang menyimpan state request.
* Service Locator Pattern.
* Package `init()` untuk membangun dependency bisnis.

---

# 36. Dependency Injection Checklist

Sebelum implementasi selesai:

* Semua dependency menggunakan constructor.
* Seluruh service bergantung pada interface.
* Seluruh repository bergantung pada `*gorm.DB`.
* Tidak ada global dependency.
* Tidak ada circular dependency.
* Semua external service menggunakan adapter.
* Seluruh wiring berada di Composition Root.
* Unit test menggunakan mock melalui interface.

---

# 37. Recommended Initialization Order

```text id="6g1t5r"
Configuration

↓

Logger

↓

Database

↓

Redis

↓

Storage

↓

Queue

↓

Event Bus

↓

Repository

↓

Service

↓

Controller

↓

Router

↓

HTTP Server
```

Urutan ini memastikan seluruh dependency tersedia sebelum digunakan.

---

# 38. Summary

Dependency Injection pada YakinLulus.id menggunakan pendekatan **Constructor Injection** dengan **Composition Root** yang terpusat. Seluruh modul dibangun melalui provider dan bergantung pada interface, sehingga menghasilkan arsitektur yang:

* Rendah coupling.
* Mudah diuji.
* Mudah dipelihara.
* Konsisten dengan Clean Architecture dan DDD Lite.
* Siap berkembang menuju microservices tanpa perubahan besar pada business logic.
