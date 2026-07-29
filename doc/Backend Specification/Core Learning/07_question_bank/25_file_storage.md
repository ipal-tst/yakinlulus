Saya menganggap **25_file_storage.md** sebagai dokumen yang sangat penting karena hampir seluruh aset pada Question Bank akan berupa file, bukan hanya teks. Berdasarkan PRD YakinLulus.id, soal dapat memiliki **gambar, audio, video, PDF, SVG, formula, bahkan aset AI**. Oleh karena itu, penyimpanan file harus dipisahkan dari PostgreSQL dan menggunakan **Object Storage**.

Saya juga menyarankan desain **storage-agnostic**, sehingga bisa menggunakan MinIO (self-hosted), S3, Cloudflare R2, Google Cloud Storage, atau Azure Blob tanpa mengubah business logic.

---

````markdown
# 25_file_storage.md

# Question Bank File Storage Specification

Version : 1.0

---

# 1. Overview

Question Bank menggunakan Object Storage
untuk menyimpan seluruh aset digital.

Database hanya menyimpan metadata file.

Object Storage menjadi media penyimpanan utama.

---

# 2. Objectives

Storage digunakan untuk.

- Question Image
- Diagram
- SVG
- Audio
- Video
- PDF
- Attachment
- AI Generated Image
- OCR Result
- Thumbnail

---

# 3. Architecture

```
Client

↓

REST API

↓

Storage Service

↓

Object Storage

↓

CDN (Future)
```

---

# 4. Supported Storage

MVP.

- MinIO
- Amazon S3
- Cloudflare R2

Future.

- Google Cloud Storage
- Azure Blob
- Backblaze B2

Storage dipilih melalui konfigurasi.

---

# 5. File Categories

Kategori.

Question

Explanation

Material

Attachment

Audio

Video

Image

PDF

AI Asset

OCR

Export

Import

---

# 6. Storage Structure

```
question-bank/

├── question/

├── explanation/

├── attachment/

├── audio/

├── video/

├── image/

├── pdf/

├── ai/

├── import/

└── export/
```

---

# 7. File Naming

Menggunakan.

UUID

+

Extension

Contoh.

```
4db96b9d.webp

f3294fd2.pdf

1ab994e7.mp4
```

Tidak menggunakan nama asli.

---

# 8. Metadata

Database menyimpan.

- file_id
- object_key
- bucket
- mime_type
- size
- checksum
- width
- height
- duration
- uploaded_at

---

# 9. MIME Validation

Contoh.

Image

- image/png
- image/jpeg
- image/webp
- image/svg+xml

Audio

- audio/mpeg
- audio/ogg

Video

- video/mp4

Document

- application/pdf

---

# 10. Upload Flow

```
Client

↓

Upload Request

↓

Validation

↓

Object Storage

↓

Metadata Save

↓

Commit
```

---

# 11. Download Flow

```
Request

↓

Permission

↓

Signed URL

↓

Object Storage
```

File tidak di-stream melalui API jika tidak diperlukan.

---

# 12. Signed URL

Semua download menggunakan.

Temporary Signed URL

Default TTL.

15 Menit

---

# 13. File Validation

Validasi.

- MIME
- Extension
- File Size
- Virus Scan (opsional)
- Duplicate Check
- Image Integrity

---

# 14. Image Processing

Background Worker.

↓

Resize

↓

Thumbnail

↓

Compress

↓

Optimize

↓

Save

---

# 15. Video Processing

Worker.

↓

Transcode

↓

Thumbnail

↓

Metadata

↓

Duration

↓

Save

---

# 16. Audio Processing

Worker.

↓

Normalize

↓

Waveform

↓

Metadata

↓

Duration

---

# 17. PDF Processing

Worker.

↓

Preview Image

↓

Page Count

↓

OCR (Future)

↓

Metadata

---

# 18. File Versioning

Setiap perubahan.

↓

New Object

↓

New Metadata

↓

Old Object tetap tersedia sesuai kebijakan retensi.

---

# 19. Duplicate Detection

Menggunakan.

SHA256

Jika file identik.

↓

Reuse Object

↓

Metadata Baru

---

# 20. Security

Semua file.

Private

Secara default.

Akses menggunakan Signed URL.

---

# 21. Lifecycle

```
Uploaded

↓

Validated

↓

Processed

↓

Published

↓

Archived

↓

Deleted
```

---

# 22. Cleanup Strategy

Job.

Delete Temp File

Delete Expired Export

Delete Orphan Object

Cleanup Failed Upload

---

# 23. Storage Quota

Quota dapat diterapkan berdasarkan.

- Tenant (Future)
- Organization (Future)
- User
- Job

---

# 24. Backup

Object Storage dibackup.

Daily

↓

Snapshot

↓

Replication (Future)

---

# 25. Monitoring

Dipantau.

- Storage Usage
- Upload Count
- Download Count
- Failed Upload
- Average File Size
- Object Count

---

# 26. Database Objects

```
file_asset

question_attachment

material_attachment

export_file

import_file
```

---

# 27. Performance Target

| Operation | Target |
|-----------|---------|
| Upload | < 2 detik |
| Download URL | < 100 ms |
| Metadata Save | < 20 ms |
| Thumbnail | < 5 detik |

---

# 28. Disaster Recovery

Jika upload gagal.

↓

Rollback Metadata

↓

Cleanup Temp Object

↓

Retry

---

# 29. Future Roadmap

- Multi Bucket
- CDN
- Geo Replication
- Image CDN
- Video Streaming
- DRM
- OCR Pipeline
- AI Asset Management
````

---

# Rekomendasi Arsitektur

Saya menyarankan seluruh akses file melalui **Storage Service** sehingga aplikasi tidak bergantung pada vendor tertentu.

```text
                 REST API
                     │
                     ▼
              Storage Service
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 Upload API     Download API    Delete API
                     │
                     ▼
              Storage Provider
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
   MinIO           S3             Cloudflare R2
                     │
                     ▼
              Object Storage
```

---

# Struktur package Go yang direkomendasikan

```text
internal/storage/
│
├── provider/
│   ├── provider.go
│   ├── minio.go
│   ├── s3.go
│   ├── r2.go
│   └── gcs.go
│
├── upload/
│   ├── uploader.go
│   ├── validator.go
│   └── checksum.go
│
├── download/
│   ├── signed_url.go
│   ├── downloader.go
│   └── permission.go
│
├── processor/
│   ├── image.go
│   ├── video.go
│   ├── audio.go
│   ├── pdf.go
│   └── thumbnail.go
│
├── cleanup/
│   ├── orphan.go
│   ├── expired.go
│   └── temp.go
│
└── service.go
```

# Penyempurnaan Khusus untuk YakinLulus.id

Berdasarkan kebutuhan platform, saya merekomendasikan tambahan berikut:

## 1. Logical Asset Model

Pisahkan antara **File Asset** dan **Business Attachment**.

```
file_asset
    │
    ├── checksum
    ├── mime_type
    ├── object_key
    ├── bucket
    └── size

question_attachment
    │
    ├── question_id
    ├── file_asset_id
    ├── attachment_role
    └── display_order
```

Dengan model ini, satu file fisik dapat digunakan oleh banyak soal, materi, atau pembahasan tanpa duplikasi penyimpanan.

## 2. Attachment Role

Tambahkan klasifikasi peran file, misalnya:

* `QUESTION_IMAGE`
* `QUESTION_AUDIO`
* `QUESTION_VIDEO`
* `EXPLANATION_IMAGE`
* `EXPLANATION_VIDEO`
* `REFERENCE_DOCUMENT`
* `OCR_SOURCE`
* `AI_GENERATED`

Hal ini memudahkan rendering di frontend dan pemrosesan AI.

## 3. Background Processing

Semua proses berat dijalankan melalui worker:

* resize gambar;
* optimasi WebP/AVIF;
* pembuatan thumbnail;
* ekstraksi metadata;
* transcode video;
* OCR PDF (fase berikutnya).

## 4. Content-Addressable Storage

Selain `object_key`, simpan `sha256` sebagai identitas konten. Dengan demikian:

* file identik tidak disimpan dua kali;
* backup lebih efisien;
* integritas file dapat diverifikasi;
* deduplikasi menjadi sederhana.

Strategi ini akan membuat sistem penyimpanan aset YakinLulus.id efisien, vendor-independent, dan siap menangani jutaan file tanpa perubahan arsitektur mendasar.
