# 04_module_architecture.md

# YakinLulus.id Module Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh business module pada backend YakinLulus.id beserta tanggung jawab, batas domain (bounded context), relasi, dependensi, dan kontrak komunikasi antar module.

Tujuan utama dokumen ini adalah:

* Menjaga pemisahan tanggung jawab (Separation of Concerns)
* Mengurangi coupling antar module
* Memudahkan pengembangan tim
* Mempermudah pengujian
* Menjadi fondasi Modular Monolith yang siap berevolusi menjadi Microservices

---

# 2. Module Classification

Backend dibagi menjadi empat kategori utama.

```text
Core Domain

Supporting Domain

Infrastructure Domain

Cross Cutting Domain
```

---

# 3. Module Dependency Rules

Seluruh module mengikuti aturan berikut.

* Module hanya bertanggung jawab terhadap domainnya sendiri.
* Tidak boleh mengakses repository module lain secara langsung.
* Komunikasi antar module dilakukan melalui Service Interface.
* Event domain digunakan untuk proses asynchronous.
* Shared package tidak boleh berisi business logic.
* Platform adapter hanya menjadi jembatan ke layanan eksternal.

---

# 4. High Level Module Diagram

```text
                        Identity
                            │
             ┌──────────────┴──────────────┐
             │                             │
           User                      Academic
             │                             │
      ┌──────┼──────────┐          ┌──────────────┐
      │      │          │          │              │
 Material  Question   Media     Subject       School
      │         │
      │    Question Bank
      │         │
      └──────┬──┘
             │
            Exam
             │
            CBT
             │
      Submission
             │
          Analytics
             │
          Ranking
             │
       Gamification

Notification
Audit
Report
Configuration
AI
System
```

---

# 5. Core Domain Modules

Core Domain merupakan inti bisnis YakinLulus.id.

---

# 5.1 Identity Module

## Responsibility

Mengelola identitas pengguna dan keamanan sistem.

## Scope

* Login
* Logout
* Refresh Token
* Session
* Password
* MFA (Future)
* Device Management
* Access Token

## Owned Entity

* UserCredential
* Session
* RefreshToken
* LoginHistory

## Public Services

```text
Login()

Logout()

RefreshToken()

VerifyToken()

ChangePassword()
```

---

# 5.2 User Module

## Responsibility

Mengelola data pengguna.

## Scope

* Profil
* Biodata
* Foto
* Status
* Aktivasi
* Preference

## Owned Entity

* User
* Student
* Teacher
* Staff
* Parent (Future)

## Public Services

```text
CreateUser()

UpdateProfile()

DeactivateUser()

GetProfile()
```

---

# 5.3 Academic Module

## Responsibility

Mengelola struktur akademik.

## Scope

* Jenjang
* Kelas
* Tahun Ajaran
* Semester
* Kurikulum

## Owned Entity

* AcademicYear
* Grade
* Semester
* Curriculum

---

# 5.4 School Module

## Responsibility

Mengelola sekolah.

Future:

* Multi School
* Multi Tenant

Entity:

* School
* SchoolProfile

---

# 5.5 Subject Module

Mengelola mata pelajaran.

Entity:

* Subject
* SubjectGroup

---

# 5.6 Chapter Module

Mengelola struktur materi.

Entity:

* Chapter
* SubChapter

---

# 6. Learning Domain

---

# 6.1 Material Module

## Responsibility

Mengelola seluruh materi pembelajaran.

## Scope

* Materi
* PDF
* Video
* Audio
* Gambar
* Learning Progress

Entity

* Material
* MaterialContent
* MaterialAttachment

Public Service

```text
PublishMaterial()

UpdateMaterial()

ArchiveMaterial()

TrackProgress()
```

---

# 6.2 Question Module

Module terbesar.

Responsibility:

Mengelola seluruh bank soal.

Entity:

* Question
* QuestionOption
* Explanation
* QuestionImage
* ReferenceSource

Public Service

```text
CreateQuestion()

UpdateQuestion()

ApproveQuestion()

ArchiveQuestion()
```

Question tidak mengetahui CBT.

---

# 6.3 Question Bank Module

Responsibility:

Mengelompokkan soal.

Contoh:

UTBK

PAS

PTS

Latihan

Try Out

Question Collection

Entity

* QuestionBank
* QuestionBankItem

---

# 6.4 Question Generator Module

Responsibility:

Mengelola AI Question Generation.

Scope

* AI
* Prompt
* Validation
* Review
* Publish

Entity

* GenerationJob
* PromptTemplate
* AIResult

Public Service

```text
GenerateQuestion()

ReviewQuestion()

PublishGeneratedQuestion()
```

Module ini berkomunikasi dengan AI Service melalui adapter, bukan langsung dengan model AI.

---

# 7. Examination Domain

---

# 7.1 Exam Module

Responsibility

Membuat ujian.

Entity

* Exam
* ExamRule
* ExamQuestion

Public Service

```text
CreateExam()

PublishExam()

ScheduleExam()

CloneExam()
```

---

# 7.2 CBT Module

Module paling kritikal.

Responsibility

Mengelola runtime ujian.

Entity

* ExamSession
* Timer
* NavigationState
* FlagQuestion

Public Service

```text
StartExam()

SaveAnswer()

FinishExam()

ResumeExam()

AutoSubmit()
```

CBT tidak menghitung nilai.

---

# 7.3 Submission Module

Responsibility

Menyimpan jawaban.

Entity

* Submission
* Answer

Public Service

```text
SubmitAnswer()

UpdateAnswer()

FinalizeSubmission()
```

---

# 7.4 Scoring (Bagian dari Submission)

Responsibility

Menghitung nilai.

Entity

* Score

Service

```text
CalculateScore()

CalculatePassingGrade()

GenerateResult()
```

Seluruh algoritma penilaian berada di service layer.

---

# 8. Analytics Domain

---

# 8.1 Analytics Module

Responsibility

Menghasilkan insight.

Scope

* Progress
* Accuracy
* Weak Topic
* Strong Topic
* Learning Curve

Entity

* AnalyticsSnapshot
* LearningStatistic

---

# 8.2 Ranking Module

Responsibility

Menghitung ranking.

Jenis ranking:

* Nasional
* Sekolah
* Kelas
* Mata Pelajaran
* Try Out

Ranking dihitung dari hasil yang telah tervalidasi, bukan dari sesi yang masih berjalan.

---

# 8.3 Gamification Module

Responsibility

Mengelola motivasi belajar.

Entity

* Badge
* Achievement
* XP
* Level
* Streak

Public Service

```text
GrantXP()

UnlockBadge()

UpdateLevel()
```

---

# 9. Supporting Domain

---

# 9.1 Notification Module

Responsibility

Mengirim notifikasi.

Media:

* Email
* Push Notification
* In App
* WhatsApp (Future)

Notification dikirim melalui event atau queue untuk menghindari blocking pada request utama.

---

# 9.2 Media Module

Responsibility

Mengelola file.

Storage:

Supabase Storage

Entity

* File
* Image
* Video

---

# 9.3 Report Module

Responsibility

Menghasilkan laporan.

Contoh:

* Nilai
* Progress
* CBT
* Aktivitas
* Guru
* Admin

---

# 10. Cross Cutting Modules

---

# 10.1 Audit Module

Responsibility

Mencatat seluruh aktivitas penting.

Entity

* AuditLog

Aktivitas yang dicatat:

* Login
* Update Profile
* Create Exam
* Delete Question
* Publish Material
* Permission Change

---

# 10.2 Configuration Module

Responsibility

Konfigurasi sistem.

Entity

* SystemConfig

Contoh:

* Passing Grade
* Timer Default
* Max Login
* Maintenance Mode

---

# 10.3 System Module

Responsibility

Monitoring internal.

Contoh:

* Health Check
* Version
* Metrics
* Feature Flag
* Background Job Status

---

# 11. AI Module

Responsibility

Orkestrasi seluruh kemampuan AI.

AI tidak menyimpan business data.

AI hanya menerima:

* Prompt
* Context
* Reference
* Metadata

AI mengembalikan:

* Generated Question
* Explanation
* Classification
* Difficulty
* Recommendation

Seluruh hasil AI tetap melalui proses validasi sebelum dipublikasikan.

---

# 12. Inter Module Communication

Komunikasi sinkron dilakukan melalui Service Interface.

```text
Exam

↓

Question Service

↓

Question Repository
```

Komunikasi asinkron menggunakan Domain Event.

Contoh:

```text
Exam Finished

↓

Score Generated

↓

Ranking Updated

↓

Analytics Updated

↓

Notification Sent
```

Pendekatan ini menjaga setiap modul tetap independen.

---

# 13. Module Ownership Matrix

| Module             | Owns Data           | Calls Other Modules | External Service  |
| ------------------ | ------------------- | ------------------- | ----------------- |
| Identity           | Credential, Session | User                | -                 |
| User               | User Profile        | Identity            | Supabase Storage  |
| Academic           | Grade, Curriculum   | -                   | -                 |
| School             | School              | Academic            | -                 |
| Subject            | Subject             | Academic            | -                 |
| Chapter            | Chapter             | Subject             | -                 |
| Material           | Material            | Media               | Supabase Storage  |
| Question           | Question            | Subject, Chapter    | -                 |
| Question Bank      | Collection          | Question            | -                 |
| Question Generator | Generation Job      | Question            | AI Service        |
| Exam               | Exam                | Question Bank       | -                 |
| CBT                | Session             | Exam, Submission    | Redis             |
| Submission         | Answer, Score       | CBT                 | -                 |
| Analytics          | Statistics          | Submission          | Redis             |
| Ranking            | Ranking             | Analytics           | Redis             |
| Gamification       | XP, Badge           | Analytics           | -                 |
| Notification       | Notification        | -                   | Email, Push       |
| Media              | File Metadata       | -                   | Supabase Storage  |
| Report             | Report              | Analytics           | -                 |
| Audit              | Audit Log           | Semua Modul         | -                 |
| Configuration      | Config              | -                   | -                 |
| System             | Health, Metrics     | Semua Modul         | Prometheus        |
| AI                 | AI Orchestration    | Question Generator  | Python AI Service |

---

# 14. Future Microservice Candidates

Apabila beban sistem meningkat, modul berikut dapat dipisahkan menjadi microservice tanpa mengubah domain model:

* AI Service
* CBT Service
* Analytics Service
* Ranking Service
* Notification Service
* Report Service

Modul lain tetap berada dalam Modular Monolith hingga terdapat kebutuhan operasional yang jelas.

---

# 15. Module Design Rules

Seluruh modul wajib mengikuti aturan berikut:

* Memiliki bounded context yang jelas.
* Tidak mengakses repository modul lain.
* Tidak mengandung business logic di controller.
* Menyediakan service interface sebagai kontrak publik.
* Menggunakan DTO untuk komunikasi dengan API.
* Menggunakan transaction hanya pada service layer.
* Menghasilkan audit log untuk operasi penting.
* Mendukung observability melalui logging dan metrics.

---

# 16. Summary

Arsitektur modul YakinLulus.id dirancang untuk memisahkan setiap domain bisnis ke dalam bounded context yang jelas. Pendekatan ini menghasilkan backend yang:

* Modular dan mudah dipelihara.
* Siap dikembangkan oleh banyak engineer secara paralel.
* Memiliki batas tanggung jawab yang tegas.
* Mendukung evolusi bertahap menuju microservices.
* Konsisten dengan PRD, Domain Model, ERD, LDM, dan Database Architecture yang telah disusun.
