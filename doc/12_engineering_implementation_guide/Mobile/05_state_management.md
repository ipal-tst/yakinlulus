```markdown id="m7q2ax"
# 12_engineering_implementation_guide/mobile/05_state_management.md

# State Management Implementation

## 1. Tujuan

Dokumen ini menjelaskan strategi implementasi state management pada aplikasi mobile YakinLulus.id menggunakan Flutter.

State management merupakan komponen penting karena aplikasi memiliki banyak state kompleks:

- authentication state;
- learning progress;
- CBT runtime state;
- exam timer;
- offline synchronization;
- download progress;
- notification state.


Tujuan implementasi:

- membuat state predictable;
- memisahkan UI dengan business logic;
- mudah dilakukan testing;
- menghindari state inconsistency;
- mendukung aplikasi berskala besar.


---

# 2. State Management Strategy


YakinLulus menggunakan pendekatan:


```

Reactive State Management

*

Unidirectional Data Flow

*

Immutable State

*

Dependency Injection

```


Architecture:


```

User Action

```
  |
```

Controller / Provider

```
  |
```

Use Case

```
  |
```

Repository

```
  |
```

Data Source

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

# 3. Technology Choice


Rekomendasi:


```

Riverpod

```


Alasan:


## Compile Safety

Riverpod memiliki compile-time safety yang lebih baik dibanding pendekatan tradisional.


---

## Dependency Injection


Riverpod dapat digunakan sebagai:

- state management;
- dependency injection;
- service provider.


---

## Testing Friendly


Provider dapat diisolasi saat testing.


---

## Scalability


Cocok untuk aplikasi dengan:

- banyak feature;
- banyak module;
- kompleks business logic.


---

# 4. State Management Layer Architecture


Struktur:


```

Presentation Layer

```
    |
```

State Provider

```
    |
```

Controller / Notifier

```
    |
```

Use Case

```
    |
```

Repository

```
    |
```

Data Layer

```


---

# 5. State Categories


State dibagi menjadi beberapa kategori.


## 5.1 Application State


State global aplikasi.


Contoh:


```

Authentication

Theme

Language

App Configuration

```


Location:


```

core/state/

```


---

## 5.2 Feature State


State khusus feature.


Contoh:


```

ExamState

LearningState

QuestionState

ProfileState

```


Location:


```

features/{feature}/presentation/providers/

```


---

## 5.3 Local UI State


State sederhana pada halaman.


Contoh:


```

Form Input

Dialog Open

Selected Tab

Expansion Panel

```


Tidak perlu global provider.


---

# 6. State Flow Architecture


Contoh authentication:


```

Login Button

```
|
```

AuthController

```
|
```

LoginUseCase

```
|
```

AuthRepository

```
|
```

API

```
|
```

AuthState Update

```
|
```

Dashboard Screen

```


---

# 7. Provider Architecture


Structure:


```

features/

auth/

presentation/

providers/

├── auth_provider.dart

├── auth_state.dart

└── auth_controller.dart

```


---

# 8. State Object Design


State menggunakan immutable object.


Contoh:


```

AuthState

{

status:

loading / success / error

user:

User?

error:

String?

}

```


Keuntungan:

- predictable;
- mudah debugging;
- mudah testing.


---

# 9. Controller Responsibility


Controller bertanggung jawab:


```

Receive Event

```
    |
```

Execute Use Case

```
    |
```

Transform Result

```
    |
```

Update State

```


Controller tidak boleh:

- query database;
- call API langsung;
- menyimpan business logic.


---

# 10. Example: Login State


Flow:


```

LoginPage

```
  |
```

AuthController.login()

```
  |
```

LoginUseCase

```
  |
```

Repository

```
  |
```

Backend API

```
  |
```

AuthState

```
  |
```

UI Update

```


State:


```

Initial

Loading

Success

Failure

```


---

# 11. CBT State Management


CBT memiliki state paling kompleks.


Komponen:


```

ExamSessionState

├── examId

├── sessionId

├── currentQuestion

├── totalQuestion

├── answers

├── remainingTime

├── syncStatus

└── examStatus

```


---

# 12. CBT Runtime State Flow


```

Start Exam

```
  |
```

Create Exam State

```
  |
```

Load Question Package

```
  |
```

Initialize Timer

```
  |
```

Student Answer

```
  |
```

Update Local State

```
  |
```

Persist Local Storage

```
  |
```

Sync Background

```


---

# 13. Timer State Management


Timer tidak boleh hanya berada pada widget.


Architecture:


```

Timer Engine

```
  |
```

Timer Provider

```
  |
```

Exam State

```
  |
```

Timer Widget

```


Keuntungan:

- timer tetap berjalan;
- survive widget rebuild;
- mudah recovery.


---

# 14. Offline Sync State


Sync membutuhkan state sendiri.


Contoh:


```

SyncState

{

pendingItems: []

syncStatus:

idle

syncing

failed

completed

}

```


Flow:


```

Answer Created

```
  |
```

Sync Queue

```
  |
```

Sync Provider

```
  |
```

Backend

```
  |
```

Update Status

```


---

# 15. Loading State Standard


Semua feature menggunakan pola:


```

AsyncState

├── Initial

├── Loading

├── Success

└── Error

```


Contoh:


```

Material Loading

Exam Loading

Profile Loading

```


---

# 16. Error State Handling


Error tidak langsung dilempar ke UI.


Flow:


```

Exception

```
|
```

Failure Object

```
|
```

State Error

```
|
```

UI Message

```


Contoh:


```

NetworkFailure

"Internet connection unavailable"

```


---

# 17. Cache State Strategy


Data yang sering digunakan:


```

Material List

Question Package

Profile

Exam Metadata

```


menggunakan:


```

Memory Cache

*

Local Cache

```


---

# 18. State Persistence


State tertentu perlu disimpan.


Contoh:


## Persist


```

Authentication Token

Exam Session

Downloaded Material

Sync Queue

```


---

## Tidak Persist


```

Temporary Loading State

UI Animation State

Dialog State

```


---

# 19. State Synchronization


Architecture:


```

Remote State

```
   +
```

Local State

```
   |
```

State Resolver

```
   |
```

Application State

```


Digunakan untuk:


- offline mode;
- conflict resolution;
- data freshness.


---

# 20. Testing Strategy


State management harus mudah diuji.


## Provider Test


Test:

- initial state;
- state transition;
- error handling.


Contoh:


```

Login

Initial

↓

Loading

↓

Success

```


---

## Controller Test


Test:


```

Input

↓

Use Case

↓

Expected State

```


---

# 21. Performance Consideration


Optimasi:


## Selective Rebuild


Widget hanya rebuild ketika state relevan berubah.


---

## Provider Scope


Gunakan scope:


```

Application Scope

Feature Scope

Page Scope

```


---

## Avoid Large State Object


Jangan:


```

GlobalAppState

{

everything

}

```


Lebih baik:


```

AuthState

ExamState

LearningState

```


---

# 22. Security Consideration


State management tidak boleh menyimpan:

- password;
- encryption key;
- sensitive credential.


Gunakan:


```

Secure Storage

```


untuk data sensitif.


---

# 23. Scalability Strategy


Saat aplikasi berkembang:


## MVP


```

Single Flutter Application

Feature Providers

```


---

## Growth Phase


```

Feature Modules

Separate State Domains

```


---

## Enterprise Phase


```

Multiple Applications

Shared Packages

```


---

# 24. Summary


State management YakinLulus.id menggunakan:


```

Riverpod

*

Immutable State

*

Reactive Flow

*

Feature Scoped Provider

*

Repository Driven Architecture

```


Implementasi ini mendukung:

- CBT runtime;
- offline examination;
- learning progress;
- synchronization;
- AI feature;
- multi-platform growth.
```
