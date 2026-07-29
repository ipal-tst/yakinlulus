````markdown
# Repository Structure

Document: 02_repository_structure.md  
Version: 1.0  
Category: Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan struktur repository YakinLulus.id secara menyeluruh sebagai acuan seluruh developer dalam mengembangkan sistem.

Tujuan utama:

- Menjaga konsistensi struktur project.
- Memisahkan source code berdasarkan responsibility.
- Mempermudah onboarding developer.
- Mendukung Clean Architecture dan Domain Driven Design.
- Memudahkan scaling menuju multi-team development.
- Mempersiapkan repository agar siap diekstraksi menjadi microservice di masa depan.

---

# 2. Repository Philosophy

Repository dirancang berdasarkan prinsip:

- Modular Monolith.
- Domain Driven Design.
- Feature-oriented development.
- Infrastructure as Code.
- Documentation First.
- CI/CD Ready.
- Cloud Native Ready.

Seluruh source code berada dalam satu repository (monorepo) pada fase MVP.

```
                   Git Repository
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
 Source Code        Documentation      Infrastructure
     │                   │                   │
 Backend           Architecture         Docker
 Frontend          PRD                  CI/CD
 Mobile            Engineering          Scripts
```

---

# 3. High-Level Repository Structure

```text
yakinlulus/

├── backend/
├── frontend/
├── mobile/
├── infrastructure/
├── docker/
├── scripts/
├── docs/
├── deployment/
├── .github/
├── .vscode/
├── Makefile
├── docker-compose.yml
├── .editorconfig
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

# 4. Root Directory Explanation

| Folder | Fungsi |
|---------|--------|
| backend | Seluruh backend Go |
| frontend | React Web |
| mobile | Flutter Mobile |
| infrastructure | Konfigurasi infrastructure |
| docker | Dockerfile dan compose extension |
| scripts | Automation script |
| docs | Seluruh dokumentasi project |
| deployment | Manifest deployment |
| .github | GitHub Actions dan template |
| .vscode | Workspace configuration |

---

# 5. Backend Repository Structure

```text
backend/

├── cmd/
├── internal/
├── pkg/
├── configs/
├── database/
├── api/
├── docs/
├── test/
├── migrations/
├── assets/
├── go.mod
└── go.sum
```

Penjelasan:

| Folder | Fungsi |
|---------|--------|
| cmd | Entry point aplikasi |
| internal | Business application |
| pkg | Shared package |
| configs | Configuration |
| database | Database layer |
| api | OpenAPI dan contract |
| docs | Backend documentation |
| test | Integration test |
| migrations | Database migration |
| assets | Static asset backend |

---

# 6. cmd Structure

```text
cmd/

├── api/
├── worker/
├── migration/
├── seed/
└── scheduler/
```

Penjelasan:

- **api** → REST API Server.
- **worker** → Background worker.
- **migration** → Migration runner.
- **seed** → Seeder.
- **scheduler** → Cron service.

Masing-masing memiliki `main.go` sendiri.

---

# 7. Internal Structure

```text
internal/

├── auth/
├── user/
├── question_bank/
├── learning_material/
├── exam/
├── cbt_runtime/
├── scoring/
├── analytics/
├── notification/
├── ai/
├── file_management/
└── shared/
```

Setiap folder mewakili satu bounded context.

---

# 8. Module Structure

Setiap domain menggunakan struktur yang sama.

```text
question_bank/

├── domain/
├── application/
├── infrastructure/
├── interfaces/
├── delivery/
└── tests/
```

Keuntungan:

- Konsisten.
- Mudah dipahami.
- Mudah dipindahkan menjadi microservice.

---

# 9. Domain Layer Structure

```text
domain/

├── entities/
├── aggregates/
├── value_objects/
├── repositories/
├── services/
├── events/
└── errors/
```

Layer ini **tidak boleh** bergantung pada framework.

---

# 10. Application Layer Structure

```text
application/

├── usecases/
├── dto/
├── commands/
├── queries/
├── mappers/
└── services/
```

Tanggung jawab:

- Menjalankan business use case.
- Orkestrasi domain.
- Validasi business flow.

---

# 11. Infrastructure Layer Structure

```text
infrastructure/

├── persistence/
├── cache/
├── messaging/
├── storage/
├── external/
├── logger/
└── config/
```

Berisi implementasi teknis:

- PostgreSQL.
- Redis.
- MinIO.
- Email.
- AI API.
- Queue.

---

# 12. Delivery Layer Structure

```text
delivery/

├── http/
├── websocket/
├── middleware/
├── presenter/
└── routes/
```

Layer ini menangani:

- HTTP Request.
- Response.
- Middleware.
- Routing.

---

# 13. Shared Module

```text
shared/

├── auth/
├── config/
├── constants/
├── middleware/
├── logger/
├── validator/
├── pagination/
├── response/
├── errors/
└── utils/
```

Hanya berisi komponen yang benar-benar reusable.

Tidak boleh berisi business logic domain tertentu.

---

# 14. Frontend Structure

```text
frontend/

├── public/
├── src/
├── tests/
├── package.json
└── vite.config.ts
```

---

# 15. Frontend src Structure

```text
src/

├── app/
├── features/
├── components/
├── layouts/
├── pages/
├── services/
├── hooks/
├── stores/
├── routes/
├── assets/
├── styles/
├── types/
└── utils/
```

Pendekatan:

Feature-first architecture.

---

# 16. Mobile Structure

```text
mobile/

├── lib/
├── assets/
├── test/
├── android/
├── ios/
├── web/
└── pubspec.yaml
```

---

# 17. Flutter lib Structure

```text
lib/

├── app/
├── core/
├── features/
├── shared/
└── main.dart
```

Setiap feature:

```text
features/

├── auth/
├── dashboard/
├── exam/
├── question/
└── profile/
```

---

# 18. Database Structure

```text
database/

├── migrations/
├── seed/
├── schema/
├── functions/
├── triggers/
└── views/
```

Semua perubahan database dilakukan melalui migration.

---

# 19. API Documentation Structure

```text
api/

├── openapi.yaml
├── swagger.json
├── postman/
└── examples/
```

API contract menjadi single source of truth antara backend dan frontend.

---

# 20. Infrastructure Structure

```text
infrastructure/

├── docker/
├── nginx/
├── postgres/
├── redis/
├── monitoring/
├── logging/
└── storage/
```

---

# 21. Deployment Structure

```text
deployment/

├── development/
├── staging/
├── production/
├── kubernetes/
└── terraform/
```

Memungkinkan deployment yang berbeda untuk setiap environment.

---

# 22. Documentation Structure

```text
docs/

├── PRD/
├── Architecture/
├── Database/
├── API/
├── Engineering/
├── Security/
└── Deployment/
```

Seluruh dokumentasi disimpan bersama source code agar selalu sinkron.

---

# 23. Testing Structure

```text
tests/

├── unit/
├── integration/
├── e2e/
├── fixtures/
└── mocks/
```

Setiap jenis pengujian memiliki area terpisah.

---

# 24. Architecture Dependency Rule

```text
                 Delivery
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

Aturan:

- Domain tidak bergantung ke layer lain.
- Application hanya bergantung ke Domain.
- Infrastructure mengimplementasikan interface Domain.
- Delivery memanggil Application.

---

# 25. Naming Convention

## Folder

Gunakan:

```text
snake_case
```

Contoh:

```text
question_bank
learning_material
file_management
```

---

## File

Gunakan:

```text
snake_case.go

snake_case.ts

snake_case.dart
```

---

## Interface

Gunakan suffix:

```text
Repository
Service
Handler
Validator
Mapper
Presenter
```

---

# 26. Security Consideration

- Tidak menyimpan secret di repository.
- Tidak menyimpan file hasil upload pada source code.
- Pisahkan konfigurasi berdasarkan environment.
- Gunakan `.gitignore` untuk file sensitif.
- Review perubahan pada folder `deployment/` dan `infrastructure/` secara ketat.

---

# 27. Scalability Consideration

Struktur repository telah dirancang agar:

- mudah dipisahkan menjadi beberapa repository jika diperlukan;
- mendukung multi-team development;
- meminimalkan konflik merge;
- memudahkan ownership setiap bounded context.

Contoh evolusi:

```text
Saat MVP

Monorepo
│
├── backend
├── frontend
└── mobile

↓

Saat Scale

auth-service/
question-service/
exam-service/
analytics-service/
frontend/
mobile/
```

Karena setiap module sudah memiliki batas yang jelas, proses ekstraksi menjadi microservice dapat dilakukan tanpa perubahan besar pada business logic.

---

# 28. Future Evolution

Repository dapat dikembangkan lebih lanjut dengan:

- Shared SDK untuk frontend dan mobile.
- Internal package registry.
- Git submodule atau package terpisah untuk komponen reusable.
- Monorepo tooling (Nx, Turborepo, Bazel) jika jumlah aplikasi bertambah.
- Internal developer portal dan architecture catalog.

---

# Summary

Repository YakinLulus.id dibangun berdasarkan prinsip:

- Modular Monolith.
- Domain Driven Design.
- Clean Architecture.
- Feature-Oriented Structure.
- Separation of Concern.
- Infrastructure as Code.
- Documentation as Code.
- Microservice Extraction Ready.

Dengan struktur ini, repository tetap sederhana untuk MVP namun memiliki fondasi yang kuat untuk berkembang menjadi platform EdTech berskala besar.


