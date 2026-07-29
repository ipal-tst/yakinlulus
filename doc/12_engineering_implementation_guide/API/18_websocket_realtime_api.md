# WebSocket Realtime API

**Document** : `api/18_websocket_realtime_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan implementasi **WebSocket Realtime API** pada YakinLulus.id.

WebSocket digunakan untuk komunikasi dua arah (bidirectional) dengan latensi rendah antara client dan server.

WebSocket **tidak menggantikan REST API**.

REST API tetap digunakan untuk:

- CRUD
- Authentication
- Configuration
- Resource Management

WebSocket digunakan hanya untuk event yang membutuhkan pembaruan secara realtime.

---

# 2. Use Case

WebSocket digunakan pada:

- CBT Timer
- Exam Status
- Auto Submit Notification
- Exam Broadcast
- Student Online Status
- Teacher Monitoring
- Live Dashboard
- Push Notification
- Ranking Update (Future)
- AI Streaming Response

---

# 3. Architecture

```text
                  Client

                     │

         Secure WebSocket (WSS)

                     │

                     ▼

           WebSocket Gateway

         ┌──────────┼──────────┐

         ▼          ▼          ▼

    Connection   Event Hub   Auth

                     │

                     ▼

              Redis Pub/Sub

                     │

                     ▼

            Application Service
```

---

# 4. Connection Flow

```text
Login

↓

JWT Token

↓

Open WebSocket

↓

Authentication

↓

Connection Registered

↓

Subscribe Channel
```

---

# 5. Endpoint

```text
wss://api.yakinlulus.id/ws
```

Contoh:

```text
wss://api.yakinlulus.id/ws?token=JWT_TOKEN
```

Atau menggunakan Authorization Header apabila didukung client.

---

# 6. Authentication

Semua koneksi wajib menggunakan JWT.

Flow:

```text
Connect

↓

Validate Token

↓

Validate User

↓

Register Session

↓

Join Channel
```

Token yang tidak valid akan langsung ditolak.

---

# 7. Channel Strategy

Channel dipisahkan berdasarkan domain.

Contoh:

```text
user.{userId}

exam.{examId}

session.{sessionId}

teacher.{teacherId}

school.{schoolId}

admin.global
```

Keuntungan:

- isolasi data
- broadcast efisien
- mudah diskalakan

---

# 8. Event Format

Semua event menggunakan format standar.

```json
{
  "event": "timer.updated",
  "timestamp": "2026-07-26T10:00:00Z",
  "data": {}
}
```

Field:

- event
- timestamp
- data
- requestId (optional)
- version (optional)

---

# 9. CBT Timer Event

```json
{
  "event": "timer.updated",
  "data": {
    "remainingSecond": 1350
  }
}
```

Client menggunakan event ini untuk sinkronisasi timer.

---

# 10. Exam Broadcast

Contoh:

```json
{
  "event": "exam.broadcast",
  "data": {
    "message": "Ujian akan berakhir dalam 5 menit."
  }
}
```

Digunakan oleh Admin atau Teacher.

---

# 11. Auto Submit Event

```json
{
  "event": "exam.auto_submit",
  "data": {
    "reason": "TIMEOUT"
  }
}
```

Client harus:

- menghentikan input
- menyimpan status lokal
- menampilkan informasi ke pengguna

---

# 12. Student Presence

Event:

```text
student.online

student.offline

student.reconnected
```

Teacher Dashboard dapat menampilkan status peserta secara realtime.

---

# 13. Teacher Monitoring

Teacher menerima informasi:

- jumlah peserta aktif
- peserta selesai
- peserta offline
- reconnect
- auto submit

Monitoring tidak mengakses isi jawaban peserta.

---

# 14. AI Streaming

Untuk AI Tutor:

```text
Prompt

↓

LLM

↓

Streaming Token

↓

Client
```

Event:

```text
ai.stream

ai.completed

ai.error
```

Streaming memberikan pengalaman pengguna yang lebih responsif.

---

# 15. Heartbeat

Server mengirim heartbeat.

```text
Ping

↓

Pong
```

Default:

```text
30 second
```

Jika heartbeat gagal beberapa kali berturut-turut, koneksi ditutup.

---

# 16. Reconnection Strategy

Client melakukan reconnect otomatis.

Flow:

```text
Disconnect

↓

Retry

↓

Authenticate

↓

Restore Session

↓

Continue
```

Gunakan exponential backoff untuk menghindari lonjakan koneksi.

---

# 17. Error Event

Contoh:

```json
{
  "event": "error",
  "data": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

Kode lain:

```text
INVALID_CHANNEL

TOKEN_EXPIRED

SESSION_NOT_FOUND

RATE_LIMIT

SERVER_BUSY
```

---

# 18. Authorization

Setiap channel memiliki validasi akses.

Contoh:

```text
Student

↓

session.123

✓

session.456

✗
```

Teacher hanya dapat mengakses sesi yang menjadi tanggung jawabnya.

---

# 19. Rate Limiting

Pembatasan:

- Maksimum koneksi per user
- Maksimum pesan per detik
- Maksimum subscribe channel
- Maksimum reconnect dalam periode tertentu

Melindungi server dari penyalahgunaan.

---

# 20. Security Consideration

WebSocket wajib menerapkan:

- WSS (TLS)
- JWT Authentication
- RBAC Authorization
- Origin Validation
- Connection Limit
- Message Validation
- Payload Size Limit
- Idle Timeout
- Audit Logging

Tidak ada data sensitif yang dikirim tanpa otorisasi.

---

# 21. Audit Logging

Dicatat:

- Connect
- Disconnect
- Reconnect
- Subscribe
- Unsubscribe
- Broadcast
- Authentication Failed
- Rate Limit Triggered

---

# 22. Performance Strategy

Optimasi:

- Redis Pub/Sub
- Connection Pool
- Event Compression
- Lightweight Payload
- Sticky Session (bila diperlukan)
- Horizontal Gateway

Target:

| Metric | Target |
|---------|--------|
| Connection Time | < 500 ms |
| Event Delivery | < 100 ms |
| Broadcast Latency | < 200 ms |
| Reconnect | < 2 detik |

---

# 23. Scalability Consideration

Dirancang untuk:

- >100.000 koneksi simultan
- Horizontal WebSocket Gateway
- Redis Pub/Sub Cluster
- Multi Region
- Stateless Gateway
- Load Balancer Support

Gateway tidak menyimpan state permanen sehingga mudah diperbanyak secara horizontal.

---

# 24. Future Evolution

Roadmap:

- Live Collaboration
- Live Classroom
- Real-time Whiteboard
- Voice Signaling
- Video Signaling
- AI Streaming Conversation
- Distributed Event Bus
- Kafka Integration
- Global Presence Service

---

# Summary

WebSocket Realtime API menyediakan komunikasi dua arah berlatensi rendah untuk fitur-fitur yang membutuhkan sinkronisasi langsung.

Karakteristik utama:

- REST API tetap menjadi jalur utama untuk operasi CRUD.
- WebSocket digunakan khusus untuk event realtime.
- Mendukung CBT Timer, monitoring ujian, AI streaming, dan notifikasi.
- Menggunakan JWT Authentication, Redis Pub/Sub, dan Stateless Gateway.
- Siap diskalakan hingga ratusan ribu koneksi simultan dengan arsitektur horizontal.
