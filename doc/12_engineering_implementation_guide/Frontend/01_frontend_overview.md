# 01_frontend_overview.md

# Frontend Overview

## 1. Tujuan

Dokumen ini menjelaskan arsitektur Frontend YakinLulus.id secara menyeluruh sebagai acuan implementasi seluruh developer frontend.

Frontend YakinLulus.id dirancang untuk memenuhi kebutuhan platform EdTech modern yang memiliki karakteristik:

- Multi Platform Experience
- Responsive
- Mobile First
- Offline First
- High Performance
- SEO Friendly
- Accessibility Ready
- Enterprise Scale
- Cloud Ready
- Future Micro Frontend Ready

Frontend bukan hanya sebagai layer presentasi, tetapi menjadi orchestration layer yang bertanggung jawab terhadap:

- User Experience
- State Synchronization
- Offline Capability
- Session Management
- API Communication
- Client-side Validation
- Real-time Update
- Progressive Web App
- Cache Management

Seluruh implementasi mengikuti prinsip:

- Clean Architecture
- Feature-based Architecture
- Separation of Concerns
- Reusable Components
- Predictable State
- Type Safety
- Minimal Re-render
- Scalable Development

---

# 2. Konsep

Frontend dibangun menggunakan teknologi modern yang seluruhnya telah ditetapkan pada Engineering Architecture.

## Core Stack

| Layer | Technology |
|----------|----------------|
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Component | shadcn/ui |
| Data Fetching | TanStack Query |
| Global State | Zustand |
| Form | React Hook Form |
| Validation | Zod |
| Table | TanStack Table |
| Virtualization | TanStack Virtual |
| Chart | Recharts |
| Animation | Framer Motion |
| Internationalization | next-intl |
| PWA | Service Worker |

---

Frontend dibagi menjadi beberapa lapisan utama:

```
Presentation

↓

Feature Layer

↓

State Layer

↓

API Layer

↓

Infrastructure
```

Setiap lapisan memiliki tanggung jawab yang jelas sehingga perubahan pada satu layer tidak memengaruhi layer lainnya.

---

# 3. Architecture Diagram (ASCII)

```
                    Browser

                       │

                Next.js App Router

                       │

        ┌──────────────┼──────────────┐

        │              │              │

     Layout         Middleware      PWA

        │

    Route Segment

        │

    Feature Module

        │

 ┌──────┼────────┐

 │      │        │

UI    Hooks    Services

 │      │        │

 │      │        ▼

 │      │    API Client

 │      │        │

 │      ▼        │

 Zustand Store   │

 │               │

 └───────────────┘

        │

 TanStack Query

        │

 REST API

        │

 Backend (Go)

        │

 PostgreSQL / Redis
```

---

# 4. Component Explanation

## 4.1 Presentation Layer

Berisi seluruh tampilan yang dilihat pengguna.

Contoh:

- Dashboard
- Login
- CBT
- Ranking
- Profile
- Question Bank
- Learning Material
- Analytics

Presentation tidak boleh berisi business logic.

Yang boleh dilakukan:

- Rendering
- Event Handling
- UI State

Yang tidak boleh:

- API Call langsung
- Database Logic
- Business Rule

---

## 4.2 Feature Layer

Feature menjadi unit utama pengembangan.

Contoh:

```
Auth

Dashboard

Exam

Material

Question

Ranking

Notification

Profile
```

Setiap feature memiliki:

- pages
- components
- hooks
- services
- types
- validation
- constants

Dengan demikian dependency antar feature menjadi minimal.

---

## 4.3 State Layer

Frontend menggunakan kombinasi:

### Zustand

Untuk state lokal aplikasi.

Contoh:

- Theme
- Sidebar
- User Session
- Current Exam
- Offline Queue
- Active Filter

---

### TanStack Query

Untuk server state.

Contoh:

- User Profile
- Dashboard
- Ranking
- Question List
- Material
- Exam History

Server State tidak boleh disimpan ke Zustand kecuali memang dibutuhkan sebagai global UI state.

---

## 4.4 API Layer

Semua komunikasi backend dilakukan melalui API Client.

Tidak ada fetch() langsung dari component.

Semua request harus melalui abstraction.

Contoh:

```
Login

↓

Auth Service

↓

API Client

↓

REST API
```

Keuntungan:

- Logging
- Retry
- Token Refresh
- Error Handling
- Caching
- Monitoring

---

## 4.5 Infrastructure Layer

Layer paling bawah.

Berisi:

- HTTP Client
- Storage
- Cookie
- Local Database
- PWA
- Service Worker
- Cache

Layer ini dapat diganti tanpa memengaruhi feature.

---

# 5. Implementation Detail

## Struktur High-Level

```
Frontend

├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── providers/
├── services/
├── stores/
├── types/
├── utils/
├── config/
├── styles/
├── middleware.ts
└── public/
```

Masing-masing folder akan dibahas secara rinci pada dokumen berikutnya.

---

## App Router

Menggunakan Next.js App Router.

```
app/

layout.tsx

page.tsx

dashboard/

exam/

material/

profile/

ranking/
```

Setiap route memiliki layout sendiri apabila diperlukan.

---

## Feature Driven

Contoh:

```
features/

auth/

dashboard/

exam/

material/

analytics/

question/

notification/
```

Setiap feature bersifat modular.

Tidak boleh saling bergantung secara langsung.

---

## Shared Components

Reusable component diletakkan pada:

```
components/ui
```

Contoh:

```
Button

Card

Modal

Dialog

Badge

Input

Table

Pagination
```

Business component tetap berada di dalam feature masing-masing.

---

## Hooks

Custom hooks dipisahkan berdasarkan domain.

Contoh:

```
useExam()

useCountdown()

useOffline()

useTheme()

usePagination()

useAuth()
```

---

## Providers

Provider global:

```
Theme

Auth

Query

Locale

Toast
```

Diletakkan pada root layout.

---

## Configuration

Semua konfigurasi berada pada:

```
config/

api.ts

env.ts

route.ts

theme.ts

cache.ts
```

Tidak boleh terdapat hardcode URL pada component.

---

# 6. Flow / Example

## Login Flow

```
User

↓

Login Page

↓

React Hook Form

↓

Validation (Zod)

↓

Auth Service

↓

API Client

↓

Backend

↓

JWT Cookie

↓

TanStack Query

↓

Redirect Dashboard
```

---

## Dashboard Flow

```
Dashboard

↓

Query Hook

↓

API Client

↓

REST API

↓

Cache

↓

Render Component
```

---

## CBT Flow

```
Exam Page

↓

Load Pool Soal

↓

Offline Cache

↓

Countdown

↓

Auto Save

↓

Sync Background

↓

Submit

↓

Result
```

---

## Offline Flow

```
Network Lost

↓

Local Storage

↓

Offline Queue

↓

Reconnect

↓

Sync

↓

Server
```

---

# 7. Best Practice

## Gunakan TypeScript Strict Mode

Seluruh project menggunakan strict mode.

Hindari penggunaan:

```
any
```

Gunakan:

```
interface

type

enum

union

generic
```

---

## Component Kecil

Idealnya:

```
<300 lines
```

Jika lebih besar, pecah menjadi beberapa component.

---

## Hindari Props Drilling

Gunakan:

- Context
- Zustand
- Custom Hook

---

## Reusable UI

Seluruh UI generik harus reusable.

Contoh:

```
Data Table

Loading

Pagination

Filter

Search Box
```

---

## Lazy Loading

Gunakan dynamic import untuk:

- Chart
- Rich Text
- PDF Viewer
- Heavy Component

---

## Feature Isolation

Feature tidak boleh saling mengakses internal folder feature lain.

Interaksi hanya melalui public interface yang telah ditentukan.

---

# 8. Security Consideration

Frontend bukan tempat validasi utama.

Semua validasi utama tetap dilakukan backend.

Frontend hanya melakukan:

- Input Validation
- UX Validation
- Client-side Sanitization

---

## XSS Prevention

Gunakan:

- React escaping
- Sanitization untuk HTML
- Hindari `dangerouslySetInnerHTML` kecuali benar-benar diperlukan dan telah disanitasi.

---

## Authentication

Token tidak disimpan pada:

- Local Storage
- Session Storage

Menggunakan:

- HTTP Only Cookie

---

## CSRF

Menggunakan:

- SameSite Cookie
- CSRF Protection sesuai implementasi backend

---

## Sensitive Data

Jangan pernah menyimpan:

- Password
- JWT Access Token
- Secret Key
- API Secret

di sisi frontend.

---

# 9. Performance Consideration

Strategi optimasi yang diterapkan:

- Code Splitting
- Route Segment
- Lazy Loading
- Image Optimization
- Prefetch Route
- Virtual Scrolling
- Memoization
- React Compiler (sesuai dukungan React 19)
- Query Caching
- Incremental Rendering

---

Target performa:

- First Contentful Paint < 2 detik
- Time to Interactive < 3 detik
- Lighthouse Performance > 90
- Lighthouse Accessibility > 90
- Lighthouse Best Practice > 90

---

# 10. Scalability Consideration

Frontend dirancang agar mudah berkembang.

Penambahan feature baru cukup membuat:

```
features/

new-feature/
```

tanpa mengubah feature lain.

Arsitektur juga mendukung:

- Modular Development
- Team Parallel Development
- Domain Separation
- Future Micro Frontend Migration
- Multi Tenant Extension
- White Labeling
- Internationalization

---

# 11. Future Evolution

Arsitektur ini dipersiapkan untuk pengembangan jangka panjang.

Rencana evolusi meliputi:

### React Server Components Optimization

Memanfaatkan Server Component untuk mengurangi JavaScript di client tanpa mengubah struktur feature.

---

### Edge Rendering

Halaman publik dapat dipindahkan ke Edge Runtime untuk mempercepat waktu respons global.

---

### AI-powered UI

Integrasi AI Assistant, AI Search, dan AI Learning Recommendation dapat ditambahkan sebagai feature baru tanpa mengubah fondasi arsitektur.

---

### WebSocket Expansion

Saat ini WebSocket digunakan untuk kebutuhan tertentu (misalnya status ujian atau notifikasi). Ke depan dapat diperluas untuk collaborative learning dan monitoring real-time.

---

### Micro Frontend Migration

Apabila ukuran aplikasi meningkat secara signifikan, feature dapat dipisahkan menjadi Micro Frontend karena batas antar-domain sudah jelas.

---

### Multi Platform Design System

Design System yang digunakan akan tetap konsisten dan dapat dibagikan ke aplikasi Flutter sehingga pengalaman pengguna tetap seragam di Web dan Mobile.

---

# Summary

Frontend YakinLulus.id dibangun menggunakan Next.js 16, React 19, dan TypeScript dengan pendekatan Feature-based Clean Architecture. Seluruh komunikasi dilakukan melalui API abstraction, server state dikelola menggunakan TanStack Query, UI state menggunakan Zustand, validasi menggunakan React Hook Form dan Zod, serta seluruh fondasi dirancang untuk mendukung PWA, Offline First, performa tinggi, keamanan, dan skalabilitas enterprise. Struktur ini memastikan pengembangan yang modular, mudah dipelihara, serta siap berevolusi menuju arsitektur yang lebih besar tanpa perubahan fundamental.