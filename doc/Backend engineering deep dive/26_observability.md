# 26_observability.md

# YakinLulus.id Observability Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Observability** pada backend YakinLulus.id.

Observability memungkinkan tim engineering memahami kondisi sistem secara real-time, melakukan troubleshooting dengan cepat, mengidentifikasi bottleneck, serta meningkatkan reliability platform.

Observability mencakup tiga pilar utama:

* Logging
* Metrics
* Tracing

Seluruh komponen backend wajib mendukung observability sejak awal pengembangan.

---

# 2. Objectives

Observability dirancang untuk:

* High Visibility
* Fast Troubleshooting
* Performance Monitoring
* Capacity Planning
* Incident Detection
* Root Cause Analysis
* Business Monitoring
* AI & CBT Monitoring

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Observability First
* Structured Logging
* Metrics Everywhere
* Distributed Tracing
* Correlation ID
* Low Overhead
* Event Driven
* Automation Friendly

---

# 4. High Level Architecture

```text
Backend Services

↓

Structured Logs

↓

Metrics

↓

Distributed Traces

↓

Prometheus

Grafana

Loki

Jaeger (Future)

↓

Alert Manager

↓

Engineering Team
```

---

# 5. Observability Stack

| Component     | Technology      |
| ------------- | --------------- |
| Metrics       | Prometheus      |
| Dashboard     | Grafana         |
| Logging       | Loki            |
| Log Shipping  | Promtail        |
| Tracing       | OpenTelemetry   |
| Trace Backend | Jaeger (Future) |
| Alerting      | Alertmanager    |

---

# 6. Observability Scope

Seluruh modul wajib menghasilkan telemetry.

Modul:

* Authentication
* User Management
* Question Bank
* CBT Runtime
* AI Service
* Import Pipeline
* Analytics
* Notification
* Storage
* Worker
* Scheduler

---

# 7. Three Pillars

```text
Application

↓

Logs

Metrics

Traces

↓

Dashboard
```

Ketiga data saling melengkapi untuk proses investigasi.

---

# 8. Structured Logging

Semua log menggunakan format JSON.

Contoh field:

* timestamp
* level
* service
* module
* request_id
* trace_id
* user_id
* message

---

# 9. Log Levels

Standar level:

* DEBUG
* INFO
* WARN
* ERROR
* FATAL

Production:

* INFO ke atas

Development:

* DEBUG diizinkan.

---

# 10. Correlation ID

Setiap request memiliki:

```text
Request ID

Trace ID

Span ID
```

Seluruh service meneruskan identifier tersebut.

---

# 11. Request Flow

```text
Client

↓

API

↓

Service

↓

Repository

↓

Redis

↓

Supabase
```

Trace ID mengikuti seluruh alur.

---

# 12. Metrics Strategy

Metrics dibagi menjadi:

* Infrastructure Metrics
* Application Metrics
* Business Metrics
* AI Metrics

---

# 13. Infrastructure Metrics

Dipantau:

* CPU
* Memory
* Disk
* Network
* Container Restart
* File Descriptor
* Process Count

---

# 14. API Metrics

Dipantau:

* Request Count
* Response Time
* Error Rate
* Status Code
* Active Connection
* Throughput

Label:

* endpoint
* method
* status

---

# 15. Database Metrics

Dipantau:

* Connection Pool
* Query Duration
* Slow Query
* Failed Query
* Transaction Count

Monitoring dilakukan pada sisi aplikasi dan database yang tersedia melalui Supabase.

---

# 16. Redis Metrics

Dipantau:

* Memory Usage
* Key Count
* Hit Rate
* Miss Rate
* Connected Client
* Queue Size

---

# 17. Queue Metrics

Asynq:

* Queue Length
* Active Job
* Retry Count
* Failed Job
* Success Job
* Processing Time

---

# 18. AI Metrics

Dipantau:

* AI Request Count
* Token Usage
* Provider
* Model
* Cost Estimation
* Retry Count
* Failure Rate
* Response Time

---

# 19. CBT Runtime Metrics

Dipantau:

* Active Session
* Concurrent Exam
* Auto Save Count
* Resume Count
* Submit Count
* Average Exam Duration
* Timer Drift
* Session Recovery

---

# 20. Import Pipeline Metrics

Dipantau:

* Imported Row
* Failed Row
* Validation Error
* Import Duration
* Queue Waiting Time

---

# 21. Analytics Metrics

Dipantau:

* Event Count
* Aggregation Time
* Dashboard Response Time
* Report Generation Time

---

# 22. Business Metrics

Dashboard bisnis menampilkan:

* Active Student
* Active Teacher
* Exam Participation
* Material Completion
* Daily Login
* New Registration

Business metrics dipisahkan dari technical metrics.

---

# 23. Distributed Tracing

OpenTelemetry digunakan untuk:

```text
Gateway

↓

Controller

↓

Service

↓

Repository

↓

External API
```

Tracing membantu menemukan bottleneck antar komponen.

---

# 24. Span Strategy

Setiap layer menghasilkan span.

Contoh:

```text
HTTP Request

↓

Authentication

↓

Question Service

↓

Repository

↓

Redis

↓

Supabase
```

---

# 25. External Service Tracing

Trace dilakukan pada:

* Supabase API
* AI Provider
* SMTP
* Storage
* Redis

Durasi request eksternal dicatat secara terpisah.

---

# 26. Health Monitoring

Endpoint:

```text
GET /health

GET /live

GET /ready
```

Readiness memeriksa:

* Redis
* Supabase
* Queue

---

# 27. Synthetic Monitoring

Future:

Monitoring otomatis:

* Login
* Start CBT
* Submit CBT
* AI Generation
* Import Question

Dilakukan secara berkala menggunakan akun uji.

---

# 28. Dashboard Categories

Grafana Dashboard:

* Infrastructure
* API
* Authentication
* CBT Runtime
* AI
* Import
* Analytics
* Queue
* Redis
* Storage

---

# 29. Alert Strategy

Alert dikategorikan:

* Critical
* High
* Medium
* Low

Severity menentukan eskalasi notifikasi.

---

# 30. Critical Alerts

Contoh:

* Backend Down
* Redis Down
* Queue Stuck
* Database Connection Failed
* Authentication Failure
* Storage Failure

Harus ditangani segera.

---

# 31. Warning Alerts

Contoh:

* CPU > 80%
* Memory > 80%
* Queue > Threshold
* Error Rate Meningkat
* AI Cost Tinggi
* Slow Query

---

# 32. Alert Channels

MVP:

* Email

Future:

* Telegram
* Discord
* Slack
* Microsoft Teams
* PagerDuty

---

# 33. Log Retention

Rekomendasi:

| Log             | Retention              |
| --------------- | ---------------------- |
| Application Log | 30 hari                |
| Error Log       | 180 hari               |
| Audit Log       | Mengikuti Audit Policy |
| Security Log    | 1 tahun                |

---

# 34. Metrics Retention

Rekomendasi:

| Metrics          | Retention |
| ---------------- | --------- |
| High Resolution  | 30 hari   |
| Hourly Aggregate | 180 hari  |
| Daily Aggregate  | 2 tahun   |

---

# 35. Trace Retention

Rekomendasi:

| Trace       | Retention |
| ----------- | --------- |
| Normal      | 7 hari    |
| Error Trace | 30 hari   |

Sampling diterapkan untuk mengurangi beban penyimpanan.

---

# 36. Security

Log tidak boleh berisi:

* Password
* JWT
* Refresh Token
* API Key
* Secret
* OTP
* Informasi sensitif yang tidak diperlukan

PII dimasking jika harus dicatat.

---

# 37. Performance Budget

Target observability:

| Metric           | Target       |
| ---------------- | ------------ |
| Logging Overhead | < 2%         |
| Metrics Overhead | < 1%         |
| Trace Sampling   | Configurable |
| Health Endpoint  | < 50 ms      |

---

# 38. Failure Investigation Flow

```text
Alert

↓

Dashboard

↓

Metrics

↓

Trace

↓

Log

↓

Root Cause

↓

Resolution
```

Investigasi selalu dimulai dari alert, bukan dari log secara acak.

---

# 39. Integration

Observability terintegrasi dengan:

* Logging Strategy
* Error Handling
* Background Job
* Analytics
* Security
* Deployment
* AI Service
* CBT Runtime

Semua modul menggunakan standar telemetry yang sama.

---

# 40. Anti-Patterns

Tidak diperbolehkan:

* Logging plaintext password.
* Logging JWT.
* Menggunakan log sebagai audit trail utama.
* Dashboard langsung membaca log mentah.
* Tidak memiliki correlation ID.
* Tidak mengukur latency endpoint.
* Menonaktifkan observability di production.

---

# 41. Observability Checklist

Sebelum production:

* Structured Logging aktif.
* Metrics tersedia.
* Health Check tersedia.
* Dashboard Grafana siap.
* Prometheus mengumpulkan metrics.
* Loki menerima log.
* Alert aktif.
* Correlation ID aktif.
* Trace aktif (minimal pada endpoint kritikal).
* Runbook tersedia untuk alert utama.

---

# 42. Roadmap

**Phase 1 (MVP)**

* Prometheus
* Grafana
* Loki
* Structured Logging
* Health Check

**Phase 2**

* OpenTelemetry
* Distributed Tracing
* Alertmanager
* Synthetic Monitoring

**Phase 3**

* Jaeger
* Service Dependency Map
* AI-assisted Incident Analysis
* SLO & Error Budget Dashboard

---

# 43. Relationship dengan Arsitektur Lain

Observability merupakan kemampuan lintas sistem yang mencakup seluruh backend.

```text
Backend Services

↓

Logging

Metrics

Tracing

↓

Grafana

↓

Engineering

↓

Continuous Improvement
```

Observability mendukung operasi harian, troubleshooting, capacity planning, serta evaluasi performa seluruh modul backend.

---

# 44. Summary

Observability Architecture YakinLulus.id menerapkan pendekatan **Three Pillars of Observability** dengan **Prometheus**, **Grafana**, **Loki**, dan **OpenTelemetry**.

Arsitektur ini memberikan:

* Visibilitas menyeluruh terhadap kondisi sistem.
* Deteksi dini terhadap gangguan operasional.
* Investigasi insiden yang lebih cepat melalui correlation ID dan distributed tracing.
* Monitoring teknis dan bisnis dalam satu ekosistem.
* Fondasi observability yang siap berkembang menuju operasi berskala enterprise.
