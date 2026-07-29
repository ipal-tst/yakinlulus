# `11_implementation_architecture/00_architecture_overview.md`

```md
# Architecture Overview
## YakinLulus.id Implementation Architecture

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture  
Status: Draft / Engineering Reference


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan gambaran besar arsitektur implementasi platform **YakinLulus.id**.

Tujuan utama:

- menerjemahkan desain produk, domain model, dan database architecture menjadi blueprint implementasi;
- menjadi referensi utama tim backend, frontend, mobile, DevOps, dan QA;
- memastikan sistem dibangun dengan prinsip:
  - scalable;
  - maintainable;
  - secure;
  - modular;
  - cloud ready;
  - production-grade.

Arsitektur dirancang menggunakan pendekatan:

- Clean Architecture;
- Domain Driven Design (DDD);
- Modular Monolith;
- Event Driven Architecture;
- API First Development;
- Infrastructure as Code.


---

# 2. Architectural Vision

YakinLulus.id dibangun sebagai platform EdTech modern yang memiliki kemampuan:

- mengelola bank soal dalam skala besar;
- menjalankan CBT dengan reliability tinggi;
- menyediakan pengalaman belajar digital;
- melakukan analytics pembelajaran;
- mengintegrasikan AI pada fase berikutnya.


Arsitektur awal menggunakan:

```

Modular Monolith
|
|
+---- Domain Modules
|
+---- Shared Infrastructure
|
+---- Async Worker
|
+---- Event Bus

```


Namun desain dibuat agar setiap domain dapat diekstraksi menjadi service terpisah apabila scale meningkat.


---

# 3. Architectural Principles


## 3.1 Separation of Concerns

Setiap layer memiliki tanggung jawab jelas.


Contoh:

```

Presentation Layer
|
|
Application Layer
|
|
Domain Layer
|
|
Infrastructure Layer

```


Tidak diperbolehkan:

- controller mengakses database langsung;
- business logic berada di frontend;
- domain bergantung pada framework.


---

# 3.2 Domain First Design

Sistem dibangun berdasarkan business domain.

Bukan berdasarkan teknologi.


Contoh:

Kurang tepat:

```

controllers/
models/
services/
utils/

```


Lebih tepat:

```

modules/

question_bank/

exam/

cbt/

learning/

analytics/

user/

```


Setiap domain memiliki:

- entity;
- use case;
- repository;
- service;
- event.


---

# 3.3 Modular Monolith First


Phase awal:

```

```
             YakinLulus Backend


                   API

                    |
    +---------------+---------------+
    |               |               |
```

Question Bank       CBT Engine     Learning

```
    |               |               |

    +---------------+---------------+

            Shared Infrastructure

            PostgreSQL
            Redis
            Storage
            Queue
```

```


Keuntungan:

- development lebih cepat;
- deployment sederhana;
- debugging mudah;
- biaya rendah.


Tetap memiliki batas domain yang jelas.


---

# 3.4 Evolution Ready Architecture


Roadmap evolusi:


## Phase 1

```

Single Backend Application

Go Application

PostgreSQL

Redis

Worker

```


## Phase 2

```

Modular Monolith

```
    |
    |
    +---- CBT Service

    +---- Learning Service

    +---- Analytics Service
```

```


## Phase 3


```

```
             API Gateway


                 |

    +------------+------------+

    |            |            |

 CBT Service  AI Service  Analytics


    |
```

Event Streaming

```


---

# 4. High Level System Architecture


## Architecture Diagram


```

```
                      Users

          +-------------+-------------+
          |                           |
      Web Browser                 Mobile App
          |                           |
          |                           |
          +-------------+-------------+

                        |
                        |

                   API Gateway

                        |

             Backend Application

                        |

    +-------------------+-------------------+
    |                   |                   |
```

User Module        Learning Module     Exam Module

```
    |                   |                   |

    +-------------------+-------------------+

                        |

              Domain Service Layer


                        |

    +-------------------+-------------------+
    |                   |                   |

PostgreSQL           Redis             Object Storage


                        |

                Background Worker


                        |

                 Event Processing


                        |

                Analytics / AI Layer
```

```


---

# 5. Core Technology Stack


## Backend


Technology:

```

Language:
Go

Framework:
Fiber / Gin

API:
REST API

Database:
PostgreSQL

Cache:
Redis

Queue:
Redis Queue / RabbitMQ / NATS

Migration:
Go migration tools

Documentation:
OpenAPI / Swagger

```


---

# Frontend


Technology:


```

Framework:

React

Language:

TypeScript

Build:

Vite

State Management:

React Query
Zustand / Redux Toolkit

UI:

Component based design system

```


---

# Mobile


Technology:


```

Flutter

Dart

Architecture:

Clean Architecture

State:

Riverpod / Bloc

Offline:

Local Database

Sync Engine

```


---

# Infrastructure


Target:


```

Container:

Docker

Orchestration:

Docker Compose
(Kubernetes ready)

CI/CD:

GitHub Actions

Cloud:

AWS / GCP / Azure / VPS

```


---

# 6. Main System Components


## 6.1 Identity & Access Management


Responsible:


- authentication;
- authorization;
- RBAC;
- user management;
- session management.


Role:

```

Super Admin
Admin
Staff
Teacher
Student

```


---

# 6.2 Question Bank Domain


Responsible:


- question management;
- taxonomy;
- difficulty;
- explanation;
- multimedia.


Entity utama:


```

Question

Question Option

Subject

Chapter

Difficulty

Question Source

Explanation

```


---

# 6.3 CBT Engine Domain


Responsible:


- exam creation;
- exam session;
- timer;
- navigation;
- randomization;
- scoring.


Komponen:


```

Exam Definition

Question Pool

Exam Session

Answer Sheet

Scoring Pipeline

```


---

# 6.4 Learning Domain


Responsible:


- learning material;
- chapter;
- multimedia;
- progress tracking.


Support:

```

Text

Image

Audio

Video

Exercise

```


---

# 6.5 Analytics Domain


Responsible:


- student progress;
- exam analytics;
- ranking;
- performance analysis.


Data:


```

Exam Result

Learning Activity

Question Performance

Student Profile

```


---

# 6.6 AI Domain


Future component:


```

AI Question Generator

AI Tutor

AI Explanation

Recommendation Engine

RAG Knowledge System

```


---

# 7. Backend Logical Architecture


```

+--------------------------------+

```
    API Layer
```

+--------------------------------+

```
    Application Layer
```

+--------------------------------+

```
    Domain Layer
```

+--------------------------------+

```
    Infrastructure Layer
```

+--------------------------------+

```
    Database / External System
```

+--------------------------------+

```


## API Layer

Tanggung jawab:

- HTTP request;
- validation;
- authentication middleware;
- response formatting.


---

## Application Layer

Tanggung jawab:

- use case execution;
- transaction orchestration;
- business workflow.


Contoh:


```

CreateExamUseCase

StartExamSessionUseCase

SubmitAnswerUseCase

GenerateScoreUseCase

```


---

## Domain Layer


Berisi:

- entity;
- value object;
- domain service;
- domain event.


Tidak mengenal:

- database;
- HTTP;
- framework.


---

## Infrastructure Layer


Implementasi:


- PostgreSQL repository;
- Redis cache;
- storage;
- external API.


---

# 8. Data Architecture Overview


Primary database:


```

PostgreSQL

```


Digunakan untuk:


- transactional data;
- user;
- exam;
- question;
- learning.


Redis digunakan untuk:


- session;
- cache;
- temporary state;
- realtime CBT.


Object storage:


```

S3 Compatible Storage

```


Untuk:

- gambar soal;
- video;
- audio;
- dokumen.


---

# 9. Security Architecture Overview


Security principle:


```

Zero Trust Approach

```


Implementasi:


Authentication:

```

JWT Access Token

Refresh Token

Session Management

```


Authorization:


```

RBAC

Permission Policy

Tenant Isolation

```


Data protection:


```

HTTPS

Encryption

Secure Storage

Audit Log

```


---

# 10. Scalability Strategy


## Horizontal Scaling


Backend:


```

```
          Load Balancer

               |

    +----------+----------+

    |          |          |

 API-1      API-2      API-3
```

```


---

## Database Scaling


Tahap awal:


```

Single PostgreSQL

```


Tahap lanjut:


```

Primary Database

```
   |
```

Read Replica

```
   |
```

Analytics Database

```


---

## Async Processing


Task berat:


- AI generation;
- report generation;
- analytics calculation;
- file processing.


Dipindahkan:


```

API

|

Queue

|

Worker

|

Result

```


---

# 11. Deployment Vision


Production:


```

```
            Internet


               |

          Load Balancer


               |

          Backend API


               |

    +----------+----------+

    |                     |
```

PostgreSQL              Redis

```
    |
```

Object Storage

```
    |
```

Worker Service

```


---

# 12. Development Philosophy


YakinLulus.id menggunakan prinsip:


## Build Simple First

MVP tidak menggunakan:

- microservice berlebihan;
- event streaming kompleks;
- infrastructure mahal.


Tetapi:

- boundary domain sudah jelas;
- migration path tersedia.


---

## Production Ready From Start


Walaupun MVP kecil:


Tetap memiliki:


- logging;
- monitoring;
- testing;
- security;
- CI/CD;
- backup strategy.


---

# 13. Future Architecture Evolution


Target akhir:


```

```
                API Gateway


                     |


    +----------------+----------------+

    |                |                |
```

User Service      CBT Service      AI Service

```
    |
```

Learning Service

```
    |
```

Analytics Platform

```
    |
```

Data Warehouse

```


---

# 14. Summary


Arsitektur implementasi YakinLulus.id menggunakan:


```

Clean Architecture

*

Domain Driven Design

*

Modular Monolith

*

Event Driven Design

*

Cloud Native Infrastructure

```


Pendekatan ini memberikan:


- kecepatan development MVP;
- struktur kode yang maintainable;
- kemampuan scaling;
- kesiapan menuju microservice;
- fondasi untuk AI dan analytics platform.
```