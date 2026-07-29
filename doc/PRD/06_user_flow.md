Berikut draft **`PRD/06_user_flow.md`** untuk **YakinLulus.id**.

Dokumen ini disusun berdasarkan domain model, ERD, LDM, dan arsitektur database yang telah dibuat. User flow dirancang agar selaras dengan implementasi backend, API, dan UX, sehingga dapat langsung digunakan sebagai acuan pembuatan wireframe maupun sequence diagram.

````md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: User Flow

| Attribute | Value |
|---|---|
| Document | User Flow |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Feature Requirement |
| Purpose | Define End-to-End User Journey |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan alur interaksi seluruh pengguna dengan sistem YakinLulus.id.

User Flow digunakan sebagai acuan untuk:

- UI/UX Design
- API Design
- Backend Workflow
- Database Transaction Flow
- QA Test Scenario
- Acceptance Criteria

---

# 2. Supported User Role

```
System Users

├── Admin
├── Staff
├── Teacher
└── Student
```

---

# 3. High Level User Flow

```
Login
   │
   ▼
Authentication
   │
   ▼
Role Validation
   │
   ▼
Dashboard
   │
   ├──────── Student Dashboard
   ├──────── Teacher Dashboard
   ├──────── Staff Dashboard
   └──────── Admin Dashboard
```

---

# 4. Student User Journey

## Objective

Membantu siswa belajar, berlatih, mengikuti CBT, dan memonitor perkembangan belajar.

---

## Flow Overview

```
Login
   │
Dashboard
   │
Select Subject
   │
Choose Activity
   │
├── Study Material
├── Practice Question
└── CBT Exam
```

---

# 5. Student Flow - Login

```
Open Website

↓

Login

↓

Credential Validation

↓

Success

↓

Student Dashboard
```

---

## Alternative Flow

```
Invalid Credential

↓

Show Error

↓

Retry Login
```

---

## Exception Flow

```
Account Disabled

↓

Display Information

↓

Contact Administrator
```

---

# 6. Student Flow - Study Material

```
Dashboard

↓

Learning Material

↓

Choose

Education Level

↓

Class

↓

Subject

↓

Chapter

↓

Subchapter

↓

Read Material

↓

Learning Progress Updated
```

---

## System Action

System mencatat:

- waktu belajar
- chapter terakhir
- progress
- completion status

---

# 7. Student Flow - Practice Question

```
Dashboard

↓

Question Bank

↓

Select Filter

↓

Generate Question List

↓

Start Practice

↓

Answer Questions

↓

Submit

↓

Result

↓

Explanation

↓

Learning Progress Updated
```

---

## Filter Flow

Student dapat memilih:

```
Education Level

↓

Class

↓

Subject

↓

Chapter

↓

Difficulty
```

---

## During Practice

Student dapat:

- next question
- previous question
- bookmark
- submit kapan saja

---

## End Practice

System menghasilkan:

```
Score

Correct

Wrong

Accuracy

Explanation
```

---

# 8. Student Flow - CBT Examination

```
Dashboard

↓

Exam List

↓

Select Exam

↓

Read Instruction

↓

Start Exam

↓

Timer Started

↓

Answer Questions

↓

Submit

↓

Result Processing

↓

Score

↓

History Updated
```

---

## During Exam

Student dapat:

- next
- previous
- jump question
- flag question
- review unanswered

---

## Auto Save Flow

```
Answer Changed

↓

Auto Save

↓

Database Updated
```

Dilakukan setiap perubahan jawaban.

---

## Network Failure Flow

```
Connection Lost

↓

Save Local Session

↓

Reconnect

↓

Synchronize Answer

↓

Continue Exam
```

---

## Time Expired

```
Timer End

↓

Auto Submit

↓

Result Processing
```

---

# 9. Student Flow - View Result

```
Exam Finished

↓

Calculate Score

↓

Store Result

↓

Generate Analytics

↓

Display Result
```

---

## Result Information

Menampilkan:

- nilai
- benar
- salah
- durasi
- persentase
- pembahasan (sesuai konfigurasi ujian)

---

# 10. Student Flow - Dashboard

Dashboard menampilkan:

```
Learning Summary

↓

Practice History

↓

Exam History

↓

Average Score

↓

Progress

↓

Recommendation
```

---

# 11. Teacher User Journey

## Objective

Guru membuat soal, membuat CBT, dan mengevaluasi hasil siswa.

---

## Flow

```
Login

↓

Teacher Dashboard

↓

Select Activity

↓

Question Bank

or

Exam Management

or

Analytics
```

---

# 12. Teacher Flow - Create Question

```
Question Bank

↓

New Question

↓

Fill Metadata

↓

Input Question

↓

Input Options

↓

Input Answer

↓

Input Explanation

↓

Save Draft

↓

Submit Review
```

---

## Metadata

Guru wajib mengisi:

- jenjang
- kelas
- mata pelajaran
- chapter
- tingkat kesulitan
- sumber soal

---

# 13. Teacher Flow - Create Exam

```
Exam

↓

New Exam

↓

Fill Information

↓

Select Question Source

↓

Configure Exam

↓

Preview

↓

Publish
```

---

## Configuration

- jumlah soal
- durasi
- random soal
- random opsi
- jadwal
- hasil langsung / ditunda

---

# 14. Teacher Flow - Analyze Student

```
Analytics

↓

Select Class

↓

Select Student

↓

View Performance

↓

Subject Analysis

↓

Chapter Analysis

↓

Weak Topic

↓

Recommendation
```

---

# 15. Staff User Journey

## Objective

Mengelola konten pembelajaran dan bank soal.

---

# 16. Staff Flow - Import Question

```
Question Bank

↓

Import Excel

↓

Upload File

↓

Validate

↓

Preview

↓

Import

↓

Success
```

---

## Validation

System memeriksa:

- template
- duplicate
- mandatory field
- option consistency
- answer validity

---

## Failed Validation

```
Import

↓

Validation Failed

↓

Download Error Report

↓

Fix File

↓

Import Again
```

---

# 17. Staff Flow - Review Question

```
Draft Question

↓

Review

↓

Approve

↓

Published
```

atau

```
Draft

↓

Rejected

↓

Return to Creator
```

---

# 18. Admin User Journey

## Objective

Mengelola keseluruhan sistem.

---

# 19. Admin Dashboard

```
Dashboard

↓

User Management

↓

Content Management

↓

Exam Management

↓

System Configuration

↓

Audit Log
```

---

# 20. Admin Flow - User Management

```
Users

↓

Create User

↓

Assign Role

↓

Save

↓

Notification
```

---

## Update User

```
Search User

↓

Edit

↓

Save

↓

Audit Log
```

---

## Disable User

```
User

↓

Deactivate

↓

Confirmation

↓

Inactive
```

---

# 21. Admin Flow - Education Structure

```
Education

↓

Level

↓

Class

↓

Subject

↓

Chapter

↓

Save
```

---

# 22. Admin Flow - System Configuration

```
Configuration

↓

Exam Setting

↓

Application Setting

↓

Permission

↓

Save
```

---

# 23. Cross Module Flow

```
Authentication

↓

Authorization

↓

Dashboard

↓

Question Bank

↓

CBT

↓

Analytics

↓

Progress
```

---

# 24. Error Flow

## Authentication Error

```
Login Failed

↓

Error Message

↓

Retry
```

---

## Authorization Error

```
Access Feature

↓

Permission Check

↓

Denied

↓

403 Forbidden
```

---

## Validation Error

```
Invalid Data

↓

Display Validation

↓

Correction

↓

Save Again
```

---

## System Error

```
Unexpected Error

↓

Log Error

↓

Rollback Transaction

↓

Show Friendly Message
```

---

# 25. Notification Flow

System memberikan notifikasi ketika:

- login berhasil
- password diubah
- ujian dipublikasikan
- ujian dimulai
- ujian selesai
- import berhasil
- import gagal
- soal disetujui
- soal ditolak

---

# 26. Audit Flow

Aktivitas berikut wajib tercatat:

```
Login

Question CRUD

Exam CRUD

Import

Export

Role Change

Configuration Change
```

---

# 27. End-to-End Learning Journey

```
Login

↓

Dashboard

↓

Study Material

↓

Practice Question

↓

Performance Analysis

↓

Recommendation

↓

CBT Simulation

↓

Exam Result

↓

Learning Progress

↓

Repeat Learning Cycle
```

---

# 28. User Flow Summary

| Role | Main Activity |
|------|---------------|
| Student | Study, Practice, CBT, Progress |
| Teacher | Question Authoring, Exam Creation, Analytics |
| Staff | Content Management, Import, Validation |
| Admin | User, Configuration, Monitoring |

---

# 29. Design Principles

Semua user flow harus memenuhi prinsip:

- Maksimal 3 klik menuju fitur utama.
- Tidak ada kehilangan data saat perpindahan halaman.
- Autosave pada aktivitas yang panjang (CBT dan editor soal).
- Semua perubahan penting tercatat pada Audit Log.
- Validasi dilakukan di sisi client dan server.
- Setiap kegagalan memiliki pesan kesalahan yang jelas dan dapat ditindaklanjuti.

---

# Document Status

Current:

```
Completed - User Flow Definition
```

