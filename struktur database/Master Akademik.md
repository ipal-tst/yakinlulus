



Untuk **YakinLulus.id**, saya tidak menyarankan membuat hanya tabel `master_akademik` saja. Sebaiknya dibuat sebagai **Academic Master Domain**, sehingga seluruh modul (Bank Soal, Materi, CBT, AI Tutor, Jadwal, Guru, Siswa, Analitik, dan Finance) menggunakan referensi data akademik yang sama.

Target sistem:
- Multi jenjang (SD, SMP, SMA, SMK, Gap Year)
- Multi kurikulum
- Multi tahun ajaran
- Mendukung perubahan kurikulum tanpa mengubah data lama
- Mendukung sekolah mitra
- Mendukung CBT nasional (UTBK, AKM, TKA)
- Siap untuk >100.000 user

---

# Struktur Domain

```
Academic Master
│
├── Academic Calendar
├── Academic Structure
├── Curriculum
├── Subject
├── Grade
├── Major
├── Semester
├── Chapter
├── Sub Chapter
├── Competency
├── Learning Outcome
├── Topic Mapping
├── School Partner
├── Teacher Assignment
└── Academic Configuration
```

---

# 1. academic_year

Master Tahun Ajaran.

```
academic_year
--------------
id (uuid)

code
2026/2027

name

start_date

end_date

is_active

created_at

updated_at
```

Relasi

```
1 Tahun Ajaran
        │
        ├── Semester
        ├── Exam
        ├── Enrollment
```

---

# 2. semester

```
semester
----------------

id

academic_year_id

name
Semester Ganjil

order_no

start_date

end_date

is_active
```

Contoh

```
2026/2027

Semester 1

Semester 2
```

---

# 3. education_level

Jenjang.

```
education_level

id

code

SD

SMP

SMA

SMK

GAPYEAR

name

sort_order

icon

color
```

---

# 4. grade

Kelas.

```
grade

id

education_level_id

code

4

5

6

7

8

9

10

11

12

GY

name

sort_order
```

Contoh

```
SD
 ├──4
 ├──5
 └──6

SMP
 ├──7
 ├──8
 └──9

SMA
 ├──10
 ├──11
 └──12

SMK
 ├──10
 ├──11
 └──12

Gap Year
 └──GY
```

---

# 5. major

Jurusan SMA/SMK.

```
major

id

education_level_id

code

IPA

IPS

BAHASA

TKJ

RPL

AKL

DKV

name

description

is_active
```

Relasi

```
SMA
 ├── IPA
 ├── IPS
 └── Bahasa

SMK
 ├── RPL
 ├── TKJ
 ├── AKL
 ├── DKV
 └── dll
```

---

# 6. curriculum

```
curriculum

id

code

K13

MERDEKA

UTBK

AKM

TKA

name

version

effective_year

description

is_active
```

Karena satu mapel bisa muncul di banyak kurikulum.

---

# 7. subject

Master Mapel.

```
subject

id

code

MAT

BIO

FIS

KIM

IND

ENG

name

description

icon

color

is_active
```

---

# 8. curriculum_subject

Mapping Kurikulum.

```
curriculum_subject

id

curriculum_id

subject_id

education_level_id

grade_id

major_id

semester_id

is_required

credit

sort_order
```

Contoh

```
Kurikulum Merdeka

↓

Kelas 10

↓

Matematika
```

---

# 9. chapter

Bab.

```
chapter

id

curriculum_subject_id

code

CH-01

title

order_no

description

estimated_minutes

is_active
```

---

# 10. subchapter

```
subchapter

id

chapter_id

code

SC-01

title

order_no

description

estimated_minutes
```

---

# 11. competency

CP/KD.

```
competency

id

chapter_id

code

KD 3.1

CP-01

title

description

difficulty_level

is_active
```

---

# 12. learning_outcome

```
learning_outcome

id

competency_id

title

description

blooms_level

remember

understand

apply

analyze

evaluate

create
```

Ini sangat penting untuk AI Tutor dan analytics.

---

# 13. topic

Topik kecil.

```
topic

id

subchapter_id

name

description

order_no
```

Contoh

```
Persamaan Linear

↓

Eliminasi

↓

Substitusi

↓

Gabungan
```

---

# 14. skill

Skill yang diukur.

```
skill

id

code

NUMERIC

LOGIC

READING

ANALYSIS

WRITING

name
```

---

# 15. topic_skill

```
topic_skill

id

topic_id

skill_id
```

---

# 16. learning_path

Digunakan AI.

```
learning_path

id

grade_id

subject_id

title

description

estimated_hours
```

---

# 17. learning_path_topic

```
learning_path_topic

id

learning_path_id

topic_id

sequence_no
```

---

# 18. academic_event

Kalender akademik.

```
academic_event

id

academic_year_id

semester_id

title

event_type

start_date

end_date

description
```

Contoh

```
PTS

PAS

Libur

PPDB

UTBK

AKM

TKA
```

---

# 19. school

Jika nanti bekerja sama dengan sekolah.

```
school

id

npsn

name

province

city

district

address

phone

email

website

is_active
```

---

# 20. school_class

```
school_class

id

school_id

grade_id

major_id

academic_year_id

name

capacity
```

---

# 21. teacher_subject

```
teacher_subject

id

teacher_id

school_id

subject_id

grade_id

major_id
```

---

# 22. teacher_homeroom

```
teacher_homeroom

id

teacher_id

school_class_id

academic_year_id
```

---

# 23. academic_configuration

Konfigurasi global.

```
academic_configuration

id

active_academic_year

active_semester

default_curriculum

grading_method

minimum_score

passing_score

max_exam_retry

created_at
```

---

# Relasi Besar

```text
Academic Year
      │
      ├──────── Semester
      │
      ├──────── Academic Event
      │
      └──────── School Class

Education Level
      │
      └──── Grade
              │
              └──── Major

Curriculum
      │
      └──── Curriculum Subject
                     │
                     ├──── Subject
                     │
                     ├──── Grade
                     │
                     ├──── Semester
                     │
                     └──── Major
                              │
                              └──── Chapter
                                        │
                                        └──── Subchapter
                                                 │
                                                 ├──── Topic
                                                 │        │
                                                 │        └──── Topic Skill
                                                 │
                                                 └──── Competency
                                                           │
                                                           └──── Learning Outcome

Learning Path
      │
      └──── Learning Path Topic

School
      │
      └──── School Class
                     │
                     ├──── Teacher Homeroom
                     └──── Teacher Subject
```

# Integrasi dengan Domain Lain

Domain **Master Akademik** menjadi fondasi bagi seluruh modul YakinLulus.id:

| Domain | Ketergantungan pada Master Akademik |
|--------|--------------------------------------|
| Bank Soal | Subject, Grade, Curriculum, Chapter, Subchapter, Topic, Competency, Skill |
| Materi Pembelajaran | Subject, Chapter, Subchapter, Topic, Learning Outcome |
| CBT/Ujian | Academic Year, Semester, Subject, Grade, Curriculum |
| AI Tutor | Topic, Learning Path, Competency, Learning Outcome, Skill |
| Dashboard Siswa | Academic Year, Grade, Subject, Learning Path |
| Dashboard Guru | School, School Class, Teacher Subject, Academic Year |
| Analitik | Subject, Topic, Skill, Competency, Grade |
| Membership | Menentukan akses berdasarkan jenjang, kelas, dan paket pembelajaran |

## Ringkasan

Struktur ini terdiri dari **23 tabel master** yang terpisah berdasarkan tanggung jawabnya (single responsibility), memenuhi normalisasi hingga **3NF/BCNF**, mendukung multi-kurikulum, multi-jenjang, multi-sekolah, dan siap digunakan sebagai referensi oleh seluruh domain inti YakinLulus.id. Dengan pendekatan ini, perubahan kurikulum, penambahan jenjang, atau ekspansi fitur di masa depan dapat dilakukan tanpa perlu mengubah struktur data inti secara signifikan.