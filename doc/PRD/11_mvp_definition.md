Berikut draft **`PRD/11_mvp_definition.md`**.

Dokumen ini mendefinisikan secara tegas batasan MVP sehingga seluruh tim (Product, Engineering, QA, UI/UX, dan DevOps) memiliki pemahaman yang sama mengenai ruang lingkup rilis pertama. Mengingat tujuan awal YakinLulus.id adalah digunakan oleh keluarga (±10 pengguna) namun memiliki fondasi yang siap diskalakan, maka MVP difokuskan pada fitur inti dengan arsitektur yang tidak perlu dirombak saat produk berkembang.

````md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: MVP Definition

| Attribute | Value |
|---|---|
| Document | MVP Definition |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Planning |
| Related Document | Acceptance Criteria |
| Purpose | Define Minimum Viable Product Scope |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan ruang lingkup Minimum Viable Product (MVP) YakinLulus.id.

Tujuan utama MVP adalah:

- Menghasilkan produk yang dapat digunakan end-to-end.
- Memvalidasi kebutuhan pengguna.
- Menyediakan fondasi arsitektur yang siap dikembangkan.
- Menghindari over-engineering pada fase awal.

---

# 2. MVP Objective

MVP harus mampu mendukung proses berikut:

```
Student

↓

Login

↓

Belajar Materi

↓

Latihan Soal

↓

Mengikuti CBT

↓

Melihat Hasil

↓

Melihat Progress Belajar
```

Sedangkan Admin, Staff, dan Teacher dapat:

- Mengelola pengguna.
- Mengelola struktur pendidikan.
- Mengelola bank soal.
- Membuat CBT.
- Memonitor aktivitas sistem.

---

# 3. MVP Design Principles

MVP mengikuti prinsip:

- Build Small
- Deliver Fast
- Scale Later Without Rewrite
- API First
- Mobile Ready
- Cloud Ready
- Secure by Default
- Data Driven

---

# 4. MVP Success Criteria

MVP dianggap berhasil apabila:

- Seluruh alur belajar berjalan end-to-end.
- Student dapat menyelesaikan CBT tanpa kendala.
- Admin dapat mengelola seluruh konten.
- Data tersimpan secara konsisten.
- Sistem stabil pada target kapasitas MVP.

---

# 5. MVP Feature Matrix

| Module | MVP | Priority |
|---------|-----|----------|
| Authentication | ✓ | P0 |
| RBAC | ✓ | P0 |
| User Management | ✓ | P0 |
| Education Management | ✓ | P0 |
| Question Bank | ✓ | P0 |
| CBT Engine | ✓ | P0 |
| Student Dashboard | ✓ | P0 |
| Exam Result | ✓ | P0 |
| Audit Log | ✓ | P0 |
| Learning Material | ✓ | P1 |
| Analytics | ✓ (Basic) | P1 |
| Excel Import | ✓ | P1 |
| Notification | Basic | P1 |
| AI Question Generator | ✗ | P2 |
| AI Tutor | ✗ | P2 |
| Adaptive Learning | ✗ | P2 |
| Push Notification | ✗ | P2 |
| Offline CBT Sync | ✗ | P2 |
| Multi Tenant School | ✗ | P3 |

---

# 6. MVP Functional Scope

## 6.1 Authentication

Included:

- Login
- Logout
- JWT Authentication
- Session Management

Excluded:

- OAuth Login
- Social Login
- SSO

---

## 6.2 User Management

Included:

- CRUD User
- Role Assignment
- Activate/Deactivate User

Excluded:

- Self Registration
- Invitation Workflow
- Organization Management

---

## 6.3 Education Management

Included:

- Education Level
- Class
- Subject
- Chapter
- Sub Chapter

Excluded:

- Kurikulum Multi Versi
- Kalender Akademik

---

## 6.4 Question Bank

Included:

- CRUD Soal
- Multiple Choice
- Pembahasan
- Difficulty
- Source
- Versioning
- Search
- Filter

Excluded:

- Essay
- Matching
- Drag & Drop
- Coding Question
- Audio Question

---

## 6.5 CBT Engine

Included:

- Create Exam
- Publish Exam
- Random Question
- Random Option
- Timer
- Auto Save
- Auto Submit
- Result

Excluded:

- Live Proctoring
- AI Anti Cheat
- Webcam Detection
- Browser Lock Extension
- Multi Device Sync

---

## 6.6 Learning Material

Included:

- Text
- Image
- PDF

Excluded:

- Video Streaming
- Interactive Learning
- Animation
- Quiz Inside Material

---

## 6.7 Student Dashboard

Included:

- Progress
- Average Score
- History
- Recent Activity

Excluded:

- AI Recommendation
- Gamification
- Achievement Badge

---

## 6.8 Analytics

Included:

- Subject Score
- Chapter Score
- Exam History

Excluded:

- AI Prediction
- Learning Path Recommendation
- Cohort Analytics

---

# 7. MVP Technical Scope

Backend

- Golang
- Clean Architecture
- REST API

Frontend

- React
- Responsive Web

Database

- PostgreSQL

Authentication

- JWT

Storage

- Object Storage

Deployment

- Docker

Reverse Proxy

- Nginx

---

# 8. MVP User Capacity

## Initial Target

- 10 pengguna aktif.

## Validation Target

- 100 pengguna.

## Engineering Target

- ≥1.000 pengguna tanpa perubahan arsitektur inti.

---

# 9. MVP Performance Target

| Metric | Target |
|--------|--------|
| API Average | ≤ 500 ms |
| Dashboard Load | ≤ 2 detik |
| Login | ≤ 2 detik |
| CBT Start | ≤ 3 detik |
| Auto Save | ≤ 2 detik |

---

# 10. MVP Security Scope

Included:

- HTTPS
- JWT
- RBAC
- Password Hashing
- Audit Log
- Input Validation

Excluded:

- MFA
- Hardware Key
- SSO Enterprise

---

# 11. MVP Database Scope

Included:

- UUID
- Soft Delete
- Audit Fields
- Foreign Key
- Index
- Versioning

Excluded:

- Sharding
- Multi Region
- Read Replica (aktif jika dibutuhkan)

---

# 12. MVP DevOps Scope

Included:

- Docker Compose
- Environment Configuration
- Database Migration
- Backup Script
- Logging

Excluded:

- Kubernetes
- Auto Scaling
- Blue/Green Deployment
- Service Mesh

---

# 13. MVP UI Scope

Included:

- Responsive Web
- Light Theme
- Dark Theme
- Desktop
- Tablet
- Mobile Browser

Excluded:

- Native Android
- Native iOS

---

# 14. Out of Scope

Fitur berikut **tidak termasuk MVP**:

- AI Question Generator
- AI Tutor
- Adaptive Learning
- Voice Assistant
- Chat System
- Video Conference
- Live Class
- Payment Gateway
- Subscription Management
- Marketplace
- Parent Dashboard
- School Multi Tenant
- Public API
- Plugin System

---

# 15. MVP Dependency

```
Authentication
        │
        ▼
RBAC
        │
        ▼
Education Structure
        │
        ▼
Question Bank
        │
        ▼
CBT Engine
        │
        ▼
Dashboard
        │
        ▼
Analytics
```

---

# 16. MVP Release Milestone

## Milestone 1

Foundation

- Authentication
- RBAC
- User
- Education Structure

---

## Milestone 2

Content

- Question Bank
- Material
- Excel Import

---

## Milestone 3

Assessment

- CBT Engine
- Result
- History

---

## Milestone 4

Monitoring

- Dashboard
- Analytics
- Audit Log

---

## Milestone 5

Release Candidate

- Bug Fix
- Performance Test
- Security Test
- UAT
- Production Deployment

---

# 17. Definition of MVP Complete

MVP dinyatakan selesai apabila:

- Semua fitur P0 selesai.
- Seluruh Acceptance Criteria lulus.
- Tidak ada bug Critical.
- Tidak ada bug High yang menghalangi penggunaan.
- Deployment ke production berhasil.
- Backup & Recovery tervalidasi.
- Dokumentasi API selesai.
- Dokumentasi operasional selesai.

---

# 18. Future Evolution

## Phase 2

- AI Question Generator
- AI Explanation
- AI Recommendation
- Adaptive Learning
- Video Learning
- Push Notification

---

## Phase 3

- Mobile Apps
- School Multi Tenant
- Parent Dashboard
- Teacher Collaboration
- Real-Time Notification
- Distributed Cache
- Event Driven Architecture

---

# 19. MVP Summary

MVP YakinLulus.id berfokus pada tiga kemampuan inti:

1. **Belajar** melalui materi dan latihan soal.
2. **Evaluasi** melalui CBT Engine yang andal.
3. **Monitoring** melalui dashboard dan analitik dasar.

Seluruh fitur dirancang di atas fondasi arsitektur yang mendukung pengembangan jangka panjang tanpa memerlukan perubahan besar pada model domain maupun struktur database.

