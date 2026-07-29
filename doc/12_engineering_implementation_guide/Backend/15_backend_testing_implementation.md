# Backend Testing Implementation

**Document** : `backend/15_backend_testing_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Backend Testing** pada YakinLulus.id.

Testing bertujuan memastikan bahwa backend tetap:

- Benar (Correctness)
- Stabil (Reliability)
- Aman (Security)
- Mudah dipelihara (Maintainability)
- Siap dikembangkan (Scalability)

Testing merupakan bagian dari pipeline engineering dan wajib dijalankan sebelum perubahan kode dapat di-merge ke branch utama.

---

# 2. Testing Philosophy

Prinsip utama:

- Test Early
- Test Automatically
- Test Business Logic
- Test Public Contract
- Test Failure Scenario
- Deterministic
- Repeatable
- Independent

Testing tidak hanya memverifikasi skenario sukses, tetapi juga seluruh kondisi gagal.

---

# 3. Testing Pyramid

```text
                 E2E
                  ▲
            Integration Test
                  ▲
             Unit Test
```

Komposisi yang direkomendasikan:

| Jenis | Persentase |
|--------|-----------:|
| Unit Test | 70% |
| Integration Test | 20% |
| End-to-End/API Test | 10% |

---

# 4. Testing Scope

Setiap module backend wajib memiliki pengujian terhadap:

- Entity
- Value Object
- Domain Service
- Use Case
- Repository
- API Handler
- Middleware
- Worker
- Scheduler

---

# 5. Unit Testing

Unit Test memverifikasi satu komponen secara terisolasi.

Target utama:

- Domain Layer
- Use Case
- Utility
- Validation
- Mapper

Dependency eksternal harus diganti dengan mock atau fake.

---

# 6. Unit Test Structure

Struktur direktori:

```text
internal/

question/

application/

create_question.go
create_question_test.go

domain/

question.go
question_test.go
```

Setiap file utama memiliki pasangan file test.

---

# 7. Table Driven Test

Gunakan pola **Table Driven Test**.

Contoh:

```text
Case 1:
Valid Input

Case 2:
Duplicate Question

Case 3:
Empty Title

Case 4:
Unauthorized
```

Pendekatan ini memudahkan penambahan skenario baru.

---

# 8. Mock Strategy

Yang boleh di-mock:

- Repository
- External API
- Redis
- Storage
- Notification
- AI Service
- Queue Publisher

Yang tidak boleh di-mock:

- Domain Entity
- Value Object
- Business Rule

---

# 9. Integration Testing

Integration Test memverifikasi interaksi antar komponen.

Contoh:

```text
Use Case

↓

Repository

↓

PostgreSQL
```

Gunakan PostgreSQL nyata pada environment test.

---

# 10. Database Testing

Gunakan database terpisah.

```text
Development DB

≠

Testing DB
```

Setiap test:

- menjalankan migration;
- menyiapkan data uji;
- membersihkan data setelah selesai.

---

# 11. Transaction Rollback Testing

Skenario yang diuji:

- Commit berhasil
- Rollback karena validation error
- Rollback karena repository error
- Rollback saat panic
- Rollback saat timeout

---

# 12. Repository Testing

Repository diuji terhadap:

- Insert
- Update
- Delete
- Soft Delete
- Pagination
- Search
- Aggregate Query

Verifikasi hasil data dan performa query.

---

# 13. API Testing

Endpoint diuji menggunakan HTTP test.

Minimal:

- Success
- Invalid Request
- Unauthorized
- Forbidden
- Not Found
- Conflict
- Internal Error

Pastikan response sesuai kontrak API.

---

# 14. Middleware Testing

Middleware yang diuji:

- Authentication
- Authorization
- Request ID
- Logging
- Recovery
- Rate Limiting
- CORS

---

# 15. Worker Testing

Worker diuji untuk:

- Job berhasil
- Retry
- Timeout
- Cancellation
- Dead Letter Queue
- Idempotency

Gunakan Redis test environment atau mock queue sesuai kebutuhan.

---

# 16. Validation Testing

Verifikasi:

- Required Field
- Enum
- UUID
- Email
- Business Rule
- File Upload
- Excel Import

Seluruh validation error harus mengembalikan format yang konsisten.

---

# 17. Error Handling Testing

Skenario:

- Database Error
- Redis Error
- External API Error
- Panic
- Timeout
- Conflict
- Duplicate Data

Verifikasi:

- HTTP Status
- Error Code
- Logging
- Rollback (jika relevan)

---

# 18. Security Testing

Minimal pengujian:

- SQL Injection
- XSS Input
- JWT Validation
- Expired Token
- Invalid Signature
- Role Escalation
- File Upload Restriction

---

# 19. Performance Testing

Pengujian dilakukan untuk:

- API Latency
- Throughput
- Concurrent Request
- Queue Processing
- Database Query Time

Target awal MVP:

| Metric | Target |
|---------|--------|
| P95 API Latency | < 300 ms |
| P99 API Latency | < 800 ms |
| Health Check | < 50 ms |

Target dapat disesuaikan seiring pertumbuhan platform.

---

# 20. Load Testing

Simulasi beban dilakukan pada fitur utama:

- Login
- Question Search
- CBT Runtime
- Submit Answer
- Ranking
- Analytics

Gunakan:

- k6
- Vegeta

Hasil menjadi dasar capacity planning.

---

# 21. Stress Testing

Stress Test bertujuan menemukan batas sistem.

Skenario:

- Ribuan login bersamaan
- Puluhan ribu submit jawaban
- Import soal besar
- AI Worker dalam jumlah tinggi

Observasi:

- CPU
- Memory
- Connection Pool
- Queue Length
- Error Rate

---

# 22. Regression Testing

Setiap perubahan:

- bug fix;
- refactoring;
- fitur baru;

tidak boleh merusak perilaku yang sudah ada.

Regression test dijalankan otomatis pada pipeline CI.

---

# 23. Code Coverage

Target minimum:

| Layer | Coverage |
|---------|---------:|
| Domain | ≥ 95% |
| Application | ≥ 90% |
| Repository | ≥ 80% |
| API Handler | ≥ 80% |
| Total Backend | ≥ 85% |

Coverage bukan satu-satunya indikator kualitas, tetapi menjadi baseline engineering.

---

# 24. Test Data Management

Gunakan:

```text
fixtures/

seed/

factory/
```

Karakteristik:

- deterministik;
- mudah dibaca;
- dapat digunakan ulang;
- tidak bergantung pada data production.

---

# 25. CI/CD Integration

Setiap Pull Request menjalankan:

```text
Lint

↓

Unit Test

↓

Integration Test

↓

Security Scan

↓

Coverage

↓

Build

↓

Artifact
```

Merge ke branch utama hanya diperbolehkan jika seluruh tahapan berhasil.

---

# 26. Reporting

Setiap pipeline menghasilkan laporan:

- Test Result
- Coverage
- Failed Test
- Benchmark
- Security Finding

Laporan disimpan sebagai artifact CI.

---

# 27. Testing Tools

| Kebutuhan | Tool |
|-----------|------|
| Unit Test | Go testing |
| Assertion | testify |
| Mock | mockery |
| HTTP Test | httptest |
| Database | PostgreSQL Test DB |
| Load Test | k6 |
| Benchmark | Go Benchmark |
| Lint | golangci-lint |
| Security | gosec |

---

# 28. Anti-Patterns

### Test Bergantung Internet

```text
Call External API

❌
```

---

### Test Menggunakan Database Production

```text
Production DB

❌
```

---

### Sleep untuk Menunggu Proses

```go
time.Sleep(...)
```

❌

Gunakan synchronization yang dapat diprediksi.

---

### Shared State Antar Test

```text
Test A

↓

Mengubah Data

↓

Test B

❌
```

Setiap test harus independen.

---

### Coverage Tinggi Tanpa Menguji Business Rule

Coverage tinggi bukan jaminan kualitas apabila skenario bisnis penting tidak diuji.

---

# 29. Scalability Consideration

Strategi testing mendukung:

- Parallel Test Execution
- Distributed CI Runner
- Multi Database
- Multi Worker
- Multi Environment
- Microservice Migration

Karena pengujian dipisahkan berdasarkan layer dan tanggung jawab.

---

# 30. Future Evolution

Strategi testing siap berkembang menuju:

- Contract Testing
- Consumer Driven Contract (CDC)
- Chaos Engineering
- Fault Injection
- Mutation Testing
- Automated Performance Regression
- AI-assisted Test Generation

Implementasi tersebut dapat ditambahkan tanpa mengubah struktur dasar testing.

---

# Summary

Backend Testing pada YakinLulus.id mengikuti pendekatan **production-grade engineering** dengan fokus pada kualitas dan keandalan.

Prinsip utama:

- Testing mengikuti Testing Pyramid.
- Unit Test mendominasi pengujian.
- Integration Test menggunakan PostgreSQL nyata.
- API diuji berdasarkan kontrak.
- Worker, transaction, dan security memiliki pengujian khusus.
- Pipeline CI/CD menjalankan seluruh rangkaian pengujian secara otomatis.
- Target coverage ditetapkan sebagai standar minimum, dengan prioritas utama tetap pada pengujian business rule.

Dengan strategi ini, backend siap berkembang secara aman, terukur, dan tetap stabil seiring bertambahnya fitur serta jumlah pengguna.