# Spec: Advanced Practice & Exam System - YakinLulus.id

Requirements mapping ke arsitektur existing (Unified Content Domain + CBT Engine).

---

## 1. Post-Material Practice (Latihan Pasca-Materi)

**Requirement**: Setelah baca materi, latihan soal hanya berkaitan dengan materi tsb.

**Implementation**:
- `materials` table sudah punya `chapter_id`, `topic_id`, `lo_id` (via `contents` base).
- Buat endpoint: `GET /api/v1/materials/{id}/practice`
- Logic: Query `content_questions` WHERE `chapter_id = material.chapter_id` AND `topic_id = material.topic_id` AND `lo_id = material.lo_id` (filter nullable).
- Gunakan `content_question_pools` dengan `subject_id`, `chapter_ids`, `topic_ids` dari materi.
- Return soal acak (misal 10 soal) via pool sampling.

**API Response**:
```json
{
  "material_id": "uuid",
  "practice_session": {
    "questions": [...],
    "time_limit": 300,
    "source": "POST_MATERIAL"
  }
}
```

---

## 2. Practice by Subject per Grade (Latihan Mapel per Kelas)

**Requirement**: Latihan soal berdasarkan mapel per tingkatan kelas.

**Implementation**:
- Endpoint: `GET /api/v1/practice/by-subject?grade_id={}&subject_id={}`
- Filter: `content_questions` JOIN `contents` ON `grade_id` + `subject_id` + `status = PUBLISHED`.
- Bisa pakai `content_question_pools` preset per (grade, subject) dengan distribusi difficulty.
- Support adaptive: parameter `difficulty=EASY|MEDIUM|HARD|MIXED`.

**Pool Config** (preset di DB):
```sql
INSERT INTO content_question_pools (exam_content_id, subject_id, chapter_ids, difficulty_distribution, questions_per_student)
VALUES (NULL, 'MATH_GRADE_10', '{ch1,ch2}', '{"EASY": 5, "MEDIUM": 10, "HARD": 5}', 20);
```

---

## 3. Multi-Grade Exam (Ujian 3 Kelas per Jenjang)

**Requirement**: Ujian soal diambil dari 3 kelas per jenjang (misal SMA: kelas 10, 11, 12).

**Implementation**:
- `content_exams` + `content_question_pools` dengan `grade_ids` array (baru: tambah kolom `grade_ids UUID[]` di `content_question_pools` atau gunakan `chapter_ids` yang span 3 kelas).
- Lebih clean: Tambah `grade_ids UUID[]` di `content_question_pools`.
- Blueprint: `content_exam_blueprints` definisikan total per difficulty.
- Saat generate soal (`cbt_engine`): Sample dari pool WHERE `grade_id IN (grade10, grade11, grade12)` AND `subject_id = ...`.

**Migration needed**:
```sql
ALTER TABLE content_question_pools ADD COLUMN grade_ids UUID[];
-- Atau gunakan chapter_ids yang sudah mewakili 3 kelas
```

---

## 4. Tag-Based Exam (UTBK/SMPTN/UM)

**Requirement**: Ujian soal dari tag khusus (UTBK, SMPTN, UM, dll).

**Existing**: `question_tag_map` (question_id, tag_id) + `tags` table (name, category).
- Tag category: `SOURCE_TYPE` (UTBK, SMPTN, UM, INTERNAL, AI_GENERATED).

**Implementation**:
- Endpoint: `POST /api/v1/exams/tag-based` body: `{ tag_names: ["UTBK", "SMPTN"], subject_id, total_questions, difficulty_dist }`
- Logic: CTE → questions dengan tag IN (...) → sample per blueprint.
- Bisa buat `content_question_pools` dengan `tag_filters JSONB`:
  ```json
  { "tags": ["UTBK", "SMPTN"], "operator": "OR" }
  ```

---

## 5. Custom Mixed-Subject Exam (Tryout Gabungan)

**Requirement**: 
- Bebas pilih soal dari beberapa mapel.
- Contoh: 60 soal dari 3 mapel → 20 soal/mapel.
- Hasil penilaian otomatis per mapel.

**Implementation**: **Multi-Pool Exam** (fitur baru di `content_exam_blueprints` + `content_question_pools`).

### Data Model Extension

```sql
-- Exam blueprint per subject (sub-blueprint)
CREATE TABLE content_exam_subject_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_content_id UUID REFERENCES contents(id),
    subject_id UUID REFERENCES subjects(id),
    easy_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    hard_count INT DEFAULT 0,
    total_questions INT GENERATED ALWAYS AS (easy_count + medium_count + hard_count) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Question pool per subject dalam satu exam
ALTER TABLE content_question_pools ADD COLUMN exam_content_id UUID REFERENCES contents(id);
-- Sudah ada exam_content_id, tapi perlu multiple pools per exam
-- Solution: Satu exam bisa punya multiple pools (subject_id different)
```

### Flow CBT Engine (Modified)

1. **Create Custom Exam** (Teacher/Admin):
   ```json
   POST /api/v1/exams/custom
   {
     "title": "Tryout Gabungan MIPA",
     "subject_blueprints": [
       {"subject_id": "MATH", "easy": 5, "medium": 10, "hard": 5},  // 20
       {"subject_id": "PHYSICS", "easy": 5, "medium": 10, "hard": 5}, // 20
       {"subject_id": "CHEMISTRY", "easy": 5, "medium": 10, "hard": 5} // 20
     ],
     "duration_minutes": 120
   }
   ```

2. **Generate Session Questions** (`cbt_engine` service):
   - Untuk setiap `subject_blueprint` → query pool → sample soal sesuai distribusi.
   - Insert ke `content_exam_session_questions` dengan `subject_id` context.
   - Total 60 soal, urut acak atau grouped by subject.

3. **Scoring** (`scoring` service):
   - Hitung total score (IRT 3-PL).
   - **Per-subject breakdown**: GROUP BY `subject_id` (via join `contents` → `subjects`).
   - Return:
     ```json
     {
       "total_score": 85.5,
       "ability_estimate": 1.2,
       "per_subject": [
         {"subject": "MATHEMATICS", "score": 28, "max": 40, "ability": 1.1},
         {"subject": "PHYSICS", "score": 30, "max": 40, "ability": 1.3},
         {"subject": "CHEMISTRY", "score": 27, "max": 40, "ability": 1.0}
       ]
     }
     ```

---

## Database Changes Required

| Migration | Changes |
|-----------|---------|
| **025** | `content_question_pools`: add `grade_ids UUID[]`, `tag_filters JSONB`, `exam_content_id` (nullable, for multi-pool) |
| **026** | `content_exam_subject_blueprints` table (sub-blueprint per subject) |
| **027** | `content_exam_session_questions`: add `subject_id UUID` (denormalized for scoring) |

---

## API Endpoints Baru

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/materials/{id}/practice` | Post-material practice |
| GET | `/practice/by-subject` | Practice by grade+subject |
| POST | `/exams/tag-based` | Create exam from tags |
| POST | `/exams/custom` | Create mixed-subject exam |
| GET | `/cbt/session/{id}/questions` | Get session questions (with subject_id) |
| GET | `/scoring/result/{attempt_id}` | Result dengan per-subject breakdown |

---

## Frontend Components

| Component | Route | Props |
|-----------|-------|-------|
| `PostMaterialPractice` | `/student/materials/[id]/practice` | `materialId` |
| `SubjectPracticeHub` | `/student/practice/subject` | `gradeId`, `subjectId` |
| `CustomExamBuilder` | `/teacher/exam/custom` | Multi-subject form |
| `ExamResultPerSubject` | `/student/tryout/[id]/result` | `attemptId` → renders radar per subject |

---

## Priority & Effort

| # | Feature | Effort | Depends On |
|---|---------|--------|------------|
| 1 | Post-Material Practice | S (1-2 days) | Existing pool + material context |
| 2 | Practice by Subject/Grade | S (1 day) | Existing filter API |
| 3 | Tag-Based Exam | M (2-3 days) | Tag filter + pool config |
| 4 | Multi-Grade Exam | M (2 days) | Migration 025 (grade_ids array) |
| 5 | Custom Mixed-Subject Exam | L (1 week) | Migration 025, 026, 027 + CBT engine refactor + Scoring per-subject |

---

## Next Steps

1.  **Review & approve spec** ini.
2.  Buat migration 025, 026, 027.
3.  Update `content_question_pools` logic di `cbt_engine` service.
4.  Tambah `content_exam_subject_blueprints` repository & service.
5.  Modifikasi scoring service untuk per-subject breakdown.
6.  Build frontend components.