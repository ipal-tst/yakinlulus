# File Upload API

**Document** : `api/17_file_upload_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **File Upload API** pada YakinLulus.id.

File Upload API merupakan layanan terpusat (centralized file service) untuk seluruh proses unggah, validasi, penyimpanan, pengambilan, dan penghapusan file.

Semua modul menggunakan layanan ini, antara lain:

- User Profile
- Question Bank
- Learning Material
- CBT
- AI
- School Logo
- Announcement
- Attachment
- Report Export

File tidak boleh diunggah langsung ke masing-masing modul.

---

# 2. Scope

File Upload Service menangani:

- Upload File
- Multipart Upload
- Download
- Preview
- Image Resize
- Thumbnail Generation
- Virus Scan
- Metadata Management
- Soft Delete
- File Versioning (Future)

---

# 3. Architecture

```text
               Client

                  │

                  ▼

          File Upload API

                  │

      ┌───────────┼────────────┐

      ▼           ▼            ▼

 Validation   Image Worker   Metadata

                  │

                  ▼

         Object Storage

      (Supabase Storage)

                  │

                  ▼

          PostgreSQL Metadata
```

---

# 4. Storage Strategy

File fisik disimpan di:

```text
Supabase Storage
```

Metadata disimpan di PostgreSQL.

```text
File

↓

Upload

↓

Storage

↓

Metadata

↓

Database
```

Dengan pendekatan ini:

- metadata dapat di-query dengan cepat
- file dapat dipindahkan ke storage lain tanpa mengubah database

---

# 5. Bucket Strategy

Bucket dipisahkan berdasarkan domain.

```text
avatars/

questions/

materials/

videos/

documents/

school/

exports/

temporary/
```

Future:

```text
tenant-id/

school-id/

archive/
```

---

# 6. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| POST | /files/upload | Upload file |
| POST | /files/upload/chunk | Chunk upload |
| GET | /files/{id} | Metadata file |
| GET | /files/{id}/download | Download |
| GET | /files/{id}/preview | Preview |
| DELETE | /files/{id} | Soft delete |
| POST | /files/{id}/restore | Restore |
| GET | /files/search | Cari file |

---

# 7. Upload File

```http
POST /api/v1/files/upload
```

Content-Type

```text
multipart/form-data
```

Field

```text
file

category

folder

visibility
```

Response

```json
{
  "success": true,
  "data": {
    "fileId": "file_001",
    "url": "/files/file_001",
    "size": 285631,
    "mimeType": "image/png"
  }
}
```

---

# 8. Supported File Type

Image

```text
jpg

jpeg

png

svg

webp
```

Document

```text
pdf

docx

xlsx

pptx

txt
```

Video

```text
mp4
```

Audio

```text
mp3

wav
```

Future:

```text
zip

7z

gif
```

---

# 9. Maximum File Size

| Jenis | Maksimum |
|---------|-----------|
| Avatar | 5 MB |
| Image | 10 MB |
| PDF | 50 MB |
| Video | 500 MB |
| Audio | 100 MB |

Nilai dapat dikonfigurasi melalui environment configuration.

---

# 10. Upload Validation

Validasi:

- MIME Type
- File Extension
- File Size
- Filename
- Virus Scan
- Duplicate Detection (Future)

Jika validasi gagal:

```http
400 Bad Request
```

---

# 11. File Metadata

Metadata yang disimpan:

```text
File ID

Filename

Original Name

Mime Type

Size

Checksum

Bucket

Storage Path

Uploaded By

Created At

Deleted At
```

---

# 12. Download File

```http
GET /api/v1/files/{id}/download
```

Flow

```text
Authorization

↓

Metadata

↓

Generate Signed URL

↓

Download
```

File tidak di-stream langsung dari backend untuk mengurangi beban server.

---

# 13. Preview File

```http
GET /api/v1/files/{id}/preview
```

Digunakan untuk:

- gambar
- PDF
- video
- audio

Preview menggunakan Signed URL dengan masa berlaku tertentu.

---

# 14. Image Processing

Setelah upload:

```text
Original

↓

Resize

↓

Thumbnail

↓

Optimization

↓

Store
```

Ukuran thumbnail:

```text
128 px

256 px

512 px
```

---

# 15. Chunk Upload

Digunakan untuk file besar.

```http
POST /api/v1/files/upload/chunk
```

Flow

```text
Chunk 1

↓

Chunk 2

↓

Chunk N

↓

Merge

↓

Store
```

Sangat penting untuk upload video.

---

# 16. Search File

```http
GET /api/v1/files/search
```

Parameter

```text
filename

category

mimeType

owner

createdAt

page

pageSize
```

---

# 17. Delete File

```http
DELETE /api/v1/files/{id}
```

Menggunakan:

```text
Soft Delete
```

File dapat dipulihkan selama periode retensi.

---

# 18. Restore File

```http
POST /api/v1/files/{id}/restore
```

Hanya tersedia untuk pengguna dengan hak akses yang sesuai.

---

# 19. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | Upload sesuai modul yang diizinkan |
| Teacher | Upload materi dan soal |
| Staff | Upload operasional |
| Admin | Full Access |
| Super Admin | Full Access |

---

# 20. Security Consideration

File Upload API menerapkan:

- JWT Authentication
- RBAC Authorization
- Signed URL
- MIME Validation
- Virus Scan
- Checksum Validation
- File Size Validation
- Path Traversal Protection
- Filename Sanitization
- Rate Limiting
- Audit Logging

File tidak boleh dapat diakses melalui path fisik storage.

---

# 21. Audit Logging

Dicatat:

- Upload
- Download
- Preview
- Delete
- Restore
- Upload Failed
- Virus Detection
- Permission Denied

---

# 22. Performance Strategy

Optimasi:

- Multipart Upload
- Chunk Upload
- CDN
- Image Compression
- Lazy Loading
- Signed URL
- Metadata Cache
- Background Image Processing

Target:

| Endpoint | Target P95 |
|----------|------------|
| Upload Image | < 2 detik |
| Upload PDF | < 5 detik |
| Metadata | < 100 ms |
| Download URL | < 150 ms |

---

# 23. Scalability Consideration

Dirancang untuk:

- Puluhan juta file
- Multi Tenant
- Horizontal Scaling
- CDN Distribution
- Object Storage Migration
- Lifecycle Policy
- Background Worker
- Multi Region Storage (Future)

Karena metadata dipisahkan dari file fisik, migrasi storage provider dapat dilakukan tanpa perubahan API.

---

# 24. Future Evolution

Roadmap:

- File Versioning
- OCR Service
- AI Image Moderation
- Duplicate Detection
- EXIF Extraction
- Video Transcoding
- Watermark Service
- Storage Tiering
- Lifecycle Management
- Cross Region Replication

---

# Summary

File Upload API merupakan layanan terpusat untuk seluruh kebutuhan manajemen file di YakinLulus.id.

Karakteristik utama:

- Menggunakan **Supabase Storage** sebagai object storage.
- Metadata disimpan terpisah di PostgreSQL.
- Mendukung upload biasa maupun chunk upload.
- Menggunakan Signed URL untuk akses file yang aman.
- Mendukung validasi MIME, ukuran file, dan pemindaian keamanan.
- Siap berkembang untuk menangani puluhan juta file dengan arsitektur object storage yang skalabel.
