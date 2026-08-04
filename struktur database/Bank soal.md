Saya menyarankan agar **Bank Soal** tidak hanya dipandang sebagai sekumpulan tabel penyimpan soal, tetapi sebagai **Question Domain** yang lengkap. Domain ini akan menjadi inti dari CBT Engine, AI Tutor, Learning Analytics, Adaptive Testing, dan sistem authoring soal.

Berdasarkan seluruh arsitektur yang sudah kita susun untuk **YakinLulus.id** (Master Akademik, User & RBAC, Asset Management), saya merekomendasikan memisahkan domain ini menjadi beberapa subdomain agar tetap memenuhi prinsip **DDD (Domain Driven Design)**, **3NF/BCNF**, dan mudah dikembangkan.

---

# 1. Struktur Domain Bank Soal

```text
Question Domain
│
├── Question Core
│   ├── Question
│   ├── Question Version
│   ├── Question Metadata
│   ├── Question Status
│   └── Question History
│
├── Question Content
│   ├── Question Block
│   ├── Option
│   ├── Option Block
│   ├── Explanation
│   ├── Explanation Block
│   ├── Hint
│   └── Solution Step
│
├── Question Classification
│   ├── Subject Mapping
│   ├── Topic Mapping
│   ├── Chapter Mapping
│   ├── Competency Mapping
│   ├── Skill Mapping
│   ├── Tag Mapping
│   └── Curriculum Mapping
│
├── Question Validation
│   ├── Review
│   ├── Approval
│   ├── Validation Issue
│   └── Duplicate Detection
│
├── Question Usage
│   ├── Exam Mapping
│   ├── Practice Mapping
│   ├── Package Mapping
│   └── AI Usage
│
├── Question Statistics
│   ├── Statistic
│   ├── Difficulty
│   ├── IRT
│   ├── Usage Counter
│   └── Answer Distribution
│
└── Question Import
    ├── Import Job
    ├── Import Row
    ├── OCR Result
    └── AI Parsing Result
```

Total sekitar **45–60 tabel**.

---

# 2. Question Core
Arsitektur
Question

↓

Question Block

↓

Block Type

↓

Asset

Misalnya

Question

↓

Block 1

Paragraph

↓

"Sebuah kubus..."

↓

Block 2

Image

↓

gambar kubus

↓

Block 3

Paragraph

↓

"Tentukan..."

↓

Block 4

Formula

↓

LaTeX

↓

Block 5

Table

↓

JSON

↓

Block 6

Paragraph

↓

"Jawaban yang benar..."


Jumlah block bebas.
## question

Hanya menyimpan identitas soal.

```text
question
---------
id (UUIDv7)
question_code
question_type_id
current_version_id

status_id

owner_id

created_by
updated_by

created_at
updated_at
deleted_at
```

Tidak ada teks soal di tabel ini.

---

## question_version

Versioning.

```text
question_version

id

question_id

version_no

change_summary

created_by

created_at

is_current
```

---

## question_metadata

```text
question_metadata

id

question_id

estimated_time

difficulty_level

blooms_level

cognitive_level

language

source_type

source_name

publication_year

reference_code

is_hots

is_calculator_allowed

is_randomizable
```

---

## question_status

Master.

```text
question_status

id

code

DRAFT

REVIEW

REVISION

APPROVED

PUBLISHED

ARCHIVED
```

---

## question_history

Audit.

```text
question_history

id

question_id

action

changed_by

old_json

new_json

created_at
```

---

# 3. Question Content

## question_block

Konten soal.

```text
question_block

id

question_version_id

block_order

block_type

content

asset_id

style_json
```

Block Type

```
PARAGRAPH

IMAGE

TABLE

LATEX

SVG

AUDIO

VIDEO

GRAPH

CODE

HTML

MARKDOWN
```

---

## question_option

```text
question_option

id

question_version_id

label

A

B

C

D

E

score

is_correct

display_order
```

---

## option_block

```text
option_block

id

option_id

block_order

block_type

content

asset_id

style_json
```

---

## explanation

```text
explanation

id

question_version_id
```

---

## explanation_block

```text
explanation_block

id

explanation_id

block_order

block_type

content

asset_id
```

---

## hint

```text
hint

id

question_version_id

hint_order

content
```

---

## solution_step

Untuk pembahasan langkah demi langkah.

```text
solution_step

id

question_version_id

step_no

title

content

asset_id
```

---

# 4. Klasifikasi Soal

Karena satu soal bisa digunakan pada banyak kurikulum, paket, atau topik, **jangan menyimpan FK langsung di tabel `question`**. Gunakan tabel pemetaan (*mapping tables*).

## question_subject

```text
question_subject

question_id

subject_id
```

---

## question_grade

```text
question_grade

question_id

grade_id
```

---

## question_major

```text
question_major

question_id

major_id
```

---

## question_curriculum

```text
question_curriculum

question_id

curriculum_id
```

---

## question_chapter

```text
question_chapter

question_id

chapter_id
```

---

## question_subchapter

```text
question_subchapter

question_id

subchapter_id
```

---

## question_topic

```text
question_topic

question_id

topic_id
```

---

## question_competency

```text
question_competency

question_id

competency_id
```

---

## question_skill

```text
question_skill

question_id

skill_id
```

---

## question_tag

```text
question_tag

question_id

tag_id
```

---

# 5. Review Workflow

## question_review

```text
question_review

id

question_id

reviewer_id

status

comment

reviewed_at
```

---

## question_approval

```text
question_approval

id

question_id

approved_by

approved_at

approval_note
```

---

## question_validation_issue

```text
question_validation_issue

id

question_id

issue_type

severity

description

resolved
```

---

## question_duplicate

```text
question_duplicate

id

question_id

duplicate_question_id

similarity_score
```

---

# 6. Penggunaan Soal

## question_exam

```text
question_exam

question_id

exam_id
```

---

## question_practice

```text
question_practice

question_id

practice_set_id
```

---

## question_learning_material

```text
question_learning_material

question_id

material_id
```

---

## question_ai_usage

```text
question_ai_usage

id

question_id

ai_model

generated_at
```

---

# 7. Statistik

## question_statistics

```text
question_statistics

question_id

total_answer

correct

wrong

skip

accuracy
```

---

## question_irt

```text
question_irt

question_id

parameter_a

parameter_b

parameter_c
```

---

## question_answer_distribution

```text
question_answer_distribution

question_id

option_label

selected_count
```

---

## question_usage_counter

```text
question_usage_counter

question_id

exam_count

practice_count

favorite_count

report_count
```

---

# 8. Import & AI

## question_import_job

```text
question_import_job

id

file_id

status

started_at

finished_at
```

---

## question_import_row

```text
question_import_row

id

job_id

row_no

status

error_message
```

---

## question_ocr_result

```text
question_ocr_result

id

asset_id

ocr_json
```

---

## question_ai_parsing

```text
question_ai_parsing

id

asset_id

model_name

result_json

confidence
```

---

# 9. Relasi Besar

```text
Question
│
├── Question Version
│      │
│      ├── Question Block
│      │        └── Asset
│      │
│      ├── Option
│      │      └── Option Block
│      │             └── Asset
│      │
│      ├── Explanation
│      │      └── Explanation Block
│      │
│      ├── Hint
│      └── Solution Step
│
├── Metadata
├── Status
├── History
│
├── Subject Mapping
├── Grade Mapping
├── Major Mapping
├── Curriculum Mapping
├── Chapter Mapping
├── Topic Mapping
├── Competency Mapping
├── Skill Mapping
├── Tag Mapping
│
├── Review
├── Approval
├── Validation Issue
├── Duplicate
│
├── Exam Mapping
├── Practice Mapping
├── Learning Material Mapping
│
├── Statistics
├── IRT
├── Usage Counter
└── Answer Distribution
```

# 10. Alur Siklus Hidup Soal

```text
Import PDF / DOC / Image
          │
          ▼
OCR / AI Parsing
          │
          ▼
Question (Draft)
          │
          ▼
Question Version
          │
          ▼
Question Block
          │
          ▼
Option + Option Block
          │
          ▼
Review
          │
          ▼
Approval
          │
          ▼
Published
          │
          ▼
Digunakan oleh:
  • CBT
  • Latihan
  • AI Tutor
  • Tryout
          │
          ▼
Statistik & IRT diperbarui
```

# Rekomendasi Arsitektur untuk YakinLulus.id

Saya menyarankan beberapa prinsip implementasi agar domain ini tetap sederhana digunakan tetapi sangat fleksibel:

1. **Pisahkan metadata dan konten soal.** Tabel `question` hanya menyimpan identitas, sedangkan isi soal berada pada `question_block`.
2. **Gunakan arsitektur content block** untuk soal, opsi jawaban, dan pembahasan. Dengan demikian editor dapat mendukung teks, gambar, tabel, rumus, audio, video, SVG, dan jenis blok lain tanpa perubahan skema.
3. **Seluruh media direferensikan ke Domain Asset Management** melalui `asset_id`, bukan menyimpan URL langsung di konten.
4. **Gunakan tabel pemetaan** (`question_subject`, `question_topic`, `question_curriculum`, dan seterusnya) agar satu soal dapat digunakan pada beberapa kurikulum atau klasifikasi tanpa duplikasi data.
5. **Sediakan versioning, review, approval, dan audit trail** sehingga perubahan soal dapat dilacak dan dipulihkan.
6. **Pisahkan statistik operasional** (jumlah digunakan, distribusi jawaban, parameter IRT) dari data authoring agar proses ujian tetap cepat.
7. **Rancang sejak awal agar kompatibel dengan AI**, baik untuk OCR, parsing dokumen, rekomendasi soal, adaptive testing, maupun analitik pembelajaran.

Dengan struktur tersebut, Bank Soal YakinLulus.id dapat menjadi fondasi yang stabil untuk skala ratusan ribu soal dan jutaan respons siswa, tanpa perlu melakukan perubahan skema besar ketika fitur-fitur lanjutan ditambahkan.
