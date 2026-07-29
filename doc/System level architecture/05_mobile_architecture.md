Melanjutkan ke file berikutnya:

# `11_implementation_architecture/05_mobile_architecture.md`

```md
# Mobile Architecture
## YakinLulus.id Mobile Application Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur aplikasi mobile YakinLulus.id.

Mobile application menjadi client utama untuk:

- siswa;
- guru;
- pengguna sekolah;
- aktivitas belajar;
- CBT examination;
- monitoring progress.


Target platform:

```

Android

*

iOS

```

Framework:

```

Flutter
+
Dart

```


---

# 2. Mobile Architecture Principles


Arsitektur mobile menggunakan:


```

Clean Architecture

*

Feature Driven Development

*

Offline First

*

Reactive Programming

*

Secure Storage

*

API Driven

```


Tujuan:

- performa tinggi;
- code maintainability;
- mudah testing;
- support offline;
- siap scale.


---

# 3. Technology Stack


## Framework


```

Flutter

Version:

3.x+

```


Alasan:

- single codebase Android/iOS;
- performa native;
- UI konsisten;
- ecosystem besar.


---

## Language


```

Dart

```


---

## State Management


Rekomendasi:


```

Riverpod

atau

Bloc

```


Pemilihan awal:

```

Riverpod

```


Alasan:

- simple;
- dependency injection support;
- scalable;
- test friendly.


---

## Local Database


Untuk offline capability:


```

SQLite

atau

Isar

```


Penggunaan:


```

Question Cache

Exam Session

Answer Draft

Learning Progress

```


---

## Secure Storage


Untuk data sensitif:


```

Flutter Secure Storage

```


Menyimpan:


```

Refresh Token

Device Identifier

Encryption Key

```


---

# 4. Mobile High Level Architecture


```

```
                User


                 |

                 |

          Flutter Application


                 |

    +------------+------------+

    |                         |
```

Presentation Layer        State Layer

```
    |                         |

    +------------+------------+

                 |

          Domain Layer


                 |

    +------------+------------+

    |                         |
```

Repository Layer        Local Database

```
    |

    |
```

Remote Data Source

```
    |

    |
```

Backend API

```


---

# 5. Project Structure


Struktur:


```

mobile/

lib/

├── app/

├── core/

│
├── config

├── network

├── storage

├── security

├── utils

├── features/

│
├── auth/

├── question_bank/

├── cbt/

├── learning/

├── analytics/

├── profile/

└── notification/

├── shared/

├── widgets/

└── main.dart

```


---

# 6. Feature Based Architecture


Setiap feature berdiri sendiri.


Contoh:


```

features/cbt/

├── data/

├── domain/

├── presentation/

├── providers/

└── widgets/

```


---

# 7. Clean Architecture Layer


Diagram:


```

+--------------------------------+

```
    Presentation Layer
```

Screens

Widgets

Controllers

+--------------------------------+

```
    Application Layer
```

Use Cases

State Management

+--------------------------------+

```
    Domain Layer
```

Entities

Business Rules

Repository Contract

+--------------------------------+

```
    Data Layer
```

API

Database

Storage

+--------------------------------+

```


---

# 8. Presentation Layer


Tanggung jawab:


- UI rendering;
- user interaction;
- navigation.


Contoh:


```

ExamScreen

QuestionScreen

LearningScreen

ProfileScreen

```


Tidak boleh:


```

Widget

langsung akses API

```


---

# 9. Domain Layer


Merupakan business core.


Berisi:


## Entity


Contoh:


```

ExamSession

Question

Answer

LearningProgress

```


---

## Use Case


Contoh:


```

StartExamUseCase

SubmitAnswerUseCase

DownloadMaterialUseCase

SyncAnswerUseCase

```


---

## Repository Contract


Contoh:


```

abstract class ExamRepository {

startExam();

submitAnswer();

}

```


---

# 10. Data Layer


Implementasi:


```

Repository Implementation

```
    |

    +-------------+

    |             |
```

Remote          Local

Data Source     Data Source

```


---

# 11. API Communication Architecture


Flow:


```

Screen

|

Provider

|

Use Case

|

Repository

|

API Client

|

Backend API

```


---

# 12. Authentication Architecture


Flow:


```

User

|

Login

|

Auth API

|

Receive Token

|

Secure Storage

|

Authenticated Request

```


Token storage:


```

Access Token

Refresh Token

```


---

# 13. Offline First Architecture


YakinLulus mendukung offline terutama untuk CBT.


Architecture:


```

```
             Mobile App


                 |

                 |

          Local Database


                 |

                 |

          Sync Engine


                 |

                 |

          Backend API
```

```


---

# 14. Offline CBT Architecture


CBT offline flow:


```

Before Exam

```
  |
```

Download Question Package

```
  |
```

Encrypt Local Storage

```
  |
```

Start Exam

```
  |
```

Save Answer Locally

```
  |
```

Connection Available

```
  |
```

Synchronize Answer

```
  |
```

Validate Server

```
  |
```

Finalize Result

```


---

# 15. Synchronization Engine


Komponen:


```

Sync Manager

*

Offline Queue

*

Conflict Resolver

```


---

## Sync Queue Example


```

Pending Action:

1. Answer Question #1

2. Answer Question #2

3. Flag Question #3

```


Ketika online:


```

Queue

|

Sync

|

Server Validation

|

Remove Queue Item

```


---

# 16. CBT Mobile Runtime Architecture


CBT membutuhkan reliability tinggi.


```

```
         CBT Engine


            |

  +---------+---------+

  |                   |
```

Question Manager    Timer Manager

```
  |                   |
```

Answer Manager    Sync Manager

```
  |
```

Local Storage

```


---

# 17. Local Data Security


Data offline harus terlindungi.


Implementasi:


```

Database Encryption

Secure Storage

Application Lock

Data Expiration

```


---

# 18. Push Notification Architecture


Mobile notification:


```

Backend

|

Notification Service

|

Firebase Cloud Messaging

|

Mobile Device

```


Use case:


- exam reminder;
- new material;
- announcement;
- learning reminder.


---

# 19. File Download Architecture


Material:


```

Backend Storage

```
   |

   |
```

Download Manager

```
   |

   |
```

Local Cache

```


Support:


- video;
- audio;
- PDF;
- image.


---

# 20. Mobile Performance Optimization


Strategi:


## Lazy Loading


```

Load Feature When Needed

```


---

## Memory Management


```

Image Compression

Cache Control

Resource Cleanup

```


---

## Network Optimization


```

Request Cache

Pagination

Compression

```


---

# 21. Mobile Security Architecture


Security layer:


```

Application

|

Certificate Validation

|

Secure Storage

|

API Security

|

Backend Authorization

```


Tambahan:


- jailbreak/root detection;
- screenshot restriction untuk CBT;
- device binding.


---

# 22. Testing Strategy


## Unit Test


Target:


```

Use Case

Repository

Business Logic

```


---

## Widget Test


Target:


```

UI Component

Form

Navigation

```


---

## Integration Test


Scenario:


```

Login

Download Exam

Take Exam

Submit Answer

```


---

# 23. Deployment Architecture


Distribution:


Android:


```

Google Play Store

```


iOS:


```

Apple App Store

```


Internal testing:


```

Firebase App Distribution

```


---

# 24. Mobile CI/CD


Pipeline:


```

Git Push

|

CI Build

|

Run Test

|

Generate APK/IPA

|

Deploy Distribution

```


---

# 25. Future Scalability


## Multi Platform Expansion


Architecture siap:


```

Android

iOS

Tablet

Desktop Flutter

```


---

## Offline Learning Platform


Future:


```

Complete Course Download

*

Offline Learning Mode

*

Background Sync

```


---

## AI Assistant Integration


Future:


```

Mobile App

|

AI Tutor Module

|

Personalized Learning

```


---

# 26. Summary


Mobile Architecture YakinLulus.id:


```

Flutter

*

Clean Architecture

*

Feature Based Design

*

Offline First

*

Secure Storage

*

Sync Engine

```


Memberikan:

- pengalaman belajar mobile modern;
- CBT reliable;
- dukungan koneksi tidak stabil;
- codebase mudah berkembang;
- siap untuk jutaan pengguna.
```

---
