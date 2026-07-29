# Background Worker Implementation

**Document** : `backend/14_background_worker_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Background Worker** pada backend YakinLulus.id.

Background Worker digunakan untuk menjalankan proses yang:

- Memerlukan waktu lama
- Tidak perlu diselesaikan dalam HTTP Request
- Bersifat asynchronous
- Dapat dijalankan ulang (retryable)
- Dapat diproses secara paralel

Tujuan utama:

- Mengurangi response time API
- Meningkatkan throughput sistem
- Memisahkan proses bisnis sinkron dan asinkron
- Mendukung skalabilitas horizontal

---

# 2. Peran Background Worker

Worker menangani pekerjaan yang tidak cocok dijalankan langsung pada request pengguna.

Contoh:

- Import soal Excel
- AI Question Generation
- AI Explanation Generation
- Thumbnail Generation
- Video Processing
- Email
- Push Notification
- Ranking Recalculation
- Analytics Aggregation
- Audit Processing
- Cache Rebuild
- Search Index Update

---

# 3. Architecture Overview

```text
              HTTP Request
                    │
                    ▼
             Application Layer
                    │
          Create Background Job
                    │
                    ▼
              Redis Queue
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
 Worker Instance 1          Worker Instance 2
     ▼                             ▼
 Execute Job                 Execute Job
     └──────────────┬──────────────┘
                    ▼
             Update Job Status
```

Worker dapat dijalankan pada proses/container terpisah dari API.

---

# 4. Technology Stack

Background Worker menggunakan:

| Component | Technology |
|-----------|------------|
| Queue | Redis |
| Worker Library | Asynq |
| Serialization | JSON |
| Scheduler | Asynq Scheduler |
| Retry | Built-in Retry |
| Monitoring | Asynqmon |
| Logging | Uber Zap |
| Tracing | OpenTelemetry |

Pemilihan **Asynq** memberikan integrasi yang baik dengan Go dan Redis.

---

# 5. Worker Architecture

```text
Application

↓

Job Publisher

↓

Redis Queue

↓

Worker

↓

Handler

↓

Use Case

↓

Repository
```

Worker tidak berisi business logic.

Business logic tetap berada di Application Layer.

---

# 6. Queue Structure

Queue dipisahkan berdasarkan prioritas.

```text
critical

default

low

analytics

ai

notification

import

maintenance
```

Contoh:

| Queue | Contoh Job |
|--------|------------|
| critical | Submit Exam |
| default | Update Profile |
| ai | AI Question Generation |
| import | Excel Import |
| analytics | Ranking Calculation |
| notification | Email & Push |

---

# 7. Job Lifecycle

```text
Publish

↓

Queued

↓

Running

↓

Completed
```

Jika gagal:

```text
Retry

↓

Retry

↓

Retry

↓

Dead Letter Queue
```

---

# 8. Job Payload

Payload harus:

- Ringkas
- Immutable
- Serializable
- Tidak mengandung object besar

Contoh:

```json
{
  "question_set_id": "qs_123",
  "user_id": "usr_001",
  "import_id": "imp_888"
}
```

Hindari mengirim seluruh isi file atau entity lengkap.

---

# 9. Idempotency

Seluruh job harus bersifat **idempotent**.

Contoh:

```text
Retry

↓

Tidak menghasilkan data duplikat
```

Gunakan:

- Job ID
- Unique Constraint
- Idempotency Key

---

# 10. Retry Strategy

Retry hanya dilakukan untuk error sementara.

Contoh:

- Redis Timeout
- Database Connection Lost
- External API Timeout
- AI Service Temporary Error

Konfigurasi contoh:

```text
Max Retry : 5

Delay :
1s
5s
30s
2m
10m
```

Menggunakan exponential backoff.

---

# 11. Dead Letter Queue (DLQ)

Jika retry habis:

```text
Worker

↓

Retry Failed

↓

Dead Letter Queue
```

DLQ digunakan untuk:

- Analisis kegagalan
- Reprocessing manual
- Audit

Job tidak boleh hilang.

---

# 12. Job Status

Status standar:

```text
Pending

Running

Retrying

Completed

Failed

Cancelled
```

Status dapat disimpan di database untuk proses yang perlu ditampilkan ke pengguna, seperti import soal.

---

# 13. Scheduled Job

Asynq Scheduler menjalankan pekerjaan berkala.

Contoh:

| Schedule | Job |
|----------|-----|
| Setiap malam | Ranking Rebuild |
| Setiap jam | Analytics Aggregation |
| Setiap hari | Cleanup Session |
| Setiap minggu | Archive Log |

Gunakan cron expression yang terdokumentasi.

---

# 14. Worker Scaling

Worker dapat ditambah tanpa mengubah aplikasi.

```text
Redis Queue

↓

Worker x1

↓

Worker x5

↓

Worker x20
```

Scaling dilakukan berdasarkan:

- Panjang antrean
- CPU
- Memory
- Throughput

---

# 15. Concurrency

Setiap worker memiliki concurrency yang dapat dikonfigurasi.

Contoh:

```text
Import Worker

Concurrency = 2
```

```text
Notification Worker

Concurrency = 20
```

```text
AI Worker

Concurrency = 4
```

Konfigurasi disesuaikan dengan karakteristik pekerjaan.

---

# 16. Timeout

Setiap job memiliki batas waktu.

Contoh:

| Job | Timeout |
|------|---------|
| Email | 30 detik |
| Import Excel | 15 menit |
| AI Generation | 10 menit |
| Ranking | 30 menit |

Jika timeout:

```text
Retry
```

---

# 17. Cancellation

Worker harus mendukung:

```text
Context Cancellation
```

Contoh:

- Deployment
- Shutdown
- Job dibatalkan admin

Worker harus menghentikan proses secara aman.

---

# 18. Transaction Strategy

Transaction hanya mencakup operasi database yang diperlukan.

Contoh:

```text
Read Data

↓

Process

↓

Begin Transaction

↓

Save Result

↓

Commit
```

Jangan membuka transaction selama seluruh proses AI atau import berlangsung.

---

# 19. File Processing

Untuk import soal:

```text
Upload Excel

↓

Create Job

↓

Worker

↓

Read File

↓

Validate

↓

Chunk Processing

↓

Insert Database

↓

Completed
```

Gunakan chunk processing agar penggunaan memori tetap stabil.

---

# 20. AI Processing

Pipeline AI:

```text
Publish Job

↓

Generate Prompt

↓

Call LLM

↓

Validate Result

↓

Save Draft

↓

Completed
```

Hasil AI tidak langsung dipublikasikan.

Masuk ke status **Draft** dan menunggu review jika kebijakan modul mengharuskannya.

---

# 21. Notification Processing

Pipeline:

```text
Create Event

↓

Notification Queue

↓

Worker

↓

Email

↓

Push Notification

↓

Log Result
```

Kegagalan pengiriman tidak boleh mengganggu transaksi utama.

---

# 22. Monitoring

Metric utama:

- Queue Length
- Job Throughput
- Success Rate
- Retry Count
- Failure Rate
- Processing Time
- Worker Count
- Concurrency Usage

Monitoring menggunakan:

- Asynqmon
- Prometheus
- Grafana

---

# 23. Logging

Setiap job mencatat:

- Job ID
- Queue
- Worker Name
- Duration
- Retry Count
- Status
- Error Code
- Correlation ID

Gunakan structured logging.

---

# 24. Security Consideration

Worker wajib:

- Memvalidasi payload
- Menggunakan service account dengan hak akses minimum
- Tidak menyimpan secret dalam payload
- Mengambil kredensial dari environment atau secret manager
- Mengenkripsi data sensitif jika harus disimpan sementara

---

# 25. Testing Strategy

Minimal pengujian:

- Publish Job
- Retry
- DLQ
- Timeout
- Cancellation
- Scheduled Job
- Concurrency
- Idempotency
- Queue Priority
- Worker Restart
- Large Import
- AI Failure

---

# 26. Anti-Patterns

### Business Logic di Worker

```text
Worker

↓

Business Rule

❌
```

Worker hanya mengorkestrasi pemanggilan Use Case.

---

### Payload Besar

```text
10 MB JSON

❌
```

Gunakan ID referensi.

---

### Retry Tanpa Batas

```text
Retry Forever

❌
```

Gunakan batas retry dan DLQ.

---

### Transaction Terbuka Selama AI

```text
Begin Transaction

↓

Call LLM

↓

Commit

❌
```

---

### Worker Tanpa Monitoring

```text
Background Process

↓

No Metrics

❌
```

---

# 27. Scalability Consideration

Arsitektur worker mendukung:

- Horizontal Scaling
- Queue Prioritization
- Multi Queue
- Event Driven Architecture
- AI Pipeline
- Massive Excel Import
- Batch Analytics
- Multi Region (future)

Worker dapat dipisahkan menjadi service tersendiri ketika beban meningkat tanpa mengubah kontrak Use Case.

---

# 28. Future Evolution

Background Worker siap berkembang menuju:

- Kafka / NATS / RabbitMQ
- Distributed Worker Cluster
- Kubernetes Job
- Auto Scaling Worker
- Workflow Orchestration (Temporal / Cadence)
- AI Pipeline Orchestration
- Event Streaming Architecture

Perubahan ini tidak memerlukan perubahan pada Domain maupun Application Layer.

---

# Summary

Background Worker pada YakinLulus.id dibangun menggunakan **Redis + Asynq** dengan prinsip:

- Business logic tetap berada di Use Case.
- Queue dipisahkan berdasarkan prioritas.
- Seluruh job bersifat idempotent.
- Retry menggunakan exponential backoff.
- Job gagal dipindahkan ke Dead Letter Queue.
- Mendukung scheduled task, monitoring, dan horizontal scaling.
- Siap berkembang menjadi arsitektur event-driven dan distributed processing.

Dengan pendekatan ini, proses berat seperti AI, import soal, analitik, dan notifikasi dapat dijalankan secara efisien tanpa mengganggu performa API utama.