# YakinLulus.id

# 03_cardinality_matrix.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan Cardinality (kardinalitas) antar Entity pada seluruh Domain YakinLulus.

Cardinality digunakan sebagai dasar penyusunan:

- Conceptual ERD
- Logical ERD
- Physical ERD
- Foreign Key
- Junction Table
- Constraint Database

---

# Cardinality Legend

| Symbol | Meaning |
|---------|----------|
| 1 : 1 | One to One |
| 1 : N | One to Many |
| N : N | Many to Many |
| 0 : 1 | Optional One |
| 0 : N | Optional Many |

---

# MASTER ACADEMIC

| Parent | Child | Cardinality | Mandatory | Notes |
|---------|-------|-------------|-----------|------|
| Education Level | Grade | 1:N | Yes | SD memiliki banyak kelas |
| Grade | Subject | N:N | Yes | Subject digunakan lintas kelas |
| Subject | Topic | 1:N | Yes | |
| Topic | Chapter | 1:N | Yes | |
| Curriculum | Subject | N:N | Yes | Kurikulum mengatur banyak mapel |
| Curriculum | Grade | N:N | Yes | |

---

# QUESTION BANK

| Parent | Child | Cardinality | Mandatory | Notes |
|---------|-------|-------------|-----------|------|
| Question | Question Option | 1:N | Yes | Minimal 2 opsi |
| Question | Question Explanation | 1:1 | No | Bisa ditambahkan nanti |
| Question | Question Metadata | 1:1 | Yes | Metadata wajib |
| Question | Question Version | 1:N | No | Versioning |
| Question | Question Review | 1:N | No | Review editor |
| Question | Question Attachment | 1:N | No | Lampiran |
| Question | Media Asset | N:N | No | Shared Asset |
| Question | Tag | N:N | No | Klasifikasi fleksibel |
| Question | Topic | N:1 | Yes | Master Academic |
| Question | Difficulty | N:1 | Yes | Master Data |
| Question | Cognitive Level | N:1 | No | Bloom Taxonomy |
| Question | Source | N:1 | No | Referensi soal |

---

# LEARNING RESOURCE

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Learning Resource | Section | 1:N | Yes |
| Section | Content Block | 1:N | Yes |
| Learning Resource | Transcript | 1:1 | No |
| Learning Resource | Subtitle | 1:N | No |
| Learning Resource | Version | 1:N | No |
| Learning Resource | Media Asset | N:N | No |
| Learning Resource | Tag | N:N | No |
| Learning Path | Learning Resource | N:N | Yes |

---

# CBT ENGINE

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Exam | Exam Section | 1:N | No |
| Exam | Exam Item Snapshot | 1:N | Yes |
| Exam | Exam Session | 1:N | Yes |
| Exam Session | Attempt | 1:N | Yes |
| Attempt | User Answer | 1:N | Yes |
| Attempt | Result | 1:1 | Yes |
| Result | Recommendation | 1:N | No |
| Blueprint | Blueprint Rule | 1:N | Yes |

---

# USER MANAGEMENT

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| User | User Profile | 1:1 | Yes |
| User | Login Session | 1:N | No |
| User | Device | 1:N | No |
| User | Role | N:N | Yes |
| Role | Permission | N:N | Yes |
| User | Notification | 1:N | No |

---

# LEARNING

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| User | Learning Progress | 1:N | No |
| User | Learning Session | 1:N | No |
| User | Bookmark | 1:N | No |
| User | Note | 1:N | No |
| User | Achievement | N:N | No |
| User | Badge | N:N | No |
| User | XP Transaction | 1:N | No |
| Study Plan | Study Plan Item | 1:N | Yes |
| Learning Resource | Learning Progress | 1:N | No |

---

# ORGANIZATION

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Organization | Campus | 1:N | No |
| Campus | Building | 1:N | No |
| Building | Classroom | 1:N | No |
| Organization | Classroom | 1:N | Yes |
| Classroom | Classroom Member | 1:N | Yes |
| Teacher | Classroom | N:N | Yes |
| Teacher | Subject | N:N | Yes |
| Student | Classroom | N:N | Yes |
| Academic Year | Classroom | 1:N | Yes |
| Semester | Classroom | 1:N | Yes |

---

# MEDIA

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Media Asset | Media File | 1:N | Yes |
| Media File | Variant | 1:N | No |
| Media Asset | Metadata | 1:1 | Yes |
| Media Asset | Usage | 1:N | No |
| Media Asset | Version | 1:N | No |
| Folder | Media Asset | 1:N | No |

---

# AI

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| AI Provider | AI Model | 1:N | Yes |
| AI Model | AI Job | 1:N | Yes |
| AI Job | AI Result | 1:N | Yes |
| Prompt | Prompt Version | 1:N | Yes |
| Embedding | Embedding Mapping | 1:N | Yes |
| Knowledge Source | Knowledge Chunk | 1:N | Yes |
| RAG Source | Knowledge Chunk | 1:N | Yes |

---

# ANALYTICS

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Analytics Event | Analytics Fact | 1:N | Yes |
| Analytics Fact | Summary | N:1 | Yes |
| Dashboard | Widget | 1:N | Yes |
| KPI | KPI Snapshot | 1:N | Yes |
| Report Template | Generated Report | 1:N | No |

---

# SYSTEM

| Parent | Child | Cardinality | Mandatory |
|---------|-------|-------------|-----------|
| Queue | Queue Message | 1:N | Yes |
| Scheduled Job | Background Job | 1:N | No |
| Notification Template | Notification Queue | 1:N | Yes |
| API Client | API Key | 1:N | Yes |
| Webhook | Delivery | 1:N | No |
| System Version | Release Note | 1:N | No |

---

# Cross Domain Cardinality

| Domain A | Domain B | Cardinality | Relationship |
|-----------|----------|-------------|--------------|
| Question | Media Asset | N:N | Reference |
| Learning Resource | Media Asset | N:N | Reference |
| Question | Topic | N:1 | Reference |
| Question | Subject | N:1 | Reference |
| Learning Resource | Subject | N:1 | Reference |
| Exam | Question Snapshot | 1:N | Snapshot |
| Learning Progress | Learning Resource | N:1 | Reference |
| Organization Member | User | N:1 | Reference |
| Classroom | Student | N:N | Association |
| Classroom | Teacher | N:N | Association |
| AI Job | Question | N:1 | Reference |
| AI Job | Learning Resource | N:1 | Reference |
| Analytics Event | User | N:1 | Reference |

---

# Cardinality Design Rules

## Rule 1

Composition hampir selalu menggunakan:

1:N

atau

1:1

---

## Rule 2

Association selalu menggunakan:

N:N

melalui Junction Table.

---

## Rule 3

Reference umumnya menggunakan:

N:1

karena banyak Entity mereferensikan satu Master Data.

---

## Rule 4

Snapshot menggunakan:

1:N

karena satu sumber dapat menghasilkan banyak snapshot.

---

## Rule 5

Master Data tidak boleh memiliki FK ke Domain bisnis.

---

## Rule 6

Shared Asset (Media) selalu N:N.

---

## Rule 7

User dapat memiliki banyak aktivitas.

Semua tabel aktivitas menggunakan:

User → Child

1:N

---

## Rule 8

Analytics tidak menjadi Parent Domain bisnis.

Analytics hanya mereferensikan data.

---

# Database Implementation Notes

- Relasi N:N harus diimplementasikan menggunakan Junction Table.
- Relasi 1:1 harus diberi UNIQUE Constraint pada Foreign Key.
- Relasi 1:N menggunakan Foreign Key pada Child Table.
- Snapshot tidak boleh diperbarui setelah dibuat (immutable).
- Optional relationship (0:1 dan 0:N) harus mempertimbangkan penggunaan `NULL` atau tabel terpisah sesuai kebutuhan performa.