# Authentication API

**Document** : `api/06_authentication_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini menjelaskan desain dan implementasi Authentication API pada YakinLulus.id.

Authentication bertanggung jawab untuk:

- Login
- Logout
- Refresh Token
- Access Token
- Session Management
- Device Management
- Password Management
- Email Verification
- Multi Device Login
- RBAC Authentication

Authentication merupakan pintu masuk seluruh layanan YakinLulus.id dan menjadi fondasi keamanan sistem.

---

# 2. Authentication Architecture

```text
                React / Flutter
                       │
                       ▼
               Authentication API
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Credential      JWT Service     Session Service
 Validation           │                │
        │             ▼                ▼
        └────────► PostgreSQL ◄────────┘
                       │
                       ▼
                    Redis Cache
```

---

# 3. Authentication Flow

```text
User Login

↓

Credential Validation

↓

Generate Access Token

↓

Generate Refresh Token

↓

Save Session

↓

Return Token Pair

↓

Authenticated Request
```

---

# 4. Authentication Method

MVP menggunakan:

- Email + Password
- JWT Access Token
- Refresh Token
- Secure Session

Future:

- Google OAuth
- Microsoft OAuth
- Apple Sign In
- SSO (School)
- MFA / 2FA
- Passkey (WebAuthn)

---

# 5. Token Strategy

Menggunakan dua jenis token.

### Access Token

Digunakan untuk seluruh request API.

Karakteristik:

- JWT
- Short-lived
- Stateless

Contoh masa berlaku:

```text
15 menit
```

---

### Refresh Token

Digunakan untuk memperoleh Access Token baru.

Karakteristik:

- Long-lived
- Disimpan sebagai hash
- Dapat dicabut (revoked)

Contoh masa berlaku:

```text
30 hari
```

---

# 6. Login API

Endpoint

```http
POST /api/v1/auth/login
```

Request

```json
{
  "email": "student@example.com",
  "password": "StrongPassword123!"
}
```

Response

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "usr_001",
      "name": "Budi",
      "role": "student"
    }
  }
}
```

---

# 7. JWT Payload

Contoh claim:

```json
{
  "sub": "usr_001",
  "email": "student@example.com",
  "role": "student",
  "sessionId": "ses_001",
  "iat": 1753500000,
  "exp": 1753500900
}
```

Claim hanya memuat informasi minimum yang diperlukan.

---

# 8. Refresh Token API

Endpoint

```http
POST /api/v1/auth/refresh
```

Request

```json
{
  "refreshToken": "..."
}
```

Response

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

Refresh Token lama dirotasi (Refresh Token Rotation).

---

# 9. Logout API

Endpoint

```http
POST /api/v1/auth/logout
```

Header

```http
Authorization: Bearer <access_token>
```

Response

```http
204 No Content
```

Logout:

- mencabut Refresh Token
- mengakhiri Session
- menghapus cache sesi

---

# 10. Get Current User

Endpoint

```http
GET /api/v1/auth/me
```

Response

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "name": "Budi",
    "email": "student@example.com",
    "role": "student"
  }
}
```

---

# 11. Change Password

Endpoint

```http
POST /api/v1/auth/change-password
```

Request

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

Response

```http
200 OK
```

Seluruh sesi lain dapat dipaksa logout melalui konfigurasi keamanan.

---

# 12. Forgot Password

Endpoint

```http
POST /api/v1/auth/forgot-password
```

Request

```json
{
  "email": "student@example.com"
}
```

Response

```http
202 Accepted
```

Jika email tidak ditemukan, sistem tetap mengembalikan response yang sama untuk mencegah email enumeration.

---

# 13. Reset Password

Endpoint

```http
POST /api/v1/auth/reset-password
```

Request

```json
{
  "token": "...",
  "password": "NewPassword456!"
}
```

---

# 14. Verify Email

Endpoint

```http
POST /api/v1/auth/verify-email
```

Request

```json
{
  "token": "..."
}
```

Response

```http
200 OK
```

---

# 15. Session Management

Endpoint

```http
GET /api/v1/auth/sessions
```

Response

```json
{
  "success": true,
  "data": [
    {
      "id": "ses_001",
      "device": "Chrome Windows",
      "ipAddress": "203.0.113.10",
      "lastActivity": "2026-07-26T10:00:00Z",
      "current": true
    }
  ]
}
```

---

# 16. Revoke Session

Endpoint

```http
DELETE /api/v1/auth/sessions/{sessionId}
```

Response

```http
204 No Content
```

Memungkinkan pengguna mengakhiri sesi dari perangkat tertentu.

---

# 17. Authorization Header

Seluruh endpoint privat menggunakan:

```http
Authorization: Bearer <access_token>
```

Middleware akan:

- memvalidasi signature JWT
- memvalidasi expiry
- memvalidasi session
- memuat identitas pengguna

---

# 18. Authentication Middleware

```text
HTTP Request
      │
      ▼
JWT Validation
      │
      ▼
Session Validation
      │
      ▼
RBAC Validation
      │
      ▼
Handler
```

---

# 19. Error Response

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired"
  }
}
```

Kode lain:

- TOKEN_INVALID
- TOKEN_MISSING
- REFRESH_TOKEN_INVALID
- ACCOUNT_DISABLED
- INVALID_CREDENTIALS

---

# 20. Rate Limiting

Endpoint sensitif:

- Login
- Forgot Password
- Reset Password
- Refresh Token

Contoh:

```text
5 login / menit / IP

20 login / jam / akun
```

Jika melebihi batas:

```http
429 Too Many Requests
```

---

# 21. Password Policy

Minimal:

- 12 karakter
- Huruf besar
- Huruf kecil
- Angka
- Karakter khusus

Password disimpan menggunakan Argon2id.

---

# 22. Device Management

Informasi yang disimpan:

- Device ID
- Browser
- Operating System
- IP Address
- Login Time
- Last Activity

Data digunakan untuk audit dan pengelolaan sesi.

---

# 23. Audit Logging

Setiap aktivitas berikut dicatat:

- Login berhasil
- Login gagal
- Logout
- Password diubah
- Password direset
- Email diverifikasi
- Refresh Token digunakan
- Session dicabut

---

# 24. Security Consideration

Authentication API wajib menerapkan:

- HTTPS Only
- Secure Cookie (jika menggunakan cookie)
- JWT Signature Validation
- Refresh Token Rotation
- Password Hashing (Argon2id)
- CSRF Protection (jika menggunakan cookie)
- Brute Force Protection
- Account Lockout (opsional)
- Audit Logging
- Rate Limiting

---

# 25. Scalability Consideration

Desain ini mendukung:

- Horizontal Scaling
- Stateless API
- Redis Session Cache
- Multi Device Login
- Multi Region Deployment
- API Gateway
- Future Microservices

---

# 26. Future Evolution

Authentication siap dikembangkan menuju:

- Multi-Factor Authentication (MFA)
- WebAuthn / Passkey
- OAuth2
- OpenID Connect
- School SSO
- Biometric Login (Mobile)
- Risk-Based Authentication
- Adaptive Authentication

---

# Summary

Authentication API YakinLulus.id menggunakan kombinasi **JWT Access Token**, **Refresh Token Rotation**, dan **Session Management** untuk memberikan autentikasi yang aman, skalabel, dan mudah diintegrasikan oleh aplikasi Web maupun Mobile.

Karakteristik utama:

- JWT stateless dengan masa berlaku singkat.
- Refresh Token yang dapat dicabut dan dirotasi.
- Dukungan multi-device session.
- Password hashing menggunakan Argon2id.
- Audit logging dan rate limiting untuk meningkatkan keamanan.
- Siap dikembangkan menuju MFA, OAuth2, dan SSO tanpa mengubah arsitektur dasar.
