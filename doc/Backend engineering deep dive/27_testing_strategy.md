# 27_testing_strategy.md

# YakinLulus.id Backend Testing Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan strategi pengujian (**Testing Strategy**) untuk seluruh backend YakinLulus.id.

Testing merupakan bagian integral dari Software Development Lifecycle (SDLC) dan bertujuan memastikan bahwa setiap perubahan kode tetap memenuhi kebutuhan bisnis, menjaga kualitas aplikasi, serta mencegah regresi.

Testing diterapkan pada seluruh komponen backend, termasuk:

* Authentication
* User Management
* Question Bank
* CBT Runtime
* AI Service
* Import & Export Pipeline
* Analytics
* Notification
* Background Job
* API Layer

---

# 2. Objectives

Testing Strategy dirancang untuk:

* High Reliability
* Early Bug Detection
* Regression Prevention
* Safe Refactoring
* Continuous Delivery
* Performance Verification
* Security Validation
* Maintainability

---

# 3. Testing Principles

Seluruh pengujian mengikuti prinsip:

* Shift Left Testing
* Test Pyramid
* Fast Feedback
* Deterministic Test
* Independent Test
* Repeatable Test
* Automated First
* Production-like Environment

---

# 4. Testing Pyramid

```text id="tp1"
                 E2E Test
              Integration Test
                 Unit Test
```

Distribusi target:

| Test Type        | Target |
| ---------------- | ------ |
| Unit Test        | 70%    |
| Integration Test | 20%    |
| End-to-End Test  | 10%    |

---

# 5. Testing Scope

Seluruh layer backend wajib diuji.

```text id="tp2"
Controller

↓

Service

↓

Repository

↓

Database

↓

External Service
```

---

# 6. Test Categories

Kategori pengujian:

* Unit Test
* Integration Test
* API Contract Test
* End-to-End Test
* Performance Test
* Load Test
* Stress Test
* Security Test
* Chaos Test (Future)
* UAT

---

# 7. Directory Structure

```text id="tp3"
tests/

unit/

integration/

contract/

e2e/

performance/

fixtures/

testdata/

mock/
```

---

# 8. Unit Testing

Unit Test menguji:

* Service
* Business Logic
* Validation
* Helper
* Utility
* Mapper

Tidak menggunakan database atau layanan eksternal.

---

# 9. Unit Test Rules

Unit Test harus:

* Cepat (<100 ms/test)
* Deterministik
* Independen
* Tidak bergantung jaringan
* Menggunakan mock

---

# 10. Mock Strategy

Seluruh dependency dimock.

Contoh:

```text id="tp4"
Service

↓

Mock Repository

↓

Fake Data
```

Interface digunakan untuk mempermudah mocking.

---

# 11. Repository Testing

Repository diuji menggunakan database sungguhan.

Environment:

```text id="tp5"
Temporary PostgreSQL

↓

Migration

↓

Test

↓

Destroy
```

Disarankan menggunakan container sementara selama pengujian.

---

# 12. Integration Testing

Integration Test menguji integrasi antar komponen.

Contoh:

* Controller → Service
* Service → Repository
* Repository → PostgreSQL
* Worker → Redis

---

# 13. API Testing

Seluruh endpoint diuji.

Mencakup:

* Success Response
* Validation Error
* Unauthorized
* Forbidden
* Not Found
* Conflict
* Internal Error

---

# 14. API Contract Testing

API Contract memastikan:

* Request Schema
* Response Schema
* Status Code
* Header
* Error Format

Contract mengikuti spesifikasi OpenAPI.

---

# 15. Database Testing

Yang diuji:

* Migration
* Constraint
* Trigger
* Transaction
* Rollback
* Index Usage

Migration diuji dari database kosong.

---

# 16. Authentication Testing

Pengujian:

* Login
* Logout
* Refresh Token
* Expired Token
* Invalid Token
* Permission Check
* Role Validation

---

# 17. Authorization Testing

Semua permission diuji.

Contoh:

Student:

* Tidak boleh publish soal.

Teacher:

* Tidak boleh menghapus sekolah.

Admin:

* Dapat mengelola sesuai hak akses.

---

# 18. Validation Testing

Seluruh DTO diuji.

Kasus:

* Required
* Max Length
* Enum
* Invalid Format
* Duplicate
* Business Validation

---

# 19. AI Service Testing

Yang diuji:

* Prompt Builder
* JSON Parser
* Response Validation
* Retry
* Timeout
* Fallback Provider

LLM dipalsukan (mock) pada Unit Test.

---

# 20. Import Pipeline Testing

Pengujian:

* Excel Parsing
* CSV Parsing
* Validation
* Batch Import
* Partial Failure
* Duplicate Detection

---

# 21. CBT Runtime Testing

Pengujian:

* Start Exam
* Resume
* Auto Save
* Timer
* Randomization
* Submit
* Auto Submit
* Offline Recovery
* Concurrent Session

---

# 22. Analytics Testing

Yang diuji:

* Event Processing
* Aggregation
* Dashboard
* Metrics Calculation
* Ranking

---

# 23. Background Job Testing

Yang diuji:

* Queue
* Retry
* Dead Letter Queue
* Scheduler
* Worker Failure
* Idempotency

---

# 24. Storage Testing

Pengujian:

* Upload
* Download
* Signed URL
* Permission
* Expired URL

---

# 25. Performance Testing

Target:

* Response Time
* Throughput
* CPU Usage
* Memory Usage
* Database Query Time

Dilakukan menggunakan dataset representatif.

---

# 26. Load Testing

Target MVP:

| Operation          | Target           |
| ------------------ | ---------------- |
| Login              | 500 concurrent   |
| API                | 1.000 RPS        |
| CBT Active Session | 1.000 concurrent |
| Question Search    | 500 concurrent   |

Target dapat ditingkatkan sesuai roadmap.

---

# 27. Stress Testing

Pengujian hingga sistem mencapai batas.

Metrik:

* Failure Point
* Recovery Time
* Error Rate
* Queue Growth

---

# 28. Security Testing

Pengujian:

* SQL Injection
* XSS
* CSRF
* Authentication Bypass
* JWT Validation
* Rate Limit
* File Upload
* Broken Access Control

Mengacu pada OWASP Top 10.

---

# 29. Chaos Testing (Future)

Contoh simulasi:

* Redis Down
* AI Provider Down
* Network Latency
* Queue Failure
* Storage Failure

Mengukur ketahanan sistem.

---

# 30. Test Data Strategy

Menggunakan:

* Fixture
* Factory
* Seeder

Data uji dipisahkan dari data produksi.

---

# 31. Test Environment

Environment:

* Local
* CI
* Staging

Production tidak digunakan untuk pengujian otomatis.

---

# 32. Code Coverage

Target minimum:

| Layer      | Coverage |
| ---------- | -------- |
| Service    | ≥ 90%    |
| Validation | ≥ 95%    |
| Helper     | ≥ 95%    |
| Repository | ≥ 80%    |
| Controller | ≥ 80%    |

Target keseluruhan backend:

**≥ 85%**

Coverage digunakan sebagai indikator kualitas, bukan satu-satunya ukuran.

---

# 33. CI Testing Pipeline

```text id="tp6"
Commit

↓

Lint

↓

Unit Test

↓

Integration Test

↓

Contract Test

↓

Coverage

↓

Build

↓

Deploy
```

Pipeline berhenti jika salah satu tahap gagal.

---

# 34. Regression Testing

Regression Test dijalankan:

* Sebelum Release
* Setelah Refactoring
* Setelah Major Feature
* Sebelum Production Deployment

---

# 35. UAT

User Acceptance Test melibatkan:

* Admin
* Guru
* Siswa

Skenario diambil dari PRD dan Acceptance Criteria.

---

# 36. Test Reporting

Laporan berisi:

* Total Test
* Passed
* Failed
* Coverage
* Duration
* Flaky Test

Laporan dihasilkan otomatis pada CI.

---

# 37. Static Analysis

CI menjalankan:

* `go vet`
* Static Analysis
* Dependency Vulnerability Scan
* Secret Detection

Temuan kritikal menggagalkan pipeline.

---

# 38. Benchmark Testing

Benchmark dilakukan untuk:

* Question Search
* Import Pipeline
* AI Parsing
* CBT Runtime
* Analytics Aggregation

Benchmark diulang secara berkala.

---

# 39. Failure Criteria

Build gagal jika:

* Unit Test gagal.
* Integration Test gagal.
* Contract Test gagal.
* Coverage di bawah batas.
* Security Scan menemukan kerentanan kritikal.
* Lint gagal.

---

# 40. Test Documentation

Setiap modul memiliki:

* Test Plan
* Test Case
* Expected Result
* Regression Checklist

Dokumentasi mengikuti perubahan PRD.

---

# 41. Anti-Patterns

Tidak diperbolehkan:

* Menguji production database.
* Test bergantung urutan eksekusi.
* Hardcode data sensitif.
* Menggunakan layanan AI sungguhan pada Unit Test.
* Mengabaikan flaky test.
* Merge ke branch utama tanpa pipeline lulus.

---

# 42. Testing Checklist

Sebelum release:

* Unit Test lulus.
* Integration Test lulus.
* API Contract Test lulus.
* Performance Test sesuai target.
* Security Test selesai.
* Coverage memenuhi standar.
* Regression Test selesai.
* UAT disetujui.
* Smoke Test berhasil.

---

# 43. Relationship dengan Arsitektur Lain

Testing Strategy mencakup seluruh backend.

```text id="tp7"
Backend Module

↓

Testing

↓

CI/CD

↓

Deployment

↓

Production
```

Testing menjadi bagian wajib sebelum setiap proses deployment.

---

# 44. Roadmap

**Phase 1 (MVP)**

* Unit Test
* Integration Test
* API Test
* CI Automation

**Phase 2**

* Contract Test
* Load Test
* Performance Dashboard

**Phase 3**

* Chaos Engineering
* Continuous Performance Testing
* AI-assisted Test Generation
* Mutation Testing

---

# 45. Summary

Backend Testing Strategy YakinLulus.id menerapkan pendekatan **Test Pyramid**, **Automation First**, dan **Continuous Testing**.

Strategi ini memberikan:

* Deteksi bug sejak tahap awal pengembangan.
* Perlindungan terhadap regresi saat refactoring.
* Validasi menyeluruh pada business logic, API, database, dan pipeline AI.
* Integrasi penuh dengan CI/CD sehingga hanya perubahan yang memenuhi standar kualitas yang dapat dipromosikan ke lingkungan produksi.
