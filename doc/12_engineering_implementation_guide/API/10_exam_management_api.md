# Exam Management API

**Document** : `api/10_exam_management_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **Exam Management API** pada YakinLulus.id.

Exam Management merupakan layanan yang bertanggung jawab terhadap seluruh siklus hidup ujian sebelum ujian dijalankan oleh CBT Runtime.

Layanan ini mengelola:

- Pembuatan ujian
- Konfigurasi ujian
- Question Pool
- Randomization Rule
- Peserta ujian
- Jadwal ujian
- Publish ujian
- Aktivasi ujian
- Penutupan ujian

Exam Management tidak menangani proses pengerjaan ujian secara langsung. Seluruh proses runtime dilakukan oleh **CBT Runtime Service**.

---

# 2. Architecture Overview

```text
                Admin
                Teacher
                    │
                    ▼
           Exam Management API
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 Validation   Question Pool   Scheduling
                    │
                    ▼
            Application Layer
                    │
                    ▼
             PostgreSQL
                    │
                    ▼
         Event Publisher (Future)
```

---

# 3. Exam Lifecycle

```text
Draft

↓

Configured

↓

Published

↓

Scheduled

↓

Active

↓

Closed

↓

Archived
```

Status hanya dapat berubah sesuai lifecycle di atas.

---

# 4. Exam Architecture

```text
Exam

├── Metadata
├── Schedule
├── Question Pool
├── Randomization Rule
├── Participant Rule
├── Scoring Rule
├── Security Rule
└── Publish State
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|----------|----------|--------|
| GET | /exams | List Exam |
| POST | /exams | Create Exam |
| GET | /exams/{id} | Detail Exam |
| PATCH | /exams/{id} | Update Exam |
| DELETE | /exams/{id} | Soft Delete |
| POST | /exams/{id}/publish | Publish |
| POST | /exams/{id}/activate | Activate |
| POST | /exams/{id}/close | Close |
| POST | /exams/{id}/archive | Archive |
| GET | /exams/statistics | Dashboard |

---

# 6. Create Exam

```http
POST /api/v1/exams
```

Request

```json
{
  "title": "Tryout Matematika",
  "examType": "tryout",
  "gradeId": "grade_12",
  "subjectId": "math",
  "duration": 90,
  "startAt": "2026-08-01T08:00:00Z",
  "endAt": "2026-08-01T10:00:00Z"
}
```

Response

```http
201 Created
```

---

# 7. Exam Configuration

Konfigurasi ujian meliputi:

```text
Timer

Question Pool

Question Count

Passing Score

Shuffle Question

Shuffle Option

Allow Review

Auto Submit

Show Result

Show Explanation
```

Semua konfigurasi dapat diubah selama status masih **Draft**.

---

# 8. Question Pool

Exam tidak menyimpan daftar soal final.

Exam hanya menyimpan **aturan pengambilan soal**.

Contoh:

```text
Matematika

↓

Bab 1

↓

Difficulty:

Easy : 20

Medium : 15

Hard : 5
```

Saat peserta memulai ujian, CBT Runtime akan membentuk **Question Set** berdasarkan aturan tersebut.

---

# 9. Randomization Rule

Konfigurasi:

```json
{
  "shuffleQuestion": true,
  "shuffleOption": true,
  "randomSeed": "generated"
}
```

Randomization menghasilkan urutan soal berbeda untuk setiap peserta, tetapi tetap dapat direproduksi menggunakan seed yang sama jika diperlukan untuk audit.

---

# 10. Participant Assignment

Peserta dapat ditentukan melalui:

- Individu
- Kelas
- Sekolah
- Grup
- Semua siswa pada jenjang tertentu

Endpoint

```http
POST /api/v1/exams/{id}/participants
```

---

# 11. Schedule Configuration

Konfigurasi:

```json
{
  "startAt": "...",
  "endAt": "...",
  "duration": 90,
  "timezone": "Asia/Jakarta"
}
```

Validasi:

- `endAt > startAt`
- Durasi positif
- Tidak terjadi konflik jadwal sesuai kebijakan institusi

---

# 12. Security Configuration

Konfigurasi keamanan:

```text
Fullscreen Mode

Copy Protection

Tab Switch Detection

IP Restriction (Future)

Device Restriction (Future)

Safe Browser (Future)
```

---

# 13. Publish Exam

```http
POST /api/v1/exams/{id}/publish
```

Validasi:

- Metadata lengkap
- Jadwal valid
- Question Pool valid
- Minimal satu peserta
- Durasi valid

Setelah dipublish, perubahan konfigurasi dibatasi.

---

# 14. Activate Exam

```http
POST /api/v1/exams/{id}/activate
```

Status berubah menjadi:

```text
Active
```

CBT Runtime mulai menerima session baru.

---

# 15. Close Exam

```http
POST /api/v1/exams/{id}/close
```

Efek:

- Tidak menerima peserta baru
- Session aktif tetap diselesaikan sesuai kebijakan
- Nilai dapat diproses

---

# 16. Archive Exam

```http
POST /api/v1/exams/{id}/archive
```

Digunakan untuk penyimpanan historis.

Exam tidak muncul pada daftar aktif.

---

# 17. Exam Detail

```http
GET /api/v1/exams/{id}
```

Response

```json
{
  "success": true,
  "data": {
    "id": "exam_001",
    "title": "Tryout Matematika",
    "status": "published",
    "duration": 90,
    "participantCount": 250,
    "questionCount": 40
  }
}
```

---

# 18. List Exam

```http
GET /api/v1/exams
```

Parameter:

```text
page

pageSize

status

examType

gradeId

subjectId

startDate

endDate

search
```

---

# 19. Statistics

```http
GET /api/v1/exams/statistics
```

Contoh response

```json
{
  "success": true,
  "data": {
    "totalExam": 1240,
    "draft": 28,
    "published": 150,
    "active": 12,
    "closed": 1050
  }
}
```

---

# 20. Validation Rules

Minimal validasi:

- Judul wajib
- Durasi > 0
- Jadwal valid
- Question Pool tidak kosong
- Question Count sesuai pool
- Passing Score valid
- Participant valid

---

# 21. Authorization

| Role | Hak Akses |
|------|-----------|
| Super Admin | Full Access |
| Admin | Full Access |
| Staff | Sesuai kebijakan |
| Teacher | Kelola ujian milik sendiri/sekolah |
| Student | Tidak memiliki akses ke API administrasi |

---

# 22. Audit Logging

Seluruh aktivitas dicatat:

- Create Exam
- Update Exam
- Publish Exam
- Activate Exam
- Close Exam
- Archive Exam
- Assign Participant
- Update Schedule
- Update Question Pool

---

# 23. Security Consideration

API wajib menerapkan:

- JWT Authentication
- RBAC Authorization
- Soft Delete
- Audit Logging
- Input Validation
- Optimistic Locking
- Rate Limiting

Perubahan terhadap exam yang telah dipublish harus melalui validasi status untuk menjaga integritas ujian.

---

# 24. Performance Strategy

Optimasi:

- Pagination
- Redis Cache untuk metadata
- Lazy Loading participant
- Background processing untuk assignment massal
- Index pada status, jadwal, dan sekolah

Target performa:

| Endpoint | Target P95 |
|----------|------------|
| List Exam | < 250 ms |
| Detail Exam | < 200 ms |
| Publish Exam | < 500 ms |

---

# 25. Scalability Consideration

Dirancang untuk mendukung:

- Ratusan ribu exam
- Jutaan peserta
- Multi School
- Multi Tenant
- Event Driven Architecture
- Horizontal Scaling
- Future Microservice Extraction

Exam Management tetap menjadi layanan konfigurasi, sedangkan beban runtime ditangani oleh CBT Runtime.

---

# 26. Future Evolution

Roadmap:

- Blueprint Exam
- Exam Template
- Exam Cloning
- Collaborative Authoring
- Approval Workflow
- AI-assisted Exam Builder
- Calendar Integration
- Multi-stage Examination
- Adaptive Examination

---

# Summary

Exam Management API bertanggung jawab terhadap seluruh konfigurasi dan lifecycle ujian sebelum pelaksanaan.

Karakteristik utama:

- Mengelola metadata, jadwal, peserta, dan aturan ujian.
- Menggunakan Question Pool sebagai dasar pembentukan soal.
- Mendukung publish, aktivasi, penutupan, dan arsip ujian.
- Memisahkan konfigurasi ujian dari CBT Runtime untuk meningkatkan skalabilitas.
- Siap berkembang menjadi layanan enterprise dan dipisahkan sebagai microservice tanpa perubahan kontrak API.
