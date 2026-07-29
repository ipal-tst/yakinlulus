# 03_school_management.md

# YakinLulus.id Backend Specification — School Management Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

School Management Module bertanggung jawab mengelola seluruh data institusi pendidikan yang menjadi ruang lingkup operasional YakinLulus.id.

Pada MVP, platform mendukung **single active school** untuk setiap siswa, namun arsitektur database dan business layer telah dirancang agar siap berkembang menjadi **multi-school** dan **multi-tenant** tanpa perubahan besar.

School Management menjadi master data yang digunakan oleh hampir seluruh modul backend.

---

# 2. Module Responsibility

Module bertanggung jawab terhadap:

* School Master
* School Profile
* School Configuration
* Academic Structure
* School Status
* School Membership
* School Assignment
* School Branding
* School Activation

Module ini **tidak bertanggung jawab** terhadap:

* Authentication
* User Profile
* Curriculum
* Question Bank
* CBT
* Analytics

---

# 3. Architecture Position

```text id="sch001"
Platform
    │
    ▼
School Management
    │
    ├──────────────┐
    ▼              ▼
User        Academic Module
    │              │
    └──────────────┘
           ▼
Business Module
```

---

# 4. Business Objectives

Module ini bertujuan untuk:

* Menjadi master data institusi.
* Mendukung banyak sekolah.
* Memisahkan data antar sekolah.
* Menjadi dasar penerapan RBAC berbasis sekolah.
* Mendukung ekspansi menjadi SaaS multi-tenant.

---

# 5. Actors

* School Admin
* Platform Admin
* Super Admin

Student dan Teacher hanya dapat melihat informasi sekolahnya sendiri.

---

# 6. Supported School Type

MVP:

* SD
* SMP
* SMA
* SMK

Future:

* Bimbel
* Perguruan Tinggi
* Lembaga Kursus
* Corporate Training

---

# 7. School Lifecycle

```text id="sch002"
Draft

↓

Pending Verification

↓

Active

↓

Suspended

↓

Archived
```

Hanya sekolah berstatus **Active** yang dapat digunakan.

---

# 8. RBAC

Permission utama:

```text id="sch003"
school.read

school.create

school.update

school.delete

school.activate

school.suspend

school.branding

school.setting
```

---

# 9. Business Rules

### BR-001

Nama sekolah tidak harus unik.

---

### BR-002

NPSN harus unik apabila diisi.

---

### BR-003

School Code harus unik.

---

### BR-004

School Admin hanya dapat mengelola sekolahnya sendiri.

---

### BR-005

Platform Admin dapat mengelola seluruh sekolah.

---

### BR-006

Sekolah yang diarsipkan tidak dapat menerima user baru.

---

### BR-007

Sekolah tidak boleh dihapus apabila masih memiliki user aktif.

---

### BR-008

Soft Delete digunakan pada seluruh data sekolah.

---

# 10. Data Model

Entity utama:

```text id="sch004"
schools

school_settings

school_brandings

school_members

school_domains
```

Relasi:

```text id="sch005"
School

↓

Users

↓

Classes

↓

Subjects

↓

Materials

↓

Question Bank

↓

Exam
```

---

# 11. School Profile

Field utama:

* School Name
* School Code
* NPSN
* Education Level
* Address
* Province
* Regency
* District
* Postal Code
* Phone
* Email
* Website
* Principal Name
* Accreditation
* Status

---

# 12. School Branding

Branding meliputi:

* Logo
* Icon
* Primary Color
* Secondary Color
* Theme
* School Banner

Disimpan pada Supabase Storage.

---

# 13. School Settings

Setting sekolah:

* Timezone
* Language
* Academic Year
* Semester
* CBT Configuration
* Notification Preference
* AI Feature Toggle

Disimpan terpisah dari tabel master.

---

# 14. School Membership

Setiap user memiliki relasi:

```text id="sch006"
User

↓

School

↓

Role

↓

Membership Status
```

Future mendukung multi-school membership.

---

# 15. Use Cases

Platform Admin:

* Membuat sekolah.
* Mengubah sekolah.
* Menonaktifkan sekolah.
* Mengatur branding.

School Admin:

* Melihat profil sekolah.
* Mengubah data sekolah.
* Mengelola konfigurasi.

---

# 16. Functional Specification

Fitur:

* Create School
* Update School
* Soft Delete School
* Activate School
* Suspend School
* School Detail
* School List
* School Branding
* School Setting

---

# 17. DTO

## Create School

```json id="sch007"
{
  "school_name": "SMA Negeri 1",
  "school_code": "SMAN1YK",
  "education_level": "SMA",
  "province": "DI Yogyakarta"
}
```

---

## School Response

```json id="sch008"
{
  "id": "uuid",
  "school_name": "SMA Negeri 1",
  "status": "ACTIVE"
}
```

---

# 18. Validation Rules

| Field           | Rule             |
| --------------- | ---------------- |
| School Name     | Required         |
| School Code     | Required, Unique |
| Education Level | Required         |
| NPSN            | Optional, Unique |
| Email           | Valid Email      |
| Website         | Valid URL        |

---

# 19. API Summary

```text id="sch009"
GET    /api/v1/schools

GET    /api/v1/schools/{id}

POST   /api/v1/schools

PUT    /api/v1/schools/{id}

PATCH  /api/v1/schools/{id}/status

DELETE /api/v1/schools/{id}

GET    /api/v1/schools/{id}/settings

PUT    /api/v1/schools/{id}/settings
```

---

# 20. Service Layer

```text id="sch010"
SchoolService

Create()

Update()

Delete()

Activate()

Suspend()

UpdateBranding()

UpdateSetting()

Find()

Search()
```

---

# 21. Repository Layer

```text id="sch011"
SchoolRepository

SchoolSettingRepository

BrandingRepository

MembershipRepository
```

---

# 22. Transaction Flow

Create School:

```text id="sch012"
Create School

↓

Create Default Setting

↓

Create Branding

↓

Audit Log

↓

Commit
```

Rollback dilakukan jika salah satu langkah gagal.

---

# 23. Event Publishing

Event:

```text id="sch013"
school.created

school.updated

school.deleted

school.activated

school.suspended

school.setting.updated
```

---

# 24. Background Job

Job:

* Branding Image Optimization
* School Analytics Aggregation
* Membership Synchronization
* Cache Refresh

---

# 25. Cache Strategy

Redis digunakan untuk:

* School Detail
* School Setting
* School Branding
* School Permission

TTL:

```text id="sch014"
30 Minutes
```

Cache dibersihkan setiap terjadi perubahan.

---

# 26. Search Strategy

Pencarian berdasarkan:

* School Name
* School Code
* NPSN
* Province
* Regency
* Education Level
* Status

Pagination wajib.

---

# 27. File Storage

Menggunakan Supabase Storage.

Folder:

```text id="sch015"
school-logo/

school-banner/

school-document/
```

Upload menggunakan Signed URL.

---

# 28. Security Rules

Semua endpoint:

* JWT Required
* RBAC Validation
* School Ownership Validation
* Audit Logging

School Admin tidak dapat mengakses data sekolah lain.

---

# 29. Audit Log

Audit mencatat:

* School Created
* School Updated
* Branding Changed
* Setting Changed
* Status Changed
* School Archived

---

# 30. Error Handling

| Code                    | Description                       |
| ----------------------- | --------------------------------- |
| SCHOOL_NOT_FOUND        | Sekolah tidak ditemukan           |
| SCHOOL_ALREADY_EXISTS   | School Code sudah digunakan       |
| INVALID_EDUCATION_LEVEL | Jenjang tidak valid               |
| SCHOOL_HAS_ACTIVE_USER  | Sekolah masih memiliki user aktif |
| SCHOOL_SUSPENDED        | Sekolah dinonaktifkan             |

---

# 31. Sequence Diagram

```text id="sch016"
Admin

↓

School API

↓

School Service

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

# 32. Integration

Terintegrasi dengan:

* Authentication
* User Management
* Curriculum
* Subject
* Chapter
* Question Bank
* Material
* Exam
* CBT Runtime
* Analytics
* Notification

School menjadi root context untuk hampir seluruh data akademik.

---

# 33. Performance Target

| Metric         | Target   |
| -------------- | -------- |
| School Detail  | < 100 ms |
| School Search  | < 300 ms |
| Create School  | < 500 ms |
| Update Setting | < 300 ms |

---

# 34. Test Scenario

### Unit Test

* Create School.
* Update School.
* Branding Validation.
* Setting Validation.
* Soft Delete.

### Integration Test

* CRUD School.
* Branding Upload.
* School Setting.
* Membership Validation.

### Security Test

* Cross-school access.
* Invalid permission.
* Unauthorized request.
* Soft delete validation.

---

# 35. Future Enhancement

* Multi-Tenant Architecture
* School Subscription
* Branch/Campus Management
* School Billing
* Custom Domain
* White Label Branding
* Organization Hierarchy
* School API Token
* School Marketplace

---

# 36. Dependencies

Module bergantung pada:

* User Management
* Authentication
* File Management
* Notification
* Configuration Management
* Logging
* Redis
* Supabase Storage

---

# 37. Acceptance Criteria

Module dinyatakan selesai apabila:

* CRUD sekolah berjalan.
* Branding tersimpan pada Supabase Storage.
* Setting sekolah dapat dikonfigurasi.
* School ownership diterapkan pada seluruh endpoint.
* Soft delete berjalan.
* Audit log tersedia.
* Unit, integration, dan security test lulus.
* API terdokumentasi dalam OpenAPI.

---

# 38. Summary

School Management Module merupakan fondasi organisasi pada backend YakinLulus.id. Modul ini mengelola identitas institusi, konfigurasi operasional, branding, dan relasi dengan pengguna sehingga seluruh data akademik memiliki konteks sekolah yang jelas.

Desain modul mendukung kebutuhan MVP dengan satu sekolah aktif per pengguna, namun telah disiapkan untuk berkembang menjadi arsitektur **multi-school** dan **multi-tenant** tanpa perubahan besar pada domain maupun struktur backend.
