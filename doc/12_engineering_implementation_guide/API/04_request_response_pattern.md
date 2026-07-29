# Request Response Pattern

**Document** : `api/04_request_response_pattern.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan pola **Request** dan **Response** yang digunakan oleh seluruh REST API pada YakinLulus.id.

Tujuan utama:

- Konsistensi seluruh endpoint
- Memudahkan frontend dan mobile
- Mengurangi parsing logic
- Mendukung observability
- Mempermudah API documentation
- Mendukung backward compatibility

Seluruh endpoint wajib mengikuti pola yang dijelaskan pada dokumen ini.

---

# 2. Design Principles

Response API harus memenuhi prinsip berikut:

- Predictable
- Consistent
- Self-descriptive
- Version Friendly
- Easy to Parse
- Easy to Extend
- Machine Readable
- Human Readable

Frontend tidak boleh membuat parser berbeda untuk setiap endpoint.

---

# 3. High Level Architecture

```text
React / Flutter

        │

HTTP Request

        │

────────▼────────

HTTP Handler

        │

DTO Validation

        │

Application Layer

        │

Response Builder

        │

────────▼────────

JSON Response
```

Seluruh response dibangun menggunakan satu **Response Builder** agar format selalu konsisten.

---

# 4. Standard Request

Body request menggunakan JSON.

Contoh:

```json
{
  "title": "Persamaan Linear",
  "difficulty": "medium",
  "subjectId": "sub_01",
  "chapterId": "chap_01"
}
```

Gunakan:

- camelCase
- UTF-8
- ISO-8601 Date
- UUID sebagai identifier

---

# 5. Standard Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "req_01HX123ABC",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

Keterangan:

| Field | Keterangan |
|--------|------------|
| success | Status operasi |
| data | Payload utama |
| meta | Metadata tambahan |
| requestId | ID request |
| timestamp | Waktu response |

---

# 6. Resource Response

Contoh:

```json
{
  "success": true,
  "data": {
    "id": "qst_001",
    "title": "Persamaan Linear",
    "difficulty": "medium",
    "status": "published"
  },
  "requestId": "req_123",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 7. Collection Response

Response list menggunakan struktur berikut.

```json
{
  "success": true,
  "data": [
    {
      "id": "q1",
      "title": "Soal 1"
    },
    {
      "id": "q2",
      "title": "Soal 2"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 250,
    "totalPages": 13
  },
  "requestId": "req_001",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 8. Empty Response

Jika tidak ada data.

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  },
  "requestId": "req_001"
}
```

Tidak menggunakan `null` untuk collection.

---

# 9. Create Response

```http
201 Created
```

```json
{
  "success": true,
  "data": {
    "id": "exam_001"
  },
  "requestId": "req_001"
}
```

---

# 10. Update Response

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "id": "exam_001",
    "updated": true
  }
}
```

---

# 11. Delete Response

Gunakan:

```http
204 No Content
```

Tanpa response body.

Jika business process memerlukan konfirmasi tambahan, gunakan:

```http
200 OK
```

dengan payload yang sesuai.

---

# 12. Error Response

Format standar:

```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  },
  "requestId": "req_001",
  "timestamp": "2026-07-26T10:00:00Z"
}
```

---

# 13. Validation Error Response

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
  },
  "requestId": "req_001"
}
```

Frontend dapat langsung mengikat pesan ke setiap field.

---

# 14. Business Error Response

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "EXAM_ALREADY_STARTED",
    "message": "Exam session already started"
  },
  "requestId": "req_001"
}
```

Business error berbeda dengan validation error.

---

# 15. Authentication Error

```http
401 Unauthorized
```

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

# 16. Authorization Error

```http
403 Forbidden
```

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

---

# 17. Pagination Object

Standar:

```json
{
  "page": 1,
  "pageSize": 20,
  "totalItems": 250,
  "totalPages": 13,
  "hasNext": true,
  "hasPrevious": false
}
```

Field tambahan:

- hasNext
- hasPrevious

memudahkan implementasi frontend.

---

# 18. Meta Object

Digunakan untuk informasi tambahan.

Contoh:

```json
{
  "meta": {
    "executionTimeMs": 85,
    "apiVersion": "v1"
  }
}
```

Meta tidak boleh berisi business data.

---

# 19. Request Header Pattern

```http
Authorization: Bearer <token>

Content-Type: application/json

Accept: application/json

Accept-Language: id-ID

X-Request-ID: req_xxx
```

Opsional:

```http
Idempotency-Key
```

---

# 20. Response Header Pattern

```http
Content-Type: application/json

X-Request-ID

X-API-Version

X-Response-Time
```

---

# 21. File Upload Request

Gunakan:

```http
multipart/form-data
```

Response:

```json
{
  "success": true,
  "data": {
    "fileId": "file_001",
    "url": "https://storage.yakinlulus.id/..."
  }
}
```

---

# 22. Background Job Response

Operasi asynchronous mengembalikan:

```http
202 Accepted
```

```json
{
  "success": true,
  "data": {
    "jobId": "job_001",
    "status": "queued"
  }
}
```

Client dapat melakukan polling atau menggunakan WebSocket untuk mengetahui progres.

---

# 23. CBT Response Pattern

Endpoint CBT Runtime harus ringan.

Contoh:

```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "questionId": "...",
    "remainingTime": 5234,
    "question": {}
  }
}
```

Response hanya mengirim data yang diperlukan agar latency tetap rendah.

---

# 24. AI Response Pattern

Contoh:

```json
{
  "success": true,
  "data": {
    "status": "processing",
    "jobId": "ai_job_001"
  }
}
```

Proses AI tidak menunggu hingga selesai pada HTTP request.

---

# 25. Response Builder

Semua handler menggunakan Response Builder.

```text
HTTP Handler

↓

Response Builder

↓

JSON Response
```

Keuntungan:

- Konsisten
- Mudah diuji
- Mudah diubah
- Mengurangi duplikasi kode

---

# 26. Serialization Rules

Gunakan:

- camelCase
- UTF-8
- ISO-8601
- UUID
- JSON Number sesuai tipe data

Jangan mengirim:

- internal database ID
- stack trace
- SQL query
- internal error

---

# 27. Anti-Patterns

### Response Berbeda Setiap Endpoint

```json
{
 "status":"ok"
}
```

Endpoint lain:

```json
{
 "result":"success"
}
```

❌

---

### Null Collection

```json
{
 "data": null
}
```

❌

Gunakan array kosong.

---

### HTTP 200 Untuk Semua Error

```http
200 OK
```

❌

Gunakan HTTP status yang sesuai.

---

### Business Data Dalam Meta

```json
{
 "meta":{
   "score":100
 }
}
```

❌

Business data harus berada di `data`.

---

### Internal Error Bocor

```json
{
 "stack":"..."
}
```

❌

---

# 28. Scalability Consideration

Pola request dan response ini mendukung:

- Web Application
- Mobile Application
- AI Service
- API Gateway
- Microservices
- GraphQL Gateway
- SDK Generation

Karena seluruh endpoint menggunakan kontrak yang seragam.

---

# 29. Future Evolution

Ke depan pola ini siap mendukung:

- Streaming Response
- GraphQL
- Server-Sent Events
- WebSocket Event Payload
- Public API
- Multi-Tenant API
- AI Function Calling

Tanpa mengubah struktur dasar response.

---

# Summary

YakinLulus.id menggunakan **Response Builder Pattern** dengan struktur request dan response yang seragam di seluruh API.

Karakteristik utama:

- Format JSON yang konsisten.
- Success dan error memiliki struktur baku.
- Pagination, metadata, dan validation menggunakan objek standar.
- Operasi asynchronous mengembalikan `202 Accepted`.
- Seluruh response menyertakan Request ID dan Timestamp.
- Siap mendukung observability, OpenAPI, dan evolusi menuju arsitektur enterprise.

Dokumen berikutnya akan membahas **Error Response Standard**, termasuk katalog error code, klasifikasi error, dan strategi penanganan kesalahan secara menyeluruh.