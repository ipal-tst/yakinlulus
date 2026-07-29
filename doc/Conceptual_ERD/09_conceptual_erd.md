# YakinLulus.id

# 09_conceptual_erd.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan Conceptual Entity Relationship Diagram (Conceptual ERD) untuk platform YakinLulus.

Conceptual ERD hanya mendeskripsikan:

- Entity
- Relationship
- Ownership
- Dependency
- Business Boundary

Conceptual ERD belum membahas:

- Primary Key
- Foreign Key
- Datatype
- Index
- Constraint
- PostgreSQL Implementation

Dokumen ini menjadi jembatan antara Domain Model dan Logical ERD.

---

# Domain Overview

Platform terdiri dari 11 Business Domain.

1. Master Academic
2. Question Bank
3. Learning Resource
4. CBT Engine
5. User Management
6. Learning
7. Organization
8. Media
9. AI
10. Analytics
11. System

---

# High Level Domain Relationship

                           Master Academic
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
      Question Bank        Learning Resource      Organization
             │                     │                     │
             └─────────────┬───────┘                     │
                           ▼                             │
                    Learning Domain                      │
                           │                             │
                           ▼                             │
                      CBT Engine                         │
                           │                             │
                           ▼                             │
                    Learning Progress                    │
                           │                             │
                           └──────────────┬──────────────┘
                                          ▼
                                 User Management

Media
 ├────────► Question Bank
 ├────────► Learning Resource
 ├────────► User Management

AI
 ├────────► Question Bank
 ├────────► Learning Resource

Analytics
◄────────── Semua Domain (Event)

System
◄────────── Semua Domain

---

# Domain Entity Map

MASTER ACADEMIC

Academic Level

Grade

Curriculum

Subject

Semester

Chapter

Topic

Sub Topic

Learning Objective

Competency

Bloom Taxonomy

Difficulty

Question Type

Language

---

QUESTION BANK

Question

Question Version

Question Option

Question Explanation

Question Reference

Question Tag

Question Source

Question Attachment

Question Metadata

Question History

Question Review

---

LEARNING RESOURCE

Learning Resource

Learning Version

Learning Section

Learning Attachment

Transcript

Subtitle

Reference

Learning Tag

---

CBT ENGINE

Exam

Exam Blueprint

Exam Question Snapshot

Exam Session

Attempt

Answer

Scoring

Result

Ranking

Certificate

---

USER MANAGEMENT

User

Role

Permission

Profile

User Preference

Device

Session

Authentication

Authorization

---

LEARNING

Learning Session

Learning Progress

Bookmark

Note

Favorite

Achievement

Learning History

---

ORGANIZATION

Organization

School

Classroom

Teacher

Student

Membership

Academic Calendar

Schedule

---

MEDIA

Media Asset

Media Variant

Media Metadata

Thumbnail

Storage

---

AI

Prompt

Embedding

Knowledge

AI Job

AI Result

Inference

---

ANALYTICS

Event

Fact

Dimension

Report

Dashboard

Metric

KPI

---

SYSTEM

Notification

Audit Log

Import Job

Export Job

Queue

Scheduler

Feature Flag

System Configuration

---

# Cross Domain Relationship

Master Academic

↓

Question

↓

Learning Resource

↓

Exam

↓

Learning

↓

Analytics

---

Question

↓

Exam Blueprint

↓

Exam Snapshot

↓

Attempt

↓

Result

---

Learning Resource

↓

Learning Session

↓

Progress

↓

Achievement

---

User

↓

Organization

↓

Classroom

↓

Exam Session

↓

Learning Session

---

Media

↓

Question

Learning Resource

User

Organization

---

AI

↓

Question

Learning Resource

Analytics

---

Analytics

↓

Dashboard

↓

Report

↓

Recommendation

---

# Ownership Matrix

| Entity | Owner Domain |
|----------|--------------|
| Question | Question Bank |
| Question Version | Question Bank |
| Learning Resource | Learning Resource |
| Exam | CBT Engine |
| Attempt | CBT Engine |
| Result | CBT Engine |
| User | User Management |
| Classroom | Organization |
| Learning Progress | Learning |
| Media Asset | Media |
| AI Job | AI |
| Dashboard | Analytics |
| Audit Log | System |

---

# Parent Child Hierarchy

Academic

└── Grade

    └── Subject

        └── Chapter

            └── Topic

                └── Question

Question

├── Option

├── Explanation

├── Version

├── Attachment

└── Review

Learning Resource

├── Section

├── Attachment

├── Transcript

├── Version

└── Reference

Exam

├── Blueprint

├── Snapshot

├── Session

│

└── Attempt

        ├── Answer

        ├── Score

        └── Result

Organization

├── Classroom

├── Teacher

└── Student

User

├── Profile

├── Session

├── Device

└── Preference

---

# Shared Entity

Shared Entity digunakan oleh beberapa Domain.

Academic

Media

User

Organization

Language

Difficulty

Bloom Taxonomy

Tidak ada Domain lain yang boleh memiliki salinan permanen selain Snapshot yang memang diizinkan.

---

# Snapshot Entity

Snapshot digunakan untuk menjaga histori.

Exam Question Snapshot

Exam Blueprint Snapshot

Exam Rule Snapshot

Snapshot bersifat immutable.

---

# Event Producer

Question Bank

Learning Resource

CBT Engine

Organization

Learning

User Management

Media

AI

System

---

# Event Consumer

Analytics

Notification

Search

AI

Recommendation

---

# External Integration

Future Ready

SSO

Payment

Video Streaming

Object Storage

CDN

Push Notification

Email

WhatsApp

Government Education API

LTI

SCORM

Semua melalui Integration Layer.

---

# Design Principles

1. Setiap Domain memiliki batas tanggung jawab yang jelas (Bounded Context).
2. Setiap Entity hanya dimiliki oleh satu Domain (Single Source of Truth).
3. Relasi lintas Domain menggunakan referensi atau event, bukan kepemilikan data.
4. Snapshot digunakan untuk menjaga histori pada proses yang membutuhkan immutability.
5. Conceptual ERD tidak mendefinisikan implementasi teknis seperti PK, FK, atau tipe data.
6. Shared Entity hanya digunakan sebagai referensi dan tidak diduplikasi tanpa alasan yang jelas.
7. Struktur ini menjadi dasar penyusunan Logical ERD dan Physical ERD.