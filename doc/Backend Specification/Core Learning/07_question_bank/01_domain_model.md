Berikut adalah isi **`07_question_bank/01_domain_model.md`**. Dokumen ini mengacu pada PRD, Domain Modeling, ERD, LDM, Database Architecture, dan Backend Architecture yang telah dibuat sebelumnya, serta menggunakan pendekatan **DDD (Domain-Driven Design)** agar siap diimplementasikan pada backend Go.

---

````markdown
# 01_domain_model.md

# Question Bank Domain Model

Version : 1.0

---

# 1. Overview

Question Bank merupakan bounded context yang bertanggung jawab terhadap seluruh siklus hidup (lifecycle) soal, mulai dari pembuatan, validasi, review, publikasi, penggunaan, hingga pengarsipan.

Question Bank menjadi **Single Source of Truth** untuk seluruh soal yang digunakan oleh:

- CBT Engine
- Practice Module
- Daily Exercise
- AI Learning
- AI Recommendation
- Analytics
- Future Adaptive Learning

Question Bank tidak bertanggung jawab terhadap pelaksanaan ujian. Modul CBT hanya mengonsumsi soal yang telah dipublikasikan.

---

# 2. Domain Boundary

## Inside Question Bank

- Question Management
- Question Version
- Question Metadata
- Question Classification
- Question Option
- Explanation
- Media Attachment
- Review Workflow
- Approval
- Import
- Export
- Search
- Similarity
- Embedding
- Statistics
- Usage Counter

---

## Outside Question Bank

### Academic Module

- Curriculum
- Subject
- Grade
- Chapter
- Semester

Question hanya melakukan referensi.

---

### User Module

Question tidak menyimpan data user.

Hanya menyimpan reference:

- creator_id
- reviewer_id
- approver_id
- updater_id

---

### CBT Module

Question Bank tidak mengetahui:

- exam
- exam session
- participant
- timer

CBT hanya mengambil soal.

---

### Analytics

Analytics membaca statistik penggunaan soal.

Question Bank tidak menghitung dashboard.

---

### AI Module

Question Bank hanya menyimpan:

- embedding
- ai metadata
- ai confidence

Seluruh proses AI dilakukan pada AI Service.

---

# 3. Aggregate Diagram

```
Question Aggregate

Question
│
├── Question Version
│
├── Options
│
├── Explanation
│
├── Attachments
│
├── Metadata
│
├── Review History
│
├── Tags
│
├── Statistics
│
├── Embedding
│
└── Similarity
```

Question merupakan Aggregate Root.

Semua perubahan dilakukan melalui Aggregate Root.

---

# 4. Aggregate Root

## Question

Question merupakan pusat seluruh operasi.

Contoh:

Create Question

Update Question

Delete Question

Publish Question

Archive Question

Create New Version

Review Question

Approve Question

Reject Question

Generate Embedding

Import Question

Export Question

---

# 5. Entities

## 5.1 Question

Merepresentasikan satu identitas soal.

Memiliki:

- UUID
- Stable Identity
- Current Version
- Status

Question tidak pernah berubah identitas.

---

## 5.2 QuestionVersion

Menyimpan isi soal.

Setiap revisi menghasilkan version baru.

Contoh:

Question

Version 1

↓

Version 2

↓

Version 3

Semua history tetap disimpan.

---

## 5.3 QuestionOption

Pilihan jawaban.

Relasi:

Question Version

↓

1..N

↓

Question Option

---

## 5.4 Explanation

Berisi:

- pembahasan
- langkah penyelesaian
- referensi
- gambar
- video

---

## 5.5 Attachment

Media pendukung.

Jenis:

- image
- audio
- video
- pdf
- svg
- latex
- graph

---

## 5.6 QuestionTag

Tag fleksibel.

Contoh:

Integral

UTBK

HOTS

Aljabar

Numerasi

---

## 5.7 Review

Review akademik.

Status:

Pending

In Review

Revision

Approved

Rejected

---

## 5.8 Embedding

Vector AI.

Digunakan untuk:

Semantic Search

Duplicate Detection

Recommendation

---

## 5.9 Similarity

Relasi antar soal.

Contoh

Question A

92%

mirip

Question B

---

## 5.10 Statistics

Berisi statistik penggunaan.

Misal:

used_count

correct_rate

average_time

difficulty_score

error_rate

---

# 6. Value Objects

Value Object bersifat immutable.

## Difficulty

Enum

Easy

Medium

Hard

---

## BloomLevel

Remember

Understand

Apply

Analyze

Evaluate

Create

---

## CognitiveLevel

L1

L2

L3

L4

---

## HOTSLevel

LOTS

MOTS

HOTS

---

## Language

ID

EN

---

## QuestionType

Single Choice

Future:

Multiple Choice

Essay

True False

Matching

Drag Drop

---

## AnswerKey

Jawaban benar.

Immutable.

---

## ScoreWeight

Bobot soal.

---

## TimeRecommendation

Estimasi waktu pengerjaan.

---

## SourceInformation

Asal soal.

Contoh:

Kemendikbud

Sekolah

Guru

AI Generated

Manual

---

# 7. Domain Services

Domain Service digunakan ketika logic melibatkan banyak entity.

## QuestionValidationService

Memvalidasi:

- option
- answer
- metadata
- attachment

---

## QuestionReviewService

Workflow review.

---

## QuestionVersionService

Versioning.

---

## SimilarityService

Mencari soal mirip.

Menggunakan pgvector.

---

## RandomizationService

Random soal.

---

## SearchService

Full Text Search

Hybrid Search

Semantic Search

---

## ImportService

Excel Import

CSV Import

Bulk Import

---

## ExportService

PDF

Excel

CSV

JSON

---

## EmbeddingService

Menghasilkan vector embedding.

---

## AIQuestionGenerationService

Generate:

- soal
- opsi
- pembahasan
- metadata

---

# 8. Repository

Repository hanya mengakses Aggregate Root.

## QuestionRepository

Method utama:

Create

Update

Delete

FindByID

FindByCode

FindPublished

Search

FindBySubject

FindByChapter

FindByDifficulty

FindRandom

SaveVersion

Publish

Archive

---

# 9. Domain Events

QuestionCreated

QuestionUpdated

QuestionVersionCreated

QuestionPublished

QuestionArchived

QuestionReviewed

QuestionApproved

QuestionRejected

QuestionImported

QuestionExported

QuestionEmbeddingGenerated

QuestionSimilarityUpdated

QuestionDeleted

---

# 10. Invariants

Invariant wajib selalu terpenuhi.

## Identity

Question UUID tidak pernah berubah.

---

## Version

Minimal memiliki satu version.

---

## Answer

Harus memiliki tepat satu jawaban benar (MVP).

---

## Option

Minimal dua opsi.

Maksimal sepuluh opsi.

---

## Explanation

Published Question wajib memiliki pembahasan.

---

## Metadata

Published Question wajib memiliki:

- Subject
- Grade
- Chapter
- Difficulty
- Bloom Level
- Source

---

## Review

Question tidak boleh Published sebelum Approved.

---

## Soft Delete

Question tidak boleh dihapus permanen.

Status menjadi Archived.

---

## Embedding

Embedding harus diperbarui setiap perubahan konten.

---

# 11. Aggregate Consistency Rules

Dalam satu transaksi:

- Question
- Version
- Option
- Explanation

harus selalu konsisten.

Jika salah satu gagal disimpan, seluruh transaksi di-rollback.

---

# 12. Future Extension

Domain dirancang agar dapat mendukung:

- Essay Question
- Coding Question
- Drag and Drop
- Fill Blank
- Matching
- Formula Editor
- Interactive Question
- Adaptive Question
- AI Generated Variant
- Multi Language Question
- Multimedia Question
- Collaborative Review
- Difficulty Auto Calibration
- IRT (Item Response Theory)
- CAT (Computerized Adaptive Testing)
- Knowledge Graph Integration
````

### Catatan Arsitektur

Dokumen ini menetapkan **Question** sebagai **Aggregate Root**, sehingga:

* `QuestionVersion`, `QuestionOption`, `QuestionExplanation`, `QuestionAttachment`, dan `QuestionMetadata` tidak boleh dimodifikasi secara langsung oleh repository lain.
* Seluruh perubahan harus melalui `QuestionService`, sehingga invariant domain selalu terjaga.
* Struktur ini konsisten dengan PostgreSQL, event-driven architecture, serta memudahkan integrasi `pgvector`, AI question generation, dan CBT engine pada fase berikutnya.
