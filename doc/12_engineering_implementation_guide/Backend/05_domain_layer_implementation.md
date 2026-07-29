````markdown
# Domain Layer Implementation

**Document** : `backend/05_domain_layer_implementation.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi **Domain Layer** pada backend YakinLulus.id.

Domain Layer merupakan **inti (core)** dari seluruh aplikasi. Semua aturan bisnis (Business Rules) harus berada pada layer ini dan tidak boleh bergantung pada teknologi apa pun seperti:

- HTTP
- PostgreSQL
- Redis
- Supabase
- JSON
- WebSocket
- Queue
- Framework
- Library pihak ketiga (kecuali utilitas yang benar-benar independen)

Domain harus tetap dapat berjalan meskipun seluruh teknologi di sekelilingnya diganti.

---

# 2. Filosofi Domain Layer

Prinsip utama Domain Layer adalah:

> **Business first, technology second.**

Domain menjawab pertanyaan:

- Bagaimana aturan ujian bekerja?
- Bagaimana soal divalidasi?
- Bagaimana nilai dihitung?
- Bagaimana ranking ditentukan?
- Bagaimana siswa berpindah status?
- Bagaimana lifecycle CBT berlangsung?

Bukan:

- Bagaimana query dijalankan?
- Bagaimana HTTP request diterima?
- Bagaimana Redis bekerja?

---

# 3. Posisi Domain Layer

```text
             Interface Layer

                    │

             Application Layer

                    │

          ======================

              DOMAIN LAYER

          ======================

                    ▲

          Infrastructure Layer
```

Domain menjadi pusat seluruh dependency.

---

# 4. Domain Driven Design (DDD)

Setiap bounded context memiliki Domain sendiri.

Contoh:

```text
Auth

User

Question Bank

Learning Material

Exam

CBT Runtime

Scoring

Ranking

Analytics

Notification

AI

File
```

Setiap domain memiliki model bisnis yang independen.

---

# 5. Struktur Domain

```text
domain/

├── entity/
├── aggregate/
├── valueobject/
├── repository/
├── service/
├── event/
├── specification/
├── policy/
├── factory/
└── errors/
```

---

# 6. Entity

Entity adalah objek bisnis yang memiliki identitas unik.

Karakteristik:

- memiliki ID;
- memiliki lifecycle;
- dapat berubah;
- memiliki perilaku (behavior).

Contoh Entity:

```text
User

Student

Teacher

Question

Exam

ExamSession

Answer

Material
```

---

## Contoh Hubungan

```text
Exam

↓

ExamSession

↓

Answer
```

Masing-masing merupakan Entity yang berbeda.

---

# 7. Entity Responsibility

Entity bertanggung jawab terhadap:

- menjaga konsistensi dirinya;
- memvalidasi perubahan state;
- menyediakan business behavior.

Contoh:

```text
Question

↓

Publish()

Archive()

Restore()

UpdateDifficulty()
```

Bukan:

```text
Save()

Delete()

Insert()
```

Karena persistence bukan tanggung jawab Entity.

---

# 8. Value Object

Value Object tidak memiliki identitas.

Karakteristik:

- immutable;
- dibandingkan berdasarkan value;
- tidak memiliki lifecycle.

Contoh:

```text
Email

PhoneNumber

Score

Duration

Money (future)

Difficulty

ExamStatus

QuestionType

Grade
```

---

# 9. Aggregate

Aggregate merupakan kumpulan Entity yang dijaga konsistensinya oleh satu Aggregate Root.

Contoh:

```text
Exam Aggregate

Exam

├── Configuration

├── Question Pool

├── Rules

├── Timer

└── Session Policy
```

Aggregate Root:

```
Exam
```

Seluruh perubahan dilakukan melalui Aggregate Root.

---

# 10. Aggregate Rule

Tidak diperbolehkan:

```text
Question

↓

langsung mengubah

↓

Exam
```

Harus melalui Aggregate Root.

---

# 11. Repository Interface

Repository didefinisikan pada Domain.

Contoh:

```go
type QuestionRepository interface {
    Save(ctx context.Context, question *Question) error
    FindByID(ctx context.Context, id QuestionID) (*Question, error)
    Update(ctx context.Context, question *Question) error
    Delete(ctx context.Context, id QuestionID) error
}
```

Implementasi repository berada di Infrastructure Layer.

---

# 12. Domain Service

Gunakan Domain Service jika business rule:

- melibatkan lebih dari satu Aggregate;
- tidak layak ditempatkan pada Entity.

Contoh:

```text
Scoring Service

Ranking Service

Question Randomization

Recommendation

Exam Eligibility
```

---

# 13. Domain Event

Event merepresentasikan fakta yang telah terjadi.

Contoh:

```text
ExamCreated

ExamPublished

ExamStarted

AnswerSubmitted

ExamFinished

QuestionImported

StudentRegistered

MaterialCompleted
```

Karakteristik:

- immutable;
- tidak menjalankan business process;
- hanya membawa data yang diperlukan.

---

# 14. Factory

Factory digunakan untuk membuat Aggregate atau Entity kompleks.

Contoh:

```text
QuestionFactory

↓

Generate Question

↓

Validate

↓

Return Aggregate
```

Factory mencegah constructor menjadi terlalu kompleks.

---

# 15. Specification Pattern

Specification digunakan untuk business rule yang dapat digunakan kembali.

Contoh:

```text
StudentEligibleSpecification

ExamActiveSpecification

QuestionPublishableSpecification
```

Keuntungan:

- reusable;
- mudah diuji;
- tidak menduplikasi logika.

---

# 16. Policy

Policy menyimpan aturan bisnis yang bersifat strategis.

Contoh:

```text
MaximumExamDurationPolicy

MaximumRetryPolicy

PassingGradePolicy

QuestionSelectionPolicy
```

Policy dapat berubah mengikuti kebijakan bisnis tanpa memengaruhi struktur Entity.

---

# 17. Domain Errors

Domain memiliki error sendiri.

Contoh:

```text
ErrQuestionNotFound

ErrExamClosed

ErrExamExpired

ErrStudentInactive

ErrQuestionAlreadyPublished

ErrMaximumAttemptReached
```

Domain **tidak** mengenal:

```text
HTTP 404

HTTP 500

HTTP 400
```

Mapping ke HTTP dilakukan di Interface Layer.

---

# 18. Business Invariant

Invariant adalah aturan yang selalu benar.

Contoh:

```text
Exam Duration > 0

Question Count > 0

Student Active

Exam Published

Passing Grade <= 100

Maximum Score >= Minimum Score
```

Entity harus menjaga invariant tersebut.

---

# 19. Domain Behavior

Domain harus berisi behavior.

Contoh yang benar:

```text
Exam

↓

Start()

Finish()

Cancel()

Publish()

Archive()
```

Bukan hanya data.

---

# 20. Rich Domain Model

Gunakan Rich Domain Model.

Hindari:

```text
Entity

↓

Getter

Setter

Getter

Setter
```

Lebih baik:

```text
Exam

↓

Start()

SubmitAnswer()

Finish()

Publish()

Expire()
```

Behavior lebih penting daripada data.

---

# 21. Dependency Rule

Domain boleh bergantung pada:

- Standard Library Go;
- Domain lain (melalui kontrak yang jelas jika memang diperlukan);
- Value Object;
- Domain Service.

Domain tidak boleh bergantung pada:

- PostgreSQL;
- Redis;
- HTTP;
- JSON;
- Chi;
- Asynq;
- Zap;
- OpenTelemetry;
- Supabase SDK.

---

# 22. Cross Module Communication

Komunikasi antar module tidak dilakukan melalui Entity secara langsung.

Gunakan:

- Application Service;
- Domain Event;
- Interface yang telah didefinisikan.

Contoh:

```text
Exam Finished

↓

Domain Event

↓

Analytics Module

Ranking Module

Notification Module
```

---

# 23. Domain Validation

Seluruh validasi bisnis dilakukan di Domain.

Contoh:

```text
Exam belum dimulai

↓

Tidak boleh submit jawaban
```

```text
Question sudah dipublish

↓

Tidak boleh dihapus
```

```text
Student sudah lulus batas percobaan

↓

Tidak boleh mengikuti ujian
```

---

# 24. Persistence Ignorance

Domain tidak mengetahui bagaimana data disimpan.

Domain hanya mengetahui:

```text
Repository
```

Bukan:

```text
SQL

Transaction

Redis

Cache

Storage
```

---

# 25. Domain Testing

Domain dapat diuji tanpa:

- PostgreSQL;
- Redis;
- HTTP Server;
- Docker;
- Supabase.

Cukup:

```text
Entity

+

Mock Repository

+

Unit Test
```

Karena seluruh dependency berada di luar Domain.

---

# 26. Anti-Patterns

Jangan lakukan hal berikut.

### SQL di Domain

```text
SELECT *

❌
```

---

### JSON Marshal

```text
json.Marshal()

❌
```

---

### HTTP Request

```text
http.Client

❌
```

---

### Redis

```text
Redis.Get()

❌
```

---

### Logger

```text
zap.Logger

❌
```

---

### Environment Variable

```text
os.Getenv()

❌
```

Semua dependency tersebut berada di luar Domain.

---

# 27. Security Consideration

Domain membantu meningkatkan keamanan dengan:

- memusatkan aturan bisnis;
- menjaga invariant;
- mencegah state tidak valid;
- memastikan perubahan hanya melalui behavior yang sah.

---

# 28. Scalability Consideration

Karena Domain independen terhadap teknologi, sistem dapat berkembang tanpa mengubah business rule.

Contoh evolusi:

```text
PostgreSQL

↓

CockroachDB

↓

Business Rule tetap sama
```

atau

```text
REST API

↓

gRPC

↓

Business Rule tetap sama
```

---

# 29. Future Evolution

Domain Layer telah dipersiapkan untuk:

- CQRS pada use case tertentu;
- Event Sourcing (bila diperlukan);
- Multi Tenant;
- AI-assisted Domain Service;
- Microservice extraction;
- Rule Engine pada kebijakan tertentu.

Perubahan tersebut tidak memerlukan perubahan besar pada Entity maupun Aggregate.

---

# Summary

Domain Layer merupakan inti dari backend YakinLulus.id.

Prinsip implementasi:

- Entity menyimpan behavior.
- Aggregate menjaga konsistensi.
- Value Object bersifat immutable.
- Repository hanya berupa interface.
- Domain Service menangani logika lintas Aggregate.
- Domain Event merepresentasikan fakta bisnis.
- Business Rule tidak bergantung pada teknologi.

Dengan pendekatan ini, seluruh logika bisnis tetap stabil meskipun database, framework, atau infrastruktur berubah di masa depan.
