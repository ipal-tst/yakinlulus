```markdown
# 09_event_contract.md

# Event Contract Specification

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan standar komunikasi berbasis event antar domain pada platform YakinLulus.

Event Contract digunakan agar setiap domain dapat berkomunikasi tanpa ketergantungan langsung terhadap database domain lain.

Tujuan:

- Menjaga loose coupling antar domain.
- Mendukung event-driven architecture.
- Mendukung asynchronous processing.
- Menjadi kontrak resmi antar domain.
- Mendukung analytics pipeline.
- Mendukung AI processing.
- Mempermudah migrasi ke microservice.

---

# 2. Prinsip Dasar

YakinLulus menggunakan pendekatan:

```

Domain Event Driven Architecture

```

Alur:

```

Domain Action

↓

Domain Event

↓

Event Bus

↓

Consumer Domain

↓

Processing

```

Contoh:

```

Student completes exam

↓

EXAM_COMPLETED event

↓

Analytics menerima event

↓

Generate performance metric

```

---

# 3. Event Ownership

Setiap event memiliki satu domain owner.

Aturan:

```

Producer owns event.

Consumer only listens.

```

Contoh:

CBT Domain:

```

EXAM_COMPLETED

```

Owner:

```

CBT Engine

```

Consumer:

```

Analytics

AI

Learning

```

---

# 4. Event Naming Convention

Format:

```

ENTITY_ACTION

```

atau:

```

DOMAIN_ENTITY_ACTION

```

---

Contoh:

```

USER_REGISTERED

QUESTION_CREATED

EXAM_STARTED

LESSON_COMPLETED

AI_CONTENT_GENERATED

```

---

# 5. Event Type Category

## User Events

Source:

```

User Management

```

Event:

```

USER_REGISTERED

USER_LOGIN

USER_PROFILE_UPDATED

USER_DEACTIVATED

```

---

## Academic Events

Source:

```

Master Academic

```

Event:

```

SUBJECT_CREATED

CURRICULUM_UPDATED

COMPETENCY_UPDATED

```

---

## Question Bank Events

Source:

```

Question Bank

```

Event:

```

QUESTION_CREATED

QUESTION_UPDATED

QUESTION_PUBLISHED

QUESTION_ARCHIVED

```

---

## Learning Resource Events

Source:

```

Learning Resource

```

Event:

```

RESOURCE_CREATED

RESOURCE_UPDATED

RESOURCE_PUBLISHED

RESOURCE_COMPLETED

```

---

## CBT Events

Source:

```

CBT Engine

```

Event:

```

EXAM_CREATED

EXAM_PUBLISHED

EXAM_STARTED

QUESTION_ANSWERED

EXAM_COMPLETED

EXAM_RESULT_GENERATED

```

---

## Learning Events

Source:

```

Learning Domain

```

Event:

```

LEARNING_STARTED

LESSON_COMPLETED

LEARNING_PROGRESS_UPDATED

```

---

## Organization Events

Source:

```

Organization

```

Event:

```

ORGANIZATION_CREATED

SCHOOL_REGISTERED

MEMBER_ADDED

CLASS_CREATED

```

---

## Media Events

Source:

```

Media

```

Event:

```

MEDIA_UPLOADED

MEDIA_PROCESSED

MEDIA_DELETED

```

---

## AI Events

Source:

```

AI Domain

```

Event:

```

AI_REQUEST_CREATED

AI_GENERATION_COMPLETED

AI_ANALYSIS_COMPLETED

AI_MODEL_UPDATED

````

---

# 6. Standard Event Envelope

Semua event harus memiliki struktur standar.

Format:

```json
{
  "event_id": "uuid",

  "event_type": "EXAM_COMPLETED",

  "event_version": 1,

  "source_domain": "CBT_ENGINE",

  "occurred_at": "2026-07-25T10:00:00Z",

  "aggregate_type": "ExamAttempt",

  "aggregate_id": "uuid",

  "actor_id": "uuid",

  "organization_id": "uuid",

  "payload": {}
}
````

---

# 7. Event Attribute Definition

## event_id

Unique identifier event.

Type:

```
UUID
```

Rule:

Immutable.

---

## event_type

Nama event.

Contoh:

```
EXAM_COMPLETED
```

---

## event_version

Versi payload.

Contoh:

```
1
```

Jika berubah:

```
EXAM_COMPLETED.v2
```

---

## source_domain

Domain penghasil event.

Contoh:

```
CBT_ENGINE
```

---

## occurred_at

Waktu kejadian bisnis.

Bukan waktu proses.

---

## aggregate_type

Entity utama.

Contoh:

```
ExamAttempt
```

---

## aggregate_id

ID entity.

Contoh:

```
exam_attempt_id
```

---

## actor_id

User yang menyebabkan event.

Contoh:

```
student_id
```

---

## organization_id

Tenant context.

Digunakan untuk:

* sekolah
* lembaga
* organisasi

---

# 8. Event Payload Rules

Payload harus:

* Minimal.
* Stabil.
* Tidak membawa data berlebihan.
* Tidak expose database internal.

---

Contoh salah:

```json
{
 "student_name":"Budi",
 "student_address":"..."
}
```

---

Contoh benar:

```json
{
 "student_id":"uuid",

 "score":85,

 "duration":3600
}
```

---

# 9. Event Example

## EXAM_COMPLETED

Producer:

```
CBT Engine
```

Consumer:

```
Analytics

AI

Learning
```

Payload:

```json
{
 "exam_id":"uuid",

 "attempt_id":"uuid",

 "student_id":"uuid",

 "score":85,

 "total_question":100,

 "correct_answer":85,

 "duration_seconds":4200
}
```

---

# 10. Question Answer Event

Event:

```
QUESTION_ANSWERED
```

Producer:

```
CBT Engine
```

Payload:

```json
{
 "attempt_id":"uuid",

 "question_id":"uuid",

 "answer":"B",

 "correct":true,

 "duration_seconds":35
}
```

Consumer:

```
Analytics

AI Recommendation
```

---

# 11. Learning Completion Event

Event:

```
LESSON_COMPLETED
```

Producer:

```
Learning Domain
```

Payload:

```json
{
 "student_id":"uuid",

 "lesson_id":"uuid",

 "completion_percentage":100,

 "duration_seconds":900
}
```

Consumer:

```
Analytics

AI
```

---

# 12. AI Generation Event

Event:

```
AI_GENERATION_COMPLETED
```

Producer:

```
AI Domain
```

Payload:

```json
{
 "job_id":"uuid",

 "model":"LLM_MODEL",

 "output_type":"QUESTION",

 "quality_score":0.92
}
```

Consumer:

```
Analytics

Question Bank
```

---

# 13. Event Storage

Event dapat disimpan pada:

```
Event Store
```

atau:

```
Analytics Event Table
```

---

Minimal schema:

```
event

id

event_type

source_domain

aggregate_id

payload JSONB

occurred_at

created_at
```

---

# 14. Event Delivery Guarantee

YakinLulus menggunakan:

## At Least Once Delivery

Artinya:

Event mungkin diterima lebih dari satu kali.

Consumer harus idempotent.

---

Contoh:

Jika:

```
EXAM_COMPLETED
```

diterima dua kali.

Analytics tidak boleh membuat dua record.

---

# 15. Idempotency Strategy

Setiap consumer menyimpan:

```
processed_event_id
```

Contoh:

```
event_id

consumer

processed_at
```

---

Jika event sudah diproses:

```
IGNORE
```

---

# 16. Event Ordering

Beberapa event membutuhkan urutan.

Contoh:

```
EXAM_STARTED

↓

QUESTION_ANSWERED

↓

EXAM_COMPLETED
```

Gunakan:

```
aggregate_id

occurred_at
```

sebagai ordering key.

---

# 17. Event Versioning

Event tidak boleh diubah.

Jika berubah:

buat versi baru.

Contoh:

```
EXAM_COMPLETED_V1


EXAM_COMPLETED_V2
```

---

Jangan:

```
Modify old event
```

---

# 18. Domain Event Matrix

| Event                   | Producer      | Consumer                |
| ----------------------- | ------------- | ----------------------- |
| USER_REGISTERED         | User          | Analytics, Notification |
| QUESTION_CREATED        | Question Bank | AI, Analytics           |
| QUESTION_ANSWERED       | CBT           | Analytics, AI           |
| EXAM_COMPLETED          | CBT           | Analytics, Learning     |
| LESSON_COMPLETED        | Learning      | Analytics, AI           |
| MEDIA_UPLOADED          | Media         | Learning                |
| AI_GENERATION_COMPLETED | AI            | Question Bank           |
| ORGANIZATION_CREATED    | Organization  | User                    |

---

# 19. Event Security

Event tidak boleh membawa:

* Password.
* Token.
* Credential.
* Data sensitif.

---

Jika diperlukan:

gunakan:

```
Reference ID
```

bukan data asli.

---

# 20. Event Retention Policy

Kategori:

## Operational Event

Retention:

```
1-2 tahun
```

---

## Analytics Event

Retention:

```
5+ tahun
```

---

## Audit Event

Retention:

```
Permanent
```

---

# 21. Future Architecture

Event Contract ini memungkinkan:

```
Modular Monolith

↓

Event Bus

↓

Microservice

↓

Distributed System
```

---

Future component:

```
Kafka

RabbitMQ

NATS

Redis Stream
```

---

# 22. Final Rule

Aturan utama:

```
Domain owns business action.

Domain publishes event.

Other domain consumes event.

No direct database dependency.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Architecture Governance Document
```

Digunakan oleh:

* Database Design
* API Design
* Backend Development
* Analytics Pipeline
* AI Pipeline
* Integration Design

```
```

Catatan arsitektur: setelah dokumen ini selesai, urutan berikutnya yang paling tepat adalah membuat:

```
10_domain_boundary.md
```

karena sebelum masuk physical database kita harus mengunci **batas kepemilikan data setiap domain** agar schema PostgreSQL nanti tidak terjadi overlap antar domain.
```markdown
# 09_event_contract.md

# Event Contract Specification

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan standar komunikasi berbasis event antar domain pada platform YakinLulus.

Event Contract digunakan agar setiap domain dapat berkomunikasi tanpa ketergantungan langsung terhadap database domain lain.

Tujuan:

- Menjaga loose coupling antar domain.
- Mendukung event-driven architecture.
- Mendukung asynchronous processing.
- Menjadi kontrak resmi antar domain.
- Mendukung analytics pipeline.
- Mendukung AI processing.
- Mempermudah migrasi ke microservice.

---

# 2. Prinsip Dasar

YakinLulus menggunakan pendekatan:

```

Domain Event Driven Architecture

```

Alur:

```

Domain Action

↓

Domain Event

↓

Event Bus

↓

Consumer Domain

↓

Processing

```

Contoh:

```

Student completes exam

↓

EXAM_COMPLETED event

↓

Analytics menerima event

↓

Generate performance metric

```

---

# 3. Event Ownership

Setiap event memiliki satu domain owner.

Aturan:

```

Producer owns event.

Consumer only listens.

```

Contoh:

CBT Domain:

```

EXAM_COMPLETED

```

Owner:

```

CBT Engine

```

Consumer:

```

Analytics

AI

Learning

```

---

# 4. Event Naming Convention

Format:

```

ENTITY_ACTION

```

atau:

```

DOMAIN_ENTITY_ACTION

```

---

Contoh:

```

USER_REGISTERED

QUESTION_CREATED

EXAM_STARTED

LESSON_COMPLETED

AI_CONTENT_GENERATED

```

---

# 5. Event Type Category

## User Events

Source:

```

User Management

```

Event:

```

USER_REGISTERED

USER_LOGIN

USER_PROFILE_UPDATED

USER_DEACTIVATED

```

---

## Academic Events

Source:

```

Master Academic

```

Event:

```

SUBJECT_CREATED

CURRICULUM_UPDATED

COMPETENCY_UPDATED

```

---

## Question Bank Events

Source:

```

Question Bank

```

Event:

```

QUESTION_CREATED

QUESTION_UPDATED

QUESTION_PUBLISHED

QUESTION_ARCHIVED

```

---

## Learning Resource Events

Source:

```

Learning Resource

```

Event:

```

RESOURCE_CREATED

RESOURCE_UPDATED

RESOURCE_PUBLISHED

RESOURCE_COMPLETED

```

---

## CBT Events

Source:

```

CBT Engine

```

Event:

```

EXAM_CREATED

EXAM_PUBLISHED

EXAM_STARTED

QUESTION_ANSWERED

EXAM_COMPLETED

EXAM_RESULT_GENERATED

```

---

## Learning Events

Source:

```

Learning Domain

```

Event:

```

LEARNING_STARTED

LESSON_COMPLETED

LEARNING_PROGRESS_UPDATED

```

---

## Organization Events

Source:

```

Organization

```

Event:

```

ORGANIZATION_CREATED

SCHOOL_REGISTERED

MEMBER_ADDED

CLASS_CREATED

```

---

## Media Events

Source:

```

Media

```

Event:

```

MEDIA_UPLOADED

MEDIA_PROCESSED

MEDIA_DELETED

```

---

## AI Events

Source:

```

AI Domain

```

Event:

```

AI_REQUEST_CREATED

AI_GENERATION_COMPLETED

AI_ANALYSIS_COMPLETED

AI_MODEL_UPDATED

````

---

# 6. Standard Event Envelope

Semua event harus memiliki struktur standar.

Format:

```json
{
  "event_id": "uuid",

  "event_type": "EXAM_COMPLETED",

  "event_version": 1,

  "source_domain": "CBT_ENGINE",

  "occurred_at": "2026-07-25T10:00:00Z",

  "aggregate_type": "ExamAttempt",

  "aggregate_id": "uuid",

  "actor_id": "uuid",

  "organization_id": "uuid",

  "payload": {}
}
````

---

# 7. Event Attribute Definition

## event_id

Unique identifier event.

Type:

```
UUID
```

Rule:

Immutable.

---

## event_type

Nama event.

Contoh:

```
EXAM_COMPLETED
```

---

## event_version

Versi payload.

Contoh:

```
1
```

Jika berubah:

```
EXAM_COMPLETED.v2
```

---

## source_domain

Domain penghasil event.

Contoh:

```
CBT_ENGINE
```

---

## occurred_at

Waktu kejadian bisnis.

Bukan waktu proses.

---

## aggregate_type

Entity utama.

Contoh:

```
ExamAttempt
```

---

## aggregate_id

ID entity.

Contoh:

```
exam_attempt_id
```

---

## actor_id

User yang menyebabkan event.

Contoh:

```
student_id
```

---

## organization_id

Tenant context.

Digunakan untuk:

* sekolah
* lembaga
* organisasi

---

# 8. Event Payload Rules

Payload harus:

* Minimal.
* Stabil.
* Tidak membawa data berlebihan.
* Tidak expose database internal.

---

Contoh salah:

```json
{
 "student_name":"Budi",
 "student_address":"..."
}
```

---

Contoh benar:

```json
{
 "student_id":"uuid",

 "score":85,

 "duration":3600
}
```

---

# 9. Event Example

## EXAM_COMPLETED

Producer:

```
CBT Engine
```

Consumer:

```
Analytics

AI

Learning
```

Payload:

```json
{
 "exam_id":"uuid",

 "attempt_id":"uuid",

 "student_id":"uuid",

 "score":85,

 "total_question":100,

 "correct_answer":85,

 "duration_seconds":4200
}
```

---

# 10. Question Answer Event

Event:

```
QUESTION_ANSWERED
```

Producer:

```
CBT Engine
```

Payload:

```json
{
 "attempt_id":"uuid",

 "question_id":"uuid",

 "answer":"B",

 "correct":true,

 "duration_seconds":35
}
```

Consumer:

```
Analytics

AI Recommendation
```

---

# 11. Learning Completion Event

Event:

```
LESSON_COMPLETED
```

Producer:

```
Learning Domain
```

Payload:

```json
{
 "student_id":"uuid",

 "lesson_id":"uuid",

 "completion_percentage":100,

 "duration_seconds":900
}
```

Consumer:

```
Analytics

AI
```

---

# 12. AI Generation Event

Event:

```
AI_GENERATION_COMPLETED
```

Producer:

```
AI Domain
```

Payload:

```json
{
 "job_id":"uuid",

 "model":"LLM_MODEL",

 "output_type":"QUESTION",

 "quality_score":0.92
}
```

Consumer:

```
Analytics

Question Bank
```

---

# 13. Event Storage

Event dapat disimpan pada:

```
Event Store
```

atau:

```
Analytics Event Table
```

---

Minimal schema:

```
event

id

event_type

source_domain

aggregate_id

payload JSONB

occurred_at

created_at
```

---

# 14. Event Delivery Guarantee

YakinLulus menggunakan:

## At Least Once Delivery

Artinya:

Event mungkin diterima lebih dari satu kali.

Consumer harus idempotent.

---

Contoh:

Jika:

```
EXAM_COMPLETED
```

diterima dua kali.

Analytics tidak boleh membuat dua record.

---

# 15. Idempotency Strategy

Setiap consumer menyimpan:

```
processed_event_id
```

Contoh:

```
event_id

consumer

processed_at
```

---

Jika event sudah diproses:

```
IGNORE
```

---

# 16. Event Ordering

Beberapa event membutuhkan urutan.

Contoh:

```
EXAM_STARTED

↓

QUESTION_ANSWERED

↓

EXAM_COMPLETED
```

Gunakan:

```
aggregate_id

occurred_at
```

sebagai ordering key.

---

# 17. Event Versioning

Event tidak boleh diubah.

Jika berubah:

buat versi baru.

Contoh:

```
EXAM_COMPLETED_V1


EXAM_COMPLETED_V2
```

---

Jangan:

```
Modify old event
```

---

# 18. Domain Event Matrix

| Event                   | Producer      | Consumer                |
| ----------------------- | ------------- | ----------------------- |
| USER_REGISTERED         | User          | Analytics, Notification |
| QUESTION_CREATED        | Question Bank | AI, Analytics           |
| QUESTION_ANSWERED       | CBT           | Analytics, AI           |
| EXAM_COMPLETED          | CBT           | Analytics, Learning     |
| LESSON_COMPLETED        | Learning      | Analytics, AI           |
| MEDIA_UPLOADED          | Media         | Learning                |
| AI_GENERATION_COMPLETED | AI            | Question Bank           |
| ORGANIZATION_CREATED    | Organization  | User                    |

---

# 19. Event Security

Event tidak boleh membawa:

* Password.
* Token.
* Credential.
* Data sensitif.

---

Jika diperlukan:

gunakan:

```
Reference ID
```

bukan data asli.

---

# 20. Event Retention Policy

Kategori:

## Operational Event

Retention:

```
1-2 tahun
```

---

## Analytics Event

Retention:

```
5+ tahun
```

---

## Audit Event

Retention:

```
Permanent
```

---

# 21. Future Architecture

Event Contract ini memungkinkan:

```
Modular Monolith

↓

Event Bus

↓

Microservice

↓

Distributed System
```

---

Future component:

```
Kafka

RabbitMQ

NATS

Redis Stream
```

---

# 22. Final Rule

Aturan utama:

```
Domain owns business action.

Domain publishes event.

Other domain consumes event.

No direct database dependency.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Architecture Governance Document
```

Digunakan oleh:

* Database Design
* API Design
* Backend Development
* Analytics Pipeline
* AI Pipeline
* Integration Design

```
```


