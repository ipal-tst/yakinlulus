# API Versioning

**Document** : `api/03_api_versioning.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan strategi **API Versioning** pada YakinLulus.id.

Tujuan utama:

- Menjaga backward compatibility
- Menghindari breaking change terhadap client
- Mendukung evolusi fitur secara bertahap
- Mempermudah deployment dan rollback
- Memungkinkan beberapa versi API berjalan secara bersamaan

API Versioning merupakan kontrak jangka panjang antara backend dan seluruh client (Web, Mobile, AI Service, dan integrasi eksternal).

---

# 2. Versioning Philosophy

Prinsip utama:

- API adalah kontrak publik
- Jangan merusak client yang sudah berjalan
- Breaking change harus menghasilkan major version baru
- Minor improvement tidak memerlukan versi baru
- Deprecated endpoint tetap tersedia selama masa transisi

---

# 3. Versioning Strategy

YakinLulus.id menggunakan:

```text
URI Versioning
```

Format:

```text
/api/v1

/api/v2
```

Contoh:

```text
GET /api/v1/questions

GET /api/v1/exams

GET /api/v2/questions
```

URI versioning dipilih karena:

- Mudah dipahami
- Didukung semua client
- Mudah di-cache
- Jelas pada dokumentasi
- Sederhana untuk deployment

---

# 4. High-Level Architecture

```text
                 Client
                    │
                    ▼
          https://api.yakinlulus.id
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
   /api/v1                    /api/v2
      │                           │
      ▼                           ▼
 Version 1 Router           Version 2 Router
      │                           │
      ▼                           ▼
 Application Layer         Application Layer
```

Beberapa versi dapat berjalan bersamaan.

---

# 5. Version Directory Structure

```text
internal/

interfaces/

http/

v1/

auth_handler.go

question_handler.go

exam_handler.go

v2/

question_handler.go

exam_handler.go
```

Business Logic tetap berada pada Application Layer.

---

# 6. Version Scope

Yang termasuk dalam versioning:

- Endpoint
- Request Body
- Response Body
- Field Name
- Authentication Flow
- Business Contract

Yang tidak termasuk:

- Internal Repository
- Database Schema Internal
- Logging
- Worker
- Domain Model

---

# 7. Semantic Versioning

Gunakan pendekatan:

```text
Major.Minor.Patch
```

Contoh:

```text
v1.0.0

v1.1.0

v1.2.3

v2.0.0
```

Namun endpoint publik hanya mengekspos:

```text
/api/v1
```

Minor dan Patch dikelola secara internal melalui release.

---

# 8. Breaking Change

Breaking Change meliputi:

- Menghapus endpoint
- Menghapus field response
- Mengubah tipe data
- Mengubah struktur JSON
- Mengubah URL endpoint
- Mengubah mekanisme authentication
- Mengubah business contract

Breaking Change **harus** menghasilkan major version baru.

---

# 9. Non-Breaking Change

Tidak memerlukan versi baru jika:

- Menambah endpoint baru
- Menambah field optional
- Optimasi performa
- Bug Fix
- Penambahan filter
- Penambahan sorting
- Penambahan pagination metadata

---

# 10. Request Compatibility

Client lama tetap dapat mengirim request sesuai kontrak versinya.

Contoh:

```text
POST /api/v1/questions
```

Tetap diproses meskipun:

```text
/api/v2/questions
```

telah tersedia.

---

# 11. Response Compatibility

Field yang sudah dipublikasikan tidak boleh dihapus.

Contoh:

Versi awal:

```json
{
  "id": "...",
  "title": "..."
}
```

Versi berikutnya:

```json
{
  "id": "...",
  "title": "...",
  "difficulty": "medium"
}
```

Penambahan field diperbolehkan selama bersifat optional.

---

# 12. Deprecation Policy

Tahapan:

```text
Released

↓

Deprecated

↓

Maintenance

↓

Retired
```

Selama status Deprecated:

- Endpoint masih berfungsi
- Dokumentasi menandai endpoint deprecated
- Client diberi waktu migrasi

---

# 13. Deprecation Header

Gunakan header:

```http
Deprecation: true

Sunset: Wed, 30 Jun 2027 00:00:00 GMT
```

Opsional:

```http
Link:
</api/v2/questions>;
rel="successor-version"
```

---

# 14. Version Routing

Router:

```text
/api/v1/*
```

dipisahkan dari:

```text
/api/v2/*
```

Setiap versi memiliki:

- Route
- Handler
- DTO

Business Logic tetap menggunakan Use Case yang sama jika kompatibel.

---

# 15. Shared Business Logic

```text
HTTP v1

↓

DTO Mapper

↓

Use Case

↓

Repository
```

```text
HTTP v2

↓

DTO Mapper

↓

Use Case

↓

Repository
```

Perbedaan versi sebisa mungkin hanya berada pada lapisan Interface.

---

# 16. DTO Versioning

Setiap versi memiliki DTO sendiri.

```text
dto/

v1/

question_request.go

question_response.go

v2/

question_request.go

question_response.go
```

Hal ini menghindari perubahan DTO memengaruhi client lama.

---

# 17. OpenAPI Versioning

Setiap versi memiliki dokumentasi sendiri.

```text
/docs/v1

/docs/v2
```

Contoh:

```text
openapi-v1.yaml

openapi-v2.yaml
```

---

# 18. Authentication Compatibility

Perubahan pada:

- JWT Claim
- Token Format
- Refresh Token Flow

yang menyebabkan client lama tidak kompatibel dianggap breaking change.

---

# 19. Database Evolution

Perubahan database tidak otomatis menyebabkan perubahan API.

Contoh:

```text
Tambah Kolom

↓

Migration

↓

Tidak mengubah API
```

API hanya berubah jika kontrak publik berubah.

---

# 20. Feature Flag

Fitur baru dapat dirilis menggunakan:

```text
Feature Flag

↓

v1 tetap

↓

v2 optional
```

Feature Flag mengurangi kebutuhan membuat versi baru.

---

# 21. Version Testing

Setiap versi memiliki:

- Unit Test
- API Test
- Contract Test
- Regression Test

Perubahan pada v2 tidak boleh merusak v1.

---

# 22. Migration Strategy

Tahapan migrasi:

```text
Release v2

↓

Client Update

↓

Monitor

↓

Deprecate v1

↓

Retire v1
```

Migration Guide harus tersedia untuk setiap major version.

---

# 23. Monitoring

Metric per versi:

- Request Count
- Error Rate
- Latency
- Active Client
- Endpoint Usage

Monitoring membantu menentukan kapan versi lama dapat dihentikan.

---

# 24. Security Consideration

Seluruh versi:

- Mendukung HTTPS
- JWT Validation
- RBAC
- Rate Limiting
- Audit Logging

Versi lama tetap menerima patch keamanan selama masa dukungan.

---

# 25. Scalability Consideration

Strategi versioning mendukung:

- Mobile App Lama
- Mobile App Baru
- Web Client Bertahap
- Public API
- AI Integration
- Third-party Integration

Beberapa versi dapat hidup berdampingan tanpa mengganggu layanan.

---

# 26. Anti-Patterns

### Mengubah Response Tanpa Version Baru

```json
{
  "name": "..."
}
```

diubah menjadi

```json
{
  "fullName": "..."
}
```

❌ Breaking Change.

---

### Menghapus Field

```json
{
  "difficulty": "hard"
}
```

dihapus tanpa major version baru.

❌

---

### Reuse DTO Antar Versi

```text
v1

↓

DTO

↓

v2 menggunakan DTO yang sama
```

❌ Menyulitkan evolusi.

---

### Menghapus Endpoint Secara Mendadak

```text
404

tanpa pemberitahuan
```

❌

---

# 27. Future Evolution

Strategi ini siap mendukung:

- Public API
- SDK Generation
- GraphQL Gateway
- gRPC Gateway
- API Marketplace
- Multi-Tenant API
- Version Negotiation
- Long-Term Support (LTS)

---

# Summary

YakinLulus.id menggunakan **URI Versioning** (`/api/v1`, `/api/v2`) sebagai strategi utama karena sederhana, stabil, dan mudah dikelola.

Prinsip implementasi:

- Breaking change menghasilkan major version baru.
- Non-breaking change tetap berada pada versi yang sama.
- DTO dipisahkan per versi.
- Business Logic dibagikan selama kontraknya kompatibel.
- Setiap versi memiliki dokumentasi OpenAPI dan pengujian sendiri.
- Deprecation dilakukan secara bertahap dengan pemberitahuan yang jelas.

Strategi ini memastikan API dapat berkembang selama bertahun-tahun tanpa mengganggu client yang telah menggunakan versi sebelumnya.