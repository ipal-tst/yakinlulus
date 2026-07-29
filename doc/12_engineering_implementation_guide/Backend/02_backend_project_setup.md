````markdown
# Backend Project Setup

**Document** : `backend/02_backend_project_setup.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan proses pembangunan project backend YakinLulus.id mulai dari inisialisasi repository hingga backend siap dijalankan pada environment development.

Dokumen ini menjadi standar resmi seluruh backend engineer.

Target setelah mengikuti dokumen ini:

- Backend dapat dijalankan secara lokal.
- Seluruh dependency telah terpasang.
- Struktur project telah sesuai standar.
- Database telah terkoneksi ke Supabase PostgreSQL.
- Redis dan Background Worker telah siap digunakan.
- Environment development identik dengan production semaksimal mungkin.

---

# 2. Engineering Principles

Backend dibangun berdasarkan prinsip berikut.

- Production First
- Clean Architecture
- Domain Driven Design (DDD)
- Modular Monolith
- API First
- Configuration Driven
- Event Driven
- Observability Ready
- Testability
- Cloud Native

Diagram implementasi:

```text
                Backend Bootstrap

                        │

        Configuration Loading

                        │

         Dependency Initialization

                        │

          Infrastructure Layer

                        │

         Application Layer

                        │

             HTTP API Server
```

---

# 3. Technology Stack

## Programming Language

```text
Go 1.24+
```

---

## HTTP Router

```text
chi
```

---

## Database

```text
Supabase PostgreSQL
```

Backend mengakses PostgreSQL menggunakan:

```text
pgx
```

---

## Query Generator

```text
sqlc
```

---

## Cache

```text
Redis
```

---

## Background Worker

```text
Asynq
```

---

## Logging

```text
Zap
```

---

## Validation

```text
go-playground/validator
```

---

## Configuration

```text
Environment Variable
```

---

## API Documentation

```text
OpenAPI 3.1
```

---

## Container

```text
Docker
```

---

# 4. Backend Directory

Pada tahap bootstrap hanya dibuat struktur dasar.

```text
backend/

├── cmd/
├── internal/
├── pkg/
├── configs/
├── database/
├── api/
├── docs/
├── scripts/
├── test/
├── migrations/
├── assets/
├── go.mod
├── go.sum
└── Makefile
```

Detail setiap folder akan dijelaskan pada:

```
03_backend_folder_structure.md
```

---

# 5. Project Initialization

Masuk ke folder backend.

```bash
cd backend
```

Inisialisasi module.

```bash
go mod init github.com/yakinlulus/backend
```

> Ganti module path sesuai repository Git yang digunakan.

---

# 6. Dependency Management Strategy

Seluruh dependency dikelola menggunakan Go Modules.

Prinsip:

- Tidak melakukan commit folder `vendor/` (kecuali ada kebutuhan khusus).
- Menggunakan semantic version.
- Update dependency dilakukan secara berkala.
- Hindari library dengan maintenance buruk.

---

# 7. Core Dependencies

### HTTP Router

```text
github.com/go-chi/chi/v5
```

---

### PostgreSQL

```text
github.com/jackc/pgx/v5
```

---

### SQL Generator

```text
sqlc
```

Digunakan untuk menghasilkan kode repository yang type-safe dari SQL.

---

### Redis

```text
github.com/redis/go-redis/v9
```

---

### Background Worker

```text
github.com/hibiken/asynq
```

---

### Logger

```text
go.uber.org/zap
```

---

### Validation

```text
github.com/go-playground/validator/v10
```

---

### JWT

```text
github.com/golang-jwt/jwt/v5
```

---

### UUID

```text
github.com/google/uuid
```

---

### Environment

```text
github.com/joho/godotenv
```

Development only.

Production menggunakan environment variable secara langsung.

---

### Testing

```text
github.com/stretchr/testify
```

---

### OpenTelemetry

```text
go.opentelemetry.io/otel
```

---

# 8. Optional Dependencies

Beberapa dependency hanya digunakan bila diperlukan.

- OpenAPI Generator
- Swagger UI
- Mock Generator
- Mail Client
- S3 SDK
- Prometheus Client

Semuanya bersifat modular.

---

# 9. Environment Configuration

Seluruh konfigurasi dibaca melalui environment variable.

Contoh struktur:

```text
configs/

├── config.go
├── database.go
├── redis.go
├── server.go
├── jwt.go
└── storage.go
```

Tidak boleh ada nilai sensitif di source code.

---

# 10. Environment Variables

Contoh `.env`

```env
APP_NAME=YakinLulus Backend

APP_ENV=development

APP_PORT=8080

APP_DEBUG=true

DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=********

DB_SSL_MODE=require

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=CHANGE_ME

JWT_EXPIRE=15m

REFRESH_EXPIRE=168h

ASYNQ_REDIS_ADDR=localhost:6379

STORAGE_PROVIDER=supabase

SUPABASE_URL=https://xxxxx.supabase.co

SUPABASE_STORAGE_BUCKET=media

OTEL_ENABLED=true
```

---

# 11. Configuration Loading

Saat backend dijalankan.

Flow:

```text
Load .env

        │

Read Environment

        │

Validate Configuration

        │

Build Config Object

        │

Inject Configuration
```

Jika konfigurasi wajib tidak tersedia, aplikasi harus gagal saat startup (*fail fast*).

---

# 12. Bootstrap Flow

Urutan inisialisasi backend.

```text
Load Config

        │

Initialize Logger

        │

Initialize OpenTelemetry

        │

Initialize PostgreSQL

        │

Initialize Redis

        │

Initialize Storage

        │

Initialize Repository

        │

Initialize Services

        │

Initialize Use Cases

        │

Initialize HTTP Server

        │

Register Routes

        │

Start Application
```

---

# 13. Database Connection

Backend tidak menggunakan ORM.

Flow akses database:

```text
Supabase PostgreSQL

        │

pgx Pool

        │

sqlc

        │

Repository

        │

Use Case
```

Keuntungan:

- Type-safe
- Query eksplisit
- Performa tinggi
- SQL mudah dioptimalkan

---

# 14. Redis Connection

Redis digunakan untuk:

- Cache
- Session sementara (jika diperlukan)
- Rate Limiting
- Queue Backend (Asynq)
- Distributed Lock (future)

Flow:

```text
Application

      │

Redis Client

      │

Redis Server
```

---

# 15. Background Worker

Worker dipisahkan dari API Server.

```text
cmd/

├── api/
└── worker/
```

Flow:

```text
API

↓

Create Job

↓

Redis Queue

↓

Worker

↓

Execute Task
```

Contoh task:

- Email
- Export
- Analytics
- AI Processing
- Thumbnail Generation

---

# 16. Logging Setup

Logging menggunakan Zap.

Kategori log:

- Startup
- HTTP Request
- Database
- Worker
- Authentication
- Security
- Panic
- External API

Format:

```text
JSON Structured Logging
```

---

# 17. OpenTelemetry

Observability diaktifkan sejak awal.

Komponen:

```text
Application

        │

OpenTelemetry SDK

        │

Exporter

        │

Tempo

Grafana

Prometheus
```

Pada development, exporter dapat dinonaktifkan melalui konfigurasi.

---

# 18. Graceful Shutdown

Backend harus menangani sinyal sistem.

Flow:

```text
SIGTERM

      │

Stop Accepting Request

      │

Finish Active Request

      │

Close Worker

      │

Close Redis

      │

Close PostgreSQL

      │

Flush Logger

      │

Exit
```

Tujuan:

- Tidak kehilangan request.
- Tidak merusak transaksi.
- Menjaga integritas data.

---

# 19. Makefile

Seluruh developer menggunakan command yang sama.

```text
make setup

make run

make worker

make migrate-up

make migrate-down

make sqlc

make lint

make fmt

make test

make coverage

make docker-up

make docker-down

make clean
```

---

# 20. Docker Development

Service yang dijalankan saat development.

```text
Docker Compose

├── Redis

├── Mailpit

├── MinIO (Opsional)

└── OpenTelemetry Collector (Opsional)
```

> PostgreSQL utama menggunakan Supabase. Jika bekerja secara offline atau untuk integration test, PostgreSQL lokal dapat dijalankan melalui Docker Compose menggunakan skema yang sama dengan Supabase.

---

# 21. Hot Reload

Development menggunakan:

```text
Air
```

Flow:

```text
Save File

↓

Air Detect

↓

Rebuild

↓

Restart Backend
```

---

# 22. Coding Convention

Standar backend:

- gofmt
- goimports
- golangci-lint
- Conventional Commit
- Static Analysis
- Unit Test sebelum Pull Request

---

# 23. Security Consideration

- Jangan commit file `.env`.
- Gunakan Secret Manager pada production.
- Gunakan SSL/TLS untuk koneksi PostgreSQL.
- Seluruh query menggunakan parameter binding.
- Simpan JWT Secret di environment.
- Password di-hash menggunakan Argon2id.
- Terapkan principle of least privilege pada kredensial database.

---

# 24. Scalability Consideration

Bootstrap dirancang agar mudah dikembangkan.

Tahap MVP:

```text
Single API

↓

Single Worker
```

Tahap Enterprise:

```text
API x N

↓

Load Balancer

↓

Redis

↓

Worker Pool

↓

Supabase PostgreSQL
```

Tanpa perubahan besar pada struktur aplikasi.

---

# 25. Future Evolution

Bootstrap backend telah disiapkan untuk mendukung:

- Multi Worker
- Multi Queue
- Multi Storage Provider
- OpenTelemetry Collector
- Kubernetes Deployment
- Read Replica PostgreSQL
- Event Bus (NATS/Kafka/RabbitMQ)
- Feature Flag
- Multi Tenant

---

# Summary

Backend YakinLulus.id dibangun dengan pendekatan **bootstrap-first**, di mana seluruh dependency diinisialisasi secara terstruktur sebelum aplikasi menerima request.

Karakteristik utama:

- Go 1.24+
- Clean Architecture
- Domain Driven Design
- Supabase PostgreSQL melalui `pgx`
- `sqlc` sebagai query generator
- Redis + Asynq
- Zap Structured Logging
- OpenTelemetry
- Docker-based Development
- Graceful Shutdown
- Production-ready sejak fase MVP
