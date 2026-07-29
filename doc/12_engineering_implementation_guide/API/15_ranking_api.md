# Ranking API

**Document** : `api/15_ranking_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Ranking API** pada YakinLulus.id.

Ranking API bertanggung jawab menghasilkan peringkat peserta berdasarkan hasil ujian yang telah selesai diproses oleh **Scoring Service**.

Ranking merupakan layanan **read-only** yang dibangun di atas data hasil scoring dan analytics. API ini tidak melakukan proses perhitungan nilai.

Tujuan utama:

- Menampilkan ranking siswa
- Menampilkan leaderboard
- Menampilkan ranking kelas
- Menampilkan ranking sekolah
- Menampilkan ranking nasional (Future)
- Mendukung gamification

---

# 2. Scope

Ranking API mencakup:

- Leaderboard ujian
- Ranking kelas
- Ranking sekolah
- Ranking mata pelajaran
- Ranking periode
- Personal Rank
- Top Performer
- Historical Ranking

---

# 3. Architecture

```text
          Scoring Service

                 │

                 ▼

        Analytics Worker

                 │

                 ▼

        Ranking Calculator

                 │

      ┌──────────┼───────────┐

      ▼          ▼           ▼

 Leaderboard  Statistics   Cache

                 │

                 ▼

          Ranking Database

                 │

                 ▼

            Ranking API
```

---

# 4. Ranking Flow

```text
Scoring Completed

↓

Publish Event

↓

Ranking Worker

↓

Calculate Ranking

↓

Store Ranking Snapshot

↓

Leaderboard API
```

Ranking dihitung secara asynchronous sehingga tidak membebani proses scoring.

---

# 5. Ranking Strategy

Ranking dihitung berdasarkan:

```text
Final Score

↓

Correct Answer

↓

Completion Time

↓

Submission Time
```

Urutan prioritas:

1. Nilai tertinggi
2. Jawaban benar terbanyak
3. Waktu pengerjaan tercepat
4. Waktu submit paling awal

Seluruh aturan bersifat configurable.

---

# 6. Ranking Snapshot

Ranking menggunakan **snapshot**.

```text
Exam Closed

↓

Generate Snapshot

↓

Freeze Ranking

↓

Publish
```

Setelah snapshot dibuat, ranking tidak berubah kecuali dilakukan proses recalculation resmi.

---

# 7. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| GET | /ranking/exams/{examId} | Ranking ujian |
| GET | /ranking/classes/{classId} | Ranking kelas |
| GET | /ranking/schools/{schoolId} | Ranking sekolah |
| GET | /ranking/students/me | Ranking pribadi |
| GET | /ranking/top | Top performer |
| GET | /ranking/history | Riwayat ranking |

---

# 8. Exam Leaderboard

```http
GET /api/v1/ranking/exams/{examId}
```

Query Parameter

```text
page

pageSize

search

limit
```

Response

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "studentId": "stu_001",
      "studentName": "Budi",
      "score": 98,
      "correct": 39,
      "completionTime": 4250
    }
  ]
}
```

---

# 9. Personal Ranking

```http
GET /api/v1/ranking/students/me
```

Response

```json
{
  "success": true,
  "data": {
    "currentRank": 18,
    "totalParticipant": 250,
    "percentile": 92.8
  }
}
```

---

# 10. Class Ranking

```http
GET /api/v1/ranking/classes/{classId}
```

Data:

- Ranking siswa
- Nilai
- Persentase
- Status kelulusan

---

# 11. School Ranking

```http
GET /api/v1/ranking/schools/{schoolId}
```

Menampilkan:

- Top Student
- Average Score
- Passing Rate
- Total Participant

---

# 12. Top Performer

```http
GET /api/v1/ranking/top
```

Parameter:

```text
period

subject

grade

school

limit
```

Contoh:

```text
Top 10 Mingguan

Top 100 Bulanan

Top Nasional (Future)
```

---

# 13. Ranking History

```http
GET /api/v1/ranking/history
```

Menampilkan perubahan ranking dari waktu ke waktu.

Data:

- Sebelum
- Sesudah
- Perubahan posisi
- Tanggal

---

# 14. Ranking Calculation

Formula default:

```text
Score DESC

↓

Correct DESC

↓

Completion Time ASC

↓

Submission Time ASC
```

Administrator dapat mengubah aturan melalui konfigurasi sistem.

---

# 15. Ranking Visibility

Konfigurasi exam menentukan apakah ranking ditampilkan.

Pilihan:

```text
Hidden

↓

Personal Only

↓

Class

↓

School

↓

Public
```

Hal ini penting untuk menyesuaikan kebijakan institusi pendidikan.

---

# 16. Cache Strategy

Leaderboard disimpan di Redis.

```text
Ranking Snapshot

↓

Redis Cache

↓

API

↓

Client
```

Cache diperbarui saat snapshot baru dipublikasikan.

---

# 17. Pagination

Leaderboard besar wajib menggunakan pagination.

Default:

```text
Page Size = 20

Max = 100
```

Untuk peringkat teratas dapat digunakan parameter `limit`.

---

# 18. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | Ranking sesuai kebijakan exam |
| Teacher | Ranking kelas/sekolah yang diampu |
| Admin | Ranking sekolah |
| Super Admin | Seluruh ranking |

---

# 19. Error Code

```text
RANKING_NOT_READY

RANKING_NOT_AVAILABLE

EXAM_NOT_FOUND

ACCESS_DENIED

INVALID_PERIOD
```

---

# 20. Audit Logging

Aktivitas yang dicatat:

- Ranking Generated
- Ranking Viewed
- Ranking Export
- Ranking Recalculated
- Visibility Changed

---

# 21. Security Consideration

API menerapkan:

- JWT Authentication
- RBAC Authorization
- Ranking Snapshot Validation
- Audit Logging
- Rate Limiting
- Cache Validation

Data ranking mengikuti kebijakan privasi dan pengaturan visibilitas yang ditentukan oleh penyelenggara ujian.

---

# 22. Performance Strategy

Optimasi:

- Redis Cache
- Snapshot Table
- Read Replica
- Cursor Pagination (Future)
- Compression

Target performa:

| Endpoint | Target P95 |
|----------|------------|
| Leaderboard | < 150 ms |
| Personal Rank | < 100 ms |
| Top Performer | < 150 ms |
| Ranking History | < 200 ms |

---

# 23. Scalability Consideration

Dirancang untuk:

- Jutaan peserta
- Multi School
- Multi Tenant
- Distributed Cache
- Horizontal Read Scaling
- Event-driven Ranking Calculation

Perhitungan ranking dipisahkan dari API sehingga API hanya melayani permintaan baca (read-only).

---

# 24. Future Evolution

Roadmap:

- National Leaderboard
- Regional Leaderboard
- Achievement Badge
- Seasonal Competition
- Gamification Engine
- AI Performance Benchmark
- Predictive Ranking
- Real-time Leaderboard
- Tournament Mode

---

# Summary

Ranking API menyediakan layanan leaderboard yang cepat, konsisten, dan skalabel.

Karakteristik utama:

- Dibangun di atas hasil Scoring dan Analytics.
- Menggunakan snapshot untuk menjaga konsistensi data.
- Mendukung ranking personal, kelas, sekolah, dan leaderboard.
- Memanfaatkan Redis Cache untuk performa tinggi.
- Siap berkembang menjadi sistem gamification dan kompetisi berskala nasional.
