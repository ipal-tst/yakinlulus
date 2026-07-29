# 01_architecture_overview.md

# YakinLulus.id Backend Architecture Overview

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

**Owner:** Engineering Team

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur backend YakinLulus.id sebagai fondasi teknis utama untuk seluruh proses pengembangan sistem.

Arsitektur ini dibangun berdasarkan:

* Product Requirement Document (PRD)
* Business Domain Model
* Entity Catalog
* ERD
* Logical Data Model (LDM)
* Database Architecture
* Business Rules
* MVP Definition

Dokumen ini menjadi acuan seluruh engineer dalam mengembangkan backend secara konsisten, scalable, maintainable, dan mudah dikembangkan hingga tahap enterprise.

---

# 2. Architecture Vision

Backend YakinLulus.id dirancang sebagai platform EdTech modern yang memiliki karakteristik berikut:

* High Performance
* Highly Scalable
* Secure by Design
* AI Ready
* Cloud Native
* Modular
* Testable
* Maintainable
* Observable
* Production Ready

Target akhir bukan hanya aplikasi Bank Soal, tetapi menjadi platform pembelajaran digital terpadu yang mampu mendukung:

* Bank Soal Nasional
* CBT Engine
* Interactive Learning
* AI Generated Question
* AI Learning Assistant
* Learning Analytics
* Adaptive Learning
* Gamification
* Multi School
* Multi Tenant (Future)
* Mobile & Web Platform

---

# 3. Architectural Goals

Backend harus memenuhi tujuan berikut.

## Functional Goals

* Mendukung seluruh fitur MVP
* Mendukung ekspansi fitur tanpa perubahan arsitektur besar
* Mendukung integrasi AI
* Mendukung berbagai jenis ujian
* Mendukung multi jenjang pendidikan
* Mendukung jutaan soal
* Mendukung jutaan histori ujian
* Mendukung berbagai media pembelajaran

---

## Non Functional Goals

* Availability tinggi
* Response time rendah
* Horizontal scaling
* Fault tolerant
* Secure
* Auditable
* Easy Deployment
* Easy Monitoring
* Easy Testing

---

# 4. Architecture Principles

Backend dibangun berdasarkan prinsip berikut.

## Modular Monolith First

Seluruh backend dikembangkan sebagai satu aplikasi, tetapi dipisahkan menjadi module yang independen.

Keuntungan:

* lebih sederhana
* deployment mudah
* debugging mudah
* development cepat
* siap dipisahkan menjadi microservice

---

## Domain Driven Design (DDD Lite)

Business Domain menjadi pusat arsitektur.

Contoh Domain:

* Identity
* User
* Question Bank
* CBT
* Learning Material
* Analytics
* Ranking
* Notification
* AI

Setiap domain memiliki tanggung jawab yang jelas.

---

## Clean Architecture

Dependency selalu mengarah ke dalam.

```text
Controller

↓

Service

↓

Repository

↓

Database
```

Business Logic tidak boleh berada pada:

* Controller
* Database
* API Layer
* Frontend

Business Rule hanya berada pada Service Layer.

---

## API First

Seluruh komunikasi sistem dilakukan melalui API yang terdokumentasi.

Semua fitur backend harus dapat diakses melalui REST API.

Hal ini memungkinkan:

* Mobile App
* Web App
* Admin Panel
* Integrasi pihak ketiga
* AI Service

menggunakan endpoint yang sama.

---

## Security by Design

Keamanan menjadi bagian dari desain awal, bukan tambahan setelah sistem selesai.

Semua endpoint wajib:

* Authentication
* Authorization
* Validation
* Audit Logging
* Error Handling
* Rate Limiting

---

## Database First

Seluruh desain backend mengikuti struktur database yang telah disusun sebelumnya.

Entity pada backend harus sesuai dengan:

* Entity Catalog
* ERD
* LDM
* Constraint Strategy

Tidak diperbolehkan membuat entity baru tanpa melalui perubahan pada domain model dan database design.

---

# 5. High Level Architecture

```text
                    Client Applications
         ┌────────────────────────────────────┐
         │                                    │
         │ Flutter │ React │ Admin Panel │ API│
         └────────────────────────────────────┘
                         │
                    HTTPS / REST
                         │
                  API Middleware Layer
                         │
        Authentication │ Authorization │ Validation
                         │
                 Business Service Layer
                         │
 ┌─────────────────────────────────────────────────────┐
 │ User │ CBT │ Question │ Material │ AI │ Analytics │
 └─────────────────────────────────────────────────────┘
                         │
                  Repository Layer
                         │
                  PostgreSQL (Supabase)
                         │
      ┌────────────┬───────────────┬───────────────┐
      │             │               │               │
    Storage       Redis         Queue         AI Service
  (Supabase)     Cache         Asynq        Python FastAPI
```

---

# 6. Technology Stack

## Backend

* Go 1.25+
* Gin Framework
* GORM
* golang-migrate

---

## Database

* Supabase PostgreSQL
* PostgreSQL 17 Compatible

---

## Authentication

* JWT Access Token
* Refresh Token
* RBAC

---

## Storage

* Supabase Storage

---

## Cache

* Redis

---

## Background Job

* Asynq
* Redis

---

## AI

* Python FastAPI
* LLM Integration
* Embedding Service (Future)

---

## API Documentation

* OpenAPI 3.1
* Swagger UI

---

## Containerization

* Docker
* Docker Compose

Future:

* Kubernetes

---

## Monitoring

* Prometheus
* Grafana
* Loki

---

## Logging

* Structured JSON Logging

---

# 7. Backend Modules

Backend dibagi menjadi bounded module berikut.

```text
identity

user

academic

school

subject

chapter

material

question

question_bank

question_generator

exam

cbt

submission

answer

analytics

ranking

gamification

media

notification

report

system

configuration

audit

ai
```

Setiap module berdiri sendiri dan hanya berinteraksi melalui service contract.

---

# 8. Request Lifecycle

```text
Client

↓

REST API

↓

Router

↓

Authentication

↓

Authorization

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

Supabase PostgreSQL

↓

Response DTO

↓

Client
```

Semua request mengikuti alur ini tanpa pengecualian.

---

# 9. External Services

Backend akan terintegrasi dengan beberapa layanan eksternal.

## Supabase

Digunakan untuk:

* PostgreSQL Database
* Object Storage
* Backup Infrastructure

Business Logic tidak ditempatkan pada Supabase.

---

## AI Service

Service AI dipisahkan menjadi layanan tersendiri berbasis Python.

Fungsinya meliputi:

* Generate Soal
* Generate Pembahasan
* Analisis Tingkat Kesulitan
* Klasifikasi Soal
* Semantic Search (Future)
* RAG (Future)
* AI Tutor (Future)

---

## Redis

Digunakan untuk:

* Cache
* Session
* Queue
* Temporary Data
* Rate Limiter

---

# 10. Scalability Strategy

Tahap MVP menggunakan pendekatan **Modular Monolith**.

Ketika kebutuhan meningkat, modul berikut dapat dipisahkan menjadi microservice tanpa mengubah kontrak domain:

* AI Service
* CBT Engine
* Analytics
* Notification
* Question Generator

Pendekatan ini menjaga kompleksitas tetap rendah pada fase awal sekaligus meminimalkan risiko migrasi di masa depan.

---

# 11. Design Decisions

Keputusan arsitektur utama:

* Backend menggunakan Go sebagai pusat business logic.
* Supabase digunakan sebagai managed PostgreSQL dan object storage.
* Frontend tidak mengakses database secara langsung.
* Semua akses data melalui REST API backend.
* Business rule hanya berada pada Service Layer.
* Database digunakan sebagai persistence layer, bukan sebagai tempat business logic.
* AI dipisahkan menjadi service independen.
* Seluruh modul dirancang agar dapat diekstraksi menjadi microservice apabila diperlukan.

---

# 12. Out of Scope

Dokumen ini tidak membahas secara rinci:

* Folder Structure
* Service Design
* API Specification
* Authentication Flow
* DTO
* Repository Pattern
* Error Handling
* Validation
* Logging
* Testing
* Deployment Pipeline

Masing-masing akan dijelaskan pada dokumen Backend Architecture berikutnya.

---

# 13. Expected Outcome

Dengan arsitektur ini, backend YakinLulus.id diharapkan mampu:

* Mendukung seluruh fitur MVP secara stabil.
* Menjadi fondasi untuk pengembangan fitur AI dan adaptive learning.
* Menangani pertumbuhan data dan pengguna dalam skala besar.
* Mempermudah pemeliharaan, pengujian, dan deployment.
* Berevolusi dari Modular Monolith menuju arsitektur layanan terdistribusi tanpa perubahan besar pada domain maupun kontrak API.

Selanjutnya saya menyarankan menyusun **02_backend_principle.md** terlebih dahulu. Dokumen tersebut akan mendefinisikan standar engineering (SOLID, Clean Architecture, dependency rules, transaction boundary, error propagation, coding convention, dan prinsip desain) yang akan menjadi acuan seluruh implementasi backend berikutnya.
