Berikut draft **`PRD/08_functional_requirement.md`**.

Dokumen ini disusun dalam format **Software Requirement Specification (SRS)** sehingga dapat dijadikan acuan langsung oleh **Backend Engineer, Frontend Engineer, QA Engineer, DevOps, dan Technical Writer**. Requirement ID dibuat konsisten agar dapat ditelusuri (traceability) hingga ke API, database, test case, dan acceptance criteria.

```md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Functional Requirement

| Attribute | Value |
|---|---|
| Document | Functional Requirement |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Business Rule |
| Purpose | Define Functional System Behaviour |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan seluruh kebutuhan fungsional sistem YakinLulus.id.

Setiap requirement memiliki:

- Requirement ID
- Module
- Priority
- Actor
- Description
- Preconditions
- Trigger
- Main Flow
- Alternative Flow
- Exception Flow
- Postconditions
- Related Entities
- Related APIs

---

# 2. Requirement Priority

| Priority | Definition |
|----------|------------|
| P0 | Mandatory MVP |
| P1 | Important |
| P2 | Enhancement |
| P3 | Future |

---

# 3. Authentication Module

---

## FR-AUTH-001

### Login

Priority

P0

Actors

- Admin
- Staff
- Teacher
- Student

Description

Sistem harus mengizinkan pengguna melakukan login menggunakan kredensial yang valid.

Preconditions

- User telah terdaftar.
- User berstatus ACTIVE.

Trigger

User menekan tombol Login.

Main Flow

1. User memasukkan email/username.
2. User memasukkan password.
3. Sistem melakukan autentikasi.
4. Sistem memvalidasi status akun.
5. Sistem membuat session/token.
6. Sistem mengarahkan user ke dashboard sesuai role.

Alternative Flow

Password salah.

Exception Flow

Akun tidak aktif.

Postconditions

Session aktif.

Related Entity

- User
- UserRole
- LoginHistory

Related API

POST /auth/login

---

## FR-AUTH-002

Logout

Priority

P0

System harus:

- menghapus session
- menghapus refresh token
- mencatat aktivitas logout

API

POST /auth/logout

---

# 4. User Management Module

---

## FR-USER-001

Create User

Priority

P0

Actor

Admin

Description

Admin dapat membuat user baru.

Input

- Name
- Email
- Role
- Password

Validation

- Email unik
- Password memenuhi policy

Output

User berhasil dibuat.

Entity

User

API

POST /users

---

## FR-USER-002

Update User

Priority

P0

Actor

Admin

Description

Mengubah data user.

Tidak diperbolehkan mengubah User ID.

API

PUT /users/{id}

---

## FR-USER-003

Deactivate User

Priority

P0

Actor

Admin

Rule

User tidak dihapus permanen.

Status berubah menjadi:

INACTIVE

---

# 5. Education Management Module

---

## FR-EDU-001

Manage Education Level

Priority

P0

Admin dapat:

- Create
- Update
- Archive

Entity

EducationLevel

---

## FR-EDU-002

Manage Subject

Priority

P0

System harus mendukung:

- Subject
- Class Mapping
- Curriculum Mapping

---

## FR-EDU-003

Manage Chapter

Priority

P0

Setiap Chapter wajib memiliki Subject.

---

# 6. Question Bank Module

---

## FR-QB-001

Create Question

Priority

P0

Actors

- Admin
- Staff
- Teacher

Description

Membuat soal baru.

Mandatory

- Subject
- Chapter
- Difficulty
- Source
- Question
- Answer
- Explanation

Status awal

DRAFT

Entity

Question

QuestionOption

QuestionExplanation

API

POST /questions

---

## FR-QB-002

Update Question

Priority

P0

Rule

Jika soal belum dipakai ujian:

Update langsung.

Jika sudah pernah digunakan:

System membuat versi baru.

---

## FR-QB-003

Publish Question

Priority

P0

Precondition

Status:

APPROVED

Result

Status berubah:

PUBLISHED

---

## FR-QB-004

Archive Question

Priority

P0

System melakukan:

Soft Delete.

---

## FR-QB-005

Search Question

Priority

P0

Support Filter

- Education Level
- Class
- Subject
- Chapter
- Difficulty
- Source
- Status

---

## FR-QB-006

Bulk Import Question

Priority

P1

Input

Excel Template

Main Flow

1 Upload file

2 Validate

3 Preview

4 Import

5 Generate Report

API

POST /questions/import

---

## FR-QB-007

Export Question

Priority

P1

Output

Excel

CSV

---

# 7. CBT Module

---

## FR-CBT-001

Create Exam

Priority

P0

Actor

Admin

Teacher

Input

- Title
- Subject
- Duration
- Question Count
- Randomization
- Schedule

Entity

Exam

API

POST /exam

---

## FR-CBT-002

Publish Exam

Priority

P0

Rule

Exam hanya dapat dipublish apabila:

Jumlah soal terpenuhi.

---

## FR-CBT-003

Start Exam

Priority

P0

Precondition

- User login
- Jadwal aktif

Main Flow

1 Start session

2 Generate question

3 Start timer

4 Save session

---

## FR-CBT-004

Generate Random Question

Priority

P0

System menghasilkan:

Question Set berbeda setiap peserta.

---

## FR-CBT-005

Generate Random Option

Priority

P0

System mengacak opsi jawaban.

---

## FR-CBT-006

Auto Save

Priority

P0

Trigger

Jawaban berubah.

Action

Save Answer.

---

## FR-CBT-007

Resume Session

Priority

P0

Apabila koneksi terputus.

System:

- restore session
- restore timer
- restore answer

---

## FR-CBT-008

Submit Exam

Priority

P0

System:

- lock answer
- calculate score
- store result

---

## FR-CBT-009

Auto Submit

Priority

P0

Trigger

Timer selesai.

---

## FR-CBT-010

View Result

Priority

P0

Visibility mengikuti konfigurasi exam.

---

# 8. Learning Material Module

---

## FR-MAT-001

Create Material

Priority

P1

Support:

- Text
- Image
- Document

---

## FR-MAT-002

Publish Material

Priority

P1

Status:

PUBLISHED

---

## FR-MAT-003

Read Material

Priority

P1

System memperbarui:

Learning Progress.

---

# 9. Student Dashboard Module

---

## FR-DASH-001

Dashboard Summary

Priority

P0

Menampilkan:

- Total Practice
- Total Exam
- Average Score
- Progress

---

## FR-DASH-002

Exam History

Priority

P0

Menampilkan histori CBT.

---

## FR-DASH-003

Practice History

Priority

P0

Menampilkan histori latihan.

---

# 10. Learning Analytics Module

---

## FR-ANA-001

Performance Analysis

Priority

P1

Analisis berdasarkan:

- Subject
- Chapter
- Difficulty

---

## FR-ANA-002

Weak Topic Detection

Priority

P1

System menghasilkan:

Topik dengan performa terendah.

---

## FR-ANA-003

Learning Recommendation

Priority

P1

System memberikan rekomendasi:

- materi
- latihan

---

# 11. Administration Module

---

## FR-ADM-001

Manage Configuration

Priority

P0

Admin dapat mengubah:

- Exam Setting
- Application Setting
- Permission

---

## FR-ADM-002

Audit Log

Priority

P0

System mencatat:

- Login
- CRUD
- Import
- Export
- Role Change

---

## FR-ADM-003

View Dashboard

Priority

P0

Admin melihat:

- User Count
- Question Count
- Exam Count
- Activity

---

# 12. Notification Module

---

## FR-NOTIF-001

System Notification

Priority

P1

Event

- Login
- Import
- Publish
- Submit

---

# 13. File Management Module

---

## FR-FILE-001

Upload File

Priority

P1

Support

- JPG
- PNG
- PDF

---

## FR-FILE-002

File Validation

Priority

P1

System memvalidasi:

- ukuran
- tipe
- keamanan file

---

# 14. Common Functional Requirements

---

## FR-COM-001

Pagination

Seluruh list mendukung:

- pagination
- sorting
- filtering

---

## FR-COM-002

Search

Semua master data mendukung keyword search.

---

## FR-COM-003

Audit

Semua perubahan penting dicatat.

---

## FR-COM-004

Soft Delete

Seluruh master data menggunakan Soft Delete.

---

## FR-COM-005

UUID

Seluruh entity menggunakan UUID.

---

## FR-COM-006

API Response

Seluruh endpoint menggunakan format response yang konsisten.

---

## FR-COM-007

Validation

Semua input divalidasi:

- client side
- server side

---

# 15. Functional Requirement Traceability

| Module | Requirement ID |
|----------|----------------|
| Authentication | FR-AUTH-001 ~ 002 |
| User Management | FR-USER-001 ~ 003 |
| Education | FR-EDU-001 ~ 003 |
| Question Bank | FR-QB-001 ~ 007 |
| CBT | FR-CBT-001 ~ 010 |
| Material | FR-MAT-001 ~ 003 |
| Dashboard | FR-DASH-001 ~ 003 |
| Analytics | FR-ANA-001 ~ 003 |
| Administration | FR-ADM-001 ~ 003 |
| Notification | FR-NOTIF-001 |
| Common | FR-COM-001 ~ 007 |

---

# 16. Functional Requirement Summary

Total Functional Modules

- Authentication
- User Management
- Education Management
- Question Bank
- CBT Engine
- Learning Material
- Student Dashboard
- Learning Analytics
- Administration
- Notification
- File Management

Total Requirement

≈ 45 Functional Requirements

Semua requirement memiliki:

- Business Rule
- Database Support
- API Support
- UI Support
- QA Testability

---

# Document Status

Current

Completed - Functional Requirement Definition

Next Document

09_non_functional_requirement.md
```

## Catatan Arsitektur

Mulai dari dokumen ini, saya menyarankan agar seluruh requirement memiliki **Requirement Traceability Matrix (RTM)**. Artinya setiap requirement akan dapat ditelusuri secara end-to-end:

```text
Business Goal
      │
      ▼
Business Rule (BR)
      │
      ▼
Functional Requirement (FR)
      │
      ▼
API Specification
      │
      ▼
Database Entity
      │
      ▼
Frontend Screen
      │
      ▼
Test Case
      │
      ▼
Acceptance Criteria
```

Dengan pendekatan ini, ketika proyek berkembang menjadi ratusan endpoint dan puluhan engineer, setiap perubahan dapat dilacak dampaknya dengan jelas dan konsisten.
