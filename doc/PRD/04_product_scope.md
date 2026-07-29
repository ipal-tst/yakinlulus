Berikut draft **`PRD/04_product_scope.md`** untuk YakinLulus.id.

```md id="p9m5k2"
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Product Scope

| Attribute | Value |
|---|---|
| Document | Product Scope |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Target User Persona |
| Purpose | Define Product Boundary |

---

# 1. Introduction

## 1.1 Purpose

Dokumen Product Scope mendefinisikan batasan produk YakinLulus.id.

Dokumen ini menentukan:

- fitur yang termasuk dalam pengembangan MVP
- fitur yang ditunda
- batasan sistem
- domain yang menjadi fokus
- prioritas implementasi

Tujuan utama adalah memastikan pengembangan tetap fokus dan menghindari feature creep.

---

# 2. Product Scope Overview

YakinLulus.id MVP berfokus pada tiga domain utama:

```

```
            YakinLulus.id MVP


                  |
    ---------------------------------

    |               |               |
```

Question Bank     CBT Engine    Learning Material

```
                  |

          Learning Analytics
```

```id="k8v7a3"

---

# 3. MVP Product Objective

MVP bertujuan membuktikan bahwa platform mampu membantu siswa:

1. Mendapatkan latihan soal berkualitas
2. Melakukan simulasi ujian digital
3. Mengetahui hasil dan perkembangan belajar


---

# 4. Scope Boundary

## 4.1 In Scope

Fitur yang wajib tersedia pada MVP.

---

# Domain 1: Identity & Access Management

## Included

### Authentication

User dapat:

- login
- logout
- mengubah password


### Authorization

Sistem mendukung:

- Role Based Access Control (RBAC)
- permission management


Role MVP:

```

Admin

Staff

Teacher

Student

```id="2j6s8h"

---

# Domain 2: Education Structure

## Included

Sistem mendukung struktur pendidikan:

```

Education Level

```
|
```

Class

```
|
```

Subject

```
|
```

Curriculum

```
|
```

Chapter

```id="0c3k6p"

---

## Supported Level

### SD

- Kelas 4
- Kelas 5
- Kelas 6


### SMP

- Kelas 7
- Kelas 8
- Kelas 9


### SMA/SMK

- Kelas 10
- Kelas 11
- Kelas 12


### Preparation

- UTBK / Gap Year


---

# Domain 3: Question Bank

## Included

Question Bank merupakan core MVP.


## Question Management

Admin/Teacher/Staff dapat:

- membuat soal
- mengubah soal
- menghapus soal
- melihat soal


---

## Question Type

MVP:

```

Multiple Choice Question

```id="v0d0wq"

---

## Question Content

Mendukung:

- pertanyaan teks
- gambar
- pilihan jawaban
- jawaban benar
- pembahasan


---

## Question Metadata

Setiap soal wajib memiliki:

```

Question

├── Education Level
├── Class
├── Subject
├── Chapter
├── Difficulty
├── Source
├── Status
└── Explanation

```id="1xj8ax"

---

## Difficulty Level

MVP:

```

Easy

Medium

Hard

```id="3i2y8q"

---

## Question Source

Mendukung:

- sekolah
- dinas pendidikan
- internal
- manual entry


---

# Domain 4: CBT Engine

## Included

CBT menjadi fitur utama MVP.


---

## Exam Management

Admin/Teacher dapat:

- membuat ujian
- menentukan kategori soal
- menentukan jumlah soal
- menentukan waktu ujian


---

## Exam Configuration

Support:

```

Exam

├── Title
├── Subject
├── Class
├── Duration
├── Question Count
├── Schedule
└── Result Setting

```id="r2n5js"

---

## Exam Execution

Student dapat:

- mengikuti ujian
- melihat timer
- berpindah soal
- menandai soal ragu
- menyimpan jawaban


---

## Question Randomization

Sistem mendukung:

- random question order
- random answer option


Contoh:

```

Exam Bank

100 Questions

Student A

40 Random Questions

Student B

40 Different Random Questions

```id="g4phm2"

---

## Exam Result

Sistem menghasilkan:

- total score
- jumlah benar
- jumlah salah
- waktu pengerjaan


---

# Domain 5: Learning Material

## Included (Basic)

Sistem mendukung:

- materi pelajaran
- chapter
- subchapter
- attachment


---

## Content Type

MVP:

- text
- image
- document


Future:

- video
- interactive simulation


---

# Domain 6: Learning Progress

## Included

Tracking dasar:

```

Student Activity

```
    |
```

Practice History

```
    |
```

Exam Result

```
    |
```

Progress Summary

```id="3t8n2m"

---

## Student Dashboard

Menampilkan:

- jumlah soal dikerjakan
- nilai terakhir
- progress belajar
- hasil ujian


---

# 5. Out of Scope (MVP)

Fitur berikut tidak masuk MVP.

---

# AI Features

## Excluded

- AI question generator
- AI tutor
- AI chatbot
- adaptive learning


Reason:

Membutuhkan:

- data besar
- evaluasi model
- infrastruktur tambahan


---

# Payment System

## Excluded

Belum tersedia:

- subscription
- payment gateway
- billing


---

# Social Learning

## Excluded

Tidak termasuk:

- forum diskusi
- chat siswa
- komunitas


---

# Live Learning

## Excluded

Tidak termasuk:

- video conference
- live teaching
- webinar


---

# School Management System

## Excluded

Belum mencakup:

- absensi
- nilai rapor
- administrasi sekolah


---

# 6. MVP Feature Priority

## Priority Definition

| Priority | Meaning |
|-|-|
| P0 | Mandatory MVP |
| P1 | Important |
| P2 | Future Enhancement |
| P3 | Long Term |

---

# P0 Features

## Authentication

- Login
- Role management


## Question Bank

- CRUD question
- Categorization
- Search/filter


## CBT

- Create exam
- Take exam
- Timer
- Randomization
- Result


## Student Dashboard

- Progress summary
- Exam history


---

# P1 Features

## Advanced Question Management

- Bulk import Excel
- Question validation
- Question tagging


## Analytics

- Subject performance
- Chapter performance


## Material Management

- Structured learning content


---

# P2 Features

## AI Assistance

- Generate questions
- Generate explanation


## Gamification

- Achievement
- Badge
- Ranking


---

# P3 Features

## Platform Expansion

- School SaaS
- Mobile application
- Marketplace
- Subscription ecosystem


---

# 7. MVP User Capability Matrix

| Capability | Student | Teacher | Staff | Admin |
|-|-|-|-|-|
| Login | ✓ | ✓ | ✓ | ✓ |
| Practice Question | ✓ | | | |
| Take Exam | ✓ | ✓ | | |
| View Result | ✓ | ✓ | | |
| Create Question | | ✓ | ✓ | ✓ |
| Validate Question | | | ✓ | ✓ |
| Create Exam | | ✓ | | ✓ |
| Manage User | | | | ✓ |
| Manage System | | | | ✓ |

---

# 8. MVP Success Definition

MVP dianggap berhasil jika:

## Student

Dapat:

```

Login

↓

Memilih latihan

↓

Mengerjakan soal

↓

Mengikuti CBT

↓

Melihat hasil

```

---

## Admin

Dapat:

```

Mengelola soal

↓

Membuat ujian

↓

Melihat aktivitas pengguna

```

---

# 9. Technical Scope Boundary

## Included

Architecture harus mendukung:

- API First
- Modular Domain
- PostgreSQL
- Scalable Database
- Future Mobile Client


---

## Excluded

Belum fokus pada:

- microservice architecture
- distributed system
- AI infrastructure
- big data pipeline


---

# 10. Future Expansion Direction

Setelah MVP stabil:

```

Phase 1

Question Bank + CBT

```
    ↓
```

Phase 2

School Platform

```
    ↓
```

Phase 3

AI Learning Platform

```
    ↓
```

Phase 4

National Education Ecosystem

```

---

# 11. Scope Summary

YakinLulus.id MVP fokus membangun fondasi:

```

High Quality Question Bank

*

Reliable CBT Engine

*

Basic Learning Analytics

```

Tujuan utama:

> Membuktikan bahwa siswa dapat belajar lebih efektif melalui latihan soal terstruktur dan evaluasi berbasis data.

---

# Document Status

Current:

```

Completed - Product Scope Definition

```

Next Document:

```

05_feature_requirement.md

```
```
