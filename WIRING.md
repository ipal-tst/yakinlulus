# Wiring Diagram — YakinLulus.id

## Struktur Aplikasi

```
3 Layout Shells → 61 Pages → 35 Shared Components
─ Root Layout (ThemeProvider, QueryClient, fonts)
  ├─ Public Pages (no sidebar)
  │   ├─ / (Landing)
  │   ├─ /docs (API Docs)
  │   ├─ /login | /register | /forgot-password | /reset-password | /verify-email
  │   └─ /exam/[examId] (CBT Workspace — layout terpisah)
  │
  ├─ Portal Layout (AuthProvider, Sidebar, Header, MobileNav)
  │   ├─ /admin/** (14 pages)
  │   ├─ /student/** (22 pages, 4 redirect)
  │   ├─ /teacher/** (8 pages)
  │   └─ /staff/** (5 pages)
```

---

## A. PUBLIC PAGES

### `/` — Landing Page
```
┌──────────────────────────────────────────────────────────────────┐
│  Nav: Logo | Portal Siswa | Portal Guru | Portal Admin | Login   │
├──────────────────────────────────────────────────────────────────┤
│  Hero Section (hero-section.tsx)                                 │
│  Jenjang Section (jenjang-section.tsx) — SD/SMP/SMA/Gap Year     │
│  Solutions Section (solutions-section.tsx)                       │
│  Pricing Section (pricing-section.tsx)                           │
│  FAQ Section (faq-section.tsx)                                   │
├──────────────────────────────────────────────────────────────────┤
│  Footer: Register | Login                                        │
└──────────────────────────────────────────────────────────────────┘
Modal: none
Navigasi: /login, /register
```

### `/login` — Login
```
┌─────────────────────────────────────┐
│  Form: Email + Password              │
│  Link: Lupa Password → /forgot-pass  │
│  Link: Daftar → /register            │
│  On success → / redirect by role     │
└─────────────────────────────────────┘
Modal: none
```

### `/register` — Register
```
┌─────────────────────────────────────┐
│  Form: Nama + Email + Password       │
│  Link: Sudah punya akun → /login    │
│  On success → /login?registered     │
└─────────────────────────────────────┘
Modal: none
```

### `/exam/[examId]` — CBT Workspace (Layout khusus, no sidebar)
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Timer | Navigasi Soal btn                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐          │
│  │  Stem & Stimulus (50%)   │  │  Option Selector (50%)   │          │
│  │  - Intro text            │  │  - CBTOptionSelector     │          │
│  │  - Stem text (MathKaTeX) │  │  - Single/Multi/TrueFalse│          │
│  └──────────────────────────┘  └──────────────────────────┘          │
├─────────────────────────────────────────────────────────────────────┤
│  Bottom: Prev | Ragu-ragu checkbox | Next/Akhiri                     │
└─────────────────────────────────────────────────────────────────────┘
Side panel (slide): CBTNavigationMatrix (isMatrixOpen)
Modal: Dialog — Konfirmasi Selesai (isSubmitDialogOpen)
On finish → router.push(/student/exam/[examId]/result)
```

---

## B. ADMIN PORTAL (`/admin/**`)

### B1. `/admin` — Command Center (Dashboard)
```
┌──────────────────────────────────────────────────────────────┐
│  Stat cards: Total Users | Questions | Exams | Media | AI    │
│  Quick Action grid:                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │Master    │ │Users     │ │Bank Soal │ │CBT Exam  │        │
│  │Data      │ │& Role    │ │& FSM     │ │Operations│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │Sekolah   │ │Paket &   │ │AI Tutor  │ │API Docs  │        │
│  │Mitra     │ │Revenue   │ │          │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  Maintenance section: Backup | Quick User | etc.             │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 5 (BACKUP, QUICK_USER, RESET_TOKEN, PURGE_CACHE, RELOAD_AI)
Navigasi: → /admin/master-data, /admin/users, /admin/question-bank, /admin/cbt,
            /admin/schools, /admin/subscriptions, /admin/ai-tutor, /admin/docs
```

### B2. Master Data Pages (`/admin/master-data/*`)

#### `/admin/master-data` — Hub
```
┌──────────────────────────────────────────────────────────┐
│  6 Cards:                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Jenjang   │ │Kurikulum │ │Mapel     │ │Bab       │     │
│  │& Kelas   │ │          │ │          │ │          │     │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤     │
│  │Topik     │ │Program   │ │          │ │          │     │
│  │& CP      │ │& TA      │ │          │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└──────────────────────────────────────────────────────────┘
Modal: AdminActionModal — add item (isAddModalOpen)
Navigasi: → /admin/master-data/levels, /curriculums, /subjects, /chapters, /topics, /programs
```

#### `/admin/master-data/levels` — Jenjang & Kelas
```
┌──────────────────────────────────────────────────────────────┐
│  Tabel Jenjang + Kelas                                        │
│  ┌─────┬──────┬──────────┬──────────────┐                    │
│  │ No  │ Jenj │ Kelas    │ Aksi         │                    │
│  ├─────┼──────┼──────────┼──────────────┤                    │
│  │     │      │          │ Edit | Hapus │                    │
│  └─────┴──────┴──────────┴──────────────┘                    │
│  Button: + Tambah Jenjang                                     │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3 (add, edit, delete)
Navigasi: /admin/master-data (back)
```

#### `/admin/master-data/subjects` — Mapel
```
┌──────────────────────────────────────────────────────────────┐
│  Tabel: Kode | Nama | Jenjang | Aksi                         │
│  Generate otomatis: 3hurufmapel-kelas                         │
│  Button: + Tambah Mapel                                       │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3 (add, edit, delete)
Form add: Level + Kelas + Nama → kode auto ⇒ abbreviation-grade
```

#### `/admin/master-data/chapters` — Bab
```
┌──────────────────────────────────────────────────────────────┐
│  Filter: Mapel dropdown                                       │
│  Tabel: Nama | Mapel | Aksi                                  │
│  Button: + Tambah Bab                                         │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3
```

#### `/admin/master-data/topics` — Topik & Learning Outcomes
```
┌──────────────────────────────────────────────────────────────┐
│  Filter: Bab dropdown                                         │
│  Tabel: Nama | Bab | Mapel | Code CPL | Aksi                │
│  Button: + Tambah Topik                                       │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3
```

#### `/admin/master-data/curriculums` — Kurikulum
```
┌──────────────────────────────────────────────────────────────┐
│  Tabel: Nama | Deskripsi | Aksi                              │
│  Button: + Tambah Kurikulum                                   │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3
```

#### `/admin/master-data/programs` — Program & Tahun Ajaran
```
┌──────────────────────────────────────────────────────────────┐
│  Tabel: Nama | Tahun | Target PTN | Aksi                    │
│  Button: + Tambah Program                                     │
└──────────────────────────────────────────────────────────────┘
Modal: AdminActionModal × 3
```

### B3. `/admin/users` — User & Role Access
```
┌──────────────────────────────────────────────────────────────┐
│  Stat: Total | Admin | Teacher | Staff | Student             │
│  Filter: Role dropdown + Search                               │
│  Tabel: Nama | Email | Role | Grade | Status | Aksi         │
│  Button: + Tambah User                                        │
└──────────────────────────────────────────────────────────────┘
Modal: Custom inline CreateUserModal / EditUserModal / DeleteUserModal (fixed overlay)
Navigasi: none
```

### B4. `/admin/question-bank` — Bank Soal & FSM
```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Stat (Total | Draft | Review | Published) + Filter      │
├──────────────────────────────────────────────────────────────────┤
│  Buttons: + Tambah Soal | Bulk Import | AI PDF Import | Template │
├──────────────────────────────────────────────────────────────────┤
│  Grid: Kartu soal per item — status badge, content preview,      │
│        difficulty, bloom level, option count, aksi               │
│  ┌────────────────────────────────────────────┐                  │
│  │ Status │ Mata Pelajaran │ Difficulty X C3 │                  │
│  │ Teks soal preview...                       │                  │
│  │ A. ... B. ... C. ... D. ... E. ...        │                  │
│  │ ──────────────────────────────────────     │                  │
│  │ [Edit] [FSM] [KaTeX] [Hapus]              │                  │
│  └────────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
Modal:
  - AdminActionModal: Create (isCreateModalOpen)
  - AdminActionModal: Edit (isEditModalOpen)
  - AdminActionModal: Delete (isDeleteModalOpen)
  - AdminActionModal: Bulk Import (isBulkModalOpen) — Excel/CSV file upload
  - AdminActionModal: FSM Transition (isFsmModalOpen)
  - AdminActionModal: KaTeX Preview (isKatexModalOpen)
  - AIPDFImportModal: AI Import (isAiImportModalOpen) — 3 tabs:
    [1. Upload Berkas] [2. Paste Teks] [3. Pratinjau Staging]
    - Upload: PDF/PNG/JPG/XLSX/CSV → AI Vision API or spreadsheet parser
    - Paste: textarea → regex parse → staging table
    - Staging: editable table, per-row AI pembahasan, KaTeX preview
    - Commit: → POST /questions/import
Navigasi: none (all CRUD in modals)
```

### B5. `/admin/cbt` — CBT Exam Operations
```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Stat (Total | Published | Draft | Sync Ready)           │
│  Buttons: Download Template | Bulk Import | + Tambah Ujian      │
│  Filter: Status tabs + Search                                    │
├──────────────────────────────────────────────────────────────────┤
│  Grid Exam Cards:                                                │
│  ┌────────────────────────────────────────────┐                  │
│  │ Status badge | Duration                     │                  │
│  │ Title + Deskripsi                           │                  │
│  │ Passing: X | Maks: Yx                       │                  │
│  │ Acak: Soal Ya | Opsi Ya                     │                  │
│  │ ──────────────────────────────────────     │                  │
│  │ [Soal] [Edit]                          [🗑] │                  │
│  └────────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
Modal:
  - AdminActionModal: Create (isCreateOpen)
  - AdminActionModal: Edit (isEditOpen)
  - AdminActionModal: Delete (isDeleteOpen)
  - AdminActionModal: Bulk Import (isImportOpen) — Excel/CSV
  - AdminActionModal: Atur Soal (isQuestionsOpen) — list + add/remove questions
  - AdminActionModal: Picker Soal (isPickerOpen) — search + select from bank
Navigasi: none (all CRUD in modals)
```

### B6. `/admin/materials` — Materi Pembelajaran CMS
```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Stat + [AI Summary] [+ Upload Materi Baru]              │
│  Filter: Mapel + Format + Search                                 │
├──────────────────────────────────────────────────────────────────┤
│  Grid Material Cards:                                            │
│  ┌────────────────────────────────────────┐                     │
│  │ Code | Format badge | Status            │                     │
│  │ Title                                   │                     │
│  │ Subject • Chapter                       │                     │
│  │ Views: X,XXX     [👁] [✏️] [🗑]       │                     │
│  └────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
Modal:
  - Dialog: Create/Edit (isCreateOpen) — form: title, subject, chapter (inline +),
    topic (inline +), duration, status, content, MediaPicker
  - Dialog: Detail (viewingMaterial)
  - Dialog: Delete (deletingMaterial)
  - Dialog: AI Summary (isAISummaryOpen)
Navigasi: none (all CRUD in dialogs)
```

### B7. `/admin/schools` — Sekolah Mitra & Quota
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat cards + Filter + Search                                    │
│  Grid School Cards: logo, nama, type, status, quota stats        │
│  Actions: Edit quota | Status toggle | Hapus                     │
└──────────────────────────────────────────────────────────────────┘
Modal: Dialog × 3 (create/edit, delete, detail preview)
```

### B8. `/admin/subscriptions` — Paket & Revenue MRR
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: MRR | Active | Trials | Churn                            │
│  Tabel: Plan | Price | Duration | Features | Aksi               │
│  Tabel: User subscriptions                                       │
└──────────────────────────────────────────────────────────────────┘
Modal: Dialog × 2 (create/edit plan, delete)
```

### B9. `/admin/analytics` — Analytics & Reports
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat overview: Total Exams | Avg Score | Pass Rate | Active     │
│  Tabel: Report per exam — click for detail                       │
└──────────────────────────────────────────────────────────────────┘
Modal: Dialog — exam detail (selectedExamId)
```

### B10. `/admin/content` — Konten & Banner CMS
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Total | Exam | Material | Question | Media               │
│  Tabel content list: Type | Title | Status | Created | Aksi     │
│  Media grid: thumbnails, upload button                           │
└──────────────────────────────────────────────────────────────────┘
Modal: Dialog × 2 (content detail, delete media)
```

### B11. `/admin/ai-tutor` — AI Tutor Companion
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Conversations | Tokens Used | Active Users               │
│  Tabel: conversation history with delete                         │
└──────────────────────────────────────────────────────────────────┘
Modal: none (confirm() for delete)
```

### B12. `/admin/audit-logs` — Audit & Security Log
```
┌──────────────────────────────────────────────────────────────────┐
│  Filter: Severity | Event Type | Date range                      │
│  Tabel: Timestamp | User | Event | Severity | IP | Detail       │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### B13. `/admin/docs` — API Documentation (re-exports /docs)
```
┌──────────────────────────────────────────────────────────────────┐
│  Full API documentation page — endpoint list, methods, examples  │
└──────────────────────────────────────────────────────────────────┘
```

### B14. `/admin/settings` — Pengaturan Sistem
```
┌──────────────────────────────────────────────────────────────────┐
│  AI Config panel (inline toggle: showAIConfig)                   │
│    - Endpoint URL | API Key | Model ID                           │
│    - Quick presets: Ollama | LM Studio | OpenAI | OpenRouter    │
└──────────────────────────────────────────────────────────────────┘
Modal: none (inline conditional section)
```

---

## C. STUDENT PORTAL (`/student/**`)

### C1. `/student` — Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│  Welcome + Statistik Nilai Ujian (Total | Rata-rata | Nilai Terbaik) │
│  Section: Nilai Ujian Terbaru → /student/tryout/[id]/result       │
│  Section: Materi Terbaru → /student/materials                      │
│  Section: Tryout Tersedia → /student/exam/[id]/info               │
│  Section: Peringkat Nasional → /student/leaderboard                │
└──────────────────────────────────────────────────────────────────┘
Modal: none
Navigasi: → /student/materials, /student/exam, /student/leaderboard
```

### C2. `/student/exam` — Ujian & Tryout Hub (merged)
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Tersedia | Sedang Dikerjakan | Riwayat Selesai           │
│  Featured banner (first exam):                                  │
│    - Jika NOT_STARTED → [Mulai Ujian] → /student/exam/[id]/info │
│    - Jika IN_PROGRESS → [Lanjutkan] → /exam/[id]               │
│    - Jika COMPLETED → [Hasil] + [Pembahasan]                    │
│  Filter tabs: Semua | Belum | Berjalan | Selesai               │
│  Search + Grid exam cards                                       │
│  Setiap card: status badge, title, durasi, action button        │
└──────────────────────────────────────────────────────────────────┘
Modal: none
Navigasi: → /student/exam/[id]/info, /exam/[id], /student/exam/[id]/result,
           /student/exam/[id]/discussion
```

### C3. `/student/exam/[id]/info` — Pre-Exam Instructions
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /student/exam                                      │
│  Header: Exam title                                              │
│  Info cards: Durasi | Jumlah Soal | Passing Grade | Penilaian   │
│  Aturan & Ketentuan ujian                                        │
│  [Mulai Ujian] → POST /cbt/:id/start → router.push(/exam/[id]) │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C4. `/student/exam/[id]/result` — Post-Exam Result
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /student/exam                                      │
│  Status: LULUS / TIDAK LULUS                                    │
│  Score total + breakdown per sub-tes                             │
│  Progress bar + stats (correct/wrong)                           │
│  Subject breakdown table + analysis                             │
│  [Lihat Pembahasan] → /student/exam/[id]/discussion             │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C5. `/student/exam/[id]/discussion` — Pembahasan Soal
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /student/exam/[id]/result                          │
│  Stat: Benar | Salah | Tidak Dijawab | Skor                     │
│  Filter: Semua | Benar | Salah | Kosong                         │
│  List soal dengan:                                               │
│    - Nomor soal + difficulty + status badge                      │
│    - Stem text                                                   │
│    - Opsi: warna hijau=benar, merah=salah terpilih              │
│    - Tombol: [Lihat Pembahasan] — expandable explanation         │
└──────────────────────────────────────────────────────────────────┘
Modal: none (expandable inline sections)
```

### C6. `/student/materials` — Materi Belajar Hub
```
┌──────────────────────────────────────────────────────────────────┐
│  Filter: Mapel | Jenjang | Search                               │
│  Grid material cards: subject badge, title, chapter, duration   │
│  → /student/materials/[materialId]                              │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C7. `/student/materials/[materialId]` — Detail Materi
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /student/materials                                 │
│  Content render (markdown/HTML)                                 │
│  AI Summary toggle (isAiSummaryOpen)                            │
│  [Latihan Soal] → /student/practice/material/[materialId]       │
└──────────────────────────────────────────────────────────────────┘
Modal: none (inline AI summary section)
```

### C8. `/student/practice` — Latihan Soal Adaptif
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Total | Rata-rata | Nilai Terbaik                        │
│  Mulai Latihan Baru: pilih mapel + jumlah soal                  │
│  Riwayat sesi: tanggal, mapel, skor, status                     │
│  → /student/practice/[id]                                       │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C9. `/student/practice/[id]` — Practice Workspace
```
┌──────────────────────────────────────────────────────────────────┐
│  Progress bar | Timer (calculator toggle)                        │
│  Question content + option selector                             │
│  [Selesai] → /student/practice/[id]/result                      │
└──────────────────────────────────────────────────────────────────┘
Modal: none (inline calculator toggle)
```

### C10. `/student/practice/[id]/result` — Practice Result
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /student/practice                                  │
│  [Ulang] → /student/practice/[id]                               │
│  Score + correct/wrong breakdown                                │
│  Rekomendasi materi → /student/materials/mat-04                 │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C11. `/student/practice/material/[materialId]`
```
┌──────────────────────────────────────────────────────────────────┐
│  Latihan berdasarkan materi tertentu                            │
│  Question + options + [Selesai]                                  │
│  Confirm overlay (showSubmitConfirm)                            │
│  On finish → router.push(/student/materials/[materialId])        │
└──────────────────────────────────────────────────────────────────┘
Modal: Custom fixed overlay confirmation
```

### C12. `/student/leaderboard` — Leaderboard Nilai Ujian
```
┌──────────────────────────────────────────────────────────────────┐
│  Pilih Paket Ujian + Bulan (reset bulanan)                        │
│  Leaderboard tabel: Rank | Nama Siswa | [per-mapel] | Total | Rata | Sekolah │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C13. `/student/analytics` — Progress & IRT Analytics
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Total Ujian | Akurasi | Rata-rata Skor | Lulus/Gagal     │
│  Ringkasan: Benar / Salah / Kosong + progress bar               │
│  Radar chart per subject (PerformanceRadarChart)                 │
│  Trend chart skor (PerformanceTrendChart)                        │
│  Subject mastery list dengan persentase                          │
│  Rekomendasi belajar — terlemah + terkuat                        │
│  Riwayat ujian terakhir tabel                                    │
│  [Ambil Ujian] → /student/exam                                  │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C14. `/student/ai-tutor` — AI Tutor Companion
```
┌──────────────────────────────────────────────────────────────────┐
│  Chat interface: message history + input                        │
│  Subject context selector                                        │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C15. `/student/profile` — Profil & Target Belajar
```
┌──────────────────────────────────────────────────────────────────┐
│  User info | Edit profile                                       │
│  Target PTN | Jurusan                                           │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### C16. `/student/tryout/**` — Redirects to `/student/exam/*`
```
/student/tryout → /student/exam
/student/tryout/[id]/result → /student/exam/[id]/result
/student/tryout/[id]/pre-test → /student/exam/[id]/info
/student/tryout/[id]/pre-test/result → /student/exam/[id]/result
```

---

## D. TEACHER PORTAL (`/teacher/**`)

### D1. `/teacher` — Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat: Students | Questions | Exams | Avg Score                 │
│  Quick actions: + Bank Soal | + Ujian | + Materi               │
│  Tabel: Exam statuses                                           │
└──────────────────────────────────────────────────────────────────┘
Modal: none
Navigasi: → /teacher/question-bank/create, /teacher/exam-packages, /teacher/question-bank
```

### D2. `/teacher/question-bank` — Bank Soal (Teacher)
```
┌──────────────────────────────────────────────────────────────────┐
│  List soal with filter (subject, difficulty, status)            │
│  [+ Soal Baru] → /teacher/question-bank/create                  │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D3. `/teacher/question-bank/create` — Buat Soal
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /teacher/question-bank                             │
│  QuestionFormEngine + FSMStateControl + MathKaTeXPreview        │
│  Form: subject, chapter, content, options, correct answer, etc. │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D4. `/teacher/exam-packages` — Paket Ujian
```
┌──────────────────────────────────────────────────────────────────┐
│  Filter + Search + Grid exam cards                              │
│  [+ Buat Paket] → /teacher/exam-packages/create                 │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D5. `/teacher/exam-packages/create` — Buat Paket Ujian
```
┌──────────────────────────────────────────────────────────────────┐
│  [Cancel] → /teacher/exam-packages                              │
│  Form: title, code, duration, jenjang, status                   │
│  On success: router.push(/teacher/exam-packages)                 │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D6. `/teacher/materials` — Materi (Teacher)
```
┌──────────────────────────────────────────────────────────────────┐
│  List materi with search                                        │
│  [+ Materi Baru] → /teacher/materials/create                    │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D7. `/teacher/materials/create` — Buat Materi
```
┌──────────────────────────────────────────────────────────────────┐
│  [Cancel] → /teacher/materials                                  │
│  Form: title, subtest (hardcoded), content, duration            │
│  On success: router.push(/teacher/materials)                     │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### D8. `/teacher/exam/custom` — Custom Exam Builder
```
┌──────────────────────────────────────────────────────────────────┐
│  [Kembali] → /teacher/exam                                      │
│  Step 1: Basic info (title, duration, passing, etc.)            │
│  Step 2: Subject blueprints (add subjects with E/M/H counts)    │
│  Summary table + [Buat Ujian]                                   │
│  On success: router.push(/teacher/exam/${id})                    │
└──────────────────────────────────────────────────────────────────┘
Modal: none (inline step form)
```

---

## E. STAFF PORTAL (`/staff/**`)

### E1. `/staff` — Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│  Stat overview cards                                            │
│  Quick links to sub-pages                                       │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### E2. `/staff/cbt` — CBT Monitoring
```
┌──────────────────────────────────────────────────────────────────┐
│  Live session monitoring (read-only)                            │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### E3. `/staff/reports` — Reports & Analytics
```
┌──────────────────────────────────────────────────────────────────┐
│  Read-only analytics data                                       │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### E4. `/staff/academic` — Academic Data
```
┌──────────────────────────────────────────────────────────────────┐
│  Read-only academic structure (levels, grades, subjects)        │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

### E5. `/staff/users` — User Data
```
┌──────────────────────────────────────────────────────────────────┐
│  Read-only user list                                            │
└──────────────────────────────────────────────────────────────────┘
Modal: none
```

---

## F. SIDEBAR NAVIGATION

### Admin Sidebar
```
Command Center         → /admin
Master Data Akademik   → /admin/master-data
User & Role Access     → /admin/users
Bank Soal & FSM        → /admin/question-bank
Materi Pembelajaran    → /admin/materials
CBT Exam Operations    → /admin/cbt
Sekolah Mitra & Quota  → /admin/schools
Paket & Revenue MRR    → /admin/subscriptions
Pengaturan Sistem ▼    → collapsible sub-menu:
  ├─ Analytics & Reports    → /admin/analytics
  ├─ Konten & Banner CMS    → /admin/content
  ├─ AI Tutor Companion     → /admin/ai-tutor
  ├─ API Documentation      → /admin/docs
  └─ Audit & Security Log   → /admin/audit-logs
```

### Student Sidebar
```
Beranda Siswa          → /student
Materi Belajar Hub     → /student/materials
Latihan Soal Adaptif   → /student/practice
Ujian CBT & Tryout     → /student/exam
AI Tutor Companion     → /student/ai-tutor
Progress & IRT Analytics → /student/analytics
Leaderboard Nilai Ujian → /student/leaderboard
Profil & Target Belajar → /student/profile
```

### Teacher Sidebar
```
Teacher Command        → /teacher
Kelola Bank Soal       → /teacher/question-bank
Paket Ujian & Tryout   → /teacher/exam-packages
Materi Pembelajaran    → /teacher/materials
```

### Staff Sidebar
```
Staff Command          → /staff
CBT Monitoring         → /staff/cbt
Reports & Analytics    → /staff/reports
Academic Data (View)   → /staff/academic
User Data (View)       → /staff/users
```

---

## G. SHARED COMPONENTS

### UI Components (`components/ui/`)
```
Dialog | Button | Card | Input | Select | Badge | Table | Tabs | Progress | Skeleton
```

### Admin Components (`components/admin/`)
```
AdminActionModal   — Generic CRUD modal with submit/cancel
AIPDFImportModal   — 3-tab AI-powered question import (Upload → Paste → Staging)
```

### CBT Components (`components/cbt/`)
```
CBTViolationBanner    — Cheating detection warning
CBTTimerAndSync       — Countdown timer + answer sync
CBTQuestionRenderer   — Question content renderer
CBTOptionSelector     — Option selector (single/multi/truefalse)
CBTNavigationMatrix   — Grid navigation panel
CBTItemMatrix         — Individual item in matrix
```

### Editor Components (`components/editor/`)
```
QuestionFormEngine    — Question create/edit form
MediaAssetPlayer      — Media file preview
MathKaTeXPreview      — LaTeX math renderer
FSMStateControl       — State transition (Draft→Review→Approved→Published)
```

### Analytics Components (`components/analytics/`)
```
PerformanceRadarChart  — Multi-axis radar per subject
PerformanceTrendChart  — Score trend over time
```

### Layout Components (`components/layout/`)
```
Sidebar    — Desktop collapsible nav + mobile drawer
MobileNav  — Bottom mobile tab bar
Header     — Top bar with user menu
```

### Landing Components (`components/landing/`)
```
hero-section | faq-section | solutions-section | pricing-section | jenjang-section
```

### AI Components (`components/ai/`)
```
AITutorFloatingWidget — Floating chat button
```

### Other
```
media-picker — Media library picker for content editors
```

---

## H. MODAL INVENTORY BY TYPE

| Modal Type | Component | Used On |
|------------|-----------|---------|
| **AdminActionModal** | CRUD with submit/cancel | admin dashboard (×5), admin/cbt (×6), admin/question-bank (×6), all master-data pages (×3 each) |
| **Dialog** | Generic with close button | exam/[examId], admin/analytics, admin/content, admin/materials (×4), admin/schools (×3), admin/subscriptions (×2), teacher/exam/custom |
| **AIPDFImportModal** | 3-tab AI import | admin/question-bank |
| **Custom inline** | Fixed overlay | admin/users (Create/Edit/Delete), student/practice/material/[materialId] (submit confirm) |
| **Inline section** | Conditional render | admin/settings (AI config), student/practice/[id] (calculator), student/materials/[materialId] (AI summary) |

---

## I. API DATA FLOW

```
Frontend (Next.js 15)                     Backend (Go + Fiber)
─────────────────────────                  ─────────────────────
apiFetch() → /api/v1/...  ──────────────→  localhost:8080/api/v1/...
  credentials: include                       JWT auth via HttpOnly cookie
  auto-login on 401                          middleware.RequireAuth
  unwraps { data } response                  shared.Success() / shared.Error()
```

### Key API Endpoints by Module

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, POST /auth/register, GET /auth/me, users CRUD |
| Academic | GET/POST /academic/levels, /grades, /subjects, /chapters, /topics, /curriculums, /programs |
| Questions | GET/POST/PUT/DELETE /questions, POST /questions/import |
| Exams | GET/POST/PUT/DELETE /exams, POST /exams/:id/questions |
| CBT Runtime | POST /cbt/:exam_id/start, POST /cbt/:session_id/sync, /finish, GET /cbt/:session_id/questions, /answers, /review, GET /cbt/sessions |
| Materials | GET/POST/PUT/DELETE /materials, PATCH /materials/:id/publish |
| Practice | POST /practice/sessions/start, GET /practice/sessions, practice answer/submit |
| Dashboard | GET /dashboard/student, /teacher, /admin |
| Analytics | GET /analytics/students/:id, /students/:id/timeline, /exams/:id, /admin/overview |
| Media | POST /media/upload, GET /media, DELETE /media/:id |
| Exam Packages | GET/POST /exam-packages, GET/PUT/DELETE /exam-packages/:id, POST /exam-packages/:id/exams, GET /exam-packages/:id/exams |
| Ranking | GET /leaderboard?package_id&month |
| AI | GET/PUT /ai/config, POST /ai/parse-questions, POST /ai/tutor/chat |
| Scoring | GET /results/:id, /results/:id/subject-breakdown |
