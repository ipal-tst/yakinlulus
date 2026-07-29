```markdown id="5d9zx"
# 12_engineering_implementation_guide/mobile/04_flutter_architecture.md

# Flutter Architecture Implementation

## 1. Tujuan

Dokumen ini menjelaskan implementasi architecture Flutter application YakinLulus.id.

Tujuan architecture ini:

- menjaga separation of concern;
- memisahkan business logic dari UI;
- membuat aplikasi mudah diuji;
- mengurangi coupling antar komponen;
- mendukung pengembangan fitur besar seperti CBT Engine, offline sync, AI Tutor, dan learning analytics.


Architecture yang digunakan:

```

Clean Architecture

*

Feature Based Architecture

*

Repository Pattern

*

Dependency Injection

*

Reactive State Management

```


---

# 2. Architecture Principle


Flutter application YakinLulus mengikuti prinsip:

```

Inner Layer tidak mengetahui Outer Layer

Outer Layer bergantung kepada Inner Layer

```


Dependency direction:


```

```
          Presentation Layer


                 ↓


          Application Layer


                 ↓


            Domain Layer


                 ↓


             Data Layer


                 ↓


         External Infrastructure
```

```


---

# 3. Clean Architecture Overview


High level diagram:


```

+------------------------------------------------+

|              Presentation Layer                |

|                                                |

|  Pages                                         |

|  Widgets                                      |

|  Controllers                                  |

|  State Management                             |

+------------------------------------------------+

```
                 |

                 ↓
```

+------------------------------------------------+

|             Application Layer                  |

|                                                |

|  Use Cases                                     |

|  Application Services                          |

|  Business Flow                                 |

+------------------------------------------------+

```
                 |

                 ↓
```

+------------------------------------------------+

|                Domain Layer                    |

|                                                |

|  Entities                                     |

|  Repository Interface                          |

|  Business Rules                                |

+------------------------------------------------+

```
                 |

                 ↓
```

+------------------------------------------------+

|                 Data Layer                     |

|                                                |

|  Repository Implementation                     |

|  API Client                                    |

|  Local Database                                |

|  Cache                                         |

+------------------------------------------------+

```
                 |

                 ↓
```

+------------------------------------------------+

|             External Systems                   |

|                                                |

| Backend API                                    |

| SQLite                                         |

| File Storage                                   |

+------------------------------------------------+

```


---

# 4. Layer Responsibility


## 4.1 Presentation Layer


Tanggung jawab:

- menampilkan UI;
- menerima user interaction;
- mengelola UI state;
- melakukan navigation.


Tidak boleh:

- mengakses API langsung;
- melakukan business calculation;
- query database.


Contoh:


```

ExamPage

```
    |
```

ExamController

```
    |
```

StartExamUseCase

```


---

# 4.2 Application Layer


Application layer berisi proses bisnis aplikasi.


Contoh:


```

StartExamUseCase

SubmitAnswerUseCase

SyncExamUseCase

DownloadMaterialUseCase

```


Tanggung jawab:

- orchestration;
- menjalankan business flow;
- menghubungkan domain dengan infrastructure.


Contoh:


```

Student Start Exam

```
    |
```

StartExamUseCase

```
    |
```

Check Permission

```
    |
```

Create Session

```
    |
```

Load Question

```
    |
```

Return Exam Session

```


---

# 4.3 Domain Layer


Domain adalah bagian paling penting.


Berisi:

- entity;
- value object;
- repository contract;
- business rules.


Contoh:


```

Exam

Question

Answer

StudentProgress

```


Domain tidak mengenal:

```

Flutter

Dio

SQLite

API

```


---

# 4.4 Data Layer


Data layer menangani implementasi teknis.


Berisi:


```

Repository Implementation

Remote Data Source

Local Data Source

DTO Model

Mapper

```


Contoh:


```

ExamRepositoryImpl

```
    |

    +---- ExamApiDatasource

    |

    +---- ExamLocalDatasource
```

```


---

# 5. Feature Based Architecture


Setiap fitur memiliki boundary sendiri.


Contoh:


```

features/

├── exam/

│
├── learning/

│
├── authentication/

│
├── question_bank/

│
└── profile/

```


Keuntungan:

- modular;
- mudah scale;
- developer ownership jelas;
- mengurangi konflik.


---

# 6. Example Feature Architecture


Contoh:

```

features/exam/

├── data/

│
│   ├── datasource/

│   ├── models/

│   ├── repositories/

├── domain/

│
│   ├── entities/

│   ├── repositories/

│   └── usecases/

└── presentation/

```
├── pages/

├── widgets/

├── providers/

└── states/
```

```


---

# 7. Dependency Flow


Contoh proses submit answer:


```

Student Click Submit

```
    |
```

Presentation Layer

```
    |
```

SubmitAnswerController

```
    |
```

SubmitAnswerUseCase

```
    |
```

ExamRepository Interface

```
    |
```

ExamRepositoryImpl

```
    |
```

Remote API

```
    +
```

Local Database

```


---

# 8. Dependency Injection Architecture


YakinLulus menggunakan Dependency Injection.


Tujuan:

- loose coupling;
- mudah testing;
- mudah mengganti implementation.


Architecture:


```

Service Locator

```
    |
```

Dependency Container

```
    |
```

Repository

```
    |
```

Datasource

```


Contoh:


```

register(

ExamRepository(

ExamRepositoryImpl(

```
  ExamApiDatasource()
```

)

)

)

```


---

# 9. State Management Architecture


State management bertanggung jawab terhadap:


- UI state;
- loading;
- error;
- data update.


Flow:


```

User Action

```
|
```

Controller

```
|
```

Use Case

```
|
```

State Update

```
|
```

UI Rebuild

```


---

# 10. Reactive Data Flow


YakinLulus menggunakan reactive approach.


Contoh:


```

Exam Timer

```
  |
```

Stream

```
  |
```

Exam Controller

```
  |
```

State Provider

```
  |
```

Timer Widget Update

```


---

# 11. Error Handling Architecture


Error harus konsisten.


Flow:


```

API Error

```
|
```

Data Exception

```
|
```

Repository Convert

```
|
```

Domain Failure

```
|
```

UI Error State

```


Contoh:


```

NetworkFailure

AuthenticationFailure

ExamExpiredFailure

SyncConflictFailure

```


---

# 12. Offline Architecture Integration


Flutter architecture mendukung offline-first.


Diagram:


```

Application Layer

```
    |
```

Repository

```
    |
```

+----------------+

|                |

Local DB      Remote API

|                |

+----------------+

```
    |
```

Sync Engine

```


Prioritas:


```

Local Data First

```
    ↓
```

Background Sync

```
    ↓
```

Server Update

```


---

# 13. CBT Runtime Architecture


CBT membutuhkan architecture khusus.


Flow:


```

Exam Package Download

```
    |
```

Local Storage

```
    |
```

Exam Runtime Engine

```
    |
```

Answer Persistence

```
    |
```

Synchronization Queue

```
    |
```

Backend

```


Komponen:


```

ExamSessionManager

TimerManager

AnswerManager

SyncManager

```


---

# 14. Navigation Architecture


Routing terpusat.


Contoh:


```

app/router.dart

/login

/dashboard

/material

/exam/:id

/result/:id

```


Navigation tidak dilakukan langsung antar widget.


---

# 15. Configuration Architecture


Configuration dipisahkan.


Structure:


```

config/

├── environment.dart

├── api_config.dart

├── app_config.dart

└── feature_flag.dart

```


Mendukung:

- development;
- staging;
- production.


---

# 16. Testing Architecture


Setiap layer dapat diuji.


## Domain Test


Test:

- entity;
- use case;
- business rule.


---

## Data Test


Test:

- repository;
- API mapper;
- local datasource.


---

## Presentation Test


Test:

- widget;
- state;
- user interaction.


Diagram:


```

Unit Test

```
|
```

Integration Test

```
|
```

Widget Test

```
|
```

End To End Test

```


---

# 17. Security Consideration


Architecture harus mendukung:


## Token Management


```

API Token

```
    |
```

Secure Storage

```
    |
```

HTTP Interceptor

```


---

## Sensitive Data


Tidak disimpan pada:

- Shared Preference;
- plaintext file.


Menggunakan:

```

Encrypted Storage

```


---

# 18. Scalability Consideration


Architecture ini siap berkembang:


## Multi Application


Future:


```

Student App

Teacher App

Admin App

```


---

## Modular Package


Feature dapat dipisahkan:


```

exam_module

learning_module

ai_module

```


---

# 19. Future Evolution


Evolution path:


Phase 1:

```

Single Flutter App

Modular Architecture

```


Phase 2:

```

Feature Packages

```


Phase 3:

```

Multiple Application Ecosystem

```


---

# Summary


Flutter architecture YakinLulus.id menggunakan:


```

Clean Architecture

*

Feature Based Architecture

*

Repository Pattern

*

Dependency Injection

*

Reactive State Management

*

Offline First Design

```


Architecture ini memastikan aplikasi mobile:

- mudah dikembangkan;
- mudah diuji;
- aman;
- mendukung CBT kompleks;
- siap berkembang menjadi platform EdTech berskala besar.
```
