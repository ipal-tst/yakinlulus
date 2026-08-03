# Stitch Prompt — YakinLulus.id Frontend

## System Context

EdTech platform for Indonesian students preparing for UTBK SNBT, Ujian Mandiri, and school exams. Three portals: Admin (CMS), Student (exam-taking), Teacher (content creation). Built with Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui.

## Design System

Apply the full rules from `stitch-design-taste/DESIGN.md` with these dials:
- **Creativity**: `6` — balanced, clean but with personality
- **Density**: `5` — balanced sections for dashboard usage
- **Variance**: `6` — subtle offsets, not chaotic
- **Motion Intent**: `5` — subtle hover/entrance cues

### Typography
- Use the existing project fonts from `layout.tsx`: `Geist` (sans) + `Geist Mono` (code)
- Headings: `font-extrabold tracking-tight`, scale `clamp(1.25rem, 3vw, 2.25rem)`
- Body: `text-sm` (`14px`) with `text-muted-foreground` for secondary
- All numbers in data tables use `font-mono`

### Colors
- Already configured in `tailwind.config` via CSS variables. Use semantic Tailwind classes:
  - `bg-background text-foreground` — page surfaces
  - `bg-card text-card-foreground` — cards/containers
  - `text-muted-foreground` — secondary text
  - `border` — structural borders (`hsl(var(--border))`)
  - `bg-primary text-primary-foreground` — accent CTAs
  - `bg-destructive text-destructive-foreground` — delete/errors
  - `bg-success` / `bg-warning` — status badges
- Cards: `rounded-xl border bg-card shadow-xs` with `p-5`
- Stats: `p-4 border-x bg-x/5` variant backgrounds per card

### Components (import from `@/components/ui/*`)
```
Button        — variant: default | outline | ghost | destructive | warning | success
Card          — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Badge         — variant: default | secondary | destructive | outline | success | warning
Input         — standard `<input>` replacement
Dialog        — isOpen/onClose/title/description/children
Progress      — value-based bar
Select        — standard `<select>` replacement
Table         — Table, TableHeader, TableBody, TableRow, TableCell
```

### AdminActionModal (from `@/components/admin/AdminActionModal`)
```
Props: isOpen, onClose, title, description, onSubmit, submitLabel, disabled
Used for admin CRUD: form content goes as children.
Has built-in "Batal" + submit buttons.
```

### Icons (from `lucide-react`)
Use semantic icons. Common ones used across app:
```
LayoutDashboard, BookOpen, HelpCircle, FileSpreadsheet, Users, Settings, Bot,
Database, Building2, CreditCard, BarChart3, Image as ImageIcon, ShieldAlert,
Terminal, Trophy, UserCheck, Search, Plus, Edit2, Trash2, CheckCircle2, X,
AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown, Clock, Play,
Award, ArrowLeft, ArrowRight, Layers, Flame, Filter, RefreshCw, Eye, Upload,
FileDown, ListChecks, Sparkles, Target, TrendingUp, TrendingDown, Brain, Zap
```

### Hooks (from `@/lib/api`)
```
useExams, useExam, useCreateExam, useUpdateExam, useDeleteExam
useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion
useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial
useSubjects, useGrades, useLevels, useChapters, useTopics
useStudentDashboard, useStudentAnalytics, useStudentTimeline
useExamPackages, usePackageExams, useRanking
useCBTReview, useStartExamSession, useCBTQuestions, useFinishExam
useSchools, useSubscriptionPlans, useUserSubscriptions
useCreateUser, useUsers
```
All hooks return `{ data, isLoading, error }`. Mutations return `{ mutateAsync, isPending }`.
API fetch pattern: `apiFetch(endpoint, { method, body })` — credentials auto-included, unwraps `{data}`.

### Layout Patterns

**Portal Layout** (auto-applied via `(portal)` route group):
- `<Header role={role} onToggleMobileNav />` — top bar with logo + user menu
- `<Sidebar role={role} isMobileOpen onMobileClose />` — collapsible nav
- `<main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">`
- `<MobileNav role={role} onOpenFullMenu />` — bottom tab bar mobile only

**Auth Layout**: No sidebar/header — standalone centered card.

**CBT Layout** (`/exam/[examId]`): Full-screen no sidebar, custom header with timer, beforeunload guard.

---

## Page Generation Instructions

For each screen below, generate a `"use client"` page following the exact patterns from existing pages. Use `Card`, `Badge`, `Button`, `Input`, `select`, `table` elements. Every page must have loading, error, and empty states.

### ADMIN PAGES (role="admin")

#### Page: `/admin` — Command Center
```tsx
Stat cards row (x4): Total Users | Questions | Exams | Media counts
Quick Action grid (2x4): Master Data, Users, Bank Soal, CBT Exam, Sekolah, Paket & Revenue, AI Tutor, API Docs
  Each card → Link to respective route, lucide icon, title
Maintenance section: 5 AdminActionModals (BACKUP, QUICK_USER, RESET_TOKEN, PURGE_CACHE, RELOAD_AI)
```

#### Page: `/admin/users` — User & Role Access
```
Stat bar: Total | Admin | Teacher | Staff | Student
Filter: role dropdown + name/email search
Table columns: Name | Email | Role | Grade | Status | Actions (Edit | Delete)
Modals: CreateUserModal, EditUserModal, DeleteUserModal (custom fixed overlay, not AdminActionModal)
```

#### Page: `/admin/question-bank` — Bank Soal & FSM
```
Header stat: Total | Draft | Review | Published
Buttons row: [+ Tambah Soal] [Bulk Import] [AI PDF Import] [Download Template]
Filter: Status tabs | Difficulty | Subject | Search
Grid: question cards per item — status badge, subject, difficulty, bloom level, content preview (truncated), options list, action buttons
Modal x6: Create, Edit, Delete, Bulk Import, FSM Transition, KaTeX Preview
Modal AIPDFImportModal: 3 tabs (Upload, Paste, Staging) with AI config panel
```

#### Page: `/admin/cbt` — CBT Exam Operations
```
Header stat: Total | Published | Draft | CBT Ready
Buttons: Download Template | Bulk Import | [+ Tambah Ujian]
Filter: Status tabs + search
Grid: exam cards — status badge, title, duration, passing score, shuffle settings, actions
Modal x6: Create, Edit, Delete, Bulk Import, Atur Soal (question list + remove), Picker Soal (search bank + add)
```

#### Page: `/admin/materials` — Materi Pembelajaran CMS
```
Header stat + [AI Summary] [+ Upload Materi Baru]
Filter: Subject + Format + Search
Grid: material cards — code, format badge, status, title, subject • chapter, views, actions
Modal x4: Create/Edit (with inline chapter/topic creation), Detail, Delete, AI Summary
```

#### Page: `/admin/master-data` — Hub
```
6 cards linking to sub-pages: Jenjang & Kelas, Kurikulum, Mapel, Bab, Topik & CP, Program & TA
Modal: add item (AdminActionModal)
```

#### Sub pages (all same pattern):
```
/admin/master-data/levels       — Table: Jenjang + Kelas, CRUD modals x3
/admin/master-data/subjects     — Table: Code | Nama | Jenjang | Aksi, auto-generate code
/admin/master-data/chapters     — Table with subject filter, CRUD modals x3
/admin/master-data/topics       — Table with chapter filter, CRUD modals x3
/admin/master-data/curriculums  — Table, CRUD modals x3
/admin/master-data/programs     — Table: Nama | Tahun | Target PTN, CRUD modals x3
```

#### Settings-group pages (under collapsible "Pengaturan Sistem" in sidebar):
```
/admin/analytics    — Table: exam reports, stat overview, Dialog for detail
/admin/content      — Table: content list + media grid, Dialog x2
/admin/ai-tutor     — Table: AI conversations, stat cards
/admin/docs         — API docs page (re-export from /docs)
/admin/audit-logs   — Filterable table: audit events
/admin/settings     — AI config panel (inline toggle section)
```

### STUDENT PAGES (role="student")

#### Page: `/student` — Dashboard
```
Stat: Tryout count | Avg Score | Rank | Streak (from gamification hooks)
Section cards: Lanjutkan Tryout, Materi Terbaru, Tryout Tersedia, Leaderboard preview
Each section → Card with title + Link
```

#### Page: `/student/exam` — Ujian & Tryout Hub
```
Stat cards: Tersedia (total exams) | Sedang Dikerjakan (in-progress) | Riwayat Selesai (completed)
Featured banner — first exam with status-adaptive action button
Filter tabs: Semua | Belum | Berjalan | Selesai
Search input + grid exam cards
Each card: status badge, title, duration, score (if completed), action button (Mulai/Lanjutkan/Hasil)
```

#### Page: `/student/exam/[id]/info` — Pre-Exam
```
Back button → /student/exam
Exam title
Info grid: Durasi | Jumlah Soal | Passing Grade | Penilaian
Rules section (amber warning box)
[Mulai Ujian] button → calls useStartExamSession → router.push(/exam/[id])
```

#### Page: `/student/exam/[id]/result` — Post-Exam
```
Back button → /student/exam
LULUS/TIDAK LULUS badge
Score + progress bar + stat breakdown
Subject breakdown table
Analysis section (weakest/strongest subjects)
[Lihat Pembahasan] → /student/exam/[id]/discussion
```

#### Page: `/student/exam/[id]/discussion` — Pembahasan Soal
```
Stat: Benar | Salah | Tidak Dijawab | Skor
Filter buttons: Semua | Benar | Salah | Kosong
Question list with color-coded options (green=correct, red=selected-wrong)
Expandable explanation section per question
```

#### Page: `/student/analytics` — IRT Analytics
```
Stat x4: Total Ujian | Akurasi | Rata-rata Skor | Lulus/Gagal
Accuracy bar: Benar (green) | Salah (red) | Kosong (gray)
PerformanceRadarChart (per subject)
PerformanceTrendChart (timeline)
Subject mastery list with percentages + badges
Weak/strong analysis + recommendations
Recent results table
```

#### Page: `/student/practice` — Latihan Soal
```
Stat: Total | Rata-rata | Streak
Start new: Subject dropdown + question count input + [Mulai]
History table: Date | Subject | Score | Status
```

#### Page: `/student/practice/[id]` — Practice Workspace
```
Progress bar + timer
Question content + CBTOptionSelector
Prev/Next navigation
Finish button → result page
```

#### Page: `/student/materials` — Materi Belajar
```
Filter: Subject + Jenjang + Search
Grid: material cards with subject badge, duration, read count
Link → /student/materials/[materialId]
```

#### Page: `/student/materials/[materialId]` — Detail Materi
```
Content render (markdown)
Toggle: AI Summary section
Button: [Latihan Soal] → /student/practice/material/[materialId]
```

#### Page: `/student/leaderboard` — Leaderboard & XP
```
XP stat card
Badge grid
Leaderboard table: Rank | Name | XP | Level | Streak
```

#### Page: `/student/ai-tutor` — AI Chat
```
Chat message list + input bar
Subject context dropdown
```

#### Page: `/student/profile` — Profil
```
User info form (name, email, target PTN)
Target settings
```

### TEACHER PAGES (role="teacher")

All follow the portal layout. Simpler UI, fewer pages.

#### Page: `/teacher` — Dashboard
```
Stat: Students | Questions | Exams | Avg Score
Quick action cards: [+ Bank Soal] [+ Buat Ujian] [+ Materi]
Exam status table
```

#### Page: `/teacher/question-bank` → `/teacher/question-bank/create`
```
List view with filter → Create page with QuestionFormEngine + FSMStateControl
```

#### Page: `/teacher/exam-packages` → `/teacher/exam-packages/create`
```
List → Create form (title, code, duration, jenjang)
```

#### Page: `/teacher/materials` → `/teacher/materials/create`
```
List → Create form (title, subtest, content, duration)
```

#### Page: `/teacher/exam/custom` — Custom Exam Builder
```
Step 1: Basic info (title, duration, passing score, shuffle settings)
Step 2: Subject blueprints (add subjects with Easy/Medium/Hard counts)
Summary table + [Buat Ujian]
```

### PUBLIC PAGES (no sidebar)

#### Root layout: Font + ThemeProvider + QueryProvider

#### `/` — Landing Page
```
Components: HeroSection, JenjangSection, SolutionsSection, PricingSection, FaqSection
Nav: Logo + Portal links + [Login]
Footer: Register + Login links
```

#### `/login` — Centered card
```
Email + Password form
Links: /forgot-password, /register
Auto-redirect by role on success
```

#### `/register`
```
Name + Email + Password form
Link: /login
On success → /login?registered=true
```

#### `/exam/[examId]` — CBT Workspace (separate layout)
```
Full-screen, no sidebar/header
Custom top bar: logo + timer + nav button
Split view: stem (left 50%) + option selector (right 50%)
Bottom bar: Prev + Ragu checkbox + Next/Finish
Slide panel: CBTNavigationMatrix (question grid)
Dialog: Submit confirmation
On finish → router.push(/student/exam/[examId]/result)
```

## Generation Rules

1. Every page must be `"use client"`
2. Import Button, Card, Badge, Input from `@/components/ui/*`
3. Import icons from `lucide-react`
4. Import hooks from `@/lib/api`
5. Use `useAuth()` from `@/providers/AuthProvider`
6. API calls via `apiFetch` from `@/lib/api`
7. Every data-dependent page handles: `isLoading` (skeleton), `error` (error card), empty state
8. Every modal follows: `const [isXxxOpen, setIsXxxOpen] = useState(false)` pattern
9. Admin modals use `AdminActionModal` component
10. Student/teacher modals use `Dialog` component
11. For data tables: use semantic HTML table with Tailwind, not @tanstack/react-table
12. Filters use `useMemo` for performance
13. Forms use controlled components with `useState`
14. Responsive: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` pattern
15. Cards: `p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-xs`
16. Stats: `p-4 flex items-center gap-4 border-${color}/30 bg-${color}/5`
17. Use `as any` type assertions for API data (hooks return generic types)
18. Navigation: `Link` from `next/link`, `useRouter` from `next/navigation`
19. For CBT exam: use `useParams`, `useStartExamSession`, `useCBTQuestions`, `useFinishExam`
20. Exam result: fetch via API hooks + display score, breakdown, pass/fail status
