Untuk **YakinLulus.id**, saya menyarankan agar **Engine Ujian (CBT Engine)** dipisahkan menjadi domain tersendiri dan **tidak bercampur dengan Bank Soal**.

Ini adalah kesalahan yang paling sering terjadi pada sistem CBT. Banyak developer membuat tabel seperti:

```sql
exam
exam_question
student_answer
```

Awalnya terlihat sederhana, tetapi setelah muncul kebutuhan seperti:

* Randomisasi soal
* Randomisasi opsi jawaban
* Timer
* Auto submit
* Resume ujian
* Offline mode
* Sinkronisasi
* Paket soal
* Adaptive Test (CAT)
* Multi sesi
* Multi pengawas
* Multi ruang
* Token ujian
* Safe Browser
* Anti cheating
* Statistik realtime
* Auto grading
* Essay manual grading
* AI Grading
* Audit
* Live monitoring

struktur tersebut akan cepat menjadi sulit dikembangkan.

---

# Arsitektur Domain CBT Engine

Saya membaginya menjadi beberapa bounded context.

```text
Exam Engine
│
├── Exam Master
│
├── Exam Configuration
│
├── Exam Session
│
├── Exam Package
│
├── Exam Delivery
│
├── Student Attempt
│
├── Student Answer
│
├── Navigation
│
├── Timer
│
├── Submission
│
├── Grading
│
├── Monitoring
│
├── Anti Cheating
│
├── Analytics
│
└── Offline Sync
```

Total sekitar **70–90 tabel**.

---

# 1. Exam Master

## exam

Identitas ujian.

```sql
exam

id

exam_code

title

description

exam_type

TRYOUT

CBT

QUIZ

MID

FINAL

UTBK

AKM

status

owner_id

created_by

created_at
```

---

## exam_metadata

```sql
exam_metadata

id

exam_id

duration_minute

passing_score

certificate

negative_marking

calculator_allowed

fullscreen_required

safe_browser

show_result

show_answer

```

---

## exam_status

```sql
exam_status

id

code

DRAFT

REVIEW

PUBLISHED

RUNNING

FINISHED

ARCHIVED
```

---

# 2. Mapping Akademik

Karena satu ujian bisa dipakai beberapa kelas.

```text
exam_subject

exam_grade

exam_curriculum

exam_chapter

exam_topic

exam_competency

exam_tag
```

Sama seperti Bank Soal.

---

# 3. Paket Soal

## exam_package

Misalnya

```text
Paket A

Paket B

Paket C
```

```sql
exam_package

id

exam_id

name

random_seed
```

---

## exam_package_question

```sql
exam_package_question

id

package_id

question_id

question_order

score
```

---

## exam_question_pool

Pool random.

```sql
exam_question_pool

id

exam_id

subject_id

chapter_id

difficulty

total_question
```

Misalnya

```text
Matematika

Bab 1

20 soal

ambil 5
```

---

# 4. Randomisasi

## exam_randomization

```sql
exam_randomization

id

exam_id

random_question

random_option

random_seed
```

---

## exam_random_log

Untuk debugging.

---

# 5. Jadwal

## exam_schedule

```sql
exam_schedule

id

exam_id

start_time

end_time

timezone
```

---

## exam_session

Satu ujian bisa banyak sesi.

```sql
exam_session

id

exam_id

session_name

capacity

token

location
```

---

## exam_proctor

```sql
exam_proctor

id

session_id

teacher_id
```

---

# 6. Peserta

## exam_participant

```sql
exam_participant

id

exam_id

student_id

status
```

Status

```text
REGISTER

READY

STARTED

FINISHED

ABSENT
```

---

## participant_package

Menentukan paket A/B/C.

---

# 7. Attempt

Satu siswa bisa mengulang.

## exam_attempt

```sql
exam_attempt

id

participant_id

attempt_no

started_at

finished_at

last_sync

status
```

---

## attempt_question

Snapshot.

Ini penting.

Jangan mengambil langsung dari Bank Soal.

```sql
attempt_question

id

attempt_id

question_id

display_order

snapshot_version

```

---

## attempt_option

Snapshot.

```sql
attempt_option

id

attempt_question_id

option_label

display_order
```

---

# 8. Jawaban

## student_answer

```sql
student_answer

id

attempt_question_id

selected_option

answered_at
```

---

## essay_answer

```sql
essay_answer

id

attempt_question_id

text_answer

asset_id
```

---

## answer_history

Jika berubah.

---

# 9. Navigation

## navigation_log

```sql
navigation_log

id

attempt_id

question_no

visited_at
```

---

## bookmark_question

Flag.

```sql
bookmark_question

id

attempt_question_id
```

---

## question_time

Berapa lama.

```sql
question_time

id

attempt_question_id

duration_second
```

---

# 10. Timer

## exam_timer

```sql
exam_timer

id

attempt_id

remaining_second

last_update
```

---

## timer_history

Sinkronisasi.

---

# 11. Auto Submit

## auto_submit

```sql
auto_submit

id

attempt_id

reason

TIMEOUT

MANUAL

DISCONNECT

CHEATING
```

---

# 12. Penilaian

## grading_result

```sql
grading_result

id

attempt_id

score

correct

wrong

blank

passed
```

---

## essay_grading

Manual.

---

## ai_grading

Jika AI.

---

## grading_detail

Per soal.

---

# 13. Monitoring

## live_monitor

```sql
student online

current question

remaining time
```

---

## heartbeat

Client kirim heartbeat.

---

## connection_log

---

# 14. Anti Cheating

## cheating_log

```sql
TAB_CHANGE

COPY

PASTE

SCREENSHOT

WINDOW_BLUR
```

---

## browser_log

Safe Browser.

---

## camera_log

Jika AI Proctor.

---

## face_detection

---

## microphone_detection

---

# 15. Offline

## offline_sync

```sql
id

attempt

last_sync

status
```

---

## sync_log

---

## sync_conflict

---

# 16. Analitik

## exam_statistics

```sql
exam_id

average

highest

lowest

std_dev
```

---

## question_statistics

Mengambil dari Bank Soal.

---

## participant_statistics

---

## realtime_dashboard

---

# 17. Audit

## exam_history

---

## attempt_history

---

## grading_history

---

## publish_history

---

# Relasi Besar

```text
Exam
│
├── Metadata
├── Status
├── Schedule
├── Session
│      ├── Proctor
│      └── Participant
│             │
│             ├── Attempt
│             │      │
│             │      ├── Attempt Question
│             │      │       └── Attempt Option
│             │      │
│             │      ├── Student Answer
│             │      ├── Essay Answer
│             │      ├── Navigation
│             │      ├── Bookmark
│             │      ├── Timer
│             │      ├── Auto Submit
│             │      ├── Offline Sync
│             │      └── Grading
│             │
│             └── Monitoring
│
├── Package
│      └── Package Question
│
├── Question Pool
├── Randomization
├── Anti Cheating
├── Analytics
└── Audit
```

# Integrasi dengan Domain Lain

| Domain                  | Integrasi                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| **Master Akademik**     | Subject, Grade, Curriculum, Semester, Academic Year, Topic, Competency    |
| **Bank Soal**           | Mengambil soal berdasarkan `question_id` dan versi yang dipublikasikan    |
| **Asset Management**    | Lampiran soal, audio listening, video, gambar, file jawaban essay         |
| **User & RBAC**         | Peserta, guru, pengawas, admin, reviewer, hak akses ujian                 |
| **Materi Pembelajaran** | Menjadikan materi sebagai prasyarat atau remedial berdasarkan hasil ujian |
| **AI Tutor**            | Memberikan rekomendasi belajar dari hasil analisis jawaban siswa          |
| **Notification**        | Pengumuman jadwal, token ujian, hasil ujian, sertifikat                   |
| **Analytics**           | Distribusi nilai, analisis butir soal, tingkat kesulitan, performa siswa  |

# Rekomendasi Penting untuk Arsitektur CBT

Ada satu prinsip yang sangat penting dan sering diabaikan pada sistem CBT:

## Gunakan Snapshot Soal Saat Ujian

Jangan pernah merender soal langsung dari tabel `question` ketika ujian berlangsung. Saat peserta memulai attempt:

1. Tentukan paket atau hasil randomisasi.
2. Simpan **snapshot** daftar soal pada `attempt_question`.
3. Simpan **snapshot** urutan opsi pada `attempt_option`.
4. Simpan referensi ke **`question_version_id`** yang digunakan.

Dengan cara ini:

* Jika penulis mengedit soal setelah ujian dimulai, peserta yang sedang mengerjakan tetap melihat versi yang sama.
* Hasil ujian tetap dapat diaudit bertahun-tahun kemudian.
* Analisis butir soal selalu mengacu pada versi soal yang benar.

## Status Attempt yang Direkomendasikan

Gunakan alur status yang eksplisit agar mudah dipantau dan dipulihkan saat terjadi gangguan:

```text
REGISTERED
      │
      ▼
READY
      │
      ▼
STARTED
      │
      ├──────── PAUSED
      │             │
      │             ▼
      │         RESUMED
      │
      ▼
SUBMITTED
      │
      ▼
GRADING
      │
      ▼
COMPLETED
```

Dengan pendekatan ini, Engine Ujian YakinLulus.id siap menangani ujian sekolah, tryout, UTBK, TKA, AKM, maupun Computer Adaptive Test (CAT), sekaligus mendukung skala besar, sinkronisasi offline, audit penuh, dan pengembangan fitur AI di masa depan.
