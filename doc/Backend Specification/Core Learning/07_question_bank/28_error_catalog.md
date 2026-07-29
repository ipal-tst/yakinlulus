Berikutnya adalah **28_error_catalog.md**. Ini adalah dokumen yang sering diabaikan, padahal sangat penting untuk menjaga **konsistensi error handling** di seluruh backend.

Untuk YakinLulus.id, saya menyarankan seluruh modul (Question Bank, CBT Runtime, Material, Analytics, AI, Notification) menggunakan **Global Error Catalog** dengan format yang seragam.

---

````markdown
# 28_error_catalog.md

# Question Bank Error Catalog

Version : 1.0

---

# 1. Overview

Error Catalog mendefinisikan seluruh kode error
yang digunakan oleh Question Bank.

Tujuan.

- Konsistensi API
- Kemudahan debugging
- Error handling yang seragam
- Mendukung monitoring
- Mendukung internationalization

---

# 2. Error Principles

Seluruh error harus.

- Predictable
- Stable
- Machine Readable
- Human Readable
- Versioned

---

# 3. Error Response Format

Seluruh API menggunakan format.

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found",
    "details": [],
    "request_id": "req_xxx",
    "timestamp": "2026-07-26T12:00:00Z"
  }
}
```

---

# 4. HTTP Status Mapping

| HTTP | Category |
|-------|----------|
| 400 | Validation |
| 401 | Authentication |
| 403 | Authorization |
| 404 | Resource |
| 409 | Conflict |
| 422 | Business Rule |
| 429 | Rate Limit |
| 500 | Internal Error |
| 503 | Dependency |

---

# 5. Validation Errors

```
VALIDATION_FAILED

INVALID_UUID

INVALID_STATUS

INVALID_FILE

INVALID_METADATA

INVALID_JSON

REQUIRED_FIELD

INVALID_ENUM

INVALID_RANGE
```

---

# 6. Authentication Errors

```
UNAUTHORIZED

TOKEN_EXPIRED

TOKEN_INVALID

LOGIN_REQUIRED

REFRESH_TOKEN_INVALID
```

---

# 7. Authorization Errors

```
PERMISSION_DENIED

ROLE_REQUIRED

RESOURCE_FORBIDDEN

REVIEW_PERMISSION_DENIED

EXPORT_PERMISSION_DENIED
```

---

# 8. Question Errors

```
QUESTION_NOT_FOUND

QUESTION_ALREADY_EXISTS

QUESTION_ALREADY_PUBLISHED

QUESTION_ALREADY_ARCHIVED

QUESTION_NOT_DRAFT

QUESTION_NOT_REVIEWED

QUESTION_LOCKED

QUESTION_DELETED
```

---

# 9. Review Errors

```
REVIEW_NOT_FOUND

REVIEW_ALREADY_COMPLETED

REVIEW_NOT_ASSIGNED

REVIEW_TIMEOUT

INVALID_REVIEW_STATE
```

---

# 10. Version Errors

```
VERSION_NOT_FOUND

VERSION_CONFLICT

VERSION_ALREADY_CURRENT

ROLLBACK_NOT_ALLOWED
```

---

# 11. Import Errors

```
IMPORT_FAILED

IMPORT_JOB_NOT_FOUND

IMPORT_DUPLICATE

IMPORT_FILE_INVALID

IMPORT_TOO_LARGE

IMPORT_BATCH_FAILED
```

---

# 12. Export Errors

```
EXPORT_FAILED

EXPORT_JOB_NOT_FOUND

EXPORT_EXPIRED

EXPORT_LIMIT_EXCEEDED

EXPORT_CANCELLED
```

---

# 13. AI Errors

```
AI_PROVIDER_UNAVAILABLE

AI_TIMEOUT

AI_RATE_LIMIT

AI_INVALID_RESPONSE

AI_VALIDATION_FAILED

AI_GENERATION_FAILED
```

---

# 14. Storage Errors

```
FILE_NOT_FOUND

FILE_TOO_LARGE

FILE_UPLOAD_FAILED

FILE_DELETE_FAILED

INVALID_MIME

SIGNED_URL_EXPIRED
```

---

# 15. Search Errors

```
SEARCH_FAILED

SEARCH_TIMEOUT

INDEX_NOT_READY

VECTOR_NOT_FOUND
```

---

# 16. Metadata Errors

```
SUBJECT_NOT_FOUND

CHAPTER_NOT_FOUND

TOPIC_NOT_FOUND

INVALID_CURRICULUM

TAG_NOT_FOUND
```

---

# 17. Statistics Errors

```
STATISTICS_NOT_AVAILABLE

USAGE_NOT_FOUND

ANALYTICS_FAILED
```

---

# 18. Background Job Errors

```
JOB_NOT_FOUND

JOB_ALREADY_RUNNING

JOB_TIMEOUT

JOB_CANCELLED

JOB_RETRY_EXCEEDED
```

---

# 19. Cache Errors

```
CACHE_UNAVAILABLE

CACHE_TIMEOUT

CACHE_INVALID
```

---

# 20. Database Errors

```
DATABASE_ERROR

DATABASE_TIMEOUT

DEADLOCK

UNIQUE_CONSTRAINT

FOREIGN_KEY_CONSTRAINT

OPTIMISTIC_LOCK_FAILED
```

---

# 21. Event Errors

```
EVENT_PUBLISH_FAILED

EVENT_NOT_FOUND

OUTBOX_FAILED

CONSUMER_FAILED
```

---

# 22. System Errors

```
INTERNAL_SERVER_ERROR

SERVICE_UNAVAILABLE

CONFIGURATION_ERROR

DEPENDENCY_UNAVAILABLE

UNKNOWN_ERROR
```

---

# 23. Retryable Errors

Retry diperbolehkan.

```
DATABASE_TIMEOUT

CACHE_TIMEOUT

AI_TIMEOUT

EVENT_PUBLISH_FAILED

SERVICE_UNAVAILABLE
```

---

# 24. Non Retryable Errors

Tidak boleh retry.

```
VALIDATION_FAILED

PERMISSION_DENIED

QUESTION_NOT_FOUND

INVALID_UUID

INVALID_STATUS
```

---

# 25. Logging Policy

Error yang dicatat.

- Error Code
- Request ID
- User ID
- Stack Trace (Internal)
- Timestamp

Stack trace tidak dikirim ke client.

---

# 26. Monitoring

Dipantau.

- Error Rate
- Top Error
- Retry Count
- Failed API
- Failed Job
- Failed AI Request

---

# 27. Localization

Message dapat diterjemahkan.

Contoh.

```
QUESTION_NOT_FOUND
```

↓

Indonesia

↓

English

Error Code tetap sama.

---

# 28. Future Roadmap

- RFC 9457 Problem Details
- Error Documentation Portal
- Error Analytics
- Auto Recovery
````

---

# Rekomendasi Arsitektur

Gunakan **typed error** di domain, lalu mapping ke HTTP hanya pada layer API.

```text
Domain
   │
   ▼
Domain Error
   │
   ▼
Application Error
   │
   ▼
API Error Mapper
   │
   ▼
HTTP Response
```

Contoh di Go:

```go
var (
    ErrQuestionNotFound       = errors.New("QUESTION_NOT_FOUND")
    ErrQuestionLocked         = errors.New("QUESTION_LOCKED")
    ErrVersionConflict        = errors.New("VERSION_CONFLICT")
    ErrPermissionDenied       = errors.New("PERMISSION_DENIED")
)
```

Layer API bertanggung jawab mengubah error tersebut menjadi HTTP status dan response JSON yang sesuai.

---

# Penyempurnaan Khusus untuk YakinLulus.id

## 1. Hierarchical Error Code

Gunakan penamaan yang terstruktur agar mudah dikelompokkan.

```text
QB-VAL-001   Validation Failed
QB-VAL-002   Invalid UUID

QB-QST-001   Question Not Found
QB-QST-002   Question Already Published

QB-REV-001   Review Not Found

QB-IMP-001   Import Failed

QB-AI-001    AI Provider Unavailable

QB-DB-001    Database Timeout
```

Dengan pola ini, dashboard monitoring dapat mengelompokkan error berdasarkan domain tanpa harus melakukan parsing string.

---

## 2. Pisahkan Error Domain dan Error Infrastruktur

Contoh:

**Business Error**

* `QUESTION_ALREADY_PUBLISHED`
* `REVIEW_NOT_ASSIGNED`
* `INVALID_REVIEW_STATE`

**Infrastructure Error**

* `DATABASE_TIMEOUT`
* `CACHE_UNAVAILABLE`
* `AI_PROVIDER_UNAVAILABLE`

Pemisahan ini penting karena strategi penanganannya berbeda. Business error umumnya dikembalikan ke pengguna, sedangkan infrastructure error lebih banyak memicu retry, circuit breaker, atau alert operasional.

---

## 3. Sertakan Request ID

Setiap respons error harus mengembalikan `request_id`.

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "QB-QST-001",
    "message": "Question not found",
    "request_id": "req_01JABCDEF123456789"
  }
}
```

Dengan demikian, tim pengembang dapat langsung mencocokkan laporan pengguna dengan audit log, application log, dan tracing system menggunakan satu identifier yang sama.

---

## 4. Konsistensi Antar Modul

Standar Error Catalog ini sebaiknya digunakan oleh seluruh bounded context YakinLulus.id, sehingga frontend hanya perlu mengimplementasikan satu mekanisme penanganan error untuk Question Bank, CBT Runtime, Material, AI, Analytics, Notification, maupun modul lainnya. Ini akan menyederhanakan implementasi client dan meningkatkan konsistensi perilaku sistem secara keseluruhan.
