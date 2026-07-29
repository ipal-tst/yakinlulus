Melanjutkan ke file berikutnya:

# `11_implementation_architecture/06_service_architecture.md`

```md id="h8w4sd"
# Service Architecture
## YakinLulus.id Service Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan service architecture YakinLulus.id.

Service architecture menentukan:

- pembagian tanggung jawab sistem;
- boundary antar service/module;
- komunikasi antar komponen;
- kesiapan evolusi menuju microservice.


Pendekatan yang digunakan:

```

MVP:

Modular Monolith

Future:

Service Oriented Architecture

*

Microservices

```id="q1w9ks"


---

# 2. Service Architecture Principles


## 2.1 Business Capability Based


Service dipisahkan berdasarkan kemampuan bisnis.


Bukan:


```

Database Table

atau

Technical Layer

```id="z7m3qa"


Tetapi:


```

Question Management

Exam Execution

Learning Management

Analytics

Identity

```id="x4n8pv"


---

## 2.2 Loose Coupling


Komunikasi antar domain menggunakan:


```

Interface

*

Domain Event

*

API Contract

```id="v8m2rx"


Menghindari:


```

Direct Database Access

Shared Table Dependency

```id="j5q9tz"


---

## 2.3 Independent Scalability


Setiap service memiliki kemungkinan scaling berbeda.


Contoh:


```

CBT Service

High Traffic

Analytics Service

Heavy Processing

AI Service

GPU Intensive

```id="k6w4py"


---

# 3. Service Architecture Overview


```

```
                     Client


                       |

                       |

                API Gateway


                       |

    +------------------+------------------+

    |                  |                  |
```

Identity Service     Learning Service    Exam Service

```
    |                  |                  |


    +------------------+------------------+

                       |

              Shared Infrastructure


    +------------------+------------------+

    |                  |                  |


PostgreSQL          Redis          Object Storage


                       |

                       |

                 Worker Service


                       |

                       |

                AI / Analytics
```

```id="p4m8zx"


---

# 4. MVP Service Architecture


Pada fase MVP tidak menggunakan banyak microservice.


Implementasi:


```

```
            Backend Application


                    |

    +---------------+---------------+

    |               |               |
```

Identity          Learning          Exam

```
    |               |               |

    +---------------+---------------+

                PostgreSQL
```

```id="s8d2qm"


Semua service berjalan:


```

1 Deployment

1 Backend Application

1 Database

```id="n5w3rt"


---

# 5. Core Domain Services


YakinLulus.id memiliki domain service utama:


```

1. Identity Service

2. Question Bank Service

3. Exam Service

4. CBT Runtime Service

5. Learning Service

6. Analytics Service

7. Notification Service

8. File Service

9. AI Service

```id="m7x2qa"


---

# 6. Identity Service


## Responsibility


Mengelola:


- user account;
- authentication;
- authorization;
- RBAC;
- organization membership.


Diagram:


```

User

|

Identity Service

|

User Database

```id="w3n8kp"


---

## Entity


```

User

Role

Permission

Session

Audit Log

```id="x9r4mh"


---

## API Example


```

POST /auth/login

POST /auth/logout

GET /users/profile

```id="b5k8qa"


---

# 7. Question Bank Service


## Responsibility


Mengelola:


- question repository;
- taxonomy;
- question metadata;
- explanation;
- multimedia.


Diagram:


```

Teacher/Admin

```
  |
```

Question Bank Service

```
  |
```

Question Repository

```id="r2m7xs"


---

## Entity


```

Question

Option

Subject

Chapter

Difficulty

Source

Explanation

```id="y8p4kw"


---

## Future Extraction


Dapat menjadi:


```

Question Bank Service

Database sendiri

Search Engine

AI Generator Integration

```id="h5v9qx"


---

# 8. Exam Service


## Responsibility


Mengelola:


- exam definition;
- exam configuration;
- scheduling;
- participant.


Diagram:


```

Admin

|

Exam Service

|

Exam Database

```id="d7k3mp"


---

## Entity


```

Exam

Exam Template

Exam Participant

Exam Rule

```id="u6w2sz"


---

# 9. CBT Runtime Service


CBT adalah service dengan kebutuhan performa tinggi.


Responsibility:


- session management;
- timer;
- question delivery;
- answer processing;
- synchronization.


Architecture:


```

Student

|

CBT Runtime

|

Redis Runtime State

|

PostgreSQL Persistence

```id="q8m5yt"


---

# 10. Learning Service


Responsibility:


Mengelola:


- learning material;
- course;
- chapter;
- progress.


Diagram:


```

Student

|

Learning Service

|

Material Repository

```id="k4r8px"


---

Entity:


```

Course

Material

Chapter

Learning Progress

Exercise

```id="m3v7qa"


---

# 11. Analytics Service


Responsibility:


- collecting activity;
- processing metrics;
- generating report.


Architecture:


```

Application Event

```
    |

    |
```

Analytics Worker

```
    |

    |
```

Analytics Database

```id="t5q9mw"


---

Data:


```

Exam Result

Question Performance

Student Progress

Learning Behavior

```id="f8n2rx"


---

# 12. Notification Service


Responsibility:


Mengirim:


- push notification;
- email;
- announcement.


Architecture:


```

Event

|

Notification Service

|

Provider

|

User

```id="z6w4kp"


Provider:


```

Firebase Cloud Messaging

Email Provider

SMS Provider

```id="p3m8ys"


---

# 13. File Service


Responsibility:


Mengelola:


- upload;
- download;
- metadata file;
- access control.


Architecture:


```

Application

|

File Service

|

Object Storage

```id="q7x4mn"


File:


```

Question Image

Video

Audio

Document

Report

```id="v5k8zr"


---

# 14. AI Service


Future service.


Responsibility:


- question generation;
- explanation generation;
- AI tutor;
- recommendation.


Architecture:


```

Application

|

AI Gateway

|

LLM Provider

|

Vector Database

```id="r9m2qw"


---

# 15. Service Communication Pattern


## Synchronous Communication


Digunakan untuk:


- request-response;
- user interaction.


Contoh:


```

Frontend

|

Exam API

|

Exam Service

```id="w6p3xs"


---

## Asynchronous Communication


Digunakan untuk:


- background processing;
- analytics;
- notification.


Contoh:


```

Exam Finished Event

```
      |

      |
```

Analytics Worker

```id="e4k7mp"


---

# 16. Domain Event Architecture


Contoh:


```

ExamSubmitted

```
  |

  +------------+

  |            |
```

Analytics     Notification

```id="x8m5qt"


Event:


```

UserRegistered

ExamStarted

AnswerSubmitted

ExamCompleted

MaterialFinished

```id="b7n3ks"


---

# 17. Service Data Ownership


Setiap service memiliki ownership.


Contoh:


```

Identity Service

owns:

User Data

Exam Service

owns:

Exam Data

Question Service

owns:

Question Data

```id="h2q9vm"


Tidak diperbolehkan:


```

Exam Service

langsung update

Question Database

```id="c5w8zr"


---

# 18. API Gateway Responsibility


Gateway menangani:


```

Routing

Authentication

Rate Limiting

Logging

Versioning

```id="p6v3mx"


Contoh:


```

/api/v1/auth/*

/api/v1/exams/*

/api/v1/questions/*

```id="n4q7ys"


---

# 19. Service Discovery


MVP:


```

Static Configuration

```id="d8m5pk"


Future:


```

Service Registry

Kubernetes Discovery

```id="m7q2xa"


---

# 20. Service Security


Setiap service:


- authentication;
- authorization;
- input validation;
- audit logging.


Internal communication:


Future:


```

mTLS

Service Identity

```id="r5x8qn"


---

# 21. Deployment Model


## MVP


```

Docker Compose

+----------------+

Backend Container

+----------------+

Worker Container

+----------------+

Database

+----------------+

Redis

```id="k8m4wv"


---

## Scale Phase


```

Kubernetes

```
   |
```

+------+------+

API Pods

Worker Pods

Service Pods

```id="z3q6mp"


---

# 22. Migration Path To Microservice


Tahapan:


## Step 1


```

Modular Monolith

```id="x5m8qa"


---

## Step 2


Extract high load domain:


```

CBT Runtime

Analytics

AI

```id="s7n4kp"


---

## Step 3


Full service:


```

Identity Service

Question Service

Exam Service

Learning Service

```id="m9q3rx"


---

# 23. Scalability Strategy


Service yang kemungkinan membutuhkan scaling:


## CBT Runtime


Karena:


- banyak concurrent student;
- real-time interaction.


---

## Analytics


Karena:


- heavy computation;
- reporting.


---

## AI Service


Karena:


- model inference;
- vector search.


---

# 24. Summary


Service Architecture YakinLulus.id:


```

Modular Monolith First

*

Domain Based Service Boundary

*

Event Driven Ready

*

Microservice Migration Ready

```id="p8w2mz"


Memberikan:


- development cepat;
- biaya MVP rendah;
- boundary jelas;
- mudah scaling;
- siap enterprise platform.
```

