# 14_background_job.md

# YakinLulus.id Background Job Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Background Job** pada backend YakinLulus.id.

Background Job digunakan untuk menjalankan proses yang tidak perlu dieksekusi secara sinkron pada HTTP Request, sehingga:

* Response API tetap cepat.
* Proses berat dijalankan secara asynchronous.
* Sistem lebih scalable.
* Mendukung retry otomatis.
* Mendukung scheduled task.

---

# 2. Objectives

Background Job dirancang untuk:

* Menjalankan pekerjaan asynchronous.
* Mengurangi response time API.
* Mendukung retry.
* Mendukung delayed job.
* Mendukung scheduled job.
* Mendukung distributed worker.
* Mendukung monitoring job.

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Asynchronous First
* Idempotent Job
* Retry Safe
* Event Driven
* Small Job
* Observable
* Scalable
* Fault Tolerant

---

# 4. Technology Stack

Untuk YakinLulus.id digunakan:

| Component     | Technology      |
| ------------- | --------------- |
| Queue         | Redis           |
| Job Framework | Asynq           |
| Scheduler     | Asynq Scheduler |
| Monitoring    | Asynqmon        |
| Serialization | JSON            |
| Logging       | slog            |

Pemilihan **Asynq** memberikan retry, scheduling, priority queue, dan dashboard monitoring yang matang untuk ekosistem Go.

---

# 5. High Level Architecture

```text
HTTP Request

↓

Controller

↓

Service

↓

Create Job

↓

Redis Queue

↓

Worker

↓

Business Service

↓

Database
```

HTTP Request tidak menunggu job selesai kecuali memang dibutuhkan.

---

# 6. Job Categories

Job dibagi menjadi beberapa kategori.

| Category        | Example           |
| --------------- | ----------------- |
| AI              | Generate Question |
| Notification    | Email, Push       |
| Media           | Thumbnail         |
| Analytics       | Ranking           |
| Maintenance     | Cleanup           |
| Reporting       | Export PDF        |
| Synchronization | Cache Refresh     |

---

# 7. Directory Structure

```text
internal/

platform/

queue/

adapter.go

asynq.go

worker.go

scheduler.go

handler.go

jobs/

handlers/
```

Setiap domain memiliki package job masing-masing.

---

# 8. Queue Architecture

```text
API

↓

Queue Adapter

↓

Redis

↓

Worker

↓

Handler

↓

Service
```

Business logic tetap berada pada Service Layer.

---

# 9. Queue Names

Rekomendasi queue:

```text
critical

default

low

maintenance

analytics

notification

ai
```

Queue dipisahkan berdasarkan prioritas.

---

# 10. Job Priority

| Queue        | Priority |
| ------------ | -------- |
| critical     | Highest  |
| default      | Normal   |
| notification | Medium   |
| analytics    | Low      |
| maintenance  | Lowest   |

Prioritas dikonfigurasi melalui Asynq.

---

# 11. Job Payload

Payload menggunakan JSON.

Contoh:

```json
{
  "question_id": "uuid",
  "user_id": "uuid"
}
```

Payload harus kecil dan hanya berisi identifier yang diperlukan.

---

# 12. Job Naming Convention

Format:

```text
domain.action
```

Contoh:

```text
question.generate_ai

question.recalculate_stat

exam.publish

exam.close

material.generate_thumbnail

analytics.rebuild_ranking

notification.send_email

notification.send_push
```

---

# 13. Job Lifecycle

```text
Create

↓

Queued

↓

Processing

↓

Success

↓

Completed
```

Apabila gagal:

```text
Retry

↓

Dead Letter (Future)
```

---

# 14. Retry Strategy

Default:

* Maximum Retry: 10
* Exponential Backoff
* Configurable Delay

Retry hanya dilakukan untuk error yang bersifat sementara (transient).

---

# 15. Idempotency

Seluruh job wajib bersifat **idempotent**.

Contoh:

```text
Generate Thumbnail
```

Jika job dijalankan dua kali:

* Tidak menghasilkan data ganda.
* Tidak menyebabkan inkonsistensi.

---

# 16. AI Question Generation

Flow:

```text
Teacher

↓

Create AI Request

↓

Queue

↓

Worker

↓

Python AI

↓

Save Questions

↓

Notify User
```

Proses AI tidak boleh dijalankan pada HTTP Request.

---

# 17. Email Job

Flow:

```text
Service

↓

Queue

↓

Worker

↓

SMTP

↓

Complete
```

Email dikirim secara asynchronous.

---

# 18. Push Notification Job

Flow:

```text
Create Notification

↓

Queue

↓

Worker

↓

Push Provider

↓

Success
```

---

# 19. Thumbnail Generation

```text
Upload Video

↓

Queue

↓

FFmpeg

↓

Generate Thumbnail

↓

Upload Storage
```

Worker dapat ditempatkan pada server khusus media processing.

---

# 20. Ranking Recalculation

Ranking diperbarui secara asynchronous.

Flow:

```text
Exam Finished

↓

Queue

↓

Ranking Service

↓

Update Leaderboard
```

Menghindari beban tinggi saat submit ujian.

---

# 21. Analytics Job

Job:

* Daily Analytics
* Weekly Analytics
* Learning Progress
* Dashboard Aggregation

Job dijalankan secara terjadwal.

---

# 22. Export Job

Contoh:

```text
Export Excel

Export CSV

Export PDF
```

Flow:

```text
Request

↓

Queue

↓

Generate File

↓

Upload Storage

↓

Notify User
```

---

# 23. Scheduled Jobs

Contoh:

Setiap malam:

```text
Cleanup Temporary File
```

Setiap minggu:

```text
Rebuild Statistics
```

Setiap bulan:

```text
Archive Log
```

---

# 24. Maintenance Jobs

Meliputi:

* Delete Expired Session
* Cleanup Cache
* Cleanup Orphan File
* Cleanup Temporary Upload
* Refresh Material Cache

---

# 25. Queue Adapter

Seluruh akses queue menggunakan interface.

```go
type Queue interface {
    Enqueue(...)
    Schedule(...)
}
```

Business layer tidak bergantung pada Asynq secara langsung.

---

# 26. Worker Structure

```text
Worker

↓

Job Handler

↓

Application Service
```

Worker tidak mengandung business logic.

---

# 27. Handler Responsibility

Handler hanya:

* Deserialize payload.
* Validasi payload dasar.
* Memanggil Service.
* Logging.

---

# 28. Job Timeout

Setiap job memiliki timeout.

Contoh:

| Job       | Timeout |
| --------- | ------- |
| Email     | 30 sec  |
| AI        | 10 min  |
| Thumbnail | 15 min  |
| Export    | 5 min   |

Timeout dikonfigurasi berdasarkan jenis pekerjaan.

---

# 29. Dead Letter Strategy

Apabila seluruh retry gagal:

```text
Retry Exhausted

↓

Failed Queue

↓

Monitoring

↓

Manual Investigation
```

Dead Letter Queue dapat ditambahkan pada fase berikutnya.

---

# 30. Logging

Setiap job mencatat:

* Job ID
* Job Name
* Queue
* Duration
* Retry Count
* Status
* Error

---

# 31. Monitoring

Metric:

* Queue Length
* Active Worker
* Success Rate
* Failure Rate
* Retry Count
* Processing Time

Monitoring menggunakan Asynq Dashboard dan sistem observability.

---

# 32. Concurrency

Worker concurrency dapat diatur.

Contoh:

```yaml
worker:
  concurrency: 20
```

Queue AI dapat memiliki concurrency lebih rendah dibanding notification.

---

# 33. Horizontal Scaling

Worker dapat diperbanyak.

```text
Redis Queue

↓

Worker A

Worker B

Worker C
```

Tidak diperlukan perubahan kode aplikasi.

---

# 34. Failure Recovery

Jika worker berhenti:

* Job tetap berada di Redis.
* Worker baru melanjutkan proses.
* Retry tetap berjalan.

Tidak terjadi kehilangan job selama Redis tersedia.

---

# 35. Security

Job Payload tidak boleh berisi:

* Password
* JWT
* API Key
* Refresh Token

Gunakan identifier (UUID) dan ambil data dari database saat eksekusi.

---

# 36. Testing Strategy

Pengujian meliputi:

* Job Success
* Retry
* Timeout
* Invalid Payload
* Duplicate Job
* Scheduled Job
* Queue Failure
* Worker Restart

---

# 37. Anti-Patterns

Tidak diperbolehkan:

* Business logic di Worker.
* Payload terlalu besar.
* Menyimpan objek penuh dalam payload.
* Job tanpa timeout.
* Retry untuk validation error.
* HTTP Request menunggu proses AI selesai.
* Mengakses database langsung dari queue adapter.

---

# 38. Future Roadmap

Pengembangan selanjutnya:

* Dead Letter Queue.
* Job Deduplication.
* Distributed Scheduler.
* Priority Boosting.
* Cron Dashboard.
* Multi-region Worker.
* Event Streaming (Kafka/NATS) untuk workload skala besar.

---

# 39. Background Job Checklist

Sebelum implementasi:

* Menggunakan Queue Adapter.
* Seluruh job idempotent.
* Retry aktif.
* Timeout dikonfigurasi.
* Logging tersedia.
* Monitoring aktif.
* Payload kecil.
* Worker tanpa business logic.
* Unit & integration test tersedia.

---

# 40. Summary

YakinLulus.id menggunakan arsitektur **Background Job** berbasis **Redis + Asynq** untuk menjalankan seluruh proses asynchronous seperti AI Question Generation, Notification, Export, Analytics, dan Maintenance.

Dengan pendekatan ini sistem memperoleh:

* Response API yang cepat.
* Pemrosesan asynchronous yang andal.
* Retry dan scheduling bawaan.
* Horizontal scalability untuk worker.
* Monitoring yang lengkap.
* Fondasi yang siap berkembang menuju event-driven architecture dan workload berskala enterprise.
