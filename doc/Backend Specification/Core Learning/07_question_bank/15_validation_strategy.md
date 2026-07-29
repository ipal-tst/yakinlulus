Saya justru menganggap **15_validation_strategy.md** sebagai salah satu dokumen paling kritikal dalam seluruh Question Bank. Seluruh jalur masuk data—manual input, import Excel, AI generation, API, maupun migrasi—harus melewati validation layer yang sama agar konsisten.

Saya juga menyarankan menggunakan **layered validation**, bukan satu validator besar.

---

````markdown
# 15_validation_strategy.md

# Question Validation Strategy

Version : 1.0

---

# 1. Overview

Validation Strategy mendefinisikan seluruh mekanisme validasi Question sebelum data disimpan maupun dipublikasikan.

Validation memastikan bahwa setiap Question memenuhi:

- aturan bisnis
- integritas data
- konsistensi metadata
- kualitas akademik
- standar sistem
- keamanan data

Validation digunakan oleh:

- Manual Input
- Import
- AI Question Generation
- API
- Migration Tool
- Batch Processing

Semua jalur menggunakan Validation Engine yang sama.

---

# 2. Validation Architecture

```

Question Request

↓

Schema Validation

↓

Business Validation

↓

Metadata Validation

↓

Academic Validation

↓

AI Validation

↓

Security Validation

↓

Database Validation

↓

Question Accepted

```

---

# 3. Validation Principles

Validation harus memenuhi prinsip berikut.

- Centralized
- Deterministic
- Stateless
- Reusable
- Configurable
- Explainable
- Extensible

---

# 4. Validation Levels

Validation terdiri dari beberapa level.

| Level | Description |
|---------|-------------|
| Schema | Struktur data |
| Syntax | Format |
| Business | Business Rule |
| Academic | Aturan akademik |
| AI | AI Recommendation |
| Database | Integritas DB |
| Security | Permission |

---

# 5. Schema Validation

Memastikan payload sesuai spesifikasi.

Contoh.

Required Field

Data Type

Nullable

Length

Pattern

Enum

JSON Schema

---

# 6. Syntax Validation

Memeriksa format.

Contoh.

- HTML
- LaTeX
- Markdown
- Unicode
- UTF-8
- Formula
- Image Path
- URL

---

# 7. Required Field Validation

Field wajib.

- Stem
- Option
- Answer
- Explanation
- Subject
- Grade
- Chapter
- Difficulty
- Bloom

Question tidak boleh disimpan jika field wajib tidak lengkap.

---

# 8. Business Rule Validation

Memastikan aturan bisnis.

Contoh.

- hanya satu jawaban benar
- minimal empat opsi (MVP)
- status valid
- chapter sesuai subject
- grade sesuai curriculum

---

# 9. Metadata Validation

Memastikan metadata konsisten.

Validasi.

- FK tersedia
- curriculum valid
- chapter valid
- learning objective valid
- taxonomy valid

---

# 10. Academic Validation

Pemeriksaan akademik.

Contoh.

- jawaban benar
- pembahasan sesuai
- indikator sesuai
- Bloom sesuai
- HOTS sesuai

Dilakukan oleh Reviewer.

---

# 11. AI Validation

AI memberikan rekomendasi.

Meliputi.

- typo
- grammar
- readability
- duplicate
- metadata prediction
- difficulty prediction
- bloom prediction

AI tidak menggantikan validasi manusia.

---

# 12. Duplicate Validation

Metode.

Exact Match

↓

Normalized Match

↓

FTS Similarity

↓

Embedding Similarity

↓

Semantic Similarity

Jika similarity melebihi threshold, Question diberi status Need Review.

---

# 13. Attachment Validation

Attachment diperiksa.

- MIME Type
- File Size
- Resolution
- Virus Scan (opsional)
- Broken Link
- Duplicate File

---

# 14. Formula Validation

Formula diperiksa.

- syntax
- render
- unsupported command
- invalid symbol

---

# 15. Option Validation

Validasi.

- jumlah option
- duplicate option
- option kosong
- answer tersedia
- answer unik

---

# 16. Explanation Validation

Pemeriksaan.

- tidak kosong
- sesuai jawaban
- panjang minimum
- bebas karakter rusak

---

# 17. Lifecycle Validation

Question harus sesuai lifecycle.

Contoh.

Draft

↓

boleh edit

Published

↓

tidak boleh edit

Archived

↓

read only

---

# 18. Security Validation

Pemeriksaan.

- Role
- Permission
- Ownership
- Tenant
- Soft Delete
- Audit Requirement

---

# 19. Database Validation

Memastikan.

- FK
- Unique
- Constraint
- Partial Index
- Transaction

---

# 20. Validation Result

Output.

```

Status

Errors

Warnings

Recommendations

```

Error menghentikan proses.

Warning dapat diteruskan sesuai konfigurasi.

---

# 21. Error Severity

| Level | Action |
|---------|--------|
| Info | Continue |
| Warning | Continue |
| Error | Reject |
| Critical | Rollback |

---

# 22. Validation Pipeline

```

Receive

↓

Schema

↓

Business

↓

Metadata

↓

Academic

↓

Security

↓

AI

↓

Database

↓

Commit

```

---

# 23. Validation Context

Validator menerima context.

- User
- Role
- Request Source
- Import Job
- AI Job
- Transaction ID

Validator dapat menerapkan aturan berbeda berdasarkan konteks.

---

# 24. Batch Validation

Import dilakukan per batch.

```

500 Question

↓

Validation

↓

Valid

↓

Commit

```

Row yang gagal disimpan dalam laporan.

---

# 25. Async Validation

Validasi yang mahal dijalankan asynchronous.

Contoh.

- AI Validation
- Duplicate Detection
- Embedding
- Search Index

---

# 26. Domain Events

```

QuestionValidated

ValidationPassed

ValidationFailed

DuplicateDetected

MetadataValidated

AcademicValidated

```

---

# 27. Audit Log

Disimpan.

- validator
- rule
- timestamp
- result
- duration
- request_id

---

# 28. Performance Target

| Validation | Target |
|------------|---------|
| Schema | < 20 ms |
| Business | < 50 ms |
| Metadata | < 100 ms |
| Database | < 50 ms |
| Full Validation | < 300 ms |

---

# 29. Monitoring

Dipantau.

- Validation Duration
- Error Rate
- Duplicate Rate
- Warning Rate
- Retry Count
- AI Validation Time

---

# 30. Future Enhancements

- Rule Engine
- Dynamic Validation Rule
- AI Auto Validation
- Curriculum Validator
- Formula Verifier
- Accessibility Validator
- Bias Detection
- Copyright Checker
- Plagiarism Checker
- Multi-language Validator
````

---

# Rekomendasi Arsitektur

Saya menyarankan menggunakan pola **Validation Pipeline** daripada validator monolitik.

```text
Question Request
       │
       ▼
Validation Orchestrator
       │
 ┌─────┼──────────────────────────┐
 ▼     ▼          ▼        ▼       ▼
Schema Business Metadata Security AI
       │
       └───────────────┬──────────┘
                       ▼
              Database Validator
                       │
                       ▼
                  Validation Result
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/validation/
│
├── schema/
│   ├── validator.go
│   └── json_schema.go
│
├── business/
│   ├── question_rule.go
│   ├── option_rule.go
│   └── lifecycle_rule.go
│
├── metadata/
│   ├── curriculum.go
│   ├── taxonomy.go
│   └── consistency.go
│
├── academic/
│   └── review_rule.go
│
├── security/
│   ├── permission.go
│   └── ownership.go
│
├── ai/
│   ├── duplicate.go
│   ├── predictor.go
│   └── readability.go
│
├── database/
│   ├── constraint.go
│   └── transaction.go
│
├── orchestrator.go
└── service.go
```

## Penyempurnaan Khusus untuk YakinLulus.id

Agar konsisten dengan keseluruhan arsitektur backend, saya merekomendasikan setiap validator mengimplementasikan kontrak yang sama, misalnya:

```go
type Validator interface {
    Name() string
    Validate(ctx context.Context, question *QuestionDraft) ValidationResult
}
```

Dengan pendekatan ini:

* validator dapat ditambahkan atau dinonaktifkan melalui konfigurasi;
* urutan validasi dapat diatur oleh `Validation Orchestrator`;
* setiap validator dapat diuji secara independen;
* pipeline mudah diperluas ketika nanti ditambahkan validasi IRT, CAT, plagiarism detection, atau AI fact-checking tanpa mengubah validator yang sudah ada.

Pendekatan ini menjaga Validation Engine tetap modular, mudah dipelihara, dan siap berkembang seiring bertambahnya fitur YakinLulus.id.
