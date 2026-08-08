# CBT Module Database Mapping & Alignment Design Spec

**Date**: 2026-08-08  
**Scope**: Backend (`cbt_engine`, `content/repository.go`) & Frontend (`(admin)/exams`, `(siswa)/exams`)

## Executive Summary
This design specification aligns all CBT Exam creation, editing, listing, and student interaction logic directly with the existing PostgreSQL `cbt` and `academic` database tables—without creating any new columns or altering database schemas.

---

## 1. Database Table Mapping Strategy (Zero Schema Changes)

| Logical Exam Attribute | Existing PostgreSQL Table & Column | Mapping Mechanism |
| :--- | :--- | :--- |
| **Category** (`UTBK_SNBT`, `PTS_UAS`, etc.) | `cbt.exam.exam_type` (VARCHAR) | `INSERT INTO cbt.exam (..., exam_type)` receives `req.Category`. `scanExam` reads `m.exam_type` into `e.Exam.Blueprint["category"]`. |
| **Grade / Education Level** | `cbt.exam_grade` + `academic.grade` | `cbt.exam_grade.grade_id` joins `academic.grade g JOIN academic.education_level l ON l.id = g.education_level_id`. `scanExam` maps `g.name` into `e.Exam.Blueprint["grade_level"]`. |
| **Total Questions Count** | `cbt.exam_question_pool` & `cbt.exam_package_question` | `scanExam` computes `COUNT(*)` from `cbt.exam_question_pool` / `cbt.exam_package_question` for exam ID and populates `total_questions`. |
| **Scoring System & Flags** | `cbt.exam_metadata` (`negative_marking`, `duration_minute`, `passing_score`) | Saved and read directly via `cbt.exam_metadata`. `negative_marking = true` maps to `NEGATIVE_MARKING` scoring system; `false` maps to `IRT` or `STANDARD_POINTS`. |

---

## 2. Backend Query & Handler Updates (`backend/internal/content/repository.go`)

1. **`createExamContent` / `CreateExam`**:
   - Save `category` into `cbt.exam.exam_type`.
   - Insert grade junction into `cbt.exam_grade`.
   - Save duration & passing score in `cbt.exam_metadata`.

2. **`updateExamContent` / `UpdateExam`**:
   - Update `cbt.exam.exam_type` when category changes.
   - Refresh `cbt.exam_grade` junction when grade ID changes.
   - Update `cbt.exam_metadata` (`duration_minute`, `passing_score`, `negative_marking`).

3. **`scanExam` & `GetExam` / `ListExams`**:
   - `SELECT m.exam_type, COALESCE(g.name, '12 SMA / UTBK'), COALESCE(pq_cnt.cnt, 0), md.negative_marking...`
   - Populate `e.Exam.Blueprint` map directly from database columns.

---

## 3. Frontend Routing Fix (`frontend/src/app/(siswa)/exams/page.tsx`)

- Change Link URL on student exam cards:
  - **Old (Broken 404)**: `<Link href={`/cbt/${exam.id}/start`}>`
  - **New (Working)**: `<Link href={`/exams/${exam.id}`}>` (Opens Exam Detail page, leading to `/exams/${exam.id}/cbt`).

---

## 4. Verification Plan

1. Recompile backend Go binaries and run `qa_validator.exe` to verify 46/46 API tests pass.
2. Verify Next.js production build (`npm run build`) compiles with 0 errors.
3. Test creating/editing an exam with custom Category (`PTS_UAS`), Grade (`11 SMA`), Total Questions (`23 Soal`), and Scoring System (`STANDARD_POINTS`). Confirm all attributes persist in PostgreSQL database and display accurately in Admin Table & Student View.
