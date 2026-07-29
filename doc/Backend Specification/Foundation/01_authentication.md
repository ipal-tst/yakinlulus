# 01_authentication.md

# YakinLulus.id Backend Specification — Authentication Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Authentication Module bertanggung jawab terhadap proses identifikasi dan autentikasi seluruh pengguna yang mengakses platform YakinLulus.id.

Module ini **tidak mengelola business permission**, melainkan hanya memastikan bahwa pengguna yang mengakses sistem benar-benar merupakan identitas yang sah.

Authorization (RBAC) berada pada module terpisah namun Authentication menjadi pintu masuk seluruh request API.

Untuk MVP, sistem menggunakan **Supabase Authentication** sebagai Identity Provider (IdP), sedangkan backend Go bertindak sebagai Resource Server yang memverifikasi JWT dan membangun User Context.

---

# 2. Module Responsibility

Authentication Module bertanggung jawab terhadap:

* Login
* Logout
* Session Validation
* JWT Verification
* Refresh Session
* Password Reset
* Email Verification
* User Context Construction
* Device Session Management
* Authentication Audit

Module ini **tidak bertanggung jawab** terhadap:

* CRUD User
* CRUD Role
* Permission Management
* School Management

---

# 3. Architecture Position

```text
Client
    │
    ▼
Supabase Auth
    │
JWT
    │
    ▼
Authentication Middleware
    │
    ▼
User Context
    │
    ▼
RBAC Middleware
    │
    ▼
Business Service
```

---

# 4. Authentication Flow

```text
User
    │
Login
    │
    ▼
Supabase Auth
    │
JWT
    │
    ▼
Backend Middleware
    │
Verify JWT
    │
    ▼
Load User Profile
    │
    ▼
Build User Context
    │
    ▼
Business API
```

---

# 5. Actors

Authentication digunakan oleh:

* Student
* Teacher
* School Staff
* School Admin
* Platform Admin
* Super Admin

---

# 6. Authentication Strategy

MVP menggunakan:

* Email + Password
* JWT Access Token
* Refresh Token (Supabase)
* HTTPS Only

Future:

* Google Login
* Microsoft Login
* Magic Link
* MFA
* SSO

---

# 7. Supported Login Method

| Method          | MVP | Future |
| --------------- | --- | ------ |
| Email           | ✅   | ✅      |
| Password        | ✅   | ✅      |
| Google OAuth    | ❌   | ✅      |
| Microsoft OAuth | ❌   | ✅      |
| Magic Link      | ❌   | ✅      |
| OTP             | ❌   | ✅      |
| MFA             | ❌   | ✅      |

---

# 8. Authentication Lifecycle

```text
Registered

↓

Verified

↓

Active

↓

Suspended

↓

Locked

↓

Disabled
```

Hanya akun dengan status **Active** yang dapat mengakses sistem.

---

# 9. User Context

Setelah JWT tervalidasi, backend membangun User Context.

Contoh:

```text
User ID

Role

School ID

Academic Year

Permissions

Active Status

Request ID
```

User Context diteruskan ke seluruh Business Layer.

---

# 10. Session Model

Session disimpan oleh Supabase.

Backend tidak menyimpan session state.

Backend bersifat:

* Stateless
* Horizontal Scalable

---

# 11. JWT Validation

Backend memverifikasi:

* Signature
* Expiration
* Issuer
* Audience
* Subject
* User Status

JWT yang tidak valid menghasilkan HTTP 401.

---

# 12. Authentication Middleware

Middleware melakukan:

* Parse Token
* Verify JWT
* Load User
* Build Context
* Inject Context

Business Service tidak melakukan parsing JWT secara langsung.

---

# 13. Business Rules

### BR-001

Email harus unik.

---

### BR-002

Email wajib diverifikasi sebelum login (dapat dikonfigurasi sesuai kebutuhan bisnis).

---

### BR-003

Akun yang dinonaktifkan tidak dapat login meskipun JWT masih valid.

---

### BR-004

Setiap request harus membawa Access Token kecuali endpoint publik.

---

### BR-005

Semua komunikasi menggunakan HTTPS.

---

### BR-006

Refresh Token hanya diproses oleh Supabase Auth.

---

# 14. Public Endpoint

Endpoint publik:

```text
POST /api/v1/auth/login

POST /api/v1/auth/register

POST /api/v1/auth/forgot-password

POST /api/v1/auth/reset-password

POST /api/v1/auth/refresh

POST /api/v1/auth/logout
```

Endpoint lain memerlukan autentikasi.

---

# 15. Protected Endpoint

Contoh:

```text
GET /api/v1/profile

GET /api/v1/dashboard

POST /api/v1/question

POST /api/v1/exam
```

Authentication dilakukan sebelum Authorization.

---

# 16. DTO

## Login Request

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

---

## Login Response

```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

Token mengikuti format yang dikembalikan oleh Supabase.

---

# 17. Validation Rules

| Field    | Rule                  |
| -------- | --------------------- |
| Email    | Required, Valid Email |
| Password | Required              |
| Email    | Max 255               |
| Password | Min 10                |

---

# 18. Authentication Service

Service utama:

```text
AuthenticationService

Login()

Logout()

Refresh()

VerifyToken()

BuildContext()

ForgotPassword()

ResetPassword()
```

Service hanya berisi business logic yang menjadi tanggung jawab backend.

---

# 19. Repository

Repository:

```text
UserRepository

SessionRepository (Future)

AuditRepository
```

UserRepository digunakan untuk mengambil profil dan status pengguna dari database aplikasi.

---

# 20. Transaction Flow

Login:

```text
Login Request

↓

Supabase Login

↓

JWT

↓

Verify

↓

Load User

↓

Audit

↓

Response
```

Tidak ada transaksi database yang panjang pada proses login.

---

# 21. Event Publishing

Event yang dipublikasikan:

```text
user.login

user.logout

user.password.reset

user.password.changed

user.login.failed
```

Event digunakan oleh Analytics dan Audit.

---

# 22. Background Job

Background Job:

* Login Analytics
* Session Cleanup (Future)
* Security Notification
* Suspicious Login Detection (Future)

---

# 23. Cache Strategy

Redis digunakan untuk:

* Rate Limiting
* Temporary Authentication Metadata
* Blacklist Token (Future)
* Login Attempt Counter

Profil pengguna tidak disimpan permanen di Redis pada MVP.

---

# 24. Rate Limiting

Login:

```
5 request / minute / IP
```

Forgot Password:

```
3 request / hour / email
```

Reset Password:

```
Configurable
```

---

# 25. Password Policy

Minimal:

* 10 karakter
* Huruf besar
* Huruf kecil
* Angka
* Karakter spesial

Future:

* Password History
* Password Expiration
* Breached Password Check

---

# 26. Security Rules

Authentication wajib menerapkan:

* HTTPS
* JWT Validation
* Rate Limiting
* Audit Logging
* Brute Force Protection
* Secret Management

Tidak ada credential yang disimpan di log.

---

# 27. Device Management (Future)

Setiap login dapat mencatat:

* Device Name
* Browser
* Operating System
* IP Address
* Last Login
* Last Activity

Pengguna dapat melihat dan mengakhiri sesi aktif.

---

# 28. Audit Log

Dicatat:

* Login Success
* Login Failed
* Logout
* Password Reset
* Password Change
* Email Verification

Audit bersifat immutable.

---

# 29. Error Handling

| Code                    | Description                    |
| ----------------------- | ------------------------------ |
| AUTH_INVALID_CREDENTIAL | Email atau password salah      |
| AUTH_EMAIL_NOT_VERIFIED | Email belum diverifikasi       |
| AUTH_ACCOUNT_DISABLED   | Akun dinonaktifkan             |
| AUTH_TOKEN_EXPIRED      | Token kedaluwarsa              |
| AUTH_TOKEN_INVALID      | Token tidak valid              |
| AUTH_RATE_LIMIT         | Terlalu banyak percobaan login |

Semua error mengikuti standar **API Error Response**.

---

# 30. Sequence Diagram

```text
User
 │
 │ Login
 ▼
Supabase Auth
 │
 │ JWT
 ▼
Backend
 │
 │ Verify
 ▼
User Repository
 │
 │ User Profile
 ▼
RBAC
 │
 ▼
Response
```

---

# 31. Integration

Authentication terintegrasi dengan:

* User Management
* RBAC
* Notification
* Analytics
* Audit
* Security
* Logging
* Observability

Authentication menjadi entry point seluruh request yang memerlukan identitas pengguna.

---

# 32. Performance Target

| Metric                    | Target   |
| ------------------------- | -------- |
| Login Response            | < 500 ms |
| JWT Validation            | < 10 ms  |
| Context Loading           | < 50 ms  |
| Authentication Middleware | < 20 ms  |

Target tidak termasuk latensi jaringan eksternal.

---

# 33. Test Scenario

## Unit Test

* JWT valid.
* JWT kedaluwarsa.
* JWT tidak valid.
* Build User Context.
* Password Validation.

## Integration Test

* Login berhasil.
* Login gagal.
* Refresh Token.
* Logout.
* Password Reset.

## Security Test

* Brute Force.
* Invalid JWT.
* Expired JWT.
* Missing Token.
* Replay Token.

---

# 34. Future Enhancement

* Multi Factor Authentication (MFA)
* Google OAuth
* Microsoft OAuth
* Single Sign-On (SSO)
* Device Trust
* Session Management Dashboard
* Risk-Based Authentication
* Adaptive Authentication
* Passkey (WebAuthn/FIDO2)
* Continuous Authentication

---

# 35. Dependencies

Authentication Module bergantung pada:

* Supabase Auth
* User Management Module
* RBAC Module
* Redis
* Logging
* Configuration Management
* Security Architecture

---

# 36. Acceptance Criteria

Authentication Module dinyatakan selesai apabila:

* Pengguna dapat login menggunakan Supabase Auth.
* JWT tervalidasi pada setiap request.
* User Context berhasil dibangun.
* Endpoint publik dan privat dipisahkan dengan benar.
* Audit login tersedia.
* Rate limiting berfungsi.
* Unit, integration, dan security test lulus.
* Seluruh endpoint terdokumentasi dalam OpenAPI.

---

# 37. Summary

Authentication Module merupakan gerbang utama seluruh akses ke backend YakinLulus.id. Dengan memanfaatkan **Supabase Authentication** sebagai Identity Provider dan backend Go sebagai Resource Server, modul ini menyediakan autentikasi yang stateless, aman, dan mudah diskalakan.

Desain ini memungkinkan integrasi yang konsisten dengan RBAC, Analytics, Audit, dan seluruh modul backend lainnya, sekaligus menyediakan jalur evolusi menuju MFA, SSO, dan mekanisme autentikasi tingkat enterprise tanpa perubahan besar pada arsitektur inti.
