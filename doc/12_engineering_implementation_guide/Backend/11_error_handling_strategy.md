# Error Handling Strategy

**Document** : `backend/11_error_handling_strategy.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar **Error Handling Strategy** pada backend YakinLulus.id.

Tujuan utama implementasi error handling adalah:

- Konsisten
- Mudah dipahami
- Aman
- Mudah ditelusuri (traceable)
- Mudah diuji
- Tidak membocorkan informasi sensitif
- Mendukung observability

Seluruh komponen backend wajib mengikuti standar pada dokumen ini.

---

# 2. Filosofi Error Handling

Error bukan sekadar kegagalan, tetapi bagian dari alur bisnis yang harus dikelola dengan baik.

Prinsip utama:

- Fail Fast
- Explicit Error
- Recoverable jika memungkinkan
- Traceable
- Consistent
- User Friendly
- Developer Friendly

---

# 3. Error Flow

```text
Infrastructure

↓

Repository

↓

Application

↓

Interface

↓

Client
```

Setiap layer hanya mengetahui error yang menjadi tanggung jawabnya.

---

# 4. Layer Responsibility

## Domain Layer

Hanya menghasilkan Business Error.

Contoh:

```text
ErrExamClosed

ErrQuestionPublished

ErrStudentInactive

ErrMaximumAttemptReached

ErrPassingGradeInvalid
```

---

## Application Layer

Mengorkestrasi error dari berbagai sumber.

Contoh:

```text
Authorization Error

Validation Error

Repository Error

Transaction Error

External Service Error
```

---

## Infrastructure Layer

Menghasilkan error teknis.

Contoh:

```text
Database Error

Redis Error

Storage Error

SMTP Error

AI API Error

Filesystem Error
```

Infrastructure tidak boleh mengembalikan error mentah ke client.

---

# 5. Error Classification

Seluruh error dibagi menjadi beberapa kategori.

## Validation Error

Input tidak valid.

Contoh:

```text
Email kosong

Password terlalu pendek

UUID tidak valid
```

---

## Business Error

Aturan bisnis dilanggar.

Contoh:

```text
Exam sudah selesai

Question sudah dipublish

Student diblokir
```

---

## Authorization Error

User tidak memiliki izin.

```text
403 Forbidden
```

---

## Authentication Error

Token tidak valid.

```text
401 Unauthorized
```

---

## Not Found Error

Resource tidak ditemukan.

```text
Question

Exam

Student

Material
```

---

## Conflict Error

Terjadi konflik data.

Contoh:

```text
Duplicate Email

Duplicate Question Code

Version Conflict
```

---

## Infrastructure Error

Kesalahan teknis.

Contoh:

```text
Database Down

Redis Down

Storage Error
```

---

## Unexpected Error

Error yang tidak diketahui.

```text
Internal Server Error
```

---

# 6. Error Package

Struktur:

```text
internal/

shared/

errors/

├── code.go
├── error.go
├── validation.go
├── business.go
├── repository.go
├── auth.go
├── infrastructure.go
└── mapper.go
```

---

# 7. Error Code Standard

Gunakan format:

```text
MODULE_ERROR_NAME
```

Contoh:

```text
QUESTION_NOT_FOUND

QUESTION_ALREADY_PUBLISHED

EXAM_CLOSED

EXAM_NOT_STARTED

STUDENT_NOT_ACTIVE

UNAUTHORIZED

FORBIDDEN

VALIDATION_ERROR

DATABASE_ERROR

UNKNOWN_ERROR
```

Error code bersifat stabil dan menjadi kontrak API.

---

# 8. Error Structure

Standar internal:

```text
Code

Message

Category

Cause

Metadata

Stack Trace (internal)

Timestamp

Request ID
```

Contoh:

```text
Code:
QUESTION_NOT_FOUND

Message:
Question does not exist

Category:
Business
```

---

# 9. Error Wrapping

Gunakan wrapping agar akar masalah tetap terlacak.

```text
Database Error

↓

Repository Error

↓

Application Error

↓

API Response
```

Stack trace tetap tersedia pada log internal.

---

# 10. Error Mapping

Mapping dilakukan pada Interface Layer.

| Internal Error | HTTP Status |
|----------------|------------|
| Validation | 400 |
| Authentication | 401 |
| Authorization | 403 |
| Not Found | 404 |
| Conflict | 409 |
| Business Rule | 422 |
| Rate Limited | 429 |
| Infrastructure | 503 |
| Unknown | 500 |

---

# 11. Error Response Format

Seluruh API menggunakan format yang sama.

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  },
  "request_id": "req_xxxxxxxx",
  "timestamp": "2026-07-26T12:00:00Z"
}
```

Stack trace tidak pernah dikirim ke client.

---

# 12. Validation Error Response

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

# 13. Logging Strategy

Seluruh error dicatat menggunakan structured logging.

Informasi minimal:

- Timestamp
- Request ID
- User ID (jika tersedia)
- Module
- Use Case
- Error Code
- Error Category
- Error Message
- Duration
- Stack Trace (internal)

---

# 14. Request ID

Setiap request memiliki Request ID unik.

```text
HTTP Request

↓

Middleware

↓

Request ID

↓

Logger

↓

Response
```

Request ID mempermudah proses troubleshooting lintas layanan.

---

# 15. Stack Trace

Stack trace hanya tersedia untuk:

- Development
- Internal Log
- Error Monitoring

Tidak pernah dikirim ke client.

---

# 16. Panic Recovery

Seluruh panic harus dipulihkan melalui middleware.

Flow:

```text
Panic

↓

Recover

↓

Rollback Transaction

↓

Log Stack Trace

↓

Return HTTP 500
```

Aplikasi tidak boleh berhenti karena panic pada satu request.

---

# 17. Retry Strategy

Retry hanya dilakukan pada error sementara.

Contoh:

- Deadlock
- Timeout
- Connection Reset
- Temporary Network Failure

Tidak dilakukan pada:

- Validation Error
- Business Error
- Duplicate Data
- Unauthorized

---

# 18. External Service Error

Contoh:

```text
AI API

SMTP

Storage

Push Notification
```

Response internal:

```text
AI_SERVICE_UNAVAILABLE
```

Jangan mengekspos detail vendor ke client.

---

# 19. Database Error Mapping

Contoh:

| PostgreSQL Error | Application Error |
|------------------|-------------------|
| no rows | NOT_FOUND |
| unique_violation | DUPLICATE_DATA |
| foreign_key_violation | INVALID_REFERENCE |
| serialization_failure | CONFLICT |
| deadlock_detected | RETRYABLE_ERROR |

---

# 20. Worker Error Handling

Background Worker harus:

- Retry otomatis (jika memungkinkan)
- Menyimpan retry count
- Mencatat error
- Memindahkan job gagal ke Dead Letter Queue (DLQ) jika retry habis

Flow:

```text
Worker

↓

Retry

↓

Retry

↓

DLQ
```

---

# 21. Security Consideration

Jangan pernah mengekspos:

- SQL Query
- Nama tabel
- Connection String
- API Key
- Stack Trace
- File Path
- Internal Service Name

Gunakan pesan yang aman untuk pengguna.

---

# 22. Observability

Integrasikan error dengan:

- OpenTelemetry
- Prometheus
- Grafana
- Sentry (opsional)

Metric yang dipantau:

- Error Rate
- Error by Module
- Error by Use Case
- Panic Count
- Retry Count
- HTTP 5xx
- HTTP 4xx

---

# 23. Testing Strategy

Minimal skenario:

- Validation Error
- Business Error
- Authentication Error
- Authorization Error
- Database Error
- Transaction Error
- Panic Recovery
- Timeout
- External Service Failure

Setiap skenario harus memverifikasi:

- HTTP Status
- Error Code
- Response Body
- Logging
- Rollback (jika diperlukan)

---

# 24. Anti-Patterns

### Mengembalikan Error Database

```text
pq: duplicate key value...

❌
```

---

### Panic Tanpa Recovery

```text
panic()

↓

Application Crash

❌
```

---

### Mengirim Stack Trace ke Client

```json
{
  "stack": "..."
}
```

❌

---

### Menggunakan String Sebagai Error

```go
return errors.New("error")
```

❌

Gunakan error yang terstruktur dan memiliki kode.

---

### Mengabaikan Error

```go
_ = repository.Save(...)
```

❌

Seluruh error harus ditangani atau diteruskan.

---

# 25. Scalability Consideration

Strategi ini mendukung:

- Distributed Tracing
- Multi Service
- Event Driven Architecture
- Background Worker
- Multi Region Deployment

Karena setiap error memiliki kode, kategori, dan Request ID yang konsisten.

---

# 26. Future Evolution

Strategi ini siap dikembangkan dengan:

- Centralized Error Catalog
- AI-assisted Error Analysis
- Automatic Incident Creation
- Distributed Error Correlation
- Error Budget Monitoring
- Service Health Dashboard

---

# Summary

Error Handling pada YakinLulus.id dibangun dengan pendekatan **structured, layered, dan secure**.

Prinsip utama:

- Error diklasifikasikan berdasarkan jenisnya.
- Setiap layer hanya menangani error sesuai tanggung jawabnya.
- Error memiliki kode yang stabil.
- Mapping ke HTTP dilakukan di Interface Layer.
- Stack trace hanya tersedia secara internal.
- Panic selalu dipulihkan.
- Logging dan observability menjadi bagian dari setiap error.

Dengan pendekatan ini, backend menjadi lebih mudah dipelihara, aman, dan siap beroperasi pada lingkungan production berskala enterprise.