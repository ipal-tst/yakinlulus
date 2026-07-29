# 09_route_management.md

# Route Management

## 1. Tujuan

Dokumen ini menjelaskan strategi dan implementasi Route Management pada Frontend YakinLulus.id menggunakan Next.js 16 App Router.

Route Management bertanggung jawab terhadap:

- Struktur navigasi aplikasi.
- Pemisahan area pengguna.
- Protected Route.
- Role Based Route.
- Layout Management.
- Loading State.
- Error Boundary.
- Metadata Management.
- Route Optimization.

Karena YakinLulus.id memiliki beberapa jenis pengguna:

- Student
- Teacher
- Staff
- Admin

maka routing harus dirancang agar:

- Aman.
- Mudah dipahami.
- Mudah dikembangkan.
- Mendukung skala besar.
- Mendukung Multi Role Application.

---

# 2. Konsep

YakinLulus.id menggunakan:

```
Next.js 16 App Router

+

Route Group

+

Nested Layout

+

Middleware Protection

+

Permission Guard
```

---

## Routing Principle

Route bertanggung jawab terhadap:

- URL Structure.
- Page Composition.
- Layout.
- Navigation.

Route tidak bertanggung jawab terhadap:

- Business Logic.
- API Communication.
- Data Processing.

---

## Route Architecture

```
URL

↓

Route Segment

↓

Layout

↓

Page

↓

Feature Component

↓

Service
```

---

# Application Area

Frontend dibagi menjadi beberapa area:

```
Public Area

Authentication Area

Student Area

Teacher Area

Staff Area

Admin Area
```

---

# 3. Architecture Diagram (ASCII)

```
                         Application

                              │

                              ▼

                           app/

                              │

        ┌─────────────────────┼─────────────────────┐

        │                     │                     │

        ▼                     ▼                     ▼

      (public)             (auth)             (dashboard)

        │                     │                     │

        ▼                     ▼                     ▼

    Landing Page          Login              Protected Area

                                                   │

                    ┌──────────────────────────────┼──────────────┐

                    │                              │              │

                    ▼                              ▼              ▼

               Student Area                 Teacher Area     Admin Area

                    │                              │              │

                    ▼                              ▼              ▼

               Feature Pages              Feature Pages   Feature Pages
```

---

# 4. Component Explanation

## 4.1 App Router

Seluruh routing menggunakan folder:

```
app/
```

Contoh:

```
app/

page.tsx

dashboard/

exam/

profile/
```

Folder menjadi URL segment.

---

Contoh:

```
app/exam/page.tsx
```

menghasilkan:

```
/exam
```

---

# 4.2 Route Group

Route Group digunakan untuk mengorganisasi route tanpa memengaruhi URL.

Format:

```
(folder)
```

Contoh:

```
app/

(auth)/

(student)/

(admin)/
```

URL:

```
(auth)/login

↓

/login
```

---

Keuntungan:

- Layout berbeda.
- Struktur lebih rapi.
- Separation berdasarkan area aplikasi.

---

# 4.3 Layout Component

Layout digunakan untuk wrapper halaman.

Contoh:

```
Student Layout

Admin Layout

Authentication Layout
```

---

Struktur:

```
(student)/

layout.tsx

dashboard/

exam/

profile/
```

---

Contoh:

Student Layout:

```
Sidebar

Header

Notification

Content Area
```

---

# 4.4 Middleware

Middleware berjalan sebelum route diproses.

Digunakan untuk:

- Authentication check.
- Redirect.
- Route filtering.

---

Contoh:

```
Request

   │

   ▼

Middleware

   │

   ├── Valid Session

   │

   ▼

Page Render


   └── Invalid

          │

          ▼

        Login
```

---

# 4.5 Permission Guard

Digunakan untuk membatasi akses berdasarkan permission.

Contoh:

```
Admin

Can:

create_question

publish_material

manage_user
```

---

Student:

```
Cannot:

manage_user
```

---

# 4.6 Loading State

Next.js mendukung:

```
loading.tsx
```

Contoh:

```
dashboard/

loading.tsx

page.tsx
```

Digunakan untuk:

- Skeleton.
- Progress indicator.
- Loading UI.

---

# 4.7 Error Boundary

Menggunakan:

```
error.tsx
```

Untuk menangani:

- Runtime Error.
- Component Failure.
- Unexpected Error.

---

# 4.8 Not Found Handling

Menggunakan:

```
not-found.tsx
```

Untuk:

- Invalid URL.
- Resource tidak ditemukan.

---

# 5. Implementation Detail

# 5.1 Struktur Folder Routing

Contoh:

```
app/

├── (public)/
│
│   ├── page.tsx
│   ├── pricing/
│   └── about/
│
├── (auth)/
│
│   ├── login/
│   ├── register/
│   └── forgot-password/
│
├── (student)/
│
│   ├── dashboard/
│   ├── exam/
│   ├── material/
│   ├── ranking/
│   └── profile/
│
├── (teacher)/
│
│   ├── dashboard/
│   ├── question-bank/
│   ├── exam-management/
│   └── material-management/
│
└── (admin)/

    ├── dashboard/

    ├── users/

    ├── roles/

    └── settings/
```

---

# 5.2 Route Naming Convention

Gunakan nama yang jelas.

Benar:

```
/question-bank

/exam-history

/student-profile
```

Hindari:

```
/qb

/exh

/profile2
```

---

# 5.3 Dynamic Route

Untuk resource:

Contoh:

```
exam/[id]
```

URL:

```
/exam/123
```

---

Struktur:

```
exam/

[id]/

page.tsx
```

---

Contoh penggunaan:

```
Exam Detail

Question Detail

Material Detail
```

---

# 5.4 Route Metadata

Setiap halaman harus memiliki metadata.

Contoh:

```
title

description

openGraph
```

Digunakan untuk:

- SEO.
- Browser title.
- Social sharing.

---

# 5.5 Navigation Management

Navigation tidak dibuat hardcode di banyak tempat.

Gunakan:

```
config/routes.ts
```

Contoh:

```
Dashboard

Exam

Material

Ranking

Profile
```

---

# 5.6 Navigation Based on Permission

Flow:

```
User Login

      │

      ▼

Load Permission

      │

      ▼

Filter Route

      │

      ▼

Generate Navigation
```

---

Contoh:

Admin melihat:

```
Dashboard

Users

Settings
```

Student melihat:

```
Dashboard

Exam

Material

Ranking
```

---

# 5.7 Protected Route Implementation

Route protection dilakukan pada beberapa layer.

## Layer 1

Middleware:

```
Prevent unauthorized access
```

---

## Layer 2

Layout Guard:

```
Validate session
```

---

## Layer 3

Backend:

```
Validate permission
```

---

# 5.8 Route Transition

Gunakan:

- Loading UI.
- Skeleton.
- Optimistic Navigation.

Tujuan:

Memberikan UX yang cepat.

---

# 6. Flow / Example

# Student Access Flow

```
Student Open

/dashboard

      │

      ▼

Middleware

      │

      ▼

Check Session

      │

      ▼

Student Layout

      │

      ▼

Dashboard Page

      │

      ▼

Dashboard Feature
```

---

# Admin Access Flow

```
Admin

 │

 ▼

/admin/users

 │

 ▼

Middleware

 │

 ▼

Role Check

 │

 ▼

Permission Check

 │

 ▼

Admin Page
```

---

# Invalid Access Flow

```
Student

      │

      ▼

/admin/users

      │

      ▼

Middleware

      │

      ▼

Forbidden

      │

      ▼

403 Page
```

---

# Exam Route Flow

```
/exam/[id]

        │

        ▼

Load Exam Layout

        │

        ▼

Fetch Exam Data

        │

        ▼

Initialize CBT Runtime

        │

        ▼

Render Exam UI
```

---

# 7. Best Practice

## Gunakan Route Group

Pisahkan area aplikasi:

```
(auth)

(student)

(admin)
```

agar layout tetap bersih.

---

## Jangan Membuat Route Terlalu Dalam

Hindari:

```
/student/dashboard/exam/question/detail/view
```

Gunakan:

```
/exam/[id]
```

---

## Gunakan Central Route Configuration

Semua route penting berada pada:

```
config/routes.ts
```

---

## Jangan Percayakan Security Pada Route

Frontend route protection hanya UX.

Security tetap:

```
Backend Authorization
```

---

## Gunakan Loading dan Error Boundary

Setiap area besar harus memiliki:

```
loading.tsx

error.tsx
```

---

## Konsisten Dengan Domain

Route harus mengikuti bahasa bisnis.

Contoh:

```
/question-bank

/material

/exam
```

bukan nama teknis:

```
/module1

/service2
```

---

# 8. Security Consideration

## Route Protection

Jangan hanya mengandalkan:

```
Hide Menu
```

karena user masih dapat mengakses URL langsung.

---

## Authorization

Setiap request sensitif tetap diverifikasi backend.

Contoh:

```
DELETE /users/123
```

harus dicek backend.

---

## Sensitive Route

Area:

```
/admin

/settings

/payment
```

harus memiliki proteksi tambahan.

---

## Error Information

Jangan menampilkan:

- Stack trace.
- Database error.
- Internal endpoint.

---

# 9. Performance Consideration

Optimasi routing:

- Gunakan Server Component.
- Hindari Client Component pada layout.
- Gunakan dynamic import untuk halaman berat.
- Gunakan route prefetch.
- Gunakan streaming rendering.

---

Contoh:

CBT Page:

```
Initial Load

↓

Load Exam Shell

↓

Load Question Data

↓

Interactive Runtime
```

---

# 10. Scalability Consideration

Route architecture mendukung:

- Penambahan role baru.
- Multi tenant.
- Multi language.
- White label platform.
- Separate admin application.
- Future micro frontend.

---

Contoh evolusi:

```
app/

(student)

(teacher)

(admin)

(super-admin)

(partner)
```

---

# 11. Future Evolution

## Advanced RBAC

Dapat berkembang:

```
Role Based Access Control

↓

Attribute Based Access Control

↓

Policy Based Access Control
```

---

## Route Permission Engine

Permission dapat menjadi konfigurasi:

```
Route

+

Required Permission

+

Required Role
```

---

## Multi Tenant Routing

Contoh:

```
school-a.yakinlulus.id

school-b.yakinlulus.id
```

---

## Separate Application Shell

Jika platform berkembang besar:

```
Student App

Teacher App

Admin App
```

dapat dipisahkan tanpa perubahan besar.

---

# Summary

Route Management YakinLulus.id menggunakan Next.js 16 App Router dengan kombinasi Route Group, Nested Layout, Middleware Protection, dan Permission Guard. Struktur routing dipisahkan berdasarkan domain pengguna seperti Student, Teacher, dan Admin sehingga mudah dikembangkan, aman, dan scalable. Frontend hanya menangani navigasi dan pengalaman pengguna, sedangkan validasi akses tetap menjadi tanggung jawab Backend Authorization.