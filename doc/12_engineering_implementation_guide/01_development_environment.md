````markdown
# Development Environment

Document: 01_development_environment.md  
Version: 1.0  
Category: Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar Development Environment yang digunakan oleh seluruh tim engineering YakinLulus.id agar seluruh developer memiliki lingkungan kerja yang konsisten, reproducible, dan siap untuk production-grade development.

Tujuan utama:

- Menyamakan environment seluruh developer.
- Mengurangi masalah "works on my machine".
- Mempermudah onboarding developer baru.
- Memastikan seluruh dependency memiliki versi yang sama.
- Mendukung CI/CD pipeline.

---

# 2. Development Environment Overview

Seluruh pengembangan dilakukan menggunakan pendekatan container-first.

```
               Developer Machine
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Backend        Frontend       Mobile
      Go         React + Vite     Flutter
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Docker Compose
                       │
     ┌─────────────┬─────────────┬─────────────┐
     │             │             │
 PostgreSQL      Redis        MinIO
     │
Migration
````

---

# 3. Supported Operating System

Officially supported:

| Operating System  | Status        |
| ----------------- | ------------- |
| Ubuntu 24.04+     | ✅ Recommended |
| Ubuntu 26.04 LTS  | ✅ Recommended |
| Windows 11 + WSL2 | ✅ Supported   |
| macOS Sonoma+     | ✅ Supported   |

Tidak disarankan melakukan development native pada Windows tanpa WSL2.

---

# 4. Minimum Hardware Requirement

## Backend Developer

| Component | Minimum | Recommended |
| --------- | ------- | ----------- |
| CPU       | 4 Core  | 8 Core      |
| RAM       | 16 GB   | 32 GB       |
| SSD       | 100 GB  | 512 GB NVMe |
| Internet  | 20 Mbps | 100 Mbps    |

---

## Frontend Developer

| Component | Minimum | Recommended |
| --------- | ------- | ----------- |
| CPU       | 4 Core  | 8 Core      |
| RAM       | 16 GB   | 32 GB       |
| SSD       | 100 GB  | 512 GB      |

---

## Mobile Developer

| Component        | Minimum  | Recommended |
| ---------------- | -------- | ----------- |
| CPU              | 6 Core   | 8+ Core     |
| RAM              | 16 GB    | 32 GB       |
| Android Emulator | Required | Required    |

---

# 5. Required Software

## Core Tools

| Software         | Version       |
| ---------------- | ------------- |
| Git              | Latest Stable |
| Docker Engine    | Latest        |
| Docker Compose   | Latest        |
| VS Code / GoLand | Latest        |
| Make             | Latest        |
| curl             | Latest        |

---

## Backend

| Software      | Version |
| ------------- | ------- |
| Go            | 1.24.x  |
| Air           | Latest  |
| golangci-lint | Latest  |
| swag          | Latest  |
| migrate       | Latest  |

---

## Database

| Software           | Version |
| ------------------ | ------- |
| PostgreSQL         | 17      |
| Redis              | 8       |
| pgAdmin (Optional) | Latest  |
| DBeaver            | Latest  |

---

## Frontend

| Software   | Version              |
| ---------- | -------------------- |
| Node.js    | 22 LTS               |
| npm        | Latest               |
| pnpm       | Latest (Recommended) |
| TypeScript | Latest               |
| Vite       | Latest               |

---

## Mobile

| Software       | Version        |
| -------------- | -------------- |
| Flutter        | Stable Channel |
| Dart           | Stable         |
| Android Studio | Latest         |
| Xcode (macOS)  | Latest         |

---

# 6. Recommended VS Code Extensions

## Backend

* Go
* Error Lens
* Docker
* YAML
* GitLens
* REST Client
* PostgreSQL
* EditorConfig

---

## Frontend

* ESLint
* Prettier
* Tailwind CSS IntelliSense
* React Snippets
* Auto Rename Tag

---

## Flutter

* Flutter
* Dart

---

# 7. Repository Structure

Developer cukup melakukan clone satu repository.

```
yakinlulus/

├── backend/
├── frontend/
├── mobile/
├── infrastructure/
├── scripts/
├── docs/
├── docker/
├── .github/
├── Makefile
├── docker-compose.yml
└── README.md
```

---

# 8. Git Configuration

Developer wajib mengatur identitas Git.

```bash
git config --global user.name "Nama Developer"

git config --global user.email "developer@email.com"
```

Gunakan line ending:

```bash
git config --global core.autocrlf input
```

Untuk Windows + WSL2 gunakan konfigurasi Git di dalam WSL.

---

# 9. SSH Key

Semua akses repository menggunakan SSH.

Generate key:

```bash
ssh-keygen -t ed25519
```

Tambahkan public key ke Git provider.

Verifikasi:

```bash
ssh -T git@github.com
```

---

# 10. Docker Development Environment

Seluruh dependency dijalankan melalui Docker Compose.

```
                Docker Compose
                      │
 ┌──────────┬──────────┬──────────┬──────────┐
 │          │          │          │
Backend PostgreSQL   Redis      MinIO
```

Service utama:

* backend
* postgres
* redis
* minio
* mailpit (development)
* pgadmin (optional)

---

# 11. Environment Variable

Gunakan file:

```
.env.example
```

Developer membuat:

```
.env
```

Contoh:

```env
APP_ENV=development

APP_PORT=8080

DB_HOST=postgres
DB_PORT=5432
DB_USER=yakinlulus
DB_PASSWORD=secret
DB_NAME=yakinlulus

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=change-me

MINIO_ENDPOINT=minio:9000
```

Rahasia produksi tidak boleh disimpan di repository.

---

# 12. Initial Project Setup

## Step 1

Clone repository.

```bash
git clone git@github.com:yakinlulus/yakinlulus.git
```

---

## Step 2

Masuk ke project.

```bash
cd yakinlulus
```

---

## Step 3

Copy environment.

```bash
cp .env.example .env
```

---

## Step 4

Menjalankan dependency.

```bash
docker compose up -d
```

---

## Step 5

Verifikasi service.

```bash
docker ps
```

---

## Step 6

Jalankan migration.

```bash
make migrate-up
```

---

## Step 7

Jalankan backend.

```bash
make backend
```

---

## Step 8

Jalankan frontend.

```bash
make frontend
```

---

## Step 9

Jalankan mobile.

```bash
make mobile
```

---

# 13. Makefile Standard

Semua developer menggunakan command yang sama.

```
make setup

make backend

make frontend

make mobile

make migrate-up

make migrate-down

make seed

make lint

make test

make clean

make docker-up

make docker-down
```

---

# 14. Development Workflow

```
Pull Latest

      │

Create Feature Branch

      │

Implementation

      │

Local Testing

      │

Lint

      │

Unit Test

      │

Commit

      │

Push

      │

Pull Request
```

---

# 15. Branch Strategy

```
main
│
├── develop
│
├── feature/auth-login
│
├── feature/question-import
│
├── feature/cbt-runtime
│
├── hotfix/session-timeout
│
└── release/v1.0.0
```

Branch naming:

* feature/*
* bugfix/*
* hotfix/*
* release/*
* chore/*
* docs/*
* refactor/*
* test/*

---

# 16. Commit Convention

Menggunakan Conventional Commits.

Contoh:

```
feat(auth): add refresh token

fix(cbt): resolve timer synchronization

refactor(question): simplify repository

docs(api): update OpenAPI

test(scoring): add unit test

chore(ci): update workflow
```

---

# 17. Code Style

Backend:

* gofmt
* goimports
* golangci-lint

Frontend:

* ESLint
* Prettier

Flutter:

* dart format
* flutter analyze

Semua proses dijalankan otomatis melalui pre-commit hook atau CI.

---

# 18. Local Development Ports

| Service       | Port |
| ------------- | ---- |
| Backend API   | 8080 |
| Frontend      | 5173 |
| PostgreSQL    | 5432 |
| Redis         | 6379 |
| MinIO API     | 9000 |
| MinIO Console | 9001 |
| Mailpit SMTP  | 1025 |
| Mailpit UI    | 8025 |

---

# 19. Security Consideration

* Jangan commit `.env`.
* Gunakan `.env.example` sebagai template.
* Gunakan secret manager pada staging/production.
* Jangan hardcode API key.
* Gunakan SSH untuk akses repository.
* Aktifkan MFA pada Git provider.

---

# 20. Scalability Consideration

Development environment dirancang agar semirip mungkin dengan production.

Perbedaan utama:

Development:

* single node
* local storage
* debug mode

Production:

* multi instance
* managed PostgreSQL
* managed Redis
* object storage
* centralized logging
* monitoring
* load balancer

Dengan pendekatan ini, proses deployment dari development ke production menjadi lebih konsisten.

---

# 21. Future Evolution

Ke depan environment dapat diperluas dengan:

* Dev Container (VS Code)
* GitHub Codespaces
* Remote Development
* Kubernetes Local (Kind/K3d)
* Tilt/Skaffold
* Local observability stack (Prometheus, Grafana, Loki, Tempo)

---

# Summary

Development Environment YakinLulus.id dibangun dengan prinsip:

* Container-first development.
* Cross-platform compatibility.
* Reproducible environment.
* Standardized tooling.
* Automated setup.
* CI/CD ready.
* Production parity.
* Security by default.

Seluruh developer diharapkan menggunakan konfigurasi yang sama untuk menjaga konsistensi implementasi dan mengurangi perbedaan perilaku antar lingkungan pengembangan.

