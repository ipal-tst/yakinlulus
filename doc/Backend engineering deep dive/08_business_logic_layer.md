# 08_business_logic_layer.md

# YakinLulus.id Business Logic Layer

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar implementasi **Business Logic Layer** pada backend YakinLulus.id.

Business Logic Layer merupakan inti sistem yang mengimplementasikan seluruh aturan bisnis (Business Rules) sesuai PRD, Domain Model, Entity Catalog, ERD, dan Module Architecture.

Seluruh keputusan bisnis wajib berada pada layer ini.

---

# 2. Position in Architecture

```text
HTTP Request
      │
Controller
      │
Request DTO
      │
Validation
      │
Business Logic Layer
      │
Repository
      │
Supabase PostgreSQL
```

Business Logic Layer diimplementasikan melalui **Application Service**, **Domain Service**, dan **Use Case**.

---

# 3. Responsibilities

Business Logic Layer bertanggung jawab terhadap:

* Business Rule
* Workflow Orchestration
* Validation Bisnis
* Transaction Management
* Cross Module Coordination
* Domain Event
* Audit Trigger
* Permission Validation
* Cache Coordination
* Queue Coordination

Tidak bertanggung jawab terhadap:

* HTTP
* SQL
* JSON
* JWT Parsing
* Database Connection
* External SDK Implementation

---

# 4. Business Logic Principles

Seluruh business rule mengikuti prinsip berikut.

* Single Source of Truth
* Explicit Rule
* Deterministic
* Idempotent
* Testable
* Stateless
* Reusable
* Observable
* Independent

---

# 5. Business Rule Categories

Business rule dibagi menjadi beberapa kategori.

```text
Identity

Academic

Learning

Question

Exam

CBT

Submission

Analytics

Ranking

Gamification

AI

System
```

---

# 6. Identity Business Rules

Contoh aturan:

* Username unik.
* Email unik.
* Password harus memenuhi password policy.
* Akun harus Active.
* Session harus valid.
* Refresh token hanya dapat digunakan satu kali.
* User yang dihapus tidak dapat login.

---

# 7. Academic Business Rules

* Academic Year hanya satu yang aktif.
* Semester aktif hanya satu.
* Grade wajib berada pada jenjang yang sesuai.
* Subject wajib memiliki Grade.
* Chapter wajib memiliki Subject.
* Curriculum hanya dapat dipublikasikan bila lengkap.

---

# 8. Material Business Rules

* Material harus memiliki Subject.
* Material harus memiliki Chapter.
* Draft tidak dapat diakses murid.
* Published material hanya dapat diubah oleh role yang berwenang.
* Archive tidak dapat muncul di pencarian murid.
* Progress belajar hanya bertambah, tidak berkurang kecuali reset oleh sistem.

---

# 9. Question Business Rules

Question merupakan domain utama sistem.

Question wajib memiliki:

* Subject
* Grade
* Chapter
* Difficulty
* Question Type
* Minimum dua opsi jawaban
* Satu jawaban benar
* Penjelasan
* Status

Status:

```text
Draft

Review

Approved

Published

Archived
```

Soal yang masih Draft tidak dapat digunakan dalam ujian.

---

# 10. AI Question Generation Rules

Workflow:

```text
Dataset

↓

Prompt Builder

↓

AI

↓

Validation

↓

Human Review

↓

Publish
```

Aturan:

* AI tidak dapat langsung publish.
* Seluruh soal AI wajib melalui review.
* Metadata AI disimpan untuk audit.
* Prompt template harus terversi.
* Nilai confidence AI disimpan bila tersedia.

---

# 11. Question Bank Rules

Question Bank hanya berisi soal Published.

Question tidak boleh muncul dua kali pada bank yang sama kecuali memang diizinkan oleh aturan bisnis tertentu.

Bank soal dapat:

* Manual
* AI Generated
* Dynamic

---

# 12. Exam Business Rules

Exam wajib memiliki:

* Nama
* Jenis
* Durasi
* Rule
* Status
* Minimal satu soal

Status:

```text
Draft

Scheduled

Published

Running

Finished

Archived
```

Exam Published tidak boleh dihapus.

---

# 13. Question Selection Rules

Ketika exam dibuat:

Question harus memenuhi:

* Grade
* Subject
* Chapter
* Difficulty
* Published
* Active

Jika jumlah soal tidak mencukupi maka proses publish ditolak.

---

# 14. Randomization Rules

Randomisasi dilakukan ketika sesi dimulai.

Randomisasi meliputi:

* Urutan soal.
* Urutan opsi jawaban (opsional per konfigurasi).

Question Group (cerita soal) tetap dipertahankan agar soal yang berbagi stimulus tidak terpisah.

Random seed dicatat agar sesi dapat direproduksi bila diperlukan untuk audit.

---

# 15. CBT Business Rules

CBT Engine memiliki aturan:

* Timer tidak boleh berhenti.
* Auto Save berkala.
* Resume diperbolehkan sesuai konfigurasi ujian.
* Submit satu kali.
* Auto Submit ketika waktu habis.
* Flag Question hanya memengaruhi tampilan pengguna.

---

# 16. Answer Rules

Jawaban:

* Dapat diubah sebelum submit.
* Tersimpan otomatis.
* Setelah Final Submit tidak dapat diubah.
* Hanya jawaban terakhir sebelum submit yang dinilai.

---

# 17. Submission Rules

Flow:

```text
Start Exam

↓

Answer Question

↓

Auto Save

↓

Final Submit

↓

Lock Submission
```

Submission yang telah dikunci tidak dapat dibuka kembali kecuali melalui prosedur administrasi yang terdokumentasi.

---

# 18. Scoring Rules

Scoring menggunakan Answer Key.

Future:

* Weighted Score
* Negative Score
* Partial Score
* Essay Score

Scoring dipisahkan dari CBT runtime.

---

# 19. Analytics Rules

Analytics menghasilkan:

* Accuracy
* Completion Rate
* Average Time
* Weak Topic
* Strong Topic
* Trend
* Progress

Analytics dibangun dari data submission yang telah selesai.

---

# 20. Ranking Rules

Ranking dihitung berdasarkan:

* Score
* Completion
* Tie Breaker
* Timestamp (bila diperlukan)

Jenis ranking:

* Nasional
* Sekolah
* Kelas
* Subject
* Try Out

Perhitungan ranking dijalankan sebagai background job untuk skala besar.

---

# 21. Gamification Rules

Gamification mencakup:

* XP
* Badge
* Achievement
* Streak
* Level

XP hanya diberikan dari aktivitas yang valid.

Tidak boleh terjadi pemberian XP ganda untuk event yang sama.

---

# 22. Notification Rules

Notification dikirim untuk:

* Exam Published
* Exam Reminder
* Exam Finished
* Material Published
* Badge Earned
* Password Reset

Pengiriman dilakukan melalui queue.

---

# 23. Media Rules

Upload:

* Validasi MIME Type.
* Validasi ukuran file.
* Scan file (future).
* Simpan metadata.
* Simpan checksum (opsional) untuk deteksi duplikasi.

File tidak dihapus secara permanen tanpa kebijakan retensi yang sesuai.

---

# 24. Audit Rules

Audit wajib dibuat untuk:

* Login
* Logout
* Create
* Update
* Delete
* Publish
* Submit
* Permission Change

Audit bersifat immutable.

---

# 25. Configuration Rules

Configuration hanya dapat diubah oleh role yang memiliki permission.

Perubahan configuration menghasilkan:

* Audit Log
* Version History (future)

---

# 26. Validation Rules

Validation dibagi menjadi dua.

Request Validation

* Required
* Format
* Enum
* UUID

Business Validation

* User aktif.
* Soal tersedia.
* Exam belum selesai.
* Session valid.
* Permission sesuai.
* Resource berada pada status yang benar.

---

# 27. Transaction Rules

Contoh Create Exam.

```text
Validate

↓

Create Exam

↓

Create Rule

↓

Attach Question

↓

Commit
```

Jika salah satu proses gagal maka seluruh perubahan dibatalkan.

---

# 28. Event Rules

Contoh:

```text
Exam Finished

↓

Score Calculated

↓

Analytics Updated

↓

Ranking Updated

↓

XP Granted

↓

Notification Sent
```

Event dipublikasikan setelah transaksi berhasil.

---

# 29. Queue Rules

Queue digunakan untuk:

* AI Generation
* Export PDF
* Export Excel
* Email
* Notification
* Ranking Rebuild
* Analytics Rebuild
* Bulk Import

Queue harus mendukung mekanisme retry dengan batas maksimum dan dead-letter queue untuk pekerjaan yang gagal berulang.

---

# 30. Cache Rules

Cache digunakan untuk:

* Subject
* Grade
* Chapter
* Configuration
* Public Material Metadata

Data yang sering berubah seperti jawaban CBT aktif tidak dijadikan cache utama.

Invalidasi cache dilakukan setelah perubahan data berhasil di-commit.

---

# 31. Error Rules

Business Error:

```text
QuestionNotPublished

ExamFinished

SubmissionLocked

PermissionDenied

SessionExpired

DuplicateEmail
```

Error bisnis tidak menggunakan HTTP Status secara langsung.

---

# 32. Cross Module Workflow

Contoh Finish CBT.

```text
CBT

↓

Submission

↓

Score

↓

Analytics

↓

Ranking

↓

Gamification

↓

Notification

↓

Audit
```

Workflow lintas modul dilakukan oleh Application Service atau Domain Event, bukan oleh repository.

---

# 33. Long Running Workflow

AI Generation.

```text
Upload Dataset

↓

Queue

↓

Worker

↓

AI

↓

Review

↓

Publish
```

Request HTTP hanya membuat job, bukan menunggu proses selesai.

---

# 34. Business Rule Testing

Seluruh business rule wajib memiliki pengujian.

Minimal:

* Unit Test
* Integration Test
* Workflow Test
* Authorization Test

Rule yang kompleks seperti randomisasi soal dan scoring juga memerlukan pengujian deterministik menggunakan seed yang tetap.

---

# 35. Business Rule Ownership

| Domain        | Owner Module       |
| ------------- | ------------------ |
| Login         | Identity           |
| User          | User               |
| Academic      | Academic           |
| Subject       | Subject            |
| Material      | Material           |
| Question      | Question           |
| Question Bank | Question Bank      |
| AI Generation | Question Generator |
| Exam          | Exam               |
| CBT           | CBT                |
| Submission    | Submission         |
| Score         | Submission         |
| Analytics     | Analytics          |
| Ranking       | Ranking            |
| Gamification  | Gamification       |
| Notification  | Notification       |
| Media         | Media              |
| Audit         | Audit              |
| Configuration | Configuration      |

Setiap aturan bisnis hanya memiliki satu pemilik (owner).

---

# 36. Anti-Patterns

Hal berikut tidak diperbolehkan:

* Business logic di Controller.
* Business logic di Repository.
* Business logic di Middleware.
* Business logic di Database Trigger.
* Business logic di Frontend.
* Query SQL yang menentukan keputusan bisnis.
* Mengakses repository modul lain secara langsung.

---

# 37. Definition of Done

Sebuah business rule dianggap selesai apabila:

* Telah diimplementasikan pada Service Layer.
* Memiliki Unit Test.
* Memiliki Integration Test (bila relevan).
* Menghasilkan audit bila diperlukan.
* Menghasilkan event bila diperlukan.
* Mendukung logging dan observability.
* Terdokumentasi pada OpenAPI (untuk endpoint terkait) dan dokumentasi internal.

---

# 38. Summary

Business Logic Layer merupakan inti dari backend YakinLulus.id. Seluruh aturan bisnis, orkestrasi lintas modul, validasi, transaksi, dan koordinasi event ditempatkan pada layer ini sehingga:

* Business rule memiliki satu sumber kebenaran.
* Implementasi tetap konsisten di seluruh modul.
* Pengujian menjadi lebih sederhana.
* Perubahan aturan bisnis dapat dilakukan tanpa memengaruhi controller maupun repository.
* Backend siap berkembang dari Modular Monolith menuju arsitektur yang lebih terdistribusi tanpa mengubah fondasi domain.
