# 25_backend_deployment.md

# YakinLulus.id Backend Deployment Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar **Backend Deployment Architecture** untuk platform YakinLulus.id.

Deployment Architecture bertujuan memastikan backend dapat di-deploy secara:

* Reliable
* Repeatable
* Scalable
* Secure
* Observable
* Highly Available

Dokumen ini mencakup deployment mulai dari lingkungan Development hingga Production.

---

# 2. Deployment Objectives

Deployment dirancang untuk:

* Zero Downtime Deployment
* Horizontal Scalability
* Easy Rollback
* Infrastructure as Code Ready
* Container Based
* Cloud Native
* CI/CD Friendly
* High Availability

---

# 3. Deployment Principles

Seluruh deployment mengikuti prinsip:

* Immutable Deployment
* Container First
* Configuration Outside Code
* Stateless Application
* Infrastructure Automation
* Health Check Driven
* Secure by Default
* Observability First

---

# 4. Deployment Architecture

```text
Developer

↓

Git Repository

↓

CI Pipeline

↓

Docker Image

↓

Container Registry

↓

CD Pipeline

↓

Production Server

↓

Load Balancer

↓

Go Backend

↓

Supabase
```

Backend dibangun sebagai container Docker yang dapat dijalankan di berbagai environment.

---

# 5. Deployment Environments

Lingkungan yang digunakan:

* Local Development
* Development
* Testing
* Staging
* Production

Masing-masing memiliki konfigurasi, database, storage, dan credential yang terpisah.

---

# 6. Infrastructure Overview

```text
Internet

↓

Cloudflare

↓

Nginx

↓

Go Backend

↓

Redis

↓

Supabase PostgreSQL

↓

Supabase Storage
```

Backend tidak berkomunikasi langsung dengan internet tanpa reverse proxy.

---

# 7. Recommended Technology

| Component            | Technology                |
| -------------------- | ------------------------- |
| Reverse Proxy        | Nginx                     |
| Runtime              | Docker                    |
| Container Management | Docker Compose (MVP)      |
| CI                   | GitHub Actions            |
| Registry             | GitHub Container Registry |
| Database             | Supabase PostgreSQL       |
| Storage              | Supabase Storage          |
| Cache                | Redis                     |
| Queue                | Asynq                     |
| Monitoring           | Prometheus                |
| Dashboard            | Grafana                   |
| Logs                 | Loki                      |

---

# 8. Deployment Topology (MVP)

```text
Server

├── nginx
├── backend
├── redis
├── asynq-worker
├── prometheus
├── grafana
└── loki

↓

Supabase
```

Supabase menjadi layanan terkelola (managed service) di luar server aplikasi.

---

# 9. Production Topology

```text
Cloudflare

↓

Load Balancer

↓

Backend 1

Backend 2

Backend 3

↓

Redis

↓

Supabase
```

Semua instance backend bersifat stateless.

---

# 10. Container Strategy

Container terpisah untuk:

* Backend API
* Worker
* Scheduler
* Nginx
* Prometheus
* Grafana
* Loki

Setiap service memiliki lifecycle sendiri.

---

# 11. Docker Image Strategy

Image bersifat immutable.

Contoh tag:

```text
v1.0.0

v1.0.1

v1.1.0

latest (development only)
```

Production tidak menggunakan tag `latest`.

---

# 12. Multi-Stage Build

Dockerfile menggunakan multi-stage build.

```text
Builder

↓

Compile Go

↓

Runtime Image
```

Runtime image hanya berisi binary dan dependency yang diperlukan.

---

# 13. Container Health Check

Health endpoint:

```text
GET /health

GET /ready

GET /live
```

Digunakan oleh Nginx dan orchestration platform.

---

# 14. Health Check Strategy

| Endpoint | Purpose               |
| -------- | --------------------- |
| /health  | Basic status          |
| /live    | Process hidup         |
| /ready   | Siap menerima request |

Readiness memeriksa koneksi ke Redis dan Supabase.

---

# 15. Deployment Flow

```text
Git Push

↓

CI Build

↓

Unit Test

↓

Docker Build

↓

Push Image

↓

Deploy

↓

Health Check

↓

Traffic Switch
```

Deployment dibatalkan jika health check gagal.

---

# 16. Rolling Deployment

Deployment dilakukan bertahap.

```text
Backend A

↓

Update

↓

Healthy

↓

Backend B
```

Cara ini meminimalkan downtime.

---

# 17. Blue-Green Deployment (Future)

```text
Blue

↓

Green

↓

Switch Traffic
```

Digunakan ketika infrastruktur sudah mendukung deployment tanpa gangguan.

---

# 18. Rollback Strategy

Rollback dilakukan dengan image sebelumnya.

```text
Current

↓

Rollback

↓

Previous Stable Image
```

Rollback tidak memerlukan proses build ulang.

---

# 19. Configuration Management

Konfigurasi menggunakan:

* Environment Variables
* Docker Secrets (Future)
* Secret Manager (Future)

Konfigurasi tidak boleh di-hardcode.

---

# 20. Environment Variables

Contoh:

```text
APP_ENV

APP_PORT

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

REDIS_URL

JWT_SECRET (jika digunakan)

SMTP_HOST

OPENAI_API_KEY
```

Setiap environment memiliki nilai yang berbeda.

---

# 21. Reverse Proxy

Nginx bertugas:

* HTTPS Termination
* Compression
* Reverse Proxy
* Static Security Header
* Rate Limiting
* Load Balancing

---

# 22. TLS Strategy

Seluruh trafik menggunakan:

* TLS 1.3
* HTTP/2
* Automatic Certificate Renewal

Sertifikat dapat dikelola melalui Let's Encrypt atau Cloudflare.

---

# 23. Worker Deployment

Worker dijalankan terpisah.

```text
Backend API

↓

Redis Queue

↓

Worker
```

Jumlah worker dapat ditambah tanpa mengubah backend.

---

# 24. Scheduler Deployment

Scheduled Job dijalankan pada service terpisah.

Contoh:

* Cleanup
* Aggregation
* Notification
* Backup Verification

Menghindari duplikasi eksekusi ketika backend diskalakan.

---

# 25. Storage Strategy

Seluruh file berada di:

```text
Supabase Storage
```

Container tidak menyimpan file permanen.

---

# 26. Logging Strategy

Log dikirim ke:

```text
Backend

↓

Loki

↓

Grafana
```

Seluruh log menggunakan format JSON terstruktur.

---

# 27. Metrics

Prometheus mengumpulkan:

* CPU
* Memory
* Request Count
* Latency
* Error Rate
* Queue Length
* Redis Metrics
* Worker Metrics

---

# 28. Monitoring Dashboard

Grafana menyediakan dashboard untuk:

* Backend API
* Redis
* Worker
* Queue
* Import Pipeline
* AI Pipeline
* CBT Runtime

---

# 29. Alerting

Alert dikirim ketika:

* API Down
* Redis Down
* Queue Menumpuk
* Error Rate Tinggi
* Disk Hampir Penuh
* Memory Tinggi
* CPU Tinggi

Future:

* Integrasi Email
* Discord
* Telegram
* Slack

---

# 30. Resource Recommendation (MVP)

| Component | Recommendation                          |
| --------- | --------------------------------------- |
| CPU       | 4 vCPU                                  |
| Memory    | 8 GB                                    |
| Storage   | 100 GB SSD                              |
| Redis     | 1 GB RAM                                |
| OS        | Ubuntu Server 24.04 LTS atau lebih baru |

Konfigurasi ini cukup untuk MVP dengan ribuan pengguna aktif harian dan dapat ditingkatkan sesuai pertumbuhan.

---

# 31. Production Recommendation

| Component        | Recommendation |
| ---------------- | -------------- |
| Backend Instance | ≥ 2            |
| Redis            | Dedicated      |
| Queue Worker     | ≥ 2            |
| Reverse Proxy    | Dedicated      |
| Monitoring       | Dedicated      |

Supabase tetap menjadi managed service.

---

# 32. Backup Strategy

Backup mencakup:

* Environment Configuration
* Docker Compose
* Monitoring Configuration
* Grafana Dashboard
* Loki Configuration

Database mengikuti dokumen **Backup & Recovery Strategy**.

---

# 33. Disaster Recovery

Target:

| Metric | Target     |
| ------ | ---------- |
| RPO    | ≤ 15 menit |
| RTO    | ≤ 1 jam    |

Recovery diuji secara berkala.

---

# 34. Deployment Security

Deployment server:

* SSH Key Only
* Firewall Enabled
* Fail2Ban
* Non-root Container
* Automatic Security Update
* Secret Rotation

Akses administrasi dicatat melalui audit.

---

# 35. CI/CD Pipeline

Tahapan:

```text
Commit

↓

Lint

↓

Unit Test

↓

Integration Test

↓

Build

↓

Security Scan

↓

Docker Build

↓

Push Image

↓

Deploy

↓

Smoke Test
```

Deployment production memerlukan approval sesuai kebijakan tim.

---

# 36. Smoke Test

Setelah deployment:

* Health Check
* Authentication Test
* Database Connectivity
* Redis Connectivity
* Queue Test
* Storage Test

Jika gagal, rollback dijalankan.

---

# 37. Scalability Strategy

Horizontal scaling:

```text
Load Balancer

↓

Backend A

Backend B

Backend C

↓

Redis

↓

Supabase
```

Backend tidak menggunakan local session sehingga tidak memerlukan sticky session.

---

# 38. Future Migration

Ketika trafik meningkat:

* Docker Compose → Kubernetes
* Single Server → Multi Node
* Manual Deployment → GitOps
* Local Monitoring → Managed Observability
* Single Region → Multi Region

Arsitektur aplikasi tetap dipertahankan.

---

# 39. Anti-Patterns

Tidak diperbolehkan:

* Deploy langsung dari laptop developer.
* Menjalankan container sebagai root.
* Menggunakan image `latest` di production.
* Menyimpan file upload di filesystem container.
* Mengubah container secara manual setelah deployment.
* Menggabungkan API, Worker, dan Scheduler dalam satu proses.

---

# 40. Deployment Checklist

Sebelum production:

* Docker Image berhasil dibuat.
* Unit & Integration Test lulus.
* Security Scan selesai.
* Environment Variables lengkap.
* TLS aktif.
* Health Check aktif.
* Monitoring aktif.
* Alerting aktif.
* Backup tervalidasi.
* Rollback Plan tersedia.

---

# 41. Relationship dengan Arsitektur Lain

Deployment Architecture menjadi fondasi operasional seluruh backend.

```text
Git Repository

↓

CI/CD

↓

Docker

↓

Backend API

↓

Worker

↓

Redis

↓

Supabase

↓

Monitoring

↓

Alerting
```

Semua modul—Authentication, CBT Runtime, AI Service, Analytics, Import Pipeline, dan Notification—dideploy menggunakan standar yang sama.

---

# 42. Summary

Backend Deployment Architecture YakinLulus.id menggunakan pendekatan **Container-Based Cloud-Native Deployment** dengan **Docker**, **Nginx**, **Redis**, **Supabase**, dan **CI/CD Pipeline**.

Arsitektur ini memberikan:

* Deployment yang konsisten dan mudah direproduksi.
* Skalabilitas horizontal tanpa perubahan aplikasi.
* Zero-downtime deployment melalui rolling update.
* Observability lengkap dengan logging, metrics, dan alerting.
* Jalur migrasi yang jelas dari Docker Compose (MVP) menuju Kubernetes ketika kebutuhan kapasitas meningkat.
