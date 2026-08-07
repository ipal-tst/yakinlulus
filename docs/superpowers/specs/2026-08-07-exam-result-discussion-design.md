# Design Specification: Exam Result & Comprehensive Discussion Page

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target File:** `frontend/src/app/(siswa)/exams/[id]/result/page.tsx`

---

## 1. Objective

Build the Exam Result & Detailed Discussion page (`/exams/[id]/result`) to eliminate the 404 error after completing a CBT exam. Provide a goal-driven summary (IRT score, target PTN progress, national ranking, accuracy stats), subtest performance breakdown, and an interactive question-by-question answer key with step-by-step solutions.

---

## 2. Page Structure & Components

### 2.1 Score Summary Header Banner
- **Final IRT Score**: Render total IRT score (e.g. `685 IRT`).
- **Target PTN Comparison**: Display target university (e.g. *Universitas Indonesia - Teknik Informatika*), target IRT (`720 IRT`), score gap (`-35 Poin`), and passing probability badge (`Peluang Lolos 95%`).
- **National Rank Widget**: Display national rank (e.g. `Rank #42 / 3,450 Peserta`).

### 2.2 Accuracy & Performance Overview Stats
- Grid cards displaying:
  - **Jawaban Benar** (e.g. `128 Soal`)
  - **Jawaban Salah** (e.g. `20 Soal`)
  - **Tidak Dijawab / Ragu** (e.g. `7 Soal`)
  - **Akurasi Total** (e.g. `82.5%`)

### 2.3 Subtest Breakdown Matrix
- Table or cards breakdown showing performance for each subtest:
  - Subtest Name
  - Questions Correct / Total
  - Subtest IRT Score
  - Accuracy % Badge

### 2.4 Interactive Question Answer Key & Discussion (Pembahasan Soal)
- Filter buttons: `Semua Soal`, `Jawaban Benar`, `Jawaban Salah`, `Kosong / Ragu`.
- Accordion / Cards list for each question:
  - Question Number & Subtest Badge
  - Question Content
  - Student's Answer vs Correct Answer
  - **Solusi & Langkah Pembahasan Detail** (Step-by-step mathematical / logical explanation).

### 2.5 Action CTA Buttons
- "Ulangi Ujian" button (re-takes CBT).
- "Kembali ke Katalog Ujian" button (returns to `/exams`).

---

## 3. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **URL Verification**: Confirm that `/exams/ex-1/result` loads successfully and displays full score metrics, subtest breakdown, and question explanations.
