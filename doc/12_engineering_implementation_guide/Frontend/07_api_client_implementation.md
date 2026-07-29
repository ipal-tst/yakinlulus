# 07_api_client_implementation.md

# API Client Implementation

## 1. Tujuan

Dokumen ini menjelaskan standar implementasi API Client pada Frontend YakinLulus.id.

API Client menjadi lapisan komunikasi antara:

```
Frontend Next.js

        ↕

Backend Go REST API
```

Tujuan utama API Client:

- Menyediakan abstraction layer komunikasi HTTP.
- Menghindari penggunaan request langsung pada component.
- Menstandarkan request dan response handling.
- Menangani authentication.
- Menangani error secara konsisten.
- Mendukung retry, timeout, logging, dan monitoring.
- Mempermudah perubahan backend contract di masa depan.

---

# 2. Konsep

Frontend YakinLulus.id menggunakan pendekatan:

```
Component

↓

Feature Hook

↓

Service Layer

↓

API Client

↓

HTTP Transport

↓

Backend API
```

Component tidak boleh langsung melakukan:

```typescript
fetch()
axios.get()
axios.post()
```

Semua komunikasi harus melewati API Client.

---

# API Responsibility

API Client bertanggung jawab terhadap:

- HTTP Request
- Header Management
- Authentication Handling
- Error Normalization
- Timeout
- Retry Policy
- Request Cancellation
- Response Parsing

API Client tidak bertanggung jawab terhadap:

- Business Logic
- UI State
- Navigation
- Domain Decision

---

# 3. Architecture Diagram (ASCII)

```
                    React Component

                           │

                           ▼

                     Feature Hook

                           │

                           ▼

                     Service Layer

                           │

                           ▼

                    API Client Layer

                           │

        ┌──────────────────┼──────────────────┐

        ▼                  ▼                  ▼

    HTTP Client       Interceptor        Error Handler

        │

        ▼

              Backend REST API

        │

        ▼

      Go Application Backend
```

---

# 4. Component Explanation

## 4.1 API Client Layer

API Client adalah wrapper utama komunikasi HTTP.

Contoh:

```
lib/api/

client.ts

request.ts

error.ts

interceptor.ts
```

Tanggung jawab:

- Membuat HTTP request.
- Menambahkan header.
- Parsing response.
- Menangani error.

---

## 4.2 HTTP Transport

Implementasi menggunakan HTTP library.

Pilihan:

```
fetch API

atau

Axios
```

Untuk YakinLulus.id disarankan menggunakan abstraction wrapper agar implementasi transport dapat diganti tanpa mengubah service.

---

Contoh:

```
API Client

        ↓

HTTP Adapter

        ↓

fetch / Axios
```

---

## 4.3 Service Layer

Service berada pada domain feature.

Contoh:

```
features/

exam/

services/

exam.service.ts
```

Service bertanggung jawab terhadap endpoint tertentu.

Contoh:

```
getExam()

submitExam()

saveAnswer()
```

---

## 4.4 DTO Mapping

Response backend tidak langsung digunakan oleh UI.

Flow:

```
Backend DTO

      ↓

API Service

      ↓

Frontend Model

      ↓

Component
```

Tujuan:

- Memisahkan backend contract.
- Mengurangi coupling.
- Mempermudah perubahan API.

---

## 4.5 Error Handler

Semua error API dinormalisasi.

Contoh:

```
Network Error

Unauthorized

Forbidden

Validation Error

Server Error
```

Menjadi format frontend:

```typescript
{
  code,
  message,
  status,
  details
}
```

---

# 5. Implementation Detail

# 5.1 Folder Structure

```
lib/

api/

├── client.ts

├── config.ts

├── error.ts

├── interceptor.ts

├── types.ts

└── index.ts
```

---

Feature service:

```
features/

exam/

services/

exam.service.ts

auth.service.ts

material.service.ts
```

---

# 5.2 API Configuration

Konfigurasi dasar:

```
config/

api.ts
```

Berisi:

- Base URL
- Timeout
- Default Header
- Version API

Contoh konsep:

```typescript
export const API_CONFIG = {
  baseURL:
    process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
};
```

---

# 5.3 Request Wrapper

Semua request menggunakan wrapper.

Contoh konsep:

```typescript
apiClient.get()

apiClient.post()

apiClient.put()

apiClient.delete()
```

Bukan:

```typescript
fetch(url)
```

langsung.

---

# 5.4 Authentication Handling

Authentication menggunakan:

```
HTTP Only Cookie
```

Flow:

```
Browser

   │

   ▼

Request

   │

   ▼

Cookie Automatically Attached

   │

   ▼

Backend Validation
```

Frontend tidak menyimpan token secara manual.

---

# 5.5 Request Interceptor

Interceptor menangani:

- Header tambahan.
- Request ID.
- Logging.
- Monitoring.

Contoh:

```
Before Request

      │

      ▼

Attach Header

      │

      ▼

Send Request
```

---

# 5.6 Response Interceptor

Response diproses:

```
Response

   │

   ▼

Check Status

   │

   ├── Success

   │

   └── Error

          │

          ▼

      Normalize Error
```

---

# 5.7 API Response Standard

Backend menggunakan format response standar.

Contoh:

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data"
  }
}
```

---

# 5.8 Type Definition

Seluruh response memiliki TypeScript type.

Contoh:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}
```

---

# 5.9 Service Example

Exam Service:

```
exam.service.ts
```

Tanggung jawab:

```
getAvailableExam()

getExamDetail()

submitAnswer()

submitExam()
```

Tidak mengatur:

- Loading state
- UI
- Notification

---

# 5.10 TanStack Query Integration

Service digunakan oleh Query Hook.

Flow:

```
Component

      │

      ▼

useExamQuery()

      │

      ▼

Exam Service

      │

      ▼

API Client
```

---

# 6. Flow / Example

## Get Exam Detail Flow

```
Student Open Exam

        │

        ▼

Exam Page

        │

        ▼

useExamQuery()

        │

        ▼

exam.service.ts

        │

        ▼

apiClient.get()

        │

        ▼

Backend API

        │

        ▼

Return Data

        │

        ▼

TanStack Query Cache

        │

        ▼

Render UI
```

---

## Submit Exam Flow

```
Student Click Submit

        │

        ▼

Mutation Hook

        │

        ▼

Exam Service

        │

        ▼

API Client

        │

        ▼

Backend Validation

        │

        ▼

Save Result

        │

        ▼

Invalidate Query

        │

        ▼

Update UI
```

---

## Error Flow

```
Backend Error

        │

        ▼

API Client

        │

        ▼

Normalize Error

        │

        ▼

Mutation Handler

        │

        ▼

Toast Notification
```

---

# 7. Best Practice

## Jangan Request Dari Component

Salah:

```tsx
useEffect(() => {
 fetch("/api/exam")
},[])
```

Benar:

```
Component

↓

Hook

↓

Service

↓

API Client
```

---

## Gunakan Query Key Terstandar

Contoh:

```
exam:list

exam:detail:id

student:profile
```

---

## Pisahkan Service Berdasarkan Domain

Benar:

```
exam.service.ts

material.service.ts

ranking.service.ts
```

Tidak:

```
api.service.ts
```

yang berisi seluruh endpoint.

---

## Error Harus Konsisten

Jangan setiap halaman membuat format error sendiri.

---

## Jangan Expose Backend Detail

Frontend hanya menerima error yang aman ditampilkan.

---

# 8. Security Consideration

## Authentication

Gunakan:

- HTTP Only Cookie
- Secure Cookie
- SameSite Policy

Jangan:

- Local Storage Token
- Hardcoded Token

---

## Request Validation

Frontend melakukan validasi UX.

Backend tetap menjadi sumber validasi utama.

---

## Sensitive Response

Jangan menyimpan:

- Password
- Secret
- Internal Service Data

---

## API Abuse Protection

Frontend dapat membantu:

- Disable double submit
- Debounce search
- Request cancellation

Tetapi rate limiting tetap dilakukan backend.

---

# 9. Performance Consideration

Optimasi:

- Request caching dengan TanStack Query.
- Request deduplication.
- Pagination.
- Infinite Query.
- Abort Controller.
- Compression melalui server.

---

Contoh:

Search Question Bank:

```
User Typing

      │

      ▼

Debounce

      │

      ▼

API Request

      │

      ▼

Cache Result
```

---

# 10. Scalability Consideration

API Client dirancang agar mendukung:

- Penambahan endpoint besar.
- Multiple backend service.
- Versioning API.
- WebSocket integration.
- GraphQL migration jika diperlukan.
- BFF (Backend For Frontend) architecture.

---

Struktur masa depan:

```
lib/api/

rest/

graphql/

websocket/

```

---

# 11. Future Evolution

## API Contract Generation

Dapat dikembangkan menggunakan:

- OpenAPI Generator
- Swagger Codegen

untuk menghasilkan:

- TypeScript Types
- API Client
- DTO Mapping

---

## Real-time Client

Tambahan:

```
lib/websocket
```

untuk:

- Exam Monitoring
- Notification
- Live Ranking

---

## Offline API Layer

Untuk CBT:

```
API Client

       +

Offline Adapter

       +

Sync Queue
```

---

## Observability

Integrasi:

- Frontend Error Tracking
- Performance Monitoring
- Request Analytics

---

# Summary

API Client Frontend YakinLulus.id menjadi lapisan abstraksi komunikasi antara Next.js dan Backend Go. Implementasi menggunakan Service Layer, API Wrapper, Type-safe DTO, Error Normalization, Authentication Handling, dan integrasi TanStack Query. Dengan desain ini, frontend tetap modular, aman, mudah diuji, dan siap menangani kompleksitas platform EdTech skala enterprise.