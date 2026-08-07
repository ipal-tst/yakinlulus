# Design Specification: Student Practice Module (`/practice`)

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target Route:** `/practice` (`frontend/src/app/(siswa)/practice/page.tsx`)  

---

## 1. Overview & Objective

Fix the 404 error on `/practice` and create a rich, interactive **Student Practice Hub**. The page will enable students to practice exam questions through three distinct modes:
1. **Per Subject (Per Mapel)**
2. **Per Topic/Material (Per Materi/Bab)**
3. **Special Admin Drills (Drill Soal Spesial Admin)**

---

## 2. Technical Scope & Constraints

- **Route Location**: `frontend/src/app/(siswa)/practice/page.tsx`
- **Zero API/DB Breaking Changes**: Use existing `/academic/exams`, `/academic/materials`, and `/cbt/sessions` endpoints with robust mock fallbacks.
- **TypeScript**: Strict type adherence passing `npx tsc --noEmit`.
- **UI Framework**: Next.js 16 (App Router), Tailwind CSS v4, Lucide icons, `AppShell` layout.

---

## 3. UI/UX Layout & Sections

### Section 1: Header & Practice Overview Stats
- **Header**: "Pusat Latihan Soal & Drill UTBK/SNBT" with active `GradeBadge`.
- **Summary Cards Grid**:
  - Total Soal Dikerjakan
  - Akurasi Jawaban (%)
  - Latihan Streak Hari Ini
  - Total Point / Skor Latihan

### Section 2: Interactive 3-Tab Selector
- **Tab 1: Latihan Per Mata Pelajaran**
  - Cards per Subject (*Penalaran Matematika*, *Literasi Bahasa Indonesia*, *Penalaran Umum*, *Pengetahuan Kuantitatif*, *Bahasa Inggris*).
  - Subject details: total question pool count, difficulty breakdown, progress percentage.
  - Action: "Mulai Latihan Mapel".
- **Tab 2: Latihan Per Materi / Bab**
  - Grouped cards per topic (*Deret Angka & Pola*, *Logika Wacana*, *Persamaan & Fungsi*, *Geometri Spasial*).
  - Linked to materials read in `/materials`.
  - Action: "Mulai Latihan Materi".
- **Tab 3: Drill Soal Spesial Admin / Guru**
  - Curated drill packets created by teachers/admins (*Super Drill HOTS 15 Menit*, *Drill Kilat 10 Soal*, *Bank Soal UTBK 2025/2026*).
  - Metadata: total questions, estimated time, reward XP/Points, author badge.
  - Action: "Mulai Drill".

### Section 3: Practice Launcher Dialog
- Modal confirmation dialog displaying drill parameters (Duration, Total Questions, Mode: *Mode Santai dengan Pembahasan* or *Mode Simulated Ujian*).
- Directly launches CBT engine or practice runner.

---

## 4. Verification Plan

1. **Routing Verification**: Navigate to `http://localhost:3000/practice` from sidebar to verify 404 is fixed.
2. **Type Safety**: Run `npx tsc --noEmit` to ensure 0 compilation errors.
3. **Tab & Modal Interaction**: Verify smooth tab switching and dialog confirmation.
