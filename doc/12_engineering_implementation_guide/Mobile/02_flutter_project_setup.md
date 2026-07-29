```markdown
# 12_engineering_implementation_guide/mobile/02_flutter_project_setup.md

# Flutter Project Setup

## 1. Tujuan

Dokumen ini menjelaskan standar implementasi awal Flutter project untuk aplikasi mobile YakinLulus.id.

Tujuan utama:

- membuat struktur project yang scalable;
- menerapkan standard engineering sejak awal;
- memastikan codebase mudah dikembangkan oleh multiple developer;
- mendukung Clean Architecture;
- mendukung testing;
- mendukung CI/CD pipeline.


Flutter project harus dipersiapkan sebagai production application, bukan sekadar prototype.


---

# 2. Technology Stack


## Mobile Framework


```

Flutter

```


Flutter dipilih karena:

- satu codebase Android dan iOS;
- performa tinggi;
- UI consistency;
- mature ecosystem;
- mendukung offline application.


---

## Language


```

Dart

```


Target:

```

Dart 3.x
Flutter 3.x

```


---

# 3. Development Environment


## Required Tools


Developer environment:


```

Flutter SDK

Dart SDK

Android Studio

Android SDK

Xcode (macOS untuk iOS)

VS Code / Android Studio

Git

Docker (optional untuk backend integration)

````


---

# 4. Flutter Project Initialization


Project dibuat:


```bash
flutter create yakinlulus_mobile
````

Struktur awal:

```
yakinlulus_mobile/

├── android/

├── ios/

├── lib/

├── test/

├── pubspec.yaml

└── README.md

```

---

# 5. Production Project Structure

Struktur final:

```
yakinlulus_mobile/


├── lib/

│
├── app/

│   ├── app.dart

│   ├── router.dart

│   └── theme.dart


├── core/

│
│   ├── constants/

│   ├── error/

│   ├── network/

│   ├── storage/

│   ├── database/

│   ├── security/

│   └── utils/


├── features/

│
│   ├── auth/

│   ├── dashboard/

│   ├── learning/

│   ├── question_bank/

│   ├── exam/

│   ├── result/

│   └── profile/


├── shared/

│
│   ├── widgets/

│   ├── components/

│   └── extensions/


├── config/

│
│   ├── environment.dart

│   └── flavor.dart


└── main.dart

```

---

# 6. Environment Configuration

Aplikasi harus mendukung beberapa environment:

```
Development

        |

Staging

        |

Production
```

Contoh:

```
lib/config/


environment.dart

flavor.dart

```

---

## Development

Digunakan developer.

Configuration:

```
API:

https://dev-api.yakinlulus.id

Database:

local/mock

Logging:

verbose
```

---

## Staging

Digunakan untuk testing.

```
API:

https://staging-api.yakinlulus.id


Logging:

limited
```

---

## Production

Digunakan user.

```
API:

https://api.yakinlulus.id


Logging:

error only
```

---

# 7. Dependency Management

Dependency dikelola melalui:

```
pubspec.yaml
```

Kategori dependency:

## State Management

Contoh:

```
Riverpod

Bloc

Provider

```

Rekomendasi YakinLulus:

```
Riverpod
```

Alasan:

* scalable;
* test friendly;
* dependency injection support;
* cocok dengan clean architecture.

---

## Networking

Menggunakan:

```
Dio
```

Fungsi:

* REST API client;
* interceptor;
* token handling;
* retry mechanism.

---

## Local Database

Menggunakan:

```
SQLite

Drift / Floor
```

Digunakan untuk:

* offline exam;
* local cache;
* sync queue.

---

## Secure Storage

Menggunakan:

```
Flutter Secure Storage
```

Untuk:

* access token;
* refresh token;
* encryption key.

---

# 8. Application Entry Point

File:

```
main.dart
```

Responsibility:

* initialize application;
* load environment;
* initialize dependency;
* start app.

Flow:

```
main()


  |

Initialize Config


  |

Initialize Database


  |

Initialize Dependency Injection


  |

Run Application


  |

YakinLulusApp()

```

---

# 9. Dependency Injection Setup

Menggunakan dependency injection.

Architecture:

```
Application


      |

Dependency Container


      |

Services


      |

Repositories


      |

Data Sources

```

Contoh dependency:

```
AuthRepository

ExamRepository

MaterialRepository

SyncService

StorageService

```

---

# 10. Routing Architecture

Routing menggunakan centralized router.

Struktur:

```
app/


router.dart

```

Contoh:

```
/login

/dashboard

/material

/exam/:id

/result/:id

/profile

```

---

# 11. Theme Configuration

Theme terpusat:

```
app/theme.dart
```

Mendukung:

```
Light Theme

Dark Theme
```

Design token:

```
Colors

Typography

Spacing

Border Radius

Component Style

```

Mengikuti design system YakinLulus:

```
Primary:

Blue


Secondary:

Green


Accent:

Gold

```

---

# 12. Build Configuration

Build mode:

```
Debug

Profile

Release
```

---

## Debug

Digunakan:

* development;
* debugging.

---

## Profile

Digunakan:

* performance analysis.

---

## Release

Digunakan:

* production deployment.

---

# 13. Code Quality Standard

Wajib:

## Formatting

```bash
dart format .
```

---

## Static Analysis

```bash
flutter analyze
```

---

## Testing

```bash
flutter test
```

---

# 14. Git Integration

Branch strategy:

```
main

 |

develop

 |

feature/*
```

Contoh:

```
feature/mobile-authentication

feature/exam-runtime

feature/offline-sync

```

---

# 15. CI/CD Preparation

Flutter project harus siap:

```
Developer Push


        |

Git Repository


        |

CI Pipeline


        |

Run Test


        |

Build APK/IPA


        |

Deploy

```

---

# 16. Security Configuration

Tidak boleh menyimpan:

```
API Key

Secret

Token

Password

```

dalam:

```
source code
```

Gunakan:

```
Environment Variable

Secure Storage

CI Secret Manager

```

---

# 17. Testing Preparation

Project harus memiliki:

```
test/


├── unit/

├── widget/

└── integration/

```

Contoh:

```
test/

├── auth_test.dart

├── exam_test.dart

└── sync_test.dart

```

---

# 18. Performance Preparation

Sejak awal implementasi:

Gunakan:

```
Lazy Loading

Pagination

Image Cache

Background Processing

Local Cache

```

Hindari:

```
Large Widget Tree

Blocking Operation

Heavy Processing on UI Thread

```

---

# 19. Future Scalability

Struktur ini siap mendukung:

## Feature Expansion

```
AI Tutor

Live Class

Discussion

Gamification

```

---

## Platform Expansion

```
Android

iOS

Tablet

Desktop

```

---

# 20. Summary

Flutter project YakinLulus.id menggunakan:

```
Flutter

+

Clean Architecture

+

Feature Based Structure

+

Riverpod State Management

+

Dio Networking

+

SQLite Offline Storage

+

Secure Storage

+

CI/CD Ready

```

Tujuan utama setup ini:

* mudah dikembangkan;
* mudah diuji;
* aman;
* siap mendukung CBT offline;
* siap berkembang menjadi platform EdTech skala besar.

