# Design Specification: Multi-Type Questions CBT Support & Sample Question Package

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target Files:**
- `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`
- `frontend/src/app/(siswa)/exams/[id]/result/page.tsx`

---

## 1. Objective

Enhance the CBT Exam interface (`/exams/[id]/cbt`) and Exam Result page (`/exams/[id]/result`) to render and evaluate 4 distinct question types:
1. **SINGLE_CHOICE**: Standard Pilihan Ganda (Single answer choice A, B, C, D, E).
2. **MULTIPLE_CHOICE**: Pilihan Ganda Kompleks (Checkbox - student can select multiple correct options).
3. **TRUE_FALSE_MATRIX**: Tabel Pernyataan `| Benar | Salah |` (Matrix rows with True/False buttons).
4. **SUITABILITY_MATRIX**: Tabel Pernyataan `| Sesuai | Tidak Sesuai |` (Matrix rows with Suitable/Not Suitable buttons).

Also build a comprehensive Master Question Package dataset containing all 4 question types.

---

## 2. UI Layout & Component Specifications

### 2.1 Question Type Badge & Instruction Header
- Badges indicating the question type in the right panel header:
  - `Pilihan Ganda (1 Jawaban Benar)`
  - `Pilihan Ganda Kompleks (Pilih Lebih Dari 1 Jawaban)`
  - `Matriks Pernyataan: Benar / Salah`
  - `Matriks Pernyataan: Sesuai / Tidak Sesuai`

### 2.2 Dynamic Right Panel Renderers
- **SINGLE_CHOICE**: Radio option buttons A to E (Current behavior).
- **MULTIPLE_CHOICE**: Checkbox option buttons A to E allowing multiple selections.
- **TRUE_FALSE_MATRIX**:
  - Table view with columns: `Pernyataan`, `[ Benar ]`, `[ Salah ]`.
  - Interactive radio-style buttons per row.
- **SUITABILITY_MATRIX**:
  - Table view with columns: `Pernyataan`, `[ Sesuai ]`, `[ Tidak Sesuai ]`.
  - Interactive radio-style buttons per row.

### 2.3 Result Page Evaluation Support
- Update `/exams/[id]/result/page.tsx` discussion section to correctly display user selections vs key answers for matrix and multi-choice questions.

---

## 3. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **Interactive Testing**: Verify all 4 question types render seamlessly in `/exams/ex-1/cbt` and can be answered without state errors.
