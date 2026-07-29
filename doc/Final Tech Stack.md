# Final Technology Stack
## YakinLulus.id Enterprise Technology Decision Record (TDR)

**Document** : `final_stack.md`  
**Version** : 1.0  
**Status** : FINAL (Architecture Freeze)  
**Last Update** : July 2026

---

# 1. Tujuan

Dokumen ini merupakan **Technology Decision Record (TDR)** resmi YakinLulus.id.

Seluruh keputusan teknologi pada dokumen ini menjadi **standar engineering** yang harus digunakan selama pengembangan platform.

Dokumen ini bertujuan untuk:

- Menetapkan technology stack final.
- Menghindari perubahan stack di tengah pengembangan.
- Menjadi acuan seluruh tim engineering.
- Menjamin konsistensi implementasi.
- Menjadi referensi ketika onboarding developer baru.

Semua dokumentasi setelah dokumen ini wajib mengacu pada keputusan yang ditetapkan di sini.

---

# 2. Engineering Vision

YakinLulus.id bukan sekadar aplikasi CBT.

Platform ini dipersiapkan menjadi **Enterprise Education Platform** yang memiliki kemampuan:

- Question Bank
- Computer Based Test
- Learning Management
- AI Tutor
- AI Recommendation
- AI Question Generator
- Analytics
- Multi School Platform
- Multi Tenant
- Marketplace (Future)
- Learning Ecosystem

Target jangka panjang:

```
                 YakinLulus.id

                        │

        Enterprise Education Platform

                        │

      ----------------------------------------

      Question Bank

      CBT Engine

      Learning Platform

      AI Tutor

      Analytics

      Institution Management

      Marketplace

      API Ecosystem
```

---

# 3. Engineering Principles

Seluruh keputusan teknologi mengikuti prinsip berikut.

## Production First

MVP harus siap berkembang menjadi production.

Bukan prototype.

---

## Scalability

Mampu berkembang dari:

```
100 User

↓

10.000 User

↓

100.000 User

↓

1.000.000+ User
```

tanpa mengganti fondasi teknologi.

---

## Maintainability

Kode harus:

- mudah dipahami
- mudah diuji
- mudah diperbaiki
- mudah dikembangkan

---

## Simplicity

Tidak menggunakan teknologi kompleks apabila belum diperlukan.

Prinsip:

> "Simple until complexity is required."

---

## Cloud Native

Seluruh sistem harus siap dipindahkan ke cloud.

---

## Vendor Neutral

Menghindari vendor lock-in.

---

## Open Standard

Menggunakan standar industri.

---

# 4. High Level Architecture

```
                Client Layer

        React Web
        Flutter Mobile

                 │

         REST API / WebSocket

                 │

         Go Backend (Modular Monolith)

                 │

 --------------------------------------------------

 Auth

 User

 Question Bank

 Learning Material

 CBT Runtime

 Exam

 Scoring

 Analytics

 Notification

 AI

 File Management

 --------------------------------------------------

                 │

 PostgreSQL

 Redis

 Object Storage

 Queue

 Monitoring
```

---

# 5. Final Technology Stack

| Layer | Technology |
|----------|----------------|
| Backend | Go |
| Frontend | React |
| Mobile | Flutter |
| Database | PostgreSQL |
| Cache | Redis |
| Object Storage | MinIO (S3 Compatible) |
| Queue | Asynq (Redis) |
| API | REST |
| Realtime | WebSocket |
| Authentication | JWT + Refresh Token |
| Container | Docker |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | Loki |
| Tracing | Tempo + OpenTelemetry |

---

# 6. Backend Technology Stack

## Programming Language

```
Go 1.24+
```

Dipilih karena:

- High Performance
- Low Memory
- Excellent Concurrency
- Simple Deployment
- Static Binary
- Mature Ecosystem
- Sangat cocok untuk sistem CBT dengan ribuan koneksi simultan.

---

## Architecture

Menggunakan kombinasi:

```
Clean Architecture

+

Domain Driven Design

+

Repository Pattern

+

Dependency Injection

+

Event Driven Architecture
```

---

## Framework Philosophy

Backend tidak menggunakan full-stack framework.

Library dipilih secara modular.

---

## HTTP Router

```
chi
```

---

## Database Driver

```
pgx
```

---

## Query Management

```
sqlc
```

Alasan:

- Type Safe
- SQL Native
- Performa tinggi
- Tidak bergantung ORM
- Mudah melakukan query kompleks

---

## Validation

```
go-playground/validator
```

---

## Logging

```
Uber Zap
```

---

## Authentication

```
JWT

+

Refresh Token
```

---

## Password Hash

```
Argon2id
```

bcrypt tetap didukung untuk migrasi jika diperlukan.

---

## Scheduler

```
Cron
```

---

## Background Worker

```
Asynq
```

---

## Dependency Injection

Manual DI.

Tidak menggunakan framework DI.

---

# 7. Frontend Technology Stack

## Framework

```
React 19
```

---

## Build Tool

```
Vite
```

---

## Language

```
TypeScript
```

Mandatory.

---

## Routing

```
React Router v7
```

---

## Server State

```
TanStack Query
```

Digunakan untuk:

- API Cache
- Background Refetch
- Optimistic Update
- Pagination
- Infinite Query
- Mutation

---

## Client State

```
Zustand
```

Digunakan hanya untuk:

- Theme
- Sidebar
- Modal
- User Preference
- Wizard State
- Temporary UI State

Business data tetap berada di TanStack Query.

---

## Styling

```
Tailwind CSS
```

---

## Component Library

```
shadcn/ui
```

dibangun di atas:

```
Radix UI
```

---

## Form

```
React Hook Form
```

---

## Validation

```
Zod
```

---

## Table

```
TanStack Table
```

Digunakan untuk:

- Question Bank
- Student
- Teacher
- Analytics
- Import Excel

---

## Virtualization

```
TanStack Virtual
```

Untuk data besar.

---

## Chart

```
Recharts
```

Future:

```
Apache ECharts
```

---

## Rich Text

```
TipTap
```

---

## File Upload

```
Uppy
```

---

## Drag and Drop

```
dnd-kit
```

---

## HTTP Client

```
Axios
```

Dengan:

- Interceptor
- Token Refresh
- Retry
- Error Mapping

---

## Notification

```
Sonner
```

---

## Icons

```
Lucide
```

---

## Date

```
Day.js
```

---

## Offline Storage

```
Dexie.js

↓

IndexedDB
```

Digunakan untuk:

- CBT
- Offline Cache
- Draft
- Queue Sync

---

## Testing

```
Vitest

+

Testing Library

+

Playwright
```

---

## Component Documentation

```
Storybook
```

---

# 8. Mobile Technology Stack

## Framework

```
Flutter Stable
```

---

## Language

```
Dart
```

---

## State Management

```
Riverpod
```

---

## Routing

```
GoRouter
```

---

## Networking

```
Dio
```

---

## Local Database

```
Drift
```

Alternatif:

```
Isar
```

---

## Offline Sync

Custom Synchronization Engine.

---

## Push Notification

```
Firebase Cloud Messaging
```

---

# 9. Database Stack

## Database

```
PostgreSQL 17
```

---

## Cache

```
Redis 8
```

---

## Object Storage

```
MinIO
```

Production:

S3 Compatible Storage.

---

## Migration

```
golang-migrate
```

---

# 10. API Stack

## Style

```
REST API
```

---

## Documentation

```
OpenAPI 3.1
```

---

## Client SDK

Auto Generate.

```
OpenAPI

↓

TypeScript SDK

↓

Frontend
```

---

# 11. Realtime Stack

Menggunakan:

```
WebSocket
```

Digunakan untuk:

- CBT Timer
- Live Monitoring
- Notification
- Exam Status

---

# 12. Background Processing

```
Asynq

↓

Redis
```

Worker:

- Email
- Analytics
- AI
- Ranking
- Export
- File Processing

---

# 13. AI Stack

Tahap awal:

```
AI Gateway
```

Future:

```
LLM

↓

RAG

↓

Knowledge Base

↓

Recommendation Engine
```

Provider dapat diganti tanpa mengubah business logic.

---

# 14. DevOps Stack

## Container

```
Docker
```

---

## Reverse Proxy

```
Nginx
```

---

## CI/CD

```
GitHub Actions
```

---

## Infrastructure

```
Terraform
```

Future.

---

# 15. Observability Stack

## Logging

```
Loki
```

---

## Metrics

```
Prometheus
```

---

## Dashboard

```
Grafana
```

---

## Tracing

```
Tempo

+

OpenTelemetry
```

---

# 16. Security Stack

Authentication:

- JWT
- Refresh Token

Authorization:

- RBAC

Encryption:

- TLS
- Argon2id

Validation:

- Zod
- Go Validator

Audit:

- Audit Log

Rate Limit:

- Redis Based

---

# 17. Testing Stack

Backend:

- Testify
- Go Testing

Frontend:

- Vitest

UI:

- Storybook

E2E:

- Playwright

API:

- Integration Test

Performance:

- k6

---

# 18. Development Tools

Backend:

- Air
- golangci-lint
- sqlc
- migrate

Frontend:

- ESLint
- Prettier

Mobile:

- Flutter Analyze

Documentation:

- Markdown
- Mermaid (opsional)
- OpenAPI

---

# 19. Technology yang Dipertimbangkan

| Area | Dipilih | Alternatif |
|------|----------|------------|
| Backend | Go | Java, .NET, Node.js |
| Frontend | React | Vue, Angular |
| Mobile | Flutter | React Native |
| DB | PostgreSQL | MySQL |
| ORM | Tidak menggunakan ORM | GORM, Ent |
| Query | sqlc | ORM |
| Cache | Redis | Memcached |
| UI | shadcn/ui | MUI, Ant Design |
| State | Zustand | Redux Toolkit |
| Server State | TanStack Query | SWR |
| Editor | TipTap | Quill, CKEditor |
| Worker | Asynq | RabbitMQ Worker |
| Offline Web | Dexie | LocalStorage |

---

# 20. Architecture Evolution Roadmap

```
MVP

↓

Modular Monolith

↓

Enterprise Modular Monolith

↓

Event Driven

↓

Service Extraction

↓

Microservice

↓

Multi Region

↓

Global Platform
```

---

# 21. Technology Decision Rules

Teknologi baru hanya dapat ditambahkan jika memenuhi minimal salah satu kriteria berikut:

- memberikan peningkatan performa yang terukur;
- meningkatkan keamanan;
- mengurangi kompleksitas;
- meningkatkan maintainability;
- mendukung kebutuhan bisnis yang belum dapat dipenuhi oleh stack saat ini.

Keputusan teknologi harus didokumentasikan dalam Technology Decision Record (TDR) baru agar seluruh tim memiliki referensi yang sama.

---

# Summary

Final Technology Stack YakinLulus.id dirancang untuk memenuhi kebutuhan:

- MVP yang cepat dikembangkan.
- Arsitektur enterprise yang mudah dipelihara.
- Skalabilitas hingga jutaan pengguna.
- Integrasi AI di masa depan.
- Pengembangan lintas platform (Web & Mobile).
- Observability dan keamanan kelas produksi.

Dokumen ini menjadi **acuan resmi (Architecture Freeze)** untuk seluruh keputusan teknologi pada proyek YakinLulus.id. Seluruh dokumen PRD, arsitektur, engineering guide, implementasi, dan development workflow selanjutnya harus mengikuti standar yang ditetapkan dalam dokumen ini.


Architecture Freeze v1.0
Backend
✅ Go 1.24+
✅ Clean Architecture
✅ Domain Driven Design
✅ Modular Monolith
✅ Repository Pattern
✅ Event Driven Architecture
✅ REST API
✅ WebSocket
✅ OpenAPI 3.1
✅ sqlc
✅ pgx
✅ Asynq
✅ Zap Logger
✅ OpenTelemetry
Database
✅ Supabase PostgreSQL (sebagai PostgreSQL Platform)
✅ PostgreSQL 17
✅ Redis 8
✅ MinIO / Supabase Storage (MVP)
✅ golang-migrate
Frontend
✅ React 19
✅ TypeScript
✅ Vite
✅ React Router v7
✅ TanStack Query
✅ Zustand
✅ Tailwind CSS
✅ shadcn/ui
✅ Radix UI
✅ React Hook Form
✅ Zod
✅ TanStack Table
✅ Dexie.js
✅ TipTap
✅ Axios
✅ Storybook
✅ Playwright
✅ Vitest
Mobile
✅ Flutter
✅ Riverpod
✅ Dio
✅ GoRouter
✅ Drift
✅ FCM
DevOps
✅ Docker
✅ GitHub Actions
✅ Nginx
✅ Prometheus
✅ Grafana
✅ Loki
✅ Tempo
✅ Terraform (future)