



Berikut adalah rancangan **Database Analytics** untuk **YakinLulus.id** yang dirancang sebagai **event-driven analytics** sehingga mampu menangani:

- Dashboard Super Admin
- Dashboard Guru
- Dashboard Sekolah
- Dashboard Finance
- Dashboard Siswa
- Dashboard AI Recommendation
- Business Intelligence
- Machine Learning Dataset
- Real Time Monitoring
- Product Analytics

Saya tidak menyarankan menyimpan analytics langsung di tabel transaksi karena akan sangat berat ketika jumlah user sudah mencapai ratusan ribu.

---

# Analytics Architecture

```
                    User Activity
                          │
                          ▼
                Application Event
                          │
         ┌────────────────┴──────────────┐
         │                               │
         ▼                               ▼
 Transaction Database             Analytics Event
(PostgreSQL Normalized)          (Event Table)

                                         │
                              Background Worker
                                         │
        ┌──────────────┬─────────────────┴─────────────┐
        ▼              ▼                               ▼

 Daily Summary     Student Statistics          Teacher Statistics

        ▼              ▼                               ▼

 Dashboard       AI Recommendation        Business Intelligence

```

Analytics merupakan hasil agregasi sehingga dashboard tidak membaca tabel transaksi satu-persatu.

---

# Domain Analytics

```
Analytics

├── Event Tracking
├── Learning Analytics
├── Exam Analytics
├── Student Analytics
├── Teacher Analytics
├── School Analytics
├── Finance Analytics
├── Membership Analytics
├── AI Recommendation
├── Leaderboard
├── Dashboard Cache
├── KPI
├── Report Generator
└── Data Warehouse
```

---

# ERD

```
analytics_events
      │
      ├──── analytics_daily_summary
      ├──── analytics_student
      ├──── analytics_teacher
      ├──── analytics_exam
      ├──── analytics_learning
      ├──── analytics_finance
      ├──── analytics_membership
      ├──── analytics_school
      ├──── analytics_subject
      ├──── analytics_chapter
      ├──── analytics_question
      ├──── analytics_dashboard_cache
      ├──── analytics_kpi
      └──── analytics_report
```

---

# 1 analytics_events

Seluruh aktivitas aplikasi dicatat di sini.

```
id UUID PK

event_time TIMESTAMP

event_type
event_name

user_id
student_id
teacher_id

school_id

membership_id

exam_id

attempt_id

question_id

material_id

chapter_id

subject_id

class_id

device

browser

platform

os

app_version

ip_address

country

province

city

latitude

longitude

session_id

duration_second

metadata JSONB

created_at
```

Contoh event

```
LOGIN

LOGOUT

START_EXAM

SUBMIT_EXAM

ANSWER_QUESTION

OPEN_MATERIAL

WATCH_VIDEO

DOWNLOAD_MATERIAL

PURCHASE_MEMBERSHIP

PAYMENT_SUCCESS

PAYMENT_FAILED

REGISTER

AI_CHAT

AI_RECOMMENDATION_CLICK

SEARCH

BOOKMARK

SHARE

```

---

# 2 analytics_student

Ringkasan performa siswa.

```
id

student_id

date

total_login

total_learning_time

total_exam

total_question

correct_answer

wrong_answer

empty_answer

average_score

highest_score

lowest_score

mastery_percentage

accuracy

speed_answer

streak_day

xp

level

ranking

coins

badge

created_at
```

---

# 3 analytics_teacher

```
id

teacher_id

date

total_student

active_student

total_exam_created

total_exam_approved

total_question_created

total_material_created

average_student_score

average_completion

average_learning_time

created_at
```

---

# 4 analytics_school

```
id

school_id

date

active_student

active_teacher

exam_count

learning_hour

average_score

average_completion

ranking

created_at
```

---

# 5 analytics_exam

Statistik ujian.

```
id

exam_id

date

participant

finished

unfinished

average_score

highest_score

lowest_score

pass_rate

average_duration

average_correct

average_wrong

average_blank

created_at
```

---

# 6 analytics_question

Soal tersulit dan termudah.

```
id

question_id

date

shown

answered

correct

wrong

blank

average_duration

difficulty_index

discrimination_index

reliability

created_at
```

---

# 7 analytics_material

```
id

material_id

date

view

completed

download

bookmark

share

average_duration

completion_rate

drop_rate

created_at
```

---

# 8 analytics_subject

```
id

subject_id

date

student

exam

average_score

average_accuracy

average_speed

completion

created_at
```

---

# 9 analytics_chapter

```
id

chapter_id

date

view

exercise

average_score

mastery

weakness

created_at
```

---

# 10 analytics_membership

```
id

membership_package_id

date

new_user

renewal

expired

cancel

active

conversion_rate

created_at
```

---

# 11 analytics_finance

```
id

date

gross_income

net_income

transaction

refund

failed_payment

average_transaction

arpu

ltv

mrr

arr

created_at
```

---

# 12 analytics_daily_summary

Ringkasan harian.

```
id

date

new_user

active_user

new_student

new_teacher

exam_count

question_answered

material_view

membership_purchase

income

created_at
```

---

# 13 analytics_dashboard_cache

Cache dashboard agar sangat cepat.

```
id

dashboard_type

owner_type

owner_id

cache_key

cache_data JSONB

generated_at

expired_at
```

---

# 14 analytics_kpi

```
id

kpi_name

period

value

target

achievement

status

updated_at
```

Contoh KPI

```
DAU

WAU

MAU

Retention

Revenue

Exam Completion

Average Score

Average Learning Time

Conversion

Renewal Rate

```

---

# 15 analytics_report

```
id

report_name

report_type

period_start

period_end

generated_by

file_url

status

generated_at
```

---

# 16 analytics_leaderboard

```
id

period

student_id

school_id

class_id

subject_id

score

xp

ranking

updated_at
```

---

# 17 analytics_ai_recommendation

Digunakan AI Tutor.

```
id

student_id

subject_id

chapter_id

recommended_material

recommended_question_set

confidence_score

reason

generated_at
```

---

# 18 analytics_retention

```
id

date

day1

day7

day14

day30

day60

day90

created_at
```

---

# 19 analytics_session

```
id

session_id

student_id

login_time

logout_time

duration

device

platform

browser

ip

created_at
```

---

# 20 analytics_funnel

Mengukur conversion funnel.

```
id

date

visitor

register

verification

membership_trial

membership_paid

active_student

conversion_rate
```

---

# Dashboard yang Dapat Dibangun

## Dashboard Super Admin

- Total User
- Active User
- Revenue
- DAU / WAU / MAU
- Conversion Funnel
- Growth
- Retention
- Top Subject
- Top School
- Top Teacher
- Server Usage
- AI Usage
- Payment Analytics

---

## Dashboard Guru

- Nilai rata-rata kelas
- Distribusi nilai
- Tingkat kesulitan soal
- Materi paling sering dipelajari
- Kehadiran ujian
- Perkembangan siswa
- Ranking siswa
- Learning time

---

## Dashboard Siswa

- XP
- Level
- Streak
- Ranking
- Learning Time
- Progress Mapel
- Progress Bab
- Heatmap Belajar
- Weak Topic
- Strong Topic
- AI Recommendation

---

## Dashboard Finance

- Pendapatan harian
- Pendapatan bulanan
- MRR
- ARR
- ARPU
- LTV
- Conversion
- Refund
- Membership Growth

---

# Strategi Partisi

Tabel dengan volume tinggi sebaiknya dipartisi berdasarkan waktu.

| Tabel | Strategi |
|--------|-----------|
| analytics_events | Monthly Partition |
| analytics_session | Monthly Partition |
| analytics_question | Monthly Partition |
| analytics_exam | Monthly Partition |
| analytics_material | Monthly Partition |
| analytics_daily_summary | Yearly Partition |
| analytics_finance | Yearly Partition |

---

# Strategi Indeks

## analytics_events
- `(event_time DESC)`
- `(event_type, event_time)`
- `(user_id, event_time DESC)`
- `(student_id, event_time DESC)`
- `(teacher_id, event_time DESC)`
- `(exam_id, event_time DESC)`
- `(question_id, event_time DESC)`
- `(material_id, event_time DESC)`
- `GIN(metadata)`

## Tabel agregasi
Gunakan indeks komposit sesuai pola akses dashboard, misalnya:
- `(date, student_id)`
- `(date, teacher_id)`
- `(date, school_id)`
- `(date, subject_id)`
- `(date, chapter_id)`
- `(date, exam_id)`

---

# Materialized View yang Direkomendasikan

Untuk mempercepat query dashboard, buat materialized view yang diperbarui secara berkala:

- `mv_daily_active_users`
- `mv_monthly_active_users`
- `mv_exam_summary`
- `mv_student_progress`
- `mv_teacher_performance`
- `mv_school_performance`
- `mv_subject_performance`
- `mv_question_difficulty`
- `mv_learning_completion`
- `mv_finance_revenue`
- `mv_membership_growth`
- `mv_ai_recommendation_effectiveness`
- `mv_retention_cohort`

---

# Integrasi dengan Arsitektur YakinLulus.id

Struktur ini dirancang untuk terhubung langsung dengan domain yang telah didefinisikan sebelumnya, yaitu **Master Akademik**, **Question Bank**, **Learning Material**, **CBT Engine**, **Membership**, **Finance**, **User & RBAC**, dan **AI Tutor**. Semua domain menghasilkan event ke `analytics_events`, kemudian diproses secara asinkron oleh background worker menjadi tabel agregasi dan materialized view untuk dashboard operasional maupun Business Intelligence. Pendekatan ini menjaga database transaksi tetap ringan sekaligus memungkinkan analitik real-time dan pengembangan model AI di masa depan tanpa mengganggu performa aplikasi utama.