# 04_curriculum.md

# YakinLulus.id Backend Specification — Curriculum Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Curriculum Module bertanggung jawab mengelola struktur kurikulum yang menjadi dasar seluruh aktivitas akademik pada platform YakinLulus.id.

Seluruh materi pembelajaran, bank soal, CBT, analitik, AI, dan progress belajar mengacu pada kurikulum.

Modul ini menjadi **Academic Core** yang menghubungkan jenjang pendidikan, mata pelajaran, bab, subbab, kompetensi, dan learning outcome.

---

# 2. Module Responsibility

Curriculum Module bertanggung jawab terhadap:

* Curriculum Master
* Curriculum Version
* Education Level
* Grade Mapping
* Curriculum Activation
* Curriculum Assignment
* Learning Structure
* Curriculum Metadata

Module ini **tidak bertanggung jawab** terhadap:

* Subject
* Chapter
* Question Bank
* Material
* Exam

---

# 3. Architecture Position

```text id="cur001"
School
    │
    ▼
Curriculum
    │
    ▼
Subject
    │
    ▼
Chapter
    │
    ▼
Question & Material
```

Curriculum menjadi root akademik seluruh konten pembelajaran.

---

# 4. Business Objectives

Module ini dirancang untuk:

* Mendukung lebih dari satu kurikulum.
* Mendukung perubahan kurikulum nasional.
* Mendukung versioning.
* Mengurangi duplikasi data.
* Menjadi referensi seluruh modul akademik.

---

# 5. Supported Curriculum

MVP:

* Kurikulum Merdeka

Roadmap:

* Kurikulum 2013
* Kurikulum Nasional Baru
* Kurikulum Internasional (IB, Cambridge)
* Kurikulum Kustom Sekolah

---

# 6. Curriculum Lifecycle

```text id="cur002"
Draft

↓

Review

↓

Published

↓

Active

↓

Deprecated

↓

Archived
```

Hanya satu versi aktif untuk kombinasi kurikulum dan jenjang pada satu waktu.

---

# 7. Actors

* Platform Admin
* Academic Admin
* Content Manager
* School Admin (Read Only pada MVP)
* Teacher (Read Only)

---

# 8. RBAC

Permission:

```text id="cur003"
curriculum.read

curriculum.create

curriculum.update

curriculum.publish

curriculum.activate

curriculum.archive
```

---

# 9. Business Rules

### BR-001

Setiap kurikulum memiliki kode unik.

---

### BR-002

Satu kurikulum dapat memiliki banyak versi.

---

### BR-003

Hanya satu versi yang aktif.

---

### BR-004

Question Bank harus terhubung ke satu kurikulum.

---

### BR-005

Material harus terhubung ke satu kurikulum.

---

### BR-006

Exam hanya dapat menggunakan soal dari kurikulum yang sesuai.

---

### BR-007

Versi yang sudah dipublikasikan tidak dapat dihapus.

---

### BR-008

Perubahan struktur kurikulum harus melalui proses publish.

---

# 10. Data Model

Entity utama:

```text id="cur004"
curriculums

curriculum_versions

curriculum_levels

curriculum_metadata
```

---

# 11. Relationships

```text id="cur005"
Curriculum

↓

Version

↓

Education Level

↓

Subject

↓

Chapter

↓

Question

↓

Material
```

---

# 12. Curriculum Structure

Contoh struktur:

```text id="cur006"
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

Learning Outcome
```

---

# 13. Supported Education Level

MVP:

* SD
* SMP
* SMA
* SMK

Mapping mengikuti PRD.

---

# 14. Versioning Strategy

Contoh:

| Curriculum | Version |
| ---------- | ------- |
| Merdeka    | 2024    |
| Merdeka    | 2025    |
| Merdeka    | 2026    |

Data lama tetap dipertahankan.

---

# 15. Use Cases

Platform Admin:

* Membuat kurikulum.
* Membuat versi baru.
* Publish.
* Aktivasi.

Academic Admin:

* Memperbarui metadata.
* Menambah mapping.
* Melihat histori versi.

---

# 16. Functional Specification

Fitur:

* Create Curriculum
* Update Curriculum
* Versioning
* Publish
* Activate
* Archive
* Search
* Curriculum Detail

---

# 17. DTO

## Create Curriculum

```json id="cur007"
{
  "code": "MERDEKA",
  "name": "Kurikulum Merdeka",
  "version": "2026"
}
```

---

## Response

```json id="cur008"
{
  "id": "uuid",
  "code": "MERDEKA",
  "version": "2026",
  "status": "ACTIVE"
}
```

---

# 18. Validation Rules

| Field           | Rule             |
| --------------- | ---------------- |
| Code            | Required, Unique |
| Name            | Required         |
| Version         | Required         |
| Status          | Enum             |
| Education Level | Required         |

---

# 19. API Summary

```text id="cur009"
GET    /api/v1/curriculums

GET    /api/v1/curriculums/{id}

POST   /api/v1/curriculums

PUT    /api/v1/curriculums/{id}

PATCH  /api/v1/curriculums/{id}/publish

PATCH  /api/v1/curriculums/{id}/activate

DELETE /api/v1/curriculums/{id}
```

---

# 20. Service Layer

```text id="cur010"
CurriculumService

Create()

Update()

Publish()

Activate()

Archive()

Search()

Find()

Versioning()
```

---

# 21. Repository Layer

```text id="cur011"
CurriculumRepository

VersionRepository

MetadataRepository
```

---

# 22. Transaction Flow

```text id="cur012"
Create Version

↓

Validation

↓

Save Version

↓

Publish

↓

Activate (Optional)

↓

Audit

↓

Commit
```

---

# 23. Event Publishing

Event:

```text id="cur013"
curriculum.created

curriculum.updated

curriculum.published

curriculum.activated

curriculum.archived
```

---

# 24. Background Job

Job:

* Curriculum Cache Refresh
* Search Index Update
* Analytics Synchronization

---

# 25. Cache Strategy

Redis menyimpan:

* Curriculum List
* Active Curriculum
* Curriculum Metadata

TTL:

```text id="cur014"
1 Hour
```

Cache dibersihkan setelah publish atau aktivasi.

---

# 26. Search Strategy

Pencarian berdasarkan:

* Code
* Name
* Version
* Status
* Education Level

Pagination dan sorting wajib diterapkan.

---

# 27. Security Rules

Semua endpoint:

* JWT Required
* RBAC Validation
* Audit Logging

Teacher dan Student hanya memiliki akses baca melalui modul lain.

---

# 28. Audit Log

Audit mencatat:

* Curriculum Created
* Curriculum Updated
* Version Published
* Curriculum Activated
* Curriculum Archived

---

# 29. Error Handling

| Code                       | Description                    |
| -------------------------- | ------------------------------ |
| CURRICULUM_NOT_FOUND       | Kurikulum tidak ditemukan      |
| CURRICULUM_ALREADY_EXISTS  | Kode kurikulum sudah digunakan |
| VERSION_ALREADY_ACTIVE     | Versi sudah aktif              |
| INVALID_CURRICULUM_VERSION | Versi tidak valid              |
| CURRICULUM_IN_USE          | Kurikulum sedang digunakan     |

---

# 30. Sequence Diagram

```text id="cur015"
Academic Admin

↓

Curriculum API

↓

Curriculum Service

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

Terintegrasi dengan:

* School Management
* Subject
* Chapter
* Material
* Question Bank
* Exam
* CBT Runtime
* Analytics
* AI Service

Seluruh modul akademik bergantung pada kurikulum aktif.

---

# 32. Performance Target

| Metric            | Target   |
| ----------------- | -------- |
| Curriculum Detail | < 100 ms |
| Curriculum List   | < 200 ms |
| Publish Version   | < 500 ms |
| Activate Version  | < 300 ms |

---

# 33. Test Scenario

### Unit Test

* Create Curriculum.
* Publish Version.
* Activate Version.
* Validation.
* Version Conflict.

### Integration Test

* CRUD Curriculum.
* Versioning.
* Publish.
* Activate.
* Cache Refresh.

### Security Test

* Unauthorized Access.
* Invalid Permission.
* Publish tanpa hak akses.
* Aktivasi versi ganda.

---

# 34. Future Enhancement

* Custom Curriculum per Sekolah
* Curriculum Comparison
* Curriculum Import/Export
* Competency Mapping
* Learning Outcome Versioning
* Curriculum Diff Viewer
* AI Curriculum Recommendation

---

# 35. Dependencies

Module bergantung pada:

* School Management
* Configuration Management
* Logging
* Redis
* Analytics
* Audit

Menjadi dependency utama bagi Subject, Chapter, Material, Question Bank, dan CBT.

---

# 36. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD kurikulum berjalan.
* Versioning berfungsi.
* Hanya satu versi aktif.
* Publish dan aktivasi tervalidasi.
* Audit log tersedia.
* Cache diperbarui otomatis.
* Unit, integration, dan security test lulus.
* API terdokumentasi dalam OpenAPI.

---

# 37. Summary

Curriculum Module merupakan fondasi struktur akademik YakinLulus.id. Modul ini mengelola kurikulum beserta versi dan statusnya sehingga seluruh materi, bank soal, CBT, analitik, dan layanan AI selalu mengacu pada struktur akademik yang konsisten.

Dengan dukungan versioning, lifecycle management, dan desain yang siap untuk multi-kurikulum, modul ini memungkinkan platform beradaptasi terhadap perubahan kebijakan pendidikan tanpa memerlukan perubahan besar pada arsitektur backend.
