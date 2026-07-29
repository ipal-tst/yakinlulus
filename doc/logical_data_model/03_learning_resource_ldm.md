# 03_learning_resource_ldm.md

# Logical Data Model
## Domain : Learning Resource

Version : 1.0

---

# Tujuan

Learning Resource merupakan domain yang menjadi **Single Source of Truth** untuk seluruh materi pembelajaran pada platform YakinLulus.

Domain ini mengelola seluruh konten pembelajaran baik berupa:

- Text
- Image
- Audio
- Video
- PDF
- Slide
- Interactive Content
- Simulation
- Practice Material

Learning Resource **bukan** domain aktivitas belajar siswa. Seluruh aktivitas belajar disimpan pada **Learning Domain**.

---

# Aggregate Root

```
Learning Resource
```

---

# Entity Hierarchy

```
Learning Resource
│
├── Learning Version
├── Learning Academic
├── Learning Classification
├── Learning Content
├── Learning Block
├── Learning Attachment
├── Learning Reference
├── Learning Author
├── Learning Tag
├── Learning Review
├── Learning Assessment
├── Learning Prerequisite
├── Learning Statistics
├── Learning History
└── Learning Audit
```

---

# Logical Entity List

| Entity | Purpose |
|----------|----------|
| Learning Resource | Materi utama |
| Learning Version | Riwayat versi |
| Learning Academic | Relasi akademik |
| Learning Classification | Metadata materi |
| Learning Content | Konten utama |
| Learning Block | Struktur isi |
| Learning Attachment | Relasi Media |
| Learning Reference | Referensi |
| Learning Author | Penulis |
| Learning Tag | Tag |
| Learning Review | Editorial Workflow |
| Learning Assessment | Soal terkait |
| Learning Prerequisite | Materi prasyarat |
| Learning Statistics | Statistik |
| Learning History | Riwayat |
| Learning Audit | Audit |

---

# Aggregate Root

## Learning Resource

### Business Purpose

Identitas utama materi.

### Candidate Attribute

```
ID

Resource Code

Title

Summary

Slug

Current Version

Status

Visibility

Owner

Estimated Duration

Created At

Updated At
```

---

### Business Rule

- satu Resource memiliki banyak Version
- satu Resource hanya memiliki satu Version aktif
- tidak menyimpan isi materi langsung
- tidak menyimpan media langsung

---

# Learning Version

### Business Purpose

Riwayat perubahan materi.

### Candidate Attribute

```
ID

Learning Resource ID

Version Number

Title

Summary

Change Log

Created By

Published At

Status
```

---

### Business Rule

Versi yang Published bersifat immutable.

---

# Learning Academic

### Business Purpose

Menghubungkan materi dengan Master Academic.

### Candidate Attribute

```
ID

Learning Resource ID

Education Level ID

Grade ID

Curriculum ID

Subject ID

Semester ID

Chapter ID

Topic ID

Sub Topic ID

Learning Objective ID
```

---

# Learning Classification

### Business Purpose

Metadata pembelajaran.

### Candidate Attribute

```
ID

Learning Resource ID

Material Type ID

Difficulty ID

Language ID

Bloom Level ID

Estimated Duration

Reading Level

Learning Style
```

---

Learning Style

```
Visual

Audio

Reading

Interactive

Simulation
```

---

# Learning Content

### Business Purpose

Konten utama materi.

### Candidate Attribute

```
ID

Learning Resource ID

Introduction

Objective

Conclusion

Notes

Status
```

---

Catatan:

Learning Content hanya menyimpan struktur utama.

Isi detail berada pada Learning Block.

---

# Learning Block

### Business Purpose

Unit penyusun materi.

### Candidate Attribute

```
ID

Learning Content ID

Block Type

Title

Content

Media Asset ID

Sequence

Parent Block ID
```

---

Block Type

```
Heading

Paragraph

Quote

Formula

Code

Image

Video

Audio

Table

List

Callout

Exercise

Quiz

HTML

Markdown

Embed
```

---

Business Rule

Learning Block dapat bersifat hierarchical.

Contoh

```
Heading

↓

Paragraph

↓

Image

↓

Quiz
```

---

# Learning Attachment

### Business Purpose

Relasi ke Media Domain.

### Candidate Attribute

```
ID

Learning Resource ID

Media Asset ID

Usage Type

Display Order
```

---

Usage Type

```
Cover

Thumbnail

Supporting Image

Worksheet

Video

Audio

PDF

Simulation
```

---

# Learning Reference

### Business Purpose

Referensi materi.

### Candidate Attribute

```
ID

Learning Resource ID

Reference Type

Title

Author

Publisher

Year

ISBN

URL
```

---

# Learning Author

### Business Purpose

Penulis materi.

### Candidate Attribute

```
ID

Learning Resource ID

User ID

Role

Contribution Percentage
```

---

Role

```
Author

Reviewer

Editor

Illustrator

Translator
```

---

# Learning Tag

### Business Purpose

Label fleksibel.

### Candidate Attribute

```
ID

Learning Resource ID

Tag
```

---

Contoh

```
UTBK

HOTS

Remedial

AKM

Literasi

Numerasi
```

---

# Learning Review

### Business Purpose

Workflow editorial.

### Candidate Attribute

```
ID

Learning Resource ID

Reviewer

Decision

Comment

Review Date
```

---

Decision

```
Draft

Revision

Approved

Rejected

Published
```

---

# Learning Assessment

### Business Purpose

Menghubungkan materi dengan Question Bank.

### Candidate Attribute

```
ID

Learning Resource ID

Question ID

Assessment Type

Sequence
```

---

Assessment Type

```
Pre Test

Practice

Exercise

Post Test

Quiz
```

---

Business Rule

Many-to-Many

Satu materi memiliki banyak soal.

Satu soal dapat digunakan banyak materi.

---

# Learning Prerequisite

### Business Purpose

Hubungan antar materi.

### Candidate Attribute

```
ID

Learning Resource ID

Prerequisite Resource ID
```

---

Contoh

```
Pecahan Dasar

↓

Pecahan Campuran
```

---

# Learning Statistics

### Business Purpose

Statistik materi.

### Candidate Attribute

```
ID

Learning Resource ID

View Count

Completion Rate

Average Duration

Average Rating

Bookmark Count

Like Count
```

---

Business Rule

Diupdate oleh Analytics Domain.

---

# Learning History

### Candidate Attribute

```
ID

Learning Resource ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# Learning Audit

### Candidate Attribute

```
ID

Learning Resource ID

User

Action

IP

Browser

Timestamp
```

---

# Relationship

```
Learning Resource

1

↓

N

Learning Version

1

↓

1

Learning Academic

1

↓

1

Learning Classification

1

↓

1

Learning Content

1

↓

N

Learning Block

1

↓

N

Learning Attachment

1

↓

N

Learning Reference

1

↓

N

Learning Author

1

↓

N

Learning Review

1

↓

N

Learning Assessment

1

↓

N

Learning History
```

---

# Ownership

| Entity | Owner |
|----------|--------|
| Learning Resource | Learning Resource Domain |
| Learning Version | Learning Resource Domain |
| Learning Academic | Learning Resource Domain |
| Learning Classification | Learning Resource Domain |
| Learning Content | Learning Resource Domain |
| Learning Block | Learning Resource Domain |
| Learning Attachment | Learning Resource Domain |
| Learning Reference | Learning Resource Domain |
| Learning Author | Learning Resource Domain |
| Learning Tag | Learning Resource Domain |
| Learning Review | Learning Resource Domain |
| Learning Assessment | Learning Resource Domain |
| Learning Prerequisite | Learning Resource Domain |
| Learning Statistics | Analytics Domain (maintained) |
| Learning History | Learning Resource Domain |
| Learning Audit | System Domain |

---

# Cross Domain Reference

Learning Resource mereferensikan:

- Master Academic
- Media Domain
- User Domain
- Question Bank

Learning Resource digunakan oleh:

- Learning Domain
- CBT
- AI
- Analytics
- Recommendation Engine

---

# Business Constraint

- Resource Code harus unik.
- Resource wajib memiliki Academic Classification.
- Resource wajib memiliki minimal satu Learning Block.
- Sequence pada Learning Block harus unik dalam satu parent.
- Version Published tidak boleh diubah.
- Attachment harus menggunakan Media Domain.
- Assessment hanya boleh mereferensikan Question yang Published.
- Circular prerequisite tidak diperbolehkan.
- Statistics tidak boleh diedit manual.
- Soft Delete diterapkan pada seluruh entity bisnis.

---

# Normalization

Target

```
BCNF
```

Seluruh metadata dipisahkan dari konten.

Tidak diperbolehkan:

- image_url pada Learning Resource
- video_url pada Learning Resource
- subject_name pada Learning Resource
- difficulty_name pada Learning Resource

Seluruhnya menggunakan Foreign Key.

---

# Lifecycle

```
Draft

↓

Authoring

↓

Review

↓

Revision

↓

Approved

↓

Published

↓

Deprecated

↓

Archived
```

---

# Design Notes

## 1. Block-Based Content

Materi tidak disimpan sebagai satu dokumen panjang.

Seluruh isi dibangun menggunakan **Learning Block** sehingga dapat:

- reusable
- mudah diedit
- mendukung drag & drop editor
- mendukung rich content
- mendukung AI generation per blok

---

## 2. Separation of Content and Activity

Domain ini hanya menyimpan materi.

Progress belajar, waktu belajar, bookmark pengguna, dan hasil latihan berada pada **Learning Domain**.

---

## 3. Assessment Terintegrasi

Materi tidak menyimpan soal.

Learning Assessment hanya menjadi relasi menuju Question Bank sehingga satu soal dapat digunakan ulang oleh banyak materi.

---

## 4. Version First

Seluruh revisi materi menggunakan Learning Version.

Riwayat perubahan tetap tersedia dan dapat dilakukan rollback.

---

## 5. Media Independence

Seluruh media menggunakan Media Domain.

Learning Resource tidak menyimpan path file maupun URL media secara langsung.

---

## 6. Academic Decoupling

Relasi akademik dipisahkan ke Learning Academic sehingga perubahan struktur kurikulum tidak memengaruhi tabel utama.

---

## 7. Hierarchical Content

Learning Block mendukung struktur bertingkat melalui Parent Block ID.

Contoh:

```
Bab

↓

Sub Bab

↓

Materi

↓

Contoh

↓

Latihan

↓

Rangkuman
```

Hal ini memungkinkan editor materi yang fleksibel seperti Notion atau modern LMS.

---

## 8. Future Ready

Model ini telah disiapkan untuk mendukung:

- Rich Text Editor
- Interactive Learning
- Video Streaming
- Audio Lesson
- Live Class Recording
- PDF Module
- SCORM/xAPI
- Adaptive Learning Path
- AI Generated Content
- Micro Learning
- Gamification
- Multi Language
- Offline Download
- Content Recommendation
- Reusable Learning Object (RLO)
- Learning Path dan Course pada fase berikutnya