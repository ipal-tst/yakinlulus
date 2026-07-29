# 11_error_handling.md

# YakinLulus.id Error Handling Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar **Error Handling Strategy** pada backend YakinLulus.id.

Error Handling bertujuan untuk:

* Menghasilkan response yang konsisten.
* Memudahkan debugging.
* Mempermudah observability.
* Mengurangi kebocoran informasi sensitif.
* Menjadi kontrak antara Backend dan Frontend.

Seluruh module wajib mengikuti strategi ini.

---

# 2. Design Principles

Error Handling mengikuti prinsip:

* Fail Fast
* Fail Secure
* Explicit Error
* Structured Error
* Consistent Response
* No Sensitive Information
* Traceable
* Observable
* Recoverable (jika memungkinkan)

---

# 3. Error Lifecycle

```text id="3xv18k"
Request

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Error

↓

Error Mapper

↓

HTTP Response

↓

Logging

↓

Metrics

↓

Monitoring
```

Seluruh error harus melewati proses mapping sebelum dikirim ke client.

---

# 4. Error Categories

Error dibagi menjadi beberapa kategori.

| Category               | Description                  |
| ---------------------- | ---------------------------- |
| Validation Error       | Request tidak valid          |
| Authentication Error   | Login atau token gagal       |
| Authorization Error    | Tidak memiliki hak akses     |
| Business Error         | Melanggar aturan bisnis      |
| Resource Error         | Data tidak ditemukan         |
| Infrastructure Error   | Database, Redis, Storage     |
| External Service Error | AI, SMTP, Push Notification  |
| System Error           | Internal application failure |

---

# 5. Error Package Structure

```text id="6qmf7z"
internal/shared/errors/

error.go

code.go

mapper.go

response.go

http.go
```

---

# 6. Standard Error Object

Seluruh error menggunakan struktur berikut.

```go id="o1n9q2"
type AppError struct {
    Code       string
    Message    string
    HTTPStatus int
    Cause      error
    Metadata   map[string]any
}
```

Keterangan:

* **Code** → kode error stabil.
* **Message** → pesan yang aman untuk client.
* **HTTPStatus** → status HTTP.
* **Cause** → error asli untuk logging.
* **Metadata** → informasi tambahan non-sensitif.

---

# 7. Error Response Format

Semua endpoint mengembalikan format berikut.

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "QUESTION_NOT_FOUND",
    "message": "Question not found",
    "request_id": "8fd6d5b4..."
  }
}
```

`request_id` membantu tim support melakukan pelacakan log.

---

# 8. Error Code Convention

Format:

```text id="j76wnf"
MODULE_ERROR_NAME
```

Contoh:

```text id="zk2n66"
AUTH_INVALID_TOKEN

AUTH_SESSION_EXPIRED

AUTH_INVALID_CREDENTIAL

USER_NOT_FOUND

QUESTION_NOT_FOUND

QUESTION_ALREADY_EXISTS

QUESTION_NOT_PUBLISHED

EXAM_ALREADY_FINISHED

EXAM_NOT_STARTED

SUBMISSION_LOCKED

PERMISSION_DENIED

AI_SERVICE_UNAVAILABLE

DATABASE_ERROR
```

Kode error bersifat stabil dan tidak berubah walaupun pesan berubah.

---

# 9. HTTP Status Mapping

| HTTP Status | Digunakan Untuk       |
| ----------- | --------------------- |
| 200         | Success               |
| 201         | Created               |
| 204         | No Content            |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 409         | Conflict              |
| 422         | Validation Error      |
| 429         | Too Many Requests     |
| 500         | Internal Server Error |
| 503         | Service Unavailable   |

---

# 10. Validation Error

Contoh response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "must be a valid email"
      },
      {
        "field": "password",
        "message": "minimum length is 8"
      }
    ]
  }
}
```

Seluruh field yang gagal divalidasi harus dikembalikan dalam satu response.

---

# 11. Authentication Error

Contoh:

```text id="0ap7vt"
AUTH_INVALID_TOKEN

AUTH_SESSION_EXPIRED

AUTH_INVALID_CREDENTIAL

AUTH_ACCOUNT_DISABLED
```

Response tidak boleh membedakan apakah email atau password yang salah.

---

# 12. Authorization Error

Contoh:

```text id="tobokx"
PERMISSION_DENIED
```

Pesan:

```text id="itxyxw"
You are not allowed to perform this action.
```

Tidak mengungkap detail permission internal.

---

# 13. Business Error

Contoh:

```text id="j1hq8q"
QUESTION_NOT_PUBLISHED

EXAM_FINISHED

SUBMISSION_LOCKED

MATERIAL_ARCHIVED
```

Business error berasal dari Service Layer.

---

# 14. Resource Error

Contoh:

```text id="xzj4v0"
USER_NOT_FOUND

QUESTION_NOT_FOUND

EXAM_NOT_FOUND
```

Repository hanya mengembalikan kondisi "not found". Mapping dilakukan pada Service.

---

# 15. Database Error

Contoh:

```text id="wr9d6q"
DATABASE_ERROR

UNIQUE_CONSTRAINT

FOREIGN_KEY_CONSTRAINT
```

Database error tidak boleh langsung dikirim ke client.

Contoh yang **tidak boleh**:

```text id="dwubps"
duplicate key value violates unique constraint ...
```

---

# 16. External Service Error

Contoh:

```text id="sx4zrm"
AI_SERVICE_UNAVAILABLE

EMAIL_SERVICE_UNAVAILABLE

STORAGE_SERVICE_UNAVAILABLE

QUEUE_SERVICE_UNAVAILABLE
```

Client menerima pesan generik yang aman.

---

# 17. System Error

Semua panic atau unexpected error dimapping menjadi:

```text id="38yjtx"
INTERNAL_SERVER_ERROR
```

Client tidak menerima stack trace.

---

# 18. Error Mapping Flow

```text id="iqh8zv"
Database Error

↓

Repository

↓

Service

↓

AppError

↓

Error Middleware

↓

HTTP Response
```

---

# 19. Error Middleware

Seluruh panic ditangani middleware.

Flow:

```text id="yc2d0v"
Panic

↓

Recover

↓

Logger

↓

Request ID

↓

500 Response
```

Aplikasi tidak boleh crash karena panic dari satu request.

---

# 20. Repository Error Rules

Repository hanya boleh menghasilkan:

* Not Found
* Duplicate
* Constraint
* Database Error
* Connection Error

Repository tidak mengetahui HTTP maupun response JSON.

---

# 21. Service Error Rules

Service menghasilkan:

* Business Error
* Authorization Error
* Validation Error
* Resource Error

Service tidak menghasilkan response HTTP.

---

# 22. Controller Error Rules

Controller hanya:

* Memanggil Service.
* Meneruskan error ke Error Middleware atau Error Mapper.
* Tidak melakukan business error mapping manual.

---

# 23. Error Logging

Semua error dicatat.

Minimal:

* Request ID
* User ID
* Endpoint
* HTTP Method
* Error Code
* HTTP Status
* Duration

Untuk level ERROR, sertakan stack trace internal bila tersedia.

---

# 24. Sensitive Information

Tidak boleh dikirim ke client:

* SQL Query
* Database Schema
* Stack Trace
* JWT
* Password
* API Key
* Internal Server Path
* Environment Variable

Informasi tersebut hanya tersedia pada log internal.

---

# 25. Request ID

Setiap request memiliki:

```text id="8s1v1q"
Request ID
```

Contoh:

```text id="b6n6lv"
X-Request-ID
```

Request ID selalu muncul pada log dan response error.

---

# 26. Retryable Error

Beberapa error dapat diulang.

Contoh:

* AI timeout
* SMTP timeout
* Redis timeout
* Queue timeout

Error ini diberi metadata `retryable=true` untuk kebutuhan internal.

---

# 27. Non-Retryable Error

Contoh:

* Validation Error
* Duplicate Email
* Permission Denied
* Exam Finished

Retry tidak akan mengubah hasil.

---

# 28. Error Severity

| Severity | Example          |
| -------- | ---------------- |
| Info     | Business warning |
| Warning  | Validation gagal |
| Error    | Database gagal   |
| Critical | Data corruption  |
| Fatal    | Bootstrap gagal  |

Fatal hanya terjadi saat startup aplikasi.

---

# 29. Error Metrics

Seluruh error dikirim ke monitoring.

Metric:

* Error Count
* Error Rate
* HTTP Status Distribution
* Error Code Distribution
* Panic Count
* Retry Count

---

# 30. Domain Error Package

Setiap domain dapat memiliki error sendiri.

Contoh:

```text id="6k5nxt"
question/errors.go

exam/errors.go

material/errors.go
```

Tetapi seluruhnya harus mengimplementasikan `AppError`.

---

# 31. Error Localization

Pesan untuk client mendukung:

* Bahasa Indonesia
* English

Contoh:

```text id="zvbr2v"
QUESTION_NOT_FOUND
```

Indonesia:

```text id="8q8h34"
Soal tidak ditemukan.
```

English:

```text id="mvjlwm"
Question not found.
```

Localization dilakukan pada tahap response, bukan di business logic.

---

# 32. Panic Handling

Seluruh panic harus di-recover.

Contoh penyebab:

* Nil pointer
* Index out of range
* Unexpected runtime error

Response:

```text id="ck6s4v"
500

INTERNAL_SERVER_ERROR
```

---

# 33. Error Testing

Setiap error wajib diuji.

Minimal:

* Validation Error
* Business Error
* Database Error
* Authorization Error
* Authentication Error
* Panic Recovery

---

# 34. Anti-Patterns

Tidak diperbolehkan:

* Mengembalikan raw database error.
* Mengembalikan stack trace.
* Panic tanpa recover.
* Menggunakan string literal untuk kode error di banyak tempat.
* Menangkap error lalu mengabaikannya (`_ = err` tanpa alasan yang jelas).
* Logging password atau token.

---

# 35. Error Checklist

Sebelum implementasi selesai:

* Menggunakan AppError.
* Memiliki Error Code.
* Memiliki HTTP Mapping.
* Menggunakan Request ID.
* Mendukung Logging.
* Mendukung Monitoring.
* Tidak membocorkan informasi sensitif.
* Memiliki Unit Test.

---

# 36. Integration with Observability

Setiap error terintegrasi dengan:

```text id="r1cxui"
Logger

↓

Metrics

↓

Tracing

↓

Monitoring

↓

Alerting
```

Hal ini memungkinkan investigasi insiden secara menyeluruh.

---

# 37. Error Flow Example

```text id="mpssnh"
POST /api/v1/questions

↓

Controller

↓

Question Service

↓

Repository

↓

Unique Constraint

↓

Duplicate Error

↓

QUESTION_ALREADY_EXISTS

↓

409 Conflict

↓

JSON Response

↓

Structured Log

↓

Metrics
```

---

# 38. Summary

Error Handling YakinLulus.id menggunakan pendekatan **structured error management** dengan `AppError` sebagai standar utama. Seluruh error dipetakan secara konsisten dari Repository hingga HTTP Response, menghasilkan:

* Response API yang seragam.
* Logging dan observability yang lengkap.
* Keamanan karena tidak membocorkan informasi internal.
* Kemudahan debugging menggunakan Request ID.
* Skalabilitas untuk mendukung monitoring, alerting, dan distributed tracing pada lingkungan produksi.
