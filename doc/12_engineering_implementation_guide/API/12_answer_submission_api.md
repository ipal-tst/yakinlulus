# Answer Submission API

**Document** : `api/12_answer_submission_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Answer Submission API** pada YakinLulus.id.

Modul ini bertanggung jawab terhadap seluruh proses penyimpanan jawaban peserta selama ujian berlangsung, termasuk:

- Auto Save
- Manual Save
- Final Submission
- Answer Validation
- Offline Synchronization
- Idempotency
- Queue Processing
- Audit Trail

API ini merupakan komponen kritikal karena bertanggung jawab menjaga integritas jawaban peserta.

---

# 2. Scope

Answer Submission menangani:

- Penyimpanan jawaban
- Perubahan jawaban
- Flag soal
- Sinkronisasi offline
- Final submit
- Validasi session
- Validasi timer
- Pengiriman ke Scoring Pipeline

---

# 3. Architecture

```text
          Student

             │

             ▼

     Answer Submission API

             │

    ┌────────┼─────────┐

    ▼        ▼         ▼

Validation  Queue   Sync Engine

             │

             ▼

      Runtime Database

             │

             ▼

       Scoring Queue
```

---

# 4. Submission Flow

```text
Open Question

↓

Select Answer

↓

Auto Save

↓

Update Runtime State

↓

Continue Exam

↓

Final Submit

↓

Scoring Pipeline
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| POST | /runtime/sessions/{id}/answers | Simpan jawaban |
| PATCH | /runtime/sessions/{id}/answers/{questionId} | Ubah jawaban |
| GET | /runtime/sessions/{id}/answers | Daftar jawaban |
| POST | /runtime/sessions/{id}/flag | Tandai soal |
| DELETE | /runtime/sessions/{id}/flag/{questionId} | Hapus tanda |
| POST | /runtime/sessions/{id}/submit | Final submit |
| POST | /runtime/sessions/{id}/sync | Sinkronisasi offline |

---

# 6. Save Answer

```http
POST /api/v1/runtime/sessions/{sessionId}/answers
```

Request

```json
{
  "questionId": "q_001",
  "selectedOption": "B",
  "clientTimestamp": "2026-08-01T08:15:20Z"
}
```

Response

```json
{
  "success": true,
  "data": {
    "saved": true,
    "version": 3,
    "serverTimestamp": "2026-08-01T08:15:21Z"
  }
}
```

---

# 7. Update Answer

Peserta dapat mengubah jawaban selama:

- Session aktif
- Timer belum habis
- Belum final submit

```http
PATCH /api/v1/runtime/sessions/{sessionId}/answers/{questionId}
```

Jawaban lama digantikan oleh jawaban terbaru.

---

# 8. Answer Model

```text
Exam Session

↓

Question

↓

Selected Answer

↓

Version

↓

Updated Time
```

Setiap perubahan meningkatkan nomor versi.

---

# 9. Idempotency

Setiap request wajib memiliki:

```http
Idempotency-Key
```

Contoh:

```text
Idempotency-Key:
9a8d1a2e-74f8-4d2b-bc98-f13c5d4e91b2
```

Tujuan:

- Mencegah duplikasi penyimpanan
- Aman terhadap retry
- Aman terhadap gangguan jaringan

---

# 10. Auto Save

Auto Save dilakukan:

- Saat jawaban berubah
- Saat berpindah soal
- Secara periodik (misalnya setiap 30 detik)

Auto Save tidak mengganggu pengalaman pengguna.

---

# 11. Get Answer

```http
GET /api/v1/runtime/sessions/{sessionId}/answers
```

Response

```json
{
  "success": true,
  "data": [
    {
      "questionId": "q_001",
      "selectedOption": "B",
      "flagged": false
    }
  ]
}
```

---

# 12. Flag Question

```http
POST /api/v1/runtime/sessions/{sessionId}/flag
```

Request

```json
{
  "questionId": "q_001"
}
```

Digunakan untuk menandai soal yang ingin ditinjau kembali.

---

# 13. Final Submit

```http
POST /api/v1/runtime/sessions/{sessionId}/submit
```

Validasi:

- Session aktif
- Belum submit
- Timer valid

Proses:

```text
Lock Session

↓

Freeze Answer

↓

Queue Scoring

↓

Response Success
```

---

# 14. Offline Synchronization

```http
POST /api/v1/runtime/sessions/{sessionId}/sync
```

Request

```json
{
  "answers": [
    {
      "questionId": "q_001",
      "selectedOption": "C",
      "version": 7
    }
  ]
}
```

Server akan melakukan merge berdasarkan nomor versi.

---

# 15. Conflict Resolution

Jika terjadi konflik:

```text
Server Version

↓

Compare Version

↓

Newest Wins

↓

Update Runtime State
```

Alternatif lain dapat diterapkan pada fitur tertentu menggunakan strategi berbasis timestamp atau event sourcing di masa depan.

---

# 16. Submission Validation

Sebelum jawaban disimpan:

- Session valid
- Question milik session
- Option valid
- Timer belum habis
- Belum final submit

---

# 17. Runtime State

```text
Running

↓

Saving

↓

Saved

↓

Submitted

↓

Scored
```

Setelah status `Submitted`, jawaban tidak dapat diubah.

---

# 18. Error Code

Contoh:

```text
INVALID_QUESTION

QUESTION_NOT_IN_SESSION

ANSWER_ALREADY_SUBMITTED

SESSION_EXPIRED

INVALID_OPTION

SESSION_LOCKED

TIME_EXPIRED
```

---

# 19. Security Consideration

API menerapkan:

- JWT Authentication
- Session Validation
- Answer Ownership Validation
- Idempotency
- Replay Protection
- Audit Logging
- Rate Limiting
- Input Validation

Jawaban hanya dapat diubah oleh pemilik session.

---

# 20. Audit Logging

Aktivitas yang dicatat:

- Save Answer
- Update Answer
- Flag Question
- Unflag Question
- Final Submit
- Offline Sync
- Conflict Resolution
- Auto Submit

---

# 21. Performance Strategy

Optimasi:

- Batch Save
- Redis Runtime Cache
- Queue Processing
- Compression
- Delta Synchronization
- Connection Pool

Target performa:

| Endpoint | Target P95 |
|----------|------------|
| Save Answer | < 100 ms |
| Update Answer | < 100 ms |
| Get Answer | < 100 ms |
| Final Submit | < 500 ms |

---

# 22. Scalability Consideration

Dirancang untuk mendukung:

- Jutaan jawaban per hari
- Ribuan request per detik
- Horizontal Scaling
- Stateless API
- Distributed Cache
- Queue-based Processing

Answer Submission dapat dipisahkan menjadi microservice tanpa mengubah kontrak API.

---

# 23. Future Evolution

Roadmap:

- Event Sourcing
- Incremental Sync
- WebSocket Confirmation
- AI Cheating Detection
- Real-time Monitoring
- Edge Synchronization
- Conflict Visualization
- CRDT-based Offline Sync

---

# Summary

Answer Submission API memastikan setiap jawaban peserta tersimpan secara aman, konsisten, dan dapat dipulihkan.

Karakteristik utama:

- Mendukung Auto Save dan Manual Save.
- Menggunakan Idempotency untuk mencegah duplikasi.
- Mendukung Offline Synchronization.
- Memvalidasi session dan timer sebelum penyimpanan.
- Mengirim hasil akhir ke Scoring Pipeline setelah Final Submit.
- Dirancang untuk skala enterprise dengan performa tinggi dan siap diekstraksi menjadi microservice di masa depan.
