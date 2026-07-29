# 06_chapter.md

# YakinLulus.id Backend Specification — Chapter Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Chapter Module bertanggung jawab mengelola struktur materi pembelajaran pada tingkat **Bab (Chapter)** dan **Sub Bab (Sub Chapter)** yang menjadi dasar organisasi seluruh konten akademik di platform YakinLulus.id.

Setiap Chapter berada di bawah satu Subject dan Curriculum Version. Seluruh materi pembelajaran, bank soal, CBT, AI, learning path, progress belajar, dan analitik mengacu pada struktur Chapter.

Module ini menjadi pusat organisasi konten (Content Organization Layer).

---

# 2. Module Responsibility

Chapter Module bertanggung jawab terhadap:

* Chapter Master
* Sub Chapter
* Learning Topic
* Chapter Ordering
* Chapter Metadata
* Chapter Version Mapping
* Learning Objective Mapping
* Chapter Activation

Module ini **tidak bertanggung jawab** terhadap:

* Curriculum
* Subject
* Material Content
* Question Content
* Exam Configuration

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
Sub Chapter
      │
      ├─────────────┐
      ▼             ▼
Material      Question Bank
      │             │
      └──────┬──────┘
             ▼
           CBT
             │
             ▼
      Analytics & AI
```

---

# 4. Business Objectives

Module ini dirancang untuk:

* Menjadi struktur utama organisasi materi.
* Menghindari duplikasi topik pembelajaran.
* Menjadi acuan AI Question Generator.
* Menjadi dasar Learning Progress.
* Mendukung perubahan kurikulum.
* Mendukung ekspansi konten pembelajaran.

---

# 5. Chapter Hierarchy

Hierarki akademik:

```text
Curriculum

↓

Education Level

↓

Grade

↓

Subject

↓

Chapter

↓

Sub Chapter

↓

Learning Topic

↓

Material

↓

Question
```

---

# 6. Actors

* Platform Admin
* Academic Admin
* Content Manager
* Teacher (Read)
* Student (Read)

---

# 7. RBAC

Permission:

```text
chapter.read

chapter.create

chapter.update

chapter.publish

chapter.activate

chapter.archive

chapter.reorder
```

---

# 8. Business Rules

### BR-001

Chapter wajib berada pada satu Subject.

---

### BR-002

Sub Chapter wajib berada pada satu Chapter.

---

### BR-003

Display Order harus unik dalam Subject yang sama.

---

### BR-004

Chapter tidak boleh dihapus apabila masih memiliki Material aktif.

---

### BR-005

Chapter tidak boleh dihapus apabila masih memiliki Question aktif.

---

### BR-006

Sub Chapter dapat memiliki banyak Learning Topic.

---

### BR-007

Question dapat dihubungkan langsung ke Chapter maupun Sub Chapter sesuai kebutuhan.

---

### BR-008

Perubahan struktur tidak menghapus histori data pembelajaran.

---

# 9. Data Model

Entity utama:

```text
chapters

sub_chapters

learning_topics

chapter_metadata

chapter_order
```

---

# 10. Relationships

```text
Subject

↓

Chapter

↓

Sub Chapter

↓

Material

↓

Question

↓

Exam

↓

Learning Progress

↓

Analytics
```

---

# 11. Chapter Metadata

Field utama:

* Chapter Name
* Chapter Code
* Description
* Display Order
* Estimated Study Duration
* Difficulty Level
* Status
* Learning Objective Summary

---

# 12. Learning Objective

Setiap Chapter memiliki:

* Learning Objectives
* Competencies
* Target Skills
* Recommended Study Time
* Difficulty

Learning Objective menjadi referensi AI saat menghasilkan soal baru.

---

# 13. Difficulty Classification

Standar:

```text
BEGINNER

INTERMEDIATE

ADVANCED
```

Future:

* Adaptive Difficulty Score
* Bloom Taxonomy Level

---

# 14. Use Cases

Academic Admin:

* Membuat Chapter.
* Membuat Sub Chapter.
* Mengubah urutan.
* Mengaktifkan Chapter.

Content Manager:

* Menghubungkan Material.
* Menghubungkan Bank Soal.
* Mengelola Learning Topic.

Teacher:

* Melihat struktur pembelajaran.
* Membuat materi berdasarkan Chapter.

---

# 15. Functional Specification

Fitur:

* Create Chapter
* Update Chapter
* Delete (Soft Delete)
* Activate Chapter
* Archive Chapter
* Create Sub Chapter
* Reorder Chapter
* Reorder Sub Chapter
* Search Chapter

---

# 16. DTO

## Create Chapter

```json
{
  "subject_id": "uuid",
  "code": "CH-001",
  "name": "Persamaan Linear",
  "display_order": 1
}
```

---

## Response

```json
{
  "id": "uuid",
  "name": "Persamaan Linear",
  "status": "ACTIVE"
}
```

---

# 17. Validation Rules

| Field         | Rule        |
| ------------- | ----------- |
| Subject ID    | Required    |
| Chapter Code  | Required    |
| Chapter Name  | Required    |
| Display Order | Integer ≥ 0 |
| Difficulty    | Enum        |
| Status        | Enum        |

---

# 18. API Summary

```text
GET    /api/v1/chapters

GET    /api/v1/chapters/{id}

POST   /api/v1/chapters

PUT    /api/v1/chapters/{id}

DELETE /api/v1/chapters/{id}

PATCH  /api/v1/chapters/{id}/activate

PATCH  /api/v1/chapters/reorder

POST   /api/v1/sub-chapters

PUT    /api/v1/sub-chapters/{id}
```

---

# 19. Service Layer

```text
ChapterService

Create()

Update()

Archive()

Activate()

CreateSubChapter()

UpdateSubChapter()

Reorder()

Search()

Find()
```

---

# 20. Repository Layer

```text
ChapterRepository

SubChapterRepository

LearningTopicRepository

MetadataRepository
```

---

# 21. Transaction Flow

```text
Create Chapter

↓

Validation

↓

Save Chapter

↓

Create Metadata

↓

Create Default Learning Objective

↓

Audit Log

↓

Commit
```

---

# 22. Event Publishing

Event:

```text
chapter.created

chapter.updated

chapter.archived

chapter.activated

chapter.reordered

subchapter.created

learning_objective.updated
```

---

# 23. Background Job

Job:

* Cache Refresh
* Search Index Update
* Analytics Synchronization
* AI Topic Embedding Refresh (Future)

---

# 24. Cache Strategy

Redis menyimpan:

* Chapter Tree
* Subject Structure
* Learning Objective
* Navigation Menu

TTL:

```text
1 Hour
```

Cache dibersihkan otomatis ketika struktur berubah.

---

# 25. Search Strategy

Pencarian berdasarkan:

* Chapter Name
* Chapter Code
* Subject
* Curriculum
* Education Level
* Difficulty

Sorting:

* Display Order
* Name
* Updated Date

Pagination wajib.

---

# 26. File Storage

Asset yang dapat dimiliki Chapter:

* Cover Image
* Illustration
* Banner
* Thumbnail

Disimpan di Supabase Storage.

Folder:

```text
chapter-cover/

chapter-banner/

chapter-thumbnail/
```

---

# 27. Security Rules

Seluruh endpoint menerapkan:

* JWT Authentication
* RBAC Authorization
* Validation Layer
* Audit Logging

Teacher dan Student hanya memiliki akses baca.

---

# 28. Audit Log

Audit mencatat:

* Chapter Created
* Chapter Updated
* Chapter Activated
* Chapter Archived
* Sub Chapter Created
* Reorder Activity

---

# 29. Error Handling

| Code                       | Description                  |
| -------------------------- | ---------------------------- |
| CHAPTER_NOT_FOUND          | Chapter tidak ditemukan      |
| SUBJECT_NOT_FOUND          | Subject tidak ditemukan      |
| CHAPTER_ALREADY_EXISTS     | Chapter Code sudah digunakan |
| INVALID_DISPLAY_ORDER      | Urutan tidak valid           |
| CHAPTER_HAS_ACTIVE_CONTENT | Chapter masih digunakan      |
| SUBCHAPTER_NOT_FOUND       | Sub Chapter tidak ditemukan  |

---

# 30. Sequence Diagram

```text
Academic Admin

↓

Chapter API

↓

Chapter Service

↓

Repository

↓

Database

↓

Redis Cache

↓

Audit

↓

Response
```

---

# 31. Integration

Chapter Module terintegrasi dengan:

* Curriculum
* Subject
* Material
* Question Bank
* Exam
* CBT Runtime
* Analytics
* AI Service
* Search Architecture
* Learning Progress

Chapter menjadi penghubung utama antara struktur akademik dan konten pembelajaran.

---

# 32. Performance Target

| Metric            | Target   |
| ----------------- | -------- |
| Chapter Detail    | < 100 ms |
| Chapter Tree      | < 200 ms |
| Create Chapter    | < 300 ms |
| Reorder Structure | < 300 ms |
| Search Chapter    | < 250 ms |

---

# 33. Test Scenario

### Unit Test

* Create Chapter.
* Update Chapter.
* Create Sub Chapter.
* Reorder.
* Validation.

### Integration Test

* CRUD Chapter.
* Subject Mapping.
* Cache Refresh.
* Search.
* Learning Objective Mapping.

### Security Test

* Unauthorized Access.
* Invalid Permission.
* Cross Subject Manipulation.
* Soft Delete Validation.

---

# 34. Future Enhancement

* Unlimited Hierarchical Chapter
* Chapter Dependency Graph
* Learning Path Engine
* Bloom Taxonomy Mapping
* Competency Standard Mapping
* AI Chapter Recommendation
* Automatic Chapter Generation
* Chapter Import/Export
* Knowledge Graph Integration

---

# 35. Dependencies

Module bergantung pada:

* Curriculum Module
* Subject Module
* Configuration Management
* Redis
* Logging
* Search Architecture
* Audit

Module ini menjadi dependency langsung bagi:

* Material
* Question Bank
* Exam
* CBT Runtime
* AI Service
* Learning Analytics
* Student Progress

---

# 36. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD Chapter berjalan.
* CRUD Sub Chapter berjalan.
* Struktur Chapter dapat diurutkan.
* Learning Objective dapat dikelola.
* Integrasi dengan Subject berjalan.
* Audit Log tersedia.
* Cache diperbarui otomatis.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 37. Summary

Chapter Module merupakan lapisan inti organisasi konten akademik pada YakinLulus.id. Modul ini membentuk hierarki pembelajaran dari Subject ke Chapter dan Sub Chapter sehingga seluruh materi, bank soal, CBT, AI, analitik, dan progres belajar memiliki struktur yang konsisten.

Dengan dukungan metadata, learning objective, versioning, dan struktur yang fleksibel, modul ini dirancang untuk mengakomodasi perubahan kurikulum nasional, ekspansi jenjang pendidikan, serta pengembangan fitur adaptif berbasis AI tanpa memerlukan perubahan mendasar pada arsitektur backend.
