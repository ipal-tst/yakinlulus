Berikut **`07_question_bank/03_question_structure.md`**. Dokumen ini menjadi spesifikasi canonical mengenai struktur data sebuah soal yang akan digunakan oleh Database, Backend, AI Pipeline, CBT Runtime, Import/Export, Search Engine, dan Analytics.

````markdown
# 03_question_structure.md

# Question Structure Specification

Version : 1.0

---

# 1. Overview

Dokumen ini mendefinisikan struktur lengkap sebuah Question di dalam YakinLulus.id.

Question dirancang agar:

- mudah di-versioning
- mudah dicari
- AI Friendly
- CBT Friendly
- mendukung multimedia
- mudah dikembangkan pada versi berikutnya

Question tidak hanya terdiri dari teks soal.

Question merupakan kumpulan beberapa komponen akademik.

---

# 2. Canonical Structure

```
Question
│
├── Identity
├── Version
├── Metadata
├── Content
├── Options
├── Correct Answer
├── Explanation
├── Attachments
├── References
├── Statistics
├── AI Metadata
└── Audit
```

---

# 3. Identity Section

Bagian ini tidak pernah berubah.

| Field | Description |
|--------|-------------|
| question_id | UUID |
| question_code | Human Readable Code |
| current_version | Active Version |
| status | Draft, Published, Archived |
| created_at | Timestamp |
| created_by | User |
| updated_at | Timestamp |
| updated_by | User |

---

# 4. Version Section

Seluruh isi soal berada pada Version.

```
Question

↓

Version 1

↓

Version 2

↓

Version 3
```

Version lama tetap tersimpan.

---

# 5. Metadata Section

Metadata digunakan untuk:

- Search
- Filter
- AI
- Analytics
- Randomization

## Academic Metadata

- Curriculum
- Education Level
- Grade
- Semester
- Subject
- Chapter
- Sub Chapter
- Topic
- Learning Objective

---

## Classification Metadata

- Difficulty
- Bloom Level
- HOTS Level
- Cognitive Level
- Question Type
- Estimated Time
- Score Weight

---

## Source Metadata

- Source Type
- Source Name
- Source Year
- Organization
- License
- Original Reference

---

## AI Metadata

- AI Generated
- AI Confidence
- Embedding Version
- Similarity Score
- AI Model
- Prompt Version

---

# 6. Content Section

Question terdiri dari beberapa bagian.

```
Question Content

├── Title
├── Instruction
├── Story
├── Stem
├── Hint
├── Formula
├── Notes
└── Footer
```

---

## 6.1 Title

Judul internal.

Tidak selalu ditampilkan.

Contoh:

Integral Dasar Nomor 12

---

## 6.2 Instruction

Petunjuk.

Contoh

Pilih jawaban yang paling tepat.

---

## 6.3 Story

Digunakan untuk soal berbasis bacaan.

Contoh:

Artikel

Narasi

Grafik

Kasus

Tabel

Cerita

Story dapat digunakan oleh beberapa Question.

---

## 6.4 Stem

Pertanyaan utama.

Contoh:

Nilai x adalah...

---

## 6.5 Hint

Petunjuk tambahan.

Opsional.

---

## 6.6 Formula

Formula LaTeX.

Contoh

```
x^2+2x+1
```

---

## 6.7 Notes

Catatan internal.

Tidak tampil ke siswa.

---

# 7. Option Structure

Question memiliki beberapa Option.

```
Question

↓

Options

├── A

├── B

├── C

├── D

└── E
```

---

Setiap Option memiliki:

| Field | Description |
|--------|-------------|
| option_id | UUID |
| label | A,B,C,D,E |
| content | Text |
| attachment | Image |
| formula | Latex |
| order | Display Order |
| is_correct | Boolean |

---

# 8. Correct Answer

MVP

Hanya satu jawaban benar.

```
Question

↓

Correct Option

↓

Option C
```

Future

- Multiple Answer
- Essay
- Matching

---

# 9. Explanation Structure

Explanation terdiri dari:

```
Explanation

├── Summary
├── Detail
├── Step by Step
├── Formula
├── Image
├── Video
├── Animation
├── External Link
└── References
```

---

Penjelasan wajib tersedia sebelum Publish.

---

# 10. Attachment Structure

Attachment dapat dimiliki oleh:

- Question
- Story
- Option
- Explanation

---

Jenis Attachment

```
Image

Audio

Video

SVG

PDF

HTML

GIF

LaTeX

Graph

Table
```

---

# 11. Reference Structure

Question dapat memiliki referensi akademik.

Contoh

Kemendikbud

SNBT

OSN

Guru

Buku

Jurnal

Website

AI

---

# 12. Tag Structure

Question dapat memiliki banyak tag.

Contoh

```
Integral

Aljabar

UTBK

SNBT

HOTS

Literasi

Numerasi

Trigonometri

```

---

# 13. Statistics Structure

Disimpan terpisah.

Field utama

```
Used Count

Correct Count

Wrong Count

Skip Count

Average Time

Difficulty Score

Discrimination Index

Favorite Count

Report Count

```

---

# 14. AI Structure

AI menyimpan metadata.

```
Embedding

Model

Confidence

Prompt Version

Generated Time

Similarity

Validation Status
```

---

# 15. Audit Structure

Audit menyimpan

```
Created

Updated

Reviewed

Approved

Rejected

Published

Archived

Restored
```

---

# 16. JSON Representation

Contoh struktur logis.

```json
{
  "question": {
    "identity": {},
    "version": {},
    "metadata": {},
    "content": {},
    "options": [],
    "answer": {},
    "explanation": {},
    "attachments": [],
    "statistics": {},
    "ai": {},
    "audit": {}
  }
}
```

JSON ini merupakan representasi API.

Bukan struktur database.

---

# 17. Database Normalization

Database dipisahkan menjadi beberapa tabel.

```
question

question_version

question_option

question_attachment

question_explanation

question_metadata

question_reference

question_tag

question_tag_map

question_statistics

question_embedding

question_similarity

question_history
```

Semua tabel memenuhi minimal Third Normal Form (3NF).

---

# 18. Design Principles

## Rich Metadata

Question tidak hanya menyimpan teks.

---

## AI Ready

Seluruh struktur mendukung AI Pipeline.

---

## Immutable Version

Isi soal tidak diubah langsung.

---

## Media Independent

Attachment dipisahkan dari Question.

---

## Search Friendly

Metadata dioptimalkan untuk indexing.

---

## CBT Friendly

Question dapat dirender tanpa transformasi kompleks.

---

## Future Ready

Struktur telah dipersiapkan untuk:

- Essay
- Coding
- Formula Evaluation
- Interactive Question
- Audio Question
- Video Question
- Simulation Question
- Adaptive Question
- AI Generated Variant
- Multi Language
- Multi Curriculum
````

## Rekomendasi Penyempurnaan

Melihat target YakinLulus.id yang akan berkembang hingga **UTBK-level CBT + AI Learning Platform**, saya menyarankan pada dokumen berikutnya (**04_question_lifecycle.md**) kita tidak membuat lifecycle sederhana, tetapi lifecycle enterprise seperti berikut:

```text
Draft
   │
   ▼
Pending Validation
   │
   ▼
AI Validation
   │
   ▼
Academic Review
   │
   ├────────► Need Revision
   │               │
   │               ▼
   │            Revised
   │               │
   └───────────────┘
   │
   ▼
Approved
   │
   ▼
Published
   │
   ├────────► Suspended
   │
   ├────────► Archived
   │
   └────────► Deprecated
```

Lifecycle tersebut lebih sesuai dengan platform edutech skala besar dan akan memudahkan implementasi versioning, AI review, audit trail, serta quality assurance.
