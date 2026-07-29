# 03_frontend_folder_structure.md

# Frontend Folder Structure

## 1. Tujuan

Dokumen ini menjelaskan standar struktur direktori Frontend YakinLulus.id.

Tujuan utama struktur ini adalah:

- Memudahkan pengembangan jangka panjang.
- Mendukung Feature-based Development.
- Meminimalkan coupling antar modul.
- Mempermudah onboarding developer baru.
- Mendukung pengembangan paralel oleh banyak developer.
- Menjaga konsistensi implementasi.
- Mempermudah migrasi menuju Micro Frontend apabila diperlukan di masa depan.

Struktur folder bukan sekadar pengelompokan file, tetapi merupakan representasi langsung dari batas (boundary) setiap domain pada sistem.

---

# 2. Konsep

Frontend YakinLulus.id menggunakan kombinasi beberapa pendekatan:

- Feature-based Architecture
- Domain Driven Design (DDD)
- Clean Architecture
- Shared Component Architecture

Prinsip utama:

- Feature adalah unit organisasi terbesar.
- Shared hanya berisi kode yang benar-benar reusable.
- Tidak ada dependency langsung antar feature.
- Setiap feature bersifat mandiri.
- Infrastruktur dipisahkan dari business feature.

Visualisasi sederhana:

```
Application

├── Infrastructure
├── Shared
├── Features
└── App Router
```

---

# 3. Architecture Diagram (ASCII)

```
Frontend

│

├──────────── app (Routing)

│

├──────────── features

│              │

│              ├── auth

│              ├── dashboard

│              ├── exam

│              ├── material

│              ├── question-bank

│              ├── analytics

│              ├── ranking

│              ├── notification

│              └── profile

│

├──────────── components

│              │

│              ├── ui

│              ├── layout

│              ├── common

│              └── feedback

│

├──────────── services

│

├──────────── stores

│

├──────────── hooks

│

├──────────── lib

│

├──────────── config

│

├──────────── providers

│

├──────────── types

│

├──────────── utils

│

└──────────── public
```

---

# 4. Component Explanation

## 4.1 Root Directory

Contoh struktur root:

```
frontend/

app/

features/

components/

providers/

hooks/

stores/

services/

lib/

config/

types/

utils/

styles/

public/

middleware.ts

next.config.ts

package.json

tsconfig.json

eslint.config.js
```

Folder root hanya berisi konfigurasi global dan entry point aplikasi.

---

## 4.2 app/

Folder `app/` merupakan implementasi Next.js App Router.

Contoh:

```
app/

layout.tsx

page.tsx

not-found.tsx

loading.tsx

error.tsx

(global)

(auth)

(student)

(admin)

dashboard/

exam/

profile/

ranking/
```

### Tanggung Jawab

- Route
- Layout
- Metadata
- Loading UI
- Error Boundary
- Route Group
- Nested Layout

### Tidak Boleh Berisi

- Business Logic
- API Call langsung
- State Management
- Domain Service

---

## 4.3 features/

Ini adalah folder terpenting.

Semua business feature berada di sini.

Contoh:

```
features/

auth/

dashboard/

exam/

material/

question-bank/

analytics/

ranking/

notification/

profile/

settings/
```

Setiap folder merepresentasikan satu bounded context frontend.

---

### Contoh Struktur Feature

```
exam/

components/

hooks/

services/

validation/

types/

constants/

utils/

schemas/

index.ts
```

Feature harus bersifat self-contained.

---

## 4.4 components/

Berisi reusable component lintas feature.

Struktur:

```
components/

ui/

layout/

navigation/

common/

feedback/

charts/
```

---

### ui/

Komponen dasar.

Contoh:

```
Button

Card

Input

Badge

Avatar

Dialog

Dropdown

Tooltip

Accordion

Tabs

Select

Table
```

Semua berasal dari shadcn/ui yang telah disesuaikan dengan kebutuhan proyek.

---

### layout/

Komponen layout global.

Contoh:

```
Navbar

Sidebar

Header

Footer

PageContainer

DashboardShell

ContentWrapper
```

---

### common/

Komponen reusable yang mengandung sedikit logika presentasi.

Contoh:

```
SearchBar

Pagination

EmptyState

ConfirmDialog

Breadcrumb

DataFilter

LoadingOverlay
```

---

### feedback/

Komponen umpan balik.

Contoh:

```
Skeleton

Spinner

Toast

Alert

ErrorState

OfflineBanner

SuccessAnimation
```

---

## 4.5 services/

Layer komunikasi dengan backend.

Contoh:

```
services/

api-client.ts

auth.service.ts

exam.service.ts

material.service.ts

ranking.service.ts
```

Aturan:

- Tidak boleh berisi UI.
- Tidak boleh menggunakan React Hook.
- Bertanggung jawab pada komunikasi HTTP dan transformasi request/response dasar.

---

## 4.6 stores/

Seluruh global state menggunakan Zustand.

Contoh:

```
stores/

auth.store.ts

theme.store.ts

sidebar.store.ts

offline.store.ts

notification.store.ts

exam.store.ts
```

State yang berasal dari server tetap dikelola oleh TanStack Query.

---

## 4.7 hooks/

Berisi custom hook reusable.

Contoh:

```
hooks/

useAuth.ts

useDebounce.ts

useCountdown.ts

useBreakpoint.ts

useOffline.ts

usePagination.ts

useInfiniteScroll.ts
```

Hook harus fokus pada satu tanggung jawab.

---

## 4.8 providers/

Seluruh provider global.

```
providers/

QueryProvider.tsx

ThemeProvider.tsx

LocaleProvider.tsx

AuthProvider.tsx

ToastProvider.tsx
```

Seluruh provider diinisialisasi pada `app/layout.tsx`.

---

## 4.9 lib/

Berisi implementasi infrastruktur yang dapat digunakan oleh seluruh aplikasi.

Contoh:

```
lib/

api/

cache/

storage/

logger/

auth/

websocket/

pwa/
```

Layer ini menjadi fondasi bagi service dan feature.

---

## 4.10 config/

Konfigurasi aplikasi.

```
config/

app.ts

api.ts

routes.ts

theme.ts

env.ts

cache.ts

storage.ts
```

Semua konstanta aplikasi ditempatkan di sini.

---

## 4.11 types/

Seluruh tipe global.

```
types/

api.ts

auth.ts

pagination.ts

common.ts

user.ts
```

Type khusus feature tetap berada di dalam folder feature tersebut.

---

## 4.12 utils/

Utility murni tanpa dependency React.

Contoh:

```
utils/

date.ts

number.ts

currency.ts

file.ts

string.ts

validation.ts

download.ts
```

Utility harus bersifat pure function.

---

## 4.13 styles/

```
styles/

globals.css

theme.css

animation.css
```

Jumlah file CSS dijaga seminimal mungkin karena styling utama menggunakan Tailwind CSS.

---

## 4.14 public/

```
public/

images/

icons/

illustrations/

logos/

fonts/

manifest.json

robots.txt

favicon.ico
```

Seluruh aset statis berada di sini.

---

# 5. Implementation Detail

## Struktur Lengkap

```
frontend/

├── app/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── exam/
│   ├── material/
│   ├── question-bank/
│   ├── analytics/
│   ├── notification/
│   ├── profile/
│   └── ranking/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── common/
│   ├── feedback/
│   └── charts/
│
├── services/
│
├── hooks/
│
├── stores/
│
├── providers/
│
├── lib/
│
├── config/
│
├── types/
│
├── utils/
│
├── styles/
│
├── public/
│
├── middleware.ts
│
├── next.config.ts
│
├── package.json
│
└── tsconfig.json
```

---

## Contoh Struktur Feature Exam

```
exam/

components/

ExamHeader.tsx

ExamNavigation.tsx

QuestionCard.tsx

QuestionPalette.tsx

Timer.tsx

ReviewDialog.tsx

hooks/

useExam.ts

useExamTimer.ts

useQuestionNavigation.ts

services/

exam-api.ts

validation/

submit.schema.ts

types/

exam.ts

constants/

exam-status.ts

utils/

calculate-progress.ts

index.ts
```

Feature lain mengikuti pola yang sama agar mudah dipahami dan dipelihara.

---

## Barrel Export

Setiap feature menyediakan `index.ts`.

Contoh:

```
features/

exam/

index.ts
```

Isi:

```ts
export * from "./components";
export * from "./hooks";
export * from "./services";
```

Tujuan:

- Menyederhanakan import.
- Menyembunyikan struktur internal feature.

---

## Route Group

Gunakan Route Group untuk memisahkan area aplikasi.

```
app/

(auth)/

(student)/

(admin)/
```

Contoh:

```
(auth)/login

(student)/dashboard

(admin)/users
```

Route Group membantu penggunaan layout yang berbeda tanpa memengaruhi URL.

---

# 6. Flow / Example

## Membuat Feature Baru

```
Developer

      │

      ▼

Create Feature Folder

      │

      ▼

Create Components

      │

      ▼

Create Hooks

      │

      ▼

Create Services

      │

      ▼

Create Types

      │

      ▼

Export Through index.ts

      │

      ▼

Use Inside App Router
```

---

## Import Flow

```
Page

     │

     ▼

Feature

     │

     ▼

Hook

     │

     ▼

Service

     │

     ▼

API Client
```

Dependency selalu bergerak ke bawah. Layer bawah tidak boleh bergantung pada layer di atasnya.

---

## Shared Component Flow

```
Feature A

        │

        ▼

Shared Component

        ▲

        │

Feature B
```

Komponen shared tidak mengetahui feature yang menggunakannya.

---

# 7. Best Practice

## Feature First

Selalu tempatkan kode berdasarkan domain bisnis, bukan berdasarkan jenis file.

Benar:

```
features/

exam/
```

Kurang disarankan:

```
pages/

hooks/

services/

components/

exam/
```

yang tersebar di banyak lokasi.

---

## Hindari Folder "misc"

Jangan membuat folder seperti:

```
others/

misc/

random/

temp/
```

Jika sebuah file tidak memiliki lokasi yang jelas, evaluasi kembali desain arsitekturnya.

---

## Shared Harus Benar-benar Reusable

Komponen hanya dipindahkan ke `components/` apabila digunakan oleh lebih dari satu feature atau memang bersifat generik.

---

## Feature Tidak Saling Mengakses Internal

Tidak diperbolehkan:

```
features/exam/components/

diakses langsung oleh

features/material
```

Jika diperlukan, gunakan public API (`index.ts`) dari feature tersebut atau pindahkan bagian yang reusable ke `components/` atau `lib/`.

---

## Gunakan Nama Folder yang Konsisten

Gunakan penamaan:

```
question-bank

learning-material

user-profile
```

Hindari singkatan yang tidak jelas.

---

# 8. Security Consideration

- Jangan menyimpan kredensial pada folder feature.
- Pisahkan konfigurasi sensitif ke environment variable.
- Utility yang menangani autentikasi ditempatkan pada `lib/auth`.
- File upload dan download menggunakan service terpisah agar mudah diaudit.
- Jangan menempatkan data sensitif di folder `public/`.

---

# 9. Performance Consideration

Struktur folder yang modular memberikan keuntungan:

- Build lebih mudah dianalisis.
- Dependency graph lebih sederhana.
- Bundle lebih kecil.
- Lazy loading lebih efektif.
- Tree shaking bekerja optimal.
- Parallel development mengurangi konflik merge.

Feature yang tidak digunakan pada route tertentu tidak perlu dimuat ke browser.

---

# 10. Scalability Consideration

Struktur ini mendukung:

- Penambahan feature baru tanpa mengubah struktur lama.
- Pengembangan oleh beberapa squad secara bersamaan.
- Pemisahan domain menjadi package terpisah apabila ukuran aplikasi meningkat.
- Ekstraksi shared component menjadi design system internal.
- Migrasi bertahap menuju Micro Frontend apabila kebutuhan bisnis berkembang.

---

# 11. Future Evolution

Arsitektur folder dapat berevolusi menjadi:

```
packages/

ui/

icons/

shared-types/

shared-utils/
```

untuk mendukung monorepo.

Feature tertentu seperti:

```
exam

analytics

question-bank
```

dapat dipindahkan menjadi package atau aplikasi terpisah tanpa perubahan besar karena batas domain sudah jelas.

Selain itu, design system dapat dibagikan ke aplikasi Flutter melalui dokumentasi token desain dan kontrak komponen yang konsisten.

---

# Summary

Struktur folder Frontend YakinLulus.id mengikuti pendekatan Feature-based Architecture dengan batas domain yang jelas. Folder `app/` bertanggung jawab atas routing, `features/` menjadi pusat implementasi bisnis frontend, `components/` menyediakan UI reusable, `services/` menangani komunikasi dengan backend, sedangkan `lib/`, `providers/`, `stores/`, `hooks/`, `config/`, dan `utils/` menyediakan infrastruktur pendukung. Struktur ini dirancang agar mudah dipelihara, mendukung pengembangan paralel, siap untuk skala enterprise, dan kompatibel dengan evolusi arsitektur di masa depan.