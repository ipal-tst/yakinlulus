# CBT Runtime API

**Document** : `api/11_cbt_runtime_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **CBT Runtime API** yang bertanggung jawab terhadap seluruh proses pelaksanaan ujian secara real-time.

CBT Runtime merupakan komponen yang berbeda dari Exam Management.

Perbedaannya:

- **Exam Management** → membuat dan mengatur ujian.
- **CBT Runtime** → menjalankan ujian.

CBT Runtime harus mampu menangani ribuan hingga jutaan peserta yang mengerjakan ujian secara bersamaan.

---

# 2. Scope

CBT Runtime menangani:

- Validasi peserta
- Membuat Exam Session
- Membentuk Question Set
- Sinkronisasi timer
- Navigasi soal
- Penyimpanan jawaban
- Auto submit
- Resume session
- Offline synchronization
- Monitoring runtime

---

# 3. Runtime Architecture

```text
           Student (Web / Mobile)
                    │
                    ▼
             CBT Runtime API
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 Session      Question Set     Timer
 Manager         Generator      Engine
      │             │             │
      └─────────────┼─────────────┘
                    ▼
           Runtime Database
                    │
                    ▼
                Redis Cache
```

---

# 4. Runtime Flow

```text
Student Login

↓

Start Exam

↓

Create Session

↓

Generate Question Set

↓

Start Timer

↓

Answer Questions

↓

Auto Save

↓

Submit

↓

Scoring Pipeline
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| POST | /runtime/exams/{id}/start | Memulai ujian |
| GET | /runtime/sessions/{id} | Detail session |
| GET | /runtime/sessions/{id}/questions | Daftar soal |
| GET | /runtime/sessions/{id}/timer | Status timer |
| POST | /runtime/sessions/{id}/heartbeat | Heartbeat |
| POST | /runtime/sessions/{id}/resume | Resume session |
| POST | /runtime/sessions/{id}/submit | Submit ujian |
| GET | /runtime/sessions/{id}/status | Status runtime |

---

# 6. Start Exam

```http
POST /api/v1/runtime/exams/{examId}/start
```

Validasi:

- User terdaftar sebagai peserta
- Exam sudah aktif
- Belum melewati batas waktu
- Belum pernah submit
- Device memenuhi kebijakan keamanan

Response

```json
{
  "success": true,
  "data": {
    "sessionId": "ses_001",
    "remainingTime": 5400,
    "startedAt": "2026-08-01T08:00:00Z"
  }
}
```

---

# 7. Session Creation

Saat ujian dimulai sistem membuat:

```text
Exam Session

↓

Question Set

↓

Timer

↓

Runtime State
```

Session bersifat immutable terhadap konfigurasi exam.

---

# 8. Question Set Generation

Question Set dibentuk menggunakan:

```text
Question Pool

↓

Randomization Rule

↓

Seed Generator

↓

Question Set
```

Karakteristik:

- Setiap peserta memperoleh urutan berbeda.
- Jumlah soal tetap sama.
- Seed disimpan untuk audit.
- Soal tidak berubah selama session berlangsung.

---

# 9. Get Question List

```http
GET /api/v1/runtime/sessions/{sessionId}/questions
```

Response

```json
{
  "success": true,
  "data": [
    {
      "number": 1,
      "questionId": "q_001",
      "flagged": false,
      "answered": true
    }
  ]
}
```

Isi soal lengkap dapat diambil secara bertahap (lazy loading) untuk mengurangi payload.

---

# 10. Timer API

```http
GET /api/v1/runtime/sessions/{sessionId}/timer
```

Response

```json
{
  "remainingTime": 5210,
  "serverTime": "2026-08-01T08:13:10Z"
}
```

Timer menggunakan waktu server sebagai sumber kebenaran (source of truth).

---

# 11. Heartbeat API

```http
POST /api/v1/runtime/sessions/{sessionId}/heartbeat
```

Fungsi:

- memperbarui aktivitas terakhir
- mendeteksi koneksi
- sinkronisasi waktu
- monitoring peserta

Interval:

```text
15–30 detik
```

---

# 12. Resume Session

```http
POST /api/v1/runtime/sessions/{sessionId}/resume
```

Digunakan ketika:

- browser refresh
- aplikasi crash
- reconnect
- berpindah jaringan

Response:

- posisi soal terakhir
- timer
- jawaban tersimpan
- status flag

---

# 13. Runtime Status

```http
GET /api/v1/runtime/sessions/{sessionId}/status
```

Contoh response

```json
{
  "status": "running",
  "answered": 18,
  "remaining": 22,
  "flagged": 4
}
```

---

# 14. Auto Submit

```http
POST /api/v1/runtime/sessions/{sessionId}/submit
```

Submit dapat dipicu oleh:

- peserta
- timer habis
- admin (opsional)
- force close

Setelah submit:

```text
Session

↓

Locked

↓

Scoring Queue

↓

Result Processing
```

---

# 15. Runtime State Machine

```text
Created

↓

Running

↓

Paused (Future)

↓

Resumed

↓

Submitted

↓

Scored

↓

Completed
```

Perubahan status hanya mengikuti alur di atas.

---

# 16. Session Recovery

Jika koneksi terputus:

```text
Reconnect

↓

Authenticate

↓

Validate Session

↓

Restore Runtime

↓

Continue Exam
```

Tidak dibuat session baru.

---

# 17. Offline Support

Mobile:

```text
Local Cache

↓

Queue Answer

↓

Reconnect

↓

Sync Answer
```

Web:

- menggunakan IndexedDB
- Service Worker
- Background Sync (jika didukung browser)

---

# 18. Runtime Validation

Validasi meliputi:

- Session aktif
- Token valid
- Exam masih berlangsung
- Timer belum habis
- Session belum submit

---

# 19. Error Code

Contoh:

```text
EXAM_NOT_ACTIVE

SESSION_NOT_FOUND

SESSION_FINISHED

TIME_EXPIRED

ALREADY_SUBMITTED

QUESTION_NOT_AVAILABLE

INVALID_RUNTIME_STATE
```

---

# 20. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | Runtime miliknya sendiri |
| Teacher | Monitoring (Read Only) |
| Admin | Monitoring & Force Action |
| Super Admin | Full Access |

---

# 21. Security Consideration

Runtime menerapkan:

- JWT Authentication
- Session Validation
- Device Validation
- Replay Protection
- Request Signature (Future)
- Fullscreen Detection
- Tab Switch Detection
- Auto Lock Session
- Audit Logging

---

# 22. Performance Strategy

Optimasi:

- Redis Session Cache
- Lazy Loading Question
- Delta Synchronization
- Compression
- Connection Pooling
- Batch Update
- Read Replica (Future)

Target performa:

| Endpoint | Target P95 |
|----------|------------|
| Start Exam | < 500 ms |
| Resume | < 300 ms |
| Timer | < 50 ms |
| Question List | < 200 ms |
| Submit | < 500 ms |

---

# 23. Scalability Consideration

CBT Runtime dirancang untuk:

- >1 juta peserta
- Horizontal Scaling
- Stateless API
- Distributed Cache
- Load Balancer
- Event Driven Architecture
- Multi Region Deployment

Runtime tidak menyimpan state di memori aplikasi sehingga instance dapat ditambah atau dikurangi tanpa mengganggu peserta.

---

# 24. Future Evolution

Roadmap:

- WebSocket Runtime
- Real-time Proctoring
- AI Cheating Detection
- Live Monitoring Dashboard
- Safe Exam Browser Integration
- Device Fingerprinting
- Distributed Session Manager
- Multi Region Runtime
- Adaptive Examination

---

# Summary

CBT Runtime API merupakan inti pelaksanaan ujian pada YakinLulus.id.

Karakteristik utama:

- Memisahkan runtime dari konfigurasi ujian.
- Membuat Exam Session dan Question Set secara dinamis.
- Menggunakan timer berbasis server.
- Mendukung resume session dan offline synchronization.
- Dioptimalkan untuk skala besar melalui cache, stateless API, dan horizontal scaling.
- Siap berkembang menuju sistem CBT enterprise dengan proctoring, monitoring real-time, dan arsitektur multi-region.
