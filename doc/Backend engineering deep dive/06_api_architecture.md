# 06_api_architecture.md

# YakinLulus.id API Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar arsitektur API Backend YakinLulus.id.

API merupakan kontrak resmi komunikasi antara:

* Web Frontend
* Mobile Application
* Admin Panel
* AI Service
* Future Third Party Integration

Seluruh komunikasi dilakukan melalui REST API menggunakan HTTPS dan JSON.

---

# 2. API Design Goals

API dirancang agar memiliki karakteristik berikut:

* RESTful
* Stateless
* Secure
* Versioned
* Consistent
* Predictable
* Backward Compatible
* Well Documented
* High Performance
* Easy to Consume

---

# 3. API Technology Stack

| Component      | Technology              |
| -------------- | ----------------------- |
| Framework      | Gin                     |
| Protocol       | HTTPS                   |
| Format         | JSON                    |
| Documentation  | OpenAPI 3.1             |
| Authentication | JWT Access Token        |
| Authorization  | RBAC                    |
| Validation     | go-playground/validator |
| Compression    | Gzip                    |
| API Versioning | URI Versioning          |

---

# 4. High Level API Architecture

```text
                Client

       Web / Mobile / Admin

                │

             HTTPS

                │

          Load Balancer

                │

          Gin HTTP Server

                │

        Global Middleware

                │

    Authentication Middleware

                │

    Authorization Middleware

                │

      Validation Middleware

                │

             Controller

                │

             Service

                │

          Repository

                │

    Supabase PostgreSQL
```

---

# 5. API Base URL

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

# 6. API Versioning Strategy

Menggunakan URI Versioning.

Contoh:

```text
/api/v1/users

/api/v1/questions

/api/v1/exams
```

Versi baru:

```text
/api/v2/users
```

Prinsip:

* Breaking changes → versi baru.
* Non-breaking changes → tetap pada versi yang sama.
* Endpoint lama dipertahankan selama masa deprecation yang telah ditentukan.

---

# 7. Resource Naming Convention

Gunakan bentuk jamak (plural).

Contoh:

```text
/users

/questions

/exams

/materials

/rankings
```

Hindari:

```text
/getUser

/createQuestion

/updateExam
```

Gunakan HTTP Method.

---

# 8. HTTP Method Standard

| Method | Purpose              |
| ------ | -------------------- |
| GET    | Read                 |
| POST   | Create               |
| PUT    | Replace              |
| PATCH  | Partial Update       |
| DELETE | Soft Delete / Delete |

Contoh:

```text
GET /users

POST /users

GET /users/{id}

PATCH /users/{id}

DELETE /users/{id}
```

---

# 9. URI Design

Gunakan resource hierarchy.

Contoh:

```text
/users/{id}

/subjects/{id}

/chapters/{id}

/materials/{id}

/questions/{id}

/question-banks/{id}

/exams/{id}

/exam-sessions/{id}

/submissions/{id}
```

Nested resource bila memiliki hubungan langsung.

```text
/exams/{id}/questions

/subjects/{id}/chapters

/questions/{id}/explanations
```

---

# 10. API Module Grouping

```text
/api/v1

/auth

/users

/academic

/schools

/subjects

/chapters

/materials

/questions

/question-banks

/question-generator

/exams

/cbt

/submissions

/analytics

/rankings

/gamification

/media

/notifications

/reports

/configurations

/system
```

---

# 11. Authentication

Public Endpoint

```text
POST /auth/login

POST /auth/refresh

POST /auth/logout
```

Protected Endpoint

```text
Authorization:

Bearer <access_token>
```

Semua endpoint selain autentikasi memerlukan access token, kecuali endpoint yang secara eksplisit ditandai sebagai public.

---

# 12. Authorization

Authorization dilakukan menggunakan RBAC.

Contoh:

```text
Student

Teacher

Staff

Admin

Super Admin
```

Setiap endpoint mendefinisikan role yang diizinkan.

---

# 13. Standard Request Headers

```http
Authorization: Bearer xxxxx

Content-Type: application/json

Accept: application/json

X-Request-ID: uuid

X-Client-Version: 1.0.0

X-Platform: web
```

`X-Request-ID` dapat dibuat oleh client atau gateway. Jika tidak tersedia, backend akan membuatnya dan mengembalikannya pada response.

---

# 14. Standard Response Format

Semua endpoint menggunakan format berikut.

Success

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

Error

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found"
  }
}
```

---

# 15. Pagination Standard

Request

```text
GET /questions?page=1&limit=20
```

Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "total_pages": 13,
    "has_next": true,
    "has_previous": false
  }
}
```

Default:

* page = 1
* limit = 20

Maximum limit ditentukan oleh konfigurasi backend untuk mencegah query berlebihan.

---

# 16. Filtering Standard

Contoh

```text
/questions?

subject_id=

grade_id=

difficulty=

status=

keyword=
```

Filtering hanya menggunakan query parameter.

---

# 17. Sorting Standard

```text
?sort=created_at

?order=asc
```

Multiple sorting:

```text
?sort=grade,name
```

Kolom yang dapat digunakan untuk sorting harus di-whitelist pada setiap endpoint.

---

# 18. Searching Standard

Keyword

```text
?search=matematika
```

Full Text Search

```text
?search=persamaan linear
```

Implementasi menggunakan PostgreSQL Full Text Search pada fase awal.

---

# 19. Field Selection (Future)

Untuk mengurangi payload.

```text
?fields=id,name,email
```

Fitur ini akan diterapkan jika terdapat kebutuhan optimasi bandwidth atau integrasi publik.

---

# 20. HTTP Status Code

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 503  | Service Unavailable   |

---

# 21. Error Code Convention

Contoh:

```text
AUTH_INVALID_TOKEN

AUTH_SESSION_EXPIRED

USER_NOT_FOUND

QUESTION_NOT_FOUND

QUESTION_ALREADY_EXISTS

EXAM_FINISHED

EXAM_NOT_STARTED

SUBMISSION_LOCKED

AI_SERVICE_UNAVAILABLE
```

Error code bersifat stabil dan menjadi kontrak dengan frontend.

---

# 22. File Upload API

Upload dilakukan menggunakan multipart.

```text
POST

/media/upload
```

Response

```json
{
  "url": "...",
  "path": "...",
  "mime_type": "...",
  "size": 12000
}
```

File disimpan pada Supabase Storage.

---

# 23. Download API

Contoh:

```text
GET

/materials/{id}/download

/reports/{id}/download
```

Backend melakukan otorisasi sebelum menghasilkan URL unduhan atau melakukan streaming file.

---

# 24. Batch Operation

Contoh:

```text
POST

/questions/bulk-import

/questions/bulk-delete

/questions/bulk-update
```

Operasi besar dijalankan secara asynchronous menggunakan queue.

---

# 25. Long Running Operation

Contoh:

* AI Generation
* Import Excel
* Export Excel
* Export PDF

Response

```json
{
    "job_id":"...",
    "status":"queued"
}
```

Progress dapat dipantau melalui endpoint job.

```text
GET

/jobs/{id}
```

---

# 26. Idempotency

Endpoint berikut wajib idempotent.

* Finish CBT
* Submit Exam
* Refresh Token
* Queue Callback

Untuk operasi create tertentu yang berisiko menerima request ganda (misalnya callback atau retry), backend dapat mendukung header:

```http
Idempotency-Key: <uuid>
```

---

# 27. API Rate Limiting

Default:

Public

```text
60 request/minute/IP
```

Authenticated

```text
600 request/minute/user
```

Limit dapat berbeda untuk endpoint tertentu, misalnya login atau AI generation.

---

# 28. API Security

Semua endpoint:

* HTTPS Only
* JWT Authentication
* RBAC Authorization
* Input Validation
* Output Sanitization
* CORS Policy
* Rate Limiting
* Security Headers

---

# 29. API Documentation

Semua endpoint harus memiliki:

* Summary
* Description
* Request
* Response
* Error
* Authorization
* Example

Menggunakan OpenAPI 3.1.

---

# 30. API Lifecycle

```text
Client

↓

Request

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Response DTO

↓

JSON

↓

Client
```

---

# 31. API Naming Standard

Gunakan kata kerja hanya bila aksi tidak merepresentasikan resource.

Contoh:

```text
POST

/auth/login

/auth/logout

/auth/refresh

/exams/{id}/publish

/exams/{id}/clone

/exams/{id}/start
```

Selain itu gunakan resource.

---

# 32. API Compatibility

Tidak boleh:

* menghapus field tanpa versi baru
* mengubah tipe data field
* mengubah struktur response secara breaking

Boleh:

* menambah field baru
* menambah endpoint baru
* menambah optional parameter

---

# 33. Observability

Seluruh request menghasilkan:

* Request ID
* Duration
* User ID (jika tersedia)
* Status Code
* Endpoint
* Method
* Error Code

Data tersebut menjadi dasar monitoring dan troubleshooting.

---

# 34. API Gateway Readiness

Meskipun saat ini menggunakan Modular Monolith, desain API harus siap ditempatkan di belakang API Gateway pada masa depan.

Gateway nantinya dapat menangani:

* Authentication
* Rate Limiting
* API Key (Future)
* Request Logging
* Compression
* Routing
* WAF Integration

Tanpa mengubah kontrak API.

---

# 35. REST Endpoint Summary

```text
/api/v1

/auth

/users

/academic

/schools

/subjects

/chapters

/materials

/questions

/question-banks

/question-generator

/exams

/exam-sessions

/submissions

/analytics

/rankings

/gamification

/media

/notifications

/reports

/configurations

/system

/jobs
```

---

# 36. Summary

API YakinLulus.id dirancang sebagai kontrak komunikasi yang konsisten, aman, dan mudah dikembangkan. Dengan menerapkan RESTful API, URI versioning, response format standar, serta pemisahan yang jelas antara controller, service, dan repository, backend akan:

* Mendukung Web, Mobile, dan Admin Panel dengan kontrak yang sama.
* Memudahkan integrasi AI dan layanan eksternal.
* Meminimalkan breaking changes melalui versioning.
* Menjadi fondasi yang siap berkembang menuju arsitektur terdistribusi tanpa mengubah pengalaman integrasi bagi client.
