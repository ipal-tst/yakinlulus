# YakinLulus.id

# 07_cross_domain_reference.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan aturan komunikasi, referensi data, dan batas tanggung jawab antar Domain pada platform YakinLulus.

Dokumen ini menjadi acuan implementasi:

- Database
- Service Layer
- API
- Event Driven Architecture
- Cache
- Analytics
- Future Microservices

Cross Domain Reference tidak mendefinisikan struktur tabel, melainkan aturan bagaimana suatu Domain boleh menggunakan data Domain lain.

---

# Design Principles

## Principle 1

Setiap Domain memiliki Source of Truth masing-masing.

Domain lain tidak boleh mengubah data tersebut secara langsung.

---

## Principle 2

Lintas Domain hanya menggunakan:

- UUID
- Public ID
- Event
- Service/API

Bukan mengakses tabel secara langsung.

---

## Principle 3

Tidak boleh ada Circular Dependency.

Contoh yang salah

Question

↓

CBT

↓

Question

---

## Principle 4

Semua komunikasi lintas Domain harus bersifat Loose Coupling.

---

## Principle 5

Jika histori harus dipertahankan maka gunakan Snapshot.

---

# Access Legend

| Symbol | Meaning |
|---------|---------|
| R | Read |
| C | Create |
| U | Update |
| D | Delete |
| Ref | Reference Only |
| Snap | Snapshot |
| Event | Event Driven |
| API | Service/API |

---

# DOMAIN REFERENCE MATRIX

| Consumer | Provider | Access | Integration | Coupling |
|-----------|----------|---------|-------------|----------|
| Question Bank | Master Academic | Ref | API / Cache | Loose |
| Question Bank | Media | Ref | API | Loose |
| Question Bank | AI | C,R | Service | Loose |
| Learning Resource | Master Academic | Ref | API | Loose |
| Learning Resource | Media | Ref | API | Loose |
| Learning Resource | AI | C,R | Service | Loose |
| CBT Engine | Question Bank | Snap | Publish Event | Loose |
| CBT Engine | User Management | R | API | Loose |
| CBT Engine | Organization | R | API | Loose |
| CBT Engine | Master Academic | Ref | API | Loose |
| Learning | Learning Resource | R | API | Loose |
| Learning | Question Bank | R | API | Loose |
| Learning | CBT Engine | R | API | Loose |
| Learning | User Management | R | API | Loose |
| Organization | User Management | Ref | API | Loose |
| Analytics | Semua Domain | Event | Event Bus | Loose |
| AI | Question Bank | R | API | Loose |
| AI | Learning Resource | R | API | Loose |
| AI | Analytics | R | API | Loose |
| System | Semua Domain | Event | Internal Service | Loose |

---

# Cross Domain Rules

## Master Academic

Source of Truth

- Education Level
- Grade
- Subject
- Curriculum
- Topic
- Chapter
- Semester

Allowed

Reference Only

Tidak boleh

Diubah oleh Domain lain.

---

## Question Bank

Source of Truth

- Question
- Option
- Explanation
- Metadata
- Version

Consumer

CBT

Learning

Analytics

AI

Rule

CBT tidak boleh mengubah Question.

Learning tidak boleh mengubah Question.

AI tidak boleh mengubah Question.

---

## Learning Resource

Source of Truth

- Learning Resource
- Section
- Transcript
- Version

Consumer

Learning

Analytics

AI

Rule

Learning hanya membaca.

Perubahan hanya melalui Learning Resource Domain.

---

## CBT Engine

Source of Truth

- Exam
- Blueprint
- Attempt
- User Answer
- Result

Consumer

Learning

Analytics

Rule

Question disalin menjadi Snapshot.

Question asli tidak pernah digunakan langsung saat ujian berlangsung.

---

## User Management

Source of Truth

- Identity
- Profile
- Role
- Permission

Consumer

Semua Domain

Rule

Domain lain tidak boleh menyimpan ulang identitas pengguna selain identifier yang diperlukan.

---

## Organization

Source of Truth

- Organization
- Classroom
- Membership
- Academic Calendar

Consumer

Learning

CBT

Analytics

Rule

Question Bank tidak memiliki relasi langsung dengan Organization.

---

## Media

Source of Truth

- Media Asset
- Media File
- Variant
- Metadata

Consumer

Semua Domain

Rule

Media selalu direferensikan.

Tidak pernah disalin.

Media tidak boleh dihapus jika masih digunakan.

---

## AI

Source of Truth

- Prompt
- AI Job
- AI Result
- Embedding

Consumer

Question Bank

Learning Resource

Analytics

Rule

AI tidak mengubah Entity bisnis.

AI hanya menghasilkan rekomendasi atau konten baru yang harus melalui proses review.

---

## Analytics

Source of Truth

- Event
- Fact
- Summary
- KPI

Consumer

Dashboard

Report

Rule

Analytics hanya membaca Event.

Tidak boleh menjadi sumber data operasional.

---

## System

Source of Truth

- Queue
- Notification
- Feature Flag
- Audit Log
- Scheduler

Rule

Tidak menyimpan data bisnis.

---

# Snapshot Policy

Snapshot wajib digunakan pada:

- Exam Question
- Exam Blueprint
- Exam Configuration
- Exam Scoring Rule

Snapshot tidak boleh digunakan pada:

- User Profile
- Organization
- Subject
- Curriculum

Snapshot bersifat immutable.

---

# Event Driven Policy

Setiap Domain menghasilkan Event.

Contoh

Question

- QuestionCreated
- QuestionUpdated
- QuestionPublished
- QuestionArchived

Learning Resource

- ResourcePublished
- ResourceUpdated

Exam

- ExamCreated
- ExamStarted
- ExamFinished

User

- UserRegistered
- UserActivated

Organization

- ClassroomCreated
- StudentJoinedClassroom

Media

- MediaUploaded
- MediaProcessed

AI

- AIJobCompleted
- AIJobFailed

---

# Cross Domain Transaction Policy

## Same Domain

Menggunakan Database Transaction (ACID).

Contoh

Create Question

↓

Insert Question

↓

Insert Metadata

↓

Insert Options

↓

Commit

---

## Cross Domain

Menggunakan Event.

Contoh

Publish Question

↓

Commit Transaction

↓

Publish Event

↓

Analytics Update

↓

Search Index

↓

AI Embedding

↓

Notification

---

# Failure Policy

Jika Consumer gagal:

Provider tetap berhasil.

Contoh

Question berhasil dipublish.

AI gagal membuat embedding.

Hasil

Question tetap Published.

AI Job masuk Retry Queue.

---

# Cache Policy

Master Academic

Read Through Cache

Media Metadata

Read Through Cache

Question Search

Cache + Search Index

Analytics

Materialized View / Cache

---

# API Policy

Semua komunikasi lintas Domain menggunakan:

- UUID
- Public ID

Tidak menggunakan:

- Business Code
- Nama Entity
- Natural Key

---

# Database Rules

1. Hindari Foreign Key lintas Domain jika memungkinkan.
2. Gunakan UUID/Public ID sebagai referensi.
3. Relasi lintas Domain dilakukan melalui Service Layer atau Repository.
4. Shared Asset (Media, Master Academic) bersifat reusable.
5. Snapshot digunakan untuk menjaga histori.
6. Event digunakan untuk sinkronisasi antar Domain.
7. Domain tidak boleh membaca tabel internal Domain lain secara langsung.
8. Analytics hanya mengonsumsi Event, bukan transaksi operasional.
9. AI tidak boleh menjadi Source of Truth.
10. Setiap Domain harus tetap dapat beroperasi jika Domain non-kritis (AI, Analytics) mengalami kegagalan.

---

# Dependency Diagram

Master Academic
        │
        ├─────────────┐
        ▼             ▼
Question Bank   Learning Resource
        │             │
        └──────┬──────┘
               ▼
          CBT Engine
               │
               ▼
          Learning
               │
               ▼
          Analytics

Media
 ├────────► Question Bank
 ├────────► Learning Resource
 ├────────► Organization
 └────────► User Management

AI
 ├────────► Question Bank
 ├────────► Learning Resource
 └────────► Analytics

System
 └────────► Semua Domain

---

# Summary

Target utama Cross Domain Reference adalah:

- Menjaga Domain tetap independen.
- Menghindari tight coupling.
- Mempermudah scaling.
- Mempermudah migrasi ke microservices di masa depan.
- Menjamin setiap Domain memiliki Source of Truth yang jelas.