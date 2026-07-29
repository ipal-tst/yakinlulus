# 03_folder_structure.md

# YakinLulus.id Backend Folder Structure

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan struktur direktori backend YakinLulus.id.

Tujuan utama struktur ini adalah:

* Konsisten
* Mudah dipahami
* Modular
* Mudah di-scale
* Mudah dipisahkan menjadi microservice
* Mendukung Clean Architecture
* Mendukung DDD Lite
* Mendukung pengembangan tim

Struktur ini menjadi standar untuk seluruh engineer yang berkontribusi pada backend.

---

# 2. Design Principles

Folder structure dibangun berdasarkan prinsip berikut:

* Feature First
* Modular Monolith
* Clean Architecture
* Domain Oriented
* Low Coupling
* High Cohesion
* Independent Module
* Shared Infrastructure

---

# 3. High Level Project Structure

```text
yakinlulus-backend/

├── cmd/
├── config/
├── internal/
├── pkg/
├── api/
├── migrations/
├── scripts/
├── deployments/
├── docs/
├── test/
├── assets/
├── .github/
├── docker/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── go.mod
├── go.sum
└── README.md
```

---

# 4. Root Directory

## cmd/

Entry point aplikasi.

```text
cmd/

└── server/

    └── main.go
```

Tanggung jawab:

* bootstrap aplikasi
* dependency injection
* load configuration
* start HTTP server
* graceful shutdown

Business logic tidak boleh berada di folder ini.

---

## config/

Seluruh konfigurasi aplikasi.

```text
config/

database.go

redis.go

storage.go

jwt.go

server.go

logger.go

supabase.go

queue.go

ai.go

config.go
```

Seluruh konfigurasi dibaca dari environment variable.

---

## internal/

Berisi seluruh business domain.

Semua source code aplikasi berada di sini.

---

## pkg/

Shared package yang dapat digunakan lintas module.

Contoh:

```text
pkg/

response/

validator/

pagination/

jwt/

logger/

errors/

utils/

constant/

crypto/

middleware/

event/

cache/
```

Package di dalam `pkg` harus bersifat generik dan tidak memiliki ketergantungan terhadap domain bisnis.

---

## api/

Dokumentasi API.

```text
api/

openapi.yaml

swagger.json
```

---

## migrations/

Database migration.

```text
migrations/

000001_initial.up.sql

000001_initial.down.sql

000002_user.up.sql

000002_user.down.sql
```

Menggunakan `golang-migrate`.

---

## scripts/

Script utilitas.

Contoh:

```text
scripts/

seed.sh

backup.sh

restore.sh

generate_mock.sh

generate_swagger.sh
```

---

## deployments/

Seluruh file deployment.

```text
deployments/

docker/

kubernetes/

nginx/

systemd/
```

---

## docs/

Dokumentasi teknis.

Contoh:

```text
docs/

architecture/

database/

api/

security/

runbook/
```

---

## test/

Testing.

```text
test/

integration/

performance/

security/

fixtures/
```

---

## assets/

File statis internal.

Contoh:

```text
assets/

email/

templates/

certificate/

seed/
```

---

# 5. Internal Structure

Folder `internal` merupakan inti backend.

```text
internal/

app/

module/

shared/

platform/
```

---

# 6. App Layer

```text
internal/app/

bootstrap.go

router.go

server.go

container.go
```

Tanggung jawab:

* bootstrap
* dependency injection
* router registration
* middleware registration
* application lifecycle

---

# 7. Module Layer

Seluruh business module berada di sini.

```text
internal/module/

identity/

user/

academic/

school/

subject/

chapter/

material/

question/

question_bank/

question_generator/

exam/

cbt/

submission/

analytics/

ranking/

gamification/

notification/

media/

report/

system/

configuration/

audit/

ai/
```

Tidak boleh ada business logic di luar folder module.

---

# 8. Standard Module Structure

Setiap module wajib memiliki struktur yang sama.

Contoh module User.

```text
user/

controller/

service/

repository/

entity/

dto/

mapper/

validator/

middleware/

route/

constant/

errors/

event/

usecase/

interface/

```

Jika suatu folder belum diperlukan pada fase awal, folder tersebut boleh belum dibuat. Struktur ini adalah standar maksimum yang menjadi acuan ketika modul berkembang.

---

# 9. Module Detail

## controller/

Menangani HTTP Request.

Isi:

```text
user_controller.go
```

Tidak boleh:

* query database
* business logic
* transaction

---

## service/

Business logic.

Contoh:

```text
user_service.go

profile_service.go

auth_service.go
```

Semua business rule berada di sini.

---

## repository/

Data access.

Contoh:

```text
user_repository.go

profile_repository.go
```

Repository hanya berinteraksi dengan database.

---

## entity/

Representasi entity database.

Contoh:

```text
user.go

role.go

permission.go
```

---

## dto/

Request & Response.

```text
login_request.go

login_response.go

user_response.go

create_user_request.go
```

DTO tidak boleh digunakan sebagai entity database.

---

## mapper/

Konversi antar object.

Contoh:

```text
DTO

↓

Entity

↓

Response
```

---

## validator/

Validasi request.

Contoh:

```text
user_validator.go

question_validator.go
```

---

## middleware/

Middleware khusus module.

Contoh:

* permission middleware
* subscription middleware

---

## route/

Registrasi endpoint.

Contoh:

```text
user_route.go
```

---

## constant/

Konstanta module.

Contoh:

```text
role.go

status.go

permission.go
```

---

## errors/

Business error.

Contoh:

```text
user_error.go

exam_error.go
```

---

## event/

Event domain.

Future:

```text
UserCreated

ExamFinished

MaterialPublished
```

---

## usecase/

Opsional untuk use case kompleks yang melibatkan orkestrasi beberapa service atau workflow panjang (misalnya AI pipeline atau CBT finalization). Untuk operasi bisnis sederhana, logika tetap berada di `service/`.

---

## interface/

Berisi kontrak (interface) yang digunakan untuk dependency inversion.

Contoh:

```go
type UserRepository interface {}

type UserService interface {}
```

---

# 10. Shared Layer

Folder untuk komponen yang digunakan lintas module.

```text
internal/shared/

database/

cache/

storage/

queue/

auth/

logger/

validator/

response/

middleware/

pagination/

helper/
```

Tidak boleh ada business logic di sini.

---

# 11. Platform Layer

Integrasi layanan eksternal.

```text
internal/platform/

supabase/

redis/

storage/

queue/

ai/

email/

notification/
```

Contoh:

Supabase Client

Redis Client

Asynq

OpenAI

LLM Gateway

SMTP

WhatsApp Gateway (Future)

---

# 12. Example Complete Structure

```text
internal/

module/

question/

    controller/

    service/

    repository/

    entity/

    dto/

    mapper/

    validator/

    middleware/

    route/

    constant/

    errors/

    interface/

    usecase/
```

Semua module mengikuti struktur yang sama.

---

# 13. Dependency Flow

```text
Controller

↓

Service

↓

Repository

↓

Database
```

Shared Layer hanya menyediakan utilitas.

Platform Layer hanya menyediakan adapter ke layanan eksternal.

---

# 14. Import Rules

Diizinkan:

```text
Module

↓

Shared

↓

Platform
```

Tidak diizinkan:

```text
Question Repository

↓

User Controller
```

atau

```text
Question Module

↓

langsung mengakses

↓

Material Internal Package
```

Komunikasi antar module dilakukan melalui service interface.

---

# 15. File Naming Convention

Gunakan snake_case untuk nama file.

Contoh:

```text
user_service.go

question_repository.go

login_request.go

create_exam_usecase.go

question_mapper.go
```

---

# 16. Package Naming

Gunakan nama package sederhana.

```go
package service

package repository

package dto
```

Hindari:

```go
package UserService

package RepositoryLayer

package DTOPackage
```

---

# 17. Growth Strategy

Ketika aplikasi berkembang, struktur root tetap stabil.

Contoh:

```text
internal/

module/

question/

...

internal/

module/

cbt/

...
```

Jika suatu module dipisahkan menjadi microservice, struktur internal module tetap dipertahankan.

---

# 18. Future Microservice Migration

Misalnya CBT dipisahkan.

Saat ini:

```text
internal/module/cbt/
```

Menjadi:

```text
cbt-service/

cmd/

internal/

config/

pkg/
```

Sebagian besar source code dapat dipindahkan tanpa perubahan besar karena setiap module sudah memiliki batas tanggung jawab yang jelas.

---

# 19. Repository Layout Summary

```text
yakinlulus-backend/

├── cmd/
├── config/
├── internal/
│   ├── app/
│   ├── module/
│   ├── platform/
│   └── shared/
├── pkg/
├── api/
├── migrations/
├── deployments/
├── docker/
├── docs/
├── scripts/
├── test/
├── assets/
├── .github/
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── go.sum
└── README.md
```

---

# 20. Summary

Struktur direktori backend YakinLulus.id dirancang untuk mendukung:

* Modular Monolith
* Clean Architecture
* DDD Lite
* Feature-based Organization
* Low Coupling
* High Cohesion
* Skalabilitas menuju Microservices
* Kemudahan testing, deployment, dan maintenance

Seluruh engineer wajib mengikuti struktur ini agar implementasi antar modul tetap konsisten dan mudah dipelihara sepanjang siklus hidup proyek.
