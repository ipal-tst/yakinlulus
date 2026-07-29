# Report Frontend — YakinLulus.id

> **Dibuat**: 27 Juli 2026 (Update: Sprint 16 selesai)
> **Berdasarkan**: Analisis backend, 127+ dokumen di `doc/`, 14 modul backend, design system lengkap

---

## 1. Status API Server

| Check | Status |
|-------|--------|
| Server | ✅ Running di `localhost:8080` |
| Health | ✅ `{"database":"connected","status":"ok"}` |
| Auth Login | ✅ Admin login sukses (JWT token) |
| Swagger/OpenAPI | ✅ `backend/openapi.yaml` — OpenAPI 3.1, 103 paths, 3 schemas, BearerAuth — disajikan di `/docs` & `/openapi.yaml` |
| Redis caching | ✅ `pkg/cache/cache.go` — optional, graceful skip, PingBackground goroutine |
| WebSocket proctoring | ✅ `internal/ws/ws.go` — Hub + `/ws/proctor` + `/ws/exam/:session_id` |
| Advanced analytics | ✅ Leaderboard/subject, timeline/difficulty/school stats — `internal/analytics/advanced.go` |
| Rate limiter config | ✅ Fix RPM→RPS conversion di `main.go` |
| API yang terdaftar | ✅ 15 modul, ~401 handler, 142 op OpenAPI |
| API List | ✅ `backend/api_list.md` — full checklist per endpoint |

**Swagger sekarang aktif di `/docs` (CDN Swagger UI) + `/openapi.yaml`. **103 paths, 142 operations, 3 base schemas (Success, Error, PaginationMeta), BearerAuth.**

---

## 2. Ringkasan Backend

### Stack
- **Go 1.22 + Fiber v2** — 11 modular internal package
- **Supabase PostgreSQL** — 9 migrations applied
- **JWT Auth** — middleware `RequireAuth` + `RequireRole`
- **Arsitektur**: Flat router tiap modul (`internal/*/*.go`), langsung handler, tanpa Clean Architecture layers

### 11 Modul API (`/api/v1/...`)

| Modul | Prefix | Endpoints | Status |
|-------|--------|-----------|--------|
| Auth | `/auth` | 11 | ✅ Login, register, profile, refresh |
| Academic | `/academic` | 9 | Levels, subjects, chapters |
| Question Bank | `/questions` | 8 | CRUD, import, review |
| CBT Engine | `/exams` | 9 | Blueprint, pool, participants |
| CBT Runtime | `/cbt` | 8 | Start, sync, navigate, finish |
| Scoring | `/results` | 6 | Scores, ranking, analytics |
| Analytics | `/analytics` | 2 | Admin reports |
| Media | `/media` | 4 | Upload, entity media |
| Material | `/materials` | 4 | CRUD materials |
| School | `/schools` | 4 | CRUD schools |
| Notification + Templates | 15 | Sprint 12/13 |
| **Dashboard** | **3** | **Sprint 16 ✅** |
| **Gamification** | **8** | **Sprint 16 ✅** |
| **Practice** | **5** | **Sprint 16 ✅** |
| **AI Tutor** | **5** | **Sprint 16 ✅** |

### Gap Backend vs Dokumen

| Dokumen bilang | Realita Backend | Status |
|----------------|-----------------|--------|
| Clean Architecture (domain → usecase → repo → handler) | ❌ Langsung handler → database | — |
| | Redis caching | ✅ `pkg/cache/cache.go` — optional client, PingBackground | ✅ Gap closed after Sprint 16 |
| | WebSocket proctoring | ✅ `internal/ws/ws.go` — Hub + /ws/proctor + /ws/exam/:session_id | ✅ Gap closed |
| | OpenAPI 3.1 + Swagger UI | ✅ `backend/openapi.yaml` — 103 paths, 142 ops | ✅ Gap closed |
| | Advanced analytics | ✅ Leaderboard/subject, timeline, difficulty, school stats — `advanced.go` | ✅ Gap closed |
| Unit tests | ❌ 0 test — test file dibuat tapi belum ada repository mock |
| Realtime notifikasi/pengingat | ❌ Belum ada |
| | Dashboard aggregasi endpoint | ✅ Dibuat: 3 endpoint (student/teacher/admin) | ✅ Sprint 16 |
| | AI Tutor API | ✅ LLM proxy + conversation history + generate soal | ✅ Sprint 16 |
| | Gamification (XP, badge, streak, leaderboard) | ✅ 8 badges, XP, streak ping, leaderboard | ✅ Sprint 16 |
| | Latihan Soal (Practice) | ✅ Random soal, session, jawab, stats | ✅ Sprint 16 |
| | AI config + env overrides | ✅ AIConfig struct + AI_ENDPOINT/AI_API_KEY/AI_MODEL env | ✅ Sprint 16 |

---

## 3. Dokumen Desain (yang SUDAH sangat lengkap)

127+ file dokumentasi, termasuk:

### Design System (LENGKAP)
- ✅ 5 design principles, M3-inspired
- ✅ Color system (primary blue #1565C0, secondary green, gold accent)
- ✅ Typography (Plus Jakarta Sans + JetBrains Mono)
- ✅ Spacing (4px base unit, token: space-1 sampai space-32)
- ✅ Grid (12 col desktop, 8 tablet, 4 mobile)
- ✅ Design tokens (primitive → semantic → component)
- ✅ Iconography (Lucide icons, outline style)
- ✅ Dark mode (3 layer: primitive → semantic → component token)
- ✅ Animation (Framer Motion, 5 speed tiers)
- ✅ Accessibility (WCAG 2.2 AA)
- ✅ Responsive (mobile-first, 5 breakpoints)
- ✅ Component library (atomic design, 50+ components)
- ✅ UI Checklist (lagi QA)

### Halaman Spesification (LENGKAP)
- ✅ Student Dashboard (08) — learning command center
- ✅ Teacher Dashboard (09) — teaching command center
- ✅ Admin Dashboard (10) — platform command center
- ✅ Learning Material (11) — learning experience hub
- ✅ Question Bank (12) — bank soal management
- ✅ Practice (13) — adaptive learning engine
- ✅ CBT Exam (14) — ujian online
- ✅ AI Tutor (15) — personal AI assistant
- ✅ Struktur Halaman Siswa (lengkap semua pages)
- ✅ Struktur Halaman Admin (lengkap semua pages)

### Engineering Guide (LENGKAP)
- ✅ Frontend folder structure (feature-first)
- ✅ Component architecture (5 layer)
- ✅ State management (server: TanStack Query, client: Zustand)
- ✅ Auth flow (JWT + HTTP-only cookie)
- ✅ Route management (Next.js App Router + middleware)
- ✅ Offline strategy (IndexedDB + Service Worker)
- ✅ Performance optimization
- ✅ Form handling (React Hook Form + Zod)
- ✅ CBT frontend implementation

### Stack yang sudah ditetapkan

| Layer | Pilihan |
|-------|---------|
| Framework | Next.js 16 App Router |
| UI Library | React 19 |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Icon | Lucide React |
| Chart | Recharts |
| Table | TanStack Table |
| Animation | Framer Motion |
| Server State | TanStack Query |
| Client State | Zustand |
| Form | React Hook Form + Zod |
| Auth | next-auth / JWT |
| i18n | next-intl |

---

## 4. Rekomendasi Desain Frontend

### 4.1 Prioritas Implementasi

Berdasarkan backend yang sudah jadi vs dokumen:

**Phase 1 — Core Student Experience (backend ready)**
1. Auth (login/register) — backend ✅
2. Dashboard Siswa — backend ✅ (endpoint aggregasi)
3. Academic Browser (levels → subjects → chapters) — backend ✅
4. Material Viewer — backend ✅ (CRUD)
5. Practice (latihan soal) — backend ✅ (session + jawab + stats)
6. Gamification (XP, badge, streak) — backend ✅
7. CBT Exam **tanpa offline** — runtime ✅

**Phase 2 — Teacher & Admin (backend sebagian)**
1. Teacher Dashboard
2. Question Bank UI (CRUD via API ✅)
3. CBT Management
4. Admin Dashboard
5. Analytics

**Phase 3 — AI Features (backend ready — butuh AI_API_KEY env)**
1. AI Tutor chat — backend ✅ (LLM proxy + conversation history)
2. AI Generate Soal — backend ✅
3. AI Recommendation
4. Adaptive practice
5. Smart analytics

### 4.2 Arsitektur Routing (dari dokumen)

```
app/
├── (auth)/              → login, register, forgot-password
├── (student)/           → /dashboard, /belajar, /latihan, /cbt, /ai-tutor, /profil
├── (teacher)/           → /guru/dashboard, /guru/kelas, /guru/bank-soal
├── (admin)/             → /admin/dashboard, /admin/users, /admin/sekolah
└── api/                 → Next.js API routes (optional proxy)
```

### 4.3 Layout Structure

```
RootLayout
├── AuthLayout (tanpa sidebar)
├── StudentLayout (sidebar + topbar)
│   ├── DashboardPage
│   ├── LearningMaterialPage
│   ├── PracticePage
│   ├── CBTExamPage
│   ├── AITutorPage
│   └── ProfilePage
├── TeacherLayout (sidebar + topbar)
└── AdminLayout (sidebar + topbar)
```

### 4.4 Key Component Tree

```
Design System (shadcn/ui + tailwind)
├── atoms: Button, Input, Badge, Avatar, Icon
├── molecules: Card, FormField, DataTable, SearchBox, Pagination
├── organisms: Sidebar, Header, DashboardWidget, QuestionCard, CBTQuestion
├── templates: DashboardTemplate, ExamTemplate, MaterialTemplate
└── pages: (each route)
```

### 4.5 State Management Strategy

```
TanStack Query (server state)
├── useAuth() → auth hooks (login, logout, profile)
├── useAcademic() → levels, subjects, chapters
├── useQuestions() → question bank CRUD
├── useExam() → CBT exam list, sessions
├── useCBT() → runtime state (current question, timer, answers)
├── useMaterial() → learning materials
├── useResult() → scores, ranking
└── useNotification() → notifications

Zustand (client state)
├── useUIStore → theme, sidebar, modal
├── useExamStore → CBT runtime (answers, timer, flags)
├── useOfflineStore → pending sync queue
└── useFilterStore → search filters, pagination
```

### 4.6 Gap yang Harus Dikerjakan Frontend (back-end gap yg tersisa)

| Fitur | Backend Status | Frontend Solusi |
|-------|---------------|-----------------|
|| Analytic lanjutan (leaderboard, timeline, diffs, school stats) | ✅ Ditambah — `advanced.go` | Pakai langsung |
| Dashboard aggregasi | ✅ Ada endpoint | Pakai langsung |
| AI Tutor | ✅ Ada LLM proxy | Butuh AI_API_KEY env |
| Gamification | ✅ Endpoint lengkap | Pakai langsung |
| Practice | ✅ Session + jawab | Pakai langsung |
| Realtime sync | ❌ Belum ada | Polling + optimistic UI |
| WebSocket proctoring | ✅ Ada endpoint `/ws/proctor` + `/ws/exam/:id` | Langsung pakai |
| Offline mode | ❌ Belum ada | IndexedDB + Service Worker sendiri |
| Swagger/OpenAPI | ✅ `openapi.yaml` + `/docs` | Pakai langsung |
| Redis cache | ✅ Optional, graceful skip | Cache data statis |

### 4.7 Rekomendasi Prioritas Teknis

1. **Bikin API client layer dulu** — satu file service tiap modul
2. **Auth flow** — middleware di Next.js + protected layout
3. **Student layout** — shell reusable (sidebar + topbar)
4. **shadcn/ui** komponen sesuai design token
5. **Dashboard student** — skeleton loading + paralel fetch
6. **CBT flow** — offline-first state management (Zustand + IndexedDB)
7. **PWA** — Service Worker offline cache

---

## 5. Prompt untuk Generate di Stitch Google (Material Design 3)

Copy paste ini ke **Stich** (ai.google.dev/stitch) atau Gemini dengan prompt:

```
Kamu adalah UI/UX designer expert. Buatkan high-fidelity UI design spec untuk aplikasi EdTech "YakinLulus.id" — platform belajar online untuk siswa SMA/SMK Indonesia.

## BRAND & IDENTITY
- **Nama**: YakinLulus.id
- **Tagline**: "Persiapan Ujian #1 di Indonesia"
- **Target**: Siswa SMA/SMK (15-19 tahun), Guru, Admin Sekolah
- **Vibe**: Modern, terpercaya, fokus, edukatif, gamifikasi
- **Warna**: Primary Blue (#1565C0), Secondary Green (#2E7D32), Accent Gold (#F9A825), Neutral surface
- **Font**: Plus Jakarta Sans (display + body), JetBrains Mono (code/rumus)
- **Ikon**: Lucide Icons (outline style, stroke 2px)

## PLATFORM
- Web (Next.js 16 + Tailwind v4 + shadcn/ui)
- Mobile-first responsive (5 breakpoints: 320, 768, 1024, 1440, 1920+)
- Support dark mode + light mode
- Target WCAG 2.2 AA accessibility

## LAYOUT SYSTEM
- Grid: 12 column desktop, 8 column tablet, 4 column mobile
- Spacing base unit: 4px (space-1 sampai space-32)
- Container max-width: 1440px
- Sidebar width: 280px (expanded), 88px (collapsed)
- Header height: 72px (sticky)
- Card padding: 24px, compact: 16px, large: 32px

## PAGES YANG HARUS DIDESAIN

### Landing Page
Header hero dengan ilustrasi siswa belajar. CTA "Mulai Belajar". 
Section: fitur utama, statistik, testimoni, pricing (jika ada), footer.
Warna bold, banyak whitespace, motion subtle.

### Student Dashboard (PALING KRITIS)
Layout: sidebar kiri (dashboard, belajar, latihan, ujian, AI tutor, progress, profil).
Header sticky: logo, search bar, notifikasi, avatar.
Widget dalam grid:
- Greeting (nama siswa + quote motivasi)
- Today's Goal (progress ring + CTA)
- Continue Learning (thumbnail materi + progress bar)
- Learning Progress (bar chart per mapel)
- AI Recommendation (card dengan alasan rekomendasi)
- Weekly Activity (bar chart 7 hari)
- Upcoming CBT (countdown + detail)
- Leaderboard (rank + top 10)
- Recent Activity (timeline)
Skeleton loading untuk tiap widget independen.

### CBT Exam Interface (IMMERSIVE FULLSCREEN)
LAYOUT SPESIAL — mirip tryout online:
- Header: nama ujian, timer countdown (large), progress (nomor soal), status koneksi
- Main area kiri: soal + gambar/rumus (KaTeX render)
- Main area kanan: pilihan jawaban (A/B/C/D/E) sebagai tombol besar
- Navigation grid: dropdown di topbar menampilkan grid semua nomor (warna: hijau=answered, merah=flagged, abu=unanswered)
- Footer: Previous, Flag, Next buttons
- Fullscreen saat ujian dimulai
- Auto-save tiap jawaban
- Offline indicator
- Submit confirmation modal

### Practice Page (Latihan Soal)
Layout mirip CBT tapi lebih santai:
- Quick practice: 10/20/30/50 soal dengan satu klik
- Recommended practice: card berdasarkan AI
- Practice history: table/list
- Overview stats: total latihan, rata-rata nilai, streak
- Adaptive difficulty: soal menyesuaikan level

### Learning Material Page
Grid card per materi. Tiap card: thumbnail, judul, progress bar, estimated time, difficulty badge.
Filter by: subject, chapter, type (video/pdf/text).
Continue learning widget di atas.
Search bar dengan shortcut Cmd+K.

### Question Bank (ADMIN/GURU)
Data table dengan filter advanced:
- Search by question text
- Filter: subject, chapter, difficulty, type (PG/complex), status (draft/published/archived)
- Bulk actions: publish, archive, delete
- Preview sidebar/drawer
- Question form: rich text editor untuk soal + options + explanation
- AI generate button
- Import Excel/Word button
- Stats: total, draft, published, need review

### AI Tutor (Chat Interface)
Full chat UI:
- Welcome screen dengan suggestion chips
- Chat bubbles: user (right), AI (left) with streaming effect
- Markdown render + KaTeX formula support
- Upload image button (OCR soal)
- Voice input (future)
- Conversation history sidebar
- Regenerate, copy, feedback buttons
- Suggested follow-up prompts

### Teacher Dashboard
Layout mirip student tapi konten berbeda:
- Greeting dengan jadwal hari ini
- My Classes widget (progress per kelas)
- Quick Actions: Buat Materi, Tambah Soal, Buat CBT
- Upcoming CBT management
- Student Progress overview (line chart)
- AI Teaching Insight
- Question Bank stats
- Recent Activity

### Admin Dashboard
Data-heavy dashboard:
- Global KPI row: total users, schools, teachers, students, CBT active
- System Health widget: API, DB, storage status
- Active Users chart (line)
- CBT Monitoring (bar chart running/scheduled/finished)
- Server Monitoring (CPU, RAM, storage gauge)
- Security alerts
- Revenue chart (jika premium)
- Quick actions

## DESIGN PRINCIPLES
1. Whitespace is a design element, not empty space
2. Minimum cognitive load — max 3 pertanyaan terjawab dalam 5 detik
3. Consistent — setiap komponen sama di semua halaman
4. Fast — skeleton loading, lazy loading, max 3 paralel request
5. Accessible — WCAG 2.2 AA, keyboard nav, screen reader
6. Offline-first — CBT tetap jalan tanpa internet
7. Fun — gamifikasi (XP, streak, badge, leaderboard)

## COMPONENT PRIORITY
Design komponen berikut dengan konsisten:
- Button (primary, secondary, outline, ghost, danger) + loading state
- Input (default, error, disabled) + label + helper
- Card (default, interactive, compact, dashboard widget)
- Badge (status, difficulty, notification count)
- Progress bar & Progress ring
- Data table (sort, filter, pagination, select)
- Modal/Dialog (focus trap, ESC close, animation)
- Toast/Notification (success, error, warning, info)
- Skeleton loading (shimmer animation)
- Empty state (ilustrasi + message + CTA)
- Form field (label + input + error + helper)
- Search box (icon + input + recent searches)

## OUTPUT FORMAT
Buatkan:
1. **Design System** — color palettes (light + dark), typography scale, spacing scale, component spec
2. **Figma Layout** — wireframe untuk 8 halaman utama di atas (mobile + desktop)
3. **Component Library** — 20+ reusable components
4. **UX Flow** — student learning journey: dashboard → belajar → latihan → ujian → hasil
5. **Responsive Behavior** — bagaimana tiap halaman beradaptasi dari mobile ke desktop
6. **Design Token** — CSS variable mapping untuk Tailwind

GUNAKAN Google Material Design 3 sebagai referensi utama. TAPI jangan pure Material — adjust untuk EdTech Indonesia (budaya visual lokal, warna hangat, tipografi modern).
```

---

## 6. Catatan Kritis

### Yang backend SUDAH punya → bisa langsung frontend
- Auth (login, register, profile, refresh, forgot/reset password)
- Academic (jenjang, kelas, mapel, bab, kurikulum)
- Question bank CRUD + search + import/export + options
- Exam CRUD + blueprint + pool + rule config + publish/schedule/archive + clone
- CBT runtime (start, sync, navigate, pause/resume, finish, violations)
- Scoring + ranking + per-question analytics
- Analytics (exam detail, student weaknesses, question breakdown, admin reports)
- Media upload (MinIO optional)
- Material CRUD + publish/archive + learning progress
- School CRUD + settings + branding
- Notification CRUD + templates + preferences + send/broadcast
- Dashboard aggregasi (student/teacher/admin) — ✅ **Spring 16**
- Gamification (XP, badge, streak, leaderboard, achievements) — ✅ **Sprint 16**
- Practice (random soal, session, jawab, stats, auto-complete) — ✅ **Sprint 16**
- AI Tutor (LLM proxy, conversation history, generate question) — ✅ **Sprint 16**

### Yang backend BELUM → frontend perlu akal-akalan
- ~~Dashboard aggregasi~~ → ✅ Backend sudah ada
- ~~AI Integration~~ → ✅ Backend sudah ada (butuh `AI_API_KEY` env)
- ~~Gamification~~ → ✅ Backend sudah ada
- ~~Practice~~ → ✅ Backend sudah ada
- Real-time notifications → polling tiap N detik
- WebSocket live proctoring → skip dulu
- Offline sync → Service Worker + IndexedDB manual
- Advanced analytics → hitung di frontend dari data mentah
- AI Recommendation → backend belum ada, frontend hitung sendiri

### Dokumentasi masih Draft
99% file `Status: Draft`. Tapi kualitas sangat tinggi. Frontend bisa aman pakai sebagai acuan implementasi.

### Desain System READY TO USE
Color tokens, typography, spacing, component spec — semuanya sudah detail. Tinggal mapping ke Tailwind CSS v4 config.

### Sprint 16 — Selesai (27 Juli 2026)
| Modul | Endpoint | Status |
|-------|----------|--------|
| Dashboard | `/dashboard/{student,teacher,admin}` | ✅ Data real (KPI, greeting, progress) |
| Gamification | `/gamification/{xp,badges,streak,leaderboard}` | ✅ 8 badges, XP, streak ping |
| Practice | `/practice/{sessions/start,answer,stats}` | ✅ Random soal, session, stats |
| AI Tutor | `/ai/{tutor/chat,generate-question}` | ✅ LLM proxy + conversation history |
| **API List** | **`backend/api_list.md`** | **✅ 141 endpoint checklist per module** |

### Catatan
- AI chat butuh `AI_API_KEY` env di server
- Full backend coverage: 15 modul, 401+ handlers, 142 OpenAPI operations, 19 migrations
- Sisa gap: unit tests (mock DB), realtime notifikasi
- Rate limiter sudah fix RPM→RPS conversion
- Redis: optional — WARN jika unavailable, graceful skip
- WebSocket: live proctoring siap, tinggal frontend consume
- Server handler count naik dari 211 → 401 (WebSocket + analytics + swagger + redis wiring)

---

*End of Report — YakinLulus.id Frontend Analysis*
