Melanjutkan ke file berikutnya:

# `11_implementation_architecture/08_domain_driven_design.md`

```md id="d8m4xk"
# Domain Driven Design Architecture
## YakinLulus.id Domain Driven Design Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan penerapan **Domain Driven Design (DDD)** pada platform YakinLulus.id.

DDD digunakan untuk memastikan:

- software architecture mengikuti business domain;
- business rule terisolasi;
- komunikasi antar tim menggunakan bahasa yang sama;
- sistem mudah berkembang;
- domain dapat diekstraksi menjadi service terpisah.


Prinsip utama:


```

Business Domain First

bukan

Technology First

```id="m2v8qp"


---

# 2. DDD Architecture Philosophy


YakinLulus.id memiliki domain utama:


```

Education Platform Domain

```
    |

    |
```

+-------+-------+-------+-------+

|       |       |       |       |

Question Exam Learning Analytics AI

```id="q7n3mx"


Setiap domain memiliki:

- bounded context;
- entity;
- value object;
- aggregate;
- domain service;
- domain event.


---

# 3. Domain Model Overview


```

```
                     YakinLulus Domain


                             |

    +------------------------+------------------------+

    |                        |                        |
```

Education Content        Assessment System        Learning System

```
    |                        |                        |
```

Question Bank              CBT Engine              Material

```
    |                        |                        |
```

AI Knowledge           Scoring System          Progress Tracking

```id="p4x8mz"


---

# 4. Bounded Context Architecture


DDD menggunakan konsep **Bounded Context**.


Setiap bounded context memiliki:


- model sendiri;
- business rule sendiri;
- boundary jelas.


Architecture:


```

+------------------------------------------------+

```
          Identity Context
```

+------------------------------------------------+

```
          Question Context
```

+------------------------------------------------+

```
          Assessment Context
```

+------------------------------------------------+

```
          Learning Context
```

+------------------------------------------------+

```
          Analytics Context
```

+------------------------------------------------+

```
          AI Context
```

+------------------------------------------------+

```id="k5m9rw"


---

# 5. Identity Bounded Context


## Responsibility


Mengelola:


- user identity;
- authentication;
- authorization;
- role.


---

## Core Entity


```

User

Role

Permission

Organization

Session

```id="x8q2mv"


---

## Aggregate


```

User Aggregate

Root:

User

Contains:

Profile

Credential

Role Assignment

```id="z3m7kp"


---

## Domain Rule


Contoh:


```

User harus memiliki identity unik.

User tidak boleh memiliki credential kosong.

Role harus valid.

```id="w6p4nx"


---

# 6. Question Bank Bounded Context


## Responsibility


Mengelola:


- bank soal;
- klasifikasi soal;
- pembahasan;
- sumber soal.


---

## Entity


```

Question

QuestionOption

Subject

Chapter

QuestionSource

Explanation

```id="m8q5vx"


---

# 7. Question Aggregate


```

Question Aggregate

```
    |

    |
```

Question

```
    |
```

+------+------+

|             |

Option     Explanation

```id="r4n8kp"


---

## Business Rule


Contoh:


```

Question harus memiliki minimal satu jawaban.

Question wajib memiliki difficulty level.

Question yang published tidak boleh diedit sembarangan.

```id="t7m3qx"


---

# 8. Assessment Bounded Context


Assessment menangani:


```

Exam Definition

Exam Session

Question Selection

Scoring

Result

```id="p9x4mk"


---

# 9. Exam Aggregate


```

Exam Aggregate

```
    |

    |

   Exam


    |
```

+------+------+

|             |

Rule       Participant

```id="y5q8mn"


---

## Business Rule


Contoh:


```

Exam hanya dapat dimulai pada jadwal aktif.

Student hanya dapat memiliki satu active session.

Exam yang sudah selesai tidak dapat diubah.

```id="v2m6rx"


---

# 10. CBT Runtime Bounded Context


CBT Runtime adalah sub-domain kritikal.


Responsibility:


- real-time exam execution;
- timer;
- answer state;
- synchronization.


---

## Entity


```

ExamSession

QuestionInstance

AnswerRecord

TimerState

```id="n7p3mq"


---

# 11. CBT Runtime Aggregate


```

Exam Session Aggregate

```
         |

         |

   Exam Session


         |
```

+-----------+-----------+

|                       |

Question State      Answer State

```id="h4x9mz"


---

## Domain Rule


```

Session hanya dapat dimiliki satu student.

Timer tidak boleh melebihi server authority.

Answer setelah submit final tidak dapat dimodifikasi.

```id="q6m8px"


---

# 12. Learning Bounded Context


Mengelola:


```

Course

Material

Lesson

Progress

Exercise

```id="b5n9qw"


---

# 13. Learning Aggregate


```

Learning Progress

```
    |

    |

 Student


    |
```

+------+------+

|             |

Material    Completion

```id="m3q7vx"


---

## Rule


```

Progress hanya bertambah.

Material harus tersedia sebelum dipelajari.

Completion harus memiliki timestamp.

```id="z8m4kp"


---

# 14. Analytics Bounded Context


Analytics bersifat read-heavy.


Responsibility:


- data aggregation;
- reporting;
- insight.


---

Architecture:


```

Domain Events

```
    |

    |
```

Analytics Processor

```
    |

    |
```

Analytics Model

```id="s7q2mx"


---

# 15. AI Bounded Context


Future domain.


Mengelola:


```

Question Generation

AI Explanation

AI Tutor

Recommendation

RAG System

```id="v4m8qx"


---

# 16. Entity Design Principle


Entity memiliki:


```

Identity

Lifecycle

Business Behavior

```id="p6n3mr"


Contoh:


Salah:


```

Question

hanya data object

```id="x9m5kw"


Benar:


```

Question

Create()

Publish()

Archive()

Validate()

```id="q3v7mp"


---

# 17. Value Object Design


Value object:


- immutable;
- tidak memiliki identity.


Contoh:


```

Score

Duration

Email

DifficultyLevel

ExamStatus

```id="k8m2rx"


---

Contoh:


```

DifficultyLevel

EASY

MEDIUM

HARD

```id="w5q9mn"


---

# 18. Domain Service


Digunakan ketika logic tidak cocok berada pada entity.


Contoh:


## Question Randomization


```

RandomizationService

Input:

Question Pool

Output:

Selected Questions

```id="m9x4kp"


---

## Scoring Service


```

ScoringService

Input:

Answer Sheet

Output:

Score

```id="r7n3mq"


---

# 19. Domain Event Architecture


Domain event merepresentasikan sesuatu yang sudah terjadi.


Format:


```

Event Name

Aggregate ID

Timestamp

Payload

```id="c5m8qx"


---

Contoh:


```

ExamCompletedEvent

{

exam_id,

student_id,

score

}

```id="h2q7mv"


---

# 20. Event Flow Example


```

Student Finish Exam

```
    |

    |
```

ExamCompletedEvent

```
    |
```

+------+------+

|             |

Analytics   Notification

```id="z6p4nx"


---

# 21. Anti Corruption Layer


Ketika domain berkomunikasi dengan external system:


gunakan ACL.


Contoh:


```

AI Domain

```
    |
```

Adapter

```
    |
```

OpenAI API

```id="y4m8qp"


Tujuan:


- external model tidak mencemari domain;
- mudah mengganti provider.


---

# 22. Repository Pattern


Domain hanya mengenal interface.


Contoh:


```

QuestionRepository

interface:

Save()

FindById()

Search()

```id="b7q3mx"


Implementasi:


```

PostgresQuestionRepository

```id="n5m9kv"


---

# 23. Domain Testing Strategy


Fokus:


```

Entity Behavior

Business Rule

Domain Service

```id="p8x4mq"


Contoh:


Test:


```

Student cannot start expired exam.

Question cannot publish without answer.

```id="s3m7qx"


---

# 24. Future Evolution


DDD memudahkan:


## Service Extraction


Contoh:


Awal:


```

Exam Context

inside monolith

```id="w9q5mx"


Future:


```

Exam Service

separate deployment

```id="x4m8kp"


---

## Team Organization


Tim dapat dibagi berdasarkan domain:


```

Team Identity

Team Assessment

Team Learning

Team AI

```id="z7n3mq"


---

# 25. Summary


DDD Architecture YakinLulus.id:


```

Bounded Context

*

Aggregate Design

*

Entity Behavior

*

Value Object

*

Domain Event

*

Repository Pattern

```id="m6q8rx"


Memberikan:


- business logic yang jelas;
- kode mudah dipahami;
- perubahan lebih aman;
- siap menuju distributed architecture.
```
