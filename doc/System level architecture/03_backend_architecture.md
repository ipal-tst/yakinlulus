Melanjutkan ke file berikutnya:

# `11_implementation_architecture/03_backend_architecture.md`

```md id="b8v5n3"
# Backend Architecture
## YakinLulus.id Backend Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur backend YakinLulus.id.

Backend merupakan core system yang menangani:

- business logic;
- data processing;
- authentication;
- CBT engine;
- question management;
- learning management;
- analytics;
- AI integration.


Target desain:

- production-grade;
- scalable;
- secure;
- maintainable;
- cloud ready.


---

# 2. Backend Architecture Principles


Backend YakinLulus.id menggunakan:


```

Go

*

Clean Architecture

*

Domain Driven Design

*

Modular Monolith

*

REST API

*

Event Driven Processing

```id="b3p2ra"


---

# 3. Backend Technology Stack


## Programming Language


```

Go

Version:

Go 1.22+

```id="4o4n6h"


Alasan:

- high performance;
- concurrency support;
- memory efficient;
- simple deployment;
- cocok untuk scalable API.


---

## API Framework


Pilihan:


```

Gin

atau

Fiber

```id="n2e6b9"


Pertimbangan:


Gin:

- mature;
- banyak digunakan;
- ecosystem besar.


Fiber:

- performance tinggi;
- API development cepat.


---

## Database


```

PostgreSQL 16+

```id="o0xkqs"


Digunakan untuk:


- transactional data;
- relational data;
- consistency;
- complex query.


---

## Cache


```

Redis

```id="q4x7b6"


Digunakan untuk:


- caching;
- session;
- CBT runtime state;
- distributed lock.


---

## Queue


MVP:


```

Redis Queue

```id="x7a4pj"


Future:


```

RabbitMQ

atau

NATS

```id="2oq5r8"


---

# 4. Backend High Level Architecture


```

```
                Client


                  |

                  |

             HTTP Request


                  |

                  |

          API / Handler Layer


                  |

                  |

         Application Service Layer


                  |

                  |

          Domain Business Layer


                  |

                  |

          Repository Interface


                  |

                  |

         Infrastructure Layer


                  |

    +-------------+-------------+

    |             |             |
```

PostgreSQL      Redis       Storage

```id="c3w6om"


---

# 5. Backend Project Structure


Struktur repository:


```

backend/

├── cmd

│
├── main.go

├── internal

│
├── modules

│    ├── identity

│    ├── question_bank

│    ├── exam

│    ├── cbt

│    ├── learning

│    ├── analytics

│    ├── notification

│    └── ai

│
├── shared

│    ├── errors

│    ├── logger

│    ├── validator

│    └── event

│
├── infrastructure

│    ├── database

│    ├── redis

│    ├── storage

│    └── queue

├── migrations

├── configs

└── tests

```id="c5f5rd"


---

# 6. Module Architecture


Setiap domain memiliki struktur:


```

module/

├── domain

├── application

├── infrastructure

├── delivery

└── tests

```id="n0z1x3"


Contoh:


```

exam/

├── domain

│    ├── exam.go

│    ├── session.go

│    └── event.go

├── application

│    ├── create_exam.go

│    ├── start_exam.go

│    └── submit_answer.go

├── infrastructure

│    └── postgres_repository.go

└── delivery

```
 └── http_handler.go
```

```id="t8f5xn"


---

# 7. Backend Layer Detail


# 7.1 Delivery Layer


Tanggung jawab:


- HTTP handling;
- request validation;
- authentication middleware;
- response.


Contoh:


```

POST /api/v1/exams/start

```id="z8m9qk"


Flow:


```

HTTP

|

Handler

|

Use Case

|

Response

```id="gy7u4t"


---

# 7.2 Application Layer


Berisi:


- use case;
- command;
- query;
- DTO.


Contoh:


```

StartExamUseCase

SubmitAnswerUseCase

GenerateScoreUseCase

```id="a7y4kx"


Tidak berisi:

- SQL query;
- HTTP logic.


---

# 7.3 Domain Layer


Core business.


Berisi:


## Entity


Contoh:


```

ExamSession

Question

Answer

Student

```id="w3s6q1"


---

## Value Object


Contoh:


```

Score

Duration

Difficulty

ExamStatus

```id="m6z9tb"


---

## Domain Service


Contoh:


```

RandomizationEngine

ScoringEngine

RecommendationEngine

```id="f0m4xq"


---

# 7.4 Infrastructure Layer


Implementasi:


```

Postgres Repository

Redis Client

File Storage Client

Queue Producer

External API Client

```id="k9g1mv"


---

# 8. Dependency Flow


Aturan dependency:


```

Delivery

↓

Application

↓

Domain

↑

Infrastructure

```id="g3x9pa"


Domain tidak mengetahui:


- PostgreSQL;
- Redis;
- HTTP;
- framework.


---

# 9. Database Access Architecture


Menggunakan Repository Pattern.


Contoh:


Interface:


```

type ExamRepository interface {

Save(exam Exam)

FindByID(id ID)

}

```id="7s6u8j"


Implementation:


```

PostgresExamRepository

```id="8k4b2a"


Keuntungan:


- testing mudah;
- database dapat diganti;
- coupling rendah.


---

# 10. Transaction Management


Transaction dikontrol pada application layer.


Contoh:


Submit Answer:


```

BEGIN

Save Answer

Update Exam Session

Update Progress

Publish Event

COMMIT

```id="s0v9w4"


---

# 11. Concurrency Architecture


Go digunakan untuk concurrent processing.


Contoh:


## Background Worker


```

Worker 1

Process AI Job

Worker 2

Generate Report

Worker 3

Analytics Calculation

```id="6m4v0p"


---

# 12. CBT Runtime Backend Architecture


CBT memiliki kebutuhan khusus:


- low latency;
- reliable state;
- timer management;
- synchronization.


Architecture:


```

Student

|

|

CBT API

|

|

Exam Session Manager

|

+-------------+

|             |

Redis       PostgreSQL

|             |

Runtime      Permanent Data

State

```id="q7v2mx"


---

# 13. API Request Lifecycle


```

Request

|

Middleware

|

Authentication

|

Authorization

|

Validation

|

Controller

|

Use Case

|

Domain Logic

|

Repository

|

Database

|

Response

```id="x6m8tp"


---

# 14. Middleware Architecture


Global middleware:


```

Logger

Recovery

CORS

Rate Limit

Authentication

Request ID

```id="n4k8zb"


---

# 15. Error Handling


Standard error object:


```

{
code,
message,
details,
trace_id
}

```id="z3q9hx"


Kategori:


```

VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

INTERNAL_ERROR

```id="x3n6bw"


---

# 16. Logging Architecture


Menggunakan structured logging.


Contoh:


```

{
level:"error",
module:"cbt",
action:"submit_answer",
user_id:"123",
trace_id:"abc"
}

```id="p2f7vw"


---

# 17. Configuration Management


Menggunakan:


```

Environment Variable

*

Configuration Loader

```id="v9m3kd"


Contoh:


```

DATABASE_URL

REDIS_HOST

JWT_SECRET

STORAGE_BUCKET

```id="r5q8ys"


---

# 18. Security Implementation


Backend security:


## Authentication


```

JWT

Refresh Token

Password Hashing

```id="h2q7mz"


---

## Authorization


```

RBAC

Permission Middleware

Resource Ownership Check

```id="b6t8xy"


---

## Data Security


```

TLS

Encryption

Audit Log

Input Validation

```id="x8c3ma"


---

# 19. Testing Architecture


Testing pyramid:


```

```
      E2E


    Integration


  Unit Test
```

```id="y5n7kf"


Coverage target:


```

Domain Logic:

80%+

Critical Flow:

90%+

```id="h6m4pc"


---

# 20. Deployment Architecture


MVP:


```

Docker Container

```
    |

    |
```

Go Backend

```
    |

    |
```

PostgreSQL

```
    |

    |
```

Redis

```id="q9r5vz"


---

# 21. Future Backend Evolution


## Service Extraction


Saat scale meningkat:


```

Monolith

```
|

|
```

Extract Module

```
|

|
```

Independent Service

```id="m8s2qa"


Contoh:


```

CBT Service

AI Service

Analytics Service

Notification Service

```id="d3v7kj"


---

# 22. Backend Scalability Strategy


Horizontal scaling:


```

Load Balancer

```
  |
```

+-----+-----+

API   API   API

```id="w4m6yb"


Stateless application:


- session externalized;
- cache centralized;
- database shared.


---

# 23. Summary


Backend Architecture YakinLulus.id:


```

Go Backend

*

Clean Architecture

*

DDD

*

Modular Monolith

*

Repository Pattern

*

Async Worker

*

Event Driven Ready

```id="g8t1ps"


Memberikan:

- development cepat;
- maintainability tinggi;
- performa baik;
- siap scale enterprise.
```
