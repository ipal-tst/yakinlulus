# 02_question_bank_ldm.md

# Logical Data Model
## Domain : Question Bank

Version : 1.0

---

# Tujuan

Question Bank merupakan domain inti yang menjadi **Single Source of Truth** seluruh soal pada platform YakinLulus.

Seluruh soal yang digunakan oleh:

- CBT Engine
- Learning Resource
- AI
- Analytics
- Try Out
- Latihan Soal

berasal dari domain ini.

Domain ini **tidak menyimpan jawaban peserta ujian**.

---

# Aggregate Root

```
Question
```

---

# Entity Hierarchy

```
Question
│
├── Question Version
├── Question Academic
├── Question Classification
├── Question Option
├── Question Explanation
├── Question Attachment
├── Question Source
├── Question Reference
├── Question Tag
├── Question Review
├── Question Statistics
├── Question History
└── Question Audit
```

---

# Logical Entity List

| Entity | Purpose |
|----------|----------|
| Question | Identitas soal |
| Question Version | Riwayat versi |
| Question Academic | Relasi akademik |
| Question Classification | Metadata klasifikasi |
| Question Option | Pilihan jawaban |
| Question Explanation | Pembahasan |
| Question Attachment | Relasi media |
| Question Source | Asal soal |
| Question Reference | Referensi ilmiah |
| Question Tag | Tag fleksibel |
| Question Review | Workflow editorial |
| Question Statistics | Statistik kualitas soal |
| Question History | Riwayat perubahan |
| Question Audit | Audit operasional |

---

# Aggregate Root

## Question

### Business Purpose

Menyimpan identitas utama soal.

### Candidate Attribute

```
ID

Question Code

Title

Question Text

Status

Visibility

Owner

Current Version

Created At

Updated At
```

### Business Rule

- satu Question mempunyai banyak Version
- satu Question hanya memiliki satu Current Version aktif
- Question tidak menyimpan metadata akademik secara langsung
- Question tidak menyimpan statistik

---

# Question Version

### Business Purpose

Menyimpan seluruh perubahan isi soal.

### Candidate Attribute

```
ID

Question ID

Version Number

Question Text

Reason

Created By

Created At

Published At

Status
```

### Business Rule

- immutable setelah dipublish
- hanya satu versi aktif

---

# Question Academic

### Business Purpose

Menghubungkan soal dengan Master Academic.

### Candidate Attribute

```
ID

Question ID

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

### Business Rule

Seluruh Foreign Key mengarah ke Master Academic.

---

# Question Classification

### Business Purpose

Klasifikasi pedagogis soal.

### Candidate Attribute

```
ID

Question ID

Difficulty ID

Bloom Taxonomy ID

Question Type ID

Language ID

Estimated Duration

Difficulty Weight

Cognitive Level
```

---

# Question Option

### Business Purpose

Pilihan jawaban.

### Candidate Attribute

```
ID

Question ID

Option Label

Option Text

Media ID

Display Order

Is Correct

Score
```

### Business Rule

- minimal dua option
- maksimal ditentukan konfigurasi sistem
- satu atau lebih jawaban benar tergantung Question Type

---

# Question Explanation

### Business Purpose

Pembahasan soal.

### Candidate Attribute

```
ID

Question ID

Explanation Text

Explanation Media

Reference

Video Explanation

Audio Explanation
```

---

# Question Attachment

### Business Purpose

Relasi Question dengan Media Domain.

### Candidate Attribute

```
ID

Question ID

Media Asset ID

Usage Type

Display Order
```

Contoh Usage Type

```
Question Image

Diagram

Audio

Video

Formula

Supporting File
```

---

# Question Source

### Business Purpose

Menyimpan asal soal.

### Candidate Attribute

```
ID

Question ID

Source Type

Organization

Author

Publication

Year

License
```

Contoh Source Type

```
Kemendikbud

Sekolah

Guru

AI

Import Excel

Publisher
```

---

# Question Reference

### Business Purpose

Referensi ilmiah atau kurikulum.

### Candidate Attribute

```
ID

Question ID

Reference Title

Reference URL

ISBN

Document Number
```

---

# Question Tag

### Business Purpose

Label fleksibel.

### Candidate Attribute

```
ID

Question ID

Tag Name
```

Contoh

```
HOTS

AKM

UTBK

Numerasi

Literasi

Remedial

Olimpiade
```

---

# Question Review

### Business Purpose

Workflow editorial.

### Candidate Attribute

```
ID

Question ID

Reviewer

Review Date

Decision

Comment

Revision Number
```

Decision

```
Draft

Need Revision

Approved

Rejected

Published
```

---

# Question Statistics

### Business Purpose

Statistik kualitas soal.

### Candidate Attribute

```
ID

Question ID

Total Attempt

Correct Count

Wrong Count

Skip Count

Average Time

Correct Rate

Difficulty Index

Discrimination Index

IRT Parameter

Rasch Parameter

AI Quality Score
```

### Business Rule

Domain Analytics mengisi data ini.

Question Domain hanya membaca.

---

# Question History

### Business Purpose

Riwayat perubahan bisnis.

### Candidate Attribute

```
ID

Question ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# Question Audit

### Business Purpose

Audit aktivitas sistem.

### Candidate Attribute

```
ID

Question ID

User

IP

Browser

Action

Timestamp
```

---

# Relationship

```
Question

1

↓

N

Question Version

1

↓

1

Question Academic

1

↓

1

Question Classification

1

↓

N

Question Option

1

↓

1

Question Explanation

1

↓

N

Question Attachment

1

↓

N

Question Tag

1

↓

N

Question Review

1

↓

1

Question Statistics

1

↓

N

Question History
```

---

# Ownership

| Entity | Owner |
|----------|--------|
| Question | Question Domain |
| Question Version | Question Domain |
| Question Academic | Question Domain |
| Question Classification | Question Domain |
| Question Option | Question Domain |
| Question Explanation | Question Domain |
| Question Attachment | Question Domain |
| Question Source | Question Domain |
| Question Reference | Question Domain |
| Question Tag | Question Domain |
| Question Review | Question Domain |
| Question Statistics | Analytics Domain (maintained), Question Domain (read) |
| Question History | Question Domain |
| Question Audit | System Domain |

---

# Cross Domain Reference

Question direferensikan oleh:

- CBT Engine
- Learning Resource
- AI
- Analytics
- Recommendation
- Search
- Practice Session

Question mereferensikan:

- Master Academic
- Media Domain
- User Domain

---

# Business Constraint

- Question Code wajib unik.
- Satu Question hanya mempunyai satu Current Version.
- Question tidak boleh dipublish tanpa minimal satu jawaban benar.
- Question wajib mempunyai Academic Classification.
- Question wajib mempunyai Difficulty.
- Question wajib mempunyai Question Type.
- Question wajib mempunyai Subject.
- Question tidak boleh dihapus apabila digunakan oleh CBT.
- Soft Delete digunakan.
- Version yang sudah Published tidak boleh diubah.
- Statistics tidak boleh diedit manual.

---

# Normalization

Target

```
BCNF
```

Seluruh metadata dipisahkan berdasarkan tanggung jawab bisnis.

Tidak diperbolehkan:

- Subject Name di tabel Question
- Difficulty Name di tabel Question
- Language Name di tabel Question
- Attachment Path di tabel Question

Seluruhnya menggunakan Foreign Key.

---

# Lifecycle

```
Draft

↓

Author Review

↓

Editorial Review

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

## 1. Question adalah Aggregate Root

Seluruh perubahan dilakukan melalui Aggregate Question.

Domain lain tidak boleh mengubah child entity secara langsung.

---

## 2. Snapshot Friendly

Question dirancang agar CBT Engine dapat membuat **Question Snapshot** tanpa memengaruhi data asli.

---

## 3. Version First

Question menggunakan entity Version, bukan kolom version_number sederhana.

Hal ini memungkinkan:

- rollback,
- audit,
- kurikulum berbeda,
- revisi editorial,
- histori lengkap.

---

## 4. Statistics Dipisahkan

Question Statistics bukan bagian transaksi.

Entity ini diperbarui dari Analytics melalui proses agregasi sehingga tidak membebani tabel inti.

---

## 5. Attachment Menggunakan Media Domain

Question tidak pernah menyimpan:

- image_path
- video_url
- audio_path

Seluruh media direferensikan melalui Media Asset.

---

## 6. Academic Decoupling

Seluruh relasi akademik berada pada Question Academic.

Dengan demikian perubahan struktur kurikulum tidak mengubah tabel Question.

---

## 7. Editorial Workflow

Question harus melalui proses:

```
Author

↓

Reviewer

↓

Approval

↓

Publication
```

AI maupun Import Excel tidak boleh langsung menghasilkan soal Published.

---

## 8. Future Ready

Model ini telah disiapkan untuk mendukung:

- Multi Correct Answer
- Essay
- Matching
- Drag & Drop
- HOTS Classification
- Adaptive Testing
- Computer Adaptive Test (CAT)
- AI Generated Question
- Item Response Theory (IRT)
- Rasch Model
- Question Calibration
- Multilingual Question
- Multimedia Question
- Shared Question Across Multiple Exams
- Version rollback tanpa kehilangan histori