# 05_subject.md

# YakinLulus.id Backend Specification — Subject Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Subject Module bertanggung jawab mengelola seluruh data **mata pelajaran (Subject)** yang digunakan dalam proses pembelajaran, bank soal, materi, CBT, analitik, dan AI pada platform YakinLulus.id.

Subject merupakan turunan langsung dari **Curriculum** dan menjadi induk dari **Chapter (Bab)**.

Seluruh konten akademik wajib memiliki relasi ke Subject.

---

# 2. Module Responsibility

Module bertanggung jawab terhadap:

* Subject Master
* Subject Code
* Subject Metadata
* Subject Activation
* Subject Assignment
* Subject Configuration
* Subject Ordering
* Subject Version Mapping

Module ini **tidak bertanggung jawab** terhadap:

* Curriculum
* Chapter
* Material
* Question Bank
* Exam
* CBT Runtime

---

# 3. Architecture Position

```text id="sub001"
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
Question Bank
Exam
Analytics
AI
```

---

# 4. Business Objectives

Module ini bertujuan untuk:

* Menjadi master data seluruh mata pelajaran.
* Mendukung banyak jenjang pendidikan.
* Mendukung banyak versi kurikulum.
* Menghindari duplikasi mata pelajaran.
* Menjadi referensi seluruh konten akademik.

---

# 5. Supported Education Level

MVP:

* SD
* SMP
* SMA
* SMK

Future:

* Perguruan Tinggi
* Kursus
* Sertifikasi Profesional

---

# 6. Subject Lifecycle

```text id="sub002"
Draft

↓

Review

↓

Published

↓

Active

↓

Inactive

↓

Archived
```

Subject yang tidak aktif tidak dapat digunakan untuk membuat materi, soal, maupun ujian baru.

---

# 7. Actors

* Platform Admin
* Academic Admin
* Content Manager
* Teacher (Read Only)
* Student (Read Only)

---

# 8. RBAC

Permission:

```text id="sub003"
subject.read

subject.create

subject.update

subject.publish

subject.activate

subject.archive
```

---

# 9. Business Rules

### BR-001

Subject harus berada dalam satu Curriculum Version.

---

### BR-002

Subject Code harus unik pada satu Curriculum Version.

---

### BR-003

Nama Subject boleh sama pada kurikulum yang berbeda.

---

### BR-004

Subject tidak dapat dihapus apabila masih memiliki Chapter aktif.

---

### BR-005

Subject tidak dapat diarsipkan apabila masih digunakan oleh Material, Question Bank, atau Exam aktif.

---

### BR-006

Urutan (Display Order) dapat dikonfigurasi.

---

### BR-007

Perubahan Subject tidak mengubah histori data lama.

---

# 10. Data Model

Entity utama:

```text id="sub004"
subjects

subject_translations (Future)

subject_metadata

subject_order
```

---

# 11. Relationships

```text id="sub005"
Curriculum

↓

Subject

↓

Chapter

↓

Material

↓

Question

↓

Exam

↓

Analytics
```

---

# 12. Subject Classification

Contoh Subject:

SD

* Matematika
* Bahasa Indonesia
* IPA
* IPS

SMP

* Matematika
* IPA
* Bahasa Inggris

SMA

* Matematika Wajib
* Matematika Peminatan
* Fisika
* Kimia
* Biologi
* Ekonomi

SMK

* Produktif
* Dasar Kejuruan
* Informatika

Daftar ini bersifat data master dan dapat diperluas.

---

# 13. Subject Metadata

Metadata meliputi:

* Subject Name
* Subject Code
* Description
* Education Level
* Display Order
* Icon
* Color
* Active Status

---

# 14. Use Cases

Academic Admin:

* Membuat Subject.
* Mengubah Subject.
* Mengaktifkan Subject.
* Mengatur urutan tampilan.

Content Manager:

* Melihat Subject.
* Menghubungkan Subject dengan Chapter.

Teacher:

* Memilih Subject saat membuat materi atau ujian.

---

# 15. Functional Specification

Fitur:

* Create Subject
* Update Subject
* Publish Subject
* Activate Subject
* Archive Subject
* Subject Detail
* Subject Search
* Subject Ordering

---

# 16. DTO

## Create Subject

```json id="sub006"
{
  "curriculum_id": "uuid",
  "code": "MAT-SMA-10",
  "name": "Matematika",
  "education_level": "SMA"
}
```

---

## Response

```json id="sub007"
{
  "id": "uuid",
  "code": "MAT-SMA-10",
  "name": "Matematika",
  "status": "ACTIVE"
}
```

---

# 17. Validation Rules

| Field           | Rule                            |
| --------------- | ------------------------------- |
| Curriculum ID   | Required                        |
| Subject Code    | Required, Unique per Curriculum |
| Name            | Required                        |
| Education Level | Required                        |
| Display Order   | Integer ≥ 0                     |

---

# 18. API Summary

```text id="sub008"
GET    /api/v1/subjects

GET    /api/v1/subjects/{id}

POST   /api/v1/subjects

PUT    /api/v1/subjects/{id}

PATCH  /api/v1/subjects/{id}/publish

PATCH  /api/v1/subjects/{id}/activate

PATCH  /api/v1/subjects/reorder

DELETE /api/v1/subjects/{id}
```

---

# 19. Service Layer

```text id="sub009"
SubjectService

Create()

Update()

Publish()

Activate()

Archive()

Reorder()

Search()

Find()
```

---

# 20. Repository Layer

```text id="sub010"
SubjectRepository

MetadataRepository

OrderingRepository
```

---

# 21. Transaction Flow

```text id="sub011"
Create Subject

↓

Validation

↓

Save Subject

↓

Create Metadata

↓

Audit

↓

Commit
```

Rollback dilakukan apabila salah satu proses gagal.

---

# 22. Event Publishing

Event:

```text id="sub012"
subject.created

subject.updated

subject.published

subject.activated

subject.archived

subject.reordered
```

---

# 23. Background Job

Job:

* Subject Cache Refresh
* Search Index Update
* Analytics Synchronization

---

# 24. Cache Strategy

Redis menyimpan:

* Subject List
* Subject Detail
* Active Subject
* Subject Tree

TTL:

```text id="sub013"
1 Hour
```

Cache dibersihkan ketika Subject diperbarui.

---

# 25. Search Strategy

Pencarian berdasarkan:

* Subject Name
* Subject Code
* Curriculum
* Education Level
* Status

Sorting:

* Name
* Display Order
* Created Date

Pagination wajib.

---

# 26. File Storage

Asset Subject:

* Icon
* Thumbnail (Future)

Disimpan di Supabase Storage.

Folder:

```text id="sub014"
subject-icon/
```

---

# 27. Security Rules

Seluruh endpoint menerapkan:

* JWT Authentication
* RBAC Authorization
* Request Validation
* Audit Logging

Student dan Teacher tidak memiliki hak untuk mengubah Subject.

---

# 28. Audit Log

Audit mencatat:

* Subject Created
* Subject Updated
* Subject Published
* Subject Activated
* Subject Archived
* Subject Reordered

---

# 29. Error Handling

| Code                       | Description                          |
| -------------------------- | ------------------------------------ |
| SUBJECT_NOT_FOUND          | Subject tidak ditemukan              |
| SUBJECT_ALREADY_EXISTS     | Subject Code sudah digunakan         |
| CURRICULUM_NOT_FOUND       | Kurikulum tidak ditemukan            |
| SUBJECT_HAS_ACTIVE_CHAPTER | Subject masih memiliki Chapter aktif |
| SUBJECT_IN_USE             | Subject masih digunakan              |

---

# 30. Sequence Diagram

```text id="sub015"
Academic Admin

↓

Subject API

↓

Subject Service

↓

Repository

↓

Database

↓

Cache

↓

Audit

↓

Response
```

---

# 31. Integration

Subject Module terintegrasi dengan:

* Curriculum
* Chapter
* Material
* Question Bank
* Exam
* CBT Runtime
* Analytics
* AI Service
* Search Service

Subject menjadi penghubung utama antara struktur kurikulum dan konten pembelajaran.

---

# 32. Performance Target

| Metric          | Target   |
| --------------- | -------- |
| Subject Detail  | < 100 ms |
| Subject List    | < 200 ms |
| Create Subject  | < 300 ms |
| Search Subject  | < 250 ms |
| Reorder Subject | < 300 ms |

---

# 33. Test Scenario

### Unit Test

* Create Subject.
* Update Subject.
* Publish Subject.
* Activate Subject.
* Reorder Subject.
* Validation.

### Integration Test

* CRUD Subject.
* Curriculum Mapping.
* Cache Refresh.
* Search.
* Ordering.

### Security Test

* Unauthorized Access.
* Invalid Permission.
* Duplicate Subject Code.
* Cross-curriculum manipulation.

---

# 34. Future Enhancement

* Multi-language Subject
* Subject Alias
* Subject Hierarchy
* Subject Recommendation
* AI Subject Classification
* Subject Merge
* Subject Import/Export
* Subject Version Comparison

---

# 35. Dependencies

Module bergantung pada:

* Curriculum Module
* Configuration Management
* Logging
* Redis
* Audit
* Search Architecture

Module ini menjadi dependency langsung bagi:

* Chapter
* Material
* Question Bank
* Exam
* Analytics
* AI Service

---

# 36. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD Subject berjalan.
* Subject terhubung dengan Curriculum.
* Subject dapat diaktifkan dan diarsipkan.
* Display Order dapat diubah.
* Audit Log tersedia.
* Cache diperbarui secara otomatis.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 37. Summary

Subject Module merupakan master data mata pelajaran yang menjadi penghubung antara kurikulum dan seluruh konten pembelajaran di YakinLulus.id. Modul ini menyediakan struktur yang konsisten untuk pengelolaan mata pelajaran, mendukung versioning kurikulum, pengaturan urutan tampilan, serta integrasi dengan Material, Question Bank, CBT, Analytics, dan AI.

Arsitektur modul dirancang agar siap mendukung perubahan kurikulum nasional maupun penambahan jenis kurikulum di masa depan tanpa perubahan besar pada domain model maupun implementasi backend.
