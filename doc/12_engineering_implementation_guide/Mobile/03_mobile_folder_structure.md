```markdown id="8p5qz"
# 12_engineering_implementation_guide/mobile/03_mobile_folder_structure.md

# Mobile Folder Structure

## 1. Tujuan

Dokumen ini menjelaskan standar struktur folder dan organisasi source code Flutter application YakinLulus.id.

Tujuan utama:

- menjaga codebase tetap scalable;
- memisahkan tanggung jawab setiap layer;
- mendukung pendekatan Clean Architecture;
- memudahkan kolaborasi multiple developer;
- mengurangi coupling antar module;
- mempermudah testing dan maintenance.


Struktur folder harus mendukung pertumbuhan aplikasi dari:

```

MVP Application

```
    ↓
```

School Platform

```
    ↓
```

Multi Tenant EdTech Platform

```

---

# 2. Architecture Approach


Mobile YakinLulus menggunakan kombinasi:


```

Feature Based Architecture

*

Clean Architecture

*

Layer Separation

```


Konsep utama:

Setiap feature memiliki boundary sendiri.


Contoh:


```

features/

```
exam/

    data/

    domain/

    presentation/
```

```


Bukan:


```

models/

controllers/

services/

widgets/

```


Karena struktur berdasarkan tipe file akan sulit berkembang pada aplikasi besar.

---

# 3. High Level Project Structure


Struktur utama:


```

yakinlulus_mobile/

├── android/

├── ios/

├── assets/

├── lib/

├── test/

├── integration_test/

├── pubspec.yaml

└── README.md

```


---

# 4. Lib Directory Structure


Folder utama:


```

lib/

├── main.dart

├── app/

├── core/

├── config/

├── features/

├── shared/

└── generated/

```


---

# 5. App Layer


Folder:


```

app/

```


Responsibility:

- application initialization;
- routing;
- theme;
- global configuration.


Structure:


```

app/

├── app.dart

├── router.dart

├── routes.dart

├── theme/

│   ├── app_theme.dart

│   ├── colors.dart

│   ├── typography.dart

│   └── spacing.dart

└── localization/

```
└── localization.dart
```

```


---

# 6. Core Layer


Folder:


```

core/

```


Berisi komponen fundamental yang digunakan seluruh aplikasi.


Structure:


```

core/

├── constants/

├── error/

├── network/

├── storage/

├── database/

├── security/

├── services/

├── utils/

└── extensions/

```


---

## 6.1 Network


```

core/network/

```


Berisi:


```

api_client.dart

api_interceptor.dart

network_exception.dart

connection_checker.dart

```


Responsibility:

- HTTP communication;
- token injection;
- retry;
- network monitoring.


---

## 6.2 Storage


```

core/storage/

```


Berisi:


```

secure_storage.dart

local_storage.dart

cache_manager.dart

```


Digunakan untuk:

- token;
- preferences;
- cache.


---

## 6.3 Database


```

core/database/

```


Berisi:


```

database.dart

tables/

dao/

migration/

```


Digunakan untuk:

- offline CBT;
- local data;
- sync queue.


---

# 7. Feature Layer


Feature merupakan domain utama aplikasi.


Structure:


```

features/

├── auth/

├── dashboard/

├── learning/

├── question_bank/

├── exam/

├── result/

├── ranking/

└── profile/

```


Setiap feature memiliki struktur:


```

feature_name/

├── data/

├── domain/

└── presentation/

```


---

# 8. Feature Data Layer


Contoh:


```

features/exam/data/

```


Structure:


```

data/

├── datasource/

│
├── models/

├── repositories/

└── mappers/

```


---

## Data Source


Berisi:


```

remote/

local/

```


Contoh:


```

exam_remote_datasource.dart

exam_local_datasource.dart

```


Responsibility:

- komunikasi API;
- akses database lokal.


---

## Models


Contoh:


```

exam_model.dart

question_model.dart

answer_model.dart

```


Berfungsi sebagai:

- API response model;
- database mapping object.


---

## Repository Implementation


Contoh:


```

exam_repository_impl.dart

```


Menghubungkan:


```

Data Source

```
    ↓
```

Repository

```
    ↓
```

Use Case

```


---

# 9. Feature Domain Layer


Domain adalah business logic.


Structure:


```

domain/

├── entities/

├── repositories/

└── usecases/

```


---

## Entities


Contoh:


```

exam.dart

question.dart

student_answer.dart

```


Entity tidak bergantung pada:

- Flutter;
- API;
- database.


---

## Repository Contract


Contoh:


```

exam_repository.dart

```


Berisi interface:


```

abstract class ExamRepository {

startExam();

submitAnswer();

syncExam();

}

```


---

## Use Case


Contoh:


```

start_exam.dart

submit_answer.dart

finish_exam.dart

```


Use case mewakili business action.


---

# 10. Presentation Layer


Structure:


```

presentation/

├── pages/

├── widgets/

├── providers/

├── controllers/

└── states/

```


---

## Pages


Berisi screen utama.


Contoh:


```

exam_page.dart

dashboard_page.dart

login_page.dart

```


---

## Widgets


Reusable component:


```

question_card.dart

timer_widget.dart

progress_bar.dart

```


---

## State Management


Menggunakan:


```

Riverpod

```


Contoh:


```

exam_provider.dart

auth_provider.dart

```


---

# 11. CBT Feature Structure Example


CBT merupakan modul kritikal.


Struktur:


```

features/exam/

├── data/

├── domain/

└── presentation/

```
├── pages/

│
├── widgets/

│
├── providers/

│
└── states/
```

```


Flow:


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
|
```

ExamRepository

```
|
```

API / Local Database

```


---

# 12. Shared Layer


Folder:


```

shared/

```


Berisi komponen yang digunakan lintas feature.


Structure:


```

shared/

├── widgets/

├── components/

├── dialogs/

├── layouts/

└── validators/

```


Contoh:


```

AppButton

AppTextField

LoadingView

ErrorView

```


---

# 13. Asset Management


Structure:


```

assets/

├── images/

├── icons/

├── animations/

├── fonts/

└── sounds/

```


Digunakan untuk:

- UI asset;
- multimedia learning;
- notification sound.


---

# 14. Test Structure


Testing mengikuti feature.


Structure:


```

test/

├── core/

├── features/

│
├── auth/

├── exam/

├── learning/

└── integration/

```


Contoh:


```

test/features/exam/

exam_usecase_test.dart

exam_repository_test.dart

exam_widget_test.dart

```


---

# 15. Naming Convention


## File


Menggunakan:


```

snake_case

```


Contoh:


```

exam_page.dart

question_model.dart

auth_repository.dart

```


---

## Class


Menggunakan:


```

PascalCase

```


Contoh:


```

ExamPage

QuestionModel

AuthRepository

```


---

## Variable


Menggunakan:


```

camelCase

```


Contoh:


```

examSessionId

studentAnswer

```


---

# 16. Dependency Rule


Dependency harus satu arah:


```

Presentation

```
    ↓
```

Domain

```
    ↓
```

Data

```


Tidak boleh:


```

Domain

```
    ↓
```

Flutter Widget

```


atau:


```

Entity

```
    ↓
```

API Client

```


---

# 17. Scalability Consideration


Struktur ini mendukung:


## Penambahan Feature Baru


Contoh:

AI Tutor:


```

features/

└── ai_tutor/

```
├── data/

├── domain/

└── presentation/
```

```


---

## Multiple Developer


Developer dapat bekerja:


```

Developer A

auth/

Developer B

exam/

Developer C

learning/

```


Tanpa banyak conflict.


---

# 18. Future Evolution


Jika aplikasi berkembang:


Saat MVP:


```

Single Flutter Application

```


Future:


```

Modular Flutter Package

```
    ↓
```

Multiple Application

(Student App)

(Teacher App)

(Admin App)

```


---

# Summary


Struktur folder mobile YakinLulus.id menggunakan:


```

Feature Based Architecture

*

Clean Architecture

*

Layer Separation

*

Domain Isolation

*

Testable Structure

```


Tujuan utama:

- maintainable;
- scalable;
- mudah dikembangkan;
- siap mendukung CBT offline;
- siap menjadi platform EdTech multi-role.
```
