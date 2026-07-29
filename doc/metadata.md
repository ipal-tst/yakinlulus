Karena kita sudah sepakat menggunakan database yang scalable, maka metadata harus dibuat cukup lengkap sejak awal agar tidak perlu mengubah struktur database ketika nanti menambah fitur seperti AI, adaptive learning, UTBK, kurikulum baru, hingga marketplace soal.

Prinsip saya adalah:

Metadata harus fleksibel, tetapi tabel inti tetap sederhana.

Saya membagi metadata menjadi beberapa layer.

1. Metadata Master

Semua soal dan materi mengacu ke master data.

Education Level
---------------
id
name

1 SD
2 SMP
3 SMA
4 SMK
5 UTBK
Grade
-----
id
education_level_id
name
order_no

4
5
6
7
...
12
Gap Year
Curriculum
----------
id
name

K13
Merdeka
UTBK
Internal
Subject
-------
id
education_level_id
curriculum_id

code
name

MTK
IPA
IPS
BIO
FISIKA
KIMIA
dll
Chapter
-------
id
subject_id
grade_id

code
title
sequence
Topic
-----
id
chapter_id

title
sequence

Topic akan sangat membantu AI.

Misal

Matematika

Bab

↓

Persamaan Linear

↓

SPLDV

↓

Metode Eliminasi

↓

Metode Substitusi
2. Metadata Soal
Identitas
id
uuid
code
slug
Akademik
education_level_id

grade_id

curriculum_id

subject_id

chapter_id

topic_id

subtopic_id (optional)
Tipe Soal
question_type

multiple_choice

multiple_answer

true_false

essay

matching

short_answer

numeric

ordering

fill_blank

Walaupun MVP hanya pilihan ganda.

Ke depan tinggal aktifkan.

Tingkat Kesulitan
difficulty

easy

medium

hard

atau

1
2
3
4
5
Taksonomi Bloom

Saya sangat menyarankan.

bloom_level

C1 Remember

C2 Understand

C3 Apply

C4 Analyze

C5 Evaluate

C6 Create

AI akan sangat terbantu.

Tingkat HOTS
thinking_level

LOTS

MOTS

HOTS
Kompetensi
competency_code

learning_outcome

indicator

Misalnya

CP

TP

ATP

sesuai Kurikulum Merdeka.

Isi Soal
question_text
question_html
question_markdown

Saya lebih memilih HTML.

Media
has_image

has_audio

has_video

has_equation

has_table
cover_image

attachment

youtube_url
Cerita Soal

Untuk soal UTBK.

story_id

Karena

1 cerita

↓

5 soal

Pilihan Jawaban
option_a

option_b

option_c

option_d

option_e

atau lebih baik

QuestionOption

id

question_id

label

content

is_correct

order_no

Ini jauh lebih scalable.

Jawaban
correct_option

correct_answer
Pembahasan
explanation_text

explanation_image

explanation_video

explanation_audio
Waktu
estimated_time

Misalnya

90 detik
Bobot
score

negative_score

Untuk UTBK.

AI Metadata

Ini penting.

ai_generated

ai_model

ai_version

prompt_version

review_status

similarity_score

quality_score
Validasi
status

draft

review

approved

published

archived
reviewed_by

approved_by
Statistik
view_count

attempt_count

correct_count

wrong_count

average_time
Analitik
difficulty_index

discrimination_index

reliability

IRT_parameter_a

IRT_parameter_b

IRT_parameter_c

Ini untuk CBT profesional.

Source
source_type

official

teacher

ai

import

manual
source_name

source_year

license
Tag
question_tag

question_tag_map

Contoh

Aljabar

UTBK

SNBT

HOTS

Cepat
Audit
created_by

updated_by

deleted_by

created_at

updated_at

deleted_at

version
3. Metadata Materi

Sekarang untuk bank materi.

Identitas
id

uuid

slug

code
Akademik
education_level_id

grade_id

curriculum_id

subject_id

chapter_id

topic_id
Tipe Materi
material_type

text

video

audio

interactive

ebook

pdf

slide

exercise
Judul
title

subtitle

summary
Isi
content_html
content_markdown
content_json

Saya menyarankan HTML.

Media
thumbnail

banner

cover

icon
video_url

youtube_url

audio_url

pdf_url
Durasi
estimated_duration

Misalnya

20 menit
Kesulitan
difficulty

basic

intermediate

advanced
Prasyarat
prerequisite_material

atau

material_dependency

Contoh

Belajar Pecahan

↓

baru

↓

Perbandingan
Tujuan Pembelajaran
learning_objective
Kompetensi
competency

indicator

CP

TP
Kata Kunci
keyword

tag
AI
embedding_status

embedding_version

summary_ai

tts_generated

translation_status

Untuk RAG nanti.

Download
allow_download

download_count
Progress
completion_rate

average_duration

average_score_after_learning
Status
draft

review

published

archived
SEO
meta_title

meta_description

canonical_url

Jika materi nantinya dipublikasikan di website.

Audit
created_by

updated_by

created_at

updated_at

version
4. Metadata yang Saya Sarankan Ditambahkan Sejak Awal

Ada beberapa metadata yang sering terlupakan tetapi sangat berharga ketika platform berkembang.

A. Skill Mapping
skill_id
skill_code
skill_name

Contoh:

Pemecahan Masalah
Berpikir Logis
Literasi Numerasi
Literasi Sains

Ini memungkinkan AI merekomendasikan materi berdasarkan kelemahan siswa.

B. Learning Path
learning_path_id
order_in_path
is_required

Satu materi atau soal dapat menjadi bagian dari beberapa jalur belajar yang berbeda.

C. RAG & AI Search

Untuk mendukung fitur AI Tutor dan semantic search di masa depan.

embedding_id
embedding_version
embedding_updated_at
search_keywords
semantic_category
D. Multi-Tenant (Opsional)

Walaupun MVP hanya untuk satu platform, tambahkan kolom ini agar mudah jika suatu saat melayani sekolah atau lembaga berbeda.

tenant_id
organization_id
visibility
Kesimpulan Arsitektur

Saya merekomendasikan model metadata yang kaya (rich metadata) dengan tabel inti tetap tunggal:

Question → satu tabel utama untuk semua soal.
Material → satu tabel utama untuk semua materi.
Seluruh klasifikasi (jenjang, kelas, kurikulum, mata pelajaran, bab, topik, kompetensi, tag) dikelola melalui master data dan foreign key, bukan membuat tabel berbeda per jenjang atau mata pelajaran.
Metadata AI, analitik CBT, dan RAG disiapkan sejak awal meskipun sebagian belum digunakan. Biaya penambahan beberapa kolom jauh lebih kecil dibandingkan migrasi besar ketika platform mulai berkembang.

Dengan desain ini, database tetap sederhana untuk MVP, tetapi sudah memiliki fondasi yang cukup untuk berkembang menjadi platform edutech berskala besar tanpa perubahan arsitektur yang signifikan.                