Bagus. Sekarang kita masuk ke tahap yang menurut saya adalah **titik balik**.

Mulai dari sini kita sudah tidak lagi berbicara dokumentasi, tetapi mulai **mendesain database**.

Namun **jangan langsung ERD**.

Masih ada satu dokumen yang menurut saya wajib ada.

> **Relationship Matrix**

Ini adalah dokumen yang hampir selalu dibuat oleh Database Architect sebelum menggambar ERD.

Kenapa?

Karena begitu Relationship Matrix selesai, ERD tinggal digambar.

---

# Roadmap kita sekarang

```text
✓ Business Domain Charter

↓

✓ Module Map

↓

✓ Feature Map

↓

✓ Entity Catalog

↓

▶ Relationship Matrix

↓

ERD

↓

Logical Database

↓

Physical Database
```

---

# RELATIONSHIP_MATRIX.md

```md
# YakinLulus.id

# Relationship Matrix

Version : 1.0

Status : Draft

Document Type : Entity Relationship Matrix

---

# 1. Purpose

Dokumen ini mendefinisikan hubungan antar Business Entity sebelum implementasi Entity Relationship Diagram (ERD).

Relationship Matrix digunakan untuk:

- Menentukan Cardinality
- Menentukan Parent Entity
- Menentukan Child Entity
- Menentukan Ownership
- Menentukan Foreign Key
- Mengurangi Circular Dependency
- Mempermudah desain ERD

---

# 2. Relationship Types

Relationship yang digunakan pada sistem:

1 : 1

One To One

---

1 : N

One To Many

---

N : N

Many To Many

(menggunakan Junction Entity)

---

Inheritance

Digunakan apabila Entity mempunyai turunan.

---

Composition

Child wajib mengikuti Parent.

---

Aggregation

Child dapat berdiri sendiri.

---

Reference

Entity hanya menggunakan referensi.

---

# 3. Relationship Matrix
```

---

# MASTER ACADEMIC DOMAIN

## Curriculum

| Parent     | Child           | Type | Ownership |
| ---------- | --------------- | ---- | --------- |
| Curriculum | Education Level | 1:N  | Strong    |

---

## Education Level

| Parent          | Child | Type |
| --------------- | ----- | ---- |
| Education Level | Grade | 1:N  |

---

## Grade

| Parent | Child   | Type |
| ------ | ------- | ---- |
| Grade  | Subject | 1:N  |

---

## Subject

| Parent  | Child   | Type |
| ------- | ------- | ---- |
| Subject | Chapter | 1:N  |

---

## Chapter

| Parent  | Child       | Type |
| ------- | ----------- | ---- |
| Chapter | Sub Chapter | 1:N  |

---

## Sub Chapter

| Parent      | Child | Type |
| ----------- | ----- | ---- |
| Sub Chapter | Topic | 1:N  |

---

## Topic

| Parent | Child              | Type |
| ------ | ------------------ | ---- |
| Topic  | Sub Topic          | 1:N  |
| Topic  | Learning Objective | 1:N  |
| Topic  | Competency         | N:N  |

---

# QUESTION BANK DOMAIN

---

## Question

| Parent   | Child               | Type |
| -------- | ------------------- | ---- |
| Question | Question Option     | 1:N  |
| Question | Question Media      | 1:N  |
| Question | Question Review     | 1:N  |
| Question | Question Version    | 1:N  |
| Question | Question Statistics | 1:1  |
| Question | Question Tag        | N:N  |
| Question | Question Embedding  | 1:1  |

---

## Question

Relationship ke Domain lain.

| Parent     | Child    | Type |
| ---------- | -------- | ---- |
| Topic      | Question | 1:N  |
| Difficulty | Question | 1:N  |
| Bloom      | Question | 1:N  |
| Curriculum | Question | 1:N  |

---

# MATERIAL DOMAIN

---

## Material

| Parent   | Child               | Type |
| -------- | ------------------- | ---- |
| Material | Material Media      | 1:N  |
| Material | Material Version    | 1:N  |
| Material | Material Attachment | 1:N  |
| Material | Material Tag        | N:N  |

---

Hubungan ke Domain Akademik

| Parent  | Child    |
| ------- | -------- |
| Topic   | Material |
| Subject | Material |

---

# CBT DOMAIN

---

## Exam

| Parent | Child          | Type |
| ------ | -------------- | ---- |
| Exam   | Exam Blueprint | 1:1  |
| Exam   | Exam Session   | 1:N  |
| Exam   | Exam Question  | N:N  |
| Exam   | User Attempt   | 1:N  |

---

## User Attempt

| Parent       | Child       |
| ------------ | ----------- |
| User Attempt | User Answer |
| User Attempt | Score       |
| User Attempt | Result      |

---

# USER DOMAIN

---

User

↓

Profile

1 : 1

---

Role

↓

Permission

N : N

---

User

↓

Session

1 : N

---

User

↓

Device

1 : N

---

# ORGANIZATION DOMAIN

School

↓

Classroom

↓

Enrollment

↓

Student

---

Teacher

↓

Teaching Assignment

---

# LEARNING DOMAIN

User

↓

Learning Progress

↓

Learning Activity

↓

Learning History

↓

Recommendation

↓

Achievement

---

# MEDIA DOMAIN

Media

↓

Image

↓

Video

↓

Audio

↓

PDF

---

Question

↓

Media

Reference

---

Material

↓

Media

Reference

---

Profile

↓

Media

Reference

---

# AI DOMAIN

Question

↓

Embedding

1 : 1

---

Material

↓

Embedding

1 : 1

---

AI Generation

↓

Question

Reference

---

AI Generation

↓

Material

Reference

---

# ANALYTICS DOMAIN

Question

↓

Question Analytics

---

Material

↓

Material Analytics

---

Exam

↓

Exam Analytics

---

User

↓

Learning Analytics

---

# SYSTEM DOMAIN

User

↓

Notification

---

System

↓

Audit Log

---

User

↓

Activity Log

---

Scheduler

↓

Background Job

---

# 4. Cross Domain Relationship

Master Academic

↓

Question

Reference

---

Master Academic

↓

Material

Reference

---

Question

↓

CBT

Reference

---

Question

↓

Learning

Reference

---

Material

↓

Learning

Reference

---

User

↓

Learning

Ownership

---

User

↓

CBT

Ownership

---

Organization

↓

User

Ownership

---

Media

↓

Question

Reference

---

Media

↓

Material

Reference

---

Media

↓

Profile

Reference

---

AI

↓

Question

Reference

---

AI

↓

Material

Reference

---

Analytics

↓

Semua Domain

Read Only

---

System

↓

Semua Domain

Support

````

---

# Saya ingin mengubah satu keputusan desain yang tadi kita buat.

Ini cukup penting.

## Subject sebaiknya **tidak langsung memiliki Chapter**.

Lebih fleksibel jika dibuat seperti ini.

```text
Curriculum

↓

Education Level

↓

Grade

↓

Subject

↓

Subject Structure

↓

Chapter

↓

Sub Chapter

↓

Topic

↓

Sub Topic
````

Kenapa saya berubah pikiran?

Karena di dunia nyata ada kasus seperti:

**Matematika SMP**

Kurikulum Merdeka

Bab 1

↓

Aljabar

Sedangkan

**Kurikulum 2013**

Bab 1

↓

Bilangan

Kalau `Chapter` langsung menjadi child dari `Subject`, kita akan kesulitan menangani variasi struktur antar kurikulum atau perubahan struktur di masa depan.

Dengan menambahkan **Subject Structure** (atau nanti bisa kita beri nama **Curriculum Subject**), kita bisa memodelkan bahwa **Subject yang sama memiliki struktur berbeda tergantung kurikulum, jenjang, atau versi**.

Menurut saya, keputusan kecil ini akan sangat mengurangi potensi migrasi database ketika nanti YakinLulus mendukung banyak kurikulum, sekolah, dan versi materi secara bersamaan.
