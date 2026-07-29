# 07_authentication_authorization.md

# YakinLulus.id Authentication & Authorization Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur Authentication dan Authorization pada backend YakinLulus.id.

Tujuan utama:

* Menjamin keamanan akses sistem.
* Mendukung Role Based Access Control (RBAC).
* Mendukung multi-device login.
* Mendukung audit keamanan.
* Mendukung skalabilitas hingga jutaan pengguna.
* Menjadi fondasi seluruh mekanisme keamanan backend.

---

# 2. Security Principles

Seluruh mekanisme keamanan mengikuti prinsip berikut:

* Zero Trust
* Least Privilege
* Secure by Default
* Defense in Depth
* Stateless Authentication
* Short-lived Access Token
* Refresh Token Rotation
* Full Audit Trail
* Session Isolation
* Principle of Explicit Permission

---

# 3. Authentication Overview

Authentication bertujuan memverifikasi identitas pengguna.

Backend menggunakan:

* JWT Access Token
* Refresh Token
* Session Management
* Device Management
* Password Hashing
* Secure Cookie (opsional untuk Web)
* HTTPS Only

---

# 4. Authentication Flow

```text id="u7r1g5"
User

↓

Login Request

↓

Identity Service

↓

Credential Validation

↓

Create Session

↓

Generate JWT

↓

Generate Refresh Token

↓

Store Session

↓

Return Token
```

---

# 5. Authentication Components

```text id="6ytnpv"
Identity Module

↓

JWT Service

↓

Session Service

↓

Refresh Token Service

↓

Password Service

↓

Device Service
```

---

# 6. Identity Entities

Identity Module memiliki entity utama berikut:

```text id="dkr8gw"
UserCredential

Session

RefreshToken

LoginHistory

Device

PasswordHistory
```

---

# 7. Login Flow

```text id="h5qvpa"
POST /auth/login

↓

Validate Request

↓

Find Credential

↓

Verify Password

↓

Check User Status

↓

Create Session

↓

Generate JWT

↓

Generate Refresh Token

↓

Save Session

↓

Audit Log

↓

Response
```

---

# 8. JWT Strategy

JWT digunakan sebagai Access Token.

Isi payload minimal:

```json id="hhm40q"
{
  "sub": "user_id",
  "sid": "session_id",
  "role": "student",
  "permissions_version": 1,
  "iat": 1720000000,
  "exp": 1720003600
}
```

JWT tidak menyimpan:

* Password
* Email
* Profile Lengkap
* Permission Detail
* Informasi Sensitif

Permission diperoleh dari backend berdasarkan role dan permission mapping.

---

# 9. Token Lifetime

Access Token

* 15 menit

Refresh Token

* 30 hari

Remember Me (Future)

* 90 hari

Lifetime dikonfigurasi melalui environment/configuration dan dapat disesuaikan berdasarkan kebutuhan keamanan.

---

# 10. Refresh Token Rotation

Setiap refresh token hanya dapat digunakan satu kali.

Flow:

```text id="kzy9lp"
Refresh Token

↓

Validate

↓

Generate New JWT

↓

Generate New Refresh Token

↓

Invalidate Old Refresh Token

↓

Save New Session Token
```

Hal ini mengurangi risiko replay attack.

---

# 11. Session Management

Setiap login menghasilkan satu session.

Entity:

```text id="l4w0ee"
Session

UserID

DeviceID

IPAddress

UserAgent

LastActivity

ExpiredAt

RevokedAt
```

Pengguna dapat memiliki beberapa session aktif pada perangkat yang berbeda.

---

# 12. Multi Device Support

Contoh:

```text id="6xem8z"
Android

Laptop

iPad

Web Browser
```

Setiap device memiliki session sendiri.

Logout dari satu device tidak memengaruhi device lain kecuali pengguna memilih "logout from all devices".

---

# 13. Device Management

Informasi device yang disimpan:

* Device ID
* Device Name
* Platform
* Browser
* OS
* Last Login
* Last Activity
* Trusted Device (Future)

---

# 14. Logout Flow

```text id="tvvqnd"
Logout

↓

Revoke Session

↓

Revoke Refresh Token

↓

Audit Log

↓

Success
```

Access token akan kedaluwarsa secara alami, sedangkan refresh token langsung dinonaktifkan.

---

# 15. Logout All Devices

Flow:

```text id="vc4tbm"
User

↓

Logout All

↓

Find Sessions

↓

Revoke All

↓

Delete Refresh Token

↓

Audit
```

Semua session menjadi tidak valid.

---

# 16. Password Strategy

Password:

* Tidak pernah disimpan dalam plaintext.
* Di-hash menggunakan Argon2id (prioritas) atau bcrypt dengan parameter yang memenuhi standar keamanan.
* Memiliki histori untuk mencegah penggunaan ulang (opsional).

Minimal kebijakan:

* Panjang minimal 8 karakter (dapat ditingkatkan melalui konfigurasi).
* Kombinasi huruf dan angka.
* Mendukung karakter khusus.

---

# 17. Password Change

Flow:

```text id="vijgkv"
Verify Old Password

↓

Validate New Password

↓

Hash

↓

Update Credential

↓

Revoke Other Sessions (Configurable)

↓

Audit
```

---

# 18. Password Reset

Tahapan:

```text id="h0ykko"
Request Reset

↓

Generate Token

↓

Email

↓

Verify Token

↓

Set New Password

↓

Revoke Sessions

↓

Audit
```

Reset token memiliki masa berlaku singkat dan hanya dapat digunakan satu kali.

---

# 19. Account Status

Status akun:

```text id="szngq5"
Active

Inactive

Suspended

Deleted

Pending Verification
```

Login hanya diperbolehkan untuk akun Active.

---

# 20. Authentication Middleware

Middleware melakukan:

* Validasi JWT.
* Verifikasi signature.
* Verifikasi expiry.
* Memuat user context.
* Memuat session.

Middleware tidak melakukan business authorization.

---

# 21. Authorization Overview

Authorization menentukan apakah pengguna boleh melakukan suatu aksi.

Backend menggunakan:

* RBAC (Role Based Access Control)
* Permission Based Access
* Resource Ownership (bila diperlukan)

---

# 22. Roles

Role awal sistem:

```text id="r2qxdv"
Super Admin

Admin

Staff

Teacher

Student
```

Future:

```text id="pjlwmk"
Parent

School Admin

Content Reviewer

AI Reviewer
```

---

# 23. Permission Structure

Permission mengikuti format:

```text id="z2oh4j"
resource:action
```

Contoh:

```text id="j7g7e2"
user:create

user:update

user:delete

question:create

question:approve

exam:create

exam:publish

material:update

analytics:view
```

---

# 24. RBAC Hierarchy

```text id="4sn7d5"
Super Admin

↓

Admin

↓

Staff

↓

Teacher

↓

Student
```

Role tidak otomatis mewarisi semua permission. Mapping role-permission dikelola melalui tabel konfigurasi sehingga dapat diubah tanpa mengubah kode.

---

# 25. Authorization Flow

```text id="n7ef5e"
JWT

↓

Middleware

↓

Controller

↓

Service

↓

Permission Check

↓

Business Rule

↓

Repository
```

---

# 26. Permission Check

Contoh:

Teacher

```text id="x09gux"
Create Exam

↓

Has exam:create ?

↓

Allowed
```

Student

```text id="bsmr2d"
Create Exam

↓

Denied
```

---

# 27. Resource Ownership

Selain RBAC, beberapa aksi memerlukan pemeriksaan kepemilikan resource.

Contoh:

* Murid hanya dapat melihat hasil ujian miliknya.
* Guru hanya dapat mengelola materi yang menjadi tanggung jawabnya (sesuai aturan bisnis).
* Staff hanya dapat mengakses sekolah yang menjadi ruang lingkupnya (future multi-school).

---

# 28. Session Validation

Setiap request memeriksa:

* JWT Valid.
* Session aktif.
* User aktif.
* Token belum dicabut.
* Session belum berakhir.

---

# 29. Failed Login Policy

Backend mencatat:

* Waktu login.
* IP Address.
* Device.
* User Agent.
* Status.

Setelah sejumlah kegagalan login berturut-turut (nilai dikonfigurasi), backend dapat menerapkan penundaan sementara atau penguncian akun sementara.

---

# 30. Audit Logging

Aktivitas berikut wajib dicatat:

* Login
* Logout
* Password Change
* Password Reset
* Session Revoked
* Permission Change
* Role Change
* Failed Login

Audit bersifat immutable.

---

# 31. API Security Headers

Response menggunakan header keamanan seperti:

* Strict-Transport-Security
* X-Content-Type-Options
* X-Frame-Options
* Referrer-Policy
* Content-Security-Policy (untuk web melalui gateway/reverse proxy)

Konfigurasi akhir mengikuti kebutuhan deployment.

---

# 32. CORS Policy

Hanya origin yang diizinkan dapat mengakses API.

Development:

```text id="m0l5h8"
localhost
```

Production:

```text id="bqjlwm"
*.yakinlulus.id
```

Origin lain harus didaftarkan secara eksplisit melalui konfigurasi.

---

# 33. Rate Limiting

Endpoint login:

* Limit lebih ketat dibanding endpoint biasa.

Contoh:

```text id="y3w5af"
POST /auth/login
```

Menggunakan kombinasi:

* IP
* Device
* User

untuk mengurangi brute force.

---

# 34. Token Revocation

Refresh token dapat dicabut ketika:

* Logout.
* Password berubah.
* Akun dinonaktifkan.
* Role berubah (opsional melalui konfigurasi).
* Aktivitas mencurigakan terdeteksi.

---

# 35. Future Security Features

Fitur yang direncanakan:

* Multi Factor Authentication (MFA)
* Passkey/WebAuthn
* Single Sign-On (SSO)
* Google Login
* Apple Login
* Microsoft Login
* Risk Based Authentication
* Device Trust
* Geo Location Detection
* Adaptive Authentication

Arsitektur saat ini disiapkan agar fitur-fitur tersebut dapat ditambahkan tanpa mengubah fondasi autentikasi.

---

# 36. Authentication Database Mapping

Identity Module menggunakan tabel:

```text id="f71vf8"
users

user_credentials

sessions

refresh_tokens

login_history

devices

roles

permissions

role_permissions

user_roles
```

Semua tabel telah mengacu pada desain Entity Catalog dan ERD.

---

# 37. Security Checklist

Setiap implementasi autentikasi wajib memenuhi:

* HTTPS Only.
* JWT Signed.
* Refresh Token Rotation.
* Session Validation.
* Password Hashing.
* Audit Logging.
* Rate Limiting.
* RBAC.
* Permission Check.
* Structured Error Response.

---

# 38. Summary

Arsitektur Authentication & Authorization YakinLulus.id dirancang dengan pendekatan stateless authentication menggunakan JWT, session management untuk kontrol akses, dan RBAC berbasis permission yang fleksibel.

Pendekatan ini memberikan:

* Keamanan yang kuat.
* Dukungan multi-device.
* Audit yang lengkap.
* Skalabilitas tinggi.
* Fleksibilitas penambahan role dan permission.
* Kesiapan untuk fitur keamanan lanjutan seperti MFA, SSO, dan adaptive authentication di masa depan.
