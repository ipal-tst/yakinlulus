# 21_cbt_runtime_architecture.md

# YakinLulus.id CBT Runtime Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **CBT Runtime Engine**, yaitu komponen backend yang menjalankan seluruh proses ujian secara real-time.

CBT Runtime merupakan salah satu komponen paling kritis pada platform YakinLulus.id karena bertanggung jawab terhadap:

* Memulai ujian
* Distribusi soal
* Randomisasi soal
* Randomisasi pilihan jawaban
* Timer
* Auto Save
* Resume Exam
* Offline Recovery
* Submit Exam
* Auto Submit
* Anti-Cheat Support
* Scoring Pipeline

Dokumen ini hanya membahas **runtime engine**, bukan pembuatan ujian maupun bank soal.

---

# 2. Objectives

CBT Runtime dirancang untuk:

* Reliable
* Fault Tolerant
* Stateless API
* Horizontally Scalable
* Secure
* High Availability
* Low Latency
* Resume Friendly

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Session Based
* Event Driven
* Auto Save First
* Stateless Backend
* Immutable Question Set
* Time Authority on Server
* Idempotent Submission
* Zero Trust Client

Client tidak boleh menjadi sumber kebenaran terhadap waktu ujian maupun jawaban akhir.

---

# 4. High Level Architecture

```text
Student

↓

Frontend CBT

↓

REST API

↓

CBT Runtime Service

↓

Redis

↓

PostgreSQL (Supabase)

↓

Question Bank
```

Redis digunakan untuk state runtime, PostgreSQL menjadi persistent storage.

---

# 5. Runtime Components

Komponen utama:

* Exam Session Service
* Question Distributor
* Randomization Engine
* Timer Service
* Auto Save Service
* Resume Engine
* Submission Service
* Scoring Service
* Anti-Cheat Monitor
* Event Publisher

---

# 6. Directory Structure

```text
internal/

modules/

cbt/

runtime/

controller/

service/

repository/

timer/

randomizer/

autosave/

submission/

scoring/

session/

worker/

dto/
```

---

# 7. Runtime Flow

```text
Start Exam

↓

Create Session

↓

Generate Question Set

↓

Save Session

↓

Timer Starts

↓

Student Answers

↓

Auto Save

↓

Submit

↓

Scoring

↓

Result
```

---

# 8. Exam Session

Setiap peserta memiliki satu session.

Entity:

```text
exam_sessions
```

Kolom utama:

* id
* exam_id
* student_id
* started_at
* expires_at
* submitted_at
* duration
* status
* remaining_time
* device_fingerprint
* ip_address

---

# 9. Session Status

Status:

```text
created

started

paused

resumed

submitted

expired

cancelled
```

Status tidak boleh diubah secara langsung oleh client.

---

# 10. Session Initialization

Flow:

```text
Student

↓

Start Exam

↓

Permission Check

↓

Schedule Check

↓

Generate Question Set

↓

Generate Timer

↓

Create Session

↓

Response
```

---

# 11. Question Distribution

Saat ujian dimulai:

* Question Set dibentuk sekali.
* Tidak berubah sampai ujian selesai.
* Disimpan permanen.

Hal ini menjamin konsistensi ketika peserta melakukan resume.

---

# 12. Question Randomization

Randomisasi dilakukan berdasarkan blueprint ujian.

Contoh:

```text
Math

100 Questions

↓

Random 40 Questions
```

Setiap peserta memperoleh kombinasi berbeda.

---

# 13. Option Randomization

Pilihan jawaban juga dapat diacak.

Contoh:

```text
Original

A B C D E

↓

Random

D A E C B
```

Mapping jawaban benar disimpan pada server.

---

# 14. Story Question Support

Runtime mendukung:

```text
Story

↓

Question 1

Question 2

Question 3
```

Story hanya dikirim sekali dan direferensikan oleh beberapa soal.

---

# 15. Timer Authority

Timer sepenuhnya dikendalikan server.

```text
Server Time

↓

Remaining Time

↓

Frontend
```

Manipulasi jam perangkat tidak memengaruhi ujian.

---

# 16. Auto Save

Jawaban disimpan otomatis:

* Saat memilih jawaban.
* Saat berpindah soal.
* Interval berkala (misalnya setiap 30 detik).

Auto Save bersifat idempotent.

---

# 17. Answer Entity

Tabel:

```text
exam_answers
```

Kolom:

* session_id
* question_id
* selected_option
* answered_at
* changed_count

Jawaban terakhir menjadi jawaban final sebelum submit.

---

# 18. Navigation

Peserta dapat:

* Next
* Previous
* Jump Number
* Flag Question
* Clear Answer

Semua status navigasi tersimpan pada session.

---

# 19. Flag Question

Entity menyimpan:

```text
question_id

flagged = true
```

Digunakan sebagai penanda soal yang ingin ditinjau kembali.

---

# 20. Resume Engine

Jika koneksi terputus:

```text
Reconnect

↓

Load Session

↓

Remaining Time

↓

Question State

↓

Continue
```

Tidak ada regenerasi soal.

---

# 21. Offline Recovery

Frontend menyimpan jawaban sementara.

Ketika koneksi kembali:

```text
Local Cache

↓

Synchronization

↓

Server
```

Server tetap menjadi sumber data utama.

---

# 22. Auto Submit

Kondisi:

* Timer habis.
* Semua soal selesai dan peserta memilih submit.

Flow:

```text
Time Expired

↓

Lock Session

↓

Submit

↓

Scoring
```

---

# 23. Submission

Submit bersifat idempotent.

Jika request dikirim dua kali:

```text
Already Submitted

↓

Ignore Duplicate
```

Tidak boleh menghasilkan skor ganda.

---

# 24. Scoring Pipeline

Flow:

```text
Answers

↓

Scoring Service

↓

Score

↓

Statistics

↓

Ranking

↓

Publish Result
```

Scoring dilakukan di backend.

---

# 25. Result Visibility

Konfigurasi ujian menentukan:

* Langsung tampil.
* Ditunda.
* Setelah seluruh peserta selesai.
* Setelah diverifikasi guru.

Backend mengikuti konfigurasi tersebut.

---

# 26. Event Publishing

Runtime menghasilkan event:

* exam.started
* answer.saved
* question.flagged
* exam.submitted
* exam.expired
* score.generated

Event digunakan oleh Analytics, Notification, dan Audit.

---

# 27. Redis Usage

Redis digunakan untuk:

* Active Session Cache
* Remaining Timer
* Active Participant Counter
* Locking
* Rate Limiting

Data final tetap disimpan di PostgreSQL.

---

# 28. Anti-Cheat Support

Runtime menyediakan event:

* Browser Hidden
* Window Blur
* Fullscreen Exit
* Tab Switch
* Copy Attempt
* Paste Attempt
* Multiple Login
* Device Change

Event dicatat untuk analisis dan kebijakan sekolah.

---

# 29. Session Lock

Satu peserta hanya memiliki satu session aktif.

Jika login dari perangkat lain:

```text
New Login

↓

Old Session Invalid
```

Perilaku ini dapat diubah melalui konfigurasi ujian.

---

# 30. Security

Runtime memverifikasi:

* JWT
* Session Ownership
* Exam Status
* Schedule
* Permission
* Device Fingerprint (opsional)
* IP Address (opsional)

Semua validasi dilakukan pada server.

---

# 31. Performance Targets

| Operation   | Target   |
| ----------- | -------- |
| Start Exam  | < 500 ms |
| Save Answer | < 100 ms |
| Resume      | < 500 ms |
| Submit      | < 2 s    |
| Score       | < 5 s    |

---

# 32. Logging

Setiap aktivitas mencatat:

* Session ID
* Student ID
* Exam ID
* Question ID
* Duration
* Action
* Device
* IP Address

Jawaban peserta tidak ditulis ke application log.

---

# 33. Monitoring

Metric:

* Active Sessions
* Concurrent Exams
* Save Latency
* Submit Latency
* Auto Save Count
* Resume Count
* Failure Rate
* Average Exam Duration

---

# 34. Failure Recovery

Jika backend restart:

```text
Redis

↓

Session Recovery

↓

Continue Exam
```

Jika Redis tidak tersedia, state dipulihkan dari PostgreSQL dengan kemungkinan kehilangan state yang belum sempat di-cache.

---

# 35. Scalability

Runtime bersifat stateless.

```text
Load Balancer

↓

API 1

API 2

API 3

↓

Redis

↓

Supabase PostgreSQL
```

Seluruh instance dapat menangani peserta yang sama tanpa sticky session.

---

# 36. Integration

Runtime terintegrasi dengan:

* Authentication Service
* Exam Management
* Question Bank
* Notification Service
* Analytics Service
* Audit Service
* Ranking Engine
* AI Recommendation (Future)

---

# 37. Testing Strategy

Pengujian mencakup:

* Start Exam
* Resume
* Auto Save
* Randomization
* Timer
* Submit
* Auto Submit
* Concurrent Users
* Offline Recovery
* Failover
* Load Test

Target load test MVP minimal **1.000 concurrent active exam sessions** dengan kemampuan scaling horizontal.

---

# 38. Anti-Patterns

Tidak diperbolehkan:

* Timer berdasarkan waktu client.
* Randomisasi ulang saat resume.
* Menyimpan jawaban hanya di frontend.
* Menghitung skor di client.
* Mengubah session tanpa validasi.
* Sticky session sebagai syarat runtime.
* Menghapus session sebelum audit selesai.

---

# 39. Runtime Checklist

Sebelum implementasi:

* Session Engine tersedia.
* Randomization Engine tersedia.
* Auto Save aktif.
* Resume Engine aktif.
* Timer menggunakan server.
* Submission idempotent.
* Redis digunakan untuk runtime state.
* Audit Log aktif.
* Monitoring aktif.
* Load Test dilakukan.

---

# 40. Relationship dengan Arsitektur Lain

CBT Runtime merupakan pusat eksekusi ujian dan berinteraksi dengan berbagai komponen backend.

```text
Authentication

↓

Exam Management

↓

CBT Runtime

↓

Question Bank

↓

Scoring

↓

Analytics

↓

Ranking

↓

Notification
```

CBT Runtime juga menghasilkan event yang dikonsumsi oleh AI Recommendation, Learning Analytics, dan Achievement System.

---

# 41. Summary

CBT Runtime Architecture YakinLulus.id menggunakan pendekatan **Stateless Runtime + Redis Session Cache + PostgreSQL Persistent Storage**.

Arsitektur ini memberikan:

* Distribusi soal yang konsisten dan tidak berubah selama ujian.
* Timer yang sepenuhnya dikendalikan server.
* Auto Save dan Resume yang andal.
* Dukungan randomisasi soal dan opsi jawaban.
* Fondasi untuk anti-cheat, analytics, adaptive testing, dan skala ribuan peserta secara bersamaan.
