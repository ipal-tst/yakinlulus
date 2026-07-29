Saya menyarankan **12_question_import.md** menjadi salah satu dokumen paling detail dalam keseluruhan spesifikasi, karena berdasarkan kebutuhan YakinLulus.id, sebagian besar bank soal akan berasal dari **import massal** (Excel) yang kemudian diperkaya oleh AI.

Import ini sebaiknya diposisikan sebagai **ETL (Extract → Transform → Load) Pipeline**, bukan sekadar upload file Excel.

---

````markdown
# 12_question_import.md

# Question Import Specification

Version : 1.0

---

# 1. Overview

Question Import bertanggung jawab melakukan proses import soal secara massal dari berbagai sumber ke Question Bank.

Tujuan:

- mempercepat migrasi bank soal
- menjaga kualitas data
- mendukung AI enrichment
- mendukung validasi otomatis
- mendukung jutaan soal

Import berjalan secara asynchronous.

---

# 2. Supported Sources

MVP

- Excel (.xlsx)
- CSV

Phase 2

- JSON
- XML
- ZIP Package

Future

- Moodle XML
- IMS QTI
- Google Form
- REST API
- OCR
- PDF Parsing
- Word Document
- Image Recognition

---

# 3. Import Pipeline

```
Upload File

↓

File Validation

↓

File Parsing

↓

Data Transformation

↓

Metadata Validation

↓

AI Enrichment

↓

Duplicate Detection

↓

Business Validation

↓

Question Preview

↓

Import Confirmation

↓

Background Processing

↓

Question Bank
```

---

# 4. Import Modes

## Full Import

Seluruh data dianggap baru.

---

## Incremental Import

Data lama dipertahankan.

Question baru ditambahkan.

---

## Update Import

Data lama diperbarui berdasarkan External ID.

---

## Upsert

Jika ada

↓

Update

Jika tidak

↓

Insert

---

# 5. Import File Structure

Contoh sederhana.

| Column | Required |
|----------|----------|
| Question Code | Optional |
| Question | ✓ |
| Option A | ✓ |
| Option B | ✓ |
| Option C | ✓ |
| Option D | ✓ |
| Correct Answer | ✓ |
| Explanation | ✓ |
| Curriculum | ✓ |
| Grade | ✓ |
| Subject | ✓ |
| Chapter | ✓ |
| Difficulty | ✓ |

Kolom tambahan dapat ditambahkan melalui template.

---

# 6. Attachment Import

Attachment dapat berupa:

- Image
- Audio
- Video
- PDF

Strategi:

```
Excel

↓

Relative Path

↓

ZIP Package

↓

Object Storage
```

---

# 7. Story Question Import

Satu Story dapat memiliki banyak Question.

```
Story ID

↓

Question 1

Question 2

Question 3
```

Importer harus mempertahankan relasi tersebut.

---

# 8. Parsing Stage

Parser membaca file.

Tahapan:

- header validation
- row parsing
- type conversion
- encoding validation
- unicode normalization

---

# 9. Transformation Stage

Data diubah menjadi format internal.

Contoh.

```
Grade

"Kelas XII"

↓

grade_id

12
```

Semua lookup dilakukan pada tahap ini.

---

# 10. Metadata Mapping

Kolom import dipetakan menjadi metadata.

Contoh

```
Subject

↓

subject_id

Difficulty

↓

difficulty_id

Chapter

↓

chapter_id
```

---

# 11. Validation Rules

Validasi dilakukan per baris.

Pemeriksaan:

- mandatory field
- enum
- foreign key
- duplicate option
- answer exists
- attachment exists
- metadata consistency

---

# 12. Duplicate Detection

Duplicate diperiksa berdasarkan:

- Question Code
- External ID
- Exact Stem
- Semantic Similarity
- AI Duplicate Score

Kemiripan tinggi akan ditandai untuk review.

---

# 13. AI Enrichment

Jika diaktifkan.

AI dapat:

- memperbaiki typo
- menyarankan Bloom
- memprediksi Difficulty
- menghasilkan Tags
- membuat Embedding
- mendeteksi bahasa
- menyarankan metadata

AI tidak langsung mengubah data tanpa aturan yang dikonfigurasi.

---

# 14. Preview Mode

Sebelum commit.

User dapat melihat:

- total row
- valid row
- invalid row
- duplicate
- warning

Import belum disimpan ke database.

---

# 15. Commit Stage

Jika disetujui.

```
Preview

↓

Commit

↓

Background Job

↓

Question Created
```

Commit dilakukan dalam batch.

---

# 16. Batch Processing

Import besar diproses per batch.

Contoh.

```
10.000 Question

↓

500 / Batch

↓

20 Batch
```

Batch yang gagal tidak membatalkan batch lain, kecuali dikonfigurasi sebagai transaksi penuh.

---

# 17. Transaction Strategy

Per batch menggunakan transaksi database.

```
BEGIN

↓

Insert

↓

Validation

↓

COMMIT

atau

ROLLBACK
```

---

# 18. Error Handling

Jenis error.

- Invalid Header
- Invalid Metadata
- Duplicate
- Missing Answer
- Missing Attachment
- Invalid Option
- Database Error

Semua error disimpan dalam laporan import.

---

# 19. Import Report

Setelah selesai.

Laporan berisi:

- Total Row
- Imported
- Updated
- Skipped
- Duplicate
- Failed
- Duration
- User

Laporan dapat diunduh.

---

# 20. Background Jobs

Job yang dijalankan:

- Parse File
- Validate Data
- Upload Attachment
- Generate Embedding
- Duplicate Scan
- AI Enrichment
- Search Index Update

---

# 21. Database Objects

```
import_job

import_batch

import_row

import_error

question

question_version

question_metadata

question_attachment
```

---

# 22. Domain Events

```
ImportStarted

FileValidated

BatchStarted

BatchCompleted

QuestionImported

QuestionSkipped

ImportCompleted

ImportFailed
```

---

# 23. Security

Hanya role berikut yang dapat melakukan import:

- Admin
- Staff
- Teacher (sesuai izin)

File diperiksa terhadap:

- ukuran maksimum
- tipe file
- malware (opsional)
- macro berbahaya
- ekstensi palsu

Semua aktivitas dicatat pada Audit Log.

---

# 24. Performance Target

| Process | Target |
|----------|---------|
| Upload Validation | < 5 detik |
| Parse 10.000 Row | < 60 detik |
| Preview Generation | < 10 detik |
| Commit per Batch | < 5 detik |
| AI Enrichment | Asynchronous |

---

# 25. Retry Strategy

Jika batch gagal.

```
Batch Failed

↓

Retry

↓

Maximum 3 Times

↓

Manual Intervention
```

Retry hanya dijalankan untuk batch yang gagal.

---

# 26. Import Template Version

Setiap template memiliki versi.

Contoh.

```
Question Import Template

v1.0

v2.0

v3.0
```

Backend harus tetap kompatibel dengan versi lama selama masa transisi yang ditentukan.

---

# 27. Monitoring

Metrik yang dipantau:

- Import Duration
- Rows per Second
- Success Rate
- Error Rate
- AI Processing Time
- Queue Length
- Batch Retry Count

---

# 28. Future Roadmap

- PDF OCR Import
- Word Import
- Moodle XML Import
- IMS QTI Import
- AI Auto Correction
- AI Auto Explanation
- AI Auto Distractor Generation
- Collaborative Import
- Scheduled Import
- Incremental Synchronization
- Cloud Storage Import
- External Question Bank Connector
````

# Rekomendasi Arsitektur

Saya menyarankan import dibangun sebagai **ETL Pipeline** yang terpisah dari service CRUD Question.

```text
                Upload API
                     │
                     ▼
              Import Service
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   File Parser   Validator   AI Enrichment
       │             │             │
       └─────────────┼─────────────┘
                     ▼
             Transformation Layer
                     │
                     ▼
              Batch Processor
                     │
                     ▼
             Question Repository
                     │
                     ▼
               Background Jobs
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/import/
│
├── parser/
│   ├── excel_parser.go
│   ├── csv_parser.go
│   └── mapper.go
│
├── validator/
│   ├── metadata_validator.go
│   ├── business_validator.go
│   └── duplicate_validator.go
│
├── transformer/
│   ├── metadata_mapper.go
│   ├── attachment_mapper.go
│   └── question_builder.go
│
├── batch/
│   ├── processor.go
│   ├── transaction.go
│   └── retry.go
│
├── report/
│   ├── summary.go
│   └── exporter.go
│
└── service.go
```

### Penyempurnaan khusus untuk YakinLulus.id

Berdasarkan kebutuhan proyek sebelumnya, saya merekomendasikan setiap proses import menghasilkan **Import Manifest** yang menyimpan informasi seperti:

* `import_job_id`
* `template_version`
* `source_type`
* `source_file_checksum`
* `total_rows`
* `success_rows`
* `failed_rows`
* `duplicate_rows`
* `ai_processed_rows`
* `processing_duration`
* `imported_by`

Manifest ini akan menjadi sumber utama untuk audit, troubleshooting, rollback, serta analisis kualitas data hasil import. Selain itu, simpan checksum file sumber (misalnya SHA-256) untuk mencegah import ulang file yang sama secara tidak sengaja.
