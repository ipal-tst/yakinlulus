# 24_api_versioning.md

# YakinLulus.id API Versioning Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan strategi **API Versioning** untuk seluruh Backend API YakinLulus.id.

Tujuan utama API Versioning adalah:

* Menjaga backward compatibility.
* Memungkinkan evolusi API tanpa merusak client yang sudah ada.
* Mendukung pengembangan mobile, web, dan integrasi pihak ketiga secara independen.
* Menyediakan proses migrasi API yang terstruktur.

---

# 2. Objectives

API Versioning dirancang untuk:

* Stable API
* Predictable Changes
* Backward Compatibility
* Easy Deprecation
* Simple Client Integration
* Long-Term Maintainability

---

# 3. Design Principles

Seluruh API mengikuti prinsip:

* URI Versioning
* Semantic Evolution
* Backward Compatible by Default
* Non-Breaking First
* Explicit Deprecation
* Single Source of Truth
* Documentation First

---

# 4. Versioning Strategy

YakinLulus.id menggunakan **URI Versioning**.

Format:

```text
/api/v1/...
```

Contoh:

```text
/api/v1/auth/login

/api/v1/questions

/api/v1/exams

/api/v1/materials
```

URI Versioning dipilih karena sederhana, mudah dipahami, dan didukung oleh seluruh client.

---

# 5. Future Version

Ketika terjadi breaking change:

```text
/api/v2/...
```

Selama masa transisi:

```text
/api/v1/...

/api/v2/...
```

Kedua versi dapat berjalan bersamaan hingga v1 dinyatakan usang (deprecated).

---

# 6. Version Directory Structure

```text
internal/

api/

v1/

auth/

question/

exam/

student/

teacher/

analytics/

v2/
```

Business Layer tetap digunakan bersama jika memungkinkan.

---

# 7. Layer Separation

Version hanya berada pada lapisan API.

```text
Client

↓

API v1

↓

Service

↓

Repository
```

Service dan Repository tidak mengetahui versi API.

---

# 8. Request Flow

```text
Client

↓

/api/v1/questions

↓

Controller

↓

Service

↓

Repository

↓

Database
```

Perubahan versi umumnya hanya memengaruhi Controller, DTO, dan dokumentasi.

---

# 9. When to Create New Version

Versi baru dibuat jika terjadi:

* Penghapusan endpoint.
* Perubahan struktur response yang tidak kompatibel.
* Perubahan kontrak request.
* Perubahan mekanisme autentikasi.
* Perubahan besar pada domain model yang tidak dapat dipertahankan kompatibilitasnya.

---

# 10. Non-Breaking Changes

Perubahan berikut **tidak memerlukan versi baru**:

* Menambah endpoint baru.
* Menambah optional field.
* Meningkatkan performa.
* Perbaikan bug.
* Penambahan filter baru yang opsional.
* Penambahan enum baru yang didukung client.

---

# 11. Breaking Changes

Contoh breaking change:

Sebelumnya:

```json
{
  "name": "Mathematics"
}
```

Menjadi:

```json
{
  "subject_name": "Mathematics"
}
```

Perubahan nama field wajib menggunakan versi baru atau tetap menyediakan kompatibilitas.

---

# 12. Response Compatibility

Field lama tidak langsung dihapus.

Tahapan:

```text
v1

↓

Deprecated

↓

Migration Period

↓

Removed in v2
```

Hal ini memberi waktu kepada client untuk melakukan migrasi.

---

# 13. API Deprecation Policy

Setiap endpoint memiliki status:

* Active
* Deprecated
* Removed

Endpoint deprecated masih dapat digunakan selama periode migrasi yang ditentukan.

---

# 14. Deprecation Header

Endpoint deprecated mengembalikan header informatif.

Contoh:

```text
Deprecation: true

Sunset: 2028-01-01
```

Header tambahan dapat menyertakan tautan ke dokumentasi migrasi.

---

# 15. Version Lifecycle

```text
Development

↓

Beta

↓

Stable

↓

Deprecated

↓

Retired
```

Setiap fase memiliki dokumentasi dan jadwal yang jelas.

---

# 16. DTO Versioning

DTO dipisahkan per versi.

```text
dto/

v1/

question_response.go

v2/

question_response.go
```

Hal ini mencegah perubahan DTO memengaruhi client lama.

---

# 17. Controller Versioning

Contoh struktur:

```text
controller/

v1/

question_controller.go

v2/

question_controller.go
```

Business Service tetap digunakan bersama bila logika bisnis tidak berubah.

---

# 18. Service Layer

Service bersifat version-independent.

```text
API v1

↓

Question Service

↑

API v2
```

Satu service dapat digunakan oleh beberapa versi API.

---

# 19. Repository Layer

Repository tidak memiliki konsep versi.

```text
Question Repository

↓

PostgreSQL
```

Repository hanya menangani akses data.

---

# 20. API Documentation

Setiap versi memiliki dokumentasi tersendiri.

Contoh:

```text
/api/docs/v1

/api/docs/v2
```

Swagger/OpenAPI dipublikasikan per versi.

---

# 21. OpenAPI Specification

Masing-masing versi memiliki:

* OpenAPI File
* Swagger UI
* Example Request
* Example Response
* Error Catalog

Dokumentasi dihasilkan otomatis dari source code bila memungkinkan.

---

# 22. SDK Compatibility

Jika SDK resmi dikembangkan di masa depan:

```text
SDK v1

↓

API v1

SDK v2

↓

API v2
```

Versi SDK mengikuti versi API.

---

# 23. Mobile Compatibility

Mobile App dapat:

* Menggunakan v1.
* Bermigrasi bertahap ke v2.
* Berjalan berdampingan selama masa transisi.

Tidak ada kewajiban migrasi instan.

---

# 24. Web Compatibility

Frontend Web mengikuti strategi:

* Incremental Migration.
* Feature Flag.
* Canary Release.

Migrasi dilakukan per modul, bukan sekaligus.

---

# 25. API Discovery

Endpoint:

```text
GET /api/version
```

Contoh response:

```json
{
  "current": "v1",
  "supported": [
    "v1"
  ]
}
```

Ketika tersedia versi baru:

```json
{
  "current": "v2",
  "supported": [
    "v1",
    "v2"
  ]
}
```

---

# 26. Version Negotiation

MVP menggunakan URI Versioning.

Header-based versioning tidak digunakan.

Contoh yang **tidak digunakan**:

```text
Accept: application/vnd.yakinlulus.v1+json
```

Strategi ini dapat dipertimbangkan di masa depan bila diperlukan.

---

# 27. Error Compatibility

Format error harus konsisten di seluruh versi.

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```

Perubahan struktur error termasuk breaking change.

---

# 28. Pagination Compatibility

Format pagination dipertahankan.

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

Field baru dapat ditambahkan tanpa menghapus field lama.

---

# 29. Authentication Compatibility

JWT tetap digunakan pada semua versi.

Perubahan mekanisme autentikasi yang tidak kompatibel memerlukan versi API baru.

---

# 30. Monitoring

Monitoring dilakukan per versi.

Metric:

* Request Count
* Error Rate
* Latency
* Active Client
* Deprecated Endpoint Usage

---

# 31. Logging

Log menyimpan:

* API Version
* Endpoint
* Request ID
* Duration
* Status Code

Informasi ini membantu analisis migrasi.

---

# 32. Analytics

Analytics API Version melacak:

* Persentase penggunaan v1.
* Persentase penggunaan v2.
* Endpoint deprecated yang masih aktif.
* Client yang belum bermigrasi.

---

# 33. Testing Strategy

Setiap versi memiliki:

* Unit Test
* Integration Test
* API Contract Test
* Regression Test

Versi lama tetap diuji selama masih didukung.

---

# 34. Migration Strategy

Tahapan migrasi:

```text
Develop v2

↓

Internal Testing

↓

Beta

↓

Release

↓

Deprecate v1

↓

Retire v1
```

Migrasi dilakukan secara bertahap dan terencana.

---

# 35. Release Policy

Minor release:

* Tidak membuat versi API baru.

Major release:

* Dapat menghasilkan v2, v3, dan seterusnya.

Versi API tidak selalu mengikuti versi aplikasi.

---

# 36. Security

Seluruh versi mengikuti standar keamanan yang sama:

* JWT Validation
* RBAC
* HTTPS
* Rate Limiting
* Input Validation
* Audit Logging

Tidak ada pengecualian untuk versi lama yang masih aktif.

---

# 37. Anti-Patterns

Tidak diperbolehkan:

* Mengubah kontrak API tanpa versi baru.
* Menghapus field tanpa masa deprecasi.
* Menggunakan beberapa strategi versioning sekaligus.
* Menempatkan business logic berbeda hanya karena versi API.
* Membuat endpoint baru untuk perubahan kecil yang kompatibel.

---

# 38. API Version Checklist

Sebelum merilis versi baru:

* Breaking change telah diidentifikasi.
* Dokumentasi OpenAPI tersedia.
* Migration Guide selesai.
* Contract Test lulus.
* Monitoring diperbarui.
* Deprecation Policy diumumkan.
* Backward compatibility dievaluasi.

---

# 39. Relationship dengan Arsitektur Lain

API Versioning berada pada lapisan terluar backend.

```text
Client

↓

API v1 / v2

↓

Authentication

↓

Business Service

↓

Repository

↓

Database
```

Strategi ini memastikan evolusi API tidak memengaruhi domain model maupun business logic.

---

# 40. Roadmap

**Phase 1 (MVP)**

* API v1
* URI Versioning
* OpenAPI v1

**Phase 2**

* API v2
* Migration Dashboard
* SDK Versioning

**Phase 3**

* Enterprise API Management
* API Lifecycle Dashboard
* Automatic Contract Validation
* API Gateway Integration

---

# 41. Summary

YakinLulus.id menerapkan **URI-Based API Versioning** dengan prinsip **Backward Compatibility**, **Controller-Level Versioning**, dan **Shared Business Layer**.

Pendekatan ini memberikan:

* Evolusi API yang aman tanpa mengganggu client lama.
* Pemisahan yang jelas antara lapisan API dan business logic.
* Dokumentasi dan pengujian yang terstruktur untuk setiap versi.
* Fondasi yang siap mendukung integrasi web, mobile, dan layanan pihak ketiga dalam jangka panjang.
