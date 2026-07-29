Selanjutnya adalah **26_security.md**. Ini merupakan salah satu dokumen inti karena Question Bank adalah **aset intelektual utama** YakinLulus.id. Fokusnya bukan hanya keamanan aplikasi, tetapi juga perlindungan terhadap pencurian soal, kebocoran konten, manipulasi data, dan penyalahgunaan AI.

Saya menyarankan menerapkan **Defense in Depth** sejak awal sehingga keamanan tidak bergantung pada satu lapisan saja.

---

````markdown
# 26_security.md

# Question Bank Security Specification

Version : 1.0

---

# 1. Overview

Dokumen ini mendefinisikan strategi keamanan
modul Question Bank.

Tujuan.

- Melindungi aset soal
- Menjaga integritas data
- Mengamankan API
- Mengendalikan akses
- Mendukung audit
- Memenuhi prinsip least privilege

---

# 2. Security Principles

Seluruh sistem mengikuti prinsip.

- Zero Trust
- Defense in Depth
- Least Privilege
- Secure by Default
- Fail Secure
- Principle of Separation

---

# 3. Security Layers

```
Client

↓

Authentication

↓

Authorization

↓

Rate Limiter

↓

API Validation

↓

Application Service

↓

Database

↓

Object Storage
```

---

# 4. Authentication

Menggunakan.

JWT Access Token

Refresh Token

Session Rotation

MFA (Future)

---

# 5. Authorization

RBAC.

Role.

Super Admin

Admin

Staff

Teacher

Reviewer

Student

Permission berbasis resource.

---

# 6. Permission Matrix

Contoh.

| Action | Student | Teacher | Reviewer | Admin |
|----------|----------|----------|------------|---------|
| Read Published | ✓ | ✓ | ✓ | ✓ |
| Create Draft | - | ✓ | ✓ | ✓ |
| Publish | - | - | - | ✓ |
| Review | - | - | ✓ | ✓ |
| Delete | - | - | - | ✓ |

---

# 7. Object Level Security

Seluruh object memiliki ownership.

Question

Attachment

Review

Import

Export

Object dicek sebelum diakses.

---

# 8. API Security

Semua API.

HTTPS

JWT

Request Validation

Rate Limit

Audit

CSRF Protection (Web)

---

# 9. Input Validation

Seluruh input divalidasi.

- Length
- Type
- Enum
- Range
- MIME
- UUID
- JSON Schema

---

# 10. SQL Injection

Semua query menggunakan.

Parameterized Query

Prepared Statement

Tidak boleh menggunakan string concatenation.

---

# 11. XSS Protection

Output dilakukan.

- HTML Escape
- Markdown Sanitization
- SVG Validation

---

# 12. File Upload Security

Validasi.

- MIME
- Extension
- File Size
- Checksum
- Malware Scan (Future)

---

# 13. Object Storage Security

File.

Private

Default.

Download menggunakan Signed URL.

---

# 14. Secret Management

Secret tidak disimpan
di source code.

Menggunakan.

Environment Variable

Secret Manager (Future)

---

# 15. Encryption

In Transit.

TLS 1.3

At Rest.

Encrypted Storage

Backup Encryption

---

# 16. Password Policy

Minimal.

12 karakter

Hash.

Argon2id

Tidak pernah disimpan plaintext.

---

# 17. Session Security

Session memiliki.

Expiration

Rotation

Revocation

Concurrent Session Control (Future)

---

# 18. Rate Limiting

Default.

Search

100 request/menit

AI

20 request/menit

Import

10 request/jam

Login

5 request/menit

---

# 19. AI Security

Prompt tidak disimpan
di log.

Response AI divalidasi.

Prompt Injection dideteksi.

---

# 20. Duplicate Request

Endpoint penting.

Publish

Import

Export

AI

Menggunakan.

Idempotency Key

---

# 21. Logging

Disimpan.

User

IP

Request ID

Action

Duration

Status

Tanpa menyimpan token.

---

# 22. Audit Trail

Diaudit.

Create

Update

Publish

Review

Archive

Restore

Delete

Export

Import

---

# 23. Security Headers

HTTP Header.

Content-Security-Policy

X-Frame-Options

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

Strict-Transport-Security

---

# 24. Database Security

Menggunakan.

Role Based Access

TLS

Least Privilege

Read Only Account

Migration Account

---

# 25. Background Worker Security

Worker menggunakan.

Service Account

Permission terbatas.

---

# 26. Event Security

Event tidak boleh membawa.

Password

Token

Secret

Prompt Rahasia

PII

---

# 27. Backup Security

Backup.

Encrypted

Checksum

Access Restricted

Retention Policy

---

# 28. Monitoring

Dipantau.

Failed Login

Permission Denied

API Abuse

Rate Limit

Export Abuse

Import Abuse

AI Abuse

---

# 29. Incident Response

Jika terdeteksi.

↓

Alert

↓

Block

↓

Audit

↓

Investigation

↓

Recovery

---

# 30. Performance Impact

Security tidak boleh
menambah latency signifikan.

Target.

Authentication

< 20 ms

Authorization

< 5 ms

Permission Check

< 5 ms

---

# 31. Future Roadmap

- MFA
- WebAuthn
- Hardware Security Key
- Secret Manager
- DLP
- WAF
- SIEM Integration
- Security Score
````

---

# Rekomendasi Arsitektur Keamanan

Saya menyarankan keamanan dibagi menjadi beberapa lapisan agar setiap komponen memiliki tanggung jawab yang jelas.

```text
                Internet
                    │
                    ▼
            Reverse Proxy (TLS)
                    │
                    ▼
            Authentication
                    │
                    ▼
          Authorization (RBAC)
                    │
                    ▼
           Rate Limiter / WAF
                    │
                    ▼
         Request Validation Layer
                    │
                    ▼
          Application Service
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   PostgreSQL             Object Storage
        │                       │
        └───────────┬───────────┘
                    ▼
               Audit Log
```

---

# Penyempurnaan Khusus untuk YakinLulus.id

## 1. Perlindungan Bank Soal

Question Bank merupakan aset bisnis utama. Terapkan kebijakan berikut:

* hanya soal berstatus **Published** yang dapat digunakan oleh CBT;
* Draft dan Review tidak dapat diakses oleh Student;
* setiap akses terhadap soal dicatat di audit log.

---

## 2. Proteksi Ekspor Soal

Ekspor soal adalah aktivitas berisiko tinggi.

Kebijakan yang disarankan:

* hanya Admin/Super Admin yang dapat melakukan ekspor penuh;
* file hasil ekspor menggunakan Signed URL dengan masa berlaku terbatas;
* seluruh aktivitas ekspor dicatat beserta jumlah soal, filter, waktu, dan pengguna.

---

## 3. Keamanan AI

Semua prompt dan respons AI harus diperlakukan sebagai data tidak tepercaya.

* validasi output sebelum disimpan;
* batasi ukuran prompt dan respons;
* lakukan sanitasi terhadap HTML/Markdown yang dihasilkan AI;
* cegah prompt injection dengan membatasi konteks yang dikirim ke model.

---

## 4. Row-Level Authorization

Selain RBAC, gunakan pemeriksaan pada tingkat objek (resource-level authorization).

Contohnya:

* Reviewer hanya dapat melihat review yang ditugaskan kepadanya.
* Teacher hanya dapat mengubah draft yang menjadi tanggung jawabnya (sesuai aturan organisasi).
* Student hanya dapat mengakses soal melalui CBT atau latihan yang sah, bukan melalui API Question Bank secara langsung.

---

## 5. Prinsip Least Privilege

Buat akun database dan service account terpisah sesuai fungsi:

* API Service
* Background Worker
* Migration
* Read Replica
* Analytics

Masing-masing hanya diberi hak akses minimum yang dibutuhkan. Pendekatan ini mengurangi dampak apabila salah satu kredensial berhasil dikompromikan dan mempermudah audit keamanan.
