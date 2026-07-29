Selanjutnya adalah **21_background_jobs.md**. Dokumen ini sangat penting karena hampir semua proses berat pada Question Bank (AI, import, export, indexing, embedding, statistik) **tidak boleh berjalan di dalam request HTTP**.

Untuk target YakinLulus.id (>100.000 user dan >10.000 concurrent user), seluruh pekerjaan yang memakan waktu lebih dari ±200–500 ms sebaiknya dipindahkan ke asynchronous worker.

---

````markdown
# 21_background_jobs.md

# Question Bank Background Jobs Specification

Version : 1.0

---

# 1. Overview

Background Jobs bertanggung jawab menjalankan proses asynchronous
yang tidak perlu diselesaikan selama request HTTP.

Tujuan:

- meningkatkan response time
- mengurangi beban API
- meningkatkan reliability
- mendukung retry
- mendukung scheduling

---

# 2. Architecture

```
REST API

↓

Application Service

↓

Job Queue

↓

Worker

↓

Repository

↓

Database

↓

Event
```

---

# 3. Job Categories

Question Bank memiliki beberapa kategori job.

- Import
- Export
- AI Generation
- Search Index
- Embedding
- Statistics
- Cleanup
- Notification
- Maintenance

---

# 4. Job Lifecycle

```
Queued

↓

Running

↓

Completed

↓

Archived
```

Jika gagal.

```
Running

↓

Retry

↓

Failed

↓

Dead Job
```

---

# 5. Import Jobs

Jenis.

- Parse Excel
- Validate Row
- Import Batch
- Update Progress
- Generate Report

Semua batch berjalan terpisah.

---

# 6. Export Jobs

Jenis.

- Build Dataset
- Generate Excel
- Generate JSON
- Compress ZIP
- Upload Storage
- Generate Download URL

---

# 7. AI Jobs

Jenis.

- Generate Question
- Generate Explanation
- Generate Distractor
- Generate Metadata
- Generate Similar Question
- Generate Embedding

---

# 8. Search Jobs

Jenis.

- Full Reindex
- Incremental Reindex
- Remove Document
- Update Index
- Search Cache Refresh

---

# 9. Statistics Jobs

Jenis.

- Update Usage
- Update Exposure
- Difficulty Recalculation
- Correct Rate
- Recommendation Score

---

# 10. Cleanup Jobs

Jenis.

- Delete Temp File
- Remove Expired Export
- Delete Old Import
- Remove Old Cache
- Cleanup Attachment

---

# 11. Scheduled Jobs

Contoh.

Daily

- Statistics Aggregation
- Cleanup

Hourly

- Retry Failed Jobs

Weekly

- Reindex
- Optimization

Monthly

- Archive Logs

---

# 12. Retry Policy

Retry menggunakan.

Exponential Backoff

Contoh.

1 menit

↓

5 menit

↓

15 menit

↓

1 jam

Maximum Retry:

5 kali

---

# 13. Dead Job Queue

Job yang gagal setelah retry.

↓

Dead Queue

Administrator dapat.

- Replay
- Cancel
- Delete

---

# 14. Job Priority

Priority.

Critical

High

Normal

Low

Contoh.

Publish Question

↓

High

Generate Export

↓

Normal

Cleanup

↓

Low

---

# 15. Job Idempotency

Job harus aman dijalankan ulang.

Menggunakan.

Job ID

+

Idempotency Key

---

# 16. Job Payload

Minimal payload.

```json
{
  "job_id": "",
  "job_type": "",
  "aggregate_id": "",
  "user_id": "",
  "request_id": "",
  "payload": {}
}
```

---

# 17. Job State

State.

Queued

Running

Completed

Failed

Retrying

Cancelled

Dead

---

# 18. Worker Pool

Worker dipisahkan.

```
Import Worker

Export Worker

AI Worker

Embedding Worker

Cleanup Worker
```

Setiap worker memiliki concurrency sendiri.

---

# 19. Queue Strategy

Queue dipisahkan.

```
critical

high

default

low

maintenance
```

Prioritas tinggi diproses lebih dahulu.

---

# 20. Database Objects

```
background_job

background_job_log

background_job_retry

dead_job

job_schedule
```

---

# 21. Events

```
JobQueued

JobStarted

JobCompleted

JobFailed

JobRetried

JobCancelled
```

---

# 22. Monitoring

Dipantau.

- Queue Length
- Processing Time
- Retry Count
- Success Rate
- Failure Rate
- Worker Utilization

---

# 23. Failure Handling

Jika worker gagal.

↓

Retry

↓

Dead Queue

↓

Alert

Jika storage gagal.

↓

Retry

Jika AI gagal.

↓

Retry

Jika database gagal.

↓

Abort

---

# 24. Resource Limiting

Worker memiliki batas.

- Max Memory
- Max CPU
- Max Runtime
- Max Retry

Job yang melewati batas akan dihentikan.

---

# 25. Cancellation

Job dapat dibatalkan jika.

- belum berjalan
- masih antre

Job yang sedang berjalan mengikuti kebijakan graceful cancellation.

---

# 26. Logging

Setiap job mencatat.

- Job ID
- Queue
- Worker
- Started At
- Finished At
- Duration
- Retry Count
- Error

---

# 27. Performance Target

| Job | Target |
|------|---------|
| Import Batch | < 5 detik |
| Export 10.000 Soal | < 60 detik |
| Generate AI Question | < 30 detik |
| Search Reindex | < 5 detik per batch |
| Embedding | < 1 detik per soal |

---

# 28. Security

Worker hanya dapat mengakses resource yang diperlukan.

Seluruh job dijalankan menggunakan service account.

Tidak menggunakan kredensial pengguna.

---

# 29. Disaster Recovery

Jika worker mati.

↓

Queue tetap tersimpan

↓

Worker baru mengambil job

↓

Resume Processing

Queue harus durable.

---

# 30. Future Roadmap

- Distributed Worker
- Auto Scaling Worker
- Kubernetes Job
- Cron Scheduler Cluster
- Workflow Engine
- Batch Orchestrator
- Multi Region Worker
````

---

# Rekomendasi Arsitektur

Untuk backend Go, saya menyarankan memisahkan **Job Producer**, **Queue**, dan **Worker**.

```text
                 REST API
                     │
                     ▼
            Background Producer
                     │
         ┌───────────┴────────────┐
         ▼                        ▼
     Job Queue               Scheduler
         │
 ┌───────┼───────────────┐
 ▼       ▼        ▼       ▼
Import  Export    AI   Embedding
Worker  Worker  Worker   Worker
         │
         ▼
 Repository
         │
         ▼
 PostgreSQL / Storage / Search
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/jobs/
│
├── producer/
│   ├── enqueue.go
│   └── scheduler.go
│
├── worker/
│   ├── import_worker.go
│   ├── export_worker.go
│   ├── ai_worker.go
│   ├── embedding_worker.go
│   ├── search_worker.go
│   ├── cleanup_worker.go
│   └── statistics_worker.go
│
├── queue/
│   ├── interface.go
│   ├── dispatcher.go
│   └── retry.go
│
├── model/
│   ├── job.go
│   ├── payload.go
│   └── result.go
│
└── scheduler/
    ├── cron.go
    └── maintenance.go
```

## Penyempurnaan untuk YakinLulus.id

Saya merekomendasikan agar seluruh background job menggunakan **typed job contract** daripada payload generik. Misalnya:

```go
type GenerateQuestionJob struct { ... }
type ImportBatchJob struct { ... }
type ExportQuestionJob struct { ... }
type GenerateEmbeddingJob struct { ... }
```

Keuntungannya:

* validasi payload dilakukan saat kompilasi;
* lebih mudah diuji dan dipelihara;
* mengurangi kesalahan serialisasi/deserialisasi;
* memudahkan penambahan worker baru tanpa memengaruhi job lain.

Selain itu, gunakan antrean terpisah untuk AI, import/export, dan maintenance agar pekerjaan berat tidak menghambat proses yang lebih penting seperti publish soal atau pembaruan indeks pencarian.
