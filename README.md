# YakinLulus.id — Platform Learning & CBT EdTech

[![Go](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev/)
[![Fiber](https://img.shields.io/badge/Fiber-v2-00ADD8.svg)](https://gofiber.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

**YakinLulus.id** adalah platform EdTech & CBT berbasis **Micro-Subscription (Rp 10.000/bulan)** untuk siswa lintas jenjang (**SD, SMP, SMA, dan Gap Year UTBK SNBT**). Repo ini berisi **backend final (Go + Fiber)** dan **dokumentasi kontrak API** yang menjadi sumber kebenaran bagi pengembangan frontend baru (dibangun via Google Antigravity).

Backend menggabungkan arsitektur *Domain-Driven*, penilaian **Item Response Theory (IRT 3-PL)**, *Computer-Based Testing (CBT)* engine, **Admin/Teacher CMS Suite**, serta **AI Tutor Companion** — seluruhnya berjalan di atas schema database baru (`identity`, `academic`, `finance`, `notification`, `content`, `cbt`, `question`) tanpa sisa query ke tabel `public.*` legacy.

---

## Daftar Isi

1. [Status Proyek](#status-proyek)
2. [Model Bisnis & Strategi](#model-bisnis--strategi)
3. [Arsitektur](#arsitektur)
4. [Backend (Go + Fiber)](#backend-go--fiber)
5. [RBAC — 6 Role](#rbac--6-role)
6. [Database & Migrations](#database--migrations)
7. [API & Kontrak](#api--kontrak)
8. [Frontend](#frontend)
9. [Keamanan](#keamanan)
10. [Konfigurasi](#konfigurasi)
11. [Panduan Memulai](#panduan-memulai)
12. [Testing](#testing)
13. [Struktur Repo](#struktur-repo)
14. [Dokumentasi Tambahan](#dokumentasi-tambahan)

---

## Status Proyek

- [x] Database rebuild selesai — 197 migrasi, schema baru ter-deploy
- [x] Migrasi seluruh backend selesai — **0 referensi tabel `public.*` legacy di `backend/internal`**
- [x] RBAC diseragamkan ke **6 role final**
- [x] Konflik route `/practice/*` diselesaikan (modul ujian pindah ke `/exam-practice/*`)
- [x] `openapi.yaml` tersinkron (105 path)
- [x] Dokumentasi frontend lengkap di `docs/frontend/` (kontrak API + wiring halaman + setup Antigravity)
- [x] Frontend baru selesai (**Next.js 16 + Tailwind v4 + shadcn/ui**) — 28 rute terkompilasi & 6 peran pengguna di direktori `frontend/`

> Status Frontend: Frontend web responsif edtech telah selesai dibangun 100% menggunakan Next.js 16, Tailwind CSS v4, dan shadcn/ui (preset Nova) yang terintegrasi penuh dengan backend Go/Fiber API untuk 6 peranan pengguna.

---

## Model Bisnis & Strategi

- **Micro-SaaS Subscription**: Rp 10.000/bulan per siswa (10–50x lebih murah dari bimbel konvensional Rp 500rb–2jt/bulan).
- **Beta Program**: Gratis 6 bulan pertama untuk 500 beta tester.
- **Multi-Jenjang**:
  - **SD**: Kelas 4–6 (Asesmen Literasi & Numerasi Dasar)
  - **SMP**: Kelas 7–9 (Ujian Sekolah & Asesmen Nasional)
  - **SMA**: Kelas 10–12 (Persiapan Mandiri & Ujian Sekolah)
  - **Gap Year**: UTBK SNBT 2026 & Ujian Mandiri PTN

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend — dibangun ulang via Google Antigravity           │
│  Sumber kebenaran: docs/frontend/API-contract.md,           │
│  PAGE-WIRING.md, ANTIGRAVITY-SETUP.md, openapi.yaml         │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP + HttpOnly cookie
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend — Go 1.26 + Fiber v2 (Clean Architecture)          │
│  /api/v1 → middleware (auth, RBAC, rate-limit, recover,     │
│             sanitize, security-headers, request-id)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ internal/* — 26 domain module (auth, content, cbt,    │  │
│  │             practice, scoring, ranking, ai, cms, dll) │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────┘
                                ▼
        ┌───────────────────────────────────────────┐
        │ PostgreSQL 16 (Supabase) + Redis          │
        │ Supabase Storage (S3-compatible)          │
        └───────────────────────────────────────────┘
```

---

## Backend (Go + Fiber)

### Struktur

```
backend/
├── cmd/
│   ├── api/          # Main HTTP server entry point
│   ├── migrate/      # Database migration runner (up/down/status)
│   ├── reset_db/     # Reset database
│   ├── seed/         # Seeder user test
│   ├── seed_audit/   # Seeder audit log
│   └── tools/        # gen_token, check_body
├── internal/
│   ├── academic/     # Hierarki akademik (level, grade, kurikulum, mapel, bab, topik, LO)
│   ├── admin/        # Admin user management
│   ├── ai/           # AI Tutor (LLM, embeddings, RAG)
│   ├── analytics/    # Analitik siswa/admin & IRT
│   ├── audit/        # Audit log
│   ├── auth/         # JWT auth, register, login, refresh, RBAC
│   ├── cbt_engine/   # Engine ujian: exam CRUD, attempts, grading, blueprint, pool
│   ├── cbt_runtime/  # Runtime CBT: sync jawaban, pelanggaran, timer, review
│   ├── cms/          # CMS: berita, setting, form
│   ├── content/      # Konten terpadu (material/exam/question) via content.* schema
│   ├── dashboard/    # Agregasi dashboard siswa/admin
│   ├── exam_packages/# Paket ujian (tryout bundle) + linked exams
│   ├── material/     # Materi belajar (pakai content.Repository)
│   ├── media/        # Upload file, storage (Supabase S3)
│   ├── middleware/   # Auth, RBAC, rate-limit, recover, sanitize, logger
│   ├── notification/ # Notifikasi in-app (notification.* schema)
│   ├── practice/     # Latihan mandiri (daily practice, statistik)
│   ├── profile/      # Target sekolah & sertifikat siswa (identity.* schema)
│   ├── question_bank/# Bank soal, FSM, import/export (question.* schema)
│   ├── ranking/      # Leaderboard nilai ujian
│   ├── school/       # Manajemen sekolah & kuota
│   ├── scoring/      # Hasil & breakdown sub-tes
│   ├── shared/       # Error codes, response helper, pagination
│   ├── subscription/ # Paket langganan & MRR (finance.* schema)
│   ├── target_schools# Master data kampus tujuan
│   └── ws/           # WebSocket real-time CBT
├── pkg/
│   ├── cache/        # Redis wrapper
│   ├── config/       # YAML config loader
│   ├── database/     # pgx pool
│   └── storage/      # Supabase S3 client
└── migrations/       # 197 file SQL migration (versi 001–218)
```

### Pola migrasi modul

Seluruh modul konsumen menunjuk schema baru — tidak ada lagi query ke tabel `public.*` legacy:

| Modul | Schema sumber |
|-------|---------------|
| `auth`, `profile` | `identity.*` (user, user_profile, login_session, password_reset, role) |
| `academic` | `academic.*` (education_level, grade, subject, chapter, topic, curriculum) |
| `content`, `material`, `question_bank` | `content.*` + `question.*` |
| `cbt_engine`, `cbt_runtime`, `scoring` | `cbt.*` (exam, exam_attempt, grading_result) |
| `subscription`, `exam_packages` | `finance.*` (membership_package, user_membership, subscription) |
| `notification` | `notification.*` (user_notification, notification_preferences, notification_template) |
| `ranking`, `analytics`, `dashboard` | `cbt.*`, `scoring.*`, `ranking.*` |

### Dependency Injection (`cmd/api/main.go`)

```go
contentRepo := content.NewRepository(db)
qbService    := question_bank.NewService(contentRepo)   // uses content.Repository
matService   := material.NewService(contentRepo)        // uses content.Repository
examSvc      := cbt_engine.NewService(contentRepo)
cbtSvc       := cbt_runtime.NewService(contentRepo)
practiceSvc  := practice.NewService(practiceRepo, contentRepo)
```

### Middleware Pipeline

```
CORS → Recover → RequestID → SecurityHeaders → Logger
     → RateLimiter → SanitizeRequest → HealthCheck → Routes
```

---

## RBAC — 6 Role

Role final diseragamkan dari DB `identity.role` (role lama `ADMIN/TEACHER/STUDENT` sudah dihapus dari gate):

| Role | Deskripsi | Area |
|------|-----------|------|
| `SUPER_ADMIN` | Semua akses | semua |
| `STAFF` | Authoring + kelola CMS/school/level + admin non-finansial | content, cms, akademik |
| `FINANCE` | Beranda finance | `finance.*`, dashboard finance, membership, payment, invoice, wallet, laporan |
| `GURU` | Kelola murid/kelas (read), authoring | content (own), analytics sempit |
| `SISWA` | Core loop siswa | materi, practice, CBT, hasil, rekomendasi, ranking, profil |
| `INVESTOR` | Laporan finansial read-only | finance reports (board investor) |

> **Catatan untuk frontend:** `FINANCE` dan `INVESTOR` adalah peran baru di UI — struktur halamannya didokumentasikan di `docs/frontend/PAGE-WIRING.md`.

---

## Database & Migrations

**197 migrations** ter-versi (penomoran 001–218, dijalankan via `cmd/migrate`, direkam ke tabel `_migrations`).

- **001–100+** — fondasi: fungsi `shared.set_updated_at()`, extension (`pgcrypto`, `uuid-ossp`, `vector`), schema utama.
- **200–218** — migrasi terbaru (CMS: page, post, tag, media, banner, FAQ, news, setting, form, soft-delete; content practice session; exam packages compat; academic target_school/program; profile student_target; notification legacy columns/channel).

Skema utama: `identity`, `academic`, `finance`, `notification`, `content`, `cbt`, `question`, `ranking`, `scoring`, `media`, `audit`, `shared`.

---

## API & Kontrak

Prefix: `/api/v1` · Response wrapper: `{ success, message, data, error_code, meta }`

**Dokumen kontrak lengkap:** `docs/frontend/API-contract.md` (tabel per modul: method, path, role gate, request/response, sumber tabel) dan `backend/openapi.yaml` (105 path).

### Ringkasan grup route

| Grup | Prefix | Modul |
|------|--------|-------|
| Auth & profile | `/auth`, `/profile` | `auth`, `profile` |
| Akademik | `/academic` | `academic` |
| Bank soal | `/questions` | `question_bank` |
| Materi | `/materials` | `material` |
| Content CMS | `/contents`, `/cms` | `content`, `cms` |
| Exams & CBT | `/exams`, `/cbt`, `/exam-practice` | `cbt_engine`, `cbt_runtime` |
| Latihan mandiri | `/practice` | `practice` |
| Hasil & ranking | `/results`, `/leaderboard` | `scoring`, `ranking` |
| Paket ujian | `/exam-packages` | `exam_packages` |
| Analitik & dashboard | `/analytics`, `/dashboard` | `analytics`, `dashboard` |
| Finance | `/subscriptions` | `subscription` |
| Sekolah & media | `/schools`, `/media` | `school`, `media` |
| Notifikasi | `/notifications` | `notification` |
| AI Tutor | `/ai` | `ai` |

> Konflik `/practice/*` telah diselesaikan: modul latihan tetap di `/practice/sessions/*`; modul ujian (`cbt_engine`) pindah ke **`/exam-practice/*`** (mis. `/exam-practice/material/:materialId`, `/exam-practice/subject`, `/exam-practice/tags`, `/exam-practice/:sessionId`).

---

## Frontend

Frontend **telah selesai dibangun 100%** di direktori `frontend/` berbasis **Next.js 16 (App Router)**, **Tailwind CSS v4**, dan **shadcn/ui (preset Nova)**.

**Tech Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui; TanStack Query (server state), Zustand (client state), Recharts (charts), Lucide (icons), Framer Motion, next-themes (dark mode).

**Fitur & Rute:**
- **28 Rute Halaman** mencakup 6 peran pengguna (`SISWA`, `GURU`, `STAFF`, `SUPER_ADMIN`, `FINANCE`, `INVESTOR`).
- **Engine CBT Realtime:** Timer per subtes, ragu-ragu, auto-save jawaban, dan modal submit.
- **AI Tutor Companion:** Chat interaktif 24/7 untuk penjelasan soal dan rumus cepat.
- **Rasionalisasi PTN & IRT Scoring:** Kalkulasi skor IRT 3-PL dan estimasi kelulusan kampus impian.

Dokumentasi & Arsitektur Frontend:

| Dokumen | Isi |
|---------|-----|
| `design.md` | Design system v1.0: warna, tipografi, spacing, radius, shadow, komponen, motion, layout |
| `docs/frontend/API-contract.md` | Kontrak API lengkap seluruh 16+ modul & role gate |
| `docs/frontend/PAGE-WIRING.md` | Struktur 48+ rute halaman & wiring API per peran |
| `docs/frontend/ANTIGRAVITY-SETUP.md` | Panduan setup Antigravity |
| `backend/openapi.yaml` | Spesifikasi OpenAPI formal (105 path) |

---

## Keamanan

Praktik keamanan yang diterapkan pada codebase:

### Autentikasi & Otorisasi
- **JWT access + refresh** via HttpOnly cookie
- **RBAC 6 role** (`SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`) + `RequireRole` middleware
- Register publik dipaksa role `SISWA`
- Password di-hash dengan bcrypt

### Pencegahan Kerentanan
- **Anti-IDOR**: ownership check pada session CBT, hasil, attempt, dan practice
- **Anti-cheat grading**: `IsCorrect`/`PointsEarned` dari client **tidak dipercaya** — dihitung ulang server-side
- **Parameterized queries** (pgx) di seluruh layer untuk cegah SQL injection
- **No hardcoded credentials**: `config.yaml` (berisi secret) dan `credentials.txt` di-`.gitignore`
- **Rate limiting** per IP, **sanitize input**, **security headers**, **request-id**, **recover** global

---

## Konfigurasi

### Backend (`backend/config.yaml`)

> `config.yaml` **tidak di-commit** (berisi secret). Salin dari template dan isi nilai nyata.

```yaml
app:
  env: development
  host: "0.0.0.0"
  port: 8080

database:
  url: "postgresql://user:pass@host:5432/db?sslmode=require"

redis:
  url: "redis://localhost:6379/0"

jwt:
  secret: "ganti-dengan-secret-acak-panjang"
  access_expiry: "15m"
  refresh_expiry: "720h"

storage:
  endpoint: "https://PROJECT.supabase.co/storage/v1"
  access_key: "SUPABASE_SERVICE_KEY"
  bucket: "media"
  public_base_url: "https://PROJECT.supabase.co/storage/v1/object/public"

cors:
  allowed_origins:
    - "http://localhost:3000"

ai:
  endpoint: "https://api.openai.com/v1"
  api_key: ""
  model: "gpt-4o-mini"

rate_limit:
  requests_per_minute: 100
  burst: 20

log:
  level: "debug"
  format: "json"
```

---

## Panduan Memulai

### Prasyarat
- Go 1.26+
- PostgreSQL 16 (disarankan Supabase)
- Redis (untuk rate-limit & cache)

### 1. Database

```bash
# Set URL koneksi
$env:DB_URL = "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"

# Jalankan migrasi
cd backend
go run ./cmd/migrate up

# Cek status
go run ./cmd/migrate status
```

### 2. Backend

```bash
cd backend
go mod tidy
go build ./...
go vet ./...
go test ./...

# Jalankan API
go run ./cmd/api
# Server: http://localhost:8080
```

> Test DB-backed memerlukan `DB_URL` (tanpa `DB_URL`, test tersebut di-skip).

### 3. Seed data (opsional)

```bash
cd backend
go run ./cmd/seed         # buat user test
go run ./cmd/seed_audit   # audit log sample
```

---

## Testing

### Backend (Go)
```bash
cd backend
go test ./...        # 32 file test, 90 test function
go vet ./...
```

Coverage area: auth (register role guard, profile validation), cbt_engine (grading server-side, ownership, submit strip), middleware (JWT, RBAC, rate-limit), shared (response), exam_packages, ranking, target_schools, profile, academic, content, material, notification, cms, config.

> Test DB-backed butuh koneksi DB (via `DB_URL`); berjalan serial (`-p 1`) bila koneksi Supabase lambat.

---

## Struktur Repo

```
├── backend/              # Go backend (API + migrations + internal modules)
├── frontend/             # Next.js 16 + Tailwind v4 + shadcn/ui frontend app
├── docs/
│   ├── frontend/         # API contract, page wiring, Antigravity setup
│   └── superpowers/      # Spesifikasi & plan fitur (brainstorming/planning records)
├── dev/                  # Utilitas pengembangan
├── Makefile
└── README.md
```

---

## Dokumentasi Tambahan

- `backend/openapi.yaml` — spesifikasi OpenAPI (105 path)
- `backend/migrations/` — 197 versi SQL migration (penomoran 001–218)
- `backend/config.yaml` — konfigurasi runtime (jangan di-commit)
- `docs/frontend/API-contract.md` — kontrak API lengkap
- `docs/frontend/PAGE-WIRING.md` — wiring halaman per role
- `docs/frontend/ANTIGRAVITY-SETUP.md` — setup Antigravity untuk membangun frontend
- `docs/superpowers/` — spesifikasi & plan fitur (brainstorming/planning records)
