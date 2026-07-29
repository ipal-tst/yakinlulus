Dokumen berikutnya (**13_question_export.md**) sebaiknya dirancang bukan hanya untuk ekspor Excel, tetapi sebagai **Data Export Framework**. Dengan demikian, modul ini dapat melayani kebutuhan operasional, backup, migrasi, integrasi, AI training, dan pertukaran data dengan sistem lain tanpa perubahan arsitektur besar.

---

````markdown
# 13_question_export.md

# Question Export Specification

Version : 1.0

---

# 1. Overview

Question Export bertanggung jawab menghasilkan data Question Bank dalam berbagai format
untuk kebutuhan:

- Backup
- Migration
- Reporting
- AI Training
- External Integration
- Data Exchange
- Offline Review
- Academic Audit

Export dilakukan secara asynchronous untuk dataset besar.

---

# 2. Export Architecture

```
User Request
      │
      ▼
Export API
      │
      ▼
Authorization
      │
      ▼
Export Builder
      │
      ▼
Metadata Loader
      │
      ▼
Attachment Resolver
      │
      ▼
Formatter
      │
      ▼
File Generator
      │
      ▼
Object Storage
      │
      ▼
Download Link
```

---

# 3. Supported Export Formats

MVP

- Excel (.xlsx)
- CSV
- JSON

Phase 2

- ZIP Package
- PDF
- HTML

Future

- IMS QTI
- Moodle XML
- XML
- NDJSON
- Parquet
- AI Dataset Format

---

# 4. Export Modes

## Full Export

Seluruh data sesuai filter.

---

## Incremental Export

Hanya data yang berubah sejak waktu tertentu.

---

## Snapshot Export

Menghasilkan snapshot sesuai kondisi pada waktu tertentu.

---

## Version Export

Mengekspor versi tertentu dari Question.

---

## Audit Export

Menyertakan histori review, audit, dan version.

---

# 5. Export Scope

Data yang dapat dipilih.

- Question
- Version
- Metadata
- Option
- Answer
- Explanation
- Attachment
- Statistics
- Review History
- Audit Log
- AI Metadata

---

# 6. Export Filters

Academic

- Curriculum
- Grade
- Subject
- Chapter
- Topic

Classification

- Difficulty
- Bloom
- HOTS
- Question Type

Lifecycle

- Draft
- Published
- Archived

Source

- Official
- Manual
- AI Generated

Date

- Created
- Updated
- Published

---

# 7. Attachment Export

Mode.

## Metadata Only

Hanya URL atau reference.

---

## Embedded

File dimasukkan ke ZIP.

---

## External Link

Menggunakan Signed URL.

---

# 8. Export Package Structure

```
question_export.zip

│

├── manifest.json

├── questions.xlsx

├── metadata.json

├── attachments/

├── images/

├── audio/

├── video/

└── checksum.sha256
```

---

# 9. Manifest

Manifest menyimpan informasi export.

Field.

- export_id
- export_version
- created_at
- exported_by
- total_question
- total_attachment
- source_system
- checksum
- export_format

---

# 10. Export Builder

Builder bertugas.

- memuat data
- menyusun relasi
- memvalidasi integritas
- membangun dataset

---

# 11. Export Validation

Sebelum file dibuat.

Validasi.

- data tersedia
- permission
- attachment valid
- checksum
- storage access

---

# 12. Export Template

Excel menggunakan template resmi.

Worksheet.

- Question
- Metadata
- Attachment
- Tag
- Statistics

Template memiliki version.

---

# 13. Version Handling

Mode.

Current Version

↓

Published Version

↓

Specific Version

↓

All Versions

---

# 14. Sensitive Data

Secara default tidak diekspor.

- Internal Note
- AI Prompt
- Audit Internal
- Secret Configuration
- User Information

Hanya Admin dengan izin khusus yang dapat menyertakannya.

---

# 15. Export Performance

Target.

| Dataset | Target |
|----------|---------|
| 1.000 Question | < 10 detik |
| 10.000 Question | < 60 detik |
| 100.000 Question | Asynchronous |

---

# 16. Background Processing

Dataset besar diproses melalui queue.

Tahapan.

Create Job

↓

Generate Dataset

↓

Generate File

↓

Upload Storage

↓

Notify User

---

# 17. Download Strategy

File hasil export disimpan pada Object Storage.

Menggunakan:

Signed URL

Expired Link

TTL default:

24 Jam

---

# 18. Compression

ZIP digunakan jika:

- terdapat attachment
- ukuran file besar
- format lebih dari satu

---

# 19. Database Objects

```
export_job

export_batch

export_file

question

question_version

question_metadata

question_attachment
```

---

# 20. Domain Events

```
ExportRequested

ExportStarted

ExportCompleted

ExportFailed

DownloadGenerated

DownloadExpired
```

---

# 21. Security

Role.

Student

×

Teacher

✓ (sesuai hak akses)

Staff

✓

Admin

✓

Super Admin

✓

Semua export dicatat dalam Audit Log.

---

# 22. Audit Information

Audit menyimpan.

- User
- Time
- Filter
- Result Count
- Format
- Duration
- IP
- Device

---

# 23. Failure Handling

Jika proses gagal.

↓

Retry

↓

Maximum

3 kali

↓

Manual Review

File sementara dibersihkan secara otomatis.

---

# 24. Monitoring

Metrik.

- Export Duration
- Queue Time
- Success Rate
- Failure Rate
- Average File Size
- Storage Usage
- Download Count

---

# 25. Integration

Export dapat digunakan oleh.

- AI Pipeline
- Reporting
- BI Dashboard
- External LMS
- Backup System
- Migration Tool

---

# 26. Future Roadmap

- Scheduled Export
- Differential Export
- Streaming Export
- Graph Export
- Data Warehouse Export
- Cloud Storage Export
- S3 Direct Export
- Google Drive Export
- OneDrive Export
- Delta Sync
````

---

# Rekomendasi Arsitektur

Untuk skala bank soal besar, proses export sebaiknya dipisahkan dari API utama dan dijalankan sebagai background job.

```text
                 Export API
                      │
                      ▼
              Export Job Service
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Data Loader   File Generator   Attachment Resolver
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              Object Storage
                      │
                      ▼
             Signed Download URL
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/export/
│
├── builder/
│   ├── dataset_builder.go
│   ├── manifest_builder.go
│   └── package_builder.go
│
├── formatter/
│   ├── excel_formatter.go
│   ├── csv_formatter.go
│   ├── json_formatter.go
│   └── zip_formatter.go
│
├── storage/
│   ├── uploader.go
│   ├── signed_url.go
│   └── cleanup.go
│
├── report/
│   ├── summary.go
│   └── metrics.go
│
└── service.go
```

## Penyempurnaan untuk YakinLulus.id

Agar konsisten dengan modul **Import**, saya merekomendasikan setiap proses export menghasilkan **Export Manifest** yang terdigitalisasi dan terversi. Manifest ini menjadi referensi utama ketika file digunakan untuk:

* restore ke sistem lain;
* sinkronisasi antar lingkungan (development, UAT, production);
* AI dataset generation;
* audit dan forensik;
* backup jangka panjang.

Manifest minimal berisi:

* `export_job_id`
* `export_version`
* `schema_version`
* `generated_at`
* `generated_by`
* `filter_summary`
* `question_count`
* `attachment_count`
* `included_versions`
* `checksum_sha256`
* `file_size`
* `compression_type`

Dengan pendekatan ini, modul **Import** dan **Export** menjadi pasangan yang simetris (ETL ↔ Reverse ETL), sehingga migrasi, backup, dan integrasi eksternal dapat dilakukan dengan aman dan dapat direproduksi.
