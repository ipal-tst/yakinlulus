Berikutnya adalah **18_api_summary.md**. Dokumen ini bukan OpenAPI/Swagger yang detail, melainkan **ringkasan kontrak API** untuk seluruh modul Question Bank. Tujuannya agar frontend, mobile, AI service, dan integrasi eksternal memiliki gambaran lengkap mengenai endpoint yang tersedia.

Saya menyarankan desain API mengikuti prinsip:

* RESTful
* Resource-oriented
* Versioned (`/api/v1`)
* Idempotent untuk operasi tertentu
* Mendukung pagination, filtering, sorting
* Konsisten pada response envelope dan error format

---

````markdown
# 18_api_summary.md

# Question Bank API Summary

Version : 1.0

---

# 1. Overview

Question Bank menyediakan REST API sebagai antarmuka utama
bagi:

- Web Frontend
- Mobile App
- Back Office
- AI Service
- CBT Engine
- Background Worker
- External Integration

Semua endpoint berada pada namespace.

```
/api/v1/question-bank
```

---

# 2. API Principles

Semua API mengikuti prinsip.

- RESTful
- Stateless
- JSON
- Versioned
- Idempotent
- Secure
- Auditable

---

# 3. Authentication

Menggunakan.

JWT Access Token

↓

Bearer Authentication

---

# 4. Authorization

RBAC.

Student

Teacher

Staff

Reviewer

Admin

Super Admin

Setiap endpoint memiliki permission masing-masing.

---

# 5. Response Format

Success.

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "message": ""
}
```

Error.

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  }
}
```

---

# 6. Question API

## Create Question

POST

```
/questions
```

---

## Update Draft

PUT

```
/questions/{id}
```

---

## Get Detail

GET

```
/questions/{id}
```

---

## Delete Draft

DELETE

```
/questions/{id}
```

---

## Archive

POST

```
/questions/{id}/archive
```

---

## Restore

POST

```
/questions/{id}/restore
```

---

## Clone

POST

```
/questions/{id}/clone
```

---

# 7. Version API

Current Version.

```
GET

/questions/{id}/versions/current
```

History.

```
GET

/questions/{id}/versions
```

Rollback.

```
POST

/questions/{id}/versions/{version}/rollback
```

Compare.

```
GET

/questions/{id}/versions/compare
```

---

# 8. Publish API

Publish.

```
POST

/questions/{id}/publish
```

Unpublish (jika diizinkan workflow).

```
POST

/questions/{id}/unpublish
```

---

# 9. Review API

Review Queue.

```
GET

/reviews
```

Approve.

```
POST

/reviews/{id}/approve
```

Reject.

```
POST

/reviews/{id}/reject
```

Revision.

```
POST

/reviews/{id}/revision
```

Comment.

```
POST

/reviews/{id}/comment
```

---

# 10. Search API

Keyword.

```
GET

/questions/search
```

Suggestion.

```
GET

/questions/suggestion
```

Autocomplete.

```
GET

/questions/autocomplete
```

Hybrid Search.

```
GET

/questions/hybrid-search
```

Semantic Search.

```
GET

/questions/semantic-search
```

---

# 11. Metadata API

Subject.

```
GET

/metadata/subjects
```

Chapter.

```
GET

/metadata/chapters
```

Difficulty.

```
GET

/metadata/difficulties
```

Bloom.

```
GET

/metadata/bloom
```

Tag.

```
GET

/metadata/tags
```

---

# 12. Import API

Upload.

```
POST

/import/upload
```

Preview.

```
POST

/import/preview
```

Commit.

```
POST

/import/commit
```

Status.

```
GET

/import/jobs/{id}
```

Retry.

```
POST

/import/jobs/{id}/retry
```

---

# 13. Export API

Create.

```
POST

/export
```

Status.

```
GET

/export/jobs/{id}
```

Download.

```
GET

/export/jobs/{id}/download
```

Cancel.

```
POST

/export/jobs/{id}/cancel
```

---

# 14. AI API

Generate Question.

```
POST

/ai/generate
```

Generate Explanation.

```
POST

/ai/explanation
```

Generate Distractor.

```
POST

/ai/distractor
```

Generate Metadata.

```
POST

/ai/metadata
```

Generate Similar Question.

```
POST

/ai/similar
```

---

# 15. Validation API

Validate.

```
POST

/validation
```

Duplicate Detection.

```
POST

/validation/duplicate
```

Metadata Validation.

```
POST

/validation/metadata
```

---

# 16. Statistics API

Usage.

```
GET

/statistics/{id}
```

Exposure.

```
GET

/statistics/exposure
```

Difficulty.

```
GET

/statistics/difficulty
```

Quality.

```
GET

/statistics/quality
```

---

# 17. Attachment API

Upload.

```
POST

/attachments
```

Delete.

```
DELETE

/attachments/{id}
```

Download.

```
GET

/attachments/{id}
```

---

# 18. Pagination

Default.

```
page

size

sort

order
```

Cursor Pagination didukung untuk endpoint tertentu.

---

# 19. Filtering

Contoh.

```
subject

chapter

difficulty

grade

status

source

created_after

created_before
```

---

# 20. Sorting

Didukung.

- Created
- Updated
- Difficulty
- Popularity
- Usage
- Similarity

---

# 21. Idempotency

Endpoint berikut wajib mendukung
Idempotency-Key.

- Publish
- Import Commit
- Export
- AI Generation
- Clone

---

# 22. Rate Limit

Default.

| Endpoint | Limit |
|----------|--------|
| Search | 100 req/min |
| Create | 60 req/min |
| AI | 20 req/min |
| Export | 10 req/min |

Nilai dapat diubah melalui konfigurasi.

---

# 23. API Versioning

Namespace.

```
/api/v1
```

Future.

```
/api/v2
```

Perubahan breaking dilakukan melalui versi baru.

---

# 24. Error Codes

Contoh.

```
QUESTION_NOT_FOUND

QUESTION_ALREADY_PUBLISHED

VALIDATION_FAILED

DUPLICATE_QUESTION

IMPORT_FAILED

EXPORT_FAILED

PERMISSION_DENIED
```

---

# 25. Monitoring

Dipantau.

- Request Count
- Response Time
- Error Rate
- Success Rate
- Rate Limit Hit
- AI Usage

---

# 26. Future Roadmap

- GraphQL API
- gRPC API
- WebSocket Notification
- Bulk API
- Streaming API
- Public API
- SDK Generation
````

---

# Rekomendasi Arsitektur API

Saya menyarankan endpoint dikelompokkan berdasarkan **bounded context**, bukan berdasarkan tabel database.

```text
/api/v1/question-bank/
│
├── questions/
├── versions/
├── reviews/
├── search/
├── metadata/
├── imports/
├── exports/
├── ai/
├── validation/
├── statistics/
└── attachments/
```

## Struktur handler Go yang direkomendasikan

```text
internal/questionbank/api/
│
├── question_handler.go
├── version_handler.go
├── review_handler.go
├── search_handler.go
├── metadata_handler.go
├── import_handler.go
├── export_handler.go
├── ai_handler.go
├── validation_handler.go
├── statistics_handler.go
├── attachment_handler.go
└── middleware/
    ├── auth.go
    ├── permission.go
    ├── idempotency.go
    ├── request_id.go
    └── rate_limit.go
```

### Penyempurnaan untuk YakinLulus.id

Saya juga merekomendasikan standar response yang konsisten untuk seluruh backend:

* **Success Envelope**: `success`, `data`, `meta`, `message`, `request_id`.
* **Error Envelope**: `success`, `error.code`, `error.message`, `error.details`, `request_id`.

`request_id` harus dihasilkan oleh middleware dan dikembalikan pada setiap respons. Dengan begitu, frontend, log aplikasi, audit log, dan sistem observability dapat mengaitkan satu permintaan secara end-to-end, sehingga proses debugging dan analisis insiden menjadi jauh lebih mudah.
