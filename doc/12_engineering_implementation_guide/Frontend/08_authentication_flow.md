# 08_authentication_flow.md

# Authentication Flow

## 1. Tujuan

Dokumen ini menjelaskan desain dan implementasi Authentication Flow pada Frontend YakinLulus.id.

Authentication merupakan fondasi utama karena platform YakinLulus.id memiliki banyak jenis pengguna dengan hak akses berbeda:

- Student
- Teacher
- Staff
- Admin

Sistem authentication harus mampu menyediakan:

- Secure Login
- Session Management
- Role Based Access Control (RBAC)
- Protected Route
- Permission Handling
- Session Recovery
- Multi Device Support
- Offline Authentication Strategy

Tujuan utama:

- Menjaga keamanan akses pengguna.
- Memberikan pengalaman login yang baik.
- Memisahkan authentication dan authorization.
- Mendukung Web dan Mobile.
- Siap berkembang untuk enterprise scale.

---

# 2. Konsep

Authentication dan Authorization adalah dua hal berbeda.

```
Authentication

"Siapa pengguna ini?"

        ↓

Authorization

"Apa yang boleh dilakukan pengguna ini?"
```

---

## Authentication Architecture

YakinLulus.id menggunakan:

```
JWT Based Authentication

+

HTTP Only Cookie

+

Backend Session Validation
```

Frontend tidak bertanggung jawab menyimpan credential sensitif.

---

## Role Architecture

```
                    User

                     │

        ┌────────────┼────────────┐

        ▼            ▼            ▼

    Student       Teacher       Admin

                     │

                     ▼

                Permission
```

---

## Authentication Responsibility

Frontend:

- Menampilkan login.
- Menyimpan UI authentication state.
- Redirect user.
- Menampilkan menu sesuai role.

Backend:

- Validasi credential.
- Generate token.
- Validasi permission.
- Menentukan akses.

---

# 3. Architecture Diagram (ASCII)

```
                       Browser

                          │

                          ▼

                    Login Page

                          │

                          ▼

                 Auth Form Handler

                          │

                          ▼

                 Auth Service Layer

                          │

                          ▼

                  API Client Layer

                          │

                          ▼

                  Backend Auth API

                          │

        ┌─────────────────┼─────────────────┐

        ▼                 ▼                 ▼

   Credential       JWT Token        User Profile

   Validation       HTTP Cookie      Permission

                          │

                          ▼

                 Auth State Store

                          │

                          ▼

                  Protected Route
```

---

# 4. Component Explanation

## 4.1 Login Component

Login component bertanggung jawab terhadap:

- Input username/email.
- Input password.
- Submit action.
- Error display.
- Loading state.

Tidak bertanggung jawab terhadap:

- Token management.
- Permission.
- Redirect logic kompleks.

---

Contoh:

```
features/auth/

components/

LoginForm.tsx
```

---

# 4.2 Auth Service

Auth Service menghubungkan frontend dengan backend authentication API.

Contoh:

```
features/auth/services/

auth.service.ts
```

Responsibility:

- Login request.
- Logout request.
- Refresh session.
- Get current user.

---

# 4.3 Auth Store

Menggunakan Zustand.

Menyimpan state UI authentication.

Contoh:

```
user

role

isAuthenticated

loading

sessionStatus
```

Tidak menyimpan:

```
password

access token raw
```

---

# 4.4 Auth Provider

Auth Provider melakukan inisialisasi authentication ketika aplikasi dibuka.

Flow:

```
Application Start

        │

        ▼

Check Session

        │

        ▼

Backend Validation

        │

        ▼

Update Auth Store
```

---

# 4.5 Middleware

Next.js Middleware digunakan untuk:

- Route protection.
- Redirect.
- Basic access control.

Contoh:

```
/dashboard

/exam

/admin
```

---

Middleware bukan pengganti authorization backend.

---

# 4.6 Permission Guard

Untuk kontrol UI.

Contoh:

```
<PermissionGuard role="admin">

<CreateQuestionButton/>

</PermissionGuard>
```

Tujuan:

- Menyembunyikan fitur yang tidak relevan.
- Meningkatkan UX.

Backend tetap melakukan validasi akhir.

---

# 5. Implementation Detail

# 5.1 Folder Structure

```
features/

auth/

├── components/

│   ├── LoginForm.tsx

│   └── LogoutButton.tsx

│

├── hooks/

│   ├── useAuth.ts

│   └── usePermission.ts

│

├── services/

│   └── auth.service.ts

│

├── store/

│   └── auth.store.ts

│

├── types/

│   └── auth.ts

│

└── validation/

    └── login.schema.ts
```

---

# 5.2 Login Flow Implementation

Flow:

```
User Input

      │

      ▼

React Hook Form

      │

      ▼

Zod Validation

      │

      ▼

Auth Mutation

      │

      ▼

Auth Service

      │

      ▼

API Client

      │

      ▼

Backend Auth API

      │

      ▼

HTTP Only Cookie

      │

      ▼

Fetch User Profile

      │

      ▼

Update Auth Store
```

---

# 5.3 Session Initialization

Saat aplikasi pertama kali dibuka:

```
Browser Load

       │

       ▼

Auth Provider

       │

       ▼

GET /me

       │

       ▼

Backend Check Cookie

       │

       ▼

Return User

       │

       ▼

Update Store
```

---

# 5.4 Logout Flow

```
User Click Logout

        │

        ▼

Logout Action

        │

        ▼

Backend Logout API

        │

        ▼

Invalidate Session

        │

        ▼

Clear Auth Store

        │

        ▼

Redirect Login
```

---

# 5.5 Protected Route

Contoh:

```
Student Access

/dashboard

        │

        ▼

Middleware

        │

        ▼

Authenticated?

        │

   ┌────┴────┐

   │         │

 Yes        No

   │         │

   ▼         ▼

Page      Login
```

---

# 5.6 Role Based Access Control

Role:

```
ADMIN

STAFF

TEACHER

STUDENT
```

Permission:

Contoh:

```
question.create

question.update

exam.create

exam.monitor

material.publish
```

---

Flow:

```
User

 │

 ▼

Role

 │

 ▼

Permission

 │

 ▼

Feature Access
```

---

# 5.7 Permission Hook

Contoh:

```typescript
const {
 hasPermission
} = usePermission();


hasPermission(
 "exam.create"
);
```

---

# 5.8 Authentication State

State:

```typescript
interface AuthState {

 user: User | null;

 isAuthenticated: boolean;

 role?: Role;

 status:
 "loading"
 | "authenticated"
 | "unauthenticated";

}
```

---

# 6. Flow / Example

## Student Login

```
Student

 │

 ▼

Login Page

 │

 ▼

Submit Credential

 │

 ▼

Backend Validate

 │

 ▼

Session Created

 │

 ▼

Load Student Profile

 │

 ▼

Dashboard
```

---

## Teacher Login

```
Teacher

 │

 ▼

Authentication

 │

 ▼

Role Detection

 │

 ▼

Teacher Permission Loaded

 │

 ▼

Teacher Dashboard
```

---

## Admin Access

```
Admin

 │

 ▼

Login

 │

 ▼

Role = ADMIN

 │

 ▼

Permission Check

 │

 ▼

Admin Panel
```

---

# 7. Best Practice

## Jangan Simpan Token Manual

Hindari:

```javascript
localStorage.setItem(
"token",
token
)
```

Gunakan:

```
HTTP Only Cookie
```

---

## Authentication Tidak Sama Dengan Authorization

Jangan hanya:

```
if(user)
show page
```

Tetapi gunakan:

```
role

permission

backend validation
```

---

## Gunakan Centralized Auth Hook

Gunakan:

```
useAuth()
```

bukan mengakses store langsung dari seluruh component.

---

## Redirect Harus Konsisten

Contoh:

```
Unauthenticated

↓

/login


Student

↓

/student/dashboard


Admin

↓

/admin/dashboard
```

---

## Session Expired Handling

Jika session expired:

```
API Error 401

↓

Clear Session

↓

Redirect Login
```

---

# 8. Security Consideration

## Credential Security

Password:

- Tidak pernah disimpan frontend.
- Tidak pernah di-cache.
- Tidak masuk log.

---

## Cookie Security

Cookie harus menggunakan:

```
HttpOnly

Secure

SameSite
```

---

## Session Protection

Backend harus menangani:

- Token expiration.
- Token rotation.
- Session invalidation.
- Multiple device policy.

---

## Authorization Protection

Frontend hanya membantu UX.

Semua endpoint sensitif tetap diverifikasi backend.

Contoh:

Frontend:

```
Hide Delete Button
```

Backend:

```
Check Permission
Before Delete
```

---

## XSS Protection

Jangan menyimpan session credential pada:

- Local Storage.
- IndexedDB.
- Browser Storage.

---

# 9. Performance Consideration

Optimasi:

- Session check hanya saat diperlukan.
- Cache user profile.
- Hindari fetch user berulang.
- Gunakan TanStack Query untuk user data.

---

Contoh:

```
Application Start

↓

One Session Check

↓

Cache User

↓

Reuse Data
```

---

# 10. Scalability Consideration

Authentication architecture mendukung:

- Banyak user role.
- Multi tenant.
- SSO.
- OAuth Provider.
- Enterprise Identity Provider.
- Mobile Authentication.
- Device Management.

---

Evolusi:

```
Basic Auth

↓

RBAC

↓

ABAC

↓

Enterprise IAM
```

---

# 11. Future Evolution

## OAuth Integration

Dapat ditambahkan:

- Google Login
- Microsoft Login
- School Identity Provider

---

## Single Sign On

Untuk sekolah atau institusi:

```
School Identity

        ↓

YakinLulus.id
```

---

## Multi Tenant Authentication

Mendukung:

```
School A

School B

School C
```

dengan permission berbeda.

---

## Biometric Authentication

Pada mobile:

- Fingerprint.
- Face Recognition.

---

## Zero Trust Security Model

Evolusi menuju:

- Continuous authentication.
- Device verification.
- Risk based access.

---

# Summary

Authentication Flow YakinLulus.id menggunakan kombinasi JWT Authentication, HTTP Only Cookie, Zustand Authentication State, Next.js Middleware, dan Backend Authorization. Frontend bertanggung jawab terhadap pengalaman login, session state, dan route handling, sementara backend tetap menjadi sumber kebenaran untuk validasi keamanan. Arsitektur ini mendukung kebutuhan Student, Teacher, Staff, dan Admin serta siap berkembang menuju SSO, Multi Tenant, dan Enterprise Identity Management.