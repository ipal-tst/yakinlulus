````markdown
# Clean Architecture Implementation

**Document** : `backend/04_clean_architecture_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan bagaimana **Clean Architecture** diterapkan pada backend YakinLulus.id.

Implementasi ini menjadi fondasi seluruh backend sehingga:

- business logic tidak bergantung pada framework;
- domain tidak bergantung pada database;
- domain tidak bergantung pada HTTP;
- domain dapat diuji tanpa infrastructure;
- teknologi dapat diganti tanpa mengubah business rule.

Dokumen ini merupakan standar implementasi seluruh backend engineer.

---

# 2. Mengapa Clean Architecture?

YakinLulus.id diproyeksikan berkembang dari MVP menjadi platform EdTech enterprise.

Jika business logic bercampur dengan:

- PostgreSQL
- Redis
- HTTP
- Framework
- Storage
- Queue

maka biaya maintenance akan meningkat secara signifikan.

Oleh karena itu, seluruh business logic ditempatkan pada pusat sistem.

---

# 3. Architecture Overview

```text
                   External World

      Browser
      Mobile
      Admin Panel
      Worker
      Scheduler

                    │
                    ▼

             Interface Layer
     HTTP • WebSocket • Worker • CLI

                    │
                    ▼

          Application Layer
       Use Case • DTO • Command
      Query • Transaction • Service

                    │
                    ▼

              Domain Layer
    Entity • Aggregate • Repository
   Domain Service • Value Object • Event

                    ▲
                    │

         Infrastructure Layer
 PostgreSQL • Redis • Storage • Queue
 Email • AI • External API
```

---

# 4. Dependency Rule

Prinsip utama:

> Dependency hanya boleh mengarah ke dalam.

Diagram:

```text
Interface
    │
    ▼
Application
    │
    ▼
Domain
    ▲
    │
Infrastructure
```

Artinya:

- Interface boleh mengenal Application.
- Application boleh mengenal Domain.
- Infrastructure boleh mengenal Domain.
- Domain tidak mengenal siapa pun.

---

# 5. Layer Responsibility

| Layer | Responsibility |
|---------|----------------|
| Interface | Menerima request dan mengembalikan response |
| Application | Menjalankan use case |
| Domain | Business Rule |
| Infrastructure | Implementasi teknologi |

---

# 6. Interface Layer

Interface Layer merupakan pintu masuk aplikasi.

Contoh:

```text
HTTP

WebSocket

Worker

CLI

Cron
```

Tugas Interface Layer:

- menerima request;
- validasi format dasar;
- autentikasi;
- otorisasi awal;
- memanggil use case;
- membentuk response.

Interface **tidak boleh** berisi business rule.

---

# 7. Application Layer

Application Layer mengorkestrasi proses bisnis.

Contoh:

```text
Create Exam

↓

Validate User

↓

Check Permission

↓

Create Aggregate

↓

Save Repository

↓

Publish Event

↓

Return Result
```

Application Layer bertanggung jawab terhadap:

- Use Case
- Transaction Boundary
- Repository Coordination
- Domain Event Dispatch
- DTO Mapping

Application Layer **bukan tempat business rule inti**.

---

# 8. Domain Layer

Domain Layer merupakan inti sistem.

Seluruh aturan bisnis berada di sini.

Contoh:

```text
Exam

Question

Student

Score

Ranking
```

Domain harus dapat berjalan walaupun:

- PostgreSQL diganti;
- Redis dihapus;
- HTTP diganti gRPC;
- Framework berubah.

---

# 9. Infrastructure Layer

Infrastructure berisi implementasi teknologi.

Contoh:

```text
PostgreSQL

Redis

Supabase Storage

SMTP

Asynq

OpenTelemetry

JWT
```

Infrastructure hanya mengimplementasikan kontrak dari Domain.

---

# 10. Flow Request

```text
Client

↓

HTTP Handler

↓

Request DTO

↓

Use Case

↓

Domain

↓

Repository Interface

↓

Repository PostgreSQL

↓

Database

↓

Response
```

---

# 11. Flow Domain Event

```text
Exam Finished

↓

Domain Event

↓

Application

↓

Event Dispatcher

↓

Analytics

Ranking

Notification

AI
```

Domain tidak mengetahui siapa yang menerima event.

---

# 12. Repository Pattern

Repository berada pada Domain.

```text
Domain

↓

QuestionRepository Interface
```

Implementasinya:

```text
Infrastructure

↓

PostgreSQL Repository
```

Dengan demikian database dapat diganti tanpa mengubah Domain.

---

# 13. Dependency Inversion

Contoh implementasi.

```text
Application

↓

QuestionRepository

(interface)

↓

PostgresQuestionRepository

(implementation)
```

Application hanya mengenal interface.

---

# 14. Entity

Entity adalah objek bisnis yang memiliki identitas.

Contoh:

```text
Student

Teacher

Question

Exam

ExamSession

Answer

Material
```

Entity bertanggung jawab menjaga konsistensi datanya sendiri.

---

# 15. Value Object

Value Object tidak memiliki identitas.

Contoh:

```text
Email

PhoneNumber

Score

Duration

ExamStatus

QuestionDifficulty
```

Value Object bersifat immutable.

---

# 16. Aggregate

Aggregate menjaga konsistensi beberapa Entity.

Contoh:

```text
Exam Aggregate

Exam

QuestionPool

Timer

Rule

Configuration
```

Semua perubahan dilakukan melalui Aggregate Root.

---

# 17. Domain Service

Jika business rule melibatkan lebih dari satu Aggregate, gunakan Domain Service.

Contoh:

```text
Scoring Service

Ranking Service

Recommendation Service
```

---

# 18. Domain Event

Event merepresentasikan kejadian bisnis.

Contoh:

```text
ExamStarted

ExamFinished

AnswerSubmitted

QuestionImported

StudentRegistered
```

Event tidak berisi business process.

Event hanya membawa fakta.

---

# 19. DTO

DTO digunakan pada Application Layer.

```text
HTTP

↓

DTO

↓

Use Case

↓

Domain
```

DTO tidak masuk ke Domain.

---

# 20. Mapper

Mapper bertugas mengubah:

```text
HTTP Request

↓

DTO

↓

Entity
```

atau

```text
Entity

↓

Response DTO
```

Domain tidak mengetahui mapper.

---

# 21. Transaction Boundary

Transaction hanya berada pada Application Layer.

```text
Begin Transaction

↓

Use Case

↓

Repository

↓

Commit

↓

Publish Event
```

Domain tidak boleh membuka transaction.

---

# 22. Validation Strategy

Validasi dibagi menjadi dua.

### Interface Validation

Memastikan format input benar.

Contoh:

- required;
- email format;
- UUID;
- panjang string.

---

### Domain Validation

Memastikan aturan bisnis terpenuhi.

Contoh:

- ujian sudah dimulai;
- peserta masih aktif;
- waktu ujian belum habis;
- soal masih tersedia.

---

# 23. Error Handling

Error dibagi menjadi beberapa kategori.

```text
Validation Error

Business Error

Infrastructure Error

Unexpected Error
```

Domain tidak mengembalikan HTTP Status Code.

---

# 24. Logging

Logging dilakukan pada:

- Interface;
- Application;
- Infrastructure.

Domain tidak melakukan logging langsung kecuali pada event yang benar-benar diperlukan.

---

# 25. Configuration

Domain tidak boleh membaca:

```text
.env

Redis

Database

OS Environment
```

Configuration di-inject dari luar.

---

# 26. Framework Independence

Framework hanya berada di layer Interface atau Infrastructure.

Contoh:

```text
chi

↓

Handler

↓

Application
```

Jika suatu hari router diganti, Domain dan Application tidak berubah.

---

# 27. Database Independence

Domain hanya mengenal:

```go
type QuestionRepository interface {
    Save(...)
    FindByID(...)
    Update(...)
}
```

Bukan:

```go
SELECT * FROM questions
```

---

# 28. Testing Strategy

Karena dependency terisolasi:

```text
Domain

↓

Unit Test

↓

Mock Repository
```

Tidak memerlukan PostgreSQL.

Application diuji dengan mock repository.

Infrastructure diuji dengan integration test.

---

# 29. Common Anti-Patterns

Hindari pola berikut.

### Business Rule di Handler

```text
HTTP Handler

↓

if score > 80 ...

❌
```

---

### SQL di Use Case

```text
Use Case

↓

SELECT ...

❌
```

---

### Entity Mengenal Database

```text
Question.Save()

❌
```

---

### Domain Mengakses Redis

```text
Redis.Get()

❌
```

---

### Handler Mengakses Repository Langsung

```text
Handler

↓

Repository

❌
```

Seluruh akses harus melalui Use Case.

---

# 30. Clean Architecture Checklist

Setiap module wajib memenuhi checklist berikut.

- Domain tidak mengimpor Infrastructure.
- Domain tidak mengimpor Interface.
- Application hanya bergantung pada Domain.
- Infrastructure mengimplementasikan interface Domain.
- Handler hanya memanggil Use Case.
- Repository hanya berada di Infrastructure.
- Transaction berada di Application.
- Business Rule berada di Domain.
- DTO tidak masuk ke Domain.
- Entity tidak mengetahui HTTP maupun database.

---

# 31. Security Consideration

Implementasi Clean Architecture membantu keamanan karena:

- business rule terpusat;
- validasi berlapis;
- dependency terisolasi;
- akses database hanya melalui repository;
- framework tidak memiliki akses langsung ke domain.

---

# 32. Scalability Consideration

Struktur ini memungkinkan:

- penambahan module baru;
- ekstraksi module menjadi microservice;
- penggantian PostgreSQL;
- penggantian Redis;
- penggantian storage;
- penambahan AI provider;
- migrasi ke event bus eksternal.

Tanpa mengubah business logic.

---

# 33. Future Evolution

Pada fase enterprise, arsitektur ini dapat berkembang menjadi:

```text
Modular Monolith

↓

Internal Event Bus

↓

Module Isolation

↓

Service Extraction

↓

Microservices
```

Karena setiap layer telah dipisahkan sejak awal.

---

# Summary

YakinLulus.id mengimplementasikan Clean Architecture dengan menjadikan **Domain Layer sebagai pusat sistem**.

Prinsip utama:

- Dependency selalu mengarah ke dalam.
- Business Rule berada di Domain.
- Use Case berada di Application.
- Framework berada di Interface.
- Teknologi berada di Infrastructure.

Pendekatan ini menghasilkan backend yang:

- mudah dipelihara;
- mudah diuji;
- independen terhadap framework;
- siap berkembang dari MVP menuju platform enterprise tanpa perubahan arsitektur fundamental.
````
