gunakan **Enterprise RBAC + ABAC Ready**, sehingga nantinya mudah dikembangkan tanpa perubahan besar.

---

# DOMAIN USER & ACCESS MANAGEMENT

```
Authentication
│
├── User
├── Profile
├── Login
├── Session
├── Device
├── OTP
├── MFA
├── API Token
│
Authorization
│
├── Role
├── Permission
├── Module
├── Resource
├── Role Permission
├── User Role
├── Scope
├── Organization
├── User Organization
│
Audit
│
├── Login History
├── Activity Log
├── Security Log
├── Access Log
└── Password History
```

Jumlah sekitar **30–35 tabel**, namun semuanya memiliki fungsi yang jelas.

---

# 1. users

Tabel utama.

```text
users

id (uuid)

username

email

phone

password_hash

status

ACTIVE

INACTIVE

LOCKED

PENDING

avatar

last_login_at

email_verified

phone_verified

created_at

updated_at

deleted_at
```

Index

```
email

username

phone

status
```

---

# 2. user_profile

Data personal.

```text
user_profile

id

user_id

full_name

gender

birth_place

birth_date

religion

nationality

photo

bio

language

timezone
```

Dipisah agar query login ringan.

---

# 3. user_address

```text
user_address

id

user_id

province

city

district

village

postal_code

address

latitude

longitude
```

---

# 4. user_identity

Jika perlu KTP/NISN/NIP.

```text
user_identity

id

user_id

identity_type

identity_number

issued_date

expired_date

is_verified
```

---

# 5. organization

Karena nanti bisa memiliki banyak sekolah.

```text
organization

id

code

name

type

SYSTEM

SCHOOL

PARTNER

COMPANY

description

status
```

---

# 6. organization_member

```text
organization_member

id

organization_id

user_id

joined_at

status
```

---

# 7. role

Master Role.

```text
role

id

code

SUPER_ADMIN

STAFF

FINANCE

GURU

SISWA

ORTU

CS

AI

name

description

priority

is_system
```

---

# 8. permission_module

Master Module.

```text
permission_module

id

code

QUESTION

EXAM

MATERIAL

FINANCE

MEMBERSHIP

AI

USER

REPORT

SETTING

name

icon

sort_order
```

---

# 9. permission_resource

Lebih detail.

```text
permission_resource

id

module_id

code

QUESTION_BANK

QUESTION

QUESTION_IMPORT

QUESTION_EXPORT

EXAM_RESULT

...
```

---

# 10. permission

Hak akses.

```text
permission

id

resource_id

code

question.create

question.read

question.update

question.delete

question.publish

question.approve

question.export

question.import
```

---

# 11. role_permission

Many to Many.

```text
role_permission

id

role_id

permission_id

allow

true

false
```

---

# 12. user_role

User bisa memiliki banyak role.

```text
user_role

id

user_id

role_id

organization_id

start_date

end_date

is_primary
```

Contoh

```
Budi

↓

Guru

↓

Sekolah A

dan

↓

Reviewer

↓

YakinLulus
```

---

# 13. permission_scope

Untuk ABAC.

```text
permission_scope

id

code

SELF

CLASS

SCHOOL

REGIONAL

NATIONAL

GLOBAL
```

---

# 14. user_permission_override

Override.

```text
user_permission_override

id

user_id

permission_id

allow
```

Misalnya Guru tertentu boleh export soal.

---

# 15. menu

Frontend.

```text
menu

id

parent_id

title

icon

route

sort_order

is_visible
```

---

# 16. role_menu

```text
role_menu

id

role_id

menu_id
```

---

# 17. login_session

```text
login_session

id

user_id

access_token

refresh_token

expired_at

logout_at

ip

device

browser

os
```

---

# 18. device

```text
device

id

user_id

device_uuid

device_name

platform

android

ios

web

windows

mac

linux

last_active
```

---

# 19. trusted_device

```text
trusted_device

id

device_id

verified_at
```

---

# 20. otp_request

```text
otp_request

id

user_id

type

EMAIL

SMS

WA

code

expired_at

verified_at
```

---

# 21. password_history

```text
password_history

id

user_id

password_hash

created_at
```

---

# 22. password_reset

```text
password_reset

id

user_id

token

expired_at

used_at
```

---

# 23. email_verification

```text
email_verification

id

user_id

token

expired_at

verified_at
```

---

# 24. api_token

Untuk API.

```text
api_token

id

user_id

token

scope

expired_at

last_used
```

---

# 25. login_history

```text
login_history

id

user_id

login_time

logout_time

ip

country

city

browser

device

status

FAILED

SUCCESS
```

---

# 26. activity_log

Semua aktivitas.

```text
activity_log

id

user_id

module

action

entity

entity_id

old_data

new_data

created_at
```

JSONB sangat cocok.

---

# 27. security_log

```text
security_log

id

user_id

event

FAILED_LOGIN

OTP

PASSWORD_CHANGE

ROLE_CHANGE

MFA

ip

created_at
```

---

# 28. notification_preference

```text
notification_preference

id

user_id

email

push

sms

whatsapp
```

---

# 29. user_setting

```text
user_setting

id

user_id

theme

language

timezone

dashboard_layout
```

---

# 30. user_preference

AI.

```text
user_preference

id

user_id

favorite_subject

difficulty

study_target

daily_target

learning_style
```

---

# 31. user_status_history

```text
user_status_history

id

user_id

old_status

new_status

reason

changed_by

changed_at
```

---

# 32. impersonation_log

Super Admin.

```text
impersonation_log

id

admin_id

target_user_id

reason

started_at

ended_at
```

---

# 33. mfa_configuration

```text
mfa_configuration

id

user_id

method

TOTP

EMAIL

SMS

WA

secret

is_enabled
```

---

# 34. refresh_token_blacklist

```text
refresh_token_blacklist

id

token

expired_at
```

---

# 35. user_agreement

```text
user_agreement

id

user_id

agreement_type

PRIVACY

TERM

version

accepted_at
```

---

# Relasi Besar

```text
Organization
      │
      ├──────── Organization Member
      │                 │
      │                 └──────── User
      │                           │
      │                           ├──────── User Profile
      │                           ├──────── User Address
      │                           ├──────── User Identity
      │                           ├──────── User Setting
      │                           ├──────── User Preference
      │                           ├──────── Notification Preference
      │                           ├──────── Login Session
      │                           ├──────── Device
      │                           ├──────── OTP
      │                           ├──────── MFA
      │                           ├──────── Password Reset
      │                           ├──────── Password History
      │                           ├──────── Login History
      │                           ├──────── Activity Log
      │                           ├──────── Security Log
      │                           ├──────── API Token
      │                           ├──────── User Agreement
      │                           └──────── User Role
      │                                         │
      │                                         ├──────── Role
      │                                         │
      │                                         └──────── Permission Scope
      │
Role
      │
      ├──────── Role Permission
      │                 │
      │                 └──────── Permission
      │                              │
      │                              └──────── Permission Resource
      │                                            │
      │                                            └──────── Permission Module
      │
      └──────── Role Menu
                       │
                       └──────── Menu
```

# Matriks Hak Akses Awal

| Modul             |   Super Admin  |    Staff    |  Finance |         Guru         | Wali Kelas |     Siswa    |   Orang Tua  |
| ----------------- | :------------: | :---------: | :------: | :------------------: | :--------: | :----------: | :----------: |
| User Management   |      CRUD      |     Read    |   Read   |           -          |      -     |     Self     |     Self     |
| RBAC              |      CRUD      |      -      |     -    |           -          |      -     |       -      |       -      |
| Bank Soal         | CRUD + Approve |     CRUD    |   Read   |   Create/Update Own  |    Read    |     Read     |       -      |
| Materi            |      CRUD      |     CRUD    |   Read   |       CRUD Own       |    Read    |     Read     |     Read     |
| CBT/Ujian         |      CRUD      |     CRUD    |   Read   | Create + Approve Own |    Read    |     Join     |  Read Hasil  |
| Membership        |      CRUD      |     Read    |   CRUD   |           -          |      -     |     Read     |     Read     |
| Keuangan          |      CRUD      |      -      |   CRUD   |           -          |      -     | Read Tagihan | Read Tagihan |
| AI Tutor          |      CRUD      |     Read    |   Read   |         Read         |    Read    |  Full Access |    Monitor   |
| Dashboard         |      Full      | Operasional |  Finance |         Guru         |    Kelas   |     Siswa    |     Anak     |
| Laporan           |      Semua     | Operasional | Keuangan |       Akademik       |    Kelas   |    Pribadi   |     Anak     |
| Pengaturan Sistem |      CRUD      |      -      |     -    |           -          |      -     |       -      |       -      |

# Integrasi dengan Domain Lain

Domain **User & RBAC** menjadi fondasi autentikasi, otorisasi, dan audit untuk seluruh sistem YakinLulus.id:

* **Master Akademik**: menghubungkan pengguna dengan organisasi, sekolah, kelas, dan peran akademik.
* **Bank Soal**: mengontrol siapa yang dapat membuat, mengedit, mereview, menyetujui, dan mempublikasikan soal.
* **Materi Pembelajaran**: mengatur hak akses berdasarkan peran dan kepemilikan konten.
* **CBT/Ujian**: mengelola peserta, pengawas, pembuat ujian, serta akses hasil ujian.
* **Membership & Finance**: mengontrol akses paket berlangganan, pembayaran, dan fitur premium.
* **AI Tutor**: menggunakan `user_preference` dan peran pengguna untuk personalisasi pembelajaran.
* **Audit & Keamanan**: seluruh perubahan penting dicatat melalui `activity_log`, `security_log`, `login_history`, dan `impersonation_log`.

## Catatan Arsitektur

Untuk implementasi menggunakan **PostgreSQL + Go (Clean Architecture) + Supabase**, saya menyarankan:

* Gunakan **UUID v7** sebagai primary key untuk seluruh tabel.
* Terapkan **soft delete** (`deleted_at`) pada tabel master seperti `users`, `role`, `organization`, dan `menu`.
* Simpan data dinamis seperti `old_data`, `new_data`, dan preferensi tertentu dalam **JSONB**.
* Tambahkan indeks pada seluruh foreign key serta kolom yang sering digunakan untuk autentikasi (`email`, `username`, `phone`, `status`) dan otorisasi (`role_id`, `permission_id`, `organization_id`).
* Pisahkan proses autentikasi (session, token, MFA) dari profil pengguna agar proses login tetap ringan dan mudah diskalakan.
* Siapkan struktur ini agar kompatibel dengan **RBAC** saat ini dan dapat diperluas menjadi **ABAC (Attribute-Based Access Control)** atau kebijakan berbasis organisasi tanpa migrasi besar di masa mendatang.
