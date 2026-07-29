# Scoring API

**Document** : `api/13_scoring_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Scoring API** pada YakinLulus.id.

Scoring API bertanggung jawab terhadap proses penilaian hasil ujian setelah peserta melakukan **Final Submit**.

Layanan ini dirancang agar:

- Akurat
- Deterministik
- Idempotent
- Asynchronous
- Horizontal Scalable

Scoring API tidak melakukan proses pengerjaan ujian. Seluruh data berasal dari **Answer Submission Service** dan **Question Set** yang telah dibekukan (frozen).

---

# 2. Scope

Scoring API menangani:

- Auto Grading
- Score Calculation
- Passing Score Evaluation
- Score Normalization
- Grade Calculation
- Ranking Preparation
- Result Generation
- Score Publishing

---

# 3. Architecture Overview

```text
           Final Submit
                 │
                 ▼
        Answer Submission
                 │
                 ▼
          Scoring Queue
                 │
                 ▼
          Scoring Worker
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
 Answer Key  Score Rule  Analytics
                 │
                 ▼
          Result Database
```

---

# 4. Scoring Flow

```text
Final Submit

↓

Freeze Answer

↓

Queue Job

↓

Scoring Worker

↓

Auto Grading

↓

Calculate Score

↓

Store Result

↓

Publish Event
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| POST | /scoring/process/{sessionId} | Proses scoring |
| GET | /scoring/result/{sessionId} | Detail hasil |
| GET | /scoring/status/{sessionId} | Status scoring |
| POST | /scoring/recalculate/{sessionId} | Hitung ulang |
| GET | /scoring/statistics | Statistik scoring |

---

# 6. Scoring Trigger

Scoring dimulai ketika:

- Final Submit
- Auto Submit
- Admin Force Submit

Semua proses dilakukan melalui Queue Worker agar tidak memperlambat response ke pengguna.

---

# 7. Auto Grading

MVP mendukung:

```text
Single Choice
```

Logika:

```text
Selected Answer

↓

Compare

↓

Answer Key

↓

Correct / Incorrect
```

Roadmap:

- Multiple Choice
- Essay
- AI Assisted Essay
- Coding Question

---

# 8. Score Formula

Contoh konfigurasi:

```text
Correct Answer : +4

Wrong Answer : 0

Blank : 0
```

Atau:

```text
Correct : +1

Wrong : -0.25

Blank : 0
```

Formula ditentukan pada konfigurasi Exam.

---

# 9. Scoring Rule

```text
Answer

↓

Validate

↓

Grade

↓

Calculate Raw Score

↓

Normalize (Optional)

↓

Final Score
```

---

# 10. Passing Score Evaluation

Setelah skor dihitung:

```text
Score

↓

Passing Score

↓

Passed

atau

Not Passed
```

Contoh:

```text
Passing Score = 75
```

---

# 11. Result Object

Contoh:

```json
{
  "sessionId": "ses_001",
  "rawScore": 82,
  "finalScore": 82,
  "correct": 34,
  "wrong": 6,
  "blank": 0,
  "passed": true
}
```

---

# 12. Scoring Status

Status:

```text
Queued

↓

Processing

↓

Completed

↓

Published
```

Jika terjadi kegagalan:

```text
Failed
```

Worker dapat melakukan retry.

---

# 13. Get Scoring Status

```http
GET /api/v1/scoring/status/{sessionId}
```

Response

```json
{
  "status": "processing"
}
```

---

# 14. Get Result

```http
GET /api/v1/scoring/result/{sessionId}
```

Response

```json
{
  "success": true,
  "data": {
    "score": 82,
    "correct": 34,
    "wrong": 6,
    "blank": 0,
    "passed": true
  }
}
```

Ketersediaan hasil mengikuti konfigurasi exam (`showResult`).

---

# 15. Recalculate Score

```http
POST /api/v1/scoring/recalculate/{sessionId}
```

Digunakan ketika:

- Answer Key berubah (sesuai kebijakan)
- Terjadi bug scoring
- Audit akademik

Seluruh proses dicatat pada Audit Log.

---

# 16. Idempotency

Setiap Session hanya memiliki satu hasil scoring aktif.

Jika request diproses ulang:

```text
Session

↓

Already Scored?

↓

Yes

↓

Return Existing Result
```

Atau lakukan recalculation melalui endpoint khusus.

---

# 17. Error Code

Contoh:

```text
SCORING_NOT_FOUND

SCORING_IN_PROGRESS

SESSION_NOT_SUBMITTED

ANSWER_KEY_NOT_FOUND

INVALID_SCORING_RULE

RESULT_NOT_PUBLISHED
```

---

# 18. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | Melihat hasil sendiri (sesuai kebijakan exam) |
| Teacher | Melihat hasil peserta yang diampu |
| Admin | Full Access |
| Super Admin | Full Access |

---

# 19. Audit Logging

Dicatat:

- Scoring Started
- Scoring Completed
- Recalculate
- Publish Result
- Failed Job
- Retry Job
- Rule Version

---

# 20. Security Consideration

API menerapkan:

- JWT Authentication
- RBAC Authorization
- Immutable Result Snapshot
- Audit Logging
- Idempotent Processing
- Queue Isolation
- Input Validation

Answer Key tidak pernah dikirim ke client.

---

# 21. Performance Strategy

Optimasi:

- Background Worker
- Parallel Processing
- Batch Scoring
- Redis Cache
- Queue Partition
- Database Index

Target:

| Endpoint | Target P95 |
|----------|------------|
| Status | < 50 ms |
| Result | < 150 ms |
| Queue Delay | < 2 detik |
| Scoring Time (40 soal) | < 500 ms |

---

# 22. Scalability Consideration

Dirancang untuk:

- Jutaan sesi ujian
- Horizontal Worker Scaling
- Distributed Queue
- Event Driven Architecture
- Multi Region Deployment
- Future Microservice

Worker dapat ditambah tanpa memengaruhi API.

---

# 23. Future Evolution

Roadmap:

- AI Essay Scoring
- Partial Credit
- Adaptive Scoring
- IRT (Item Response Theory)
- Weighted Question
- Bloom Taxonomy Analysis
- Psychometric Analysis
- Distributed Scoring Cluster

---

# Summary

Scoring API menyediakan mekanisme penilaian otomatis yang cepat, akurat, dan skalabel.

Karakteristik utama:

- Dipicu setelah Final Submit.
- Diproses secara asynchronous melalui Queue Worker.
- Mendukung formula penilaian yang dapat dikonfigurasi.
- Menghasilkan snapshot hasil yang bersifat immutable.
- Mendukung recalculation untuk kebutuhan audit.
- Siap berkembang menuju sistem penilaian adaptif dan analisis psikometrik tingkat enterprise.
