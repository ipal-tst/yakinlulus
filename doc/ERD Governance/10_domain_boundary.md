```markdown
# 10_domain_boundary.md

# Domain Boundary Specification

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan batas tanggung jawab setiap domain dalam platform YakinLulus.

Tujuan utama:

- Mencegah overlap tanggung jawab antar domain.
- Menentukan ownership setiap data.
- Menentukan batas perubahan data.
- Mengurangi coupling antar modul.
- Menjadi dasar desain database.
- Menjadi dasar desain API.
- Mendukung evolusi dari modular monolith menuju microservice.

---

# 2. Prinsip Domain Boundary

YakinLulus menggunakan pendekatan:

```

Domain Driven Design (DDD)
+
Bounded Context

```


Setiap domain memiliki:

```

Own Data

Own Business Rule

Own Logic

Own Lifecycle

```

Domain lain hanya dapat:

```

Read through API

Consume Event

Request Service

```

---

# 3. Aturan Utama Boundary

## Rule 1

Setiap data memiliki satu owner.

Contoh:

```

Question

Owner:

Question Bank Domain

```

Bukan:

```

CBT Domain
Analytics Domain
AI Domain

```

---

## Rule 2

Domain tidak boleh mengubah data domain lain.

Salah:

```

CBT

UPDATE question.status

```

Benar:

```

CBT Request

↓

Question Bank Service

↓

Update Question

```

---

## Rule 3

Domain hanya menyimpan reference.

Contoh:

CBT:

```

question_id

```

bukan:

```

copy seluruh question data

```

---

# 4. Domain Landscape

YakinLulus terdiri dari:

```

```
                YAKINLULUS PLATFORM


                       SYSTEM

                         |
```

---

Academic

Question

Learning Resource

CBT

User

Organization

Media

AI

Analytics

Learning

```

---

# 5. Master Academic Domain Boundary

## Responsibility

Mengelola struktur akademik.

---

## Own Data

```

Education Level

Grade

Subject

Curriculum

Chapter

Competency

Learning Objective

```

---

## Business Rule

Contoh:

```

SMA

↓

Kelas 10

↓

Matematika

↓

Aljabar

```

---

## Tidak Mengelola

Tidak memiliki:

```

Question

Exam

Student Progress

Material File

```

---

## Consumer

Digunakan oleh:

```

Question Bank

Learning Resource

CBT

Analytics

```

---

# 6. Question Bank Domain Boundary

## Responsibility

Mengelola seluruh bank soal.

---

## Own Data

```

Question

Question Version

Answer Option

Explanation

Question Category

Difficulty Level

Question Source

```

---

## Business Rule

Contoh:

```

Question Created

↓

Review

↓

Approved

↓

Published

```

---

## Tidak Mengelola

Tidak memiliki:

```

Student Answer

Exam Result

Learning Progress

```

---

## Consumer

```

CBT

AI

Analytics

```

---

# 7. Learning Resource Domain Boundary

## Responsibility

Mengelola konten pembelajaran.

---

## Own Data

```

Learning Material

Module

Lesson

Topic

Content Structure

```

---

## Business Rule

Contoh:

```

Course

↓

Module

↓

Lesson

↓

Content

```

---

## Tidak Mengelola

Tidak memiliki:

```

Student Completion

Exam Score

Question Bank

```

---

## Consumer

```

Learning

Student

AI

Analytics

```

---

# 8. CBT Engine Domain Boundary

## Responsibility

Mengelola proses ujian.

---

## Own Data

```

Exam

Exam Configuration

Exam Attempt

Question Selection

Answer Sheet

Exam Result

```

---

## Business Rule

Contoh:

```

Create Exam

↓

Publish

↓

Student Attempt

↓

Calculate Result

```

---

## Tidak Mengelola

Tidak memiliki:

```

Question Content

Student Profile

Learning Material

```

---

## Consumer

```

Analytics

AI

Learning

```

---

# 9. User Management Domain Boundary

## Responsibility

Mengelola identitas pengguna.

---

## Own Data

```

User

Authentication

Credential

Role

Permission

Profile

```

---

## Business Rule

Contoh:

```

Register

↓

Verify

↓

Activate

```

---

## Tidak Mengelola

Tidak memiliki:

```

Student Score

Exam Result

School Structure

```

---

## Consumer

Semua domain.

---

# 10. Learning Domain Boundary

## Responsibility

Mengelola aktivitas belajar pengguna.

---

## Own Data

```

Enrollment

Learning Progress

Study History

Achievement

Learning Goal

```

---

## Business Rule

Contoh:

```

Student open lesson

↓

Track progress

↓

Update competency

```

---

## Tidak Mengelola

Tidak memiliki:

```

Material Content

Question

Exam

```

---

# 11. Organization Domain Boundary

## Responsibility

Mengelola institusi pendidikan.

---

## Own Data

```

Organization

School

Teacher Assignment

Class Group

Membership

```

---

## Business Rule

Contoh:

```

School

↓

Teacher

↓

Class

↓

Student

```

---

## Tidak Mengelola

Tidak memiliki:

```

User Credential

Question

Exam Result

```

---

# 12. Media Domain Boundary

## Responsibility

Mengelola file dan aset digital.

---

## Own Data

```

Media Asset

File Metadata

Storage Object

Processing Status

```

---

## Business Rule

Contoh:

```

Upload

↓

Process

↓

Available

```

---

## Tidak Mengelola

Tidak memiliki:

```

Learning Content

Question

User

```

---

# 13. AI Domain Boundary

## Responsibility

Mengelola kemampuan artificial intelligence.

---

## Own Data

```

AI Request

AI Job

AI Model

Prompt

Generation Result

Embedding

```

---

## Business Rule

Contoh:

```

Request

↓

Process

↓

Generate

↓

Evaluate

```

---

## Tidak Mengelola

Tidak memiliki:

```

Question

Material

Student Profile

```

---

# 14. Analytics Domain Boundary

## Responsibility

Mengelola insight dan statistik.

---

## Own Data

```

Event

Metric

Report

Snapshot

Dashboard

```

---

## Business Rule

Analytics:

```

Read Only

```

---

## Tidak Mengelola

Tidak boleh:

```

Update Transaction Data

```

---

# 15. System Domain Boundary

## Responsibility

Foundation platform.

---

## Own Data

```

Configuration

Audit

Notification

Job Queue

Security Log

Feature Flag

```

---

## Business Rule

Menyediakan:

```

Infrastructure Capability

```

---

# 16. Cross Domain Communication

Komunikasi menggunakan:

```

API

*

Event

```

---

Contoh:

## CBT → Question Bank

Kebutuhan:

```

Get Question

```

Flow:

```

CBT

↓

Question API

↓

Question Data

```

---

## CBT → Analytics

Event:

```

EXAM_COMPLETED

```

---

## AI → Question Bank

Event:

```

AI_GENERATION_COMPLETED

```

---

# 17. Domain Dependency Matrix

| Domain | Depends On |
|-|-|
| Question Bank | Academic, Media |
| Learning Resource | Academic, Media |
| CBT | Academic, Question Bank, User |
| Learning | User, Learning Resource |
| Organization | User |
| AI | Question Bank, Learning Resource, Media |
| Analytics | Semua Domain |
| System | Semua Domain |

---

# 18. Forbidden Dependency

Tidak diperbolehkan:

```

Question Bank

↓

CBT Database Table

```

---

Tidak diperbolehkan:

```

Analytics

↓

Modify Question

```

---

Tidak diperbolehkan:

```

AI

↓

Direct Update Learning Progress

```

---

# 19. Shared Kernel

Data yang boleh digunakan bersama:

```

User Identity

Organization Identity

Academic Reference

```

---

Tetapi tetap melalui:

```

Reference ID

```

---

# 20. Future Microservice Mapping

Jika menjadi microservice:

```

master-academic-service

question-service

learning-resource-service

cbt-service

identity-service

organization-service

media-service

ai-service

analytics-service

system-service

```

---

# 21. Final Domain Boundary Rule

Aturan final YakinLulus:

```

One Domain

=

One Business Responsibility

One Entity

=

One Owner

Cross Domain

=

Reference + Event

Never Share Database Ownership

```

---

# Status

Document:

```

APPROVED

```

Role:

```

Architecture Governance Document

```

Digunakan untuk:

- Database Design
- API Design
- Backend Architecture
- Microservice Planning
- Team Development Guideline
```
