# 06_state_management.md

# State Management

## 1. Tujuan

Dokumen ini menjelaskan strategi dan implementasi State Management pada Frontend YakinLulus.id.

State Management menjadi komponen penting karena platform YakinLulus.id memiliki banyak jenis state dengan karakteristik berbeda:

- User authentication state
- Application UI state
- Server data state
- CBT runtime state
- Offline synchronization state
- Form state
- Temporary interaction state

Tujuan utama:

- Memilih teknologi state yang tepat berdasarkan kebutuhan.
- Menghindari kompleksitas state yang tidak diperlukan.
- Menjaga data tetap konsisten.
- Mendukung Offline First.
- Mengoptimalkan performa rendering.
- Mempermudah debugging.
- Mendukung pengembangan skala besar.

---

# 2. Konsep

YakinLulus.id tidak menggunakan satu state management untuk semua kebutuhan.

Setiap jenis state memiliki solusi berbeda.

Prinsip utama:

```
Correct State Tool For Correct State Type
```

Pembagian:

```
                 Application State

                        │

        ┌───────────────┼───────────────┐

        ▼               ▼               ▼

 Server State      Client State     Form State

        │               │               │

 TanStack Query     Zustand       React Hook Form

        │

        ▼

 Backend API
```

---

# State Classification

## 1. Server State

Data yang berasal dari backend.

Contoh:

- User profile
- Question bank
- Exam list
- Material
- Ranking
- Analytics

Tool:

```
TanStack Query
```

---

## 2. Client Global State

Data yang dibutuhkan banyak bagian aplikasi.

Contoh:

- Theme
- Sidebar state
- User preference
- Current exam session
- Offline queue

Tool:

```
Zustand
```

---

## 3. Local Component State

State kecil yang hanya digunakan satu component.

Contoh:

- Modal open/close
- Tab aktif
- Input temporary

Tool:

```
React useState
```

---

## 4. Form State

State khusus form.

Contoh:

- Login form
- Profile update
- Question creation

Tool:

```
React Hook Form
+
Zod
```

---

# 3. Architecture Diagram (ASCII)

```
                     React Component

                            │

                            ▼

                  State Decision Layer

                            │

        ┌───────────────────┼───────────────────┐

        │                   │                   │

        ▼                   ▼                   ▼

 Local State          Global State        Server State

 useState             Zustand             TanStack Query

        │                   │                   │

        │                   │                   │

        └───────────────────┴───────────────────┘

                            │

                            ▼

                       API Layer

                            │

                            ▼

                      Go Backend API
```

---

# 4. Component Explanation

## 4.1 TanStack Query

TanStack Query menjadi standar utama untuk server state.

Digunakan untuk:

- Fetching data
- Caching
- Background refresh
- Retry
- Synchronization
- Pagination
- Infinite Query

---

## Contoh Data Server State

```
Student Profile

Exam History

Available Exam

Material List

Ranking Data
```

---

Contoh flow:

```
Component

     │

     ▼

useQuery()

     │

     ▼

Service

     │

     ▼

API Client

     │

     ▼

Backend
```

---

## 4.2 Zustand

Zustand digunakan untuk client global state.

Karakteristik:

- Lightweight
- Minimal boilerplate
- Tidak membutuhkan Provider kompleks
- Mudah digunakan dengan TypeScript

---

Contoh state:

```
Theme

Sidebar

User Preference

Exam Runtime

Offline Queue
```

---

## 4.3 React useState

Digunakan hanya untuk state lokal.

Contoh:

```tsx
const [open, setOpen] = useState(false);
```

Tidak boleh menyimpan:

- User data
- API response
- Application state

---

## 4.4 React Hook Form

Digunakan untuk seluruh form kompleks.

Keuntungan:

- Minimal re-render
- Integrasi Zod
- Validasi terstruktur
- Performance tinggi

---

# 5. Implementation Detail

# 5.1 TanStack Query Setup

Struktur:

```
lib/

query/

query-client.ts

query-key.ts
```

---

## Query Client

Konfigurasi:

- Default stale time
- Retry policy
- Error handling
- Cache behavior

Contoh konsep:

```
QueryClient

|

├── Cache

├── Mutation

├── Retry

└── Invalidation
```

---

# Query Key Convention

Semua query menggunakan standar.

Contoh:

```ts
[
 "exam",
 "detail",
 examId
]
```

atau:

```ts
[
 "student",
 "profile"
]
```

Tujuan:

- Konsistensi
- Mudah invalidate cache
- Mudah debugging

---

# Mutation Pattern

Untuk perubahan data:

Contoh:

```
Submit Answer

Update Profile

Create Question
```

Flow:

```
User Action

      │

      ▼

useMutation()

      │

      ▼

API Request

      │

      ▼

Invalidate Query

      │

      ▼

Refresh Data
```

---

# 5.2 Zustand Store Structure

Struktur:

```
stores/

auth.store.ts

theme.store.ts

exam.store.ts

offline.store.ts
```

---

## Example Auth Store

Data:

```
user

role

permission

session status
```

Tidak menyimpan:

```
password

secret

token raw
```

---

# Example Exam Store

CBT membutuhkan state khusus.

Contoh:

```
currentQuestion

answeredQuestion

flaggedQuestion

remainingTime

syncStatus
```

---

Flow:

```
Exam Page

     │

     ▼

Exam Store

     │

     ▼

Offline Storage

     │

     ▼

Sync Worker
```

---

# 5.3 Offline State Management

Karena YakinLulus.id mendukung Offline First, diperlukan state khusus.

Komponen:

```
Offline Store

+

Local Database

+

Sync Queue
```

---

Contoh:

```
Student Answer

      │

      ▼

Local State

      │

      ▼

SQLite / IndexedDB

      │

      ▼

Sync When Online
```

---

# 5.4 Form State

Contoh:

Question Creation Form:

```
Question

Option A

Option B

Option C

Option D

Answer

Explanation
```

Flow:

```
Input

 │

 ▼

React Hook Form

 │

 ▼

Zod Validation

 │

 ▼

Mutation

 │

 ▼

Backend
```

---

# 5.5 State Naming Convention

Store:

```
useAuthStore

useExamStore

useThemeStore
```

Hook:

```
useExam

useStudentProfile

useRanking
```

Query:

```
useExamQuery

useMaterialQuery
```

Mutation:

```
useSubmitExamMutation
```

---

# 6. Flow / Example

# Authentication Flow

```
Login Page

      │

      ▼

React Hook Form

      │

      ▼

Auth Mutation

      │

      ▼

Backend API

      │

      ▼

Auth Store Update

      │

      ▼

Dashboard
```

---

# Dashboard Data Flow

```
Dashboard

      │

      ▼

TanStack Query

      │

      ▼

Cache Check

      │

      ├── Cached

      │

      └── Fetch API

              │

              ▼

          Render UI
```

---

# CBT Runtime Flow

```
Start Exam

      │

      ▼

Load Questions

      │

      ▼

TanStack Query

      │

      ▼

Exam Store

      │

      ▼

Local Storage

      │

      ▼

Answer Sync

      │

      ▼

Submit Exam
```

---

# 7. Best Practice

## Jangan Gunakan Global State Berlebihan

Tidak semua data harus masuk Zustand.

Contoh salah:

```
All API Response

        ↓

Zustand
```

Yang benar:

```
API Response

        ↓

TanStack Query
```

---

## Server State Selalu Melalui Query

Jangan:

```tsx
useEffect()

fetch()

setState()
```

untuk data server.

Gunakan:

```
useQuery()
```

---

## Pisahkan State Berdasarkan Domain

Benar:

```
exam.store.ts

auth.store.ts
```

Tidak:

```
global.store.ts
```

yang berisi semua hal.

---

## Gunakan Immutable Update

Hindari manipulasi object secara langsung.

---

## Cache Strategy Harus Direncanakan

Data berbeda memiliki kebutuhan berbeda.

Contoh:

```
Profile

Cache lama


Exam Timer

Tidak boleh cache
```

---

# 8. Security Consideration

## Sensitive State

Jangan menyimpan:

- Password
- Secret Key
- Access Token secara terbuka
- Data pribadi sensitif yang tidak diperlukan

---

## State Persistence

Jika menggunakan persistence:

Pastikan:

- Data terenkripsi jika diperlukan.
- Tidak menyimpan data sensitif.
- Memiliki expiration policy.

---

## Authorization

Frontend state hanya untuk UX.

Permission tetap diverifikasi backend.

Contoh:

```
Frontend:

Hide Admin Menu


Backend:

Reject Unauthorized Request
```

---

# 9. Performance Consideration

Optimasi dilakukan dengan:

- Query caching
- Selective subscription Zustand
- Avoid unnecessary re-render
- Memoized selector
- Pagination
- Infinite Query
- Virtualization

---

Contoh:

Jangan subscribe seluruh store:

```ts
useStore()
```

Gunakan selector:

```ts
useStore(
 state => state.user
)
```

---

# 10. Scalability Consideration

Strategi ini mendukung:

- Banyak feature.
- Banyak user role.
- Complex CBT workflow.
- Offline synchronization.
- Real-time update.
- Multi-device state consistency.

---

Ketika aplikasi semakin besar:

```
Zustand

↓

Domain Store

↓

State Package
```

dapat dikembangkan menjadi library internal.

---

# 11. Future Evolution

## State Machine Untuk CBT

CBT yang kompleks dapat menggunakan:

```
XState
```

untuk mengelola:

- Exam lifecycle
- Timer
- Submission
- Recovery

---

## Real-time State

WebSocket dapat digunakan untuk:

- Exam monitoring
- Teacher dashboard
- Live ranking

---

## Event Driven Frontend

Frontend dapat menerima event:

```
Exam Started

Exam Finished

New Notification

Achievement Unlocked
```

---

## Shared State Layer

Jika aplikasi berkembang menjadi multi-frontend:

```
Web

Mobile

Desktop
```

state contract dapat distandarisasi melalui shared package.

---

# Summary

State Management Frontend YakinLulus.id menggunakan pendekatan multi-strategy. TanStack Query digunakan untuk seluruh Server State, Zustand untuk Global Client State, React Hook Form untuk Form State, dan React Local State untuk kebutuhan komponen sederhana. Pendekatan ini menghindari kompleksitas berlebihan, meningkatkan performa, mendukung Offline First, dan menyediakan fondasi yang scalable untuk platform EdTech enterprise.