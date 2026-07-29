# 05_user_management_ldm.md

# Logical Data Model
## Domain : User Management

Version : 1.0

---

# Tujuan

User Management merupakan domain yang mengelola seluruh identitas pengguna, autentikasi, otorisasi, profil, serta hubungan pengguna dengan organisasi pada platform YakinLulus.

Domain ini menjadi **Identity Domain** bagi seluruh sistem.

Domain ini **tidak menyimpan aktivitas belajar, nilai ujian, maupun progress belajar**. Seluruh aktivitas tersebut berada pada domain masing-masing.

---

# Aggregate Root

```
User
```

---

# Entity Hierarchy

```
User
│
├── User Profile
├── User Credential
├── User Authentication
├── User Session
├── User Role
├── User Permission
├── User Organization
├── User Enrollment
├── User Device
├── User Preference
├── User Notification Preference
├── User Security
├── User Verification
├── User History
└── User Audit
```

---

# Logical Entity List

| Entity | Purpose |
|---------|----------|
| User | Identitas utama pengguna |
| User Profile | Profil pengguna |
| User Credential | Login credential |
| User Authentication | Riwayat autentikasi |
| User Session | Session aktif |
| User Role | Role pengguna |
| User Permission | Hak akses |
| User Organization | Relasi organisasi |
| User Enrollment | Hubungan akademik |
| User Device | Perangkat pengguna |
| User Preference | Preferensi aplikasi |
| User Notification Preference | Preferensi notifikasi |
| User Security | Keamanan akun |
| User Verification | Verifikasi identitas |
| User History | Riwayat perubahan |
| User Audit | Audit aktivitas |

---

# Aggregate Root

## User

### Business Purpose

Identitas utama pengguna.

### Candidate Attribute

```
ID

User Code

Username

Email

Phone Number

Status

Registration Method

Account Type

Created At

Updated At
```

---

Registration Method

```
Email

Google

Apple

Microsoft

Organization

Import
```

---

Account Type

```
Student

Teacher

Parent

Staff

Admin

Super Admin
```

---

Business Rule

- Email harus unik.
- Username harus unik.
- User tidak menyimpan password secara langsung.
- User dapat menjadi anggota lebih dari satu Organization.

---

# User Profile

### Business Purpose

Data profil pengguna.

### Candidate Attribute

```
ID

User ID

Full Name

Nick Name

Birth Date

Gender

Photo Media ID

Biography

Address

City

Province

Country

Postal Code
```

---

Business Rule

Photo menggunakan Media Domain.

---

# User Credential

### Business Purpose

Credential login.

### Candidate Attribute

```
ID

User ID

Password Hash

Password Version

Last Password Change

Force Change Password

Password Expired At
```

---

Business Rule

Password tidak pernah disimpan dalam bentuk plaintext.

---

# User Authentication

### Business Purpose

Riwayat login.

### Candidate Attribute

```
ID

User ID

Login Time

Logout Time

Authentication Method

Success

Failure Reason

IPAddress

Device

Browser
```

---

Authentication Method

```
Password

Google

Apple

OTP

Magic Link

SSO
```

---

# User Session

### Business Purpose

Session aktif.

### Candidate Attribute

```
ID

User ID

Session Token

Refresh Token

Issued At

Expired At

Last Activity

Status
```

---

# User Role

### Business Purpose

Role pengguna.

### Candidate Attribute

```
ID

User ID

Role ID

Organization ID

Assigned By

Assigned At
```

---

Business Rule

Satu user dapat memiliki beberapa role.

Contoh

```
Teacher

+

Content Reviewer
```

---

# User Permission

### Business Purpose

Hak akses khusus.

### Candidate Attribute

```
ID

User ID

Permission ID

Granted By

Granted At

Expired At
```

---

Business Rule

Permission hanya digunakan untuk override Role.

---

# User Organization

### Business Purpose

Hubungan pengguna dengan sekolah/lembaga.

### Candidate Attribute

```
ID

User ID

Organization ID

Membership Type

Status

Joined At
```

---

Membership Type

```
Student

Teacher

Operator

Principal

Staff
```

---

# User Enrollment

### Business Purpose

Hubungan akademik pengguna.

### Candidate Attribute

```
ID

User ID

Education Level ID

Grade ID

Curriculum ID

Academic Year

Status
```

---

Business Rule

Enrollment dapat berubah setiap tahun ajaran.

Riwayat harus tetap disimpan.

---

# User Device

### Business Purpose

Perangkat yang pernah digunakan.

### Candidate Attribute

```
ID

User ID

Device ID

Device Name

Platform

OS

Browser

Registered At

Last Used
```

---

# User Preference

### Business Purpose

Preferensi aplikasi.

### Candidate Attribute

```
ID

User ID

Language

Theme

Timezone

Accessibility

Default Dashboard
```

---

# User Notification Preference

### Business Purpose

Pengaturan notifikasi.

### Candidate Attribute

```
ID

User ID

Email Enabled

Push Enabled

WhatsApp Enabled

Reminder Enabled
```

---

# User Security

### Business Purpose

Status keamanan akun.

### Candidate Attribute

```
ID

User ID

Two Factor Enabled

Recovery Email

Recovery Phone

Last Security Review

Risk Level
```

---

Risk Level

```
Low

Medium

High
```

---

# User Verification

### Business Purpose

Status verifikasi identitas.

### Candidate Attribute

```
ID

User ID

Email Verified

Phone Verified

Identity Verified

Verified At
```

---

# User History

### Candidate Attribute

```
ID

User ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# User Audit

### Candidate Attribute

```
ID

User ID

Action

IPAddress

Browser

Device

Timestamp
```

---

# Relationship

```
User

1

↓

1

User Profile

1

↓

1

User Credential

1

↓

N

User Authentication

1

↓

N

User Session

1

↓

N

User Role

1

↓

N

User Permission

1

↓

N

User Organization

1

↓

N

User Enrollment

1

↓

N

User Device

1

↓

1

User Preference

1

↓

1

User Notification Preference

1

↓

1

User Security

1

↓

1

User Verification

1

↓

N

User History
```

---

# Ownership

| Entity | Owner |
|----------|--------|
| User | User Domain |
| User Profile | User Domain |
| User Credential | User Domain |
| User Authentication | User Domain |
| User Session | User Domain |
| User Role | User Domain |
| User Permission | User Domain |
| User Organization | User Domain |
| User Enrollment | User Domain |
| User Device | User Domain |
| User Preference | User Domain |
| User Notification Preference | User Domain |
| User Security | User Domain |
| User Verification | User Domain |
| User History | User Domain |
| User Audit | System Domain |

---

# Cross Domain Reference

User digunakan oleh:

- Question Bank
- Learning Resource
- CBT Engine
- Learning
- Organization
- Analytics
- AI
- System

User mereferensikan:

- Organization Domain
- Master Academic
- Media Domain

---

# Business Constraint

- Email harus unik.
- Username harus unik.
- Password wajib di-hash.
- Satu Session hanya dimiliki satu User.
- User boleh memiliki banyak Role.
- User boleh menjadi anggota beberapa Organization.
- Enrollment tidak boleh overlap pada tahun ajaran yang sama.
- Photo harus menggunakan Media Domain.
- Soft Delete digunakan.
- Audit tidak boleh dihapus.

---

# Normalization

Target

```
BCNF
```

Tidak diperbolehkan menyimpan:

- nama sekolah
- nama kelas
- nama role
- nama mata pelajaran

langsung pada tabel User.

Seluruhnya direferensikan melalui Foreign Key.

---

# Lifecycle

## User

```
Registered

↓

Verified

↓

Active

↓

Suspended

↓

Inactive

↓

Archived
```

---

## Session

```
Created

↓

Active

↓

Expired

↓

Revoked
```

---

# Design Notes

## 1. Identity vs Profile

Pisahkan identitas akun dari data profil.

- **User** = identitas sistem.
- **User Profile** = informasi personal.

Perubahan profil tidak memengaruhi autentikasi.

---

## 2. Credential Dipisahkan

Password dan informasi autentikasi tidak disimpan pada tabel User.

Hal ini memudahkan implementasi:

- OAuth
- SSO
- LDAP
- Passwordless Login
- Multi Authentication Provider

---

## 3. RBAC (Role-Based Access Control)

Gunakan model:

```
User
    │
    ▼
Role
    │
    ▼
Permission
```

Permission individual hanya digunakan sebagai pengecualian (override), bukan mekanisme utama.

---

## 4. Multi Organization

Satu pengguna dapat bergabung dengan beberapa organisasi.

Contoh:

- Guru mengajar di dua sekolah.
- Siswa mengikuti bimbingan belajar dan sekolah formal.
- Admin mengelola beberapa cabang.

Karena itu gunakan entity `User Organization`, bukan `organization_id` langsung pada tabel User.

---

## 5. Enrollment Terpisah

Status akademik (kelas, jenjang, tahun ajaran) berubah setiap tahun.

Jangan simpan langsung di User.

Gunakan `User Enrollment` agar riwayat kenaikan kelas tetap terjaga.

---

## 6. Security First

Seluruh informasi keamanan dipusatkan pada `User Security`.

Dengan demikian fitur berikut mudah ditambahkan:

- Two-Factor Authentication (2FA)
- Device Trust
- Login Risk Detection
- Account Lockout
- Password Policy

---

## 7. Session Independent

Seluruh token dan session dipisahkan dari User sehingga sistem dapat:

- Logout dari semua perangkat.
- Membatasi jumlah perangkat aktif.
- Menghapus session tertentu.
- Mendeteksi session yang mencurigakan.

---

## 8. Future Ready

Model ini telah disiapkan untuk mendukung:

- Multi Organization
- Multi Tenant
- Parent Account
- Student Guardian
- Single Sign-On (SSO)
- OAuth Provider
- LDAP/Active Directory
- Passkey/WebAuthn
- Device Management
- Fine-Grained Permission
- API Access User
- Service Account
- Account Delegation
- Impersonation (Admin Support)
- Enterprise Identity Management