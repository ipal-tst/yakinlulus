# Technical Specification: Question Duplicate Detection System

**Date**: 2026-08-08  
**Module**: Question Bank Management & Excel Import (`backend/internal/question_bank`, `frontend/src/services/question-excel-parser.ts`, `frontend/src/app/(admin)/admin/questions`)

---

## 1. Executive Summary

This document specifies the design for the **Question Duplicate Detection System** in YakinLulus.id. The feature prevents duplicate question entries during both **Excel Batch Import** (`/admin/questions/import`) and **Manual Question Creation/Editing** (`QuestionEditModal`).

---

## 2. Duplicate Criterion & Normalization Logic

A question is defined as **Identical / Duplicate** if it belongs to the same `subject_id` and has matching normalized text for both **Question Content** and **Option Texts (A-E)**.

### Normalization Algorithm
1. Convert text to lowercase.
2. Strip HTML tags, markdown formatting, and LaTeX delimiter wrappers (`\(...\)`, `\[...\]`).
3. Replace multiple spaces, newlines, and tabs with a single space.
4. Concatenate normalized string:
   `normalized_content + "|" + optA + "|" + optB + "|" + optC + "|" + optD + "|" + optE`
5. Generate SHA-256 hash (64 hex characters) -> `content_hash`.

---

## 3. Backend Architecture Changes (`backend/internal/question_bank`)

### 3.1 Database Index & Column
- Add `content_hash VARCHAR(64)` column to `question.question` table.
- Create B-tree index on `(subject_id, content_hash)`.

### 3.2 Duplicate Checking API Endpoint
- **Endpoint**: `POST /api/v1/questions/check-duplicates`
- **Request Body**:
  ```json
  {
    "subject_id": "uuid",
    "items": [
      {
        "id": "client-row-id-1",
        "content": "Perhatikan gambar segitiga...",
        "options": [
          { "label": "A", "content": "10 cm" },
          { "label": "B", "content": "15 cm" }
        ]
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "results": [
      {
        "id": "client-row-id-1",
        "is_duplicate": true,
        "existing_question_id": "uuid-existing",
        "existing_question_code": "QS-00125",
        "duplicate_type": "DATABASE"
      }
    ]
  }
  ```

---

## 4. Frontend Architecture Changes (`frontend`)

### 4.1 Excel Import Page (`/admin/questions/import`)
- After Excel file parsing, run two-pass duplicate detection:
  1. **Internal File Duplicates**: Compare `content_hash` across all rows in the uploaded Excel file. Mark matches as `"DUPLIKAT (FILE)"`.
  2. **Database Duplicates**: Send batch payload to `POST /api/v1/questions/check-duplicates`. Mark matches as `"DUPLIKAT (DATABASE)"`.
- **Preview Table Actions**:
  - Badge tag: `DUPLIKAT (DATABASE)` / `DUPLIKAT (FILE)` in red/amber.
  - Action selector per row or batch header:
    - `SKIP` (Default): Exclude row from import payload.
    - `UPDATE`: Overwrite existing question in DB with new data.
    - `FORCE_IMPORT`: Save as new question version.

### 4.2 Manual Question Edit/Create (`QuestionEditModal`)
- Perform debounced hash calculation while typing.
- Query duplicate API endpoint.
- Display alert banner if duplicate exists with link to view `#QS-xxxx`.

---

## 5. Verification Plan

1. **Unit Testing**: Test normalization function on strings with whitespace, casing, and HTML variants.
2. **Database Hash Benchmark**: Verify index lookup speed (< 5ms for 10,000 questions).
3. **Excel Import E2E Test**: Upload `soal matematika SMA.xlsx` twice. The second upload must flag rows 25, 26, 27 as `DUPLIKAT (DATABASE)`.
