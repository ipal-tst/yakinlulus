Saya menyarankan **05_question_metadata.md** menjadi salah satu dokumen paling penting di seluruh spesifikasi backend. Hampir semua modul (CBT, Search, AI, Analytics, Recommendation, Adaptive Learning) akan bergantung pada metadata ini. Karena itu, metadata harus dibuat **terstruktur, ternormalisasi, dan extensible**, bukan sekadar kumpulan kolom.

---

````markdown
# 05_question_metadata.md

# Question Metadata Specification

Version : 1.0

---

# 1. Overview

Metadata adalah sekumpulan informasi terstruktur yang mendeskripsikan sebuah Question.

Metadata **bukan isi soal**, tetapi informasi yang digunakan untuk:

- Classification
- Search
- Filtering
- Randomization
- Analytics
- AI
- Recommendation
- Adaptive Learning
- Reporting

Seluruh metadata disimpan terpisah dari content soal.

---

# 2. Metadata Architecture

```

Question

│

├── Academic Metadata

├── Classification Metadata

├── Difficulty Metadata

├── Source Metadata

├── Usage Metadata

├── AI Metadata

├── Quality Metadata

├── Search Metadata

├── Audit Metadata

└── Custom Metadata

```

---

# 3. Metadata Categories

## 3.1 Academic Metadata

Menentukan posisi soal di dalam struktur akademik.

Field:

| Field | Required | Description |
|---------|----------|-------------|
| curriculum_id | ✓ | Kurikulum |
| education_level_id | ✓ | SD/SMP/SMA |
| grade_id | ✓ | Kelas |
| semester_id | ✓ | Semester |
| subject_id | ✓ | Mata Pelajaran |
| chapter_id | ✓ | Bab |
| subchapter_id | Optional | Sub Bab |
| topic_id | Optional | Topik |
| learning_objective_id | Optional | Tujuan Pembelajaran |

---

## 3.2 Classification Metadata

Mengelompokkan soal berdasarkan karakteristik.

| Field | Description |
|---------|-------------|
| question_type |
| difficulty |
| bloom_level |
| hots_level |
| cognitive_level |
| literacy_type |
| numeracy_type |
| competency |
| skill_category |

---

## 3.3 Source Metadata

Menjelaskan asal soal.

Field

- source_type
- source_name
- organization
- publication_year
- author
- copyright
- license
- original_reference

---

## 3.4 Language Metadata

Field

- language
- locale
- writing_style

Contoh

Bahasa Indonesia

Bahasa Inggris

Bilingual

---

## 3.5 Content Metadata

Berisi karakteristik isi soal.

Field

- text_length
- option_count
- attachment_count
- formula_count
- image_count
- video_count
- graph_count
- table_count

---

## 3.6 Time Metadata

Estimasi pengerjaan.

Field

- estimated_time
- average_time
- minimum_time
- maximum_time

---

## 3.7 Score Metadata

Field

- score_weight
- penalty_score
- bonus_score

---

## 3.8 Usage Metadata

Digunakan Analytics.

Field

- usage_count
- correct_count
- wrong_count
- skip_count
- report_count
- favorite_count

---

## 3.9 Quality Metadata

Field

- review_score
- validation_score
- quality_score
- completeness_score

---

## 3.10 AI Metadata

Field

- embedding_version
- embedding_model
- embedding_dimension
- ai_generated
- ai_model
- ai_confidence
- prompt_version
- duplicate_score

---

## 3.11 Search Metadata

Digunakan Search Engine.

Field

- search_keywords
- normalized_keywords
- search_vector
- embedding_vector
- popularity_score

---

## 3.12 Audit Metadata

Field

- created_by
- created_at
- updated_by
- updated_at
- reviewed_by
- approved_by
- published_at

---

# 4. Required Metadata

Question Published WAJIB memiliki metadata berikut.

✓ Curriculum

✓ Education Level

✓ Grade

✓ Subject

✓ Chapter

✓ Difficulty

✓ Bloom Level

✓ Question Type

✓ Language

✓ Source

---

# 5. Optional Metadata

Metadata berikut bersifat opsional.

- Topic
- Learning Objective
- Competency
- Skill Category
- Estimated Time
- AI Metadata
- Tags
- External Reference

---

# 6. Metadata Normalization

Metadata tidak disimpan sebagai string.

Seluruh metadata menggunakan Foreign Key.

Contoh

```

subject_id

↓

subject table

```

Bukan

```

subject_name = "Matematika"

```

---

# 7. Metadata Validation

Validasi dilakukan ketika:

Create

Update

Import

AI Generate

Publish

---

Validasi meliputi

- FK valid
- enum valid
- mandatory field
- duplicate
- consistency

---

# 8. Metadata Consistency Rules

Question wajib memiliki:

Grade

↓

Subject

↓

Chapter

↓

Subchapter

yang berasal dari kurikulum yang sama.

Tidak boleh lintas kurikulum.

---

# 9. Metadata Inheritance

Import Excel

↓

Template

↓

Default Metadata

↓

Question Metadata

↓

Override bila tersedia.

---

# 10. Metadata Search

Search dapat menggunakan metadata berikut.

- Subject
- Grade
- Difficulty
- Bloom
- Chapter
- Tag
- Source
- AI Generated
- Language
- Year

---

# 11. Metadata Indexing

Metadata berikut wajib di-index.

subject_id

grade_id

difficulty

question_type

status

published_at

chapter_id

curriculum_id

language

---

# 12. Metadata for Randomization

Random Engine menggunakan metadata.

Contoh

```

Subject

Matematika

AND

Difficulty

Medium

AND

Bloom

Analyze

AND

Chapter

Integral

```

---

# 13. Metadata for AI

AI menggunakan metadata untuk:

Generate Question

Generate Distractor

Generate Explanation

Difficulty Prediction

Bloom Prediction

Semantic Search

Recommendation

Knowledge Graph

---

# 14. Metadata for Analytics

Analytics menggunakan metadata.

Contoh

Correct Rate

berdasarkan

Subject

↓

Grade

↓

Difficulty

↓

Chapter

---

# 15. Metadata Lifecycle

Draft

↓

Metadata Incomplete

↓

Validation

↓

Metadata Complete

↓

Published

↓

Locked

---

# 16. Metadata Database Mapping

Metadata tersebar pada beberapa tabel.

```

question_metadata

question_tag_map

question_statistics

question_embedding

question_source

question_review

```

---

# 17. Metadata Versioning

Perubahan metadata menghasilkan Version baru apabila mempengaruhi:

- Difficulty
- Subject
- Chapter
- Question Type
- Bloom Level
- Answer
- Explanation

Metadata administratif (misalnya tag internal atau catatan editor) tidak selalu memerlukan version baru.

---

# 18. Extensibility

Metadata dirancang agar dapat ditambah tanpa mengubah struktur Question.

Contoh

```

question_metadata

metadata_key

metadata_value

```

atau

```

question_custom_metadata

```

untuk kebutuhan plugin atau fitur masa depan.

---

# 19. Future Metadata

Disiapkan untuk:

- IRT Difficulty
- Discrimination Index
- Guessing Parameter
- Knowledge Component
- Learning Path
- Competency Standard
- AI Difficulty Score
- AI Readability Score
- Reading Time
- Device Compatibility
- Accessibility Metadata
- Audio Support
- Video Support
- Formula Complexity
- Cognitive Load Score
- Estimated Success Rate
- Adaptive Learning Score

---

# 20. Design Principles

Metadata harus memenuhi prinsip berikut.

- Fully Normalized
- Search Friendly
- AI Ready
- Analytics Ready
- Version Aware
- Extensible
- Immutable after Publish (kecuali metadata administratif)
- Consistent Across Modules
````

## Catatan Arsitektur

Dokumen ini menjadi fondasi untuk beberapa dokumen berikutnya:

* **06_taxonomy_classification.md** → mendefinisikan struktur klasifikasi akademik (Bloom, HOTS, Literasi, Numerasi, Kompetensi, dll.) yang mengisi sebagian besar metadata.
* **11_question_search.md** → memanfaatkan metadata untuk filtering, indexing, full-text search, dan semantic search (`pgvector`).
* **23_database_strategy.md** → menjelaskan pemetaan metadata ke tabel, foreign key, indeks PostgreSQL, dan strategi partisi bila diperlukan.

Dengan pemisahan ini, metadata tetap konsisten, mudah diindeks, dan siap mendukung AI maupun CBT berskala besar.
