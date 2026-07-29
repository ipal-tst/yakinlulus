# `12_engineering_implementation_guide/mobile/01_mobile_overview.md`

```markdown
# Mobile Application Overview

## 1. Tujuan

Dokumen ini menjelaskan rancangan implementasi mobile application YakinLulus.id.

Mobile application menjadi salah satu client utama platform yang digunakan oleh:

- Student;
- Teacher;
- Admin (future).

Tujuan utama mobile application:

- memberikan pengalaman belajar yang optimal melalui perangkat mobile;
- mendukung CBT examination secara reliable;
- mendukung offline-first learning;
- melakukan sinkronisasi data ketika koneksi tersedia;
- menyediakan akses materi pembelajaran;
- menyediakan notifikasi dan progress tracking.


Mobile application harus dirancang sebagai aplikasi production-grade yang:

- scalable;
- maintainable;
- secure;
- testable;
- siap berkembang.


---

# 2. Mobile Application Scope


## MVP Scope


Pada fase awal, mobile application fokus pada:

### Student Application

Fitur utama:

```

Authentication

```
↓
```

Student Dashboard

```
↓
```

Learning Material

```
↓
```

Question Practice

```
↓
```

CBT Examination

```
↓
```

Result & Progress

```


Komponen utama:

- login;
- profile;
- daftar materi;
- latihan soal;
- mengikuti ujian;
- melihat hasil;
- melihat progress belajar.


---

# 3. Technology Stack


## Framework

```

Flutter

```


Alasan:

- single codebase;
- Android dan iOS support;
- performance mendekati native;
- mature ecosystem.


---

## Programming Language


```

Dart

```


---

## Architecture Pattern


Menggunakan:


```

Clean Architecture
+
Feature Based Architecture
+
Repository Pattern
+
Dependency Injection

```


Diagram:


```

Presentation Layer

```
    |
```

Application Layer

```
    |
```

Domain Layer

```
    |
```

Data Layer

```
    |
```

External Source

```


---

# 4. Mobile Architecture Overview


High level architecture:


```

```
             YakinLulus Mobile App


                     UI Layer

                        |

                State Management

                        |

                Use Case Layer

                        |

                Repository Layer

                        |

      +-----------------+----------------+

      |                                  |

Remote Data Source              Local Data Source

      |                                  |

   REST API                         SQLite

      |                                  |

   Backend                        Offline Storage
```

```


---

# 5. Application Layer Responsibility


## Presentation Layer


Bertanggung jawab:

- UI rendering;
- user interaction;
- navigation;
- form handling;
- state display.


Contoh:


```

LoginPage

ExamPage

QuestionPage

DashboardPage

```


---

## State Management Layer


Mengatur:

- application state;
- loading state;
- error state;
- cache state.


Contoh:


```

AuthenticationState

ExamSessionState

LearningProgressState

```


---

## Domain Layer


Berisi:

- entity;
- business rule;
- use case.


Contoh:


```

StartExamUseCase

SubmitAnswerUseCase

SyncExamUseCase

DownloadMaterialUseCase

```


---

## Data Layer


Mengatur:


```

API Communication

Local Database

Cache

Synchronization

```


---

# 6. Mobile Module Architecture


Struktur utama:


```

mobile/

lib/

├── core/

│
├── features/

│
├── shared/

│
├── config/

│
└── main.dart

```


---

## Core Module


Berisi komponen umum:


```

core/

├── network

├── database

├── storage

├── authentication

├── error

├── utils

└── constants

```


---

## Feature Module


Menggunakan feature based:


```

features/

├── auth/

├── dashboard/

├── learning/

├── question/

├── exam/

├── result/

└── profile/

```


---

# 7. CBT Mobile Architecture


CBT merupakan modul paling kritikal.


Flow:


```

Download Exam Package

```
    |
```

Store Locally

```
    |
```

Start Exam

```
    |
```

Local Exam Runtime

```
    |
```

Save Answer Locally

```
    |
```

Sync To Server

```
    |
```

Generate Result

```


---

# 8. Offline First Strategy


Mobile application menggunakan pendekatan:


```

Local First

```
    |
```

Background Sync

```
    |
```

Server Reconciliation

```


Artinya:


Saat ujian:

```

Student Answer

```
    |
```

Local Database

```
    |
```

Sync Queue

```
    |
```

Backend

```


Tidak bergantung penuh pada koneksi internet.


---

# 9. Local Storage Architecture


Komponen:


```

Flutter Application

```
    |
```

Local Storage Layer

```
    |
```

SQLite Database

```
    |
```

Encrypted Storage

```


Digunakan untuk:


- exam session;
- question package;
- answer temporary;
- learning progress;
- application cache.


---

# 10. API Communication


Mobile berkomunikasi dengan backend menggunakan:


```

REST API

JSON

HTTPS

JWT Authentication

```


Flow:


```

Mobile

|

HTTPS

|

API Gateway

|

Backend Service

|

PostgreSQL

```


---

# 11. Authentication Flow


```

User Login

```
|
```

Send Credential

```
|
```

Backend Validation

```
|
```

Receive Token

```
|
```

Store Securely

```
|
```

Access Protected API

```


Storage:


```

Secure Storage

(Keychain Android Keystore)

```


---

# 12. Security Consideration


Mobile application harus memperhatikan:


## Credential Security


Tidak menyimpan:

- password;
- sensitive token.


Menggunakan:


```

Secure Storage

```


---

## API Security


Implementasi:

- HTTPS mandatory;
- JWT expiration;
- refresh token;
- certificate validation.


---

## Exam Security


CBT mobile:

- prevent answer manipulation;
- encrypted local storage;
- session validation;
- device identification.


---

# 13. Performance Consideration


Target:


## Application Startup


```

< 3 seconds

```


---

## Memory Usage


Optimasi:

- lazy loading;
- pagination;
- image compression.


---

## Network Usage


Gunakan:

- caching;
- compression;
- incremental sync.


---

# 14. Testing Strategy


Mobile testing:


```

Unit Test

```
    |
```

Widget Test

```
    |
```

Integration Test

```
    |
```

Device Test

```
    |
```

Release Test

```


Area kritikal:


- login;
- exam flow;
- timer;
- answer save;
- offline sync.


---

# 15. Scalability Consideration


Mobile architecture harus siap:


## Multi Platform


Future:

```

Android

iOS

Tablet

Desktop

```


---

## Feature Expansion


Mudah menambah:


```

AI Tutor

Video Learning

Live Class

Discussion

Gamification

```


---

# 16. Future Evolution


Kemungkinan pengembangan:


## Phase 1

Basic learning app.


## Phase 2

Offline CBT.


## Phase 3

AI assisted learning.


## Phase 4

Super App Education Platform.


---

# Summary


Mobile application YakinLulus.id menggunakan:

- Flutter;
- Clean Architecture;
- Feature Based Architecture;
- Repository Pattern;
- Offline First Strategy;
- Secure Storage;
- Local Database;
- Background Synchronization.


Fokus implementasi utama:

```

Learning Experience

*

Reliable CBT Runtime

*

Offline Capability

*

Secure Synchronization

```


Architecture ini memungkinkan mobile application berkembang dari MVP menjadi platform EdTech berskala besar.
```

-