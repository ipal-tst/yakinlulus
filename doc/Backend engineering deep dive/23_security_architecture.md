# 23_security_architecture.md

# YakinLulus.id Security Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur keamanan (**Security Architecture**) backend YakinLulus.id.

Security merupakan aspek fundamental karena platform menyimpan:

* Data siswa
* Data guru
* Data sekolah
* Nilai ujian
* Bank soal
* Materi pembelajaran
* AI Generated Content
* Audit Log

Dokumen ini menjadi acuan implementasi keamanan pada seluruh komponen backend.

---

# 2. Security Objectives

Security Architecture dirancang untuk memenuhi tujuan berikut:

* Confidentiality
* Integrity
* Availability
* Authentication
* Authorization
* Accountability
* Auditability
* Non-Repudiation

---

# 3. Security Principles

Seluruh sistem mengikuti prinsip:

* Zero Trust
* Least Privilege
* Defense in Depth
* Secure by Default
* Fail Secure
* Never Trust Client
* Principle of Separation
* Security by Design

---

# 4. Security Layers

Backend terdiri dari beberapa lapisan keamanan.

```text id="s1"
Client

↓

CDN/WAF

↓

Load Balancer

↓

API Gateway

↓

Authentication

↓

Authorization

↓

Business Layer

↓

Database

↓

Storage

↓

Audit
```

Setiap layer memiliki mekanisme proteksi tersendiri.

---

# 5. Identity Management

Identitas pengguna dikelola menggunakan **Supabase Authentication**.

Provider login MVP:

* Email + Password
* Magic Link (Future)
* Google OAuth (Future)
* Microsoft OAuth (Future)

Future:

* SAML
* OpenID Connect
* LDAP
* Single Sign-On (Enterprise)

---

# 6. Authentication Flow

```text id="s2"
User

↓

Supabase Auth

↓

JWT

↓

Backend

↓

RBAC Validation
```

Backend tidak menyimpan password.

---

# 7. Password Policy

Password minimal:

* 10 karakter
* Huruf besar
* Huruf kecil
* Angka
* Karakter khusus

Password lama tidak dapat digunakan kembali (Future).

---

# 8. JWT Strategy

Access Token:

* Short Lived
* Signed
* Stateless

Refresh Token:

* Disimpan oleh Supabase
* Dapat dicabut
* Rotasi otomatis

Backend selalu memverifikasi signature dan masa berlaku token.

---

# 9. Authorization

Menggunakan kombinasi:

* RBAC
* Resource Ownership
* Business Rules

Contoh:

Student:

* Hanya dapat mengakses datanya sendiri.

Teacher:

* Mengakses kelas yang diajar.

Admin:

* Mengakses seluruh data sesuai hak akses.

---

# 10. Permission Architecture

Permission berbentuk granular.

Contoh:

```text id="s3"
question.read

question.write

question.publish

exam.create

exam.publish

student.read

analytics.view
```

Permission dipetakan ke Role melalui database.

---

# 11. API Security

Seluruh endpoint:

* HTTPS Only
* JWT Required (kecuali public endpoint)
* Request Validation
* Rate Limiting
* Request ID
* Audit Log

Tidak ada endpoint internal yang diekspos tanpa autentikasi.

---

# 12. HTTPS Enforcement

Semua komunikasi:

```text id="s4"
HTTPS

TLS 1.3
```

HTTP dialihkan ke HTTPS.

---

# 13. CORS Policy

Whitelist Origin.

Contoh:

```text id="s5"
app.yakinlulus.id

admin.yakinlulus.id
```

Wildcard (`*`) tidak digunakan pada production.

---

# 14. CSRF Protection

Untuk aplikasi berbasis JWT pada Authorization Header, risiko CSRF lebih rendah.

Namun tetap diterapkan:

* SameSite Cookie (jika menggunakan cookie)
* Origin Validation
* CSRF Token untuk endpoint yang relevan

---

# 15. Input Validation

Seluruh request:

```text id="s6"
Request

↓

DTO Validation

↓

Sanitization

↓

Business Validation
```

Tidak ada request yang langsung diproses.

---

# 16. SQL Injection Protection

Menggunakan:

* Query Builder
* ORM/SQL Builder
* Parameterized Query

Dynamic SQL harus menggunakan whitelist.

---

# 17. XSS Protection

Output:

* HTML Escape
* Markdown Sanitization
* CSP Header (Frontend)

Backend menyimpan data apa adanya dan tidak menghasilkan HTML yang tidak disanitasi.

---

# 18. File Upload Security

Seluruh file diperiksa:

* MIME Type
* Extension
* File Size
* Virus Scan (Future)
* Magic Number Validation

Nama file diubah menjadi UUID.

---

# 19. Storage Security

Supabase Storage:

* Private Bucket
* Signed URL
* Expiring URL

File tidak boleh diakses langsung menggunakan public URL kecuali memang bersifat publik.

---

# 20. Secrets Management

Secrets:

* Supabase Key
* JWT Secret (jika ada)
* SMTP Credential
* AI API Key
* Redis Password

Disimpan melalui:

* Environment Variables
* Secret Manager (Future)

Tidak pernah disimpan di source code.

---

# 21. Environment Isolation

Lingkungan:

* Development
* Testing
* Staging
* Production

Database, storage, dan credential dipisahkan.

---

# 22. Rate Limiting

Rate limit diterapkan berdasarkan:

* User
* IP Address
* Endpoint

Contoh:

| Endpoint      | Limit        |
| ------------- | ------------ |
| Login         | 5/minute     |
| AI Generation | Configurable |
| Import        | Configurable |
| Public API    | Configurable |

Implementasi menggunakan Redis.

---

# 23. Brute Force Protection

Jika login gagal berturut-turut:

```text id="s7"
Failed Login

↓

Temporary Lock

↓

Retry Later
```

Lockout bersifat sementara dan dapat dikonfigurasi.

---

# 24. Session Security

Session memverifikasi:

* JWT
* User Status
* Role
* Token Expiration

Future:

* Device Binding
* Device Fingerprint

---

# 25. CBT Security

Saat ujian:

* Server Time Authority
* Session Lock
* Auto Save
* Resume Validation
* Single Active Session
* Anti-Cheat Event Logging

Timer tidak pernah berasal dari client.

---

# 26. Data Encryption

Encryption In Transit:

* TLS 1.3

Encryption At Rest:

* PostgreSQL Encryption
* Supabase Managed Encryption

Future:

* Field Level Encryption untuk data tertentu.

---

# 27. Personally Identifiable Information (PII)

PII meliputi:

* Nama
* Email
* Nomor Telepon
* Tanggal Lahir

Prinsip:

* Minimization
* Need to Know
* Secure Access
* Audit Access

---

# 28. Audit Trail

Seluruh aktivitas penting dicatat.

Contoh:

* Login
* Logout
* Publish Question
* Delete Question
* Export Data
* Import Data
* Role Change

Audit bersifat immutable.

---

# 29. Security Logging

Log mencatat:

* Request ID
* User ID
* IP
* Endpoint
* Status Code
* Duration

Data sensitif seperti password, token, atau API key tidak pernah dicatat.

---

# 30. Monitoring

Security Metric:

* Login Failure
* Unauthorized Request
* Rate Limit Trigger
* API Error
* Suspicious Activity
* Storage Access

---

# 31. Alerting

Alert otomatis untuk:

* Brute Force
* Banyak 401/403
* Lonjakan login gagal
* AI Abuse
* Storage Abuse
* Export dalam jumlah besar
* Perubahan Role Administrator

---

# 32. Data Access Policy

Semua query mengikuti prinsip:

```text id="s8"
Need To Know
```

Tidak ada endpoint yang mengembalikan seluruh kolom jika tidak diperlukan.

---

# 33. Database Security

Menggunakan:

* PostgreSQL Role
* Least Privilege
* Connection Pool
* SSL Connection
* Backup Encryption

Selain itu:

* Row Level Security (RLS) pada Supabase diterapkan untuk akses langsung melalui Supabase API.
* Untuk akses melalui backend, seluruh authorization tetap divalidasi pada Business Layer.

---

# 34. Redis Security

Redis:

* Password Protected
* Private Network
* TLS (jika tersedia)
* Tidak diekspos ke internet

---

# 35. AI Security

Sebelum mengirim prompt:

* Hapus credential.
* Hapus token.
* Hapus secret.
* Masking data sensitif.
* Kirim data seminimal mungkin.

Output AI divalidasi sebelum digunakan.

---

# 36. Dependency Security

Seluruh dependency:

* Version Lock
* Vulnerability Scan
* Update Berkala
* SBOM (Future)

CI/CD menjalankan pemeriksaan keamanan sebelum deployment.

---

# 37. Backup Security

Backup:

* Encrypted
* Scheduled
* Tested
* Immutable (Future)

Akses backup dibatasi untuk administrator tertentu.

---

# 38. Incident Response

Jika terjadi insiden:

```text id="s9"
Detect

↓

Contain

↓

Investigate

↓

Recover

↓

Postmortem
```

Seluruh insiden memiliki tiket dan dokumentasi.

---

# 39. Disaster Recovery

Target:

| Metric | Target     |
| ------ | ---------- |
| RPO    | ≤ 15 menit |
| RTO    | ≤ 1 jam    |

Strategi mengikuti dokumen **Backup & Recovery Strategy**.

---

# 40. Security Testing

Pengujian meliputi:

* Authentication Test
* Authorization Test
* Penetration Test
* SQL Injection Test
* XSS Test
* CSRF Test
* Upload Security Test
* Load Test
* Rate Limit Test

---

# 41. Compliance

Target kepatuhan:

* OWASP Top 10
* OWASP ASVS (Level yang sesuai)
* CIS Benchmark (Infrastructure)
* Praktik perlindungan data yang berlaku di Indonesia

---

# 42. Anti-Patterns

Tidak diperbolehkan:

* Hardcode credential.
* Menyimpan password plaintext.
* Public Storage untuk data privat.
* JWT tanpa validasi.
* Endpoint tanpa authorization.
* Query tanpa validasi input.
* Logging password, token, atau API key.
* Menggunakan akun database superuser untuk aplikasi.

---

# 43. Security Checklist

Sebelum production:

* HTTPS aktif.
* JWT Validation aktif.
* RBAC aktif.
* Input Validation aktif.
* Audit Log aktif.
* Rate Limiting aktif.
* Secret Management diterapkan.
* Monitoring aktif.
* Backup terenkripsi.
* Security Testing selesai.

---

# 44. Relationship dengan Arsitektur Lain

Security merupakan lapisan lintas modul.

```text id="s10"
Authentication

↓

Authorization

↓

CBT Runtime

↓

Question Bank

↓

Analytics

↓

AI Service

↓

Storage

↓

Audit
```

Setiap modul wajib mengikuti standar keamanan yang didefinisikan pada dokumen ini.

---

# 45. Summary

Security Architecture YakinLulus.id menerapkan pendekatan **Defense in Depth** dengan kombinasi **Supabase Authentication**, **RBAC**, **JWT Validation**, **Redis Rate Limiting**, **Audit Logging**, dan **Zero Trust Architecture**.

Arsitektur ini memberikan:

* Perlindungan menyeluruh terhadap data pengguna dan aset akademik.
* Keamanan berlapis mulai dari jaringan hingga business layer.
* Integrasi yang konsisten dengan seluruh modul backend.
* Fondasi yang siap berkembang menuju kebutuhan enterprise seperti SSO, field-level encryption, dan compliance yang lebih tinggi.
