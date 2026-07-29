# YakinLulus.id

# 01_entity_dependency_map.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan kepemilikan (ownership), ketergantungan (dependency), dan batas tanggung jawab (bounded context) antar Domain pada platform YakinLulus.

Dokumen ini menjadi acuan utama sebelum penyusunan Conceptual ERD, Logical ERD, dan Physical Database.

Dokumen ini **bukan** menjelaskan Foreign Key maupun tipe relasi database.

Dokumen ini hanya menjelaskan:

- Source of Truth
- Data Owner
- Consumer
- Dependency
- Allowed Access

---

# Ownership Rules

Setiap Entity hanya memiliki SATU Data Owner.

Domain lain tidak boleh mengubah data milik Domain lain secara langsung.

Komunikasi antar Domain dilakukan melalui Reference atau Service Layer.

Master Data selalu menjadi Source of Truth.

Snapshot digunakan apabila integritas histori harus dipertahankan.

---

# Access Legend

| Symbol | Meaning |
|---------|----------|
| O | Owner |
| R | Read Only |
| C | Create |
| U | Update |
| D | Delete |
| S | Snapshot |
| Ref | Reference Only |

---

# DOMAIN DEPENDENCY

---

## MASTER ACADEMIC DOMAIN

Role

Master Data

Source Of Truth

Owns

- Education Level
- Grade
- Subject
- Topic
- Chapter
- Curriculum
- Semester
- Academic Structure

Consumed By

Question Bank

Learning Resource

CBT

Learning

Analytics

Organization

Allowed Access

Question Bank

Ref

Learning Resource

Ref

CBT

Ref

Organization

Ref

Analytics

Read Only

Business Rules

Tidak ada Domain lain yang boleh mengubah Master Academic.

---

## QUESTION BANK DOMAIN

Role

Question Repository

Source Of Truth

Owns

- Question
- Question Option
- Question Explanation
- Question Version
- Question Review
- Question Metadata

Consumes

Master Academic

Media

AI

Allowed Access

Master Academic

Ref

Media

Ref

AI

Create / Read

CBT

Snapshot

Learning

Read

Analytics

Read

Business Rules

CBT tidak pernah menggunakan Question secara langsung ketika ujian berlangsung.

CBT hanya menggunakan Snapshot.

---

## LEARNING RESOURCE DOMAIN

Role

Content Repository

Owns

- Learning Resource
- Learning Path
- Resource Version
- Resource Transcript
- Resource Subtitle

Consumes

Master Academic

Media

AI

Allowed Access

Media

Ref

AI

Create

Learning

Read

Analytics

Read

Business Rules

Learning Resource tidak memiliki User Progress.

Progress berada pada Learning Domain.

---

## CBT ENGINE DOMAIN

Role

Assessment Engine

Owns

- Exam
- Blueprint
- Session
- Attempt
- User Answer
- Result
- Ranking

Consumes

Question Bank

Organization

User

Master Academic

Allowed Access

Question

Snapshot

Organization

Read

User

Read

Learning

Write Recommendation

Analytics

Write Event

Business Rules

CBT tidak boleh mengubah Question.

CBT tidak boleh mengubah User.

CBT menghasilkan Snapshot.

---

## USER MANAGEMENT DOMAIN

Role

Identity Management

Owns

- Identity
- Account
- Profile
- Role
- Permission
- Session

Consumes

Organization

Allowed Access

Organization

Reference

Learning

Reference

CBT

Reference

Analytics

Read

Business Rules

Tidak menyimpan data akademik.

Tidak menyimpan nilai.

Tidak menyimpan progress.

---

## LEARNING DOMAIN

Role

Learning Activity

Owns

- Learning Progress
- Learning Session
- Bookmark
- Note
- XP
- Achievement
- Study Plan

Consumes

Learning Resource

CBT

Question

User

Allowed Access

Learning Resource

Read

Question

Read

CBT

Read Result

Analytics

Write Event

Business Rules

Learning Domain tidak boleh mengubah Resource.

Learning Domain tidak boleh mengubah Question.

---

## ORGANIZATION DOMAIN

Role

Organization Management

Owns

- Organization
- Classroom
- Membership
- Academic Calendar
- Teacher Assignment

Consumes

Master Academic

User

Allowed Access

User

Reference

Learning

Read

CBT

Read

Analytics

Read

Business Rules

User dapat bergabung dengan banyak Organization.

---

## MEDIA DOMAIN

Role

Digital Asset Management

Owns

- Media Asset
- Media File
- Media Variant
- Metadata

Consumed By

Question Bank

Learning Resource

Organization

User

System

Allowed Access

Semua Domain

Reference Only

Business Rules

Media tidak dimiliki Domain lain.

Media selalu reusable.

---

## AI DOMAIN

Role

AI Service

Owns

- Prompt
- Model
- AI Job
- AI Result
- Embedding
- Knowledge Chunk

Consumes

Question

Learning Resource

Analytics

Allowed Access

Question

Read

Learning Resource

Read

Analytics

Read

Business Rules

AI tidak menjadi Source Of Truth.

AI hanya menghasilkan rekomendasi.

---

## ANALYTICS DOMAIN

Role

Reporting

Owns

- Analytics Event
- Summary
- KPI
- Dashboard
- Report

Consumes

Semua Domain

Allowed Access

Semua Domain

Read

Business Rules

Analytics tidak mengubah data bisnis.

Analytics hanya membaca Event.

---

## SYSTEM DOMAIN

Role

Infrastructure

Owns

- Configuration
- Queue
- Job
- Feature Flag
- Audit
- Notification

Consumes

Semua Domain

Allowed Access

Semua Domain

Infrastructure Only

Business Rules

System tidak memiliki data bisnis.

---

# Cross Domain Dependency

| Domain | Depends On |
|---------|------------|
| Master Academic | - |
| Question Bank | Master Academic, Media, AI |
| Learning Resource | Master Academic, Media, AI |
| CBT Engine | Question Bank, User Management, Organization, Master Academic |
| User Management | Organization |
| Learning | Learning Resource, Question Bank, CBT Engine |
| Organization | User Management, Master Academic |
| Media | - |
| AI | Question Bank, Learning Resource |
| Analytics | Semua Domain |
| System | Semua Domain |

---

# Dependency Flow

Master Academic
        │
        ▼
Question Bank
        │
        ▼
Learning Resource
        │
        ▼
CBT Engine
        │
        ▼
Learning
        │
        ▼
Analytics

Media
    │
    ├──────────────► Question Bank
    ├──────────────► Learning Resource
    ├──────────────► Organization
    └──────────────► User Management

AI
    │
    ├──────────────► Question Bank
    ├──────────────► Learning Resource
    ├──────────────► Learning
    └──────────────► Analytics

System
    │
    └──────────────► Semua Domain

---

# Source of Truth Matrix

| Data | Source of Truth |
|------|-----------------|
| Academic Structure | Master Academic |
| Question | Question Bank |
| Learning Resource | Learning Resource |
| Exam | CBT Engine |
| User Identity | User Management |
| Learning Progress | Learning |
| Organization | Organization |
| Media | Media |
| AI Result | AI |
| Analytics | Analytics |
| System Configuration | System |

---

# Design Principles

1. Setiap Entity hanya memiliki satu Domain Owner.

2. Tidak ada Domain yang mengubah Entity milik Domain lain secara langsung.

3. Shared Asset (Media, AI, Analytics) diakses menggunakan Reference.

4. Snapshot digunakan ketika histori harus dipertahankan (contoh: CBT Exam Item).

5. Semua Domain menghasilkan Event yang dapat dikonsumsi oleh Analytics.

6. System Domain hanya menyediakan layanan infrastruktur.

7. Master Academic menjadi Source of Truth untuk seluruh struktur akademik.

8. Seluruh hubungan antar Domain harus mengikuti prinsip Loose Coupling dan High Cohesion.

9. Foreign Key lintas Domain hanya digunakan bila benar-benar diperlukan. Untuk relasi lintas bounded context, prioritaskan identifier (UUID) dan service layer.

10. Tidak ada siklus kepemilikan (circular ownership) antar Domain.