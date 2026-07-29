Melanjutkan ke file berikutnya:

# `11_implementation_architecture/07_module_architecture.md`

```md id="m7a9xq"
# Module Architecture
## YakinLulus.id Module Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan modular architecture pada backend YakinLulus.id.

Module architecture menentukan:

- pembagian domain sistem;
- batas tanggung jawab setiap module;
- dependency antar module;
- struktur kode;
- aturan komunikasi.


Tujuan utama:

- menghindari codebase menjadi monolithic spaghetti;
- menjaga business boundary;
- memudahkan maintenance;
- mempersiapkan ekstraksi menjadi microservice.


---

# 2. Module Architecture Principles


YakinLulus.id menggunakan:


```

Domain Based Modular Architecture

*

Bounded Context

*

High Cohesion

*

Low Coupling

```id="w8v3pq"


---

# 3. Module Architecture Overview


Pada MVP:


```

```
             YakinLulus Backend


                     |

    +----------------+----------------+

    |                |                |
```

Identity         Learning          Exam

```
    |                |                |


    +----------------+----------------+

                     |

             Shared Kernel


                     |

          Infrastructure Layer
```

```id="k4n8sx"


---

# 4. Module Classification


Module dibagi menjadi:


## Core Business Module


Berhubungan langsung dengan value utama.


```

Question Bank

Exam

CBT Runtime

Learning

Analytics

```id="z9p4mv"


---

## Supporting Module


Mendukung sistem.


```

Identity

Notification

File Management

Audit

Configuration

```id="x6r2qa"


---

## Future Module


Fase pengembangan:


```

AI Service

Recommendation Engine

Payment

School Management

Marketplace

```id="n5w8kp"


---

# 5. Backend Module Structure


Struktur:


```

internal/modules/

├── identity/

├── question_bank/

├── exam/

├── cbt/

├── learning/

├── analytics/

├── notification/

├── file/

└── ai/

```id="p7m3vx"


---

# 6. Module Internal Structure


Setiap module memiliki:


```

module_name/

├── domain/

│   ├── entities

│   ├── value_objects

│   ├── services

│   └── events

├── application/

│   ├── commands

│   ├── queries

│   ├── usecases

│   └── dto

├── infrastructure/

│   ├── repository

│   ├── persistence

│   └── external

├── delivery/

│   ├── http

│   └── middleware

└── tests/

```id="s3x8md"


---

# 7. Identity Module


## Responsibility


Identity module mengelola:


- user;
- authentication;
- authorization;
- role;
- permission.


---

## Boundary


```

Identity Module

Owns:

User

Role

Permission

Session

```id="q5v7zn"


---

## Public Interface


Module lain hanya boleh:


```

GetUserProfile()

CheckPermission()

ValidateAccess()

```id="m8k4rw"


---

# 8. Question Bank Module


## Responsibility


Mengelola seluruh lifecycle soal.


```

Create

Review

Publish

Archive

Search

```id="v2m9kx"


---

## Entity


```

Question

QuestionOption

Subject

Chapter

Difficulty

QuestionSource

Explanation

```id="r8q5mp"


---

## Dependency


Digunakan oleh:


```

Exam Module

AI Module

Analytics Module

```id="d7x4na"


---

# 9. Exam Module


## Responsibility


Mengelola definisi ujian.


```

Exam Creation

Scheduling

Participant

Rules

Configuration

```id="h3m8qv"


---

## Entity


```

Exam

ExamTemplate

ExamParticipant

ExamRule

```id="t6p2xz"


---

## Dependency


Menggunakan:


```

Identity Module

Question Bank Module

```id="b4n7ms"


---

# 10. CBT Runtime Module


CBT Runtime adalah module dengan kebutuhan performa tinggi.


## Responsibility


Mengelola:


```

Exam Session

Timer

Question Delivery

Answer State

Synchronization

```id="x9q3mw"


---

## Architecture


```

Student

|

CBT Module

|

Redis Runtime State

|

Database Persistence

```id="g5k8zr"


---

## Dependency


Menggunakan:


```

Exam Module

Question Bank Module

Scoring Module

```id="w4m7kp"


---

# 11. Learning Module


## Responsibility


Mengelola:


```

Material

Course

Chapter

Learning Progress

Exercise

```id="q8n3vx"


---

## Entity


```

LearningMaterial

Course

Lesson

Progress

```id="f6m2pw"


---

# 12. Analytics Module


## Responsibility


Mengolah:


```

Student Performance

Exam Analysis

Learning Behavior

Ranking

```id="y7p4mq"


---

## Architecture


```

Domain Event

```
  |

  |
```

Analytics Processor

```
  |

  |
```

Analytics Storage

```id="n9x5kv"


---

# 13. Notification Module


## Responsibility


Mengelola:


```

Push Notification

Email

Announcement

Reminder

```id="c4m8zs"


---

## Event Consumer


Contoh:


```

ExamScheduledEvent

```
    |

    |
```

Notification Module

```
    |

    |
```

Student Device

```id="p5q9mw"


---

# 14. File Management Module


## Responsibility


Mengelola:


```

Upload

Download

Metadata

Access Control

```id="z8n4xp"


---

## Storage:


```

Application

|

File Module

|

Object Storage

```id="m3q7vs"


---

# 15. AI Module


Future module.


Responsibility:


```

Question Generation

Explanation Generation

AI Tutor

Recommendation

RAG System

```id="x2m6pk"


---

# 16. Shared Kernel Module


Komponen yang digunakan bersama:


```

shared/

├── errors

├── logger

├── validator

├── event_bus

├── pagination

├── security

└── response

```id="k7p5mz"


---

# 17. Module Dependency Rules


Aturan dependency:


```

Identity

↑

All Module

```id="w5m9qx"


Identity dapat digunakan semua module.


---

Question Bank:


```

Question Bank

```
    ↑
```

Exam

CBT

AI

```id="j8p4mv"


---

CBT:


```

CBT

|

Exam

|

Question Bank

```id="s6x2rn"


---

# 18. Forbidden Dependency


Tidak diperbolehkan:


## Cross Database Access


Salah:


```

Exam Module

query langsung

Question Table

```id="v3q8mp"


Benar:


```

Exam Module

|

Question Repository Interface

|

Question Module

```id="r4n7kx"


---

# 19. Module Communication Pattern


## Direct Call


Untuk kebutuhan synchronous.


Contoh:


```

Exam

|

QuestionBank.GetQuestions()

```id="m5x9qa"


---

## Event Communication


Untuk asynchronous.


Contoh:


```

ExamCompletedEvent

```
    |

    |
```

Analytics

Notification

```id="p7w3zn"


---

# 20. Module Testing Strategy


Setiap module memiliki:


## Unit Test


```

Domain Logic

Use Case

```id="z6m4kp"


---

## Integration Test


```

Repository

External Dependency

```id="q9x5mv"


---

## Contract Test


Untuk:


```

Module Interface

API Contract

```id="d4m8zw"


---

# 21. Module Deployment Evolution


## MVP


```

All Modules

```
  |
```

Single Backend Deployment

```id="h7p3mx"


---

## Growth Phase


```

High Load Module Extracted

```
  |
```

CBT Service

Analytics Service

AI Service

```id="v5n8qx"


---

## Enterprise Phase


```

Independent Services

```
  |
```

Independent Scaling

```
  |
```

Dedicated Database

```id="m9x4kp"


---

# 22. Scalability Consideration


Module yang kemungkinan dipisahkan:


## CBT Runtime


Alasan:


- high concurrency;
- realtime state.


---

## Analytics


Alasan:


- heavy processing;
- reporting.


---

## AI


Alasan:


- compute intensive.


---

# 23. Summary


Module Architecture YakinLulus.id:


```

Domain Based Module

*

Bounded Context

*

Clean Boundary

*

Controlled Dependency

*

Microservice Ready

```id="p8q5mx"


Hasil:


- codebase terstruktur;
- tim dapat bekerja paralel;
- perubahan lebih aman;
- mudah scale.
```
