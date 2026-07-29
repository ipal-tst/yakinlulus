# Logging Implementation

**Document** : `backend/13_logging_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Logging** pada backend YakinLulus.id.

Logging merupakan salah satu komponen utama observability yang berfungsi untuk:

- Monitoring aplikasi
- Troubleshooting
- Audit
- Debugging
- Security Investigation
- Performance Analysis
- Compliance

Seluruh log harus bersifat:

- Structured
- Consistent
- Searchable
- Correlatable
- Production Ready

---

# 2. Logging Philosophy

Prinsip utama logging:

- Log Everything Important
- Never Log Sensitive Data
- Structured First
- Context Aware
- Machine Readable
- Human Friendly
- Correlatable
- Low Overhead

Logging bukan sekadar `fmt.Println()`.

---

# 3. Logging Architecture

```text
                HTTP Request
                     │
                     ▼
             Request Middleware
                     │
                     ▼
               Request Context
                     │
                     ▼
          Application / Use Case
                     │
                     ▼
               Logger Interface
                     │
                     ▼
          Zap Structured Logger
                     │
                     ▼
           Log Aggregation System
```

---

# 4. Logging Library

Backend menggunakan:

```text
Uber Zap
```

Alasan:

- Sangat cepat
- Zero Allocation (fast path)
- Structured Logging
- Production Ready
- JSON Output
- OpenTelemetry Friendly

---

# 5. Logger Abstraction

Application dan Domain tidak bergantung langsung pada Zap.

Gunakan interface.

```text
Logger Interface

↓

Zap Implementation
```

Jika di masa depan logger diganti, perubahan hanya terjadi pada Infrastructure Layer.

---

# 6. Logging Layer Responsibility

| Layer | Logging |
|---------|---------|
| Interface | Request, Response |
| Application | Workflow |
| Domain | Tidak melakukan logging langsung |
| Infrastructure | Database, Cache, External API |
| Worker | Job Processing |

Domain tetap bersih dari dependency teknis.

---

# 7. Log Level

Gunakan level berikut.

### DEBUG

Development only.

Contoh:

- SQL Parameter
- Internal Flow
- Debug Variable

---

### INFO

Operasi normal.

Contoh:

- Login
- Create Exam
- Submit Answer
- Upload File

---

### WARN

Operasi berhasil tetapi perlu perhatian.

Contoh:

- Retry
- Slow Query
- Cache Miss
- Deprecated API

---

### ERROR

Operasi gagal.

Contoh:

- Database Error
- AI Error
- Validation Failure
- Repository Failure

---

### FATAL

Aplikasi tidak dapat melanjutkan.

Contoh:

- Configuration Invalid
- Database tidak dapat diinisialisasi
- Startup Failure

---

# 8. Request Logging

Seluruh HTTP Request dicatat.

Minimal informasi:

```text
Request ID

Method

Path

Status Code

Duration

User ID

IP Address

User Agent

Timestamp
```

---

# 9. Response Logging

Contoh informasi:

```text
HTTP Status

Duration

Response Size

Request ID
```

Response body tidak dicatat secara default.

---

# 10. Use Case Logging

Contoh:

```text
CreateExam

↓

Started

↓

Completed
```

Informasi:

- Use Case
- Duration
- User
- Success
- Failure
- Transaction ID

---

# 11. Repository Logging

Repository mencatat:

- Query Duration
- Retry
- Deadlock
- Connection Error

Repository tidak mencatat seluruh SQL statement pada production.

---

# 12. Worker Logging

Worker mencatat:

```text
Job Name

Queue

Retry Count

Execution Time

Status
```

Contoh:

```text
ImportQuestionWorker

Status:
Completed
```

---

# 13. External Service Logging

Contoh:

```text
AI

Storage

SMTP

Push Notification

Supabase Storage
```

Catat:

- Endpoint
- Latency
- Status
- Retry
- Error

Jangan mencatat API Key atau Access Token.

---

# 14. Security Logging

Security event wajib dicatat.

Contoh:

- Login
- Logout
- Failed Login
- Permission Denied
- Password Reset
- Role Changed
- API Abuse
- Token Revoked

Security log dipisahkan dari application log jika memungkinkan.

---

# 15. Audit Logging

Audit log digunakan untuk aktivitas penting.

Contoh:

```text
Question Published

Question Deleted

Exam Published

Exam Cancelled

User Role Updated

Material Updated
```

Audit log bersifat immutable.

---

# 16. Correlation ID

Seluruh log harus memiliki:

```text
Request ID
```

Untuk background worker:

```text
Job ID
```

Untuk event:

```text
Correlation ID
```

Flow:

```text
HTTP Request

↓

Request ID

↓

Worker

↓

Correlation ID

↓

Notification
```

---

# 17. Context Propagation

Logger selalu menerima:

```text
context.Context
```

Context membawa:

- Request ID
- User ID
- Tenant ID (future)
- Trace ID
- Span ID

---

# 18. Log Format

Gunakan JSON.

Contoh:

```json
{
  "level": "info",
  "timestamp": "2026-07-26T10:30:00Z",
  "request_id": "req_01JXYZ123",
  "user_id": "usr_01ABC456",
  "module": "exam",
  "use_case": "StartExam",
  "message": "Exam started successfully",
  "duration_ms": 148
}
```

Format JSON memudahkan indexing pada sistem log aggregation.

---

# 19. Sensitive Data

Jangan pernah mencatat:

- Password
- JWT Token
- Refresh Token
- API Key
- Secret Key
- Session Token
- OTP
- Bank Account
- Credit Card
- File Binary
- Personal Identification Number

Gunakan masking bila diperlukan.

Contoh:

```text
email

↓

ip***@gmail.com
```

---

# 20. Slow Operation Logging

Threshold logging:

| Operation | Threshold |
|-----------|-----------|
| HTTP Request | >500 ms |
| Database Query | >200 ms |
| External API | >1000 ms |
| Worker | >5 detik |

Jika melewati threshold:

```text
WARN
```

---

# 21. Error Logging

Minimal informasi:

```text
Error Code

Module

Use Case

Request ID

User ID

Stack Trace

Duration
```

Stack trace hanya tersedia pada internal log.

---

# 22. Log Rotation

Log file lokal hanya digunakan untuk:

- Development
- Debugging

Production menggunakan:

```text
STDOUT

↓

Container

↓

Log Collector
```

Rotasi dikelola oleh platform (Docker/Kubernetes/Cloud).

---

# 23. Log Aggregation

Production menggunakan pipeline:

```text
Application

↓

Docker

↓

OpenTelemetry Collector

↓

Loki / Elasticsearch

↓

Grafana
```

Seluruh log dapat dicari berdasarkan:

- Request ID
- User ID
- Module
- Error Code
- Trace ID

---

# 24. Monitoring Integration

Logging terintegrasi dengan:

- OpenTelemetry
- Prometheus
- Grafana
- Loki

Opsional:

- Sentry
- Datadog
- New Relic

---

# 25. Testing Logging

Minimal pengujian:

- Request Logging
- Error Logging
- Audit Logging
- Worker Logging
- Security Logging
- Correlation ID
- Sensitive Data Masking

---

# 26. Anti-Patterns

### Menggunakan fmt.Println()

```go
fmt.Println(err)
```

❌

---

### Logging Password

```json
{
  "password": "12345678"
}
```

❌

---

### Logging Token

```json
{
  "access_token": "..."
}
```

❌

---

### Logging SQL Lengkap di Production

```sql
SELECT * FROM users ...
```

❌

Gunakan metadata query, bukan isi query secara penuh.

---

### Logging Berlebihan

```text
Loop 100.000 data

↓

100.000 log
```

❌

Gunakan summary log atau sampling.

---

# 27. Scalability Consideration

Strategi logging ini mendukung:

- Horizontal Scaling
- Multi Instance
- Distributed Worker
- Multi Region
- Microservice Migration
- Distributed Tracing

Karena seluruh log memiliki Request ID dan Correlation ID yang konsisten.

---

# 28. Future Evolution

Logging siap dikembangkan menuju:

- AI-assisted Log Analysis
- Automatic Root Cause Analysis
- Log Sampling
- Centralized Audit Service
- Security Information and Event Management (SIEM)
- Anomaly Detection

---

# Summary

Logging pada YakinLulus.id menggunakan pendekatan **structured logging** dengan Uber Zap sebagai implementasi utama.

Prinsip implementasi:

- Structured JSON logging.
- Request ID dan Correlation ID pada seluruh alur.
- Log level yang konsisten.
- Tidak mencatat data sensitif.
- Audit log untuk aktivitas penting.
- Integrasi dengan OpenTelemetry, Grafana, dan Loki.
- Siap untuk observability dan analisis pada skala enterprise.

Dengan strategi ini, seluruh aktivitas sistem dapat ditelusuri secara akurat, aman, dan efisien, baik untuk debugging, monitoring, maupun audit.