# API Standard

**Document** : `api/02_api_standard.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menetapkan standar implementasi API untuk seluruh backend YakinLulus.id agar semua endpoint memiliki perilaku yang konsisten.

Standar ini mencakup:

- URL Convention
- HTTP Method
- Header
- Request
- Response
- Pagination
- Filtering
- Sorting
- Search
- Error Response
- Metadata
- File Upload
- Versioning

Seluruh API wajib mengikuti dokumen ini.

---

# 2. API Base URL

Development

```text
http://localhost:8080/api/v1
```

Staging

```text
https://staging-api.yakinlulus.id/api/v1
```

Production

```text
https://api.yakinlulus.id/api/v1
```

---

# 3. URL Convention

Gunakan:

- lowercase
- plural noun
- kebab-case

Contoh:

```text
/users

/questions

/question-categories

/exam-sessions

/learning-materials
```

Jangan gunakan:

```text
/getQuestion

/createExam

/User

QuestionAPI
```

---

# 4. HTTP Method

| Method | Fungsi |
|----------|--------|
| GET | Mengambil data |
| POST | Membuat data |
| PUT | Replace penuh |
| PATCH | Update sebagian |
| DELETE | Soft delete / delete |

---

# 5. HTTP Status Code

| Status | Arti |
|---------|------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Business Rule Failed |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

# 6. Standard Header

## Request Header

```http
Authorization: Bearer <access_token>

Content-Type: application/json

Accept: application/json

Accept-Language: id-ID

X-Request-ID: req_xxxxxx

Idempotency-Key: uuid (opsional)
```

---

## Response Header

```http
Content-Type: application/json

X-Request-ID

X-Response-Time

X-API-Version
```

---

# 7. Request Format

Contoh:

```json
{
  "title": "Persamaan Linear",
  "difficulty": "medium",
  "subject_id": "sub_xxxxx",
  "chapter_id": "chap_xxxxx"
}
```

Gunakan:

- camelCase untuk JSON field
- UTF-8 encoding
- ISO-8601 untuk tanggal

---

# 8. Success Response

Seluruh endpoint menggunakan struktur berikut:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "req_123456",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 9. List Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 120,
    "totalPages": 6
  },
  "requestId": "req_xxxx",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 10. Error Response

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  },
  "requestId": "req_xxxx",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

Format ini berlaku untuk seluruh endpoint.

---

# 11. Validation Error

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
        "message": "Invalid value"
      }
    ]
  },
  "requestId": "req_xxxx"
}
```

---

# 12. Pagination Standard

Request:

```text
?page=1&pageSize=20
```

Default:

```text
page=1

pageSize=20
```

Maximum:

```text
pageSize=100
```

Jika melebihi batas maksimum, backend mengembalikan maksimum yang diizinkan.

---

# 13. Filtering Standard

Contoh:

```text
?subjectId=sub_001

&gradeId=10

&difficulty=medium

&status=published
```

Gunakan nama field yang sama dengan DTO atau kontrak API.

---

# 14. Search Standard

Gunakan satu parameter:

```text
search=
```

Contoh:

```text
/questions?search=persamaan
```

Search:

- case insensitive
- partial matching
- mendukung Unicode

---

# 15. Sorting Standard

```text
sort=createdAt

order=desc
```

Nilai:

```text
asc

desc
```

Jika field tidak valid:

```text
400 Bad Request
```

---

# 16. Date Format

Seluruh tanggal menggunakan:

```text
ISO-8601 UTC
```

Contoh:

```text
2026-07-26T10:45:12Z
```

Client bertanggung jawab melakukan konversi ke zona waktu lokal.

---

# 17. UUID Standard

Seluruh identifier menggunakan UUID v7 (direkomendasikan) atau UUID v4 jika kompatibilitas diperlukan.

Contoh:

```text
0197d8b5-6fd0-7b14-bdc9-4d9dd1d1d6b1
```

ID numerik auto increment tidak diekspos ke client.

---

# 18. Soft Delete

Resource yang mendukung soft delete:

```text
DELETE /questions/{id}
```

Mengubah status menjadi deleted tanpa menghapus data fisik.

Response:

```http
204 No Content
```

---

# 19. Batch Operation

Contoh:

```text
POST /questions/bulk-import
```

```text
POST /users/bulk-update
```

Response:

```json
{
  "success": true,
  "data": {
    "jobId": "job_001"
  }
}
```

Operasi besar diproses melalui Background Worker.

---

# 20. File Upload

Gunakan:

```http
Content-Type:

multipart/form-data
```

Response:

```json
{
  "success": true,
  "data": {
    "fileId": "file_xxx",
    "url": "...",
    "size": 204800
  }
}
```

Upload besar dilakukan menggunakan mekanisme resumable pada fase berikutnya jika diperlukan.

---

# 21. Idempotency

Endpoint yang berpotensi menerima retry client harus mendukung:

```http
Idempotency-Key:
```

Contoh:

- Submit Payment (future)
- Submit Exam
- Create Exam
- Bulk Import

Server menyimpan hasil request berdasarkan key dalam periode tertentu.

---

# 22. Rate Limit Header

Jika rate limiting aktif:

```http
X-RateLimit-Limit

X-RateLimit-Remaining

X-RateLimit-Reset
```

Saat limit terlampaui:

```http
429 Too Many Requests
```

---

# 23. Compression

Server mendukung:

```http
Accept-Encoding:

gzip

br
```

Response dikompresi secara otomatis untuk payload yang memenuhi ambang batas ukuran.

---

# 24. API Metadata

Seluruh response mengandung metadata minimum:

```text
Request ID

Timestamp

API Version
```

Metadata membantu observability dan troubleshooting.

---

# 25. Content Negotiation

Saat ini:

```http
Accept:

application/json
```

Versi mendatang dapat menambahkan:

- application/pdf
- text/csv

Tanpa mengubah endpoint.

---

# 26. Security Standard

Seluruh endpoint harus:

- HTTPS Only
- JWT Authentication
- RBAC Authorization
- Input Validation
- Parameterized Query
- Rate Limiting
- Request Size Limit
- File Validation
- Audit Logging

---

# 27. Observability

Seluruh request menghasilkan:

- Request ID
- Trace ID
- Span ID
- Duration
- HTTP Status
- User ID (jika tersedia)

Terintegrasi dengan OpenTelemetry.

---

# 28. Performance Standard

Target:

| Endpoint | P95 |
|----------|-----|
| GET | <200 ms |
| POST | <500 ms |
| Search | <500 ms |
| CBT Runtime | <150 ms |

Gunakan:

- Pagination
- Cache
- Optimized SQL
- Connection Pool
- Background Worker

---

# 29. Anti-Patterns

### Response Berbeda-beda

```json
{
 "status":"ok"
}
```

Endpoint lain:

```json
{
 "success":true
}
```

❌

---

### Query String Kompleks

```text
?filter=a,b,c,d,e,f,g...

❌
```

Gunakan parameter yang jelas dan terdokumentasi.

---

### HTTP 200 untuk Error

```http
200 OK

{
 "error":"..."
}
```

❌

Gunakan HTTP Status yang sesuai.

---

### Mengembalikan Stack Trace

```json
{
 "stack":"..."
}
```

❌

---

### Mengekspos Internal ID

```json
{
 "id":12
}
```

❌

Gunakan UUID.

---

# 30. Future Evolution

Standar API ini telah dipersiapkan untuk mendukung:

- API Gateway
- GraphQL
- gRPC Internal Service
- Public API
- Multi-tenant API
- Webhook
- Server-Sent Events
- API Monetization

Seluruh evolusi tersebut tetap mempertahankan kontrak dasar request dan response.

---

# Summary

Standar API YakinLulus.id memastikan seluruh endpoint memiliki perilaku yang seragam.

Prinsip utama:

- Struktur request dan response konsisten.
- HTTP status mengikuti standar REST.
- Header, pagination, filtering, sorting, dan search memiliki format baku.
- UUID digunakan sebagai identifier publik.
- Endpoint mendukung observability melalui Request ID dan Trace ID.
- Siap mendukung pertumbuhan sistem hingga arsitektur enterprise dan microservices.

Dokumen berikutnya akan membahas strategi **API Versioning**, termasuk kebijakan kompatibilitas, deprecation, dan migrasi antar versi.
