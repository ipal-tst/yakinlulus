# OpenAPI Documentation

**Document** : `api/19_openapi_documentation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar **OpenAPI Documentation** pada YakinLulus.id.

Seluruh REST API wajib memiliki dokumentasi yang dihasilkan secara otomatis menggunakan spesifikasi **OpenAPI 3.1**, sehingga:

- API mudah dipahami developer
- Mendukung frontend dan mobile development
- Mendukung integrasi pihak ketiga
- Mendukung code generation
- Mendukung contract-first development
- Menjadi single source of truth untuk seluruh API

---

# 2. Standar yang Digunakan

YakinLulus.id menggunakan:

| Standard | Version |
|----------|----------|
| OpenAPI | 3.1 |
| JSON Schema | 2020-12 |
| REST | RFC 9110 |
| JWT Bearer | RFC 6750 |

---

# 3. Documentation Architecture

```text
              Go Source Code
                     │
                     ▼
            Swagger Annotation
                     │
                     ▼
         OpenAPI Specification
                     │
         ┌───────────┼────────────┐
         ▼           ▼            ▼
   Swagger UI    ReDoc UI    Client SDK
                     │
                     ▼
             Frontend / Mobile
```

---

# 4. API Documentation Endpoint

Production

```text
https://api.yakinlulus.id/docs
```

Swagger JSON

```text
https://api.yakinlulus.id/openapi.json
```

YAML

```text
https://api.yakinlulus.id/openapi.yaml
```

Development

```text
http://localhost:8080/docs
```

---

# 5. Documentation Tools

Rekomendasi:

- OpenAPI Generator
- Swagger UI
- ReDoc
- Spectral (linting)
- Stoplight Studio (optional)
- Postman Collection Generator

---

# 6. API Metadata

```yaml
title: YakinLulus API

version: v1

description: Enterprise Education Platform API

contact:
  name: Engineering Team

license:
  name: Proprietary
```

---

# 7. Tag Organization

Dokumentasi dikelompokkan berdasarkan domain.

```text
Authentication

Users

Question Bank

Learning Material

Exam

CBT Runtime

Submission

Scoring

Analytics

Ranking

AI

File

Notification

Administration
```

---

# 8. Standard Path Example

```yaml
/api/v1/users

/api/v1/exams

/api/v1/questions

/api/v1/materials

/api/v1/cbt

/api/v1/scoring
```

---

# 9. Operation ID

Setiap endpoint wajib memiliki Operation ID yang unik.

Contoh:

```yaml
getUserById

createExam

submitAnswer

startExam

generateQuestion
```

Format:

```text
verb + resource
```

---

# 10. Schema Definition

Seluruh object didefinisikan pada:

```yaml
components:

  schemas:
```

Contoh:

```yaml
User

Exam

Question

Material

Result

Score
```

Schema digunakan kembali (reusable) oleh seluruh endpoint.

---

# 11. Security Scheme

```yaml
securitySchemes:

BearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

Endpoint publik tidak menggunakan security requirement.

---

# 12. Request Example

```yaml
requestBody:

application/json
```

Contoh:

```json
{
  "title": "UTBK Simulation",
  "duration": 90
}
```

Setiap request harus memiliki contoh yang valid.

---

# 13. Response Example

```yaml
responses:

200

400

401

403

404

409

422

500
```

Contoh:

```json
{
  "success": true,
  "data": {}
}
```

Semua response harus memiliki contoh.

---

# 14. Error Schema

Standar error:

```yaml
ErrorResponse
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  }
}
```

Digunakan secara konsisten di seluruh API.

---

# 15. Pagination Schema

```yaml
page

pageSize

total

totalPage
```

Response

```json
{
  "data": [],
  "pagination": {}
}
```

---

# 16. Enum Documentation

Semua enum harus terdokumentasi.

Contoh:

```yaml
Difficulty

Easy

Medium

Hard
```

```yaml
ExamStatus

Draft

Published

Running

Finished
```

---

# 17. Authentication Flow

Dokumentasi harus menjelaskan:

```text
Login

↓

Receive JWT

↓

Authorization Header

↓

Access API
```

Contoh:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 18. Versioning

Dokumentasi mendukung:

```text
v1

v2

v3
```

Setiap versi memiliki spesifikasi OpenAPI tersendiri.

---

# 19. SDK Generation

OpenAPI digunakan untuk menghasilkan SDK secara otomatis.

Target:

- TypeScript
- Flutter (Dart)
- Go
- Kotlin
- Swift
- Python

Keuntungan:

- Konsistensi kontrak
- Mengurangi boilerplate
- Meminimalkan kesalahan integrasi

---

# 20. CI/CD Integration

Pipeline:

```text
Pull Request

↓

OpenAPI Validation

↓

Lint

↓

Contract Validation

↓

Build

↓

Deploy
```

Jika dokumentasi tidak valid, pipeline harus gagal.

---

# 21. Documentation Quality Rules

Setiap endpoint wajib memiliki:

- Summary
- Description
- Tags
- Operation ID
- Request Schema
- Response Schema
- Error Response
- Security Requirement
- Example Request
- Example Response

Dokumentasi tanpa contoh tidak boleh dipublikasikan.

---

# 22. Performance Consideration

Optimasi:

- Static OpenAPI Artifact
- CDN untuk Swagger UI
- Cached Documentation
- Minified JSON/YAML
- Incremental Documentation Build

---

# 23. Security Consideration

Dokumentasi publik tidak boleh menampilkan:

- Secret
- API Key internal
- Environment Variable
- Internal Endpoint
- Admin-only Endpoint yang tidak dipublikasikan
- Database Structure

Contoh data pada dokumentasi harus menggunakan data dummy.

---

# 24. Governance

Perubahan API harus mengikuti proses berikut:

```text
Design Proposal

↓

Review

↓

OpenAPI Update

↓

Implementation

↓

Testing

↓

Release
```

OpenAPI menjadi kontrak resmi antara backend dan client.

---

# 25. Future Evolution

Roadmap:

- Contract-First Development
- API Mock Server
- Consumer Contract Testing
- AsyncAPI Documentation
- GraphQL Schema Documentation (Future)
- Webhook Documentation
- AI-assisted Documentation Review
- Automated Changelog Generation

---

# Summary

OpenAPI Documentation menjadi fondasi dokumentasi API YakinLulus.id.

Karakteristik utama:

- Menggunakan OpenAPI 3.1 sebagai standar resmi.
- Menjadi single source of truth untuk seluruh REST API.
- Mendukung Swagger UI, ReDoc, SDK Generation, dan Contract Validation.
- Terintegrasi dengan pipeline CI/CD untuk menjaga konsistensi implementasi.
- Siap mendukung pengembangan enterprise, integrasi lintas platform, dan evolusi API jangka panjang.
