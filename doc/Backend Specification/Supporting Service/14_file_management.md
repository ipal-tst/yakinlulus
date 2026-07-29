# 14_file_management.md

# YakinLulus.id Backend Specification — File Management Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

File Management Module bertanggung jawab mengelola seluruh siklus hidup file pada platform YakinLulus.id, mulai dari proses upload, penyimpanan, validasi, akses, distribusi, hingga penghapusan.

Modul ini menjadi layanan bersama (Shared Infrastructure Module) yang digunakan oleh seluruh domain, termasuk:

* User Management
* School Management
* Question Bank
* Material
* Exam
* CBT Runtime
* Analytics
* AI Service
* Notification

Implementasi menggunakan **Supabase Storage** sebagai object storage utama dengan mekanisme Signed URL untuk menjaga keamanan akses.

---

# 2. Module Responsibility

Module bertanggung jawab terhadap:

* File Upload
* File Download
* File Metadata
* File Versioning
* Storage Bucket Management
* Signed URL Management
* File Validation
* File Compression
* Image Optimization
* Thumbnail Generation
* File Preview
* File Deletion
* Storage Quota
* File Audit

Module ini **tidak bertanggung jawab** terhadap:

* Business Data
* User Authentication
* AI Processing
* Content Versioning

---

# 3. Architecture Position

```text
                     All Backend Modules
                             │
                             ▼
                ==========================
                File Management Service
                ==========================
                   │        │         │
                   ▼        ▼         ▼
             Supabase   CDN Cache   Metadata DB
              Storage
```

---

# 4. Business Objectives

File Management dirancang untuk:

* Menjadi layanan penyimpanan terpusat.
* Mendukung upload file besar.
* Mendukung multimedia pembelajaran.
* Menjamin keamanan akses file.
* Mendukung skalabilitas jutaan file.
* Mengurangi beban Backend API.

---

# 5. Supported File Type

## MVP

Images

* JPG
* JPEG
* PNG
* WEBP
* SVG

Documents

* PDF
* DOCX
* XLSX
* PPTX

Media

* MP4
* MP3

Archive

* ZIP

---

## Roadmap

* WEBM
* MOV
* AVI
* EPUB
* GIF
* GLB
* OBJ
* HTML Package
* SCORM Package

---

# 6. Actors

* Platform Admin
* Academic Admin
* Teacher
* Student
* AI Service
* Background Worker

---

# 7. RBAC

```text
file.read

file.upload

file.download

file.delete

file.restore

file.manage_bucket

file.generate_signed_url
```

---

# 8. Business Rules

### BR-001

Semua file wajib memiliki metadata.

---

### BR-002

File disimpan menggunakan UUID.

---

### BR-003

Nama file asli tetap disimpan sebagai metadata.

---

### BR-004

Soft Delete digunakan untuk metadata.

---

### BR-005

Signed URL memiliki masa berlaku terbatas.

---

### BR-006

File yang masih direferensikan oleh entity lain tidak dapat dihapus permanen.

---

### BR-007

Seluruh upload harus melalui validasi MIME Type.

---

### BR-008

Ukuran maksimum file mengikuti konfigurasi sistem.

---

### BR-009

Seluruh akses file dicatat pada Audit Log.

---

# 9. Data Model

Entity utama:

```text
files

file_versions

file_access_logs

storage_buckets

file_references

file_thumbnails

file_previews
```

---

# 10. Relationships

```text
User
School
Question
Material
Exam
AI
Notification
        │
        ▼
 File Metadata
        │
        ▼
 Supabase Storage
```

---

# 11. File Metadata

Metadata utama:

* File ID
* Original Name
* Stored Name
* Extension
* MIME Type
* File Size
* Bucket
* Folder
* Uploaded By
* Uploaded At
* Hash (SHA-256)
* Status
* Visibility
* Version

---

# 12. Storage Bucket

Bucket utama:

```text
avatars/

school-logo/

question-image/

question-audio/

question-video/

material-image/

material-video/

material-pdf/

material-audio/

exam-cover/

exam-banner/

certificate/

reports/

attachments/

temporary/

ai-generated/

exports/

imports/
```

Bucket dipisahkan berdasarkan domain untuk memudahkan lifecycle management.

---

# 13. Folder Convention

```text
bucket/

YYYY/

MM/

UUID.ext
```

Contoh:

```text
question-image/

2026/

07/

550e8400-e29b-41d4-a716-446655440000.png
```

---

# 14. Upload Flow

```text
Client

↓

Backend API

↓

Permission Validation

↓

Generate Signed Upload URL

↓

Upload to Supabase Storage

↓

Verify Upload

↓

Save Metadata

↓

Response
```

Backend tidak menerima file besar secara langsung.

---

# 15. Download Flow

```text
Client

↓

Backend

↓

Permission Check

↓

Generate Signed URL

↓

Client Download

↓

Access Log
```

---

# 16. Supported Operation

* Upload
* Download
* Preview
* Replace
* Soft Delete
* Restore
* Permanent Delete
* Copy
* Move
* Rename Metadata
* Generate Thumbnail
* Generate Preview

---

# 17. Functional Specification

Fitur:

* Upload File
* Download File
* Get Metadata
* Delete File
* Restore File
* Replace File
* Generate Signed URL
* Preview File
* Search File
* List Bucket
* Storage Statistics

---

# 18. DTO

## Upload Request

```json
{
  "bucket": "question-image",
  "filename": "diagram.png",
  "mime_type": "image/png"
}
```

---

## Upload Response

```json
{
  "upload_url": "...",
  "file_id": "uuid"
}
```

---

# 19. Validation Rules

| Field     | Rule                  |
| --------- | --------------------- |
| Bucket    | Required              |
| MIME Type | Allowed               |
| File Size | <= Config             |
| Extension | Allowed               |
| Hash      | Generated Server Side |

---

# 20. API Summary

```text
POST   /api/v1/files/upload-url

POST   /api/v1/files

GET    /api/v1/files

GET    /api/v1/files/{id}

GET    /api/v1/files/{id}/download

GET    /api/v1/files/{id}/preview

DELETE /api/v1/files/{id}

POST   /api/v1/files/{id}/restore

POST   /api/v1/files/{id}/replace
```

---

# 21. Service Layer

```text
FileService

CreateUploadURL()

VerifyUpload()

Download()

Preview()

Delete()

Restore()

Replace()

GenerateThumbnail()

GeneratePreview()

Search()
```

---

# 22. Repository Layer

```text
FileRepository

BucketRepository

ReferenceRepository

AccessLogRepository

ThumbnailRepository
```

---

# 23. Transaction Flow

```text
Generate Signed URL

↓

Upload

↓

Verify

↓

Save Metadata

↓

Create Audit Log

↓

Commit
```

---

# 24. Event Publishing

```text
file.uploaded

file.deleted

file.restored

file.downloaded

file.replaced

file.preview.generated

thumbnail.generated
```

---

# 25. Background Job

Worker:

* Image Compression
* Thumbnail Generation
* PDF Preview Generation
* Video Thumbnail Extraction
* Orphan File Cleanup
* Expired Temporary File Cleanup
* Virus Scan (Roadmap)
* Storage Statistics Aggregation

---

# 26. Cache Strategy

Redis menyimpan:

* File Metadata
* Bucket Statistics
* Frequently Accessed Files
* Signed URL Cache (metadata only)

TTL

```text
30 Minutes
```

---

# 27. Search Strategy

Filter:

* File Name
* Extension
* MIME Type
* Bucket
* Owner
* Upload Date
* File Size
* Status

Sorting:

* Upload Date
* Name
* Size

---

# 28. Storage Strategy

Primary Storage

* Supabase Storage

Future

* Cloudflare R2
* Amazon S3
* Google Cloud Storage
* Azure Blob Storage

Storage provider diakses melalui abstraction layer agar mudah diganti tanpa mengubah business logic.

---

# 29. Security Rules

Implementasi keamanan:

* JWT Authentication
* RBAC Authorization
* Signed URL
* MIME Type Validation
* File Size Validation
* SHA-256 Integrity Check
* Rate Limiting
* Audit Logging

Roadmap:

* Antivirus Scan
* Malware Detection
* Content Scanning
* DLP (Data Loss Prevention)

---

# 30. Audit Log

Audit mencatat:

* Upload
* Download
* Delete
* Restore
* Replace
* Preview
* Bucket Change
* Permission Failure

---

# 31. Error Handling

| Code               | Description                |
| ------------------ | -------------------------- |
| FILE_NOT_FOUND     | File tidak ditemukan       |
| INVALID_FILE_TYPE  | Jenis file tidak diizinkan |
| FILE_TOO_LARGE     | Ukuran file melebihi batas |
| STORAGE_ERROR      | Kesalahan penyimpanan      |
| INVALID_SIGNED_URL | Signed URL tidak valid     |
| FILE_IN_USE        | File masih direferensikan  |
| ACCESS_DENIED      | Akses ditolak              |

---

# 32. Sequence Diagram

```text
Client

↓

File API

↓

Permission Service

↓

Supabase Storage

↓

Metadata Repository

↓

Audit Log

↓

Response
```

---

# 33. Integration

File Management digunakan oleh:

* Authentication
* User Management
* School Management
* Question Bank
* Material
* Exam
* CBT Runtime
* Analytics
* AI Service
* Notification

Seluruh modul yang memerlukan penyimpanan file harus menggunakan File Management sebagai abstraction layer.

---

# 34. Performance Target

| Metric                  | Target   |
| ----------------------- | -------- |
| Generate Upload URL     | < 100 ms |
| Verify Upload           | < 200 ms |
| Metadata Retrieval      | < 100 ms |
| Download URL Generation | < 100 ms |
| Preview URL Generation  | < 100 ms |

Performa upload dan download bergantung pada jaringan pengguna dan layanan object storage.

---

# 35. Test Scenario

### Unit Test

* Generate Upload URL
* Verify Upload
* Download
* Delete
* Restore
* Replace

### Integration Test

* Upload ke Supabase Storage
* Download melalui Signed URL
* Metadata Synchronization
* Thumbnail Generation
* Preview Generation

### Security Test

* Invalid MIME Type
* Oversized File
* Unauthorized Download
* Expired Signed URL
* Broken Access Control
* Path Traversal Attempt

---

# 36. Future Enhancement

* Multi Cloud Storage
* CDN Integration
* Chunk Upload
* Resumable Upload
* Deduplication berdasarkan Hash
* AI Image Optimization
* AI Content Moderation
* Automatic Format Conversion
* Smart Lifecycle Policy
* Cross Region Replication

---

# 37. Dependencies

Module bergantung pada:

* Authentication
* Configuration Management
* Redis
* Supabase Storage
* Logging
* Audit

Module ini menjadi dependency bagi:

* User Management
* School Management
* Question Bank
* Material
* Exam
* AI Service
* Analytics
* Notification
* Report Export

---

# 38. Acceptance Criteria

Module dinyatakan selesai apabila:

* Upload menggunakan Signed URL berjalan.
* Metadata tersimpan dengan benar.
* Download aman melalui Signed URL.
* Thumbnail dan Preview dapat dibuat.
* File yang masih direferensikan tidak dapat dihapus permanen.
* Audit Log tersedia.
* Cache berjalan dengan baik.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 39. Summary

File Management Module merupakan layanan infrastruktur bersama yang menyediakan mekanisme penyimpanan file yang aman, skalabel, dan terpusat untuk seluruh domain YakinLulus.id. Dengan memanfaatkan Supabase Storage, Signed URL, metadata terstruktur, serta abstraction layer terhadap penyedia object storage, modul ini mampu mendukung kebutuhan penyimpanan konten pembelajaran, media, dokumen, dan aset sistem dari skala MVP hingga implementasi berskala nasional.
