````markdown
# Validation Strategy

**Document** : `backend/12_validation_strategy.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Validation Strategy** pada backend YakinLulus.id.

Validation bertujuan untuk memastikan bahwa seluruh data yang masuk ke sistem memenuhi:

- Format yang benar
- Konsistensi
- Business Rule
- Security Requirement
- Data Integrity

Validation harus dilakukan secara **berlapis (Layered Validation)** sehingga setiap layer hanya bertanggung jawab terhadap jenis validasi tertentu.

---

# 2. Filosofi Validation

Prinsip utama validation:

- Validate Early
- Fail Fast
- Explicit Validation
- Layered Validation
- Reusable Validation
- Business Rule di Domain
- Format Validation di Interface

Validation bukan hanya untuk mencegah error, tetapi juga menjaga kualitas data dan keamanan sistem.

---

# 3. Layered Validation Architecture

```text
                 Client
                    │
                    ▼
            Interface Layer
      (Request Validation)
                    │
                    ▼
          Application Layer
      (Workflow Validation)
                    │
                    ▼
             Domain Layer
      (Business Validation)
                    │
                    ▼
        Infrastructure Layer
     (Database Constraints)
```

Setiap layer memiliki tanggung jawab yang berbeda.

---

# 4. Validation Responsibility

| Layer | Responsibility |
|---------|----------------|
| Interface | Format dan struktur request |
| Application | Workflow dan authorization |
| Domain | Business rule dan invariant |
| Infrastructure | Constraint database |

---

# 5. Interface Validation

Interface Layer melakukan validasi terhadap:

- Required Field
- UUID
- Email
- URL
- Enum
- Number Range
- Boolean
- Date Format
- JSON Structure
- Multipart Upload

Contoh:

```json
{
    "title": "",
    "difficulty": "hard"
}
```

Jika `title` kosong:

```text
400 Bad Request
```

Request tidak diteruskan ke Application Layer.

---

# 6. Application Validation

Application Layer memvalidasi:

- Hak akses pengguna
- Resource tersedia
- Workflow masih valid
- Idempotency
- Dependency antar resource

Contoh:

```text
Teacher

↓

Create Exam

✓
```

```text
Student

↓

Create Exam

✗
```

---

# 7. Domain Validation

Domain bertanggung jawab terhadap seluruh aturan bisnis.

Contoh:

```text
Exam Duration > 0
```

```text
Passing Score <= Maximum Score
```

```text
Exam harus Published sebelum Start
```

```text
Student hanya boleh memiliki satu Exam Session aktif
```

Seluruh business invariant dijaga di Domain.

---

# 8. Infrastructure Validation

Database memberikan validasi tambahan melalui:

- Primary Key
- Foreign Key
- Unique Constraint
- Check Constraint
- Not Null
- Transaction Constraint

Database bukan pengganti Domain Validation.

---

# 9. Validation Flow

```text
HTTP Request

↓

Request Validation

↓

Authorization

↓

Workflow Validation

↓

Business Validation

↓

Repository

↓

Database Constraint
```

Validation dilakukan secara bertahap.

---

# 10. DTO Validation

DTO wajib divalidasi sebelum memasuki Application Layer.

Contoh:

```text
CreateQuestionRequest

↓

Title Required

↓

Difficulty Enum

↓

Subject UUID

↓

Success
```

DTO tidak boleh mengandung business rule.

---

# 11. Value Object Validation

Value Object melakukan validasi terhadap nilainya sendiri.

Contoh:

```text
Email

↓

Valid Format
```

```text
Phone Number

↓

Valid Country Format
```

```text
Score

↓

0 - 100
```

Value Object bersifat immutable.

---

# 12. Aggregate Validation

Aggregate memastikan seluruh Entity berada pada kondisi yang valid.

Contoh:

```text
Exam Aggregate

↓

Duration

↓

Question Count

↓

Passing Grade

↓

Exam Status
```

Jika salah satu tidak valid, perubahan dibatalkan.

---

# 13. Cross Entity Validation

Contoh:

```text
Teacher

↓

Mengajar Subject X

↓

Boleh membuat soal Subject X
```

Validation ini dilakukan melalui Domain Service atau Application Layer, tergantung kompleksitas aturan.

---

# 14. File Validation

Upload file harus divalidasi:

- MIME Type
- Extension
- Maximum Size
- Virus Scan (future)
- Image Dimension
- Audio Duration
- Video Duration

Contoh:

```text
JPEG

PNG

WEBP

PDF

MP4

MP3
```

File executable ditolak.

---

# 15. Excel Import Validation

Import Question melakukan validasi bertahap.

```text
Excel

↓

Header Validation

↓

Column Validation

↓

Cell Validation

↓

Business Validation

↓

Import
```

Jika terdapat error:

- tampilkan nomor baris
- nama kolom
- alasan kegagalan

Import bersifat parsial hanya jika aturan bisnis mengizinkan; untuk mode atomik seluruh batch dibatalkan.

---

# 16. AI Validation

AI Generated Question divalidasi sebelum masuk Question Bank.

Validasi meliputi:

- Struktur soal
- Opsi jawaban
- Jawaban benar
- Tingkat kesulitan
- Jenjang
- Mata pelajaran
- Bab
- Pembahasan

AI tidak dapat langsung menyimpan data ke database tanpa melalui pipeline validasi.

---

# 17. Batch Validation

Untuk operasi massal:

```text
10.000 Question

↓

Chunk

↓

Validate

↓

Import
```

Menghindari penggunaan memori yang berlebihan.

---

# 18. Validation Error Format

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "difficulty",
        "message": "Difficulty is invalid"
      }
    ]
  }
}
```

Response harus konsisten di seluruh API.

---

# 19. Reusable Validator

Validator umum ditempatkan pada package bersama.

```text
shared/

validation/

├── email.go
├── password.go
├── uuid.go
├── date.go
├── file.go
├── pagination.go
└── string.go
```

Hindari duplikasi validasi di berbagai module.

---

# 20. Localization

Validation message menggunakan:

```text
Error Code

↓

Localization

↓

Bahasa Indonesia

atau

English
```

Backend mengembalikan error code yang stabil, sedangkan pesan dapat diterjemahkan sesuai preferensi bahasa pengguna.

---

# 21. Security Validation

Validasi keamanan mencakup:

- SQL Injection
- XSS
- Path Traversal
- File Upload Restriction
- HTML Sanitization
- Input Length
- Rate Limit Validation

Semua input dianggap tidak tepercaya (untrusted).

---

# 22. Performance Consideration

Validation harus:

- Ringan
- Tidak melakukan query berulang
- Menggunakan cache bila diperlukan
- Mendukung batch processing
- Menghindari validasi yang sama berkali-kali dalam satu request

---

# 23. Logging Validation Failure

Validation failure penting dicatat.

Contoh:

- Import gagal
- Upload gagal
- Request tidak valid
- Dugaan penyalahgunaan API

Log minimal:

- Request ID
- User ID
- Endpoint
- Validation Code
- Timestamp

---

# 24. Testing Strategy

Minimal pengujian:

- Required Field
- Invalid UUID
- Invalid Email
- Enum Salah
- Number Out of Range
- Business Rule
- Authorization
- File Validation
- Excel Validation
- AI Validation

Target:

```text
Validation Coverage ≥ 95%
```

---

# 25. Anti-Patterns

### Business Rule di Handler

```text
Handler

↓

if exam finished

❌
```

---

### Validation di Repository

```text
Repository

↓

if score > 100

❌
```

---

### Mengandalkan Database Constraint

```text
Insert

↓

Database Error

↓

Validation

❌
```

Validasi seharusnya dilakukan sebelum operasi database.

---

### Mengabaikan Validation Error

```go
if err != nil {
    // ignore
}
```

❌

---

### Hardcoded Validation Message

```text
"Email salah"

❌
```

Gunakan error code dan mekanisme localization.

---

# 26. Scalability Consideration

Strategi ini mendukung:

- Multi Language
- Multi Tenant
- Batch Processing
- AI Pipeline
- Distributed Worker
- API Gateway Validation

Karena validasi dipisahkan berdasarkan tanggung jawab layer.

---

# 27. Future Evolution

Validation Layer siap dikembangkan untuk:

- Dynamic Validation Rule
- Rule Engine
- AI-assisted Validation
- Custom School Policy
- Form Builder
- Configurable Validation Schema

Tanpa mengubah Domain Layer.

---

# Summary

Validation Strategy pada YakinLulus.id menerapkan pendekatan **Layered Validation**.

Prinsip utama:

- Interface memvalidasi format.
- Application memvalidasi workflow.
- Domain menjaga business rule.
- Database menjaga integritas data.
- Validation reusable dan mudah diuji.
- Error response konsisten.
- Siap mendukung localization, AI, dan skala enterprise.

Dengan strategi ini, kualitas data tetap terjaga sejak data pertama kali diterima hingga berhasil disimpan ke database.
````
