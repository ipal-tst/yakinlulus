Berikut **08_database_schema / 06_seed_data.md**.

Dokumen ini mendefinisikan data awal (bootstrap data) yang diperlukan agar sistem Question Bank dapat berjalan setelah database baru dibuat.

Seed data berbeda dengan migration:

* **Migration** → struktur database.
* **Seed** → data awal yang dibutuhkan aplikasi.

---

````markdown id="s6d29a"
# 06_seed_data.md

# YakinLulus.id Question Bank Seed Data Strategy

Module : Question Bank  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan strategi
seed data untuk database Question Bank.

Seed data digunakan untuk.

- Initial system setup
- Development environment
- Testing environment
- Production bootstrap

---

# 2. Seed Data Principle

Seed data harus.

- Deterministic
- Version Controlled
- Reproducible
- Environment Aware

---

# 3. Seed Data Category

Seed dibagi menjadi.

```
System Reference Data

Education Master Data

Question Configuration

Development Sample Data

Testing Data
```

---

# 4. Seed Execution Order

Urutan seed.

```
1.

System Configuration


↓

2.

Reference Data


↓

3.

Education Taxonomy


↓

4.

Permission Data


↓

5.

Sample Question Data

```

---

# 5. System Reference Seed

Schema:

```
public
```

---

# 5.1 Question Status

Table:

```
question_statuses
```

Data:

| Code | Description |
|-|-|
| DRAFT | Question sedang dibuat |
| REVIEW | Menunggu review |
| APPROVED | Sudah disetujui |
| PUBLISHED | Aktif digunakan |
| ARCHIVED | Tidak aktif |

---

# 5.2 Difficulty Level

Table:

```
difficulty_levels
```

Data:

| Code | Weight |
|-|-|
| EASY | 1 |
| MEDIUM | 2 |
| HARD | 3 |

---

# 5.3 Question Type

Table:

```
question_types
```

Data:

```
MULTIPLE_CHOICE

TRUE_FALSE

ESSAY

CASE_STUDY
```

---

# 6. Education Master Seed

Schema:

```
public
```

---

# 6.1 Education Level

Table:

```
education_levels
```

Data.

```
SD

SMP

SMA

SMK

UTBK
```

---

# 6.2 Grade Seed

Table:

```
grades
```

Data.

## SD

```
4

5

6
```

## SMP

```
7

8

9
```

## SMA

```
10

11

12
```

---

# 6.3 Subject Seed

Table:

```
subjects
```

Contoh.

SD:

```
Matematika

IPA

IPS

Bahasa Indonesia

Bahasa Inggris
```

---

SMP/SMA:

```
Matematika

Fisika

Kimia

Biologi

Sejarah

Geografi

Ekonomi

Sosiologi
```

---

# 6.4 Curriculum Seed

Table:

```
curriculums
```

Contoh.

```
K13

Kurikulum Merdeka

UTBK SNBT
```

---

# 7. Taxonomy Seed

Table:

```
chapters
topics
```

---

Contoh.

Subject:

```
Matematika SMA
```

Chapter:

```
Aljabar

Geometri

Kalkulus

Statistika
```

Topic:

```
Persamaan Linear

Fungsi

Turunan

Integral
```

---

# 8. Role Seed

Schema:

```
public
```

Table:

```
roles
```

Data.

```
ADMIN

STAFF

TEACHER

STUDENT

REVIEWER
```

---

# 9. Permission Seed

Table:

```
permissions
```

---

Contoh.

Question:

```
question.create

question.update

question.review

question.publish

question.delete
```

---

# 10. Role Permission Mapping

Table:

```
role_permissions
```

---

ADMIN.

```
ALL
```

---

TEACHER.

```
question.create

question.update

question.review
```

---

REVIEWER.

```
question.review

question.approve
```

---

STUDENT.

```
question.read
```

---

# 11. AI Configuration Seed

Schema:

```
ai
```

---

Table:

```
ai_models
```

---

Example:

```
embedding-model-v1

question-generator-v1
```

---

# 12. Prompt Template Seed

Table:

```
prompt_templates
```

---

Example.

Name:

```
generate_multiple_choice_question
```

Content:

```
Generate question based on
curriculum and difficulty.
```

---

# 13. File Configuration Seed

Table:

```
storage_configurations
```

---

Example.

```
question-image

question-video

question-document
```

---

# 14. Development Sample Data

Hanya untuk.

```
development

testing
```

---

Tidak untuk production.

---

# 15. Sample Question

Example.

Subject:

```
Matematika
```

Grade:

```
12
```

Difficulty:

```
MEDIUM
```

Question:

```
Turunan fungsi f(x)=x² adalah?
```

Options:

```
A. x

B. 2x

C. x²

D. 2
```

Answer:

```
B
```

---

# 16. Test Dataset

Untuk testing performance.

Generate.

```
10.000 questions

50.000 versions

100.000 options
```

---

# 17. Production Seed Rule

Production hanya menerima.

```
Reference Data

Configuration Data

Permission Data
```

---

Tidak menerima.

```
Sample Question

Dummy User

Testing Data
```

---

# 18. Seed Versioning

Folder.

```
database/

seeds/

├── reference/

├── education/

├── permission/

├── ai/

└── sample/
```

---

# 19. Seed File Naming

Format.

```
001_status.sql

002_difficulty.sql

003_subject.sql
```

---

# 20. Seed Idempotency

Seed harus aman dijalankan ulang.

Gunakan.

```sql
INSERT

ON CONFLICT

DO NOTHING
```

---

# 21. Seed Environment

## Local

Full seed.

```
Reference

+

Sample

+

Testing
```

---

## Staging

```
Reference

+

Synthetic Data
```

---

## Production

```
Reference Only
```

---

# 22. Data Ownership

Reference data owner.

```
Education Admin
```

---

AI config owner.

```
AI Team
```

---

Permission owner.

```
System Admin
```

---

# 23. Seed Validation

Setelah seed.

Validasi.

```
Count Record

Foreign Key

Duplicate Data

Application Startup
```

---

# 24. Seed Automation

CI/CD.

Flow.

```
Migration

↓

Seed

↓

Integration Test

↓

Deploy
```

---

# 25. Future Seed Extension

Tambahan masa depan.

```
National Curriculum

School Template

Exam Template

AI Prompt Library

Learning Objective
```

---

# 26. Final Seed Strategy

Production bootstrap:

```
Schema Migration

+

Reference Seed

+

Permission Seed

+

Configuration Seed
```

Development:

```
+

Sample Question

+

Performance Dataset
```

Dengan strategi ini database Question Bank
dapat dibuat ulang secara konsisten
di semua environment.
````

---

Catatan implementasi:

Untuk YakinLulus.id saya menyarankan **seed data pendidikan tidak ditanam permanen di SQL migration**, tetapi dibuat sebagai **managed reference data**.

Contoh:

```
public.curriculums
public.subjects
public.chapters
public.topics
```

Karena kurikulum Indonesia dapat berubah:

```
K13
   ↓
Kurikulum Merdeka
   ↓
Kurikulum Baru
```

Sehingga data ini harus bisa di-update oleh admin tanpa harus deploy ulang backend.

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
03_index_strategy.md
04_constraint_strategy.md
05_migration_plan.md
06_seed_data.md
➡ 07_postgresql_ddl.sql
08_erdiagram.md
```

Selanjutnya masuk ke **07_postgresql_ddl.sql** — implementasi fisik seluruh schema, table, index, constraint PostgreSQL.
