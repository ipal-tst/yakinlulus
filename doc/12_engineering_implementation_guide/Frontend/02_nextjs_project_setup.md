# 02_nextjs_project_setup.md

# Next.js Project Setup

## 1. Tujuan

Dokumen ini menjelaskan standar implementasi project Frontend YakinLulus.id menggunakan **Next.js 16 App Router**.

Tujuan utama setup ini adalah menghasilkan project yang:

- Production Ready
- Scalable
- Type Safe
- Enterprise Grade
- Mudah dipelihara
- Konsisten antar developer
- Mendukung CI/CD
- Mendukung PWA
- Future Ready

Dokumen ini menjadi standar yang wajib diikuti oleh seluruh developer frontend.

---

# 2. Konsep

Frontend YakinLulus.id menggunakan pendekatan **Framework First**.

Artinya seluruh fitur dibangun mengikuti lifecycle dan best practice dari Next.js, bukan membuat arsitektur sendiri yang bertentangan dengan framework.

Beberapa prinsip utama:

- App Router sebagai routing utama
- Server Component sebagai default
- Client Component hanya jika diperlukan
- API menggunakan Backend Go
- Frontend tidak memiliki business logic
- UI dipisahkan dari data fetching
- Feature Based Development
- Environment Configuration
- Build reproducible
- Cloud Ready

---

# 3. Architecture Diagram (ASCII)

```
                  Git Repository
                         │
                         ▼
                Next.js Project Root
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
  App Router         Feature Layer      Shared Library
     │                   │                   │
     └──────────────┬────┴──────────────┬────┘
                    ▼                   ▼
               TanStack Query      Zustand Store
                    │
                    ▼
                 API Client
                    │
                    ▼
                Backend REST API
                    │
                    ▼
      PostgreSQL • Redis • Storage
```

---

# 4. Component Explanation

## 4.1 Next.js App Router

Seluruh halaman menggunakan App Router.

```
app/

layout.tsx

page.tsx

dashboard/

exam/

profile/

ranking/

login/
```

Tidak menggunakan Pages Router.

---

## 4.2 React Server Component

Secara default seluruh page menggunakan Server Component.

Keuntungan:

- JavaScript lebih kecil
- SEO lebih baik
- Rendering lebih cepat
- Initial Load lebih ringan

Gunakan Client Component hanya jika membutuhkan:

- Event handler
- useState
- useEffect
- Browser API
- Animation
- Form interaktif

---

## 4.3 Client Component

Client Component diberi directive:

```tsx
"use client";
```

Gunakan seminimal mungkin.

Contoh:

- Button interaktif
- Dialog
- Modal
- Form
- Countdown CBT
- Drag & Drop

---

## 4.4 Shared Library

Berisi utilitas yang dapat digunakan seluruh project.

Contoh:

```
lib/

api/

auth/

storage/

validation/

logger/

cache/
```

---

## 4.5 Providers

Semua provider global ditempatkan dalam satu layer.

Contoh:

```
providers/

QueryProvider

ThemeProvider

LocaleProvider

AuthProvider

ToastProvider
```

---

# 5. Implementation Detail

## 5.1 Persiapan Lingkungan

Versi minimum yang digunakan:

| Software | Version |
|-----------|----------|
| Node.js | 22 LTS atau lebih baru |
| npm | Latest Stable |
| Next.js | 16 |
| React | 19 |
| TypeScript | 5.x |

Disarankan menggunakan:

```
nvm
```

untuk menjaga konsistensi versi Node.js pada seluruh developer.

---

## 5.2 Membuat Project

Contoh inisialisasi:

```bash
npx create-next-app@latest frontend
```

Pilihan yang digunakan:

```
TypeScript      : Yes

ESLint          : Yes

App Router      : Yes

Tailwind CSS    : Yes

src directory   : No

Turbopack       : Yes

Import Alias    : @/*
```

Struktur root tetap sederhana tanpa menggunakan folder `src/`.

---

## 5.3 Dependency Utama

Library inti yang digunakan:

```
next

react

react-dom

typescript
```

Library tambahan:

```
@tanstack/react-query

zustand

react-hook-form

zod

@hookform/resolvers

framer-motion

next-intl

recharts

@tanstack/react-table

@tanstack/react-virtual

shadcn/ui

tailwindcss

lucide-react
```

Library lain hanya boleh ditambahkan apabila memiliki justifikasi teknis yang jelas.

---

## 5.4 TypeScript Configuration

Gunakan mode strict.

Contoh konfigurasi utama:

```
strict = true

noImplicitAny = true

strictNullChecks = true

noUncheckedIndexedAccess = true

exactOptionalPropertyTypes = true
```

Tujuan:

- Mengurangi bug runtime
- Memperkuat kontrak tipe
- Mempermudah refactoring

---

## 5.5 Import Alias

Gunakan alias:

```
@/
```

Contoh:

```ts
import { Button } from "@/components/ui/button";
```

Hindari import relatif panjang seperti:

```ts
../../../../../components
```

---

## 5.6 Environment Variable

Seluruh konfigurasi berada pada file:

```
.env.local
```

Contoh:

```
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_APP_NAME=

NEXT_PUBLIC_APP_ENV=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Aturan:

- Variable yang diawali `NEXT_PUBLIC_` boleh diakses client.
- Secret backend tidak boleh disimpan di frontend.

---

## 5.7 Konfigurasi ESLint

ESLint wajib dijalankan sebelum commit.

Target:

- Tidak ada warning kritis
- Tidak ada unused import
- Tidak ada unreachable code
- Tidak ada console.log pada production code (kecuali logger yang disetujui)

---

## 5.8 Prettier

Gunakan konfigurasi yang sama pada seluruh developer.

Tujuan:

- Konsistensi style
- Mengurangi konflik merge
- Review code lebih mudah

Format dijalankan otomatis melalui editor atau pre-commit hook.

---

## 5.9 Tailwind CSS

Gunakan Tailwind CSS v4 sebagai satu-satunya utility CSS framework.

Aturan:

- Hindari CSS global yang tidak diperlukan.
- Gunakan utility class terlebih dahulu.
- Gunakan CSS custom hanya jika memang dibutuhkan.

---

## 5.10 shadcn/ui

Seluruh komponen dasar menggunakan shadcn/ui sebagai fondasi.

Komponen yang dikustomisasi tetap berada di dalam project sehingga tidak bergantung pada package eksternal saat melakukan perubahan desain.

---

## 5.11 Public Assets

Folder:

```
public/

images/

icons/

logos/

fonts/
```

Aturan:

- Gunakan format SVG untuk ikon.
- Gunakan WebP atau AVIF untuk gambar jika memungkinkan.
- Hindari gambar berukuran besar tanpa optimasi.

---

## 5.12 Static Configuration

Seluruh konfigurasi aplikasi disimpan pada folder:

```
config/

app.ts

api.ts

theme.ts

routes.ts

cache.ts
```

Jangan melakukan hardcode nilai konfigurasi di dalam component.

---

# 6. Flow / Example

## Project Initialization

```
Developer

      │

      ▼

Clone Repository

      │

      ▼

Install Dependencies

      │

      ▼

Environment Setup

      │

      ▼

Run Development Server

      │

      ▼

Open Browser

      │

      ▼

Start Development
```

---

## Build Flow

```
Source Code

      │

      ▼

Type Checking

      │

      ▼

ESLint

      │

      ▼

Build

      │

      ▼

Optimization

      │

      ▼

Deployment Artifact
```

---

## Runtime Flow

```
Browser

      │

      ▼

Next.js

      │

      ▼

Route Resolution

      │

      ▼

Server Component

      │

      ▼

Client Hydration

      │

      ▼

Interactive UI
```

---

# 7. Best Practice

## Gunakan Server Component Sebagai Default

Client Component hanya digunakan apabila benar-benar membutuhkan interaktivitas browser.

---

## Hindari Business Logic

Business rule berada di Backend.

Frontend hanya:

- Menampilkan data
- Mengirim request
- Melakukan validasi input untuk UX
- Mengelola state UI

---

## Gunakan Folder Berdasarkan Domain

Jangan membuat struktur berdasarkan jenis file semata.

Pisahkan implementasi berdasarkan feature agar mudah dikembangkan oleh banyak tim.

---

## Hindari Hardcode

Semua:

- URL API
- Route
- Konfigurasi cache
- Konstanta aplikasi

harus berada pada folder konfigurasi.

---

## Gunakan Type Safety

Seluruh DTO, response API, dan model frontend wajib memiliki tipe TypeScript yang jelas.

---

## Konsisten Menggunakan Alias

Gunakan:

```
@/
```

untuk seluruh import internal.

---

# 8. Security Consideration

## Environment Variable

Jangan pernah memasukkan:

- JWT Secret
- Database Password
- API Secret
- Service Role Key

ke dalam frontend.

---

## Dependency Management

Seluruh dependency harus:

- Aktif dipelihara
- Memiliki lisensi yang sesuai
- Tidak memiliki kerentanan keamanan yang diketahui

Audit dependency dilakukan secara berkala melalui CI.

---

## Content Security Policy

Aplikasi harus siap menerapkan CSP melalui konfigurasi Next.js dan reverse proxy.

---

## Secure Headers

Konfigurasi deployment harus mendukung header keamanan seperti:

- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

---

# 9. Performance Consideration

Target performa:

- Cold Build seefisien mungkin
- Incremental Build
- Tree Shaking
- Route Code Splitting
- Dynamic Import
- Image Optimization
- Font Optimization
- Automatic Bundle Optimization

Seluruh halaman harus menghindari pemuatan JavaScript yang tidak diperlukan.

---

# 10. Scalability Consideration

Project disiapkan untuk mendukung:

- Penambahan feature tanpa mengubah struktur inti
- Pengembangan paralel oleh banyak developer
- Integrasi library baru secara terkontrol
- Multi-environment (Development, Staging, Production)
- White-label deployment
- Internationalization
- Future Micro Frontend

---

# 11. Future Evolution

Arsitektur project memungkinkan evolusi berikut tanpa perubahan besar:

- Integrasi React Compiler yang lebih luas.
- Pemanfaatan Partial Prerendering pada halaman publik.
- Edge Runtime untuk endpoint tertentu.
- Shared UI Package antara Web dan Flutter.
- Internal Component Library untuk seluruh ekosistem YakinLulus.id.
- Integrasi observability frontend (error tracking, performance monitoring, dan session replay) tanpa mengubah struktur aplikasi.

---

# Summary

Project Frontend YakinLulus.id dibangun menggunakan Next.js 16 App Router dengan React 19 dan TypeScript dalam mode strict. Struktur project berorientasi feature, menggunakan Server Component sebagai default, Client Component secara selektif, konfigurasi terpusat, dependency yang terstandarisasi, serta praktik engineering yang mendukung keamanan, performa, skalabilitas, dan maintainability. Setup ini menjadi fondasi implementasi seluruh modul frontend pada tahapan berikutnya.