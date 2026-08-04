Untuk **YakinLulus.id**, **OCR / Import Engine** merupakan salah satu domain inti yang bertanggung jawab mengubah dokumen **PDF, DOC/DOCX, PPT/PPTX, Excel, CSV, gambar (JPG, PNG, TIFF, WEBP), maupun hasil scan** menjadi data terstruktur yang siap masuk ke **Bank Soal**, **Bank Materi**, maupun domain lainnya.

Engine ini tidak hanya melakukan OCR, tetapi juga mengelola seluruh pipeline:

* Upload File
* File Validation
* OCR
* AI Parsing
* Layout Detection
* Table Detection
* Formula Detection (LaTeX/MathML)
* Image Extraction
* Question Extraction
* Answer Detection
* Explanation Detection
* Metadata Classification
* Human Review
* Approval
* Import Database
* Versioning
* Error Recovery
* Reprocessing

Untuk skala produksi, OCR Engine sebaiknya menggunakan **pipeline asynchronous** berbasis queue agar proses tidak membebani request pengguna.

---

# Database OCR / Import Engine

```text
Schema

ocr
```

---

# 1. import_jobs

Master proses import.

```text
import_jobs
-----------

id (uuid)

job_number

job_name

module

QUESTION_BANK
LEARNING_MATERIAL
USER
ACADEMIC
EXAM
CMS
OTHER

job_type

OCR
IMPORT
OCR_AI
IMPORT_AI
MIGRATION

source_type

PDF
DOCX
PPTX
IMAGE
EXCEL
CSV
ZIP

status

UPLOADED
VALIDATING
PROCESSING
OCR
AI_PARSING
REVIEW
APPROVED
IMPORTING
COMPLETED
FAILED
CANCELLED

priority

LOW
NORMAL
HIGH
URGENT

uploaded_by

assigned_reviewer

started_at

completed_at

created_at

updated_at
```

---

# 2. import_files

File yang diupload.

```text
import_files
------------

id

job_id

original_filename

stored_filename

storage_provider

bucket

path

mime_type

extension

file_size

total_pages

checksum

version

is_encrypted

uploaded_at
```

---

# 3. document_pages

Setiap halaman dokumen.

```text
document_pages
--------------

id

file_id

page_number

image_path

thumbnail_path

width

height

dpi

rotation

language

ocr_status

created_at
```

---

# 4. ocr_engines

Master OCR Engine.

```text
ocr_engines
-----------

id

engine_name

provider

TESSERACT
GOOGLE_VISION
AZURE_VISION
AWS_TEXTRACT
OPENAI
GEMINI

version

supports_table

supports_formula

supports_handwriting

supports_layout

supports_multilanguage

status
```

---

# 5. ocr_results

Hasil OCR.

```text
ocr_results
-----------

id

page_id

engine_id

raw_text

confidence

processing_time_ms

language

rotation_detected

created_at
```

---

# 6. layout_analysis

Analisis layout.

```text
layout_analysis
---------------

id

page_id

layout_json

column_count

header_detected

footer_detected

table_detected

image_detected

formula_detected

created_at
```

---

# 7. extracted_blocks

Blok hasil OCR.

```text
extracted_blocks
----------------

id

page_id

block_type

TEXT
TABLE
IMAGE
FORMULA
HEADER
FOOTER

block_order

bounding_box

content

confidence

created_at
```

---

# 8. extracted_images

Gambar yang berhasil diekstrak.

```text
extracted_images
----------------

id

page_id

image_path

width

height

caption

hash

created_at
```

---

# 9. extracted_tables

Tabel hasil OCR.

```text
extracted_tables
----------------

id

page_id

table_json

row_count

column_count

confidence

created_at
```

---

# 10. extracted_formulas

Formula matematika.

```text
extracted_formulas
------------------

id

page_id

latex

mathml

confidence

created_at
```

---

# 11. ai_parsing_jobs

AI Parsing.

```text
ai_parsing_jobs
---------------

id

job_id

provider

model

prompt_version

status

STARTED
SUCCESS
FAILED

input_token

output_token

cost

duration_ms

created_at
```

---

# 12. parsed_questions

Soal hasil parsing AI.

```text
parsed_questions
----------------

id

job_id

question_number

question_text

question_image

difficulty

subject_prediction

chapter_prediction

topic_prediction

confidence

status

DRAFT
REVIEW
APPROVED

created_at
```

---

# 13. parsed_options

Pilihan jawaban.

```text
parsed_options
--------------

id

question_id

option_label

A
B
C
D
E

option_text

option_image

is_answer

confidence
```

---

# 14. parsed_explanations

Pembahasan.

```text
parsed_explanations
-------------------

id

question_id

explanation

reference

confidence
```

---

# 15. parsed_metadata

Metadata hasil AI.

```text
parsed_metadata
---------------

id

question_id

education_level

grade

subject

chapter

subchapter

difficulty

estimated_duration

question_type

MULTIPLE_CHOICE

language

created_at
```

---

# 16. parsing_reviews

Review manual.

```text
parsing_reviews
---------------

id

question_id

reviewer

status

APPROVED
REJECTED
REVISION

notes

reviewed_at
```

---

# 17. import_validation_rules

Rule validasi.

```text
import_validation_rules
-----------------------

id

rule_name

module

validation_type

REGEX
AI
SCRIPT

rule_expression

error_message

severity

WARNING
ERROR
```

---

# 18. validation_results

Hasil validasi.

```text
validation_results
------------------

id

job_id

rule_id

object_type

FILE
QUESTION
OPTION
IMAGE

object_id

status

PASSED
FAILED

message
```

---

# 19. duplicate_detection

Deteksi soal duplikat.

```text
duplicate_detection
-------------------

id

question_id

similar_question

similarity_score

algorithm

status
```

---

# 20. import_batches

Batch import.

```text
import_batches
--------------

id

job_id

batch_no

total_record

success_record

failed_record

processing_time

status
```

---

# 21. import_results

Hasil import.

```text
import_results
--------------

id

batch_id

target_table

record_id

status

SUCCESS
FAILED

error_message
```

---

# 22. import_errors

Error import.

```text
import_errors
-------------

id

job_id

page

line

error_type

description

raw_data

created_at
```

---

# 23. import_templates

Template import.

```text
import_templates
----------------

id

module

template_name

template_version

schema_json

sample_file

status
```

---

# 24. document_versions

Versi dokumen.

```text
document_versions
-----------------

id

file_id

version

change_log

created_by

created_at
```

---

# 25. processing_queue

Queue OCR.

```text
processing_queue
----------------

id

job_id

worker_name

priority

status

WAITING
RUNNING
FAILED
SUCCESS

retry_count

scheduled_at

started_at

finished_at
```

---

# 26. processing_workers

Worker OCR.

```text
processing_workers
------------------

id

worker_name

hostname

cpu

memory

current_job

status

HEALTHY
BUSY
DOWN

last_heartbeat
```

---

# 27. import_statistics

Statistik.

```text
import_statistics
-----------------

id

date

total_job

total_file

total_question

total_page

success_rate

avg_processing_time

avg_ocr_confidence

avg_ai_confidence
```

---

# 28. import_configuration

Konfigurasi OCR.

```text
import_configuration
--------------------

id

key

value

description
```

Contoh

```text
MAX_UPLOAD_SIZE=100MB

ENABLE_AI=true

ENABLE_DUPLICATE_CHECK=true

AUTO_APPROVE=false

OCR_ENGINE=Tesseract

AI_ENGINE=OpenAI

MAX_PARALLEL_JOB=10
```

---

# Relasi Antar Tabel

```text
import_jobs
    │
    ├──────── import_files
    ├──────── ai_parsing_jobs
    ├──────── import_batches
    ├──────── validation_results
    ├──────── import_errors
    └──────── processing_queue

import_files
    │
    ├──────── document_pages
    └──────── document_versions

document_pages
    │
    ├──────── ocr_results
    ├──────── layout_analysis
    ├──────── extracted_blocks
    ├──────── extracted_images
    ├──────── extracted_tables
    └──────── extracted_formulas

parsed_questions
    │
    ├──────── parsed_options
    ├──────── parsed_explanations
    ├──────── parsed_metadata
    ├──────── parsing_reviews
    └──────── duplicate_detection

import_batches
    │
    └──────── import_results

ocr_engines
    │
    └──────── ocr_results

import_validation_rules
    │
    └──────── validation_results
```

# Integrasi dengan Domain Lain

Domain OCR / Import Engine menjadi pusat ingest data dan berintegrasi dengan:

* **Question Bank** → impor soal, opsi jawaban, pembahasan, metadata.
* **Learning Material** → impor modul, materi, gambar, tabel, dan rumus.
* **Media Management** → penyimpanan file, gambar, dan aset hasil ekstraksi.
* **AI Integration** → parsing, klasifikasi mata pelajaran, tingkat kesulitan, dan deteksi duplikasi.
* **Search** → pengindeksan konten setelah impor selesai.
* **Scheduler & Queue** → orkestrasi pipeline OCR dan AI secara asinkron.
* **Logging & Audit** → pencatatan seluruh proses upload, parsing, validasi, review, dan impor.
* **Analytics** → metrik akurasi OCR, performa AI, tingkat keberhasilan impor, dan produktivitas reviewer.

## Fitur Tingkat Lanjut yang Direkomendasikan

Untuk memastikan kualitas data dan skalabilitas, tambahkan kemampuan berikut:

* **Versioned Parsing**: simpan versi prompt AI dan model OCR agar hasil dapat direproduksi.
* **Human-in-the-Loop Review**: reviewer hanya memeriksa bagian dengan confidence rendah.
* **Confidence Threshold**: aturan otomatis, misalnya confidence ≥ 95% dapat langsung lolos validasi tertentu, sedangkan nilai di bawah ambang masuk antrean review.
* **Duplicate Detection**: gunakan kombinasi embedding semantik (`pgvector`) dan fuzzy matching untuk mendeteksi soal yang mirip.
* **Formula & Diagram Recognition**: simpan hasil OCR rumus dalam LaTeX/MathML dan aset diagram secara terpisah.
* **Resumable Pipeline**: setiap tahap (OCR, AI Parsing, Review, Import) dapat dijalankan ulang tanpa mengulang seluruh proses.
* **Bulk Import Optimization**: lakukan insert bertahap (batch), gunakan staging table sebelum data dipindahkan ke tabel operasional, dan dukung rollback jika validasi gagal.
* **Event-Driven Architecture**: setiap tahap menerbitkan event (`JobUploaded`, `OCRCompleted`, `AIParsed`, `ReviewApproved`, `ImportCompleted`) sehingga pipeline mudah diperluas di masa depan.
