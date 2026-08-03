# YakinLulus.id — Platform Learning & CBT EdTech

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

**YakinLulus.id** adalah platform EdTech & CBT berbasis **Micro-Subscription (Rp 10.000/bulan)** untuk siswa lintas jenjang (**SD, SMP, SMA, dan Gap Year UTBK SNBT**). Platform menggabungkan arsitektur *Domain-Driven*, penilaian **Item Response Theory (IRT 3-PL)**, formula LaTeX (KaTeX), *Computer-Based Testing (CBT)* engine, **Admin/Teacher CMS Suite**, serta **AI Tutor Companion**.

---

## Daftar Isi

1. [Model Bisnis & Strategi](#model-bisnis--strategi)
2. [Desain Sistem](#desain-sistem--aurelian-academy)
3. [Fitur Platform](#fitur-platform)
4. [Arsitektur](#arsitektur)
5. [Backend (Go + Fiber)](#backend-go--fiber)
6. [Frontend (Next.js 15)](#frontend-nextjs-15)
7. [Database & Migrations](#database--migrations)
8. [API Endpoints](#api-endpoints)
9. [Keamanan](#keamanan)
10. [Konfigurasi](#konfigurasi)
11. [Panduan Memulai](#panduan-memulai)
12. [Testing](#testing)
13. [Verifikasi Checklist](#verifikasi-checklist)
14. [Dokumentasi Tambahan](#dokumentasi-tambahan)

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

## Desain Sistem — Aurelian Academy

- **Primary Electric Blue** `#004AC6` — action, focus, teknologi
- **Secondary Vibrant Green** `#006C49` — sukses, progress, pertumbuhan
- **Tertiary Marigold** `#784B00` — warning, achievement, energi
- **Typography**: Quicksand (`next/font/google`)
- **Components**: pill-shaped (48px min), pseudo-3D tactile buttons, checkbox pop animation
- **Touch targets**: K-12 compliant (48px minimum)

---

## Fitur Platform

### Portal Siswa (`/student`)
| Fitur | Rute | Deskripsi |
|-------|------|-----------|
| Dashboard | `/student` | Statistik nilai tryout, quick actions, continue learning |
| Materi Belajar | `/student/materials` | Modul interaktif per sub-tes, KaTeX renderer |
| Latihan Soal | `/student/practice` | Daily practice & latihan adaptif |
| Tryout & CBT Hub | `/student/exam` | Hub tryout akbar, filter jenjang, pencarian |
| CBT Workspace | `/exam/[examId]` | Ruang ujian terisolasi (SINGLE/MULTIPLE/TRUE_FALSE) |
| Hasil & Pembahasan | `/student/exam/[id]/result`, `/discussion` | Skor, breakdown sub-tes, pembahasan soal |
| AI Tutor | `/student/ai-tutor` | Asisten belajar berbasis LLM + RAG |
| Analytics | `/student/analytics` | Radar chart kemampuan, tren perkembangan |
| Leaderboard | `/student/leaderboard` | Peringkat per paket ujian |
| Profil | `/student/profile` | Data diri lengkap, target sekolah, sertifikat |
| Tryout | `/student/tryout` | Alur pre-test → ujian → hasil |

### Portal Admin & Teacher CMS
| Fitur | Rute | Deskripsi |
|-------|------|-----------|
| Command Center | `/admin` | KPI global, service health monitor |
| Master Data | `/admin/master-data` | Jenjang, kelas, kurikulum, mapel, bab, topik, program |
| Manajemen User | `/admin/users` | Direktori user, kontrol RBAC, audit log |
| Bank Soal | `/admin/question-bank` | CRUD soal, FSM workflow, import Excel, KaTeX |
| CBT Operations | `/admin/cbt` | Monitoring session live, peserta aktif |
| Sekolah Mitra | `/admin/schools` | Lisensi institusi (Enterprise, Pro School, Basic) |
| Subscription & MRR | `/admin/subscriptions` | Pendapatan bulanan, ARPU, log transaksi |
| Target Sekolah | `/admin/target-schools` | Master data kampus tujuan |
| Audit Logs | `/admin/audit-logs` | Jejak aktivitas admin |
| AI Tutor Admin | `/admin/ai-tutor` | Konfigurasi & monitoring AI |
| Settings | `/admin/settings` | Konfigurasi platform |
| Content | `/admin/content` | Manajemen konten terpadu |

### Portal Staff & Teacher
- **Staff**: dashboard, CBT monitor, laporan, akademik, users.
- **Teacher**: dashboard, paket ujian, materi, bank soal, custom exam.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend — Next.js 15 App Router (React 19, Tailwind v4)   │
│  lib/api.ts (TanStack Query, 94 hooks)                      │
│  lib/api-client.ts (20 modul API)                           │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP + HttpOnly cookie
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend — Go 1.26 + Fiber v2 (Clean Architecture)          │
│  /api/v1 → middleware (auth, RBAC, rate-limit, recover,     │
│             sanitize, security-headers, request-id)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ internal/* — 25 domain module (auth, content, cbt,    │  │
│  │             practice, scoring, ranking, ai, dll)      │  │
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
│   ├── content/      # UNIFIED CONTENT DOMAIN (base + subtype)
│   ├── dashboard/    # Agregasi dashboard siswa
│   ├── exam_packages/# Paket ujian (tryout bundle) + linked exams
│   ├── material/     # Materi belajar (pakai content.Repository)
│   ├── media/        # Upload file, storage (Supabase S3)
│   ├── middleware/   # Auth, RBAC, rate-limit, recover, sanitize, logger
│   ├── notification/ # Notifikasi in-app
│   ├── practice/     # Latihan mandiri (daily practice, statistik)
│   ├── profile/      # Target sekolah & sertifikat siswa
│   ├── question_bank/# Bank soal, FSM, import/export (pakai content.Repository)
│   ├── ranking/      # Leaderboard nilai ujian
│   ├── school/       # Manajemen sekolah & kuota
│   ├── scoring/      # Hasil & breakdown sub-tes
│   ├── shared/       # Error codes, response helper, pagination
│   ├── subscription/ # Paket langganan & MRR
│   ├── target_schools# Master data kampus tujuan
│   └── ws/           # WebSocket real-time CBT
├── pkg/
│   ├── cache/        # Redis wrapper
│   ├── config/       # YAML config loader
│   ├── database/     # pgx pool
│   └── storage/      # Supabase S3 client
└── migrations/       # 43 file SQL migration (versi 001–043)
```

### Unified Content Domain (`internal/content`)

**Satu sumber kebenaran** untuk semua tipe konten (soal, materi, ujian) dalam satu tabel base + subtype.

| Tabel | Fungsi |
|-------|--------|
| `contents` | Base: `id`, `content_type` (QUESTION/MATERIAL/EXAM), FK akademik, status, metadata JSONB |
| `content_questions` | Subtype soal: question_type, difficulty, bloom_level, score, explanation |
| `content_question_options` | Opsi jawaban: label, option_text, is_correct, display_order |
| `content_materials` | Subtype materi: format, durasi, read_count, is_preview |
| `content_exams` | Subtype ujian: durasi, passing_score, shuffle, max_attempts, blueprint JSONB |
| `content_exam_questions` | Junction ujian ↔ soal (display_order, points) |
| `content_exam_blueprints` | Blueprint ujian (easy/medium/hard) |
| `content_question_pools` | Pool dinamis per ujian |
| `content_exam_participants` | Registrasi ujian ↔ user |
| `content_exam_attempts` | Attempt/session: status, skor, waktu |
| `content_exam_session_questions` | Seleksi soal per attempt + shuffle option |
| `content_exam_answers` | Jawaban siswa per attempt |
| `content_practice_sessions` | Session latihan mandiri |
| `content_practice_sets` | Practice set per materi |
| `content_learning_progress` | Progress user per konten |

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

## Frontend (Next.js 15)

### Stack
- Next.js 15.1.5 App Router, React 19, TypeScript strict, Tailwind CSS v4
- TanStack Query v5 (94 hooks di `lib/api.ts`), Zustand, React Hook Form + Zod
- KaTeX 0.18 + remark-math + rehype-katex, react-markdown
- shadcn/ui + Radix, motion (framer-motion)
- Excel import: xlsx + mammoth (DOCX), pdfjs-dist

### Arsitektur
- **Auth**: HttpOnly cookie (`credentials: 'include'`), XSS-safe
- **API Client**: `lib/api-client.ts` (20 modul, 100+ endpoint), `lib/api.ts` (wrapper TanStack)
- **Types**: `types/` — dashboard, exam, practice, api
- **Hooks**: `hooks/` — useAuth, useExamSession, usePracticeSession, useDebounce
- **Components**: `components/cbt/` — QuestionRenderer, OptionSelector, NavigationMatrix, ViolationBanner, TimerAndSync
- **UI**: `components/ui/` — aurelian-ui + shadcn/ui

### Halaman (67 route pages)
- **Auth (5)**: login, register, forgot-password, reset-password, verify-email
- **Student (19)**: dashboard, exam + hasil/pembahasan, practice, materials, tryout, profile, leaderboard, ai-tutor, analytics
- **Admin (20+)**: master-data (6 sub), users, question-bank, cbt, schools, subscriptions, target-schools, audit-logs, ai-tutor, materials, content, settings, docs
- **Teacher (8)**: dashboard, question-bank, materials, exam-packages, custom exam
- **Staff (5)**: dashboard, academic, cbt, reports, users
- **Landing + CBT workspace**

---

## Database & Migrations

**43 migrations** ter-versi (001–043), dijalankan via `cmd/migrate`.

| Migrasi | Deskripsi |
|---------|-----------|
| 001–002 | Users, roles, sessions |
| 003 | Academic hierarchy awal |
| 004–006 | Legacy questions, exams, cbt_runtime |
| 007–010 | Scoring, IRT, materials, media, negative marking |
| 011–016 | Password resets, schools, notifications, revisions, question pools, type enum |
| 017–020 | Gamification, practice, ai_conversations, question import |
| 021 | Normalisasi akademik penuh (EducationLevel → Grade → Curriculum → Subject → Chapter → Topic → LearningOutcome) |
| 022 | RBAC berbasis grade + view `user_accessible_grades` + trigger auto-set |
| 023 | **Unified contents** base + subtype + runtime + migrasi data legacy |
| 024 | Data migration layer tambahan |
| 025 | Advanced practice & exam pool (grade_ids, tag_filters, subject blueprints, practice sets/sessions) |
| 026–031 | Optimasi index, perbaikan kolom, redesign clean schema, fix triggers, **cleanup 12+ tabel legacy** (incl. `practice_sessions`, `practice_answers`, `questions`, `materials`, `results`) |
| 032–033 | Subscription plans, audit logs |
| 034–036 | Restore cbt_runtime tables, ai_config, question revision summary |
| 037–039 | Academic programs, student profile, target schools |
| 040 | Exam packages + `users.school_name` |
| 041 | Drop gamification (XP, streaks, badges, leaderboards) |
| 042 | Index `ranking.submitted_at` |
| 043 | Field profil siswa (gender, phone, major) |

> Catatan: setelah migrasi 023, seluruh modul konsumen (question_bank, material, cbt_engine, practice) memakai `content.Repository`. Tabel legacy dihapus pada migrasi 030–031.

---

## API Endpoints

Prefix: `/api/v1` · Response wrapper: `{ success, message, data, error_code, meta }`

### Modul inti

| Modul | Endpoint | Deskripsi |
|-------|----------|-----------|
| `auth` | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/refresh`, `/auth/logout`, `/auth/profile`, `/auth/change-password`, `/auth/users` | Autentikasi & profil. Register publik **hanya STUDENT**. |
| `academic` | `/academic/levels`, `/grades`, `/curriculums`, `/subjects`, `/chapters`, `/topics`, `/los` | Hierarki akademik |
| `questions` | `/questions` (CRUD, publish, archive, clone, import, export, options, revisions) | Bank soal |
| `exams` | `/exams` (CRUD, blueprint, pool, participants, questions, analytics, attempts) | Manajemen ujian & attempts |
| `cbt` | `/cbt/:id/start`, `/sync`, `/navigate`, `/pause`, `/resume`, `/finish`, `/violations`, `/answers`, `/questions`, `/review`, `/sessions` | Runtime CBT |
| `practice` | `/practice/sessions/start`, `/sessions/:id/answer`, `/sessions`, `/sessions/:id`, `/stats`, `/practice/:id/submit`, `/practice/:id` | Latihan mandiri & session |
| `results` | `/results/:session_id`, `/results/:session_id/subject-breakdown` | Hasil ujian |
| `materials` | `/materials` (CRUD, publish, progress) | Materi belajar |
| `analytics` | `/analytics/student/summary`, `/analytics/admin/overview`, `/analytics/admin/reports` | Analitik |
| `schools` | `/schools` (CRUD, quota) | Sekolah mitra |
| `media` | `/media/upload`, `/media` | Upload file |
| `notifications` | `/notifications` | Notifikasi |
| `exam-packages` | `/exam-packages` (CRUD, link exams) | Paket ujian |
| `ranking` | `/ranking` | Leaderboard |
| `target-schools` | `/target-schools` (CRUD) | Kampus tujuan |
| `subscriptions` | `/subscriptions` | Paket langganan |
| `dashboard` | `/dashboard/student`, `/dashboard/admin` | Agregasi |
| `ai` | `/ai/chat`, `/ai/tutor` | AI Tutor |
| `ws` | `/ws/proctor`, `/ws/cbt` | WebSocket real-time |

---

## Keamanan

Praktik keamanan yang diterapkan pada codebase:

### Autentikasi & Otorisasi
- **JWT access (15m) + refresh (720h)** via HttpOnly cookie
- **RBAC**: `ADMIN`, `STAFF`, `TEACHER`, `STUDENT` + `RequireRole` middleware
- **Register publik dipaksa role `STUDENT`** — mencoba register `ADMIN/STAFF/TEACHER` → 400
- Seluruh route mutasi content (`/exams`, `/practice`) dilindungi `RequireAuth` + role guard
- Password di-hash dengan bcrypt

### Pencegahan Kerentanan
- **Anti-IDOR**: ownership check (`session.UserID != userID` → 403) pada session CBT, hasil, attempt, dan practice
- **Anti-panic**: helper aman `middleware.UserIDFromCtx` menggantikan type assertion berbahaya; middleware `recover` aktif
- **Anti-cheat grading**: `IsCorrect`/`PointsEarned` dari client **tidak dipercaya** — dihitung ulang server-side dari opsi benar soal
- **Parameterized queries** (pgx) di seluruh layer untuk cegah SQL injection
- **No hardcoded credentials**: kredensial admin tidak ada di frontend; `config.yaml` (berisi secret) di-`.gitignore`
- **Rate limiting** per IP, **sanitize input**, **security headers**, **request-id**

### Checklist (verifikasi oleh code review)
- [x] Auth pada semua route terpapar
- [x] Ownership pada semua resource per-user
- [x] Grading server-side (tidak percaya client)
- [x] Panic handling global (`recover`)
- [x] Register publik tidak bisa buat role tinggi
- [x] Tidak ada kredensial hardcoded / data mock palsu

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
- Node.js 20+ / npm
- PostgreSQL 16 (disarankan Supabase)

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

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run type-check # type checking
```

### 4. Seed data (opsional)

```bash
cd backend
go run ./cmd/seed         # buat user test (admin, staff, guru, murid)
go run ./cmd/seed_audit   # audit log sample
```

**Akun test default:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@yakinlulus.id` | `Admin@123!` |
| Staff | `staff@yakinlulus.id` | `Admin@123!` |
| Guru | `guru.budi@yakinlulus.id` | `Admin@123!` |
| Murid | `murid@yakinlulus.id` | `Admin@123!` |

---

## Testing

### Backend (Go)
```bash
cd backend
go test ./...        # 10 paket, 50 test — semuanya PASS
go vet ./...
```

Coverage area: auth (register role guard, profile validation), cbt_engine (grading server-side, ownership, submit strip), middleware (JWT, RBAC, rate-limit), shared (response), exam_packages, ranking, target_schools, profile, academic, config.

### Frontend (Vitest)
```bash
cd frontend
npm test             # 6 file, 36 test — semuanya PASS
npm run type-check   # TypeScript strict
```

Test file: docx-to-rows, MathKaTeXPreview, StagingQuestionCard, material-form-utils, question-form-utils, utils.

---

## Verifikasi Checklist

- [x] `go build ./...` — clean
- [x] `go vet ./...` — bersih
- [x] `go test ./...` — 50/50 PASS (10 paket)
- [x] `npx tsc --noEmit` — bersih
- [x] `npm test` — 36/36 PASS
- [x] `npm run build` — sukses
- [x] 43/43 migrations applied
- [x] Unified content schema deployed
- [x] Semua modul konsumen pakai `content.Repository`
- [x] Auth & RBAC aktif di semua route
- [x] Grading server-side, anti-IDOR, panic recovery
- [x] Config & secret di-.gitignore

---

## Dokumentasi Tambahan

- `backend/openapi.yaml` — spesifikasi OpenAPI
- `backend/migrations/` — 43 versi SQL migration
- `backend/config.yaml` — konfigurasi runtime (jangan di-commit)
- `frontend/README.md` — dokumentasi frontend
- `docs/superpowers/` — spesifikasi & plan fitur (brainstorming/planning records)
- `dev/mermaid_er.md` — ER diagram
- `dev/make_template.py` — generator template import soal
