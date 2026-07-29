# 22_analytics_architecture.md

# YakinLulus.id Analytics Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Analytics Engine** pada platform YakinLulus.id.

Analytics merupakan salah satu core capability platform yang bertugas mengubah seluruh aktivitas pengguna menjadi insight yang dapat digunakan oleh:

* Student
* Teacher
* School
* Admin
* AI Recommendation Engine
* Product Team

Analytics tidak hanya menghasilkan laporan, tetapi juga menjadi fondasi bagi **Adaptive Learning**, **Learning Recommendation**, dan **Business Intelligence**.

---

# 2. Objectives

Analytics Architecture dirancang untuk:

* Real-Time Analytics
* Historical Analytics
* Learning Analytics
* Question Analytics
* Exam Analytics
* Performance Analytics
* AI Ready
* Scalable

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Event Driven
* Read Optimized
* Write Once
* Immutable Events
* Aggregation Based
* Near Real-Time
* Observable
* Extensible

---

# 4. High Level Architecture

```text id="a1m5qc"
Business Event

↓

Analytics Event Bus

↓

Analytics Worker

↓

Aggregation

↓

Analytics Database

↓

Dashboard API
```

Analytics dipisahkan dari business transaction agar tidak memperlambat proses utama.

---

# 5. Analytics Components

Komponen utama:

* Event Publisher
* Analytics Queue
* Analytics Worker
* Aggregation Engine
* Metrics Engine
* Statistics Service
* Dashboard Service
* Report Generator

---

# 6. Directory Structure

```text id="m6v2kr"
internal/

modules/

analytics/

controller/

service/

repository/

worker/

aggregator/

metrics/

dashboard/

dto/
```

---

# 7. Analytics Flow

```text id="v3q7jt"
Business Event

↓

Queue

↓

Worker

↓

Aggregation

↓

Analytics Table

↓

Dashboard
```

---

# 8. Event Sources

Analytics menerima event dari:

* Authentication
* Question Bank
* CBT Runtime
* Learning Material
* Notification
* AI Service
* Import Pipeline
* User Management

---

# 9. Event Types

Contoh event:

```text id="g9r2fx"
user.login

exam.started

exam.finished

question.answered

material.opened

material.completed

achievement.unlocked

question.generated
```

---

# 10. Event Entity

Tabel:

```text id="j4k8py"
analytics_events
```

Kolom utama:

* id
* event_name
* user_id
* module
* payload
* occurred_at
* processed_at

Payload menggunakan JSONB agar fleksibel.

---

# 11. Event Processing

Semua event diproses asynchronous.

```text id="x8n1dw"
Event

↓

Redis Queue

↓

Analytics Worker

↓

Aggregation
```

Business request tidak menunggu analytics selesai.

---

# 12. Aggregation Strategy

Analytics menggunakan:

* Hourly Aggregation
* Daily Aggregation
* Weekly Aggregation
* Monthly Aggregation

Data agregasi disimpan pada tabel khusus.

---

# 13. Analytics Storage

Terdapat dua jenis data:

**Raw Event**

* Immutable
* Audit
* Replay

**Aggregated Data**

* Dashboard
* Statistics
* Reports

Pendekatan ini memudahkan rekalkulasi jika algoritma berubah.

---

# 14. Student Analytics

Metric utama:

* Study Time
* Exam Count
* Average Score
* Highest Score
* Lowest Score
* Progress
* Mastery Level
* Learning Streak

---

# 15. Exam Analytics

Metric:

* Average Score
* Median Score
* Highest Score
* Lowest Score
* Pass Rate
* Completion Rate
* Average Duration

---

# 16. Question Analytics

Metric:

* Correct Rate
* Wrong Rate
* Skip Rate
* Average Answer Time
* Difficulty Index
* Discrimination Index (Future)
* Distractor Effectiveness

Data ini digunakan untuk meningkatkan kualitas bank soal.

---

# 17. Material Analytics

Metric:

* View Count
* Completion Rate
* Average Reading Time
* Download Count
* Video Completion
* Bookmark Count

---

# 18. Teacher Analytics

Metric:

* Questions Created
* Exams Created
* Student Average
* Review Time
* Approval Rate

---

# 19. School Analytics

Metric:

* Active Students
* Active Teachers
* Exam Participation
* Average Score
* Learning Completion
* Daily Activity

---

# 20. Dashboard Analytics

Dashboard mengambil data dari tabel agregasi.

```text id="w2h6lz"
Dashboard

↓

Aggregated Tables

↓

Response
```

Dashboard tidak membaca raw event secara langsung.

---

# 21. Ranking Engine

Analytics menyediakan data untuk:

* National Ranking
* School Ranking
* Class Ranking
* Subject Ranking

Perhitungan ranking dilakukan melalui worker terjadwal.

---

# 22. Learning Progress

Progress dihitung berdasarkan:

* Material Completed
* Exam Completed
* Mastery Score
* XP
* Achievement

Progress digunakan untuk visualisasi dashboard siswa.

---

# 23. Weak Topic Detection

Analytics mendeteksi:

* Bab lemah
* Mata pelajaran lemah
* Pola kesalahan
* Topik yang sering gagal

Data ini menjadi input AI Recommendation.

---

# 24. Learning Recommendation

Future:

```text id="q7v5nk"
Analytics

↓

Recommendation Engine

↓

Personalized Learning
```

Sistem memberikan rekomendasi materi dan soal berdasarkan histori belajar.

---

# 25. AI Analytics

Metric:

* Generated Questions
* Approval Rate
* Rejection Rate
* Average Review Time
* AI Accuracy
* Token Usage

---

# 26. Import Analytics

Metric:

* Imported Questions
* Failed Import
* Validation Error
* Duplicate Rate

---

# 27. Notification Analytics

Metric:

* Delivery Rate
* Open Rate
* Click Rate (Future)
* Read Rate

---

# 28. Time Series Data

Seluruh analytics disimpan dengan dimensi waktu.

```text id="r3d8ua"
Hour

Day

Week

Month

Year
```

Memudahkan pembuatan tren dan laporan periodik.

---

# 29. Analytics API

Endpoint:

```text id="e5x4mf"
GET /analytics/student

GET /analytics/exam

GET /analytics/question

GET /analytics/dashboard
```

Semua endpoint mengikuti RBAC.

---

# 30. Dashboard Cache

Dashboard populer di-cache menggunakan Redis.

TTL:

```text id="f9k1sb"
5 Minutes
```

Cache dibersihkan ketika agregasi utama diperbarui.

---

# 31. Scheduled Aggregation

Background Job:

```text id="c4w7yj"
Every Hour

↓

Aggregation

↓

Refresh Dashboard
```

Job tambahan dijalankan setiap hari dan setiap bulan.

---

# 32. Reporting

Analytics menghasilkan:

* Daily Report
* Weekly Report
* Monthly Report
* Semester Report
* Academic Year Report

Report dapat diekspor ke Excel dan PDF.

---

# 33. Logging

Analytics mencatat:

* Event Count
* Processing Duration
* Aggregation Duration
* Failure Count
* Queue Length

Payload besar tidak ditulis ke log aplikasi.

---

# 34. Monitoring

Metric:

* Events per Minute
* Queue Length
* Processing Time
* Aggregation Time
* Dashboard Latency
* Failed Event Count

Monitoring menggunakan Prometheus dan Grafana.

---

# 35. Security

Analytics mengikuti RBAC.

Contoh:

Student:

* Hanya melihat datanya sendiri.

Teacher:

* Melihat kelas yang menjadi tanggung jawabnya.

School Admin:

* Melihat data sekolah.

Platform Admin:

* Melihat seluruh tenant.

---

# 36. Scalability

Worker analytics dapat ditambah.

```text id="k8t2vr"
Queue

↓

Worker A

Worker B

Worker C
```

Analytics tidak bergantung pada satu worker.

---

# 37. Future Roadmap

Roadmap:

* Predictive Analytics
* Learning Forecast
* Adaptive Learning Analytics
* AI Insight
* Cohort Analysis
* Heatmap Learning
* IRT Analytics
* Knowledge Graph Analytics
* Data Warehouse Integration

---

# 38. Anti-Patterns

Tidak diperbolehkan:

* Menjalankan query agregasi berat pada request pengguna.
* Mengubah raw event setelah disimpan.
* Dashboard membaca jutaan event secara langsung.
* Business Service menghitung analytics secara sinkron.
* Menghapus event tanpa kebijakan retensi yang jelas.

---

# 39. Analytics Checklist

Sebelum implementasi:

* Event Publisher tersedia.
* Queue digunakan.
* Aggregation Worker aktif.
* Dashboard menggunakan tabel agregasi.
* Cache tersedia.
* Monitoring aktif.
* Logging aktif.
* RBAC diterapkan.
* Unit & integration test tersedia.

---

# 40. Relationship dengan Arsitektur Lain

Analytics terintegrasi dengan hampir seluruh modul backend.

```text id="d6y9pb"
CBT Runtime

↓

Analytics

↓

Aggregation

↓

Dashboard

↓

AI Recommendation

↓

Adaptive Learning
```

Analytics juga mengonsumsi event dari Notification, AI Service, Import Pipeline, Authentication, dan Question Bank.

---

# 41. Data Retention Strategy

Retensi data direkomendasikan sebagai berikut:

| Data                  | Retensi  |
| --------------------- | -------- |
| Raw Analytics Event   | 24 bulan |
| Aggregated Daily      | 5 tahun  |
| Aggregated Monthly    | Permanen |
| Dashboard Cache       | 5 menit  |
| Temporary Worker Data | 24 jam   |

Retensi dapat disesuaikan berdasarkan kebutuhan operasional dan regulasi.

---

# 42. Summary

Analytics Architecture YakinLulus.id menggunakan pendekatan **Event-Driven Analytics** dengan **Asynchronous Aggregation Pipeline**.

Arsitektur ini memberikan:

* Pemrosesan analytics tanpa membebani transaksi utama.
* Dashboard yang cepat melalui tabel agregasi dan cache Redis.
* Fondasi untuk adaptive learning, AI recommendation, dan business intelligence.
* Skalabilitas tinggi melalui queue dan worker horizontal.
* Kemampuan evolusi menuju data warehouse, predictive analytics, dan machine learning tanpa perubahan besar pada backend utama.
