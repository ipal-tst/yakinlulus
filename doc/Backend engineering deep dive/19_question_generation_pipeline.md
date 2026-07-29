# 19_question_generation_pipeline.md

# YakinLulus.id AI Question Generation Pipeline

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **AI Question Generation Pipeline** yang menjadi salah satu core engine YakinLulus.id.

Pipeline ini bertujuan mengotomatisasi proses pembuatan bank soal berkualitas tinggi berdasarkan:

* Soal resmi Kemendikdasmen
* Soal sekolah
* Soal tryout
* Dataset internal
* Blueprint kurikulum
* Standar kompetensi
* Learning Outcome

Pipeline tidak hanya menghasilkan soal baru, tetapi juga melakukan validasi, klasifikasi, quality assurance, dan publishing workflow.

---

# 2. Vision

Target jangka panjang:

> Membangun **AI Assisted Question Factory**, yaitu sistem yang mampu menghasilkan jutaan soal berkualitas tinggi secara konsisten dengan campur tangan manusia seminimal mungkin tanpa mengorbankan kualitas akademik.

---

# 3. Objectives

Pipeline dirancang untuk:

* Mengotomatisasi pembuatan soal.
* Menjaga kualitas soal.
* Mengurangi pekerjaan editor.
* Memastikan kesesuaian kurikulum.
* Menghindari soal duplikat.
* Menghasilkan penjelasan yang berkualitas.
* Mendukung continuous improvement.

---

# 4. High Level Architecture

```text id="z9w2kp"
Official Dataset

↓

Import Pipeline

↓

OCR (Optional)

↓

Parser

↓

Question Analyzer

↓

Metadata Extraction

↓

Knowledge Repository

↓

Blueprint Generator

↓

AI Question Generator

↓

AI Validator

↓

Similarity Detection

↓

Human Review

↓

Publishing

↓

Question Bank
```

---

# 5. Pipeline Overview

Pipeline terdiri dari 11 tahap utama:

1. Dataset Import
2. Parsing
3. Question Analysis
4. Metadata Extraction
5. Blueprint Generation
6. AI Question Generation
7. Validation
8. Similarity Detection
9. Human Review
10. Publishing
11. Continuous Learning

---

# 6. Stage 1 — Dataset Import

Sumber data:

* Excel
* PDF
* DOCX
* Scan Image
* Manual Input
* API (Future)

Import menghasilkan **Raw Question Dataset**.

---

# 7. Stage 2 — OCR

Jika sumber berupa scan:

```text id="x7n4bj"
Image

↓

OCR

↓

Raw Text
```

Rekomendasi:

* PaddleOCR
* Tesseract
* Google Vision API (opsional)

OCR menghasilkan teks yang siap diproses parser.

---

# 8. Stage 3 — Parser

Parser mengekstrak:

* Pertanyaan
* Pilihan Jawaban
* Jawaban Benar
* Penjelasan (jika tersedia)
* Gambar
* Tabel
* Rumus
* Diagram

Output berupa struktur JSON yang seragam.

---

# 9. Stage 4 — Question Analysis

AI menganalisis karakteristik soal:

* Gaya bahasa
* Tingkat kompleksitas
* Pola penyusunan
* Distractor quality
* Jenis penalaran
* Kompetensi yang diuji

Analisis ini menjadi dasar pembuatan soal baru.

---

# 10. Stage 5 — Metadata Extraction

Metadata yang dihasilkan:

* Jenjang
* Kelas
* Mata Pelajaran
* Kurikulum
* Bab
* Sub Bab
* Kompetensi
* Bloom Level
* Difficulty
* Tags
* Estimated Time

Seluruh metadata dapat dikoreksi oleh editor.

---

# 11. Stage 6 — Knowledge Repository

Semua hasil analisis disimpan pada repository pengetahuan.

Isi repository:

* Pola soal
* Template soal
* Distractor pattern
* Difficulty profile
* Topic profile
* Prompt context

Repository ini menjadi sumber utama AI saat menghasilkan soal baru.

---

# 12. Stage 7 — Blueprint Generation

Blueprint menentukan karakteristik soal yang akan dibuat.

Contoh:

```text id="q2m7ra"
Subject:
Mathematics

Grade:
12

Topic:
Integral

Difficulty:
Hard

Bloom:
Analyze

Question Type:
Multiple Choice

Number:
100
```

Blueprint memastikan AI menghasilkan soal sesuai kebutuhan.

---

# 13. Stage 8 — Prompt Builder

Prompt dibangun dari:

```text id="g6p1wh"
Blueprint

+

Reference Pattern

+

Curriculum

+

Question Rules

↓

Prompt
```

Prompt menggunakan template versioning.

---

# 14. Stage 9 — AI Question Generation

AI menghasilkan:

* Question
* Options A–E
* Correct Answer
* Explanation
* Learning Objective
* Difficulty
* Bloom Level
* Tags

Output wajib menggunakan JSON Schema.

---

# 15. Stage 10 — Structural Validation

Validator memeriksa:

* JSON Valid
* Semua opsi tersedia
* Jawaban benar valid
* Tidak ada opsi kosong
* Tidak ada format rusak
* Panjang teks sesuai batas

Output yang gagal tidak diteruskan.

---

# 16. Stage 11 — Academic Validation

Validator memeriksa:

* Konsistensi jawaban.
* Ketepatan konsep.
* Kesesuaian kurikulum.
* Tidak ambigu.
* Tidak bias.
* Bahasa baku.

Tahap ini dapat menggabungkan rule-based validation dan AI validation.

---

# 17. Stage 12 — Similarity Detection

Tujuan:

Menghindari soal duplikat.

Strategi:

* Exact Match
* Text Similarity
* Embedding Similarity (Future)

Threshold contoh:

```text id="j5k8ye"
Similarity > 90%

↓

Reject
```

---

# 18. Stage 13 — Explanation Validation

AI memastikan:

* Penjelasan sesuai jawaban.
* Langkah penyelesaian logis.
* Tidak bertentangan dengan materi.
* Mudah dipahami siswa.

---

# 19. Stage 14 — Difficulty Verification

Difficulty hasil AI diverifikasi.

Kategori:

* Easy
* Medium
* Hard

Future:

Difficulty dapat disesuaikan berdasarkan performa nyata siswa (IRT/Adaptive Learning).

---

# 20. Stage 15 — Human Review

Workflow:

```text id="c8v3td"
Draft

↓

Teacher

↓

Revision

↓

Approve

↓

Publish
```

Editor dapat:

* Mengubah soal.
* Mengubah jawaban.
* Mengubah penjelasan.
* Mengubah metadata.

---

# 21. Stage 16 — Publishing

Status:

```text id="n1x7ps"
Draft

↓

Approved

↓

Published

↓

Archived
```

Hanya soal **Published** yang dapat digunakan pada CBT.

---

# 22. Stage 17 — Feedback Collection

Data dikumpulkan dari CBT:

* Correct Rate
* Average Time
* Skip Rate
* Distractor Selection
* Student Feedback

Data ini digunakan untuk meningkatkan kualitas soal.

---

# 23. Stage 18 — Continuous Learning

Pipeline belajar dari:

* Performa siswa.
* Koreksi guru.
* Feedback editor.
* Statistik CBT.

Hasil analisis digunakan untuk memperbaiki prompt dan blueprint.

---

# 24. AI Generated Assets

Selain soal, AI menghasilkan:

* Explanation
* Hint
* Learning Tips
* Keywords
* Tags
* Related Material
* Similar Questions

---

# 25. Human-in-the-Loop

Semua hasil AI mengikuti prinsip:

```text id="b7r4mq"
AI Generate

↓

Human Verify

↓

Publish
```

Human tetap menjadi otoritas akhir.

---

# 26. Workflow Detail

```text id="d4w8kh"
Dataset

↓

Parser

↓

Analyzer

↓

Knowledge Repository

↓

Blueprint

↓

Prompt Builder

↓

LLM

↓

Validation

↓

Similarity

↓

Teacher Review

↓

Publish

↓

Question Bank
```

---

# 27. Queue Architecture

Pipeline menggunakan Background Job.

Queue:

```text id="m9n2af"
import

analysis

generation

validation

review

publish
```

Setiap tahap dapat diskalakan secara independen.

---

# 28. Error Handling

Jika salah satu tahap gagal:

```text id="r6k1pv"
Retry

↓

Failed Queue

↓

Manual Review
```

Tidak ada data yang dipublikasikan jika pipeline belum selesai.

---

# 29. Audit Trail

Setiap tahap mencatat:

* Dataset ID
* Prompt Version
* AI Model
* Reviewer
* Validation Result
* Publish Time

Audit mendukung pelacakan penuh terhadap asal-usul soal.

---

# 30. Security

Dataset sumber:

* Private
* Tidak dapat diunduh sembarangan.
* Dilindungi RBAC.
* Dicatat setiap aksesnya.

Prompt dan output AI mengikuti kebijakan keamanan data.

---

# 31. Performance Targets

Target MVP:

| Stage               | Target         |
| ------------------- | -------------- |
| Parsing             | < 2 detik/soal |
| Metadata Extraction | < 3 detik      |
| AI Generation       | < 30 detik     |
| Validation          | < 2 detik      |
| Similarity Check    | < 1 detik      |

Target dapat berubah sesuai model AI dan ukuran dataset.

---

# 32. Quality Metrics

Pipeline dievaluasi menggunakan:

* Approval Rate
* Duplicate Rate
* Validation Pass Rate
* Average Review Time
* AI Acceptance Rate
* Student Correct Rate
* Distractor Effectiveness

---

# 33. Integration

Pipeline terintegrasi dengan:

* Import Service
* AI Service
* Background Job
* Storage Service
* Search Service
* Question Bank
* Audit Service
* Notification Service

Seluruh komunikasi menggunakan Service Layer dan event asynchronous.

---

# 34. Scalability

Setiap tahap dapat dipisahkan menjadi microservice di masa depan.

```text id="t5q9vx"
Import

Analysis

Generation

Validation

Publishing
```

Namun pada MVP seluruh pipeline tetap berada dalam **Modular Monolith**.

---

# 35. Future Enhancements

Roadmap:

* Multi-Agent AI.
* RAG berbasis dokumen kurikulum.
* Automatic Distractor Optimization.
* Automatic Bloom Classification.
* Automatic Difficulty Calibration.
* IRT Integration.
* Adaptive Question Generation.
* Multimodal Question Generation (gambar, grafik, audio).

---

# 36. Anti-Patterns

Tidak diperbolehkan:

* Publikasi langsung hasil AI.
* Prompt tanpa versioning.
* Menggunakan dataset tanpa metadata.
* Mengabaikan similarity detection.
* Menyimpan hasil AI tanpa audit.
* Menggabungkan parsing dan business logic.
* Menghasilkan soal tanpa blueprint.

---

# 37. Pipeline Checklist

Sebelum implementasi:

* Dataset tervalidasi.
* Parser tersedia.
* OCR (opsional) tersedia.
* Knowledge Repository tersedia.
* Blueprint Generator tersedia.
* Prompt Versioning aktif.
* AI Validation aktif.
* Similarity Detection aktif.
* Human Review tersedia.
* Audit Trail lengkap.
* Unit & integration test tersedia.

---

# 38. Alignment dengan Roadmap YakinLulus.id

Pipeline ini merupakan fondasi utama untuk roadmap platform:

**Phase 1 (MVP)**

* AI Question Generation
* AI Explanation
* Human Review
* Question Bank Automation

**Phase 2**

* AI Recommendation
* Adaptive Difficulty
* Intelligent Blueprint

**Phase 3**

* RAG berbasis dokumen kurikulum
* Multi-Agent Question Factory
* Self-Improving Question Pipeline
* Adaptive Learning Engine

---

# 39. Relationship dengan AI Service

Pipeline ini merupakan **consumer** dari AI Service Architecture.

Hubungan antar dokumen:

```text id="y8j4sl"
AI Service Architecture

↓

Question Generation Pipeline

↓

Question Bank

↓

CBT Engine
```

Dengan pemisahan ini, AI Service dapat digunakan kembali untuk fitur lain seperti AI Tutor, AI Essay Evaluation, atau AI Recommendation.

---

# 40. Summary

AI Question Generation Pipeline merupakan salah satu komponen strategis YakinLulus.id yang mengotomatisasi proses pembangunan Bank Soal menggunakan kombinasi **rule-based processing**, **LLM**, **validation engine**, **similarity detection**, dan **human review**.

Arsitektur ini memberikan:

* Otomatisasi pembuatan soal dalam skala besar.
* Kualitas akademik yang terjaga melalui validasi berlapis.
* Skalabilitas melalui queue dan worker asynchronous.
* Audit penuh terhadap seluruh proses.
* Fondasi kuat untuk roadmap AI jangka panjang seperti RAG, adaptive learning, dan AI Question Factory.
