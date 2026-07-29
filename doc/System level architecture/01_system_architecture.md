Siap. Melanjutkan ke file berikutnya:

# `11_implementation_architecture/01_system_architecture.md`

```md
# System Architecture
## YakinLulus.id System Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture  


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur sistem secara keseluruhan untuk platform **YakinLulus.id**.

Dokumen ini menjadi referensi untuk:

- backend engineer;
- frontend engineer;
- mobile engineer;
- DevOps engineer;
- security engineer;
- QA engineer.


Fokus dokumen:

- bagaimana seluruh komponen sistem berinteraksi;
- bagaimana data mengalir;
- bagaimana boundary antar sistem dibuat;
- bagaimana sistem berkembang dari MVP menuju enterprise scale.


---

# 2. System Architecture Principles


Arsitektur YakinLulus.id mengikuti prinsip:


## 2.1 Cloud Native Ready

Sistem dirancang untuk berjalan pada:

- VPS;
- cloud provider;
- container environment;
- Kubernetes.


Prinsip:

```

Application
+
Container
+
Automation
+
Observability

```


---

## 2.2 API First Architecture


Semua client menggunakan API.


```

```
             Backend API


    +------------+-------------+

    |            |             |

  Web          Mobile       External
```

```


Keuntungan:

- frontend dan backend independent;
- mudah membuat aplikasi baru;
- integrasi pihak ketiga lebih mudah.


---

## 2.3 Domain Oriented System


Sistem dibagi berdasarkan business capability.


```

System

|
+-- Identity Domain

|
+-- Question Bank Domain

|
+-- CBT Domain

|
+-- Learning Domain

|
+-- Analytics Domain

|
+-- AI Domain

```


---

# 3. High Level System Architecture


## 3.1 Overview Diagram


```

```
                       USER


         +-------------+-------------+

         |                           |

      Web App                    Mobile App

    React + TS                  Flutter


         |                           |

         +-------------+-------------+

                       |

                       |

                API Gateway Layer


                       |

                       |

              Backend Application


                       |

   +-------------------+-------------------+

   |                   |                   |
```

Identity Service     Business Modules    Integration

```
   |                   |                   |

   |                   |                   |

   +-------------------+-------------------+

                       |

              Infrastructure Layer


   +----------------+----------------+


   PostgreSQL       Redis       Object Storage


                       |

                       |

                Background Worker


                       |

                       |

               Analytics / AI System
```

```


---

# 4. Main System Components


## 4.1 Client Layer


Client bertanggung jawab untuk:

- user interaction;
- presentation;
- local state;
- offline capability.


Komponen:


```

Web Application

Mobile Application

Admin Dashboard

Teacher Dashboard

Student Application

```


---

# 4.2 API Gateway Layer


API Gateway menjadi pintu masuk seluruh request.


Tanggung jawab:


- routing;
- authentication validation;
- rate limiting;
- request logging;
- API versioning.


Contoh:


```

/api/v1/auth

/api/v1/questions

/api/v1/exams

/api/v1/materials

```


---

# 4.3 Backend Application Layer


Backend utama menggunakan:

```

Go Application

```


Bentuk:

```

Modular Monolith

```


Struktur:

```

backend/

cmd/

internal/

pkg/

migrations/

configs/

```


---

# 5. Backend Runtime Architecture


Diagram:


```

```
             HTTP Request


                   |

                   |

            Router / Handler


                   |

                   |

          Application Service


                   |

                   |

          Domain Business Logic


                   |

                   |

          Repository Interface


                   |

                   |

          Infrastructure


                   |

                   |

            PostgreSQL / Redis
```

```


---

# 6. Domain Module Architecture


Backend dibagi menjadi module.


```

internal/

├── identity

├── question_bank

├── exam

├── cbt

├── learning

├── analytics

├── notification

├── file

└── ai

```


Setiap module memiliki:


```

module/

├── domain

├── application

├── infrastructure

├── delivery

└── tests

```


---

# 7. Data Flow Architecture


## 7.1 Student Exam Flow


Contoh proses CBT.


```

Student

|

|

Start Exam

|

|

CBT API

|

|

Exam Module

|

|

Create Exam Session

|

|

Question Pool Generator

|

|

Randomization Engine

|

|

Return Questions

|

|

Student Answer

|

|

Answer Storage

|

|

Scoring Pipeline

|

|

Result Generated

```


---

# 8. Authentication Flow


```

User

|

|

Login Request

|

|

Auth Module

|

|

Validate Credential

|

|

Generate JWT

|

|

Return Token

|

|

Client Store Token

|

|

Access Protected API

```


---

# 9. Database Architecture


Primary database:


```

PostgreSQL

```


Digunakan untuk:

- transactional data;
- relational data;
- consistency.


Database utama:


```

yakinlulus_db

schemas:

identity

question_bank

exam

cbt

learning

analytics

billing

audit

```


---

# 10. Cache Architecture


Redis digunakan sebagai:


## Session Cache


```

User Session

JWT blacklist

Temporary token

```


## CBT Runtime State


Contoh:


```

exam_session:{id}

current_question

timer_state

connection_state

```


## Application Cache


Contoh:


```

subject_list

class_list

question_metadata

```


---

# 11. Storage Architecture


File tidak disimpan langsung di database.


Menggunakan object storage.


```

Application

```
|

|
```

File Service

```
|

|
```

Object Storage

```


Jenis file:


```

Question Image

Video Material

Audio

Document

Export Report

```


---

# 12. Background Processing Architecture


Task asynchronous:


```

API

|

|

Queue

|

|

Worker

|

|

Process

|

|

Result

```


Contoh:


- generate report;
- import Excel soal;
- AI generation;
- thumbnail processing;
- analytics calculation.


---

# 13. Event Architecture


Komponen menggunakan domain event.


Contoh:


```

ExamSubmittedEvent

```
    |

    |
```

+------+------+

|             |

Analytics   Notification

```


Event contoh:


```

UserRegistered

ExamStarted

ExamFinished

AnswerSubmitted

MaterialCompleted

```


---

# 14. Security Architecture Overview


Security layer:


```

Client

|

HTTPS

|

Gateway Security

|

Application Security

|

Database Security

```


Implementasi:


- JWT authentication;
- RBAC;
- permission checking;
- audit logging;
- encryption.


---

# 15. Deployment Architecture


MVP deployment:


```

```
             Internet


                |

              Nginx


                |

          Backend Container


                |

    +-----------+-----------+

    |                       |
```

PostgreSQL              Redis

```
    |
```

Object Storage

```


---

# 16. Production Scale Architecture


Target jutaan user:


```

```
                CDN


                 |

          Load Balancer


                 |

      +----------+----------+

      |          |          |

   API-1      API-2      API-3


      |

      |

   Database Cluster


      |

      |

 Event Processing Layer


      |

      |

 Analytics Platform
```

```


---

# 17. MVP vs Future Architecture


## MVP


Target:

<100 user


Architecture:


```

Single Backend

Single Database

Single Worker

Single Storage

```


---

## Growth Phase


Target:

ribuan user


Tambahan:


```

Multiple Backend Instance

Redis Cluster

Dedicated Worker

Monitoring Stack

```


---

## Enterprise Phase


Target:

jutaan user


Tambahan:


```

Microservices

Message Broker

Data Warehouse

AI Platform

Recommendation Engine

```


---

# 18. Implementation Consideration


## Backend


Prioritas:


- clean module boundary;
- dependency injection;
- repository abstraction;
- automated migration.


---

## Frontend


Prioritas:


- reusable component;
- API abstraction;
- responsive design;
- offline state.


---

## Mobile


Prioritas:


- local database;
- synchronization;
- background sync.


---

## Infrastructure


Prioritas:


- automated deployment;
- monitoring;
- backup;
- security.


---

# 19. Future Scalability


Architecture ini memungkinkan:


## Extract Service


Contoh:


Awal:


```

CBT Module

inside backend

```


Kemudian:


```

CBT Service

separate deployment

```


---

## Database Separation


Awal:


```

Single PostgreSQL

```


Kemudian:


```

Question Database

Exam Database

Analytics Database

```


---

## AI Platform Integration


Future:


```

Learning Data

```
  |

  |
```

AI Recommendation Engine

```
  |

  |
```

Personalized Learning

```


---

# 20. Summary


System Architecture YakinLulus.id menggunakan:


```

API First

*

Modular Monolith

*

DDD

*

Clean Architecture

*

Event Driven Design

*

Cloud Native Infrastructure

```


Arsitektur ini memberikan:

- cepat untuk MVP;
- mudah dikembangkan;
- aman untuk production;
- siap scale;
- siap menuju microservice.
```

---
