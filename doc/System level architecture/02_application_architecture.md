Melanjutkan ke file berikutnya:

# `11_implementation_architecture/02_application_architecture.md`

```md
# Application Architecture
## YakinLulus.id Application Layer Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur aplikasi YakinLulus.id pada level software application.

Fokus:

- struktur aplikasi backend;
- pembagian layer;
- application workflow;
- dependency management;
- business orchestration;
- integration antar module.


Application Architecture menjadi penghubung antara:

```

System Architecture

```
    |

    |
```

Application Architecture

```
    |

    |
```

Code Implementation

```


---

# 2. Architectural Approach


YakinLulus.id menggunakan kombinasi:


```

Clean Architecture

*

Domain Driven Design

*

Modular Monolith

*

Dependency Injection

*

SOLID Principle

```


Tujuan:

- business logic tidak tergantung framework;
- mudah dilakukan testing;
- mudah melakukan refactor;
- mudah mengekstrak module menjadi service.


---

# 3. Application Architecture Overview


High level:


```

```
                Client


                  |

                  |

             HTTP API Layer


                  |

                  |

          Application Layer


                  |

                  |

           Domain Layer


                  |

                  |

        Infrastructure Layer


                  |

                  |

   Database / External Services
```

```


---

# 4. Application Layer Responsibilities


Application layer bertanggung jawab terhadap:


## 4.1 Business Workflow


Application layer mengatur urutan proses bisnis.


Contoh:

Student mengikuti ujian:


```

StartExamUseCase

1. Validate student

2. Validate exam availability

3. Create exam session

4. Generate question pool

5. Apply randomization

6. Return exam session

```


---

## 4.2 Transaction Management


Application layer menentukan boundary transaksi.


Contoh:


```

Submit Answer

BEGIN TRANSACTION

Save Answer

Update Session

Publish Event

COMMIT

```


---

## 4.3 Domain Coordination


Application layer mengorkestrasi beberapa domain.


Contoh:


```

Exam Completion

```
    |

    |
```

Exam Module

```
    |

    +------------+

                 |

          Scoring Module


                 |

                 |

          Analytics Module
```

```


---

# 5. Application Architecture Diagram


```

+------------------------------------------------+

```
              Presentation Layer
```

REST API
WebSocket
Internal API

+------------------------------------------------+

```
              Application Layer
```

Use Cases

Commands

Queries

DTO

Application Services

+------------------------------------------------+

```
              Domain Layer
```

Entities

Value Objects

Domain Services

Domain Events

+------------------------------------------------+

```
         Infrastructure Layer
```

Repository

Database

Cache

Queue

Storage

+------------------------------------------------+

```
              External System
```

AI Service

Email

Payment

Notification

+------------------------------------------------+

```


---

# 6. Clean Architecture Implementation


Struktur folder:


```

backend/

internal/

├── modules

│
├── identity

│    ├── domain

│    ├── application

│    ├── infrastructure

│    └── delivery

├── exam

│
├── question_bank

│
├── learning

├── shared

├── infrastructure

└── config

```


---

# 7. Layer Explanation


# 7.1 Presentation Layer


Tanggung jawab:


- menerima request;
- validasi input;
- authentication middleware;
- response formatting.


Contoh:


```

POST /api/v1/exams/{id}/start

```


Flow:


```

HTTP Request

```
  |
```

Controller

```
  |
```

Use Case

```


Tidak boleh:

```

Controller

```
|

|
```

Database Query

```


---

# 7.2 Application Layer


Berisi:


- use case;
- application service;
- command handler;
- query handler.


Contoh:


```

StartExamUseCase

SubmitAnswerUseCase

GenerateReportUseCase

CreateQuestionUseCase

```


---

# 7.3 Domain Layer


Merupakan core sistem.


Berisi:


## Entity


Contoh:


```

Exam

Question

Student

LearningProgress

```


---

## Value Object


Contoh:


```

DifficultyLevel

Score

ExamDuration

Email

```


---

## Domain Service


Contoh:


```

QuestionRandomizer

ScoreCalculator

RecommendationEngine

```


---

## Domain Event


Contoh:


```

ExamStarted

ExamFinished

MaterialCompleted

```


---

# 7.4 Infrastructure Layer


Implementasi teknis:


```

PostgreSQL Repository

Redis Cache

File Storage

Queue Client

External API Client

```


Domain tidak mengetahui implementasi ini.


---

# 8. Module Communication Architecture


Dalam modular monolith:


```

Module A

```
 |
```

Interface

```
 |
```

Module B

```


Contoh:


Exam module membutuhkan Question Bank:


```

Exam Module

```
|
```

QuestionRepository Interface

```
|
```

Question Bank Module

```


Tidak:

```

Exam Module

langsung query

question table

```


---

# 9. Command Query Separation (CQS)


Application layer menggunakan pemisahan:


## Command


Mengubah state.


Contoh:


```

CreateExamCommand

SubmitAnswerCommand

UpdateMaterialCommand

```


---

## Query


Membaca data.


Contoh:


```

GetExamDetailQuery

GetStudentProgressQuery

GetRankingQuery

```


Diagram:


```

Request

|

+-------------+

|             |

Command       Query

|             |

Write DB      Read DB

```


---

# 10. Application Workflow Example


## Create Exam


```

Admin

|

Create Exam Request

|

Exam Controller

|

CreateExamUseCase

|

Validate Permission

|

Create Exam Entity

|

Save Repository

|

Publish ExamCreatedEvent

|

Response

```


---

# 11. Dependency Management


Dependency direction:


```

Presentation

```
  ↓
```

Application

```
  ↓
```

Domain

```
  ↑
```

Infrastructure

```


Rule:


```

Domain tidak bergantung ke luar.

```


---

# 12. Dependency Injection


Menggunakan Dependency Injection.


Contoh:


Interface:


```

type QuestionRepository interface {

FindRandomQuestions()

}

```


Implementation:


```

PostgresQuestionRepository

```


Use case:


```

StartExamUseCase

depends on:

QuestionRepository

```


Keuntungan:


- mudah testing;
- mudah mengganti database;
- loose coupling.


---

# 13. Shared Application Components


Komponen umum:


```

shared/

├── errors

├── validation

├── logger

├── event

├── pagination

├── security

└── response

```


---

# 14. Error Handling Architecture


Standard error:


```

Application Error

{

code:

message:

details:

trace_id:

}

```


Contoh:


```

EXAM_NOT_AVAILABLE

QUESTION_NOT_FOUND

UNAUTHORIZED_ACCESS

```


---

# 15. Configuration Architecture


Application menggunakan:


```

Environment Configuration

```
    |

    |
```

Config Loader

```
    |

    |
```

Application

```


Contoh:


```

DATABASE_URL

REDIS_URL

JWT_SECRET

STORAGE_ENDPOINT

```


---

# 16. Background Application Processing


Tidak semua proses dilakukan synchronous.


Contoh:


Synchronous:


```

Submit Answer

```
   |

   |
```

Save Answer

```


Asynchronous:


```

Exam Finished

```
   |

   |
```

Queue

```
   |

   |
```

Generate Analytics

```


---

# 17. Application Security Boundary


Security dilakukan pada beberapa layer:


```

API Layer

|
Authentication

|
Authorization

|
Application Permission

|
Domain Validation

```


Contoh:


Student:


```

boleh:

start exam sendiri

tidak boleh:

mengakses exam student lain

```


---

# 18. Testing Consideration


Dengan architecture ini:


## Unit Test


Target:


```

Domain Logic

Use Case

```


---

## Integration Test


Target:


```

Repository

Database

API

```


---

## End-to-End Test


Target:


```

User Journey

Login

Start Exam

Submit Answer

See Result

```


---

# 19. Future Scalability


Architecture siap berkembang:


## Module Extraction


Awal:


```

Exam Module

inside application

```


Kemudian:


```

Exam Service

API

Database

```


---

## Separate Read Model


Future:


```

Command Database

```
    |
```

Read Database

```


Cocok untuk:

- analytics;
- ranking;
- reporting.


---

# 20. Summary


Application Architecture YakinLulus.id:


```

Clean Architecture

*

DDD

*

Modular Boundary

*

Use Case Driven

*

Dependency Injection

*

Async Processing

```


Memberikan:


- kode mudah dipelihara;
- business logic terisolasi;
- mudah testing;
- siap scaling;
- siap menuju microservice.
```

---
