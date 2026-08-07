# Design Specification: Question Bank Import Review, Edit & Real-Time Exam Preview

## 1. Overview
Enhancing the Multi-Format Question Import Engine (`/admin/questions/import`) at Stage 3 ("Review & Edit") by providing a full-featured question editor dialog and an interactive student CBT exam preview before committing parsed questions to the database.

---

## 2. Key Modules & Components

### A. `QuestionEditDialog.tsx` (Component Edit Soal Import)
- **Modal Dialog** allowing full customization of any parsed question item before batch import.
- **Fields**:
  - `question_number`: Order index.
  - `question_type`: Pilihan Ganda (PG), PG Kompleks, Isian Singkat, Uraian/Essay.
  - `question_text`: Main question narrative (supports LaTeX math formula syntax).
  - `subject` & `topic`: Academic grouping.
  - `difficulty`: Mudat, Sedang, Sulit, HOTS.
  - `bloom_level`: C1 (Mengingat) s/d C6 (Menciptakan).
  - `weight`: Score weight (default: 1.0).
  - `options`: Array of choices `{ label: string, text: string, is_answer: boolean }`.
    - Dynamic Add/Remove option row.
    - Radio button for single-choice key answer selection.
  - `explanation`: Comprehensive solution/explanation narrative.
- **Validation**: Automatically validates key answer presence & text non-emptiness upon save, updating validation status from `ERROR` / `WARNING` to `VALID`.

### B. `QuestionPreviewDialog.tsx` (Pratinjau Soal CBT Interactive)
- **Interactive Student CBT Exam View Mockup** replicating student exam experience.
- **Features**:
  - Device View Switcher: Desktop View (wide) vs Mobile View (375px phone screen).
  - Admin Mode Toggle: "Tampilkan Kunci Jawaban & Pembahasan".
  - Student Interface rendering:
    - Badges: Nomor Soal, Subject, Difficulty, Bloom Level.
    - Question Narrative with formatted text & LaTeX preview rendering.
    - Interactive Options (A, B, C, D, E) with student hover/selected states and correct answer highlights when Admin Toggle is ON.
    - Explanation Box: Rich solution breakdown box with tips/key concepts.

### C. Enhanced Stage 3 Toolbar & Table (`/admin/questions/import/page.tsx`)
- **Status Filter**: Filter parsed items by `ALL`, `VALID`, `WARNING`, `ERROR`.
- **Row Actions**:
  - 👁️ **Pratinjau**: Opens `QuestionPreviewDialog`.
  - ✏️ **Edit**: Opens `QuestionEditDialog`.
  - 🗑️ **Hapus**: Removes item from batch draf.
- **Header Actions**:
  - ➕ **Tambah Soal Draf**: Manually append a blank question item to parsed list.

---

## 3. Data Flow & State Management

1. `parsedItems` state stores array of `ParsedQuestionItem[]`.
2. Editing an item updates `parsedItems` by `item.id`.
3. Auto-validation recalculates `validation_status` (`VALID`, `WARNING`, `ERROR`) and `validation_messages`.
4. Batch commit sends updated `parsedItems` array to `questionImportService.commitImport()`.

---

## 4. Verification Plan
- Verify compilation with `npm run build`.
- Validate zero TypeScript errors across Next.js 16 App Router.
