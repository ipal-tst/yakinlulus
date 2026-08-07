# Implementation Plan: Question Import Review, Edit & Real-Time Exam Preview

Enhance `/admin/questions/import` with complete parsed question editing modal, interactive CBT exam preview, item management (delete/add), and auto-validation updates.

---

## Proposed Changes

### Component 1: Question Editor Dialog (`QuestionEditDialog.tsx`)
- **[NEW]** `frontend/src/components/admin/questions/QuestionEditDialog.tsx`
  - Dialog modal for full field editing of parsed question items.
  - Form fields: Question number, Type, Narrative text, Subject, Difficulty, Bloom Taxonomy level, Point weight, Options array (Add/Remove options, select key answer), Explanation text.
  - Auto-revalidation logic upon save.

### Component 2: Student CBT Exam Preview Dialog (`QuestionPreviewDialog.tsx`)
- **[NEW]** `frontend/src/components/admin/questions/QuestionPreviewDialog.tsx`
  - Interactive CBT exam preview simulating student interface.
  - Features: Desktop vs Mobile screen view switcher, Admin toggle for Correct Key & Explanation display, interactive option hover states, formatted math formula display.

### Component 3: Import Page Stage 3 Integration (`page.tsx`)
- **[MODIFY]** `frontend/src/app/(admin)/admin/questions/import/page.tsx`
  - Add status filter tab ("Semua", "Valid", "Warning", "Error").
  - Add "Pratinjau Soal", "Edit Soal", and "Hapus Draf" action buttons to each row in the parsed table.
  - Add "Tambah Soal Baru ke Draf" button to header bar.
  - Connect `QuestionEditDialog` and `QuestionPreviewDialog` states.

---

## Verification Plan

### Automated Verification
- Run `npm run build` in `frontend/` to confirm clean compilation across all 42 routes.
