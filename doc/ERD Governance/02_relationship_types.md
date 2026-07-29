# YakinLulus.id

# 02_relationship_types.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan jenis hubungan (Relationship Types) antar Entity dalam seluruh Domain YakinLulus.

Relationship Type digunakan sebagai dasar penyusunan:

- Conceptual ERD
- Logical ERD
- Physical ERD

Relationship Type berbeda dengan Cardinality.

Contoh:

Question
↓

Question Option

Relationship Type = Composition

Cardinality = One to Many

---

# Relationship Types

Platform YakinLulus menggunakan lima jenis hubungan utama.

---

## 1. Composition

### Definisi

Child Entity tidak dapat hidup tanpa Parent Entity.

Jika Parent dihapus, Child ikut dihapus.

### Karakteristik

- Strong Ownership
- Lifecycle mengikuti Parent
- Cascade Delete diperbolehkan
- FK Mandatory

### Contoh

Question
│
├── Question Option
├── Question Explanation
├── Question Metadata
└── Question Version

Learning Resource
│
├── Section
├── Chapter
├── Transcript
└── Subtitle

Exam
│
├── Exam Section
├── Exam Item Snapshot
├── Attempt
└── User Answer

Organization
│
├── Classroom
├── Academic Calendar
└── Classroom Member

---

## 2. Aggregation

### Definisi

Entity mempunyai hubungan logis tetapi Child masih dapat hidup sendiri.

Parent hanya "mengelompokkan".

Jika Parent dihapus, Child tidak ikut dihapus.

### Karakteristik

- Weak Ownership
- Tidak menggunakan Cascade Delete
- Child memiliki lifecycle sendiri

### Contoh

Learning Path
│
├── Learning Resource

Study Plan
│
├── Learning Resource

Question Collection
│
├── Question

Exam Blueprint
│
├── Question Bank Category

---

## 3. Association

### Definisi

Dua Entity saling berhubungan tanpa saling memiliki.

Biasanya menggunakan Junction Table.

### Karakteristik

- Many to Many
- Junction Table
- Tidak ada Ownership

### Contoh

Question
↔ Tag

Teacher
↔ Subject

Teacher
↔ Classroom

Student
↔ Organization

Media
↔ Tag

Learning Resource
↔ Tag

---

## 4. Reference

### Definisi

Entity hanya menyimpan referensi terhadap Entity lain.

Tidak memiliki lifecycle.

Tidak memiliki ownership.

### Karakteristik

- Read Only
- Tidak boleh Cascade Delete
- Cross Domain Reference

### Contoh

Question
↓

Media Asset

Question
↓

Subject

Question
↓

Grade

Learning Resource
↓

Media

Learning Resource
↓

Curriculum

CBT
↓

Question Snapshot Source

Analytics
↓

Student

Analytics
↓

Question

Analytics
↓

Learning Resource

---

## 5. Snapshot

### Definisi

Entity membuat salinan data pada waktu tertentu.

Snapshot tidak berubah walaupun Source berubah.

### Karakteristik

- Immutable
- Historical
- Tidak sinkron dengan Source

### Contoh

Question
↓

Exam Item Snapshot

Question
↓

Exam Version

Exam
↓

Result Snapshot

Learning Progress
↓

Daily Summary

Leaderboard
↓

Monthly Ranking

---

# Relationship Matrix

| Parent | Child | Type | Reason |
|---------|--------|------|--------|
| Question | Question Option | Composition | Tidak dapat berdiri sendiri |
| Question | Question Explanation | Composition | Bergantung pada soal |
| Question | Question Metadata | Composition | Bergantung pada soal |
| Question | Question Version | Composition | Riwayat soal |
| Question | Media Asset | Reference | Media dapat digunakan ulang |
| Question | Subject | Reference | Subject adalah Master Data |
| Question | Topic | Reference | Topic adalah Master Data |
| Question | Difficulty Level | Reference | Master Data |
| Learning Resource | Chapter | Composition | Bagian dari materi |
| Learning Resource | Section | Composition | Bagian dari materi |
| Learning Resource | Transcript | Composition | Bagian dari materi |
| Learning Resource | Subtitle | Composition | Bagian dari materi |
| Learning Resource | Media Asset | Reference | Shared Asset |
| Learning Resource | Subject | Reference | Master Academic |
| Learning Resource | Grade | Reference | Master Academic |
| Learning Path | Learning Resource | Aggregation | Resource dapat berdiri sendiri |
| Study Plan | Learning Resource | Aggregation | Resource reusable |
| Exam | Exam Section | Composition | Bagian dari ujian |
| Exam | Exam Item Snapshot | Composition | Snapshot permanen |
| Exam | Exam Session | Composition | Bergantung ujian |
| Exam Session | Attempt | Composition | Bergantung Session |
| Attempt | User Answer | Composition | Bergantung Attempt |
| Attempt | Result | Composition | Bergantung Attempt |
| Exam | Question | Snapshot | Integritas histori |
| Organization | Classroom | Composition | Struktur organisasi |
| Classroom | Classroom Member | Composition | Bergantung kelas |
| Teacher | Subject | Association | Banyak ke banyak |
| Teacher | Classroom | Association | Banyak ke banyak |
| Student | Organization | Association | Banyak ke banyak |
| Question | Tag | Association | Banyak ke banyak |
| Learning Resource | Tag | Association | Banyak ke banyak |
| Media Asset | Tag | Association | Banyak ke banyak |
| Media Asset | Media File | Composition | File bagian dari Asset |
| Media Asset | Variant | Composition | Turunan Asset |
| Media Asset | Metadata | Composition | Detail teknis Asset |
| AI Job | AI Result | Composition | Output Job |
| AI Prompt | AI Prompt Version | Composition | Versioning |
| AI Result | Question | Reference | Hasil digunakan Question |
| AI Result | Learning Resource | Reference | Hasil digunakan Resource |
| Analytics | Analytics Event | Composition | Event milik Analytics |
| Analytics Summary | Analytics Fact | Aggregation | Ringkasan berasal dari Fact |
| Dashboard | Widget | Composition | Widget bagian Dashboard |
| Organization | User | Association | User dapat di banyak Organization |
| User | Role | Association | Role dapat digunakan banyak User |
| Notification Template | Notification Queue | Reference | Template dipakai Queue |
| Queue | Queue Message | Composition | Pesan milik Queue |

---

# Cross Domain Relationship Rules

## Rule 1

Tidak ada Domain yang boleh melakukan Composition terhadap Entity Domain lain.

Benar

CBT

↓

Exam Item Snapshot

Salah

CBT

↓

Question

---

## Rule 2

Lintas Domain menggunakan Reference atau Snapshot.

---

## Rule 3

Master Data selalu menggunakan Reference.

---

## Rule 4

Media selalu menggunakan Reference.

---

## Rule 5

Analytics tidak memiliki Relationship Composition terhadap Domain bisnis.

Analytics hanya membaca Event.

---

## Rule 6

AI tidak mengubah Entity bisnis secara langsung.

AI menghasilkan Recommendation atau Result.

---

## Rule 7

Snapshot bersifat Immutable.

Tidak boleh Update.

Tidak boleh Sinkronisasi ulang.

---

## Rule 8

Composition boleh menggunakan Cascade Delete.

Reference tidak boleh menggunakan Cascade Delete.

---

## Rule 9

Association selalu menggunakan Junction Table.

Contoh

teacher_subjects

student_organizations

question_tags

resource_tags

media_tags

---

## Rule 10

Setiap Relationship harus memiliki satu Owner yang jelas.

Tidak boleh ada Dual Ownership.

---

# Design Principles

1. Gunakan Composition hanya bila lifecycle Child sepenuhnya bergantung pada Parent.

2. Gunakan Aggregation bila Parent hanya berfungsi sebagai pengelompokan.

3. Gunakan Association untuk relasi Many-to-Many.

4. Gunakan Reference untuk hubungan lintas Domain dan Master Data.

5. Gunakan Snapshot untuk menjaga histori dan konsistensi data.

6. Hindari Circular Relationship.

7. Hindari Cascade Delete lintas Domain.

8. Shared Asset (Media, AI, Master Academic) selalu direferensikan, bukan dimiliki.

9. Relationship Type harus ditentukan sebelum membuat Foreign Key.

10. Ownership Entity lebih penting daripada arah Foreign Key.