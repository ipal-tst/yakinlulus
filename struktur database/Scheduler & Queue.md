Untuk **YakinLulus.id**, saya **sangat menyarankan** agar **Scheduler** dan **Queue** dipisahkan menjadi **domain infrastruktur**, bukan bagian dari domain bisnis (User, Soal, Materi, CBT, dan lain-lain).

Pada platform EdTech berskala besar, banyak proses **tidak boleh dijalankan secara sinkron (synchronous)** karena akan memperlambat respons aplikasi. Contohnya:

* OCR dokumen soal
* AI parsing soal
* AI generate soal
* AI tutor
* AI embedding
* Thumbnail video
* Konversi PDF
* Konversi gambar
* Export Excel
* Export PDF
* Import ribuan soal
* Import siswa
* Sinkronisasi analytics
* Perhitungan IRT
* Grading essay AI
* Email
* WhatsApp
* Push Notification
* Reminder ujian
* Expired membership
* Backup database
* Pembersihan cache
* Sinkronisasi storage
* Rebuild search index

Semua proses tersebut sebaiknya dijalankan melalui **Scheduler & Queue**.

---

# 1. Arsitektur Domain Scheduler & Queue

```text
Scheduler & Queue
│
├── Queue Definition
├── Queue Job
├── Queue Payload
├── Queue Retry
├── Queue Dead Letter
├── Queue Priority
├── Queue Worker
├── Queue Batch
├── Queue Schedule
├── Cron Scheduler
├── Event Scheduler
├── Recurring Task
├── Task Dependency
├── Workflow
├── Distributed Lock
├── Rate Limiter
├── Background Service
├── Monitoring
├── Metrics
├── History
└── Archive
```

Total sekitar **60–80 tabel**.

---

# 2. queue_definition

Master queue.

```sql
queue_definition

id UUID

queue_name

description

max_retry

retry_delay_second

priority

visibility_timeout

enabled

created_at
```

Contoh

```
OCR

AI

EMAIL

WHATSAPP

NOTIFICATION

EXPORT

IMPORT

BACKUP

SEARCH

ANALYTICS

VIDEO
```

---

# 3. queue_job

Tabel utama.

```sql
queue_job

id

queue_id

job_type

status

payload_id

priority

attempt

max_attempt

worker_id

scheduled_at

started_at

finished_at

created_at
```

Status

```
WAITING

DELAYED

RUNNING

SUCCESS

FAILED

RETRY

DEAD

CANCELLED
```

---

# 4. queue_payload

Payload dipisahkan.

```sql
queue_payload

id

payload JSONB

checksum

created_at
```

---

# 5. queue_retry

```sql
queue_retry

id

job_id

retry_no

error

created_at
```

---

# 6. queue_dead_letter

Job gagal permanen.

```sql
queue_dead_letter

id

job_id

reason

payload

created_at
```

---

# 7. queue_priority

```sql
queue_priority

id

name

LOW

NORMAL

HIGH

CRITICAL

weight
```

---

# 8. queue_worker

Worker.

```sql
queue_worker

id

worker_name

hostname

ip

version

status

started_at

heartbeat
```

---

# 9. worker_heartbeat

```sql
worker_heartbeat

id

worker_id

cpu

memory

queue_count

updated_at
```

---

# 10. queue_batch

Batch processing.

```sql
queue_batch

id

batch_name

total_job

completed

failed

created_at
```

---

## batch_job

Mapping.

---

# 11. queue_schedule

Menjadwalkan job.

```sql
queue_schedule

id

queue_id

cron_expression

timezone

enabled

next_run
```

---

# 12. cron_job

```sql
cron_job

id

job_name

expression

description

enabled
```

Contoh

```
Backup

Analytics

Reminder

Membership

Cleanup
```

---

# 13. recurring_task

Task berulang.

```sql
recurring_task

id

name

interval

last_run

next_run
```

---

# 14. scheduler_history

History.

---

# 15. Event Scheduler

## scheduled_event

```sql
scheduled_event

id

event_name

trigger_at

payload
```

Misalnya

```
Ujian dimulai

Membership expired

Reminder H-1

AI generate
```

---

# 16. Workflow

Job chaining.

## workflow

```sql
workflow

id

name

status
```

---

## workflow_step

```
OCR

↓

AI Parsing

↓

Validation

↓

Save Database

↓

Generate Thumbnail

↓

Notification
```

---

## workflow_execution

History.

---

# 17. Dependency

## task_dependency

```sql
task_dependency

task

depends_on
```

Contoh

```
Export PDF

↓

harus selesai

↓

Generate Report
```

---

# 18. Distributed Lock

Untuk mencegah duplicate.

## distributed_lock

```sql
lock_key

owner

expired_at
```

---

# 19. Rate Limiter

## rate_limit

```sql
service

limit

window_second
```

---

## rate_limit_log

---

# 20. Background Service

## background_service

```sql
service_name

version

status
```

---

## service_health

---

# 21. Monitoring

## queue_monitor

```sql
queue

waiting

running

failed

dead
```

---

## worker_monitor

---

## scheduler_monitor

---

# 22. Metrics

## queue_metrics

```sql
queue

avg_latency

throughput

success_rate
```

---

## worker_metrics

---

## scheduler_metrics

---

# 23. Archive

## archived_job

---

## archived_payload

---

# 24. History

## job_history

```sql
job

status

changed_at
```

---

## worker_history

---

# 25. Notification Queue

Pisahkan.

## notification_queue

```
Email

WA

Push

SMS
```

---

# 26. AI Queue

```
OCR

Embedding

Chat

Summary

Question Generator

Vision
```

---

# 27. Import Queue

```
Excel

CSV

PDF

DOCX

ZIP
```

---

# 28. Export Queue

```
Excel

PDF

CSV

ZIP
```

---

# 29. Analytics Queue

```
Aggregation

Statistics

Dashboard

Materialized View
```

---

# 30. Backup Queue

```
Database

Storage

Redis
```

---

# Relasi Besar

```
Queue Definition
        │
        ▼
Queue Job
        │
        ├──────── Payload
        ├──────── Retry
        ├──────── Dead Letter
        ├──────── History
        │
        ▼
Worker
        │
        ├──────── Heartbeat
        ├──────── Metrics
        └──────── Monitor

Scheduler
        │
        ├──────── Cron
        ├──────── Event
        ├──────── Recurring
        ├──────── Workflow
        └──────── Dependency
```

---

# Integrasi dengan Domain Lain

| Domain              | Job yang Dijalankan                                                   |
| ------------------- | --------------------------------------------------------------------- |
| User & RBAC         | Kirim email aktivasi, reset password, sinkronisasi role               |
| Master Akademik     | Impor kurikulum, sinkronisasi data akademik                           |
| Bank Soal           | OCR, AI parsing, validasi, impor Excel, ekspor soal, analisis butir   |
| Materi Pembelajaran | Konversi video, pembuatan thumbnail, transkripsi, subtitle, embedding |
| Engine Ujian        | Auto submit, penghitungan nilai, AI grading essay, reminder ujian     |
| Asset Management    | Resize gambar, kompresi, antivirus scan, optimasi media               |
| Notification        | Email, WhatsApp, SMS, Push Notification                               |
| Finance             | Invoice otomatis, pengingat pembayaran, rekonsiliasi                  |
| Membership          | Aktivasi, perpanjangan, masa tenggang, kedaluwarsa                    |
| Analytics           | Agregasi harian, pembaruan dashboard, ETL data warehouse              |
| Logging & Audit     | Pencatatan job, retry, kegagalan, dan aktivitas worker                |
| Search              | Rebuild indeks pencarian setelah perubahan materi atau soal           |
| AI                  | OCR, Vision, Chat, Embedding, Ringkasan, Pembuatan Soal               |

---

# Rekomendasi Implementasi

## 1. Pisahkan Queue Berdasarkan Jenis Pekerjaan

Saya tidak menyarankan hanya satu antrean.

Gunakan beberapa queue:

```
critical

default

low

notification

ai

analytics

video

ocr

search

backup
```

Dengan demikian proses AI tidak akan menghambat pengiriman email atau auto submit ujian.

---

## 2. Gunakan Payload JSONB

Jangan menyimpan parameter langsung pada `queue_job`.

Lebih baik:

```
queue_job
      │
      ▼
queue_payload(JSONB)
```

Sehingga berbagai jenis pekerjaan dapat menggunakan struktur payload yang berbeda tanpa mengubah skema.

---

## 3. Workflow Berantai

Contoh impor soal:

```
Upload PDF
      │
      ▼
OCR
      │
      ▼
AI Parsing
      │
      ▼
Validasi
      │
      ▼
Simpan ke Bank Soal
      │
      ▼
Generate Embedding
      │
      ▼
Index Search
      │
      ▼
Kirim Notifikasi
```

Setiap langkah direpresentasikan sebagai `workflow_step`, sehingga proses dapat dilanjutkan jika terjadi kegagalan pada salah satu tahap.

---

## 4. Idempotency

Setiap `queue_job` sebaiknya memiliki:

* `idempotency_key`
* `request_id`
* `trace_id`

untuk mencegah pekerjaan yang sama diproses dua kali ketika terjadi retry atau gangguan jaringan.

---

## 5. Monitoring dan Dead Letter Queue

Seluruh job yang gagal setelah mencapai `max_retry` harus dipindahkan ke `queue_dead_letter`, bukan dihapus. Hal ini memudahkan investigasi dan memungkinkan *reprocessing* setelah masalah diperbaiki.

---

# Arsitektur yang Direkomendasikan

```text
Application
        │
        ▼
Event Bus
        │
        ▼
Queue Service
        │
        ├──────── Queue Job
        ├──────── Payload
        ├──────── Worker
        ├──────── Scheduler
        ├──────── Workflow
        ├──────── Retry
        └──────── Dead Letter
                │
                ▼
Background Worker Cluster
                │
                ├── AI Worker
                ├── OCR Worker
                ├── Notification Worker
                ├── Analytics Worker
                ├── Media Worker
                ├── Search Worker
                └── Backup Worker
```

## Rekomendasi Teknologi untuk YakinLulus.id

Dengan stack yang telah Anda tetapkan (**Go + PostgreSQL + Redis + Supabase**), arsitektur yang saya rekomendasikan adalah:

* **Redis Streams** atau **RabbitMQ** sebagai message broker utama.
* **Go Worker Pool** untuk menjalankan job secara paralel.
* **PostgreSQL** sebagai penyimpanan metadata job, audit, workflow, dan histori.
* **Redis** untuk antrean aktif, *distributed lock*, *rate limiting*, dan cache scheduler.

Pendekatan ini mampu menangani jutaan job, mendukung *retry*, *workflow chaining*, *monitoring*, dan sangat sesuai untuk beban kerja YakinLulus.id seperti OCR massal, AI processing, CBT, notifikasi, dan analitik real-time.
