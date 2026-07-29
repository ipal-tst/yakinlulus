# YakinLulus.id

# 05_lifecycle.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan lifecycle (siklus hidup) setiap Entity utama pada platform YakinLulus.

Lifecycle menggambarkan perjalanan Entity sejak dibuat hingga tidak lagi digunakan.

Lifecycle menjadi acuan bagi:

- Business Process
- Workflow
- State Machine
- Audit Log
- Event Driven Architecture
- Background Job
- Notification
- Versioning
- Soft Delete
- Archiving

Lifecycle tidak menjelaskan struktur database, tetapi proses bisnis yang akan diimplementasikan pada Service Layer.

---

# Lifecycle Principles

## Rule 1

Setiap Entity memiliki lifecycle sendiri.

---

## Rule 2

Lifecycle dimulai ketika Entity dibuat.

---

## Rule 3

Lifecycle berakhir ketika Entity dihapus permanen atau dipensiunkan (Archived).

---

## Rule 4

Semua perubahan penting menghasilkan Event.

---

## Rule 5

Semua perubahan dicatat pada Audit Log.

---

# Lifecycle Template

Setiap lifecycle terdiri dari:

1. Actor
2. Trigger
3. Activity
4. Output
5. Side Effect
6. Dependency
7. Terminal State

---

# QUESTION LIFECYCLE

## Actor

- Admin
- Guru
- Content Author
- Reviewer
- Publisher
- System

## Lifecycle

Create Question

↓

Save Draft

↓

Edit Question

↓

Submit Review

↓

Review

↓

Approve

↓

Publish

↓

Digunakan pada Bank Soal

↓

Digunakan pada CBT

↓

Revisi (Version Baru)

↓

Archive

↓

Soft Delete

## Output

- Question
- Metadata
- Version
- Audit Log

## Side Effect

- Generate Search Index
- Generate AI Embedding
- Update Analytics
- Refresh Cache
- Available untuk CBT

## Dependency

- Master Academic
- Media
- AI
- Analytics
- CBT

## Terminal State

Archived

atau

Deleted

---

# LEARNING RESOURCE LIFECYCLE

## Actor

- Guru
- Content Author
- Reviewer
- Admin

## Lifecycle

Create Resource

↓

Draft

↓

Edit

↓

Review

↓

Approve

↓

Publish

↓

Dipelajari Siswa

↓

Update (Version Baru)

↓

Archive

↓

Soft Delete

## Output

- Resource
- Version
- Transcript
- Subtitle

## Side Effect

- Generate Streaming File
- Generate Thumbnail
- Generate Search Index
- Generate Embedding
- Analytics Event

## Dependency

- Media
- Learning
- AI
- Analytics

---

# MEDIA ASSET LIFECYCLE

## Actor

- User
- Admin
- System

## Lifecycle

Upload

↓

Virus Scan

↓

Metadata Extraction

↓

Image/Video Processing

↓

Compression

↓

Thumbnail Generation

↓

Ready

↓

Used by Domain

↓

Archive

↓

Delete

## Side Effect

- Create Variant
- Create Metadata
- OCR (Optional)
- Speech To Text (Video)

## Dependency

- Question
- Learning Resource
- User
- Organization

---

# EXAM LIFECYCLE

## Actor

- Guru
- Admin
- System

## Lifecycle

Create Exam

↓

Create Blueprint

↓

Generate Question Snapshot

↓

Schedule

↓

Publish

↓

Exam Running

↓

Submit

↓

Scoring

↓

Publish Result

↓

Archive

## Output

- Exam
- Snapshot
- Result
- Ranking

## Side Effect

- Lock Snapshot
- Analytics Event
- Recommendation
- Notification

## Dependency

- Question Bank
- Organization
- User
- Analytics

---

# EXAM SESSION LIFECYCLE

## Actor

- Student
- System

## Lifecycle

Session Created

↓

Waiting

↓

Start Exam

↓

Answer Question

↓

Auto Save

↓

Submit

↓

Auto Scoring

↓

Finish

↓

Archive

## Side Effect

- Save Answer
- Generate Result
- Generate Recommendation

---

# USER LIFECYCLE

## Actor

- User
- Admin
- System

## Lifecycle

Register

↓

Verify Email / Phone

↓

Active

↓

Login

↓

Learning Activity

↓

Exam Activity

↓

Logout

↓

Inactive

↓

Suspended

↓

Archive

↓

Soft Delete

## Side Effect

- Create Profile
- Create Default Setting
- Welcome Notification
- Analytics Event

---

# ORGANIZATION LIFECYCLE

## Actor

- Super Admin

- Organization Admin

## Lifecycle

Create Organization

↓

Configure

↓

Invite Teacher

↓

Invite Student

↓

Academic Operation

↓

Archive

↓

Delete

## Side Effect

- Default Classroom
- Academic Calendar
- Organization Setting

---

# LEARNING PROGRESS LIFECYCLE

## Actor

- Student

- System

## Lifecycle

Start Learning

↓

Open Resource

↓

Study

↓

Pause

↓

Resume

↓

Complete

↓

Generate Progress

↓

Generate Achievement

↓

Analytics

---

# AI JOB LIFECYCLE

## Actor

- System

- Admin

## Lifecycle

Create Job

↓

Queue

↓

Processing

↓

Inference

↓

Validation

↓

Save Result

↓

Completed

atau

↓

Retry

↓

Failed

## Side Effect

- Notification
- Audit Log
- Analytics Event

---

# IMPORT JOB LIFECYCLE

## Actor

- Admin

## Lifecycle

Upload Excel

↓

Validate

↓

Preview

↓

Import

↓

Mapping

↓

Insert

↓

Success

atau

↓

Partial Success

atau

↓

Failed

## Side Effect

- Error Report
- Import Log
- Analytics

---

# EXPORT JOB LIFECYCLE

Upload Request

↓

Queue

↓

Generate File

↓

Compress

↓

Download Ready

↓

Expired

---

# ANALYTICS REPORT LIFECYCLE

Request

↓

Queue

↓

Aggregate

↓

Generate Report

↓

Ready

↓

Downloaded

↓

Expired

---

# NOTIFICATION LIFECYCLE

Create

↓

Queue

↓

Sending

↓

Delivered

↓

Read

↓

Archived

---

# BACKGROUND JOB LIFECYCLE

Queue

↓

Worker Pick Up

↓

Running

↓

Success

atau

↓

Retry

↓

Failed

↓

Dead Letter Queue

---

# Common Lifecycle Events

Entity Created

Entity Updated

Entity Reviewed

Entity Approved

Entity Published

Entity Archived

Entity Deleted

Version Created

Notification Sent

Analytics Recorded

Audit Logged

---

# Common Side Effects

- Audit Log
- Analytics Event
- Notification
- Cache Refresh
- Search Index Update
- AI Embedding Update
- Background Job
- Version Increment

---

# Lifecycle Dependency Matrix

| Entity | Depends On | Produces |
|---------|------------|----------|
| Question | Master Academic, Media | Question Version, Analytics Event |
| Learning Resource | Media | Transcript, Embedding |
| Exam | Question Snapshot | Result, Ranking |
| User | Organization | Learning Progress |
| Learning Progress | Learning Resource | Achievement |
| AI Job | Question, Resource | AI Result |
| Media | Storage | Variant, Thumbnail |
| Import Job | Excel File | Entity Records |
| Analytics | Event | Dashboard |
| Notification | Event | Delivery Log |

---

# Design Principles

1. Setiap Entity memiliki lifecycle yang independen.
2. Lifecycle menggambarkan proses bisnis, bukan struktur database.
3. Setiap perubahan penting menghasilkan Event.
4. Semua aktivitas penting wajib diaudit.
5. Entity yang telah dipublikasikan menggunakan versioning untuk perubahan besar.
6. Soft Delete lebih diutamakan daripada Hard Delete.
7. Entity yang masih direferensikan oleh domain lain tidak boleh dihapus permanen.
8. Background Job digunakan untuk proses yang memerlukan waktu lama.
9. Semua lifecycle harus dapat dipulihkan (recoverable) jika terjadi kegagalan proses.
10. Lifecycle menjadi dasar penyusunan State Machine dan Workflow Engine.