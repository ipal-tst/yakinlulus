# YakinLulus.id
# Module Map

Version : 1.0  
Status : Draft  
Document Type : Module Map

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh Module yang terdapat pada setiap Business Domain di platform YakinLulus.id.

Module merupakan kumpulan fitur (Business Capability) yang berada di dalam satu Business Domain.

Dokumen ini menjadi acuan sebelum menyusun:

- Feature Map
- Entity Catalog
- Database Schema
- API Design
- Backend Service
- Frontend Module

---

# 2. Hierarchy

Business Domain
↓
Module
↓
Feature
↓
Entity
↓
Database Table

---

# 3. Module Map

---

# 3.1 Master Academic Domain

## Purpose

Mengelola seluruh struktur akademik yang menjadi referensi seluruh platform.

## Modules

### 1. Curriculum Management

Mengelola seluruh kurikulum yang didukung sistem.

Scope

- Kurikulum Nasional
- Kurikulum Merdeka
- Kurikulum 2013
- Kurikulum Internasional
- Custom Curriculum

---

### 2. Education Level Management

Mengelola jenjang pendidikan.

Scope

- SD
- SMP
- SMA
- SMK
- Gap Year
- Umum

---

### 3. Grade Management

Mengelola tingkat pendidikan (Grade).

Scope

- Grade 1
- Grade 2
- ...
- Grade 12

Catatan

Grade berbeda dengan Classroom.

---

### 4. Subject Management

Mengelola mata pelajaran.

Scope

- Subject
- Subject Alias
- Subject Category
- Subject Status

---

### 5. Academic Structure Management

Mengelola struktur pembelajaran.

Scope

- Chapter
- Sub Chapter
- Topic
- Sub Topic

---

### 6. Competency Management

Mengelola kompetensi pembelajaran.

Scope

- CP
- TP
- KD
- KI
- Learning Outcome

---

### 7. Learning Objective Management

Mengelola tujuan pembelajaran.

Scope

- Learning Objective
- Outcome Mapping

---

### 8. Taxonomy Management

Mengelola klasifikasi akademik.

Scope

- Bloom Taxonomy
- Difficulty Level
- HOTS
- LOTS
- MOTS
- Cognitive Level

---

### 9. Academic Reference Management

Mengelola referensi akademik.

Scope

- Semester
- Academic Year
- Reference Book
- Education Regulation
- National Standard

---

# 3.2 Question Bank Domain

## Purpose

Mengelola seluruh lifecycle Bank Soal.

## Modules

### 1. Question Authoring

- Create Question
- Edit Question
- Delete Question
- Duplicate Question
- Preview Question

---

### 2. Question Metadata

Mengelola metadata soal.

Scope

- Academic Mapping
- Difficulty
- Bloom
- Tags
- Source
- Estimated Time

---

### 3. Question Option Management

Mengelola pilihan jawaban.

Scope

- Multiple Choice
- Correct Answer
- Explanation

---

### 4. Question Media

Mengelola media soal.

Scope

- Image
- Audio
- Video
- PDF
- Formula
- Diagram

---

### 5. Question Import & Export

Scope

- Excel Import
- CSV Import
- AI Import
- JSON Import
- Export

---

### 6. Question Review

Scope

- Draft
- Review
- Revision
- Approval
- Reject

---

### 7. Question Versioning

Scope

- Version History
- Restore Version
- Compare Version

---

### 8. Question Search

Scope

- Filter
- Advanced Search
- Similar Question
- Duplicate Detection

---

### 9. Question Analytics

Scope

- Usage
- Accuracy
- Difficulty Analysis
- Success Rate

---

### 10. Question AI

Scope

- AI Generation
- AI Validation
- AI Similarity
- AI Metadata

---

# 3.3 Learning Material Domain

## Purpose

Mengelola seluruh materi pembelajaran.

## Modules

### 1. Material Authoring

- Create
- Edit
- Delete
- Preview

---

### 2. Material Content

Scope

- Rich Text
- Markdown
- Formula
- Code Block
- Interactive Content

---

### 3. Material Media

Scope

- Image
- Audio
- Video
- PDF
- Attachment

---

### 4. Material Versioning

Scope

- Revision
- History
- Restore

---

### 5. Material Tagging

Scope

- Subject
- Chapter
- Topic
- Difficulty
- Keywords

---

### 6. Material Publishing

Scope

- Draft
- Publish
- Archive

---

### 7. Material Analytics

Scope

- Read Count
- Completion Rate
- Engagement

---

# 3.4 CBT Engine Domain

## Purpose

Mengelola seluruh proses Computer Based Test.

## Modules

### 1. Exam Management

### 2. Exam Blueprint

### 3. Question Selection

### 4. Randomization

### 5. Exam Session

### 6. User Attempt

### 7. Timer Management

### 8. Auto Save

### 9. Scoring Engine

### 10. Result Management

### 11. Ranking

### 12. CBT Analytics

---

# 3.5 User Management Domain

## Purpose

Mengelola identitas pengguna.

## Modules

### 1. Authentication

### 2. Authorization

### 3. User Profile

### 4. Role Management

### 5. Permission Management

### 6. Session Management

### 7. Device Management

### 8. Account Security

---

# 3.6 Learning Domain

## Purpose

Mengelola aktivitas belajar pengguna.

## Modules

### 1. Learning Progress

### 2. Learning History

### 3. Recommendation

### 4. Weakness Analysis

### 5. Achievement

### 6. Badge

### 7. Ranking

### 8. Learning Statistics

---

# 3.7 Organization Domain

## Purpose

Mengelola organisasi pendidikan.

## Modules

### 1. School Management

### 2. Classroom Management

### 3. Teacher Management

### 4. Student Management

### 5. Enrollment

### 6. Academic Period

---

# 3.8 Media Domain

## Purpose

Mengelola seluruh aset digital.

## Modules

### 1. Upload

### 2. Image Processing

### 3. Video Processing

### 4. Audio Processing

### 5. File Management

### 6. Thumbnail

### 7. Storage Management

---

# 3.9 AI Domain

## Purpose

Mengelola seluruh layanan Artificial Intelligence.

## Modules

### 1. AI Question Generator

### 2. AI Material Generator

### 3. AI Explanation

### 4. Embedding

### 5. Similarity Engine

### 6. Prompt Management

### 7. AI Moderation

### 8. AI Evaluation

---

# 3.10 Analytics Domain

## Purpose

Mengelola seluruh analitik platform.

## Modules

### 1. Dashboard

### 2. Question Analytics

### 3. Learning Analytics

### 4. CBT Analytics

### 5. User Analytics

### 6. AI Analytics

### 7. Report Generator

---

# 3.11 System Domain

## Purpose

Mengelola kebutuhan sistem secara global.

## Modules

### 1. Notification

### 2. Activity Log

### 3. Audit Log

### 4. Configuration

### 5. Background Job

### 6. Scheduler

### 7. Feature Flag

### 8. System Monitoring

### 9. Health Check

### 10. Backup & Restore

---

# 4. Module Dependency

Master Academic
│
├──────────────┐
│              │
▼              ▼
Question   Learning Material
│              │
└──────┬───────┘
       ▼
   CBT Engine
       │
       ▼
Learning Domain
       │
       ▼
Analytics
       ▲
       │
AI Domain

Media Domain digunakan oleh:

- Question Bank
- Learning Material
- User Management
- Organization
- AI

User Management digunakan oleh seluruh Domain.

System Domain mendukung seluruh Domain.

---

Business Domain
    ↓
Sub Domain (opsional)
    ↓
Module
    ↓
Feature
    ↓
Use Case
    ↓
Entity
    ↓
Database Table

Contoh pada Question Bank Domain:

Question Bank Domain
│
├── Authoring Module
│   ├── Create Question
│   ├── Edit Question
│   └── Duplicate Question
│
├── Review Module
│   ├── Review
│   ├── Approve
│   └── Reject
│
├── Import Module
│   ├── Excel Import
│   ├── AI Import
│   └── JSON Import
│
├── Analytics Module
│   ├── Difficulty Analysis
│   ├── Usage Statistics
│   └── Success Rate
│
└── AI Module
    ├── AI Generation
    ├── Similarity Detection
    └── AI Validation