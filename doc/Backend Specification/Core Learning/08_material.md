# 08_material.md

# YakinLulus.id Backend Specification — Material Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Material Module merupakan domain yang bertanggung jawab mengelola seluruh konten pembelajaran pada platform YakinLulus.id.

Modul ini menyediakan materi pembelajaran digital yang dapat digunakan oleh siswa sebagai media belajar mandiri maupun sebagai pendamping CBT.

Material tidak hanya berupa teks, tetapi mendukung berbagai jenis media seperti video, audio, gambar, animasi, simulasi, PDF, serta konten interaktif.

Seluruh materi selalu terhubung dengan struktur akademik:

* Curriculum
* Education Level
* Grade
* Subject
* Chapter
* Sub Chapter
* Learning Objective

Material menjadi sumber utama bagi:

* Student Learning
* AI Tutor
* Recommendation Engine
* Learning Progress
* Analytics
* CBT Preparation

---

# 2. Module Responsibility

Material Module bertanggung jawab terhadap:

* Material Master
* Material Version
* Material Content
* Multimedia Content
* Material Metadata
* Learning Resource
* Material Publishing
* Material Review
* Material Search
* Material Recommendation
* Material Download
* Material Bookmark
* Material Progress

Module ini **tidak bertanggung jawab** terhadap:

* Question Bank
* CBT Runtime
* Exam
* Authentication
* Notification

---

# 3. Architecture Position

```text
Curriculum
      │
      ▼
Subject
      │
      ▼
Chapter
      │
      ▼
Material
      │
 ┌────┼──────────────┐
 ▼    ▼              ▼
 AI Analytics Learning Progress
      │
      ▼
Student Dashboard
```

---

# 4. Business Objectives

Material Module dirancang untuk:

* Menjadi pusat materi pembelajaran.
* Mendukung multimedia learning.
* Mendukung AI Learning Assistant.
* Mendukung adaptive learning.
* Mendukung learning analytics.
* Mendukung offline download (Roadmap).
* Mendukung content versioning.
* Mendukung collaborative content.

---

# 5. Material Lifecycle

```text
Draft

↓

Review

↓

Revision

↓

Approved

↓

Published

↓

Active

↓

Deprecated

↓

Archived
```

Materi hanya dapat diakses siswa apabila berstatus **Active**.

---

# 6. Actors

* Platform Admin
* Academic Admin
* Content Writer
* Reviewer
* Teacher
* Student
* AI Service

---

# 7. RBAC

Permission:

```text
material.read

material.create

material.update

material.review

material.approve

material.publish

material.archive

material.download

material.export
```

---

# 8. Business Rules

### BR-001

Material wajib memiliki Subject.

---

### BR-002

Material wajib memiliki Chapter.

---

### BR-003

Material dapat memiliki lebih dari satu media.

---

### BR-004

Material dapat memiliki lebih dari satu versi.

---

### BR-005

Hanya satu versi aktif.

---

### BR-006

Material yang digunakan oleh Learning Path tidak boleh dihapus.

---

### BR-007

Perubahan materi menghasilkan versi baru.

---

### BR-008

AI Generated Material wajib melalui proses review.

---

### BR-009

Materi dapat digunakan oleh lebih dari satu kelas apabila menggunakan kurikulum yang sama.

---

# 9. Supported Material Type

MVP

* Article
* PDF
* Image
* Video
* Audio

Roadmap

* Interactive HTML
* Simulation
* 3D Object
* Whiteboard
* AR
* VR
* Live Coding
* Interactive Quiz
* Flashcard
* Infographic

---

# 10. Data Model

Entity utama:

```text
materials

material_versions

material_contents

material_media

material_tags

material_bookmarks

material_progress

material_reviews

material_statistics
```

---

# 11. Relationships

```text
Curriculum

↓

Subject

↓

Chapter

↓

Material

↓

Media

↓

Student Progress

↓

Analytics

↓

Recommendation
```

---

# 12. Material Metadata

Metadata:

* Material Code
* Title
* Description
* Curriculum
* Subject
* Chapter
* Difficulty
* Estimated Duration
* Language
* Version
* Thumbnail
* Cover Image
* Status
* AI Generated Flag

---

# 13. Learning Resource

Satu materi dapat memiliki:

* Video
* PDF
* Image
* Audio
* Attachment
* External Link
* Reference Book
* Practice Question

---

# 14. Difficulty Classification

MVP

```text
BEGINNER

INTERMEDIATE

ADVANCED
```

Roadmap

* Adaptive Difficulty
* Personalized Difficulty

---

# 15. Material Structure

```text
Material

↓

Introduction

↓

Learning Objective

↓

Content

↓

Image

↓

Video

↓

Summary

↓

Practice Question

↓

Reference

↓

Related Material
```

---

# 16. Use Cases

Content Writer

* Membuat materi.
* Mengunggah media.
* Memperbarui materi.

Reviewer

* Review.
* Approve.
* Memberikan komentar.

Teacher

* Menggunakan materi.
* Memberikan rekomendasi kepada siswa.

Student

* Membaca materi.
* Menonton video.
* Mengunduh lampiran.
* Bookmark.
* Melanjutkan belajar.

AI

* Generate Summary.
* Generate Learning Path.
* Generate Quiz.

---

# 17. Functional Specification

Fitur:

* Create Material
* Update Material
* Versioning
* Review Workflow
* Publish
* Archive
* Bookmark
* Download
* Search
* Recommendation
* Related Material
* Progress Tracking
* AI Generate Summary
* AI Improve Material

---

# 18. DTO

## Create Material

```json
{
  "subject_id": "uuid",
  "chapter_id": "uuid",
  "title": "Persamaan Linear",
  "material_type": "ARTICLE"
}
```

---

## Response

```json
{
  "id": "uuid",
  "status": "DRAFT"
}
```

---

# 19. Validation Rules

| Field         | Rule     |
| ------------- | -------- |
| Subject       | Required |
| Chapter       | Required |
| Title         | Required |
| Material Type | Enum     |
| Version       | Required |
| Status        | Enum     |

---

# 20. API Summary

```text
GET    /api/v1/materials

GET    /api/v1/materials/{id}

POST   /api/v1/materials

PUT    /api/v1/materials/{id}

DELETE /api/v1/materials/{id}

POST   /api/v1/materials/publish

POST   /api/v1/materials/archive

POST   /api/v1/materials/bookmark

GET    /api/v1/materials/recommendation

GET    /api/v1/materials/search
```

---

# 21. Service Layer

```text
MaterialService

Create()

Update()

Publish()

Archive()

Review()

Bookmark()

TrackProgress()

Recommend()

GenerateAISummary()

Search()
```

---

# 22. Repository Layer

```text
MaterialRepository

MediaRepository

BookmarkRepository

ProgressRepository

ReviewRepository

StatisticsRepository
```

---

# 23. Transaction Flow

```text
Create Material

↓

Validation

↓

Save Material

↓

Upload Media

↓

Create Version

↓

Audit

↓

Commit
```

---

# 24. Event Publishing

Event:

```text
material.created

material.updated

material.reviewed

material.approved

material.published

material.archived

material.bookmarked

material.completed

material.ai.generated
```

---

# 25. Background Job

Job:

* Video Transcoding
* PDF Preview Generation
* Thumbnail Generation
* OCR Indexing
* AI Summary Generation
* AI Translation (Future)
* Recommendation Refresh
* Learning Statistics Aggregation

---

# 26. Cache Strategy

Redis menyimpan:

* Material Detail
* Popular Material
* Related Material
* Recommendation
* Student Bookmark

TTL

```text
1 Hour
```

---

# 27. Search Strategy

Search mendukung:

* Full Text Search
* Subject
* Chapter
* Material Type
* Difficulty
* Tag
* Keyword
* AI Generated
* Duration
* Author

Roadmap:

* Semantic Search menggunakan pgvector.

---

# 28. File Storage

Menggunakan Supabase Storage.

Folder:

```text
material-image/

material-video/

material-audio/

material-pdf/

material-thumbnail/

material-cover/

material-attachment/
```

Seluruh upload menggunakan Signed URL.

---

# 29. Security Rules

* JWT Authentication
* RBAC Authorization
* File Validation
* Virus Scan (Roadmap)
* Input Sanitization
* Content Moderation
* Audit Logging

Download mengikuti permission pengguna.

---

# 30. Audit Log

Audit mencatat:

* Material Created
* Material Updated
* Review
* Publish
* Archive
* Download
* Bookmark
* AI Generation
* Media Upload

---

# 31. Error Handling

| Code                  | Description                |
| --------------------- | -------------------------- |
| MATERIAL_NOT_FOUND    | Materi tidak ditemukan     |
| MATERIAL_IN_USE       | Materi sedang digunakan    |
| INVALID_MEDIA         | Media tidak valid          |
| INVALID_VERSION       | Versi tidak valid          |
| REVIEW_REQUIRED       | Materi belum direview      |
| STORAGE_UPLOAD_FAILED | Upload gagal               |
| FILE_TOO_LARGE        | Ukuran file melebihi batas |

---

# 32. Sequence Diagram

```text
Content Writer

↓

Material API

↓

Material Service

↓

Repository

↓

Supabase Storage

↓

Database

↓

Redis

↓

Audit

↓

Response
```

---

# 33. Integration

Material Module terintegrasi dengan:

* Curriculum
* Subject
* Chapter
* Question Bank
* AI Service
* Analytics
* Student Progress
* Recommendation Engine
* File Management
* Search Architecture
* Notification

---

# 34. Performance Target

| Metric                      | Target   |
| --------------------------- | -------- |
| Material Detail             | < 150 ms |
| Material Search             | < 300 ms |
| Upload Metadata             | < 300 ms |
| Media Upload Initialization | < 200 ms |
| Recommendation              | < 500 ms |

Media streaming tidak termasuk target ini.

---

# 35. Test Scenario

### Unit Test

* Create Material.
* Update Material.
* Publish.
* Bookmark.
* Track Progress.
* Validation.

### Integration Test

* CRUD Material.
* Upload Media.
* Download.
* Recommendation.
* Search.
* AI Summary.

### Security Test

* Unauthorized Access.
* Invalid Upload.
* Malicious File.
* Broken Access Control.
* Path Traversal.

---

# 36. Future Enhancement

* Interactive Learning Module
* AI Tutor Integration
* Live Classroom Material
* Offline Learning Package
* Learning Path Builder
* Collaborative Authoring
* Material Marketplace
* AI Translation
* AI Voice Narration
* Adaptive Content Recommendation

---

# 37. Dependencies

Module bergantung pada:

* Curriculum
* Subject
* Chapter
* File Management
* AI Service
* Analytics
* Redis
* Supabase Storage
* Search Architecture
* Audit

Material menjadi dependency bagi:

* Student Dashboard
* AI Tutor
* Recommendation Engine
* Learning Progress
* Analytics

---

# 38. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD Material berjalan.
* Versioning berjalan.
* Multimedia dapat diunggah.
* Bookmark berfungsi.
* Progress belajar tersimpan.
* Review dan Publish Workflow berjalan.
* Search berfungsi.
* Recommendation tersedia.
* Audit Log tersedia.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 39. Summary

Material Module menyediakan fondasi pembelajaran digital pada YakinLulus.id dengan dukungan konten multimedia, versioning, workflow editorial, dan pelacakan progres belajar. Modul ini terintegrasi dengan struktur akademik, AI Service, Analytics, serta Recommendation Engine sehingga materi tidak hanya menjadi sumber belajar, tetapi juga menjadi bagian dari ekosistem pembelajaran adaptif yang siap dikembangkan untuk kebutuhan skala nasional.
