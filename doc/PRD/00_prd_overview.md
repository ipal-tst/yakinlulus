Berikut draft **`PRD/00_prd_overview.md`** untuk YakinLulus.id.

```md
# Product Requirement Document (PRD)

## YakinLulus.id

### Document: PRD Overview

| Attribute | Value |
|---|---|
| Product Name | YakinLulus.id |
| Document Type | Product Requirement Document (PRD) |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Target Platform | Web, Mobile Responsive, Future Mobile Application |
| Primary Domain | Education Technology (EdTech) |
| Database Architecture Reference | Database Architecture Document |
| Domain Model Reference | Domain Modeling Document |
| ERD Reference | Entity Relationship Diagram Document |

---

# 1. Introduction

## 1.1 Purpose

Dokumen Product Requirement Document (PRD) ini mendefinisikan kebutuhan produk, ruang lingkup fitur, kebutuhan pengguna, aturan bisnis, serta spesifikasi fungsional dari platform **YakinLulus.id**.

PRD ini menjadi referensi utama bagi:

- Product Owner
- Business Analyst
- UI/UX Designer
- Software Engineer
- Database Engineer
- QA Engineer
- System Architect
- Stakeholder

dalam proses perancangan, pembangunan, pengujian, dan pengembangan platform.

---

# 2. Product Overview

## 2.1 Product Name

**YakinLulus.id**

---

## 2.2 Product Description

YakinLulus.id adalah platform EdTech yang berfokus membantu siswa meningkatkan kemampuan akademik melalui:

1. Bank Soal Digital
2. Computer Based Test (CBT) Engine
3. Materi Pembelajaran Interaktif
4. Analisis Perkembangan Belajar

Platform dirancang sebagai sistem pembelajaran berbasis data yang mampu memberikan pengalaman belajar personal melalui:

- latihan soal terstruktur
- simulasi ujian
- evaluasi kemampuan
- rekomendasi pembelajaran
- tracking progres belajar

---

# 3. Product Background

## 3.1 Current Education Problems

Banyak siswa mengalami kesulitan dalam persiapan ujian karena:

- Tidak memiliki akses bank soal berkualitas
- Kesulitan mengetahui kelemahan materi
- Kurangnya simulasi ujian yang menyerupai ujian sebenarnya
- Belajar tidak terstruktur
- Tidak mengetahui perkembangan kemampuan secara objektif

---

## 3.2 Market Opportunity

Digitalisasi pendidikan membuka peluang untuk menyediakan platform belajar yang:

- mudah digunakan
- berbasis data
- dapat digunakan kapan saja
- dapat berkembang dari skala keluarga hingga institusi pendidikan

---

# 4. Product Goal

## 4.1 Main Goal

Membangun platform pembelajaran digital yang membantu siswa:

> "Belajar lebih terarah, berlatih lebih banyak, dan meningkatkan peluang kelulusan."

---

## 4.2 Strategic Goals

### Short Term Goal (MVP)

Menyediakan:

- Repository bank soal
- Sistem latihan soal
- CBT Engine
- Dashboard progres siswa


### Medium Term Goal

Menjadi platform pembelajaran untuk:

- sekolah
- lembaga pendidikan
- komunitas belajar


### Long Term Goal

Menjadi ekosistem pendidikan berbasis AI yang mampu:

- menghasilkan soal otomatis
- memberikan tutor AI personal
- menganalisa pola belajar siswa

---

# 5. Product Scope Overview

## 5.1 Core Product Domain

YakinLulus.id terdiri dari beberapa domain utama:


```

YakinLulus.id

|
+-- Identity & Access Management
|
+-- Education Structure
|     |
|     +-- Jenjang
|     +-- Kelas
|     +-- Mata Pelajaran
|     +-- Kurikulum
|
+-- Question Bank
|     |
|     +-- Question
|     +-- Answer
|     +-- Explanation
|     +-- Source
|
+-- CBT Engine
|     |
|     +-- Exam
|     +-- Session
|     +-- Answer
|     +-- Result
|
+-- Learning Material
|     |
|     +-- Chapter
|     +-- Content
|     +-- Progress
|
+-- Analytics
|
+-- Learning Progress
+-- Performance Analysis
+-- Ranking

```

---

# 6. Product Philosophy

## 6.1 Learning First

Produk dirancang bukan hanya sebagai tempat mengerjakan soal, tetapi sebagai sistem pembelajaran.

Setiap aktivitas siswa menghasilkan data:

```

Practice
|
v
Answer Data
|
v
Performance Analysis
|
v
Learning Recommendation

```

---

## 6.2 Data Driven Education

Semua proses pembelajaran akan menghasilkan insight:

Contoh:

```

Siswa A

Matematika:

* Aljabar : 85%
* Geometri : 60%
* Statistika : 45%

Recommendation:

Prioritas belajar:

1. Statistika
2. Geometri

```

---

# 7. Target Education Level

Platform mendukung:

## Primary

### SD

- Kelas 4
- Kelas 5
- Kelas 6


## Secondary

### SMP

- Kelas 7
- Kelas 8
- Kelas 9


## High School

### SMA / SMK

- Kelas 10
- Kelas 11
- Kelas 12


## Preparation

### Gap Year / UTBK Preparation

- Persiapan masuk perguruan tinggi
- Tes kemampuan akademik


Total:

```

11 Educational Classes

```

---

# 8. User Role Overview

## 8.1 Admin

Responsibilities:

- Mengelola sistem
- Mengelola user
- Mengelola konten
- Mengelola bank soal
- Mengelola ujian


---

## 8.2 Staff / Content Manager

Responsibilities:

- Input soal
- Validasi soal
- Mengelola materi


---

## 8.3 Teacher

Responsibilities:

- Membuat soal
- Membuat ujian
- Melihat analisis siswa


---

## 8.4 Student

Responsibilities:

- Belajar materi
- Latihan soal
- Mengikuti CBT
- Melihat perkembangan belajar


---

# 9. Product Boundary

## Included in MVP

```

YES

* User authentication
* Role management
* Question bank
* Question filtering
* CBT examination
* Exam result
* Basic progress tracking
* Learning material management

```

---

## Excluded from MVP

```

NO

* Payment gateway
* Marketplace
* Social learning
* Live class
* AI tutor
* AI question generator
* School billing system

```

---

# 10. Technical Direction Reference

## Architecture Principle

Platform menggunakan pendekatan:

- Modular Architecture
- Domain Driven Design
- API First
- Cloud Ready
- Scalable Database Design


---

## Database Principle

Database mengikuti:

- PostgreSQL
- Normalized relational model
- UUID identifier
- Audit trail
- Soft delete
- Migration controlled


---

# 11. Future Scalability Consideration

Walaupun MVP digunakan untuk skala kecil, desain harus siap berkembang:

## Future Users

```

MVP

10 users
|
v

1000 users
|
v

100.000+ users

```

---

## Future Expansion

Kemungkinan pengembangan:

- Multi school tenant
- Subscription system
- AI tutor
- AI question generation
- Adaptive learning
- Mobile application
- National exam preparation platform


---

# 12. Reference Documents

Dokumen pendukung:

| Document | Purpose |
|-|-|
| Domain Modeling | Business domain definition |
| Entity Catalog | Database entity definition |
| ERD | Database relationship model |
| Logical Data Model | Data structure |
| Database Architecture | Technical database design |
| System Architecture | Application architecture |

---

# 13. PRD Document Structure

PRD ini terdiri dari:

```

PRD/

00_prd_overview.md
01_product_vision.md
02_problem_statement.md
03_target_user_persona.md
04_product_scope.md
05_feature_requirement.md
06_user_flow.md
07_business_rule.md
08_functional_requirement.md
09_non_functional_requirement.md
10_acceptance_criteria.md
11_mvp_definition.md
12_roadmap.md
13_success_metric.md

```

---

# 14. Document Status

Current Status:

```

Draft - Initial Product Definition

```

