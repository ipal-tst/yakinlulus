# 02_backend_principle.md

# YakinLulus.id Backend Engineering Principles

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan prinsip-prinsip utama yang menjadi standar pengembangan backend YakinLulus.id.

Seluruh engineer wajib mengikuti dokumen ini agar seluruh kode memiliki kualitas yang konsisten, mudah dipelihara, mudah diuji, aman, dan siap berkembang hingga skala enterprise.

Dokumen ini berlaku untuk seluruh backend service, termasuk service AI yang akan dikembangkan di masa depan.

---

# 2. Engineering Philosophy

Backend YakinLulus.id dibangun berdasarkan filosofi berikut:

* Business Domain First
* Simplicity Over Complexity
* Readability Over Cleverness
* Explicit Better Than Implicit
* Security by Default
* Scalability by Design
* Performance by Design
* Testability First
* Observability First
* Fail Fast
* Backward Compatibility
* API First

---

# 3. Architectural Style

Backend menggunakan kombinasi:

```text
Modular Monolith
        +
Clean Architecture
        +
DDD Lite
        +
Repository Pattern
        +
Service Layer Pattern
```

Pendekatan ini dipilih karena:

* mudah dikembangkan
* mudah dipelihara
* deployment sederhana
* testing mudah
* scalable
* mudah diekstrak menjadi microservice

---

# 4. Layered Architecture

Setiap request harus melalui layer berikut:

```text
HTTP Request
      │
Router
      │
Middleware
      │
Controller
      │
DTO Mapping
      │
Validation
      │
Service
      │
Repository
      │
Database
```

Tidak diperbolehkan melewati layer.

---

# 5. Dependency Rule

Dependency selalu mengarah ke dalam.

```text
Controller
      │
Service
      │
Repository
      │
Database
```

Larangan:

❌ Repository memanggil Service

❌ Controller memanggil Database

❌ Controller menjalankan Query SQL

❌ Service mengetahui HTTP Context

❌ Repository mengetahui Request

---

# 6. Single Responsibility Principle

Setiap komponen hanya memiliki satu tanggung jawab.

Contoh:

Controller

* menerima request
* memanggil service
* mengembalikan response

Tidak boleh:

* query database
* menghitung ranking
* generate token
* upload file

---

Repository

Hanya bertanggung jawab terhadap persistence.

Contoh:

* FindByID
* FindByEmail
* Create
* Update
* Delete

Repository tidak boleh:

* validasi bisnis
* menghitung skor
* mengirim notifikasi
* memanggil AI

---

Service

Seluruh business rule berada di sini.

Contoh:

* Generate CBT
* Submit Exam
* Calculate Score
* Generate Question
* Publish Material
* Update Ranking

---

# 7. SOLID Principles

Backend wajib mengikuti seluruh prinsip SOLID.

## S — Single Responsibility

Satu class atau struct hanya memiliki satu tujuan.

---

## O — Open Closed

Module dapat diperluas tanpa mengubah implementasi lama.

Gunakan:

* Interface
* Strategy Pattern
* Factory Pattern

---

## L — Liskov Substitution

Semua implementasi interface harus dapat saling menggantikan tanpa mengubah perilaku sistem.

---

## I — Interface Segregation

Gunakan interface kecil.

Contoh:

```go
type UserReader interface {
    FindByID(...)
}

type UserWriter interface {
    Create(...)
}
```

Hindari interface besar yang berisi terlalu banyak metode.

---

## D — Dependency Inversion

Service bergantung pada interface, bukan implementasi.

```text
UserService
      │
UserRepository Interface
      │
PostgreSQL Repository
```

---

# 8. Domain Driven Design (DDD Lite)

Setiap module memiliki bounded context yang jelas.

Contoh:

```text
User

Question

Exam

CBT

Analytics

Ranking

Notification
```

Rule:

* Tidak boleh ada business rule lintas domain secara langsung.
* Interaksi antar domain melalui Service Contract.
* Entity tidak boleh saling bergantung secara berlebihan.

---

# 9. Modular Monolith Rules

Setiap module memiliki struktur yang sama.

```text
module

controller/

service/

repository/

entity/

dto/

mapper/

validator/

middleware/

route/

constant/

errors/
```

Module tidak boleh mengakses folder internal module lain.

Interaksi harus melalui service atau interface yang telah disepakati.

---

# 10. Business Logic Principle

Business Rule hanya berada di Service Layer.

Contoh yang termasuk business logic:

* kelulusan ujian
* perhitungan nilai
* randomisasi soal
* ranking
* AI Question Generation
* progress belajar
* unlock materi
* subscription
* badge
* achievement

Tidak boleh berada di:

* Controller
* Repository
* Database Trigger
* Frontend

---

# 11. Repository Principle

Repository hanya melakukan operasi data.

Repository tidak boleh:

* memvalidasi request
* menghitung nilai
* mengirim email
* mengirim notifikasi
* memanggil AI
* membaca JWT
* mengakses HTTP Context

Repository menerima entity atau parameter dan mengembalikan entity atau error.

---

# 12. Controller Principle

Controller harus "thin".

Controller bertugas:

* parse request
* validasi dasar
* memanggil service
* mengembalikan response

Target maksimal sekitar **50–100 baris** per method. Bila melebihi, pertimbangkan ekstraksi logika ke service atau helper yang sesuai.

---

# 13. DTO Principle

Database Entity tidak boleh langsung dikirim ke client.

Gunakan DTO.

```text
Request DTO

↓

Service

↓

Response DTO
```

Keuntungan:

* keamanan
* backward compatibility
* fleksibilitas API
* mengurangi coupling

---

# 14. Validation Principle

Validasi dibagi menjadi dua lapisan.

## Request Validation

Dilakukan sebelum masuk Service.

Contoh:

* required
* email format
* uuid
* enum
* length
* date format

---

## Business Validation

Dilakukan di Service.

Contoh:

* email sudah digunakan
* ujian sudah selesai
* peserta tidak aktif
* subscription habis
* soal tidak tersedia

---

# 15. Transaction Principle

Transaction hanya dibuat di Service Layer.

Repository tidak boleh membuka transaction sendiri.

Contoh:

```text
Service

↓

Begin Transaction

↓

Repository A

↓

Repository B

↓

Repository C

↓

Commit
```

Rollback dilakukan bila salah satu proses gagal.

---

# 16. Error Handling Principle

Gunakan error yang terstruktur.

Kategori:

* Validation Error
* Authentication Error
* Authorization Error
* Business Error
* Conflict Error
* Resource Not Found
* External Service Error
* Internal Server Error

Jangan mengembalikan stack trace ke client.

Semua error dicatat dalam log.

---

# 17. Logging Principle

Gunakan structured logging (JSON).

Minimal informasi:

* Request ID
* User ID
* Module
* Action
* Duration
* HTTP Status
* Error Code
* Timestamp

Data sensitif seperti password, refresh token, OTP, dan access token tidak boleh dicatat.

---

# 18. Security Principle

Seluruh endpoint wajib:

* Authentication
* Authorization
* Input Validation
* Output Sanitization
* Rate Limiting
* Audit Logging

Semua komunikasi menggunakan HTTPS.

Password disimpan menggunakan Argon2id atau bcrypt dengan parameter yang memenuhi rekomendasi keamanan saat implementasi.

---

# 19. Performance Principle

Prioritaskan:

* Query efisien
* Index yang tepat
* Pagination
* Lazy loading bila diperlukan
* Cache untuk data yang sering diakses
* Hindari N+1 Query
* Hindari over-fetching

Target:

* API normal < 300 ms
* Query sederhana < 100 ms

Target ini berlaku pada kondisi operasional normal dan akan dievaluasi kembali berdasarkan hasil load testing.

---

# 20. API Principle

Semua endpoint harus:

* RESTful
* Stateless
* Versioned
* JSON
* Consistent Response Format

Contoh:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

---

# 21. Naming Convention

Gunakan nama yang jelas.

Contoh:

Baik:

* UserService
* QuestionRepository
* GenerateExam
* CalculateScore

Hindari:

* Utils
* Helper2
* ProcessData
* Temp
* Misc

---

# 22. Configuration Principle

Tidak boleh ada konfigurasi yang di-hardcode.

Semua konfigurasi berasal dari:

* Environment Variable
* Configuration File
* Secret Manager (Future)

Contoh:

* Database URL
* JWT Secret
* Redis URL
* AI Endpoint
* Storage Bucket

---

# 23. Testing Principle

Target pengujian:

* Unit Test
* Integration Test
* API Test
* Load Test
* Security Test

Business Rule wajib memiliki unit test.

Repository diuji melalui integration test terhadap database.

---

# 24. Documentation Principle

Seluruh API harus memiliki dokumentasi OpenAPI.

Perubahan pada:

* endpoint
* request
* response
* entity
* business rule

wajib diikuti pembaruan dokumentasi terkait.

---

# 25. Scalability Principle

Setiap module harus dapat dipisahkan menjadi microservice di masa depan.

Oleh karena itu:

* jangan membuat dependency silang yang kuat
* gunakan interface
* hindari global state
* gunakan event atau service contract bila diperlukan

---

# 26. Definition of Done

Sebuah fitur backend dianggap selesai apabila memenuhi seluruh kriteria berikut:

* Business Rule selesai
* Unit Test lulus
* Integration Test lulus
* API Documentation diperbarui
* Logging tersedia
* Error Handling lengkap
* Validation lengkap
* Security Review selesai
* Code Review disetujui
* Tidak ada critical issue

---

# 27. Backend Engineering Checklist

Sebelum merge ke branch utama, pastikan:

* Mengikuti struktur module.
* Tidak ada business logic di controller.
* Tidak ada business logic di repository.
* Menggunakan DTO.
* Menggunakan transaction pada operasi multi-repository.
* Error menggunakan format standar.
* Logging sudah tersedia.
* Tidak ada hardcoded secret.
* Query telah dioptimalkan.
* Dokumentasi diperbarui.
* Unit test dan integration test berhasil.

---

# 28. Summary

Prinsip-prinsip dalam dokumen ini menjadi standar teknis backend YakinLulus.id. Dengan mematuhi aturan ini, seluruh kode akan memiliki karakteristik:

* Konsisten
* Mudah dipelihara
* Mudah diuji
* Aman
* Siap diskalakan
* Mudah berevolusi menuju arsitektur terdistribusi apabila diperlukan di masa depan.

Dokumen berikutnya yang paling penting adalah **03_folder_structure.md**, karena seluruh prinsip pada dokumen ini akan diterapkan ke struktur proyek Go secara nyata, termasuk pemisahan module, package, konfigurasi, middleware, shared library, dan integrasi Supabase.
