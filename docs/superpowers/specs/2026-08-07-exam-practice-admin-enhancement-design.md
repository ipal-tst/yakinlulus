# Design Specification: Admin Exam Management Practice Integration

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target Files:**  
- `frontend/src/app/(admin)/admin/exams/create/page.tsx`
- `frontend/src/app/(admin)/admin/exams/page.tsx`
- `frontend/src/types/index.ts` (Exam interface optional attributes)

---

## 1. Objective

Enhance the Admin Exam Management module (`/admin/exams` & `/admin/exams/create`) to seamlessly create and manage practice packages that feed directly into the student practice hub (`/practice`). This includes selecting target subjects, chapters/topics, difficulty levels, and default practice modes.

---

## 2. Technical Scope & Requirements

### 2.1 Exam Model Enhancements (`Exam` interface)
- `subject_id?: string;`
- `subject_name?: string;`
- `chapter_id?: string;`
- `topic_id?: string;`
- `difficulty?: "EASY" | "MEDIUM" | "HARD" | "HOTS";`
- `default_mode?: "SANTAI" | "SIMULASI";`

### 2.2 Studio Buat Ujian (`/admin/exams/create/page.tsx`)
- **Step 1 (General Info)**:
  - Add Subject selection dropdown powered by `academicMasterService.getSubjects()`.
  - Add Chapter/Topic selection dropdown dynamically fetched via `academicMasterService.getChapters(subjectId)`.
  - Add Difficulty selection dropdown (`EASY`, `MEDIUM`, `HARD`, `HOTS`).
  - Add Default Practice Mode selector (`Mode Santai` vs `Mode Simulasi Ujian`).

### 2.3 Daftar Ujian Admin (`/admin/exams/page.tsx`)
- Add Category filter options: `UJIAN_MAPEL`, `UJIAN_BAB`, `SPECIAL_DRILL`.
- Display Subject Badge & Difficulty Badge on each exam card.

---

## 3. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` to verify 0 errors.
2. **Data Consistency**: Ensure created exams appear accurately in both admin list (`/admin/exams`) and student practice page (`/practice`).
