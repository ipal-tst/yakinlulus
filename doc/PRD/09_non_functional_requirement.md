Berikut draft **`PRD/09_non_functional_requirement.md`**.

Dokumen ini mendefinisikan seluruh **Non-Functional Requirements (NFR)** yang menjadi standar kualitas sistem YakinLulus.id. NFR ini disusun berdasarkan target bahwa MVP dimulai dari ±10 pengguna, namun arsitektur harus siap berkembang hingga ratusan ribu pengguna tanpa perubahan arsitektur fundamental.

````md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Non-Functional Requirement

| Attribute | Value |
|---|---|
| Document | Non-Functional Requirement |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Functional Requirement |
| Purpose | Define System Quality Attributes |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan seluruh kebutuhan non-fungsional sistem YakinLulus.id.

Dokumen ini menjadi acuan untuk:

- Software Architect
- Backend Engineer
- Frontend Engineer
- DevOps Engineer
- Database Engineer
- QA Engineer
- Security Engineer

---

# 2. Non-Functional Requirement Categories

Seluruh kebutuhan non-fungsional dikelompokkan menjadi:

```
NFR

├── Performance
├── Scalability
├── Availability
├── Reliability
├── Security
├── Privacy
├── Maintainability
├── Observability
├── Usability
├── Accessibility
├── Compatibility
├── Portability
├── Backup & Recovery
└── Compliance
```

---

# 3. Performance Requirements

## NFR-PERF-001

API Response Time

Priority

Critical

Requirement

- Average Response Time ≤ 500 ms
- P95 Response Time ≤ 1 second
- P99 Response Time ≤ 2 seconds

Catatan:

Tidak berlaku untuk proses asynchronous seperti import Excel.

---

## NFR-PERF-002

Database Query

Requirement

Query utama:

- < 100 ms

Query kompleks:

- < 500 ms

Seluruh query wajib memanfaatkan indexing strategy.

---

## NFR-PERF-003

Page Loading

Dashboard:

< 2 detik

Halaman biasa:

< 3 detik

---

## NFR-PERF-004

Concurrent Exam Session

MVP

≥ 100 sesi ujian bersamaan

Target Phase 2

≥ 5.000 sesi

Target Long Term

≥ 100.000 sesi

---

# 4. Scalability Requirements

## NFR-SCALE-001

Application

Harus mendukung:

- Horizontal Scaling
- Stateless API
- Load Balancer

---

## NFR-SCALE-002

Database

Harus mendukung:

- Read Replica
- Partitioning
- Connection Pooling
- Online Migration

---

## NFR-SCALE-003

Storage

Media file dipisahkan dari database.

Menggunakan object storage.

---

# 5. Availability Requirements

## NFR-AVA-001

System Availability

Target:

99.9%

---

## NFR-AVA-002

Scheduled Maintenance

Maintenance dilakukan di luar jam sibuk.

Harus terdapat pemberitahuan kepada pengguna.

---

## NFR-AVA-003

Graceful Failure

Jika salah satu layanan gagal:

- sistem tetap berjalan sejauh memungkinkan
- error tidak menyebabkan crash total

---

# 6. Reliability Requirements

## NFR-REL-001

Transaction Consistency

Seluruh transaksi penting harus:

- ACID compliant
- rollback apabila gagal

---

## NFR-REL-002

Data Integrity

Tidak boleh terdapat:

- orphan data
- duplicate UUID
- broken foreign key

---

## NFR-REL-003

CBT Session Reliability

Saat ujian berlangsung:

- jawaban tidak boleh hilang
- timer tetap konsisten
- session dapat dipulihkan

---

# 7. Security Requirements

## NFR-SEC-001

Authentication

Menggunakan:

- JWT Access Token
- Refresh Token

---

## NFR-SEC-002

Authorization

Seluruh endpoint wajib:

- Authentication
- RBAC Validation

---

## NFR-SEC-003

Password Policy

Minimal:

- 8 karakter
- huruf besar
- huruf kecil
- angka

Disarankan:

- simbol

Password disimpan menggunakan algoritma hashing yang kuat (Argon2id direkomendasikan, bcrypt sebagai alternatif).

---

## NFR-SEC-004

Transport Security

Seluruh komunikasi:

HTTPS Only

TLS 1.2+

---

## NFR-SEC-005

Sensitive Data

Tidak boleh disimpan dalam bentuk plaintext:

- password
- refresh token
- credential

---

## NFR-SEC-006

Input Validation

Seluruh input wajib divalidasi terhadap:

- SQL Injection
- XSS
- Command Injection
- File Upload Abuse

---

## NFR-SEC-007

Audit Trail

Aktivitas berikut wajib dicatat:

- login
- logout
- CRUD
- role change
- configuration
- import
- export

---

# 8. Privacy Requirements

## NFR-PRI-001

Student Data

Student hanya dapat melihat data miliknya sendiri.

---

## NFR-PRI-002

Least Privilege

Setiap role hanya memiliki hak akses minimum yang diperlukan.

---

## NFR-PRI-003

Personal Data

Data pribadi hanya ditampilkan kepada pengguna yang memiliki izin.

---

# 9. Maintainability Requirements

## NFR-MAIN-001

Architecture

Menggunakan:

- Clean Architecture
- Modular Design
- Domain Driven Design

---

## NFR-MAIN-002

Coding Standard

Mengikuti:

- Go Coding Convention
- Linter
- Formatter

---

## NFR-MAIN-003

Documentation

Seluruh API wajib memiliki dokumentasi OpenAPI.

---

# 10. Observability Requirements

## NFR-OBS-001

Logging

System mencatat:

- Request
- Error
- Warning
- Security Event

---

## NFR-OBS-002

Metrics

Monitoring:

- CPU
- Memory
- Disk
- Database
- API Latency
- Error Rate

---

## NFR-OBS-003

Tracing

Request harus dapat ditelusuri menggunakan Correlation ID atau Trace ID.

---

# 11. Usability Requirements

## NFR-USE-001

Navigation

Pengguna dapat mengakses fitur utama maksimal dalam 3 klik.

---

## NFR-USE-002

Learning Curve

Pengguna baru dapat memahami fungsi dasar sistem tanpa pelatihan formal.

---

## NFR-USE-003

Feedback

Setiap aksi penting harus memberikan umpan balik:

- sukses
- gagal
- peringatan
- informasi

---

# 12. Accessibility Requirements

## NFR-ACC-001

Color Contrast

Mengikuti WCAG AA.

---

## NFR-ACC-002

Keyboard Navigation

Fitur utama dapat diakses menggunakan keyboard.

---

## NFR-ACC-003

Responsive Design

Mendukung:

- Desktop
- Tablet
- Mobile Browser

---

# 13. Compatibility Requirements

## NFR-COMP-001

Browser

Minimal mendukung:

- Chrome
- Edge
- Firefox
- Safari

Versi mengikuti dua rilis stabil terbaru.

---

## NFR-COMP-002

Operating System

Client:

- Windows
- Linux
- macOS
- Android
- iOS

---

# 14. Portability Requirements

## NFR-PORT-001

Deployment

Mendukung:

- Docker
- Kubernetes

---

## NFR-PORT-002

Cloud Ready

Dapat dijalankan pada:

- VPS
- On-Premise
- AWS
- GCP
- Azure

---

# 15. Backup & Recovery Requirements

## NFR-BACK-001

Backup

Database:

- Daily Incremental Backup
- Weekly Full Backup

---

## NFR-BACK-002

Recovery

Target:

RPO ≤ 24 jam

RTO ≤ 4 jam

---

## NFR-BACK-003

Backup Verification

Backup harus diuji secara berkala melalui proses restore.

---

# 16. File Storage Requirements

## NFR-FILE-001

Maximum Upload

Image

10 MB

Document

50 MB

---

## NFR-FILE-002

Allowed Format

Image

- JPG
- PNG
- WEBP

Document

- PDF

Spreadsheet

- XLSX

---

# 17. Data Retention Requirements

## NFR-DATA-001

Audit Log

Retensi minimal:

5 tahun

---

## NFR-DATA-002

Exam Result

Tidak boleh dihapus selama masih berlaku dalam kebijakan retensi akademik.

---

## NFR-DATA-003

Soft Delete

Data soft delete tetap dapat dipulihkan selama periode retensi.

---

# 18. Monitoring Requirements

Monitoring wajib mencakup:

- Application Health
- API Health
- Database Health
- Queue Health (future)
- Storage Capacity

---

# 19. Disaster Recovery Requirements

Harus tersedia prosedur untuk:

- Database Failure
- Storage Failure
- Server Failure
- Network Failure

Mengacu pada dokumen Backup & Recovery Strategy.

---

# 20. Future Readiness Requirements

Arsitektur harus siap mendukung:

- AI Question Generator
- AI Tutor
- Mobile App
- School Multi-Tenant
- Real-Time Notification
- Push Notification
- Offline CBT Synchronization
- Distributed Cache
- Event-Driven Architecture

Tanpa perubahan besar pada model domain dan database.

---

# 21. NFR Traceability Matrix

| Category | Requirement Prefix |
|----------|--------------------|
| Performance | NFR-PERF |
| Scalability | NFR-SCALE |
| Availability | NFR-AVA |
| Reliability | NFR-REL |
| Security | NFR-SEC |
| Privacy | NFR-PRI |
| Maintainability | NFR-MAIN |
| Observability | NFR-OBS |
| Usability | NFR-USE |
| Accessibility | NFR-ACC |
| Compatibility | NFR-COMP |
| Portability | NFR-PORT |
| Backup & Recovery | NFR-BACK |
| Data Retention | NFR-DATA |

---

# 22. Non-Functional Requirement Summary

YakinLulus.id dirancang dengan karakteristik:

- Secure by Default
- API First
- Cloud Native Ready
- Highly Scalable
- Observable
- Maintainable
- Reliable
- Mobile Friendly
- Future AI Ready
- Enterprise Grade Foundation

