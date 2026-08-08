# Full System Database Mapping & Alignment Design Spec

**Date**: 2026-08-08  
**Scope**: All Fullstack Modules (`academic`, `cbt`, `question`, `content`, `practice`, `school`, `user_mgmt`, `analytics`)

## Executive Summary
This design specification establishes **Master Akademik (`academic` schema)** as the single source of truth across all modules in YakinLulus.id. It maps all backend services and frontend components to the existing PostgreSQL database schemas without changing or altering any database tables or columns.

---

## 1. Core Architecture & Master Akademik Foundation

```
                           +----------------------------------------+
                           |   academic (Master Source of Truth)    |
                           |   - education_level (SD, SMP, SMA, UTBK)|
                           |   - grade (10, 11, 12, UTBK)           |
                           |   - subject (Matematika, PU, LBI, etc) |
                           |   - chapter (Bab / Topik Subtes)       |
                           |   - topic (Sub-Topik / LO)             |
                           +-------------------+--------------------+
                                               |
         +--------------------+----------------+--------------------+--------------------+
         |                    |                                     |                    |
         v                    v                                     v                    v
+------------------+ +------------------+                  +------------------+ +------------------+
|   cbt schema     | | question schema  |                  |  content schema  | |  school schema   |
| - exam           | | - question       |                  | - material       | | - target_school  |
| - exam_metadata  | | - q_subject      |                  | - m_version      | | - school         |
| - exam_grade     | | - q_grade        |                  | - m_junction     | | - user_target    |
| - exam_subject   | | - q_chapter      |                  +------------------+ +------------------+
| - exam_pool      | +------------------+
+------------------+
```

---

## 2. Module-by-Module Database Mapping Alignment

### A. CBT Module (`cbt_engine` & `cbt_runtime`)
- **Category (`cbt.exam.exam_type`)**: Persisted as string (`'UTBK_SNBT'`, `'PTS_UAS'`, `'UJIAN_HARIAN'`, `'TRYOUT_NASIONAL'`, `'UM_PTN'`).
- **Grade & Level**: Linked via `cbt.exam_grade` JOIN `academic.grade g JOIN academic.education_level l ON l.id = g.education_level_id`.
- **Subject**: Linked via `cbt.exam_subject` JOIN `academic.subject`.
- **Total Questions Count**: Calculated via `COUNT(*)` from `cbt.exam_question_pool` / `cbt.exam_package_question`.
- **Scoring System**: Derived from `cbt.exam_metadata` (`negative_marking`, `duration_minute`, `passing_score`).

### B. Question Bank Module (`question_bank`)
- **Core Question**: `question.question` (`stem`, `type`, `difficulty`, `points`).
- **Options & Explanations**: `question.question_option` (`option_label`, `option_text`, `is_correct`, `explanation`).
- **Academic Tagging**: Linked to `academic.subject` (`question_subject`), `academic.grade` (`question_grade`), `academic.chapter` (`question_chapter`).

### C. Material & CMS Module (`material` & `cms`)
- **Content Master**: `content.material` (`title`, `summary`, `content_type`).
- **Academic Association**: Linked directly to `academic.subject` (`subject_id`), `academic.grade` (`grade_id`), `academic.chapter` (`chapter_id`).
- **Versioning**: `content.material_version` (`version_number`, `body_text`).

### D. Practice Module (`practice`)
- **Practice Session**: Dynamic assembly of questions from `question.question` filtered by `academic.subject_id` and `academic.chapter_id`.
- **Target Difficulty**: Filtered by `difficulty` (`EASY`, `MEDIUM`, `HARD`, `HOTS`).

### E. School & Target PTN Module (`school` & `target_schools`)
- **Target PTN**: `school.target_school` (`name`, `type`, `passing_grade`, `quota`, `city`).
- **User Target Link**: Connects student target score to target PTN passing grade for IRT progress calculation.

### F. Student CBT Navigation (`(siswa)/exams`)
- **Navigation Fix**: Update exam card action links in `frontend/src/app/(siswa)/exams/page.tsx` from `/cbt/${exam.id}/start` to `/exams/${exam.id}` (which renders `ExamDetailPage` and launches `/exams/${exam.id}/cbt`).

---

## 3. Verification Plan

1. **Backend Integration**: Compile backend Go packages (`go build -o qa_validator.exe ./cmd/qa_validator`).
2. **Automated QA Validation**: Execute `qa_validator.exe` to verify 100% (46/46) endpoint tests pass.
3. **Frontend Compilation**: Run `npm run build` in `frontend/` to confirm zero TypeScript compilation errors across all pages.
4. **End-to-End Test**: Verify creating, editing, listing, and attempting exams as student across all master academic grade levels (SMA, SMP, SD, UTBK).
