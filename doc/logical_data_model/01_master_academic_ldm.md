# 01_master_academic_ldm.md

# Logical Data Model
## Domain : Master Academic

Version : 1.0

---

# Tujuan

Master Academic merupakan **Core Reference Domain** yang menjadi fondasi seluruh platform YakinLulus.

Domain ini menjadi satu-satunya sumber referensi (Single Source of Truth) untuk seluruh struktur akademik, sehingga seluruh domain lain (Question Bank, Learning Resource, CBT, Analytics, AI) wajib mereferensikan domain ini melalui Foreign Key.

Master Academic **tidak menyimpan data transaksi**.

---

# Aggregate Root

```
Academic Structure
```

---

# Entity Hierarchy

```
Education Level
    │
    └── Grade
            │
            └── Curriculum
                    │
                    └── Subject
                            │
                            ├── Semester
                            │
                            ├── Chapter
                            │      │
                            │      └── Topic
                            │               │
                            │               └── Sub Topic
                            │
                            └── Learning Objective
```

---

# Logical Entity List

| Entity | Purpose |
|---------|----------|
| Education Level | Jenjang pendidikan |
| Grade | Tingkat kelas |
| Curriculum | Kurikulum |
| Subject | Mata pelajaran |
| Semester | Semester akademik |
| Chapter | Bab |
| Topic | Topik |
| Sub Topic | Sub topik |
| Learning Objective | Tujuan pembelajaran |
| Competency | Kompetensi |
| Bloom Taxonomy | Tingkatan kognitif |
| Difficulty | Tingkat kesulitan |
| Question Type | Jenis soal |
| Material Type | Jenis materi |
| Language | Bahasa |
| Academic Calendar | Kalender akademik |

---

# Entity Detail

---

## Education Level

### Business Purpose

Menentukan jenjang pendidikan.

### Candidate Attribute

```
ID
Code
Name
Display Name
Description
Sort Order
Status
```

### Business Rule

- tidak boleh duplicate code
- tidak boleh dihapus jika masih digunakan
- urutan ditentukan sort_order

Contoh

```
SD

SMP

SMA

SMK

UTBK
```

---

## Grade

### Business Purpose

Merepresentasikan kelas.

### Candidate Attribute

```
ID
Education Level ID

Code

Name

Display Order

Status
```

### Business Rule

Satu Grade hanya dimiliki satu Education Level.

Contoh

```
SD

↓

Kelas 4
```

---

## Curriculum

### Candidate Attribute

```
ID

Code

Name

Version

Description

Effective Start

Effective End

Status
```

### Business Rule

Curriculum dapat digunakan oleh banyak Grade.

Karena itu relasi nanti menggunakan junction table.

Contoh

```
Merdeka

↓

Kelas 4

↓

Kelas 5

↓

Kelas 6
```

---

## Grade Curriculum

Business Entity

Menghubungkan

```
Grade

⇄

Curriculum
```

Karena hubungan bersifat Many-to-Many.

---

## Subject

### Candidate Attribute

```
ID

Curriculum ID

Code

Name

Alias

Description

Status
```

Contoh

```
Matematika

IPA

IPS

Bahasa Indonesia
```

---

## Semester

### Candidate Attribute

```
ID

Curriculum ID

Code

Name

Sequence
```

Contoh

```
Semester 1

Semester 2
```

Catatan:

Semester bukan parent Chapter.

Semester hanya klasifikasi.

---

## Chapter

### Candidate Attribute

```
ID

Subject ID

Semester ID

Code

Title

Description

Sequence

Status
```

---

## Topic

### Candidate Attribute

```
ID

Chapter ID

Code

Title

Description

Sequence
```

---

## Sub Topic

### Candidate Attribute

```
ID

Topic ID

Code

Title

Description

Sequence
```

---

## Learning Objective

### Candidate Attribute

```
ID

Sub Topic ID

Code

Description

Sequence
```

Contoh

```
Siswa mampu menyelesaikan operasi pecahan campuran.
```

---

## Competency

### Candidate Attribute

```
ID

Learning Objective ID

Code

Description

Status
```

Contoh

```
CP

TP

KD

KI

atau model lain sesuai kurikulum
```

> **Catatan desain:** jangan mengikat struktur hanya pada istilah KD/KI karena setiap kurikulum dapat menggunakan istilah kompetensi yang berbeda.

---

## Bloom Taxonomy

### Candidate Attribute

```
ID

Code

Name

Level

Description
```

Contoh

```
Remember

Understand

Apply

Analyze

Evaluate

Create
```

---

## Difficulty

### Candidate Attribute

```
ID

Code

Name

Weight

Description
```

Contoh

```
Easy

Medium

Hard
```

---

## Question Type

### Candidate Attribute

```
ID

Code

Name

Description
```

Contoh

```
Multiple Choice

Essay

True False

Matching

Short Answer
```

---

## Material Type

### Candidate Attribute

```
ID

Code

Name

Description
```

Contoh

```
Article

Video

Audio

Simulation

Interactive

Practice

Module
```

---

## Language

### Candidate Attribute

```
ID

ISO Code

Code

Name

Native Name

Status
```

Contoh

```
id

en

ar
```

---

## Academic Calendar

### Candidate Attribute

```
ID

Academic Year

Semester

Start Date

End Date

Description

Status
```

---

# Relationship

```
Education Level

1

↓

N

Grade

↓

N

Grade Curriculum

↓

N

Curriculum

↓

1

↓

N

Subject

↓

1

↓

N

Chapter

↓

1

↓

N

Topic

↓

1

↓

N

Sub Topic

↓

1

↓

N

Learning Objective

↓

1

↓

N

Competency
```

---

# Lookup Entity

Domain ini juga memiliki Lookup Entity.

```
Bloom Taxonomy

Difficulty

Question Type

Material Type

Language
```

Lookup bersifat master data.

---

# Ownership

| Entity | Owner |
|----------|--------|
| Education Level | Master Academic |
| Grade | Master Academic |
| Curriculum | Master Academic |
| Subject | Master Academic |
| Semester | Master Academic |
| Chapter | Master Academic |
| Topic | Master Academic |
| Sub Topic | Master Academic |
| Learning Objective | Master Academic |
| Competency | Master Academic |
| Bloom Taxonomy | Master Academic |
| Difficulty | Master Academic |
| Question Type | Master Academic |
| Material Type | Master Academic |
| Language | Master Academic |

---

# Cross Domain Reference

Direferensikan oleh:

- Question Bank
- Learning Resource
- CBT Engine
- Analytics
- AI
- Organization

Tidak ada domain lain yang boleh mengubah data Master Academic.

---

# Business Constraint

- Code harus unik pada setiap entity.
- Sequence harus unik dalam parent yang sama.
- Tidak boleh terjadi orphan record.
- Tidak boleh circular reference.
- Subject wajib dimiliki minimal satu Curriculum.
- Chapter wajib dimiliki satu Subject.
- Topic wajib dimiliki satu Chapter.
- Sub Topic wajib dimiliki satu Topic.
- Learning Objective wajib dimiliki satu Sub Topic.
- Competency wajib dimiliki satu Learning Objective.
- Soft Delete digunakan pada seluruh entity bisnis.
- Lookup yang sudah digunakan transaksi tidak boleh dihapus.

---

# Normalization

Target Normal Form

```
BCNF
```

Seluruh atribut harus bergantung penuh pada Primary Key.

Tidak boleh ada:

- repeating group
- transitive dependency
- partial dependency

---

# Lifecycle

```
Draft

↓

Review

↓

Published

↓

Deprecated

↓

Archived
```

Master data tidak langsung dihapus.

---

# Design Notes

## 1. Curriculum menggunakan Junction Table

Jangan menyimpan `curriculum_id` langsung di Grade apabila satu kurikulum dapat dipakai oleh banyak Grade dan satu Grade dapat berganti kurikulum pada periode tertentu. Gunakan `Grade Curriculum` sebagai penghubung.

## 2. Semester adalah klasifikasi

Semester bukan induk Chapter. Chapter berada di bawah Subject dan diklasifikasikan ke Semester.

## 3. Lookup dipisahkan

Difficulty, Bloom Taxonomy, Question Type, Material Type, dan Language adalah lookup master yang dapat direferensikan oleh banyak domain.

## 4. Stable Academic Identifier

Seluruh entity akademik sebaiknya memiliki **Business Code** yang stabil dan tidak berubah walaupun nama tampilannya berubah. Domain lain harus menggunakan ID sebagai Foreign Key, sedangkan Business Code digunakan untuk integrasi, import, dan pelaporan.

## 5. Future Ready

Struktur ini telah disiapkan untuk mendukung:

- Multi Curriculum
- Multi Language
- Multi Education System
- Adaptive Learning
- AI Recommendation
- International Curriculum
- Cross-grade Learning
- Kompetensi lintas kurikulum
- Penambahan jenjang pendidikan baru tanpa perubahan struktur database