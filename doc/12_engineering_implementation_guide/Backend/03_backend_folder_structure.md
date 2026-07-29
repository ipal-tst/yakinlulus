````markdown
# Backend Folder Structure

**Document** : `backend/03_backend_folder_structure.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan struktur folder backend YakinLulus.id sebagai standar resmi pengembangan.

Struktur ini dirancang untuk memenuhi kebutuhan:

- Clean Architecture
- Domain Driven Design (DDD)
- Modular Monolith
- Production-grade Engineering
- High Maintainability
- High Scalability
- Easy Testing
- Future Microservice Extraction

Dokumen ini menjadi acuan seluruh backend engineer. Tidak diperbolehkan membuat struktur folder di luar standar tanpa melalui Architecture Decision Record (ADR).

---

# 2. Design Principles

Struktur backend mengikuti prinsip berikut:

- Business Logic sebagai pusat aplikasi.
- Dependency mengarah ke dalam (Dependency Rule).
- Domain tidak bergantung pada framework.
- Infrastruktur dapat diganti tanpa mengubah business logic.
- Setiap bounded context memiliki isolasi yang jelas.
- Shared component hanya berisi kode lintas domain yang benar-benar reusable.

---

# 3. High-Level Directory Structure

```text
backend/

├── cmd/
├── configs/
├── internal/
├── pkg/
├── api/
├── database/
├── migrations/
├── scripts/
├── docs/
├── deployments/
├── test/
├── assets/
├── .air.toml
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── go.mod
└── go.sum
```

---

# 4. Directory Overview

```text
backend
│
├── cmd
│     Entry Point
│
├── internal
│     Business Application
│
├── pkg
│     Shared Components
│
├── api
│     OpenAPI Specification
│
├── database
│     SQL & sqlc
│
├── configs
│     Configuration
│
├── docs
│     Documentation
│
├── scripts
│     Automation Script
│
├── deployments
│     Deployment Manifest
│
└── test
      Integration Test
```

---

# 5. cmd/

Folder `cmd` hanya berisi executable application.

```text
cmd/

├── api/
│
├── worker/
│
└── migrate/
```

---

## api/

Entry point REST API.

```text
cmd/api/

main.go
```

---

## worker/

Entry point Asynq Worker.

```text
cmd/worker/

main.go
```

---

## migrate/

Migration runner.

```text
cmd/migrate/

main.go
```

---

Prinsip:

- Tidak boleh berisi business logic.
- Hanya bootstrap aplikasi.

---

# 6. internal/

Seluruh business logic berada di folder ini.

```text
internal/

├── bootstrap/
├── platform/
├── shared/
├── modules/
└── interfaces/
```

---

# 7. bootstrap/

Menginisialisasi seluruh dependency.

```text
bootstrap/

config.go

logger.go

database.go

redis.go

worker.go

router.go

otel.go

server.go
```

Tugas:

- Load Config
- Logger
- PostgreSQL
- Redis
- Storage
- Dependency Injection
- HTTP Server

---

# 8. platform/

Berisi implementasi teknologi eksternal.

```text
platform/

├── postgres/
├── redis/
├── storage/
├── jwt/
├── queue/
├── mail/
├── websocket/
└── telemetry/
```

Platform layer bertanggung jawab terhadap komunikasi dengan service eksternal.

---

# 9. shared/

Berisi komponen yang dapat digunakan lintas module.

```text
shared/

├── errors/
├── response/
├── pagination/
├── validation/
├── middleware/
├── logger/
├── cache/
├── event/
├── utils/
├── constants/
├── time/
└── security/
```

Tidak boleh berisi business rule.

---

# 10. modules/

Inilah inti aplikasi.

Seluruh bounded context berada di sini.

```text
modules/

├── auth/
├── user/
├── question/
├── material/
├── exam/
├── cbt/
├── scoring/
├── analytics/
├── notification/
├── ranking/
├── ai/
└── file/
```

Setiap module berdiri sendiri.

---

# 11. Standard Module Structure

Contoh:

```text
modules/

question/

├── domain/
├── application/
├── infrastructure/
├── interfaces/
└── module.go
```

Setiap module mengikuti struktur yang sama.

---

# 12. Domain Layer

```text
domain/

├── entity/
├── valueobject/
├── aggregate/
├── repository/
├── service/
├── event/
└── errors/
```

Karakteristik:

- Pure Go
- Tidak mengenal PostgreSQL
- Tidak mengenal Redis
- Tidak mengenal HTTP
- Tidak mengenal JSON

Domain harus independen.

---

# 13. Application Layer

```text
application/

├── dto/
├── command/
├── query/
├── usecase/
├── mapper/
└── service/
```

Berfungsi mengorkestrasi business process.

Application Layer:

- memanggil repository
- menjalankan use case
- mengelola transaction boundary
- publish domain event

---

# 14. Infrastructure Layer

```text
infrastructure/

├── persistence/
├── cache/
├── queue/
├── storage/
├── telemetry/
└── external/
```

Implementasi dependency eksternal.

Contoh:

```text
QuestionRepository

↓

PostgreSQL Repository
```

---

# 15. Interface Layer

Layer paling luar.

```text
interfaces/

├── http/
├── websocket/
├── worker/
└── mapper/
```

---

## HTTP

```text
http/

handler/

middleware/

request/

response/

routes/
```

---

## Worker

Task handler.

```text
worker/

grading.go

analytics.go

email.go
```

---

## WebSocket

```text
websocket/

handler.go

hub.go

connection.go
```

---

# 16. Dependency Direction

```text
HTTP

↓

Application

↓

Domain

↑

Infrastructure
```

Infrastructure bergantung pada Domain, bukan sebaliknya.

---

# 17. pkg/

Berisi library yang benar-benar reusable dan tidak terkait domain bisnis.

```text
pkg/

├── hash/
├── token/
├── encryption/
├── retry/
├── id/
└── random/
```

Aturan:

- Generic.
- Dapat dipindahkan ke project lain.

---

# 18. api/

Spesifikasi API.

```text
api/

openapi.yaml

schemas/

examples/

postman/
```

Digunakan sebagai sumber untuk menghasilkan SDK TypeScript maupun dokumentasi.

---

# 19. database/

Semua artefak database berada di sini.

```text
database/

├── sql/
├── query/
├── sqlc/
├── seed/
└── schema/
```

---

## sql/

DDL.

```text
CREATE TABLE

ALTER TABLE
```

---

## query/

Semua query SQL.

```text
user.sql

question.sql

exam.sql
```

---

## sqlc/

Output hasil generate sqlc.

```text
Queries

Models

DB Interface
```

> Folder ini dihasilkan otomatis dan tidak diedit secara manual.

---

# 20. migrations/

Migration resmi aplikasi.

```text
migrations/

000001_init.up.sql

000001_init.down.sql
```

Seluruh perubahan schema harus melalui migration.

---

# 21. configs/

```text
configs/

config.go

database.go

redis.go

jwt.go

storage.go

server.go
```

Tidak menyimpan data sensitif.

---

# 22. scripts/

Automation.

```text
scripts/

install.sh

dev.sh

release.sh

lint.sh

test.sh
```

---

# 23. deployments/

Artefak deployment.

```text
deployments/

docker/

kubernetes/

nginx/

systemd/
```

---

# 24. docs/

Dokumentasi teknis backend.

```text
docs/

architecture/

adr/

api/
```

---

# 25. test/

Testing di luar unit test.

```text
test/

integration/

fixtures/

performance/
```

---

# 26. Dependency Rule

Diagram dependency antar layer.

```text
               Interfaces
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

Aturan utama:

- Domain tidak boleh mengimpor layer lain.
- Application hanya bergantung pada Domain.
- Infrastructure mengimplementasikan kontrak dari Domain.
- Interfaces memanggil Application, bukan Infrastructure secara langsung.

---

# 27. Module Isolation

Setiap module harus memiliki isolasi yang jelas.

Contoh:

```text
Question Module

↓

Question Repository

↓

Question Use Case
```

Tidak boleh:

```text
Question

↓

langsung mengakses

↓

Exam Repository
```

Interaksi antar module dilakukan melalui:

- Application Service
- Domain Event
- Interface yang telah didefinisikan

---

# 28. Future Microservice Extraction

Karena setiap module memiliki struktur yang seragam, proses ekstraksi ke microservice menjadi lebih mudah.

```text
Modular Monolith

↓

Extract Module

↓

Independent Service
```

Contoh:

```text
Notification

↓

Notification Service
```

atau

```text
AI

↓

AI Service
```

Tanpa perubahan besar pada domain model.

---

# 29. Security Consideration

- Pisahkan konfigurasi dari source code.
- Jangan menyimpan secret dalam repository.
- Batasi akses ke package `internal`.
- Validasi seluruh input di layer Interface.
- Simpan audit log di module yang sesuai.
- Hindari penggunaan utilitas shared untuk menyimpan business rule.

---

# 30. Scalability Consideration

Struktur folder mendukung:

- Penambahan bounded context baru.
- Penambahan worker baru.
- Penambahan storage provider.
- Penambahan external service.
- Read Replica PostgreSQL.
- Event Bus eksternal.
- Horizontal scaling tanpa perubahan struktur kode.

---

# 31. Future Evolution

Struktur ini dipersiapkan untuk mendukung:

- Multi Tenant
- CQRS pada module tertentu
- Event Sourcing (jika diperlukan)
- Service Extraction
- Plugin Architecture
- AI Native Module
- Multi Region Deployment

---

# Summary

Struktur folder backend YakinLulus.id dirancang agar:

- Konsisten dengan Clean Architecture.
- Mengimplementasikan Domain Driven Design.
- Mendukung Modular Monolith.
- Mudah dipelihara dan diuji.
- Siap berkembang menjadi arsitektur terdistribusi tanpa perubahan besar.
