# Result Analytics API

**Document** : `api/14_result_analytics_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Result Analytics API** pada YakinLulus.id.

Result Analytics bertanggung jawab menyediakan seluruh data analitik setelah proses scoring selesai.

Analytics digunakan oleh:

- Student Dashboard
- Teacher Dashboard
- School Dashboard
- Admin Dashboard
- AI Recommendation Engine (Future)

Analytics bersifat **read-optimized** dan dipisahkan dari proses scoring agar tidak membebani sistem CBT Runtime.

---

# 2. Scope

Result Analytics mencakup:

- Ringkasan hasil ujian
- Statistik peserta
- Analisis mata pelajaran
- Analisis bab
- Analisis tingkat kesulitan
- Distribusi nilai
- Progress belajar
- Perbandingan hasil
- Riwayat ujian

---

# 3. Architecture

```text
           Scoring Service
                  │
                  ▼
        Analytics Event Queue
                  │
                  ▼
        Analytics Worker Service
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
  Aggregation  Statistics  Trend
                  │
                  ▼
         Analytics Database
                  │
                  ▼
      Result Analytics API
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   Student     Teacher      Admin
```

---

# 4. Analytics Flow

```text
Scoring Completed

↓

Publish Event

↓

Analytics Worker

↓

Aggregate Data

↓

Generate Statistics

↓

Store Analytics

↓

Dashboard API
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| GET | /analytics/results/{sessionId} | Detail hasil ujian |
| GET | /analytics/student/{studentId} | Statistik siswa |
| GET | /analytics/exams/{examId} | Statistik ujian |
| GET | /analytics/subjects/{subjectId} | Statistik mata pelajaran |
| GET | /analytics/chapters | Analisis bab |
| GET | /analytics/history | Riwayat ujian |
| GET | /analytics/dashboard | Dashboard ringkasan |

---

# 6. Student Result

```http
GET /api/v1/analytics/results/{sessionId}
```

Response

```json
{
  "success": true,
  "data": {
    "score": 88,
    "correct": 35,
    "wrong": 5,
    "blank": 0,
    "rank": 18,
    "passed": true
  }
}
```

---

# 7. Student Performance

```http
GET /api/v1/analytics/student/{studentId}
```

Response

```json
{
  "averageScore": 82.4,
  "totalExam": 15,
  "highestScore": 95,
  "lowestScore": 71,
  "completionRate": 100
}
```

---

# 8. Subject Analytics

```http
GET /api/v1/analytics/subjects/{subjectId}
```

Data yang disediakan:

- Nilai rata-rata
- Tingkat kelulusan
- Jumlah peserta
- Distribusi nilai
- Trend performa

---

# 9. Chapter Analytics

Analisis berdasarkan bab.

Contoh:

```text
Bab 1 : 95%

Bab 2 : 72%

Bab 3 : 58%

Bab 4 : 90%
```

Data ini menjadi dasar rekomendasi belajar.

---

# 10. Difficulty Analytics

Analisis berdasarkan tingkat kesulitan.

```text
Easy

Correct : 95%

Medium

Correct : 72%

Hard

Correct : 41%
```

Digunakan untuk mengevaluasi kualitas soal dan kemampuan peserta.

---

# 11. Exam Analytics

```http
GET /api/v1/analytics/exams/{examId}
```

Response

```json
{
  "participant": 250,
  "averageScore": 78.5,
  "highestScore": 100,
  "lowestScore": 28,
  "passRate": 82
}
```

---

# 12. History API

```http
GET /api/v1/analytics/history
```

Menampilkan histori ujian pengguna.

Filter:

- Mata pelajaran
- Rentang tanggal
- Jenis ujian
- Tahun ajaran

---

# 13. Dashboard API

```http
GET /api/v1/analytics/dashboard
```

Data ringkasan:

```text
Total Exam

Average Score

Last Exam

Best Subject

Weakest Subject

Learning Progress
```

---

# 14. Trend Analytics

Data trend:

```text
Exam 1

↓

Exam 2

↓

Exam 3

↓

Exam 4
```

Ditampilkan dalam bentuk grafik pada dashboard.

---

# 15. Comparison Analytics

Mendukung perbandingan:

- Antar ujian
- Antar mata pelajaran
- Antar periode
- Antar kelas
- Antar sekolah (sesuai hak akses)

---

# 16. Aggregation Strategy

Analytics disimpan dalam bentuk agregasi.

```text
Raw Result

↓

Aggregation Worker

↓

Analytics Table

↓

Dashboard
```

Dashboard tidak membaca langsung tabel hasil mentah (raw result).

---

# 17. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | Data milik sendiri |
| Teacher | Data siswa yang diampu |
| Admin | Data sekolah |
| Super Admin | Seluruh data |

---

# 18. Error Code

```text
RESULT_NOT_FOUND

ANALYTICS_NOT_READY

ACCESS_DENIED

INVALID_PERIOD

EXAM_NOT_FOUND
```

---

# 19. Security Consideration

API menerapkan:

- JWT Authentication
- RBAC Authorization
- Data Isolation
- Audit Logging
- Aggregated Data Access
- Rate Limiting

Data siswa tidak boleh dapat diakses oleh pengguna yang tidak berwenang.

---

# 20. Audit Logging

Aktivitas yang dicatat:

- Dashboard Access
- Result View
- Analytics Export
- Trend Request
- Comparison Request

---

# 21. Performance Strategy

Optimasi:

- Redis Cache
- Materialized Analytics Table
- Pre-computed Aggregation
- Read Replica
- Pagination
- CDN untuk aset dashboard

Target:

| Endpoint | Target P95 |
|----------|------------|
| Dashboard | < 150 ms |
| Student Analytics | < 150 ms |
| Exam Analytics | < 200 ms |
| History | < 200 ms |

---

# 22. Scalability Consideration

Dirancang untuk:

- Jutaan hasil ujian
- Ratusan juta record analytics
- Horizontal Read Scaling
- Event-driven Aggregation
- Distributed Cache
- Multi Tenant

Analytics dapat dipisahkan menjadi layanan BI (Business Intelligence) di masa depan tanpa mengubah API.

---

# 23. Future Evolution

Roadmap:

- AI Learning Recommendation
- Predictive Score
- Knowledge Gap Analysis
- Bloom Taxonomy Analytics
- Item Analysis
- Psychometric Dashboard
- Parent Dashboard
- Institutional Benchmark
- National Benchmark
- Real-time Analytics

---

# Summary

Result Analytics API menyediakan layanan analitik yang terpisah dari proses CBT Runtime dan Scoring.

Karakteristik utama:

- Menggunakan arsitektur read-optimized.
- Memanfaatkan agregasi data untuk performa tinggi.
- Menyediakan analisis siswa, ujian, mata pelajaran, bab, dan tren.
- Mendukung dashboard multi-level berdasarkan RBAC.
- Menjadi fondasi bagi AI Recommendation Engine dan sistem analitik pembelajaran di masa depan.
