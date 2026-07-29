Saya menyarankan **06_taxonomy_classification.md** dibuat jauh lebih komprehensif daripada sekadar Bloom Taxonomy. Untuk platform seperti **YakinLulus.id**, taxonomy akan menjadi fondasi bagi:

* AI Question Generation
* CBT Randomization
* Adaptive Learning
* Analytics
* Recommendation Engine
* Knowledge Graph
* Future Computerized Adaptive Testing (CAT)

Dokumen ini akan menjadi **master classification system** seluruh bank soal.

---

````markdown
# 06_taxonomy_classification.md

# Question Taxonomy & Classification

Version : 1.0

---

# 1. Overview

Taxonomy adalah sistem klasifikasi akademik yang digunakan untuk mengelompokkan setiap Question berdasarkan berbagai dimensi pendidikan.

Taxonomy digunakan oleh:

- Question Bank
- CBT Engine
- AI Question Generator
- Recommendation Engine
- Analytics
- Adaptive Learning
- Search Engine

Tujuan utama taxonomy adalah memastikan setiap soal dapat dicari, dianalisis, dirandomisasi, dan dievaluasi secara konsisten.

---

# 2. Taxonomy Architecture

```

Question

│

├── Academic Taxonomy

├── Curriculum Taxonomy

├── Cognitive Taxonomy

├── Difficulty Taxonomy

├── Assessment Taxonomy

├── Content Taxonomy

├── Skill Taxonomy

├── Learning Taxonomy

├── AI Taxonomy

└── Analytics Taxonomy

```

---

# 3. Academic Taxonomy

Menentukan posisi soal dalam struktur pendidikan.

Hierarchy

```

Education Level

↓

Grade

↓

Semester

↓

Subject

↓

Chapter

↓

Sub Chapter

↓

Topic

↓

Sub Topic

↓

Learning Objective

```

Contoh

```

SMA

↓

Kelas XII

↓

Semester 1

↓

Matematika

↓

Integral

↓

Integral Tak Tentu

↓

Substitusi

```

---

# 4. Curriculum Taxonomy

Question harus terhubung dengan kurikulum.

Field

- Curriculum
- Curriculum Version
- Academic Year
- Education Standard

Contoh

```

Kurikulum Merdeka

↓

Version 2025

```

---

# 5. Bloom Taxonomy

Menggunakan Bloom Revised Taxonomy.

| Level | Description |
|--------|-------------|
| C1 | Remember |
| C2 | Understand |
| C3 | Apply |
| C4 | Analyze |
| C5 | Evaluate |
| C6 | Create |

Contoh

```

C1

Menghafal Rumus

↓

C2

Menjelaskan Konsep

↓

C3

Menggunakan Rumus

↓

C4

Analisis Kasus

↓

C5

Evaluasi Solusi

↓

C6

Membuat Strategi Baru

```

---

# 6. HOTS Classification

Menggunakan tiga level.

| Level | Description |
|--------|-------------|
| LOTS | Low Order Thinking Skill |
| MOTS | Middle Order Thinking Skill |
| HOTS | High Order Thinking Skill |

Mapping

```

Bloom

↓

C1 C2

↓

LOTS

------------

C3

↓

MOTS

------------

C4 C5 C6

↓

HOTS

```

---

# 7. Cognitive Taxonomy

Mengukur kompleksitas berpikir.

Level

```

L1

Recognition

L2

Understanding

L3

Application

L4

Reasoning

L5

Complex Problem Solving

```

---

# 8. Difficulty Taxonomy

Difficulty tidak identik dengan HOTS.

Difficulty

| Level | Description |
|--------|-------------|
| Easy | Mudah |
| Medium | Sedang |
| Hard | Sulit |

Difficulty dihitung berdasarkan:

- panjang soal
- kompleksitas konsep
- statistik penggunaan
- AI Prediction
- IRT (future)

---

# 9. Question Type Taxonomy

MVP

```

Single Choice

```

Future

```

Multiple Choice

Essay

Matching

True False

Drag Drop

Fill Blank

Ordering

Coding

Simulation

Interactive

```

---

# 10. Assessment Taxonomy

Question dapat digunakan untuk berbagai jenis asesmen.

Contoh

```

Daily Practice

Quiz

Exercise

Homework

Try Out

UTBK

Mid Test

Final Test

Placement Test

Diagnostic Test

Adaptive Test

```

---

# 11. Competency Taxonomy

Mengacu pada capaian pembelajaran.

Field

- Competency
- Learning Outcome
- Indicator
- Assessment Indicator

---

# 12. Literacy Classification

Untuk soal literasi.

Jenis

```

Reading Literacy

Scientific Literacy

Digital Literacy

Financial Literacy

Information Literacy

```

---

# 13. Numeracy Classification

Untuk soal numerasi.

Kategori

```

Arithmetic

Algebra

Geometry

Statistics

Probability

Measurement

```

---

# 14. Content Taxonomy

Jenis konten.

```

Text

Image

Graph

Table

Formula

Audio

Video

Animation

Interactive

```

---

# 15. Source Taxonomy

Asal soal.

```

Official

School

Teacher

Book

Government

Publisher

AI Generated

Manual

Community

```

---

# 16. Language Taxonomy

```

Bahasa Indonesia

English

Bilingual

```

Future

```

Arabic

Japanese

Chinese

```

---

# 17. Skill Taxonomy

Skill yang diukur.

Contoh

```

Calculation

Reasoning

Critical Thinking

Problem Solving

Interpretation

Analysis

Communication

Observation

```

---

# 18. AI Classification

AI memberikan klasifikasi tambahan.

Contoh

```

Predicted Difficulty

Predicted Bloom

Predicted HOTS

Embedding Cluster

Topic Cluster

Semantic Group

Duplicate Group

```

---

# 19. Analytics Classification

Analytics menggunakan taxonomy.

Contoh

```

Correct Rate

↓

Subject

↓

Difficulty

↓

Bloom

↓

Chapter

```

---

# 20. Randomization Classification

Random Engine menggunakan taxonomy.

Filter

```

Subject

Grade

Difficulty

Bloom

Chapter

Tag

Question Type

```

---

# 21. Search Classification

Search menggunakan taxonomy.

Contoh

```

Matematika

AND

Integral

AND

HOTS

AND

Hard

```

---

# 22. Recommendation Classification

Recommendation Engine menggunakan taxonomy.

Input

```

Student Weakness

↓

Chapter

↓

Difficulty

↓

Bloom

↓

Recommendation

```

---

# 23. Knowledge Graph Classification

Future AI.

Node

```

Concept

↓

Topic

↓

Question

↓

Explanation

↓

Material

```

Question menjadi salah satu node pada Knowledge Graph.

---

# 24. Database Mapping

Taxonomy direpresentasikan melalui foreign key.

```

curriculum_id

education_level_id

grade_id

semester_id

subject_id

chapter_id

subchapter_id

topic_id

learning_objective_id

difficulty_id

bloom_level_id

hots_level_id

question_type_id

language_id

```

Seluruh lookup table dikelola secara terpusat.

---

# 25. Validation Rules

Question Published wajib memiliki:

✓ Subject

✓ Chapter

✓ Difficulty

✓ Bloom Level

✓ Question Type

✓ Curriculum

Question tanpa taxonomy tidak boleh dipublish.

---

# 26. Future Taxonomy

Roadmap klasifikasi lanjutan:

- IRT Parameter (a, b, c)
- Cognitive Diagnostic Model (CDM)
- Knowledge Component
- Skill Dependency Graph
- Concept Graph
- Adaptive Learning Category
- Misconception Category
- Learning Style
- Accessibility Category
- Device Compatibility
- AI Quality Score
- Question Reliability
- Exposure Control Level
- Security Classification
- Exam Confidentiality Level

---

# 27. Design Principles

Taxonomy harus memenuhi prinsip berikut:

- Hierarchical
- Fully Normalized
- Extensible
- AI Ready
- Analytics Ready
- Search Friendly
- Recommendation Friendly
- Curriculum Driven
- Version Aware
- Backward Compatible
````

---

## Catatan Arsitektur

Dokumen ini menjadi acuan bagi beberapa modul berikut:

* **07_question_review_workflow.md** menggunakan taxonomy untuk menentukan reviewer yang sesuai (misalnya reviewer Matematika SMA atau reviewer HOTS).
* **09_question_randomization.md** menggunakan taxonomy sebagai dasar filter distribusi soal.
* **10_question_selection_algorithm.md** menggunakan taxonomy untuk memastikan komposisi ujian (misalnya 30% C1–C2, 40% C3–C4, 30% C5–C6, atau distribusi Easy/Medium/Hard tertentu).
* **14_ai_question_generation.md** menggunakan taxonomy sebagai parameter input dan target output agar AI menghasilkan soal yang sesuai kurikulum, kompetensi, dan tingkat kognitif.

Dengan demikian, taxonomy menjadi fondasi klasifikasi yang konsisten di seluruh ekosistem YakinLulus.id.
