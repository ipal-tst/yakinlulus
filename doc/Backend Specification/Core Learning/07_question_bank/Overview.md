Struktur tersebut sangat tepat. Dengan ruang lingkup YakinLulus.id yang sudah kita definisikan (PRD, Domain Modeling, Database Architecture, Backend Architecture, Backend Specification, AI Pipeline, CBT Engine, Analytics), modul **Question Bank** memang layak menjadi salah satu bounded context terbesar setelah Authentication.

Saya menyarankan seluruh dokumen dibuat sebagai **Database Specification + Technical Design**, bukan sekadar penjelasan database. Artinya setiap file harus menjadi acuan backend, AI, frontend, QA, dan DevOps.

---

# 07_question_bank

## 00_overview.md

# Question Bank Module

Version : 1.0

---

# 1. Purpose

Question Bank merupakan pusat penyimpanan seluruh aset soal yang digunakan oleh seluruh sistem YakinLulus.

Semua fitur berikut bergantung pada modul ini.

* CBT
* Try Out
* Daily Practice
* AI Learning
* Adaptive Learning
* Material Recommendation
* Analytics
* AI Question Generator

Question Bank tidak hanya menyimpan soal, tetapi juga seluruh metadata akademik, histori perubahan, review workflow, embedding AI, serta relasi terhadap kurikulum nasional.

---

# 2. Scope

Module ini mencakup:

* Question Repository
* Question Metadata
* Curriculum Mapping
* Subject Mapping
* Chapter Mapping
* Difficulty Management
* Cognitive Level
* Bloom Taxonomy
* HOTS Classification
* AI Embedding
* Similar Question Detection
* Review Workflow
* Versioning
* Import Export
* Search Engine
* Randomization Engine

---

# 3. High Level Architecture

```
                    +----------------+
                    | AI Generator   |
                    +--------+-------+
                             |
                             |
                     Generate Question
                             |
                             V

+-----------------------------------------------------------+
|                   QUESTION BANK                           |
|-----------------------------------------------------------|
| Question Repository                                       |
| Metadata                                                  |
| Classification                                            |
| Versioning                                                |
| Review                                                    |
| Search                                                    |
| AI Embedding                                              |
| Similarity                                                |
+----------------------+------------------------------------+
                       |
                       |
        +--------------+--------------+
        |                             |
        V                             V

 CBT Engine                    Learning Module

```

---

# 4. Main Responsibilities

Question Bank bertanggung jawab terhadap:

* menyimpan soal
* menjaga kualitas soal
* menyediakan pencarian
* menyediakan random selection
* menyediakan AI indexing
* menyediakan version history
* menyediakan approval workflow

---

# 5. Core Principles

Single Source of Truth

Immutable Version

Review Before Publish

AI Assisted

Curriculum Driven

Metadata Rich

Search Optimized

---

# 6. Main Entities

```
Question

Question Version

Question Option

Question Explanation

Question Tag

Question Attachment

Question Review

Question Review History

Question Embedding

Question Similarity

Question Source

Question Import Job

Question Export Job

Question Validation

Question Statistics
```

---

# 7. Dependencies

Question Bank membutuhkan module:

```
Authentication

Academic

Media

AI

Analytics

Notification

Audit Log
```

---

# 8. External Consumers

```
CBT Runtime

Material Module

Practice Module

Recommendation Engine

AI Tutor

Dashboard

Reporting
```

---

# 9. Database Tables

Secara garis besar akan menggunakan tabel:

```
question

question_version

question_option

question_attachment

question_review

question_review_history

question_tag

question_tag_map

question_embedding

question_similarity

question_source

question_import_job

question_import_row

question_export_job

question_validation

question_statistics

question_usage

question_history
```

---

# 10. AI Components

Question Bank menggunakan AI untuk:

* Duplicate Detection

* Similar Question Search

* Auto Difficulty Prediction

* Bloom Taxonomy Prediction

* HOTS Prediction

* Metadata Recommendation

* Explanation Generation

* Distractor Generation

* Embedding

* Semantic Search

---

# 11. Integration

```
Excel Import

PDF Import

Image OCR

LLM

Embedding Model

Object Storage

PostgreSQL

pgvector

Redis

RabbitMQ
```

---

# 12. Folder Structure

```
Question Service

Repository

Validator

Search

Randomizer

Embedding

Generator

Importer

Exporter

Reviewer

Statistics

API
```

---

## Selanjutnya

Saya menyarankan urutan pengerjaan berikut agar seluruh spesifikasi konsisten dengan arsitektur yang sudah kita buat:

1. **00_overview.md** ✅
2. **01_domain_model.md** (aggregate, bounded context, entity, value object, domain service)
3. **02_business_rules.md**
4. **03_question_structure.md**
5. **04_question_lifecycle.md**
6. **05_question_metadata.md**
7. **06_taxonomy_classification.md**
8. **07_question_review_workflow.md**
9. **08_question_versioning.md**
10. **09_question_randomization.md**
11. **10_question_selection_algorithm.md**
12. **11_question_search.md**
13. **12_question_import.md**
14. **13_question_export.md**
15. **14_ai_question_generation.md**
16. **15_validation_strategy.md**
17. **16_service_layer.md**
18. **17_repository_layer.md**
19. **18_api_summary.md**
20. **19_transaction_flow.md**
21. **20_event_architecture.md**
22. **21_background_jobs.md**
23. **22_cache_strategy.md**
24. **23_database_strategy.md**
25. **24_pgvector_strategy.md**
26. **25_file_storage.md**
27. **26_security.md**
28. **27_audit_log.md**
29. **28_error_catalog.md**
30. **29_sequence_diagram.md**
31. **30_state_machine.md**
32. **31_performance.md**
33. **32_testing.md**
34. **33_acceptance_criteria.md**
35. **34_future_roadmap.md**

Dengan mengikuti urutan tersebut, setiap dokumen akan dibangun di atas fondasi dokumen sebelumnya sehingga hasil akhirnya menjadi spesifikasi teknis yang konsisten dan siap dijadikan acuan implementasi backend Go, PostgreSQL + pgvector, AI pipeline, serta CBT Engine.
