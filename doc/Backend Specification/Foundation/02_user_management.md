# 02_user_management.md

# YakinLulus.id Backend Specification — User Management Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

User Management Module bertanggung jawab mengelola seluruh data pengguna pada platform YakinLulus.id.

Module ini menjadi pusat pengelolaan identitas bisnis (Business Identity) yang terhubung dengan **Supabase Authentication** sebagai Identity Provider.

Authentication mengelola proses login, sedangkan User Management mengelola profil, status, relasi akademik, role, dan informasi operasional pengguna.

---

# 2. Module Responsibility

User Management bertanggung jawab terhadap:

* User Profile
* Student Profile
* Teacher Profile
* Staff Profile
* School Admin Profile
* Platform Admin Profile
* User Status
* User Activation
* User Assignment
* User Search
* User Directory
* Academic Assignment

Module ini **tidak bertanggung jawab** terhadap:

* Login
* JWT
* Password
* Session
* Permission Validation

---

# 3. Architecture Position

```text
Authentication
        │
        ▼
User Management
        │
        ▼
School Management
        │
        ▼
Academic Module
        │
        ▼
Business Module
```

---

# 4. Business Objectives

Module ini dirancang untuk:

* Menjadi Single Source of Truth data pengguna.
* Mendukung multi-role.
* Mendukung multi-school di masa depan.
* Mendukung assignment akademik.
* Menjadi referensi seluruh module backend.

---

# 5. Supported User Types

MVP:

| User Type      | Supported |
| -------------- | --------- |
| Student        | ✅         |
| Teacher        | ✅         |
| Staff          | ✅         |
| School Admin   | ✅         |
| Platform Admin | ✅         |
| Super Admin    | ✅         |

Future:

* Parent
* Counselor
* Supervisor
* Content Reviewer

---

# 6. User Lifecycle

```text
Invited

↓

Registered

↓

Verified

↓

Active

↓

Suspended

↓

Inactive

↓

Archived
```

Status memengaruhi hak akses pengguna.

---

# 7. Actors

Module digunakan oleh:

* Student
* Teacher
* Staff
* School Admin
* Platform Admin
* Super Admin

---

# 8. RBAC

Permission utama:

```text
user.read

user.create

user.update

user.delete

user.activate

user.deactivate

user.assign.role

user.assign.school

user.export
```

Permission dipetakan melalui RBAC.

---

# 9. Business Rules

### BR-001

Email harus unik.

---

### BR-002

Supabase User wajib memiliki Business User.

---

### BR-003

User yang dinonaktifkan tidak dapat mengakses sistem.

---

### BR-004

Role hanya dapat diubah oleh pengguna yang memiliki permission.

---

### BR-005

Student hanya boleh memiliki satu sekolah aktif pada MVP.

---

### BR-006

Teacher dapat mengajar lebih dari satu kelas.

---

### BR-007

School Admin hanya dapat mengelola user dalam sekolahnya.

---

### BR-008

Platform Admin dapat mengelola seluruh sekolah.

---

# 10. Data Model

Entity utama:

```text
users

roles

permissions

user_roles

schools

student_profiles

teacher_profiles

staff_profiles
```

---

# 11. Relationships

```text
User

↓

Student Profile

Teacher Profile

Staff Profile

↓

School

↓

Role
```

Setiap User memiliki tepat satu profil sesuai tipe pengguna.

---

# 12. Use Cases

Student:

* Melihat profil.
* Mengubah foto.
* Mengubah data tertentu.

Teacher:

* Mengelola profil.
* Melihat assignment.

School Admin:

* Membuat user.
* Mengaktifkan user.
* Menonaktifkan user.
* Menetapkan role.

Platform Admin:

* Mengelola seluruh user.

---

# 13. Functional Specification

Fitur:

* Create User
* Update User
* Delete User (Soft Delete)
* Activate User
* Suspend User
* Search User
* User Detail
* User Assignment
* User Import (Future)

---

# 14. User Status

Status:

```text
ACTIVE

INACTIVE

SUSPENDED

PENDING

ARCHIVED
```

Status divalidasi pada Authentication Middleware.

---

# 15. User Profile

Informasi umum:

* Full Name
* Email
* Phone
* Gender
* Birth Date
* Avatar
* Address
* Status

Informasi sensitif mengikuti kebijakan PII.

---

# 16. Student Profile

Field utama:

* Student Number
* School
* Grade
* Class
* Academic Year
* Enrollment Date
* Graduation Year (Future)

---

# 17. Teacher Profile

Field utama:

* Teacher Number
* Subjects
* Homeroom Class (Opsional)
* Employment Status
* Join Date

---

# 18. Staff Profile

Field utama:

* Staff Number
* Department
* Position
* Join Date

---

# 19. DTO

## Create User

```json
{
  "email": "teacher@example.com",
  "full_name": "John Doe",
  "role": "teacher",
  "school_id": "uuid"
}
```

---

## User Response

```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "teacher@example.com",
  "status": "ACTIVE"
}
```

---

# 20. Validation Rules

| Field     | Rule                              |
| --------- | --------------------------------- |
| Email     | Required, Unique                  |
| Full Name | Required                          |
| Role      | Required                          |
| School    | Required (kecuali Platform Admin) |
| Phone     | Optional, Valid Format            |

---

# 21. API Summary

```text
GET    /api/v1/users

GET    /api/v1/users/{id}

POST   /api/v1/users

PUT    /api/v1/users/{id}

PATCH  /api/v1/users/{id}/status

DELETE /api/v1/users/{id}

GET    /api/v1/profile

PUT    /api/v1/profile
```

---

# 22. Service Layer

Service:

```text
UserService

CreateUser()

UpdateUser()

GetUser()

ListUsers()

SearchUsers()

ActivateUser()

SuspendUser()

AssignRole()

AssignSchool()

UpdateProfile()
```

---

# 23. Repository Layer

Repository:

```text
UserRepository

RoleRepository

ProfileRepository

SchoolRepository
```

Repository hanya menangani akses data.

---

# 24. Transaction Flow

Create User:

```text
Create User

↓

Create Supabase User

↓

Create Business User

↓

Assign Role

↓

Create Profile

↓

Audit Log

↓

Commit
```

Jika salah satu langkah gagal, transaksi dibatalkan.

---

# 25. Event Publishing

Event:

```text
user.created

user.updated

user.deleted

user.activated

user.deactivated

user.role.changed

user.school.changed
```

Event dikonsumsi oleh Analytics dan Notification.

---

# 26. Background Job

Job:

* Welcome Notification
* User Synchronization
* User Analytics
* Inactive User Detection (Future)

---

# 27. Cache Strategy

Redis menyimpan:

* User Permission Cache
* User Context Cache
* User Directory Cache

TTL direkomendasikan:

```text
10 Minutes
```

Cache dihapus ketika profil atau role berubah.

---

# 28. Search Strategy

Pencarian mendukung:

* Name
* Email
* Student Number
* Teacher Number
* School
* Role
* Status

Pagination wajib diterapkan.

---

# 29. Security Rules

Semua endpoint:

* JWT Required
* RBAC Validation
* Ownership Validation
* Audit Logging
* Request Validation

Student hanya dapat memperbarui profilnya sendiri.

---

# 30. Audit Log

Dicatat:

* User Created
* User Updated
* Status Changed
* Role Changed
* School Assignment
* Profile Updated

Audit tidak dapat dimodifikasi.

---

# 31. Error Handling

| Code                | Description            |
| ------------------- | ---------------------- |
| USER_NOT_FOUND      | User tidak ditemukan   |
| USER_ALREADY_EXISTS | Email sudah digunakan  |
| USER_INACTIVE       | User tidak aktif       |
| INVALID_ROLE        | Role tidak valid       |
| INVALID_SCHOOL      | School tidak ditemukan |
| PROFILE_NOT_FOUND   | Profil tidak ditemukan |

---

# 32. Sequence Diagram

```text
Admin

↓

User API

↓

User Service

↓

Supabase Auth

↓

Repository

↓

Database

↓

Audit

↓

Response
```

---

# 33. Integration

Terintegrasi dengan:

* Authentication
* School Management
* Curriculum
* Question Bank
* Material
* CBT Runtime
* Analytics
* Notification
* File Management

User Management menjadi referensi identitas bisnis untuk seluruh modul.

---

# 34. Performance Target

| Metric           | Target   |
| ---------------- | -------- |
| User Detail      | < 100 ms |
| User Search      | < 300 ms |
| Create User      | < 500 ms |
| Update User      | < 300 ms |
| Permission Cache | < 10 ms  |

---

# 35. Test Scenario

### Unit Test

* Create User.
* Update Profile.
* Assign Role.
* Change Status.
* Validation.

### Integration Test

* Create User + Supabase.
* Search User.
* Update User.
* Delete User (Soft Delete).
* Permission Validation.

### Security Test

* Unauthorized Access.
* Horizontal Privilege Escalation.
* Invalid Role Assignment.
* Access ke sekolah lain.

---

# 36. Future Enhancement

* Parent Profile
* Guardian Relationship
* Multi School Membership
* Bulk Import User
* CSV/Excel Synchronization
* Organizational Structure
* User Merge
* Avatar AI Cropping
* Activity Timeline
* User Preferences

---

# 37. Dependencies

Module bergantung pada:

* Authentication
* RBAC
* School Management
* Configuration Management
* Notification
* Analytics
* Logging
* Audit
* Redis

---

# 38. Acceptance Criteria

Module dianggap selesai apabila:

* User dapat dibuat dan disinkronkan dengan Supabase Auth.
* Profil seluruh tipe pengguna dapat dikelola.
* Role dan school assignment berfungsi.
* Status pengguna memengaruhi proses autentikasi.
* Audit log tersedia.
* RBAC diterapkan pada seluruh endpoint.
* Unit, integration, dan security test lulus.
* API terdokumentasi dalam OpenAPI.

---

# 39. Summary

User Management Module merupakan pusat pengelolaan identitas bisnis pada YakinLulus.id. Modul ini memisahkan autentikasi dari pengelolaan data pengguna sehingga setiap identitas memiliki profil akademik, role, status, dan relasi organisasi yang konsisten.

Dengan integrasi ke Supabase Authentication, RBAC, School Management, dan modul akademik lainnya, desain ini mendukung kebutuhan MVP sekaligus siap berkembang menuju arsitektur multi-sekolah dan multi-tenant pada fase berikutnya.
