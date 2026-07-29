# Learning Material API

**Document** : `api/09_learning_material_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Learning Material API** pada YakinLulus.id.

Learning Material merupakan layanan yang menyediakan materi pembelajaran digital yang dapat diakses melalui:

- Web Application
- Mobile Application
- CBT Preparation
- AI Tutor
- Recommendation Engine

API dirancang agar mampu mengelola berbagai jenis konten pembelajaran secara modular, mudah dikembangkan, dan siap menangani jutaan pengguna.

---

# 2. Learning Material Architecture

```text
               Web / Mobile
                    │
                    ▼
         Learning Material API
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 Content      Progress Service   Search
 Validation
                    │
                    ▼
            Application Layer
                    │
                    ▼
             PostgreSQL
                    │
                    ▼
       Object Storage / CDN
```

---

# 3. Learning Material Hierarchy

Materi mengikuti struktur kurikulum.

```text
Jenjang

↓

Kelas

↓

Mata Pelajaran

↓

Bab

↓

Sub Bab

↓

Learning Material

↓

Section

↓

Content Block
```

---

# 4. Content Type

MVP mendukung:

```text
Text

Image

Video

Audio

File Attachment

Quiz Reference
```

Roadmap:

```text
Interactive Simulation

HTML Widget

Canvas

Animation

AR/VR

Live Class
```

---

# 5. Material Lifecycle

```text
Draft

↓

Review

↓

Approved

↓

Published

↓

Updated

↓

Archived

↓

Soft Deleted
```

---

# 6. Endpoint Overview

| Method | Endpoint | Fungsi |
|----------|----------|--------|
| GET | /learning-materials | List Material |
| POST | /learning-materials | Create Material |
| GET | /learning-materials/{id} | Detail Material |
| PATCH | /learning-materials/{id} | Update Material |
| DELETE | /learning-materials/{id} | Soft Delete |
| POST | /learning-materials/{id}/publish | Publish |
| POST | /learning-materials/{id}/archive | Archive |
| GET | /learning-materials/statistics | Statistik |
| POST | /learning-materials/import | Bulk Import (Future) |

---

# 7. Create Learning Material

```http
POST /api/v1/learning-materials
```

Request

```json
{
  "title": "Persamaan Linear",
  "description": "Materi dasar persamaan linear",
  "gradeId": "grade_10",
  "subjectId": "math",
  "chapterId": "chapter_01",
  "difficulty": "basic",
  "estimatedDuration": 45
}
```

Response

```http
201 Created
```

---

# 8. Material Detail

```http
GET /api/v1/learning-materials/{id}
```

Response

```json
{
  "success": true,
  "data": {
    "id": "mat_001",
    "title": "Persamaan Linear",
    "status": "published",
    "estimatedDuration": 45,
    "contentBlocks": []
  }
}
```

---

# 9. Content Block

Setiap materi terdiri dari kumpulan Content Block.

```text
Material

↓

Content Block

↓

Text

↓

Image

↓

Video

↓

Audio

↓

Attachment
```

Pendekatan ini memudahkan editor untuk menambah tipe konten baru.

---

# 10. Content Block Structure

Contoh:

```json
{
  "type": "text",
  "order": 1,
  "content": "<p>Persamaan linear...</p>"
}
```

Contoh video:

```json
{
  "type": "video",
  "order": 2,
  "url": "https://cdn.yakinlulus.id/video001.mp4"
}
```

---

# 11. List Learning Material

```http
GET /api/v1/learning-materials
```

Query Parameter

```text
page

pageSize

search

gradeId

subjectId

chapterId

status

difficulty
```

Semua parameter dapat digabungkan.

---

# 12. Search

Pencarian dilakukan terhadap:

- Judul
- Deskripsi
- Isi materi
- Tag
- Bab
- Topik

Future:

- Semantic Search
- AI Search
- Full Text Search

---

# 13. Publish Material

```http
POST /api/v1/learning-materials/{id}/publish
```

Validasi:

- Metadata lengkap
- Minimal satu Content Block
- Status Draft

---

# 14. Archive Material

```http
POST /api/v1/learning-materials/{id}/archive
```

Materi tidak lagi ditampilkan kepada siswa tetapi tetap tersedia untuk histori.

---

# 15. Learning Progress API

Progress belajar dipisahkan dari materi.

Endpoint

```http
GET /api/v1/learning-materials/{id}/progress
```

Response

```json
{
  "success": true,
  "data": {
    "completed": true,
    "percentage": 100,
    "lastVisitedSection": 8
  }
}
```

---

# 16. Bookmark API

```http
POST /api/v1/learning-materials/{id}/bookmark
```

```http
DELETE /api/v1/learning-materials/{id}/bookmark
```

Digunakan siswa untuk menyimpan materi favorit.

---

# 17. Recently Viewed

```http
GET /api/v1/learning-materials/recent
```

Mengembalikan daftar materi terakhir yang dipelajari.

---

# 18. Recommended Material

```http
GET /api/v1/learning-materials/recommended
```

MVP:

- Berdasarkan kelas
- Berdasarkan mata pelajaran
- Berdasarkan progres belajar

Future:

- AI Recommendation Engine

---

# 19. Multimedia Upload

Media diunggah melalui File Service.

Supported:

- JPG
- PNG
- SVG
- MP4
- MP3
- PDF

Response mengembalikan:

```json
{
  "fileId": "file_001",
  "url": "https://cdn.yakinlulus.id/..."
}
```

---

# 20. Download Attachment

```http
GET /api/v1/learning-materials/{id}/attachments/{fileId}
```

Akses mengikuti RBAC dan hak akses materi.

---

# 21. Statistics

```http
GET /api/v1/learning-materials/statistics
```

Contoh response

```json
{
  "success": true,
  "data": {
    "totalMaterials": 8200,
    "published": 7900,
    "draft": 180,
    "archived": 120
  }
}
```

---

# 22. Authorization

| Role | Hak Akses |
|------|-----------|
| Super Admin | Full Access |
| Admin | Full Access |
| Staff | CRUD sesuai kebijakan |
| Teacher | CRUD materi sekolah / milik sendiri |
| Student | Read Published Material |

---

# 23. Validation Rules

Minimal validasi:

- Title wajib
- Grade wajib
- Subject wajib
- Chapter wajib
- Minimal satu Content Block sebelum publish
- Tipe media valid
- File tersedia

---

# 24. Audit Logging

Seluruh aktivitas dicatat:

- Create
- Update
- Publish
- Archive
- Delete
- Restore
- Download
- Bookmark
- Progress Update

---

# 25. Security Consideration

API wajib menerapkan:

- JWT Authentication
- RBAC Authorization
- HTML Sanitization
- File Validation
- MIME Type Validation
- CDN Signed URL (Future)
- Audit Logging
- Rate Limiting

---

# 26. Performance Strategy

Optimasi:

- Pagination
- Lazy Loading
- CDN
- Image Compression
- Video Streaming
- Cache Metadata
- Pre-signed URL
- Redis Cache

Target:

| Endpoint | Target P95 |
|----------|------------|
| List Material | < 250 ms |
| Detail Material | < 200 ms |
| Progress | < 100 ms |

---

# 27. Scalability Consideration

Arsitektur dirancang untuk:

- Jutaan materi
- Puluhan juta file multimedia
- Horizontal Scaling
- CDN Distribution
- Multi School
- Multi Tenant
- Offline Synchronization (Mobile)
- AI Recommendation

---

# 28. Future Evolution

Roadmap:

- Interactive Learning Widget
- AI Tutor Integration
- Adaptive Learning Path
- Learning Playlist
- Live Collaboration
- Content Versioning
- SCORM/xAPI Support
- Gamification Integration
- AI-generated Learning Summary

---

# Summary

Learning Material API menyediakan layanan terpusat untuk pengelolaan materi pembelajaran digital.

Karakteristik utama:

- Struktur materi berbasis Content Block yang fleksibel.
- Mendukung multimedia dan attachment.
- Progress belajar dipisahkan dari konten untuk memudahkan analitik.
- Mendukung bookmark, rekomendasi, dan histori pembelajaran.
- Dioptimalkan menggunakan CDN, cache, dan lazy loading.
- Siap berkembang menjadi platform pembelajaran adaptif berbasis AI tanpa perubahan besar pada kontrak API.
