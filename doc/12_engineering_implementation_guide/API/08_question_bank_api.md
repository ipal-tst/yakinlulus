# Question Bank API

**Document** : `api/08_question_bank_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Question Bank API** pada YakinLulus.id.

Question Bank merupakan core business platform dan menjadi sumber utama soal yang digunakan oleh:

- CBT Engine
- Learning Material
- AI Question Generator
- Analytics
- Tryout
- Exercise
- Future Marketplace

API harus mampu menangani jutaan soal dengan performa tinggi serta mendukung proses authoring, review, publishing, versioning, dan randomization.

---

# 2. Architecture Overview

```text
                Web Admin
              Web Teacher
             AI Generator
                    │
                    ▼
          Question Bank API
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
 Validation    Application     Search
                    │
                    ▼
              Domain Layer
                    │
                    ▼
             PostgreSQL
                    │
                    ▼
         Object Storage (Image)
```

---

# 3. Question Lifecycle

```text
Draft

↓

Review

↓

Approved

↓

Published

↓

Used In Exam

↓

Archived

↓

Deleted (Soft Delete)
```

Seluruh perubahan versi dicatat.

---

# 4. Question Classification

Setiap soal wajib memiliki metadata berikut.

```text
Jenjang

↓

Kelas

↓

Mata Pelajaran

↓

Bab

↓

Sub Bab

↓

Topik

↓

Tingkat Kesulitan

↓

Question Type

↓

Status
```

---

# 5. Supported Question Type

MVP

```text
Single Choice
```

Roadmap

```text
Multiple Choice

True / False

Essay

Matching

Drag & Drop

Fill Blank

Hotspot

Interactive Question
```

---

# 6. Endpoint Overview

| Method | Endpoint | Fungsi |
|----------|----------|--------|
| GET | /questions | List Question |
| POST | /questions | Create Question |
| GET | /questions/{id} | Detail |
| PATCH | /questions/{id} | Update |
| DELETE | /questions/{id} | Soft Delete |
| POST | /questions/import | Import Excel |
| GET | /questions/export | Export |
| POST | /questions/{id}/publish | Publish |
| POST | /questions/{id}/archive | Archive |
| GET | /questions/statistics | Dashboard |

---

# 7. Create Question

```http
POST /api/v1/questions
```

Request

```json
{
  "title": "Persamaan Linear",
  "question": "<p>2x + 5 = 15</p>",
  "options": [
    {
      "label": "A",
      "content": "3"
    },
    {
      "label": "B",
      "content": "5"
    },
    {
      "label": "C",
      "content": "10"
    },
    {
      "label": "D",
      "content": "15"
    }
  ],
  "correctAnswer": "B",
  "difficulty": "medium",
  "gradeId": "grade_10",
  "subjectId": "math",
  "chapterId": "chapter_01"
}
```

Response

```http
201 Created
```

---

# 8. Get Question Detail

```http
GET /api/v1/questions/{id}
```

Response

```json
{
  "success": true,
  "data": {
    "id": "qst_001",
    "status": "published",
    "difficulty": "medium",
    "question": {},
    "explanation": {}
  }
}
```

---

# 9. List Question

```http
GET /api/v1/questions
```

Query Parameter

```text
page

pageSize

search

subjectId

gradeId

chapterId

difficulty

status

createdBy
```

Semua parameter dapat dikombinasikan.

---

# 10. Search Engine

Search mendukung:

- Judul
- Isi soal
- Pembahasan
- Tag
- Topik
- Sumber

Case insensitive.

Future:

- Full Text Search
- Semantic Search
- AI Search

---

# 11. Question Structure

Setiap soal terdiri atas:

```text
Question

↓

Choices

↓

Correct Answer

↓

Explanation

↓

Media

↓

Metadata
```

Semua bagian disimpan secara terpisah untuk memudahkan pengembangan.

---

# 12. Story Question Support

Mendukung satu cerita digunakan oleh beberapa soal.

```text
Story

↓

Question 1

Question 2

Question 3
```

API

```http
POST /api/v1/question-stories

GET /api/v1/question-stories/{id}
```

---

# 13. Multimedia Support

Media yang didukung:

- Image
- SVG
- Audio
- Video
- Formula (LaTeX)
- Table

Media diunggah melalui File Service.

---

# 14. Explanation

Pembahasan mendukung:

- Rich Text
- Image
- Formula
- Video
- External Reference

Future:

- AI Explanation

---

# 15. Publish Question

```http
POST /api/v1/questions/{id}/publish
```

Validasi:

- Minimal satu jawaban benar
- Metadata lengkap
- Pembahasan tersedia (opsional sesuai kebijakan)

---

# 16. Archive Question

```http
POST /api/v1/questions/{id}/archive
```

Soal tidak dapat digunakan pada ujian baru tetapi tetap tersedia untuk histori.

---

# 17. Versioning

Setiap perubahan besar menghasilkan versi baru.

```text
Version 1

↓

Version 2

↓

Version 3
```

Exam yang telah dibuat tetap menggunakan versi soal saat exam dipublikasikan.

---

# 18. Import Excel

```http
POST /api/v1/questions/import
```

Content-Type

```text
multipart/form-data
```

Response

```http
202 Accepted
```

Import diproses melalui Background Worker.

Tahapan:

```text
Upload

↓

Validation

↓

Import

↓

Summary
```

---

# 19. Export

```http
GET /api/v1/questions/export
```

Format:

- Excel
- CSV

Export data besar diproses secara asynchronous.

---

# 20. Statistics

```http
GET /api/v1/questions/statistics
```

Contoh response

```json
{
  "success": true,
  "data": {
    "totalQuestions": 185240,
    "published": 170100,
    "draft": 1210,
    "archived": 13930
  }
}
```

---

# 21. Validation Rules

Minimal validasi:

- Question tidak kosong
- Minimal dua pilihan jawaban
- Tepat satu jawaban benar (MVP)
- Metadata wajib lengkap
- Difficulty valid
- Subject valid
- Chapter valid

---

# 22. Authorization

| Role | Akses |
|------|-------|
| Super Admin | Full Access |
| Admin | Full Access |
| Staff | CRUD sesuai kebijakan |
| Teacher | CRUD soal milik sendiri / sekolah |
| Student | Read melalui CBT & Learning Module |

Student tidak dapat mengakses endpoint administrasi.

---

# 23. Audit Logging

Dicatat:

- Create
- Update
- Publish
- Archive
- Delete
- Import
- Export
- Restore
- Version Change

---

# 24. Security Consideration

API menerapkan:

- JWT Authentication
- RBAC Authorization
- HTML Sanitization
- File Validation
- Virus Scan (future)
- Soft Delete
- Audit Logging
- Rate Limiting

Konten HTML dibersihkan untuk mencegah XSS.

---

# 25. Performance Strategy

Optimasi:

- Pagination
- Cursor Pagination (future)
- Redis Cache untuk metadata
- Full Text Index
- CDN untuk media
- Lazy Loading gambar
- Background Import/Export

Target performa:

- Detail soal < 200 ms
- List soal < 300 ms
- Search < 500 ms

---

# 26. Scalability Consideration

Dirancang untuk mendukung:

- >10 juta soal
- Multi School
- Multi Tenant
- AI Question Generation
- Marketplace Soal
- Distributed Storage
- Horizontal Scaling

Question Bank menjadi shared service untuk seluruh platform.

---

# 27. Future Evolution

Roadmap pengembangan:

- AI Question Generator
- AI Quality Review
- Duplicate Detection
- Semantic Search
- Bloom Taxonomy Classification
- Automatic Difficulty Estimation
- Image OCR Import
- PDF Import
- Collaborative Authoring
- Question Marketplace

---

# Summary

Question Bank API merupakan layanan inti YakinLulus.id yang menyediakan pengelolaan soal secara terstruktur, aman, dan skalabel.

Karakteristik utama:

- Mendukung lifecycle lengkap mulai dari draft hingga archive.
- Metadata lengkap untuk klasifikasi dan randomisasi CBT.
- Mendukung multimedia, story question, dan versioning.
- Import/Export dilakukan secara asynchronous.
- Siap menangani jutaan soal dan menjadi fondasi bagi CBT Engine, Learning Module, serta AI Layer di masa depan.
