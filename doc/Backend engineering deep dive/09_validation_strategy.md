# 09_validation_strategy.md

# YakinLulus.id Validation Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar **Validation Strategy** pada backend YakinLulus.id.

Validation memastikan bahwa setiap request, data, dan business process memenuhi aturan yang telah ditentukan sebelum diproses lebih lanjut.

Tujuan utama:

* Menjaga integritas data.
* Mencegah data tidak valid masuk ke sistem.
* Menyederhanakan business logic.
* Menghasilkan error yang konsisten.
* Mendukung keamanan aplikasi.

---

# 2. Validation Position

Validation dilakukan pada beberapa lapisan.

```text
HTTP Request
      │
Request Validation
      │
Controller
      │
Business Validation
      │
Service
      │
Repository Validation
      │
Database Constraint
```

Setiap layer memiliki tanggung jawab yang berbeda.

---

# 3. Validation Principles

Seluruh validasi mengikuti prinsip berikut:

* Validate Early
* Fail Fast
* Single Responsibility
* Consistent Error Format
* Stateless
* Reusable
* Explicit Rule
* Deterministic

---

# 4. Validation Layers

Validation dibagi menjadi empat kategori.

| Layer                  | Responsibility               |
| ---------------------- | ---------------------------- |
| Request Validation     | Validasi format request      |
| Business Validation    | Validasi aturan bisnis       |
| Persistence Validation | Validasi sebelum penyimpanan |
| Database Constraint    | Menjaga integritas data      |

---

# 5. Request Validation

Dilakukan sebelum request masuk ke Service.

Contoh:

* Required field
* UUID
* Integer
* Boolean
* Enum
* Email
* URL
* Date
* JSON format

Contoh DTO:

```go
type CreateQuestionRequest struct {
    SubjectID uuid.UUID `validate:"required"`
    ChapterID uuid.UUID `validate:"required"`
    Difficulty string   `validate:"oneof=easy medium hard"`
    Question string     `validate:"required,min=10,max=5000"`
}
```

---

# 6. Business Validation

Dilakukan pada Service Layer.

Contoh:

* Subject masih aktif.
* Chapter milik Subject yang dipilih.
* Soal sudah berstatus Published.
* User memiliki permission.
* Exam belum dimulai.
* Subscription masih aktif.
* Academic Year aktif.

Business validation tidak boleh ditempatkan pada Controller.

---

# 7. Persistence Validation

Dilakukan sebelum operasi database.

Contoh:

* Entity lengkap.
* Foreign key tersedia.
* Duplicate record.
* Version check (optimistic locking).

Repository hanya memvalidasi kebutuhan persistence, bukan aturan bisnis.

---

# 8. Database Constraint

Database menjadi lapisan terakhir.

Gunakan:

* Primary Key
* Foreign Key
* Unique Constraint
* Check Constraint
* NOT NULL
* Index Constraint

Contoh:

```sql
UNIQUE(email)

CHECK(score >= 0)

CHECK(duration > 0)
```

Database bukan pengganti business validation.

---

# 9. Validation Flow

```text
Request

↓

Request Validation

↓

Business Validation

↓

Repository

↓

Database Constraint

↓

Commit
```

---

# 10. DTO Validation

Semua Request DTO wajib memiliki validasi.

Contoh:

```go
type LoginRequest struct {
    Email string `validate:"required,email"`
    Password string `validate:"required,min=8,max=128"`
}
```

Response DTO tidak memerlukan validasi.

---

# 11. UUID Validation

Seluruh identifier menggunakan UUID.

Contoh:

```text
/users/{id}
```

Validasi:

* Format UUID valid.
* Tidak boleh kosong.

---

# 12. Enum Validation

Contoh:

Difficulty

```text
easy

medium

hard
```

Status

```text
draft

published

archived
```

Nilai di luar enum ditolak.

---

# 13. String Validation

Validasi umum:

* Required
* Min Length
* Max Length
* Trim Whitespace
* Printable Character
* UTF-8 Valid

---

# 14. Number Validation

Contoh:

```text
Score

Duration

Page

Limit
```

Validasi:

* Minimum
* Maximum
* Positive
* Integer

---

# 15. Date Validation

Contoh:

* Start Date
* End Date
* Publish Date

Aturan:

* Format RFC3339.
* End Date ≥ Start Date.
* Tidak menerima tanggal tidak valid.

---

# 16. File Validation

Upload file harus memeriksa:

* MIME Type
* Extension
* File Size
* Filename
* Empty File

Future:

* Antivirus Scan
* Malware Detection

---

# 17. Image Validation

Validasi:

* JPEG
* PNG
* WEBP

Maksimum ukuran dikonfigurasi.

Validasi dimensi dapat diterapkan untuk avatar atau banner.

---

# 18. AI Request Validation

AI Generation wajib memvalidasi:

* Dataset tersedia.
* Prompt valid.
* Subject tersedia.
* Grade tersedia.
* Chapter tersedia.
* Template aktif.

---

# 19. Question Validation

Question wajib memiliki:

* Subject
* Chapter
* Difficulty
* Question Text
* Minimal dua opsi
* Tepat satu jawaban benar
* Explanation
* Status

---

# 20. Exam Validation

Exam wajib memiliki:

* Nama
* Durasi
* Rule
* Minimal satu soal
* Status valid

Publish ditolak jika syarat belum terpenuhi.

---

# 21. CBT Validation

Sebelum memulai CBT:

* User aktif.
* Session aktif.
* Exam Published.
* Jadwal valid.
* Belum pernah submit (sesuai rule ujian).
* Device diizinkan (jika fitur aktif).

---

# 22. Submission Validation

Sebelum submit:

* Timer belum habis (kecuali auto submit).
* Session aktif.
* Submission belum terkunci.

Setelah Final Submit:

* Jawaban tidak dapat diubah.

---

# 23. Authentication Validation

Setiap request memvalidasi:

* JWT valid.
* Signature valid.
* Expired.
* Session aktif.
* User aktif.

---

# 24. Authorization Validation

Service memvalidasi:

* Role.
* Permission.
* Resource Ownership.
* Business Access.

---

# 25. Pagination Validation

Validasi:

```text
Page >= 1

Limit >= 1

Limit <= Config Max
```

---

# 26. Sorting Validation

Kolom sorting menggunakan whitelist.

Contoh:

```text
created_at

updated_at

name
```

Kolom lain ditolak.

---

# 27. Filter Validation

Contoh:

```text
Difficulty

Status

SubjectID

GradeID
```

Semua filter divalidasi sebelum query dibangun.

---

# 28. Cross Field Validation

Contoh:

```text
Start Date

↓

End Date
```

Rule:

End Date tidak boleh lebih kecil dari Start Date.

Contoh lain:

* Grade harus sesuai dengan Jenjang.
* Chapter harus milik Subject.

---

# 29. Cross Entity Validation

Contoh:

Question

↓

Subject

↓

Grade

↓

Curriculum

````

Seluruh relasi diverifikasi pada Service Layer.

---

# 30. Validation Error Format

Semua validation error menggunakan format standar.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "must be a valid email"
      }
    ]
  }
}
````

---

# 31. Error Classification

Validation Error

```text
Required

Invalid Format

Invalid Enum

Invalid UUID

Out of Range
```

Business Error

```text
ExamFinished

QuestionPublished

DuplicateEmail

PermissionDenied
```

Database Error

```text
UniqueViolation

ForeignKeyViolation

ConstraintViolation
```

---

# 32. Validation Package

Struktur:

```text
internal/shared/validator/

validator.go

custom.go

translation.go

error.go
```

Menggunakan:

```text
go-playground/validator
```

Custom validator ditempatkan pada `custom.go`.

---

# 33. Custom Validators

Contoh validator khusus:

* Grade sesuai jenjang.
* Nomor soal unik dalam bank soal.
* Exam duration valid.
* Subject aktif.
* File extension sesuai MIME.
* Tidak ada opsi jawaban duplikat.

---

# 34. Localization

Validation message mendukung:

* Bahasa Indonesia
* English

Bahasa dipilih berdasarkan konfigurasi atau header `Accept-Language`.

---

# 35. Logging

Validation gagal dicatat sebagai warning.

Informasi minimal:

* Request ID
* Endpoint
* Field
* Error Code
* User ID (jika tersedia)

Data sensitif seperti password tidak boleh dicatat.

---

# 36. Testing Strategy

Seluruh validator wajib diuji.

Minimal:

* Valid Input
* Invalid Input
* Boundary Value
* Empty Value
* Malformed Value
* Duplicate Value

Custom validator harus memiliki unit test tersendiri.

---

# 37. Validation Checklist

Sebelum implementasi selesai:

* Request DTO tervalidasi.
* Business Rule tervalidasi.
* Database Constraint tersedia.
* Error format konsisten.
* Logging tersedia.
* Unit test lulus.
* Tidak ada validasi bisnis di Controller atau Repository.

---

# 38. Summary

Validation Strategy YakinLulus.id menerapkan validasi berlapis mulai dari Request DTO hingga Database Constraint. Dengan pemisahan tanggung jawab yang jelas, sistem memperoleh:

* Integritas data yang tinggi.
* Business rule yang konsisten.
* Error handling yang seragam.
* Kemudahan pengujian.
* Keamanan yang lebih baik.
* Arsitektur yang tetap bersih sesuai prinsip Clean Architecture dan Modular Monolith.
