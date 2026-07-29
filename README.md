# YakinLulus.id - Platform Learning & CBT EdTech Berbasis Domain-Driven Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8.svg)](https://go.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

**YakinLulus.id** adalah platform EdTech & CBT generasi baru berbasis **Micro-Subscription (Rp 10.000/bulan)** yang melayani siswa lintas jenjang pendidikan (**SD, SMP, SMA, dan Gap Year UTBK SNBT**). Platform ini menggabungkan arsitektur *Domain-Driven*, sistem penilaian **Item Response Theory (IRT 3-PL)**, engine formula LaTeX (KaTeX), *Offline-Resilient Computer-Based Testing (CBT)* engine, **Admin Suite CMS Center**, serta pendamping cerdas **AI Tutor Companion**.

---

## 🎨 Design System — Aurelian Academy
- **Primary Electric Blue** `#004AC6` — Action, focus, technology
- **Secondary Vibrant Green** `#006C49` — Success, progress, growth  
- **Tertiary Marigold** `#784B00` — Warning, achievement, energy
- **Typography:** Quicksand (via next/font/google)
- **Components:** Pill-shaped (48px min), pseudo-3D tactile buttons, checkbox pop animation (24px)
- **Touch targets:** K-12 compliant (48px minimum)

---

## 💡 Strategi Bisnis & Model Monetisasi

- **Model Berlangganan Micro-SaaS**: **Rp 10.000 / bulan** per siswa (10-50x lebih terjangkau dibandingkan bimbel konvensional Rp 500rb - 2jt/bulan).
- **Kampanye Beta Program**: **Gratis 6 Bulan Pertama untuk 500 Beta Testers** pertama.
- **Target Multi-Jenjang**:
  - **SD**: Kelas 4 - 6 (Asesmen Literasi & Numerasi Dasar)
  - **SMP**: Kelas 7 - 9 (Ujian Sekolah & Asesmen Nasional)
  - **SMA**: Kelas 10 - 12 (Persiapan Mandiri & Ujian Sekolah)
  - **Gap Year**: UTBK SNBT 2026 & Ujian Mandiri PTN

---

## 🌟 Fitur & Arsitektur Utama Platform

### 1. 🎓 Student Super App Suite (13 Rute Utama)
- **Beranda Siswa (`/student`)**: Dashboard dengan Streak counter, Level/XP, Quick Actions, dan Continue Learning.
- **Materi Belajar Hub (`/student/materials`)**: Modul interaktif per sub-tes dengan video stream HD & KaTeX renderer.
- **Latihan Soal Adaptif (`/student/practice`)**: Daily Practice Challenge & Latihan Adaptif IRT.
- **Ujian CBT & Tryout Hub (`/student/exam`)**: Central Hub Tryout Akbar & Asesmen Sekolah dengan statistik live, filter jenjang, & pencarian instan.
- **CBT Engine Workspace (`/exam/[examId]`)**: Ruang ujian terisolasi dengan dukungan tipe soal **Pilihan Ganda (Single Choice)**, **Pilihan Ganda Majemuk (Multiple Choice)**, & **Matriks Pernyataan (True/False)**.
- **Hasil & IRT Tryout (`/student/tryout/[tryoutId]/result`)**: Evaluasi IRT 3-PL & rekomendasi fokus AI.
- **AI Tutor Companion Center (`/student/ai-tutor`)**: Asisten belajar 24/7 berbasis Gemini LLM & RAG vector store.
- **Analytics & IRT (`/student/analytics`)**: Radar chart kemampuan sub-tes & grafik tren perkembangan.
- **Leaderboard & XP (`/student/leaderboard`)**: Klasemen peringkat nasional, kota, & sekolah.
- **Profil & Target Belajar (`/student/profile`)**: Manajemen target sekolah/PTN impian & unduh sertifikat.

### 2. 👑 Admin & Teacher CMS Command Center
- **Command Center (`/admin`)**: KPI global, *Service Health Monitor* (API, PostgreSQL, Redis), server load, & security alerts.
- **Master Data Akademik (`/admin/master-data`)**: Taksonomi pendidikan (Jenjang, Kelas, Mapel, Bab, Sub-Bab).
- **User & Role Access (`/admin/users`)**: Direktori pengguna (Siswa, Guru, Admin, Staff), kontrol RBAC, & audit log.
- **Bank Soal & FSM Workflow (`/teacher/question-bank`)**: Manajemen soal (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`), status FSM (`DRAFT` → `IN_REVIEW` → `APPROVED` → `PUBLISHED`), & KaTeX engine.
- **CBT Operations Center (`/admin/cbt`)**: Monitoring live exam sessions, peserta aktif, & emergency lock.
- **Sekolah Mitra & Quota (`/admin/schools`)**: Manajemen lisensi institusi mitra (Enterprise, Pro School, Basic).
- **Paket Belajar & Revenue MRR (`/admin/subscriptions`)**: Pendapatan bulanan (MRR), ARPU, & log transaksi realtime.

### 3. 🔌 Frontend-Backend API Gateway (`frontend/lib/api-client.ts`)
Terintegrasi secara penuh dengan Go Fiber REST Endpoints (`/api/v1/`):
- `auth`: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`
- `academic`: `/api/v1/academic/subjects`, `/api/v1/academic/chapters`
- `questionBank`: `/api/v1/questions` (CRUD, publish, archive, restore, clone, export, import, options, revisions)
- `exams`: `/api/v1/exams` (CRUD, publish, schedule, archive, clone, analytics, rules, blueprint, pool, participants, questions)
- `cbt`: `/api/v1/cbt` (start session, sync answers, navigate, pause, resume, finish, report violation, get answers, get session questions)
- `materials`: `/api/v1/materials`
- `analytics`: `/api/v1/analytics/student/summary`, `/api/v1/analytics/admin/overview`
- `school`: `/api/v1/schools`, `/api/v1/schools/:id/quota`
- `scoring`: `/api/v1/scoring/results`
- `media`: `/api/v1/media/upload`, `/api/v1/media`
- `notification`: `/api/v1/notifications`

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: [Next.js 15 App Router](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [TypeScript Strict Mode](https://www.typescriptlang.org/)
- **Backend Services**: [Go 1.22 (Fiber & Clean Architecture)](https://go.dev/), PostgreSQL 16, Redis Cluster
- **Math & AI Engine**: [KaTeX 0.16](https://katex.org/), Gemini 3 Flash / Pro LLM, PGVector Index
- **Migration Tool**: Custom Go migrator (`cmd/migrate/main.go`)

---

## 📦 Backend Architecture (Go 1.22 + Fiber)

### Structure
```
backend/
├── cmd/
│   ├── api/          # Main HTTP server entry point
│   ├── migrate/      # Database migration runner
│   └── seed/         # Database seeder
├── internal/
│   ├── academic/     # Academic hierarchy (levels, grades, curriculums, subjects, chapters, topics, LOs)
│   ├── ai/           # AI Tutor (Gemini, embeddings, RAG)
│   ├── analytics/    # Student/Admin analytics & IRT calculations
│   ├── auth/         # JWT authentication, roles, permissions
│   ├── cbt_engine/   # Exam logic: start, submit, grading, blueprint, pool, attempts
│   ├── cbt_runtime/  # Real-time CBT session: answers, violations, timer, navigation
│   ├── content/      # UNIFIED CONTENT DOMAIN (base + subtypes)
│   ├── dashboard/    # Student dashboard aggregation
│   ├── gamification/ # XP, streaks, badges, leaderboards
│   ├── material/     # Learning materials (uses content.Repository)
│   ├── media/        # File upload, storage (Supabase S3)
│   ├── middleware/   # Auth, RBAC, logging, rate limiting
│   ├── notification/ # Push, email, in-app notifications
│   ├── practice/     # Adaptive practice, daily challenges
│   ├── question_bank/# Question CRUD, import/export, FSM (uses content.Repository)
│   ├── school/       # School management, quotas
│   ├── scoring/      # IRT 3-PL, scoring algorithms
│   └── ws/           # WebSocket for real-time CBT
├── pkg/
│   ├── cache/        # Redis wrapper
│   ├── config/       # YAML config loader
│   ├── database/     # pgx pool, migrations
│   └── storage/      # Supabase S3 client
└── migrations/       # 24 SQL migration files (versioned)
```

### Unified Content Domain (`internal/content/`)
**Single source of truth for all content types** — questions, materials, exams consolidated into one base table with subtypes.

**Tables (Migration 023):**
| Table | Purpose |
|-------|---------|
| `contents` | Base table: `id`, `content_type` (QUESTION/MATERIAL/EXAM), academic FKs (grade, subject, chapter, topic, LO), status, metadata JSONB |
| `content_questions` | Subtype: question_type, difficulty, bloom_level, thinking_level, language, source, stimulus_id, subtopic_id, score, explanation |
| `content_question_options` | Options: label, option_text, is_correct, display_order |
| `content_materials` | Subtype: content_format, estimated_duration, read_count, is_preview, prerequisites |
| `content_exams` | Subtype: description, duration_minutes, passing_score, shuffle, max_attempts, time window, blueprint JSONB |
| `content_exam_questions` | Junction: exam ↔ question (display_order, points) |
| `content_exam_blueprints` | Exam blueprint: easy/medium/hard counts, total_questions |
| `content_question_pools` | Dynamic pool per exam: subject, chapters, difficulty distribution, questions_per_student |
| `content_exam_participants` | Exam ↔ user registration |
| `content_exam_attempts` | Session/attempt: status, scores, timing |
| `content_exam_session_questions` | Per-attempt question selection with shuffled option order |
| `content_exam_answers` | Student answers per attempt |
| `content_learning_progress` | User progress per content (percentage, completed_at) |

**Removed redundancies:**
- `content_questions.topic_id`, `subtopic_id` → already in `contents` base
- `content_exam_session_questions.session_id` → FK to `content_exam_attempts(id)` (not `contents`)

### Domain Models (`internal/content/content.go`)
```go
// Base
type Content struct { ID, ContentType, GradeID, SubjectID, ChapterID, TopicID, LOID, Title, Body, Status, Metadata, CreatedBy, PublishedAt, CreatedAt, UpdatedAt }

// Subtypes
type Question struct { ContentID, QuestionType, Difficulty, BloomLevel, ThinkingLevel, Language, Source, StimulusID, SubtopicID, Score, NegativeScore, EstimatedTime, Explanation }
type Material struct { ContentID, ContentFormat, EstimatedDuration, ReadCount, IsPreview, Prerequisites }
type Exam struct { ContentID, Description, DurationMinutes, PassingScore, ShuffleQuestions, ShuffleOptions, MaxAttempts, StartTime, EndTime, Blueprint }

// Runtime
type ExamAttempt struct { ID, ExamContentID, UserID, AttemptNumber, Status, StartedAt, SubmittedAt, GradedAt, TotalScore, MaxScore, TimeSpentSeconds }
type ExamAnswer struct { AttemptID, QuestionContentID, SelectedOptions, TextAnswer, IsCorrect, PointsEarned, GradedBy, GradedAt }
type LearningProgress struct { UserID, ContentID, ProgressPercentage, LastAccessedAt, CompletedAt }
```

### Repository Interface (`internal/content/content.go`)
```go
type Repository interface {
    // Content base
    CreateContent(ctx, *Content) error
    GetContent(ctx, id) (*Content, error)
    UpdateContent(ctx, id, *Content) error
    DeleteContent(ctx, id) error
    ListContents(ctx, Filter) ([]*Content, int, error)
    
    // Questions
    CreateQuestion(ctx, *Question) error
    GetQuestion(ctx, id) (*QuestionFull, error)
    UpdateQuestion(ctx, id, *Question) error
    ListQuestions(ctx, QuestionFilter) ([]*QuestionFull, int, error)
    BatchCreateQuestionOptions(ctx, contentID, []QuestionOption) error
    
    // Materials
    CreateMaterial(ctx, *Material) error
    GetMaterial(ctx, id) (*MaterialFull, error)
    UpdateMaterial(ctx, id, *Material) error
    IncrementReadCount(ctx, contentID) error
    
    // Exams
    CreateExam(ctx, *Exam) error
    GetExam(ctx, id) (*ExamFull, error)
    UpdateExam(ctx, id, *CreateExamReq, *Exam) error
    ListExams(ctx, ExamFilter) ([]*ExamFull, int, error)
    
    // Exam runtime
    CreateExamAttempt(ctx, *ExamAttempt) error
    GetExamAttempt(ctx, id) (*ExamAttempt, error)
    UpdateExamAttempt(ctx, *ExamAttempt) error
    CreateExamAnswer(ctx, *ExamAnswer) error
    GetExamAnswersByAttempt(ctx, attemptID) ([]*ExamAnswer, error)
    
    // Blueprints & Pools
    CreateExamBlueprint(ctx, *ExamBlueprint) error
    GetExamBlueprint(ctx, examContentID) (*ExamBlueprint, error)
    CreateQuestionPool(ctx, *QuestionPool) error
    GetQuestionPool(ctx, examContentID) (*QuestionPool, error)
    
    // Progress
    UpsertProgress(ctx, *LearningProgress) error
    GetProgress(ctx, userID, contentID) (*LearningProgress, error)
    ListProgressByUser(ctx, userID) ([]*LearningProgress, error)
}
```

### Module Refactors (All use `content.Repository`)
| Module | Before | After |
|--------|--------|-------|
| `question_bank` | Own `Repository` + legacy `questions` table | Thin wrapper → `content.Repository`, returns `*content.QuestionFull` |
| `material` | Own `Repository` + `materials` table | Rewritten → `content.Repository`, uses `content.Material`, `content.LearningProgress` |
| `cbt_engine` | Legacy `exams`, `exam_sessions`, `cbt_answers` | New `Service` + `Handler` → `content.Repository` (exams, attempts, blueprints, pools, participants, grading) |

### Dependency Injection (`cmd/api/main.go`)
```go
contentRepo := content.NewRepository(db)
qbService := question_bank.NewService(contentRepo)      // uses content.Repository
materialService := material.NewService(contentRepo)      // uses content.Repository
cbtService := cbt_engine.NewService(contentRepo)         // uses content.Repository
cbtHandler := cbt_engine.NewHandler(cbtService)
```

---

## 🗄️ Database Schema (24 Migrations)

### Applied Migrations
| # | File | Description |
|---|------|-------------|
| 001 | `001_users.up.sql` | Users, roles, sessions |
| 002 | `002_sessions.up.sql` | Session management |
| 003 | `003_academic.up.sql` | Education levels, grades, subjects, chapters |
| 004 | `004_questions.up.sql` | Legacy questions, options, tags |
| 005 | `005_exams.up.sql` | Legacy exams, exam_questions, blueprints, participants |
| 006 | `006_cbt_runtime.up.sql` | Legacy exam_sessions, exam_answers, violations |
| 007 | `007_scoring.up.sql` | Scoring, IRT parameters |
| 008 | `008_materials.up.sql` | Legacy materials |
| 009 | `009_media.up.sql` | Media files |
| 010 | `010_negative_marking.up.sql` | Negative scoring |
| 011 | `011_password_resets.up.sql` | Password reset tokens |
| 012 | `012_schools.up.sql` | Schools, quotas |
| 013 | `013_notifications.up.sql` | Notifications |
| 014 | `014_revisions.up.sql` | Content revisions |
| 015 | `015_question_pools.up.sql` | Legacy question pools |
| 016 | `016_question_type.up.sql` | Question type enum |
| 017 | `017_gamification.up.sql` | XP, streaks, badges, leaderboards |
| 018 | `018_practice.up.sql` | Adaptive practice |
| 019 | `019_ai_conversations.up.sql` | AI Tutor conversations |
| 020 | `020_question_import.up.sql` | Import schema (AI metadata) |
| **021** | **`021_academic_normalize.up.sql`** | **Full academic normalization: EducationLevel → Grade → Curriculum → Subject → Chapter → Topic → LearningOutcome + question_stimuli + AI enrichment columns** |
| **022** | **`022_platform_simplify_rbac.up.sql`** | **Grade-based RBAC: grade_id on users/questions/materials/exams, triggers auto-set from subject, `user_accessible_grades` view (graduation grades 6/9/12 get vertical access)** |
| **023** | **`023_unified_contents.up.sql`** | **Unified contents base + subtypes + runtime tables + inline data migration from legacy tables** |
| **024** | **`024_data_migration_unified.up.sql`** | **Additional data migration layer (aligned to actual legacy column names: `content`, `label`, `exam_sessions`, `exam_answers`)** |

### Grade-Based Access Control (Migration 022)
```sql
-- User registered grade → accessible grades
-- Grade 6 (SD) → SD grades (4,5,6)
-- Grade 9 (SMP) → SMP grades (7,8,9)
-- Grade 12 (SMA) → SMA grades (10,11,12)
-- Others → only own grade
CREATE VIEW user_accessible_grades AS
SELECT u.id, u.grade_id, 
  CASE 
    WHEN u.grade_id IN (SELECT id FROM grades WHERE name='6' AND education_level_id='SD') 
      THEN (SELECT array_agg(id) FROM grades WHERE education_level_id='SD')
    WHEN u.grade_id IN (SELECT id FROM grades WHERE name='9' AND education_level_id='SMP') 
      THEN (SELECT array_agg(id) FROM grades WHERE education_level_id='SMP')
    WHEN u.grade_id IN (SELECT id FROM grades WHERE name='12' AND education_level_id='SMA') 
      THEN (SELECT array_agg(id) FROM grades WHERE education_level_id='SMA')
    ELSE ARRAY[u.grade_id]
  END AS accessible_grade_ids
FROM users u;
```
Auto-populated via triggers on `questions`, `materials`, `exams` from `subject.grade_id`.

---

## 📊 API Endpoints Summary (149 endpoints, 15 modules)

| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| `auth` | 15 | Login, register, me, refresh, logout, password reset |
| `academic` | 12 | CRUD levels, grades, curriculums, subjects, chapters, topics, LOs |
| `question_bank` | 18 | CRUD, FSM workflow, import/export (Excel v4), options, revisions |
| `exams` | 22 | CRUD, publish, schedule, blueprint, pool, participants, questions, clone, analytics |
| `cbt` | 16 | Start session, sync answers, navigate, pause/resume, finish, violations, session questions |
| `materials` | 10 | CRUD, progress tracking, read count |
| `analytics` | 6 | Student summary, admin overview, IRT ability, radar chart data |
| `school` | 8 | CRUD schools, quotas, license tiers |
| `scoring` | 4 | IRT 3-PL, results, ability estimation |
| `media` | 5 | Upload, list, delete, presigned URLs |
| `notification` | 6 | CRUD, mark read, push preferences |
| `gamification` | 8 | XP, streaks, badges, leaderboards |
| `practice` | 10 | Daily challenge, adaptive practice, history |
| `ai_tutor` | 5 | Chat, RAG search, conversation history |
| `ws` | 4 | WebSocket connect, auth, message types |

---

## 📁 Excel Import Template v4 (AI-Ready)

File: `template_import_soal_v4.xlsx` (33 columns)

| Kolom | Deskripsi | Validasi |
|-------|-----------|----------|
| education_level | SD/SMP/SMA/SMK/UTBK | Enum |
| grade | 1-12 | Required |
| curriculum | K13/Merdeka/UTBK/Internal | Enum |
| subject_code | Kode mata pelajaran | Required |
| chapter_code | Kode bab | Required |
| topic_title | Judul topik | Required |
| lo_title | Learning Outcome | Required |
| lo_code | Kode CP/TP/ATP | Required |
| question_type | SINGLE_CHOICE/MULTIPLE_CHOICE/TRUE_FALSE | Enum |
| difficulty | EASY/MEDIUM/HARD | Enum |
| content | Soal (Markdown/KaTeX) | Required |
| image_url | URL gambar stimulus | Optional |
| explanation | Pembahasan | Required |
| correct_answer | Jawaban benar | Required |
| option_a - option_e | Pilihan A-E | Min 2 untuk MC |
| bloom_level | C1-C6 | Enum |
| thinking_level | LOTS/MOTS/HOTS | Enum |
| language | id/en | Enum |
| source | MANUAL/AI_GENERATED/IMPORTED | Enum |
| score | Bobot soal | Decimal |
| negative_score | Penalty salah | Decimal |
| estimated_time | Detik per soal | Integer |
| tags | JSON array | JSONB |
| difficulty_params | IRT a/b/c | JSONB |
| distractor_patterns | Pola distractors | JSONB |
| cognitive_skills | Keterampilan kognitif | JSONB |
| prerequisites | Prasyarat | JSONB |
| ai_metadata | Metadata AI generation | JSONB |

**Validation passed**: 33 columns, JSONB types detected, 7 enum validations, 33 schema rows, sample data valid.

---

## 🚀 Panduan Memulai (Setup & Development)

### 1. Database (Supabase PostgreSQL)
```bash
# Set connection (use port 6543 for pooler, or 5432 direct)
export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?sslmode=require"

# Run all 24 migrations
cd backend
go run cmd/migrate/main.go up

# Verify migration status
go run cmd/migrate/main.go status
```

### 2. Backend (Go 1.22+)
```bash
cd backend
go mod tidy
go build ./...
go vet ./...
go test ./...

# Run API server
go run cmd/api/main.go
# Server: http://localhost:8080
# Swagger: http://localhost:8080/docs
# OpenAPI: http://localhost:8080/openapi.yaml
```

### 3. Frontend (Next.js 15 App Router)

```bash
cd frontend      # frontend directory
npm install
npm run dev         # Dev: http://localhost:3000
npm run build       # Production build (✓ compiled, all routes)
```

**Frontend Status (2026-07-28):**
| Portal | Pages | Status |
|--------|-------|--------|
| Auth | login, register, forgot/reset password, verify email | ✅ |
| Student | dashboard, exam, practice, materials, leaderboard, profile, tryout, ai-tutor | ✅ TanStack wired |
| Staff | dashboard, cbt, reports, academic, users | ✅ TanStack wired |
| Teacher | dashboard, exam-packages, materials, question-bank | ✅ TanStack wired |
| Admin | dashboard (17+ pages including master-data, users, cbt, analytics) | ✅ TanStack wired |
| CBT Exam | immersive exam/[examId] workspace | ✅ hooks + CBT components |
| Landing | app/page.tsx | ✅ |

**Frontend Architecture:**
- **Auth:** HttpOnly cookie (credentials: 'include'), XSS-safe
- **State:** TanStack Query (45 hooks in `lib/api.ts`)
- **API Client:** `lib/api-client.ts` (18 modules, 100+ endpoints), `lib/api.ts` (TanStack wrapper)
- **Types:** `types/` — dashboard, exam, practice, api
- **Hooks:** `hooks/` — useAuth, useExamSession, usePracticeSession, useDebounce
- **Components:** `components/cbt/` — QuestionRenderer, OptionSelector, NavigationMatrix, ViolationBanner, TimerAndSync
- **UI:** `components/ui/` — aurelian-ui (checkbox pop + pseudo-3D button), shadcn/ui components
- **Design:** Aurelian Academy tokens in `styles/globals.css`, Quicksand font

### 4. Verify Type-Check Frontend
```bash
cd frontend
npm run type-check
```

---

## 🔧 Configuration

### Backend (`backend/config.yaml`)
```yaml
server:
  host: "0.0.0.0"
  port: 8080
database:
  host: "db.PROJECT.supabase.co"
  port: 6543
  user: "postgres"
  password: "${DB_PASSWORD}"
  name: "postgres"
  sslmode: "require"
  pool:
    max_conns: 20
    min_conns: 5
redis:
  host: "localhost"
  port: 6379
jwt:
  secret: "${JWT_SECRET}"
  expiry_hours: 24
storage:
  supabase_url: "https://PROJECT.supabase.co"
  bucket: "yakinlulus-media"
  key: "${SUPABASE_SERVICE_KEY}"
ai:
  gemini_api_key: "${GEMINI_API_KEY}"
  embedding_model: "text-embedding-004"
```

---

## 📈 Verification Checklist

- [x] `go build ./...` — Clean compile
- [x] `go vet ./...` — No issues
- [x] `go test ./...` — All tests pass (26 tests across 4 packages)
- [x] 24/24 migrations applied on Supabase
- [x] Unified content schema deployed
- [x] Grade-based RBAC triggers active
- [x] `question_bank` → `content.Repository`
- [x] `material` → `content.Repository` + `LearningProgress`
- [x] `cbt_engine` → `content.Repository` (Service + Handler)
- [x] Single `contentRepo` DI in `main.go`
- [x] Excel import template v4 validated

---

## 📜 Lisensi & Pengembang

Dikembangkan oleh **Tim Rekayasa Perangkat Lunak YakinLulus.id**. Seluruh hak cipta dilindungi undang-undang.

---

## 📚 Dokumentasi Tambahan

- `D:\Project\EdTech\Yakinlulus.generator\DESIGN.md` — Generator service architecture (deferred, separate project)
- `D:\Project\EdTech\Yakinlulus.id\GENERATOR_DEFERRED.md` — Pointer to generator docs
- `backend/openapi.yaml` — Full OpenAPI 3.1 spec (3150 lines)
- `backend/migrations/` — All 24 versioned SQL migrations
- `dev/make_template.py` — Template generator script
- `dev/mermaid_er.md` — ER diagram (from previous analysis)"# yakinlulus" 
