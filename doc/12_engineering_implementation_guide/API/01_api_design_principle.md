# API Design Principle

**Document** : `api/01_api_design_principle.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan prinsip dasar perancangan API pada YakinLulus.id.

Seluruh API harus:

- Konsisten
- Mudah dipahami
- Versionable
- Secure
- Performant
- Scalable
- Observable
- Backward Compatible

API merupakan kontrak resmi antara:

- React Web
- Flutter Mobile
- Future Public API
- Internal Worker
- AI Service

---

# 2. API Architecture

Backend menggunakan pendekatan:

```text
REST API

+

JSON

+

OpenAPI 3.1

+

JWT Authentication

+

WebSocket

+

Server Sent Event (Future)
```

REST menjadi interface utama.

Realtime menggunakan WebSocket.

---

# 3. High Level Architecture

```text
                React
                   │
                   │ HTTPS
                   ▼
            API Gateway (Future)
                   │
                   ▼
          HTTP Middleware Layer
                   │
                   ▼
             HTTP Handler
                   │
                   ▼
          Application Layer
                   │
                   ▼
              Domain Layer
                   │
                   ▼
             Repository Layer
                   │
                   ▼
             PostgreSQL
```

---

# 4. API Design Goals

API harus memenuhi karakteristik berikut.

### Simple

Mudah digunakan developer.

---

### Predictable

Endpoint mengikuti pola yang konsisten.

---

### Stateless

Setiap request independen.

---

### Secure

Seluruh endpoint menggunakan autentikasi dan otorisasi.

---

### Discoverable

Dokumentasi OpenAPI selalu tersedia.

---

### Evolvable

Mudah ditambahkan tanpa merusak client lama.

---

# 5. API Style

Menggunakan:

```text
Resource Oriented REST
```

Contoh:

```text
/users

/questions

/materials

/exams

/exam-sessions

/answers

/results

/rankings
```

Endpoint merepresentasikan resource, bukan aksi.

---

# 6. Resource Naming

Gunakan:

- lowercase
- plural noun
- kebab-case

Benar:

```text
/questions

/question-categories

/exam-sessions

/learning-materials
```

Hindari:

```text
/getQuestion

/createExam

/studentResult

QuestionAPI
```

---

# 7. HTTP Method Standard

| Method | Fungsi |
|---------|--------|
| GET | Membaca data |
| POST | Membuat resource |
| PUT | Replace penuh |
| PATCH | Update sebagian |
| DELETE | Soft Delete / Delete |

Contoh:

```text
GET /questions

POST /questions

GET /questions/{id}

PATCH /questions/{id}

DELETE /questions/{id}
```

---

# 8. URI Design

URI menggambarkan resource.

Contoh:

```text
/api/v1/questions

/api/v1/materials

/api/v1/exams

/api/v1/users
```

URI tidak mengandung kata kerja.

---

# 9. Nested Resource

Digunakan jika relasi kuat.

Contoh:

```text
/exams/{id}/questions

/exams/{id}/sessions

/materials/{id}/chapters

/questions/{id}/attachments
```

Batasi kedalaman maksimal dua tingkat.

---

# 10. Query Parameter

Gunakan query parameter untuk:

- filter
- search
- sorting
- pagination

Contoh:

```text
/questions

?page=1

&page_size=20

&difficulty=medium

&subject_id=...

&chapter_id=...

&search=pecahan

&sort=created_at

&order=desc
```

---

# 11. Pagination

Standar:

```text
page

page_size
```

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 1200,
    "total_pages": 60
  }
}
```

Default:

```text
20
```

Maximum:

```text
100
```

---

# 12. Filtering

Gunakan parameter eksplisit.

Contoh:

```text
difficulty=easy

difficulty=medium

difficulty=hard
```

Multiple filter:

```text
?grade=10
&subject=math
&chapter=3
```

---

# 13. Search

Search menggunakan:

```text
search=
```

Contoh:

```text
/questions?search=persamaan
```

Search bersifat case-insensitive.

---

# 14. Sorting

Gunakan:

```text
sort=

order=
```

Contoh:

```text
sort=created_at

order=desc
```

---

# 15. Response Consistency

Seluruh endpoint memiliki format response yang sama.

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "request_id": "req_xxx"
}
```

Error:

```json
{
  "success": false,
  "error": {},
  "request_id": "req_xxx"
}
```

---

# 16. Idempotency

Method:

| Method | Idempotent |
|---------|------------|
| GET | Yes |
| PUT | Yes |
| DELETE | Yes |
| PATCH | Bergantung implementasi |
| POST | Tidak |

Untuk endpoint POST tertentu (misalnya pembayaran atau submit yang kritis), gunakan **Idempotency-Key**.

---

# 17. API Versioning

Gunakan URI Versioning.

```text
/api/v1/

/api/v2/
```

Major version baru hanya dibuat jika terjadi breaking change.

---

# 18. Authentication

Seluruh endpoint private menggunakan:

```text
JWT Access Token
```

Flow:

```text
Login

↓

Access Token

↓

Authorization Header

↓

API
```

---

# 19. Authorization

Menggunakan RBAC.

Role:

- Super Admin
- Admin
- Staff
- Teacher
- Student

Authorization dilakukan pada Application Layer.

---

# 20. Rate Limiting

Rate limit diterapkan berdasarkan:

- IP
- User ID
- Access Token

Contoh:

| Endpoint | Limit |
|----------|------:|
| Login | 10/minute |
| Search | 120/minute |
| Submit Answer | 60/minute |
| Upload File | 20/minute |

---

# 21. API Security

Minimal implementasi:

- HTTPS Only
- JWT Validation
- Input Validation
- Parameterized Query
- CORS Policy
- CSRF Protection (jika menggunakan cookie)
- Rate Limiting
- File Validation

---

# 22. API Observability

Setiap request memiliki:

- Request ID
- Trace ID
- Duration
- Status Code
- User ID
- Endpoint

Integrasi:

- OpenTelemetry
- Prometheus
- Grafana

---

# 23. Performance Principle

Target performa:

| Endpoint | Target |
|----------|--------|
| GET | < 200 ms |
| POST | < 500 ms |
| Search | < 500 ms |
| CBT Runtime | < 150 ms |

Gunakan:

- Pagination
- Cache
- Compression
- Connection Pool
- Optimized Query

---

# 24. API Documentation

Seluruh endpoint wajib memiliki dokumentasi OpenAPI.

Minimal mencakup:

- Summary
- Description
- Request
- Response
- Error
- Authentication
- Example

Dokumentasi dihasilkan dari source code atau spesifikasi yang menjadi single source of truth.

---

# 25. API Lifecycle

```text
Design

↓

Review

↓

Implementation

↓

Testing

↓

Documentation

↓

Release

↓

Monitoring

↓

Deprecation
```

Setiap perubahan API mengikuti siklus ini.

---

# 26. Anti-Patterns

### Verb pada URI

```text
/createQuestion

/getUser

/deleteExam

❌
```

---

### Response Tidak Konsisten

```text
Endpoint A

↓

response berbeda

↓

Endpoint B

❌
```

---

### Mengembalikan Internal Error

```json
{
  "stack": "...",
  "sql": "SELECT ..."
}
```

❌

---

### Tidak Menggunakan Pagination

```text
GET /questions

↓

100.000 rows

❌
```

---

### Breaking Change Tanpa Versioning

```text
v1

↓

ubah response

↓

client rusak

❌
```

---

# 27. Scalability Consideration

Desain API mendukung:

- API Gateway
- CDN
- Read Replica
- CQRS
- Microservice Extraction
- AI Service
- Mobile Client
- Third-party Integration

Dengan kontrak yang stabil, client dapat berkembang secara independen dari backend.

---

# 28. Future Evolution

API dirancang agar siap mendukung:

- GraphQL Gateway
- Public Developer API
- gRPC Internal Service
- Event-driven API
- Webhook
- Server-Sent Events
- API Monetization
- Multi-tenant API

---

# Summary

API YakinLulus.id dibangun menggunakan pendekatan **RESTful Resource-Oriented API** dengan prinsip:

- URI berbasis resource.
- HTTP method sesuai standar.
- Response konsisten.
- JWT Authentication dan RBAC.
- Pagination, filtering, sorting, dan search standar.
- OpenAPI sebagai kontrak resmi.
- Siap dikembangkan menuju API Gateway, microservice, dan integrasi eksternal.

Dokumen selanjutnya akan menetapkan standar format request, response, header, serta konvensi implementasi untuk seluruh endpoint API.
