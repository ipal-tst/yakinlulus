# Error Response Standard

**Document** : `api/05_error_response_standard.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar penanganan dan format **Error Response** pada seluruh API YakinLulus.id.

Tujuan utama:

- Konsistensi seluruh API
- Mempermudah frontend menangani error
- Mempermudah debugging
- Mendukung monitoring
- Mendukung audit
- Mendukung observability
- Menghindari kebocoran informasi internal

Semua endpoint wajib menggunakan standar ini.

---

# 2. Error Philosophy

Prinsip dasar:

- Error harus dapat diprediksi.
- Error harus memiliki kode yang stabil.
- Error harus mudah dipahami oleh developer.
- Error tidak boleh membocorkan detail internal.
- Error harus dapat ditelusuri menggunakan Request ID.

---

# 3. Error Flow

```text
HTTP Request

        │

        ▼

HTTP Handler

        │

Validation

        │

Use Case

        │

Repository

        │

Error Mapper

        │

Response Builder

        │

JSON Response
```

Seluruh error diproses melalui **Error Mapper** sehingga format selalu konsisten.

---

# 4. Standard Error Response

Seluruh endpoint mengembalikan format berikut.

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  },
  "requestId": "req_01JXYZABC123",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 5. Error Structure

| Field | Keterangan |
|---------|------------|
| success | Selalu `false` |
| error.code | Kode error stabil |
| error.message | Pesan yang dapat ditampilkan |
| requestId | ID request |
| timestamp | Waktu response |

---

# 6. Error Category

Seluruh error dibagi menjadi:

```text
Validation Error

Business Error

Authentication Error

Authorization Error

Resource Error

Infrastructure Error

System Error
```

---

# 7. Validation Error

HTTP Status

```text
400 Bad Request
```

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "difficulty",
        "message": "Invalid difficulty"
      }
    ]
  }
}
```

---

# 8. Business Error

Business Rule gagal.

HTTP

```text
422 Unprocessable Entity
```

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "EXAM_ALREADY_FINISHED",
    "message": "Exam session has already been completed"
  }
}
```

---

# 9. Authentication Error

```text
401 Unauthorized
```

Contoh kode:

```text
UNAUTHORIZED

TOKEN_EXPIRED

TOKEN_INVALID

TOKEN_MISSING

REFRESH_TOKEN_INVALID
```

---

# 10. Authorization Error

```text
403 Forbidden
```

Contoh:

```text
FORBIDDEN

ROLE_NOT_ALLOWED

PERMISSION_DENIED
```

---

# 11. Resource Error

```text
404 Not Found
```

Contoh:

```text
QUESTION_NOT_FOUND

USER_NOT_FOUND

EXAM_NOT_FOUND

SESSION_NOT_FOUND

FILE_NOT_FOUND
```

---

# 12. Conflict Error

```text
409 Conflict
```

Contoh:

```text
EMAIL_ALREADY_EXISTS

USERNAME_ALREADY_EXISTS

QUESTION_DUPLICATE

EXAM_ALREADY_PUBLISHED
```

---

# 13. Infrastructure Error

Contoh:

```text
DATABASE_ERROR

REDIS_ERROR

STORAGE_ERROR

QUEUE_ERROR

AI_SERVICE_ERROR
```

HTTP:

```text
500

503
```

Pesan yang dikirim ke client harus tetap generik.

---

# 14. Internal Error

```text
500 Internal Server Error
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  },
  "requestId": "req_xxx"
}
```

---

# 15. Error Code Convention

Gunakan:

```text
UPPER_CASE

SNAKE_CASE
```

Contoh:

```text
QUESTION_NOT_FOUND

EMAIL_ALREADY_EXISTS

INVALID_FILE_TYPE

INVALID_EXAM_STATE

QUESTION_POOL_EMPTY
```

Kode error tidak boleh berubah antar minor release.

---

# 16. Domain Error Mapping

Setiap domain memiliki namespace error sendiri.

Contoh:

## User

```text
USER_NOT_FOUND

USER_ALREADY_EXISTS

INVALID_USER_STATUS
```

## Question

```text
QUESTION_NOT_FOUND

QUESTION_ARCHIVED

QUESTION_DUPLICATE
```

## Exam

```text
EXAM_NOT_FOUND

EXAM_CLOSED

EXAM_ALREADY_STARTED
```

## CBT

```text
SESSION_TIMEOUT

SESSION_FINISHED

ANSWER_ALREADY_SUBMITTED
```

---

# 17. Validation Field Error

Gunakan format berikut.

```json
{
  "field": "email",
  "message": "Email format is invalid"
}
```

Field menggunakan nama yang sama dengan DTO request.

---

# 18. Error Mapping Layer

```text
Infrastructure Error

↓

Repository Error

↓

Application Error

↓

Error Mapper

↓

API Error Response
```

Handler tidak melakukan mapping secara manual.

---

# 19. Logging Strategy

Seluruh error dicatat.

Minimal informasi:

- Request ID
- Error Code
- User ID
- Module
- Endpoint
- HTTP Status
- Duration
- Stack Trace (internal)

Stack trace tidak dikirim ke client.

---

# 20. Retryable Error

Contoh:

```text
DATABASE_TIMEOUT

REDIS_TIMEOUT

AI_TIMEOUT

SMTP_TIMEOUT
```

Client dapat melakukan retry sesuai kebijakan endpoint.

---

# 21. Non-Retryable Error

Contoh:

```text
VALIDATION_ERROR

QUESTION_NOT_FOUND

EXAM_ALREADY_STARTED

ROLE_NOT_ALLOWED
```

Retry tidak akan memperbaiki hasil.

---

# 22. Localization

Response selalu mengirim:

```text
Error Code

+

Default Message
```

Frontend dapat menerjemahkan berdasarkan `error.code`.

Contoh:

```text
QUESTION_NOT_FOUND
```

↓

Indonesia:

```text
Soal tidak ditemukan
```

↓

English:

```text
Question not found
```

---

# 23. Error Documentation

Setiap endpoint pada OpenAPI harus mendokumentasikan:

- HTTP Status
- Error Code
- Response Example
- Penyebab
- Solusi yang disarankan

---

# 24. Security Consideration

Jangan pernah mengirim:

- Stack Trace
- SQL Query
- Database Schema
- Password
- JWT
- Internal Path
- File System Path
- Secret Key

Contoh yang salah:

```json
{
  "stack": "...",
  "sql": "SELECT * FROM users"
}
```

❌

---

# 25. Monitoring

Error dikategorikan menjadi:

- 4xx Error Rate
- 5xx Error Rate
- Top Error Code
- Error per Endpoint
- Error per Module
- Error Trend
- Error per Release

Monitoring menggunakan:

- OpenTelemetry
- Prometheus
- Grafana

---

# 26. Error Lifecycle

```text
Error

↓

Logging

↓

Metrics

↓

Alert

↓

Investigation

↓

Fix

↓

Regression Test
```

---

# 27. Anti-Patterns

### HTTP 200 untuk Error

```http
200 OK
```

```json
{
  "success": false
}
```

❌

---

### Menggunakan Pesan Error sebagai Identitas

```text
"User not found"
```

Frontend tidak boleh bergantung pada isi pesan.

Gunakan:

```text
USER_NOT_FOUND
```

---

### Error Code Tidak Konsisten

```text
USER404

USER_NOT_FOUND

USR_NOT_FOUND
```

❌

---

### Mengembalikan Detail Database

```text
duplicate key value violates unique constraint
```

❌

Gunakan:

```text
EMAIL_ALREADY_EXISTS
```

---

### Menggunakan Panic Sebagai Business Error

```go
panic("email exists")
```

❌

Business error harus dikembalikan sebagai error terstruktur.

---

# 28. Scalability Consideration

Standar ini mendukung:

- Web Client
- Mobile Client
- Public API
- AI Service
- Microservice
- API Gateway
- Centralized Logging
- Distributed Tracing

Karena seluruh error menggunakan kontrak yang seragam.

---

# 29. Future Evolution

Strategi ini siap dikembangkan menuju:

- RFC 9457 Problem Details
- Error Catalog Service
- AI-assisted Error Diagnosis
- Multi-language Error Registry
- Distributed Error Correlation
- Global Error Analytics Dashboard

---

# Summary

YakinLulus.id menggunakan **Centralized Error Response Standard** untuk seluruh API.

Karakteristik utama:

- Struktur error konsisten.
- Error Code bersifat stabil.
- HTTP Status mengikuti standar REST.
- Error dipetakan melalui Error Mapper.
- Tidak membocorkan informasi internal.
- Mendukung monitoring, tracing, dan audit.
- Siap berkembang menuju arsitektur enterprise dan microservices.

Dengan standar ini, frontend, mobile, dan layanan lain dapat menangani seluruh kesalahan secara konsisten tanpa bergantung pada implementasi internal backend.