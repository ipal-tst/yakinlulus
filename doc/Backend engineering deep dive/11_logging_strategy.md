# 11_logging_strategy.md

# YakinLulus.id Logging Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar **Logging Strategy** pada backend YakinLulus.id.

Logging merupakan fondasi utama untuk:

* Monitoring
* Debugging
* Security Audit
* Incident Investigation
* Performance Analysis
* Compliance
* Observability

Seluruh komponen backend wajib menggunakan mekanisme logging yang seragam.

---

# 2. Goals

Strategi logging dirancang untuk:

* Menghasilkan log yang konsisten.
* Memudahkan pencarian log.
* Mendukung distributed tracing.
* Meminimalkan noise.
* Menjaga keamanan data sensitif.
* Mendukung analisis performa.

---

# 3. Logging Principles

Seluruh logging mengikuti prinsip:

* Structured Logging
* JSON Format
* Context Aware
* Immutable
* Searchable
* Correlated
* Secure
* Low Overhead

---

# 4. Logging Architecture

```text id="2v5m8g"
HTTP Request

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Logger

↓

Stdout

↓

Log Collector

↓

Monitoring Platform
```

Pada lingkungan container (Docker/Kubernetes), aplikasi hanya menulis ke **stdout/stderr**. Pengumpulan dan penyimpanan log dilakukan oleh platform observability.

---

# 5. Logging Technology

Rekomendasi:

| Component   | Technology                    |
| ----------- | ----------------------------- |
| Logger      | slog (Go Standard Library)    |
| Output      | JSON                          |
| Context     | context.Context               |
| Correlation | Request ID                    |
| Tracing     | OpenTelemetry                 |
| Collection  | Loki / Elasticsearch (Future) |

Menggunakan `log/slog` karena telah menjadi standar modern di Go.

---

# 6. Log Flow

```text id="cb1sq0"
Request

↓

Generate Request ID

↓

Process Request

↓

Business Log

↓

Response

↓

Write JSON Log
```

---

# 7. Log Levels

| Level | Usage                                             |
| ----- | ------------------------------------------------- |
| DEBUG | Informasi debugging                               |
| INFO  | Aktivitas normal                                  |
| WARN  | Kondisi tidak normal tetapi sistem tetap berjalan |
| ERROR | Terjadi kegagalan                                 |
| FATAL | Startup gagal (hanya saat bootstrap)              |

Pada production, `DEBUG` dinonaktifkan secara default.

---

# 8. Structured Log Format

Contoh:

```json
{
  "timestamp": "2026-07-25T10:15:00Z",
  "level": "INFO",
  "request_id": "7b71d5d8",
  "user_id": "8a10...",
  "module": "question",
  "operation": "create_question",
  "message": "Question created successfully",
  "duration_ms": 84
}
```

Semua log menggunakan format JSON.

---

# 9. Required Fields

Minimal setiap log memiliki:

* timestamp
* level
* message
* module
* operation
* request_id

Jika tersedia:

* user_id
* session_id
* trace_id
* span_id

---

# 10. Request ID

Setiap request memperoleh Request ID.

Flow:

```text id="y8jg1o"
Client

↓

Middleware

↓

Generate Request ID

↓

Context

↓

Logger

↓

Response Header
```

Header:

```http
X-Request-ID
```

---

# 11. Trace ID

Jika OpenTelemetry aktif:

```text id="6v4gqt"
Trace ID

↓

Span ID

↓

Logger
```

Log dan trace saling terhubung untuk memudahkan investigasi.

---

# 12. Context Propagation

Seluruh logger menggunakan:

```go id="1p2s98"
context.Context
```

Context membawa:

* Request ID
* User ID
* Trace ID
* Deadline
* Cancellation

---

# 13. HTTP Logging

Setiap request dicatat.

Minimal:

* Method
* Endpoint
* Status
* Duration
* IP Address
* User Agent
* Request ID

Contoh:

```text
POST /api/v1/questions
```

---

# 14. Controller Logging

Controller hanya mencatat:

* Request diterima.
* Response dikirim.
* Error yang diteruskan.

Controller tidak mencatat business event.

---

# 15. Service Logging

Service mencatat:

* Business Event.
* Workflow.
* Business Error.
* Important Decision.

Contoh:

```text
Question Published

Exam Finished

Ranking Rebuilt
```

---

# 16. Repository Logging

Repository hanya mencatat:

* Slow Query
* Database Error
* Transaction Error

Repository tidak mencatat setiap query normal.

---

# 17. Database Logging

Log database:

* Connection Error
* Deadlock
* Timeout
* Slow Query

Slow Query Threshold:

```text
> 300 ms
```

Nilai threshold dapat diubah melalui konfigurasi.

---

# 18. Authentication Logging

Selalu dicatat:

* Login Success
* Login Failed
* Logout
* Password Change
* Password Reset
* Session Revoked

Password dan token tidak boleh dicatat.

---

# 19. Authorization Logging

Dicatat:

* Permission Denied
* Unauthorized Access
* Suspicious Access

Contoh:

```text
Student attempted to publish exam.
```

---

# 20. Audit Logging

Audit Log berbeda dengan Application Log.

Audit mencatat:

* Create
* Update
* Delete
* Publish
* Submit
* Permission Change

Audit bersifat immutable dan disimpan pada tabel terpisah.

---

# 21. Security Logging

Security Event:

* Invalid JWT
* Brute Force Attempt
* Invalid Session
* Multiple Failed Login
* Token Replay
* Suspicious Activity

Event ini dapat menjadi sumber alert keamanan.

---

# 22. External Service Logging

Contoh:

AI

SMTP

Redis

Storage

Queue

Log mencakup:

* Endpoint/Service
* Duration
* Status
* Error

Payload sensitif tidak dicatat.

---

# 23. Queue Logging

Queue mencatat:

* Job Created
* Job Started
* Job Completed
* Job Failed
* Retry Count

Contoh:

```text
AI Question Generation Job Completed
```

---

# 24. Performance Logging

Log performa:

* Duration
* Memory Usage (opsional)
* Slow Request
* Slow Query

Threshold:

```text
Request > 500 ms
```

---

# 25. Error Logging

Semua error dicatat.

Minimal:

* Error Code
* Module
* Request ID
* User ID
* Stack Trace (internal)

Client tidak menerima stack trace.

---

# 26. Sensitive Data Policy

Tidak boleh dicatat:

* Password
* JWT
* Refresh Token
* API Key
* Secret
* OTP
* Session Cookie

Informasi sensitif harus dimasking atau dihilangkan.

---

# 27. PII Protection

Data berikut dimasking bila diperlukan:

* Email
* Phone Number
* IP Address (sesuai kebijakan privasi)
* Nama lengkap (untuk log tertentu)

Contoh:

```text
i***@example.com
```

---

# 28. Module Naming

Gunakan nama module.

Contoh:

```text
identity

question

exam

cbt

analytics

ranking

material

notification
```

---

# 29. Operation Naming

Gunakan nama aksi.

Contoh:

```text
create_question

publish_exam

finish_exam

generate_ai_question

submit_answer
```

Gunakan format `snake_case`.

---

# 30. Log Rotation

Backend tidak melakukan rotasi file log.

Log ditulis ke stdout/stderr.

Rotasi dilakukan oleh:

* Docker
* Kubernetes
* Cloud Logging Platform

---

# 31. Log Retention

Rekomendasi:

| Log Type        | Retention                                    |
| --------------- | -------------------------------------------- |
| Application Log | 30 hari                                      |
| Error Log       | 90 hari                                      |
| Security Log    | 180 hari                                     |
| Audit Log       | Mengikuti kebijakan bisnis (minimal 1 tahun) |

Retensi dapat disesuaikan dengan kebutuhan operasional dan regulasi.

---

# 32. Logging Configuration

Konfigurasi:

```yaml
logging:
  level: info
  format: json
  slow_query_ms: 300
  slow_request_ms: 500
```

Production:

```text
INFO
WARN
ERROR
```

Development:

```text
DEBUG
INFO
WARN
ERROR
```

---

# 33. Monitoring Integration

Logger terintegrasi dengan:

```text id="2l8k0f"
OpenTelemetry

↓

Loki

↓

Grafana

↓

Alert Manager
```

Atau platform observability lain dengan antarmuka yang setara.

---

# 34. Alerting Rules

Contoh alert:

* Error Rate meningkat.
* Login Failed tinggi.
* Panic terjadi.
* Database Timeout.
* Queue Failure.
* AI Service Down.

Alert dikirim berdasarkan metric, bukan hanya isi log.

---

# 35. Testing Logging

Pengujian meliputi:

* Request Logging.
* Error Logging.
* Security Logging.
* Audit Logging.
* JSON Format.
* Request ID.

Snapshot testing dapat digunakan untuk memastikan struktur log tetap konsisten.

---

# 36. Anti-Patterns

Tidak diperbolehkan:

* Logging Password.
* Logging JWT.
* Logging SQL lengkap dengan data sensitif.
* Logging setiap query normal.
* Menggunakan `fmt.Println()` untuk logging aplikasi.
* Log tanpa Request ID.
* Pesan log yang ambigu seperti "Error occurred".

---

# 37. Logging Checklist

Sebelum implementasi selesai:

* Structured JSON.
* Request ID tersedia.
* Context digunakan.
* Sensitive data dimasking.
* Log level sesuai.
* Audit dipisahkan.
* Slow Query Logging aktif.
* Unit test untuk formatter dan middleware tersedia.

---

# 38. Summary

Strategi Logging YakinLulus.id menggunakan **structured logging** berbasis **Go slog**, dengan dukungan Request ID, Trace ID, dan Context Propagation. Pendekatan ini memberikan:

* Logging yang konsisten dan mudah dicari.
* Integrasi langsung dengan observability modern.
* Dukungan penuh untuk debugging dan incident response.
* Keamanan melalui masking data sensitif.
* Fondasi yang siap untuk deployment pada Docker, Kubernetes, maupun cloud-native environment.
