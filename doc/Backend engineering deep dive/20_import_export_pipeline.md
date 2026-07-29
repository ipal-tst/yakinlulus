# 20_import_export_pipeline.md

# YakinLulus.id Import Export Pipeline

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Import & Export Pipeline** pada platform YakinLulus.id.

Pipeline ini menangani seluruh proses:

* Import Bank Soal
* Import Materi
* Import User
* Import Kurikulum
* Import Master Data
* Export Soal
* Export Hasil CBT
* Export Analytics
* Export Laporan

Seluruh proses dirancang agar mampu menangani dataset besar secara asynchronous.

---

# 2. Objectives

Import & Export Pipeline dirancang untuk:

* High Throughput
* Fault Tolerant
* Scalable
* Resumeable
* Auditable
* Observable
* Extensible
* Secure

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Asynchronous Processing
* Batch Processing
* Idempotent
* Validation First
* Audit Everything
* Partial Failure Recovery
* Queue Based
* Event Driven

---

# 4. High Level Architecture

```text id="j2n8ra"
Upload File

↓

Storage

↓

Import Job

↓

Queue

↓

Worker

↓

Parser

↓

Validator

↓

Business Service

↓

Database

↓

Report
```

Export mengikuti alur sebaliknya.

---

# 5. Supported Import Types

Import mendukung:

* Question Bank
* Student
* Teacher
* School
* Subject
* Curriculum
* Chapter
* Material Metadata
* Question Tag
* Academic Calendar

Pipeline dapat diperluas tanpa mengubah arsitektur.

---

# 6. Supported Export Types

Export mendukung:

* Question Bank
* CBT Result
* Student Score
* Ranking
* Analytics
* User List
* Audit Log
* Learning Progress
* Question Statistics

---

# 7. Supported File Formats

Import:

* XLSX
* CSV
* JSON
* ZIP (Bulk Asset)

Future:

* XML
* DOCX
* PDF Import
* Google Sheets

Export:

* XLSX
* CSV
* PDF
* JSON

---

# 8. Technology Stack

| Component   | Technology                 |
| ----------- | -------------------------- |
| Queue       | Asynq                      |
| Storage     | Supabase Storage           |
| Spreadsheet | Excelize                   |
| CSV         | encoding/csv               |
| JSON        | encoding/json              |
| Validation  | go-playground/validator    |
| Report      | Excelize / gofpdf (Future) |

---

# 9. Directory Structure

```text id="g7v4pe"
internal/

modules/

import/

controller/

service/

parser/

validator/

worker/

repository/

dto/

export/

controller/

service/

generator/

worker/
```

---

# 10. Import Pipeline

```text id="f9d2wk"
Upload

↓

Storage

↓

Create Import Job

↓

Queue

↓

Worker

↓

Parser

↓

Validation

↓

Import Service

↓

Database

↓

Import Report
```

---

# 11. Export Pipeline

```text id="u5q8mx"
Export Request

↓

Queue

↓

Worker

↓

Query

↓

Generator

↓

Storage

↓

Notification
```

Export tidak dilakukan secara synchronous.

---

# 12. Upload Stage

File upload terlebih dahulu ke:

```text id="m4h1rs"
Supabase Storage
```

Metadata disimpan pada tabel:

```text id="w8k6nt"
import_jobs
```

---

# 13. Import Job Entity

Kolom utama:

* id
* file_name
* file_type
* object_key
* job_type
* status
* total_rows
* processed_rows
* success_rows
* failed_rows
* created_by
* created_at

---

# 14. Job Status

Status:

```text id="t2x7aj"
uploaded

queued

processing

completed

failed

cancelled
```

---

# 15. Parser Layer

Parser bertanggung jawab:

* Membaca file.
* Mapping kolom.
* Parsing data.
* Menghasilkan DTO.

Parser tidak memiliki business logic.

---

# 16. Validation Layer

Validasi meliputi:

* Required Field
* Data Type
* Enum
* Duplicate
* Foreign Key
* Business Rule

Data yang tidak valid dicatat dalam laporan error.

---

# 17. Batch Processing

Import diproses per batch.

Contoh:

```text id="r3y5lc"
100 rows

↓

Commit

↓

Next Batch
```

Ukuran batch dikonfigurasi melalui environment.

---

# 18. Transaction Strategy

Setiap batch menggunakan transaction sendiri.

```text id="q8w4fb"
Batch 1

Commit

Batch 2

Commit

Batch 3

Rollback
```

Batch lain tetap berhasil meskipun satu batch gagal.

---

# 19. Partial Failure

Contoh:

```text id="h7m2zk"
1000 Rows

↓

995 Success

↓

5 Failed
```

Import tetap selesai dengan laporan error.

---

# 20. Error Report

Error report berisi:

* Row Number
* Error Code
* Error Message
* Invalid Value
* Suggested Fix

Report dapat diunduh dalam format Excel atau CSV.

---

# 21. Question Import Pipeline

Flow:

```text id="k6p9nd"
Excel

↓

Parser

↓

Question DTO

↓

Validation

↓

Question Service

↓

Database
```

---

# 22. AI Assisted Import

Future:

```text id="x4j1ps"
Question

↓

AI Classification

↓

Metadata

↓

Validation

↓

Import
```

AI membantu melengkapi metadata yang belum tersedia.

---

# 23. Material Import

Import:

* Metadata
* PDF
* Video Reference
* Thumbnail
* Audio

File media diproses melalui File Storage Architecture.

---

# 24. User Import

Import mendukung:

* Student
* Teacher
* Admin (terbatas)

Password awal dapat dihasilkan otomatis atau melalui kebijakan onboarding.

---

# 25. Duplicate Detection

Strategi:

* Primary Key
* Unique Constraint
* Checksum
* Similarity Check (Question)

Mode:

* Skip
* Update
* Reject

Dipilih oleh pengguna saat memulai import.

---

# 26. Mapping Engine

Template mapping:

```text id="v5c8eq"
Excel Column

↓

DTO Field

↓

Entity
```

Mapping dapat dikonfigurasi untuk format file yang berbeda.

---

# 27. Export Generator

Generator menghasilkan:

* Excel
* CSV
* PDF

Business layer hanya mengirim DTO ke generator.

---

# 28. Export Flow

```text id="b2r6mf"
Query

↓

DTO

↓

Generator

↓

File

↓

Storage

↓

Notification
```

---

# 29. Export Storage

File hasil export:

* Disimpan di Supabase Storage.
* Menggunakan Signed URL.
* Memiliki masa berlaku (TTL).

File lama dibersihkan oleh background job.

---

# 30. Import Progress

Progress:

```text id="p9n4tw"
Processed

Success

Failed

Remaining

Estimated Time
```

Frontend dapat melakukan polling atau menggunakan SSE/WebSocket (future).

---

# 31. Notification

Saat selesai:

* In-App Notification.
* Email (opsional).

Isi notifikasi:

* Status.
* Total Data.
* Success.
* Failed.
* Link Download Report.

---

# 32. Security

Import hanya dapat dilakukan oleh role yang memiliki izin.

File:

* Dipindai validitas format.
* Dibatasi ukuran.
* Disimpan pada bucket private.

Import activity dicatat pada Audit Log.

---

# 33. Performance Targets

Target MVP:

| Operation  | Target             |
| ---------- | ------------------ |
| Import     | ≥ 5.000 row/menit  |
| Export     | ≥ 10.000 row/menit |
| Validation | < 2 ms/row         |
| Parser     | < 1 ms/row         |

Target bergantung pada kompleksitas validasi dan spesifikasi server.

---

# 34. Logging

Setiap job mencatat:

* Job ID
* File Name
* File Type
* Duration
* Total Rows
* Success Rows
* Failed Rows
* User ID

Konten file tidak dicatat pada log.

---

# 35. Monitoring

Metric:

* Import Count
* Export Count
* Average Duration
* Failure Rate
* Queue Length
* Throughput
* Validation Error Rate

Monitoring terintegrasi dengan observability platform.

---

# 36. Scalability

Pipeline mendukung horizontal scaling.

```text id="n8q3uv"
Queue

↓

Worker A

Worker B

Worker C
```

Import dan export dapat menggunakan worker yang berbeda.

---

# 37. Future Roadmap

Pengembangan berikutnya:

* Incremental Import.
* Scheduled Import.
* Google Drive Import.
* OneDrive Import.
* API Import.
* Streaming Import.
* Delta Export.
* Automatic Data Synchronization.
* AI Data Cleansing.
* OCR Import Pipeline.

---

# 38. Anti-Patterns

Tidak diperbolehkan:

* Import langsung dari Controller.
* Import seluruh file dalam satu transaction besar.
* Business logic di Parser.
* Menyimpan file sementara di filesystem production.
* Export synchronous untuk dataset besar.
* Mengabaikan laporan error.

---

# 39. Import & Export Checklist

Sebelum implementasi:

* Queue digunakan.
* Batch Processing diterapkan.
* Parser terpisah.
* Validation Layer tersedia.
* Partial Failure didukung.
* Error Report tersedia.
* Logging aktif.
* Monitoring aktif.
* Audit Trail tersedia.
* Unit & integration test tersedia.

---

# 40. Relationship dengan Arsitektur Lain

Pipeline ini terintegrasi dengan:

```text id="s1m7zk"
File Storage Architecture

↓

Background Job

↓

AI Service

↓

Question Generation Pipeline

↓

Notification Architecture

↓

Audit Logging

↓

Question Bank
```

Import & Export Pipeline menjadi gerbang utama untuk migrasi data, otomatisasi bank soal, dan integrasi sistem eksternal.

---

# 41. Summary

Import & Export Pipeline YakinLulus.id dibangun menggunakan pendekatan **Asynchronous Batch Processing** dengan **Redis + Asynq**, **Supabase Storage**, dan **Parser–Validator–Service Pattern**.

Arsitektur ini memberikan:

* Pemrosesan dataset besar secara efisien.
* Dukungan partial failure tanpa menggagalkan seluruh proses.
* Audit dan monitoring yang lengkap.
* Integrasi penuh dengan AI Question Generation Pipeline.
* Fondasi yang siap berkembang menuju sinkronisasi data otomatis dan pipeline ETL berskala enterprise.
