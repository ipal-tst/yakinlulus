Untuk **YakinLulus.id**, **System Configuration** bukan sekadar tabel `settings`. Pada platform edutech enterprise, konfigurasi mencakup identitas aplikasi, keamanan, autentikasi, AI, CBT, notifikasi, pembayaran, penyimpanan file, feature flag, hingga integrasi pihak ketiga.

Saya menyarankan menjadikan **System Configuration** sebagai domain terpisah yang mengelola seluruh konfigurasi sistem secara terpusat, terversi, dapat diaudit, dan mendukung perubahan tanpa redeploy aplikasi.

---

# 1. Arsitektur Domain System Configuration

```text
System Configuration
│
├── Application
├── Organization
├── Environment
├── Security
├── Authentication
├── Authorization
├── Academic
├── CBT Configuration
├── AI Configuration
├── Asset Configuration
├── Notification Configuration
├── Finance Configuration
├── Membership Configuration
├── Integration
├── Feature Flag
├── Theme & Branding
├── Localization
├── Scheduler
├── Maintenance
├── Backup
├── Configuration Version
├── Configuration History
└── Configuration Audit
```

Total sekitar **70–90 tabel**.

---

# 2. Konsep Dasar

Saya **tidak menyarankan** membuat puluhan tabel dengan hanya dua kolom:

```text
key
value
```

Sebaliknya gunakan kombinasi:

* master konfigurasi
* nilai konfigurasi
* grouping
* versioning
* environment
* audit

Dengan begitu konfigurasi dapat berubah tanpa mengubah struktur database.

---

# 3. configuration_group

Kelompok konfigurasi.

```sql
configuration_group

id UUID

code

APPLICATION

SECURITY

CBT

AI

PAYMENT

EMAIL

WHATSAPP

STORAGE

SYSTEM

ACADEMIC

MEMBERSHIP

ANALYTICS

name

description

sort_order

created_at
```

---

# 4. configuration_definition

Master seluruh konfigurasi.

```sql
configuration_definition

id

group_id

config_key

display_name

description

data_type

STRING

INTEGER

BOOLEAN

FLOAT

JSON

ARRAY

DATE

TIME

DATETIME

validation_rule

default_value

is_required

is_secret

restart_required

editable

created_at
```

Contoh

```text
APP_NAME

APP_URL

MAX_UPLOAD

OTP_LENGTH

AI_PROVIDER

JWT_EXPIRE

DEFAULT_LANGUAGE
```

---

# 5. configuration_value

Nilai konfigurasi.

```sql
configuration_value

id

definition_id

organization_id

environment_id

config_value

effective_from

effective_until

updated_by

updated_at
```

Dengan model ini satu konfigurasi dapat berbeda antara:

* Production
* UAT
* Development
* Sekolah A
* Sekolah B

---

# 6. environment

```sql
environment

id

code

DEV

STAGING

UAT

PRODUCTION

name
```

---

# 7. application_configuration

Konfigurasi aplikasi.

```sql
application_configuration

id

app_name

version

company_name

website

support_email

support_phone

default_language

default_timezone

maintenance_mode

maintenance_message
```

---

# 8. branding_configuration

```sql
branding_configuration

id

organization_id

logo_asset_id

favicon_asset_id

primary_color

secondary_color

accent_color

font_family

login_background_asset_id
```

---

# 9. localization_configuration

```sql
localization_configuration

id

default_language

default_timezone

date_format

time_format

currency

number_format
```

---

# 10. Security

## security_configuration

```sql
security_configuration

id

password_min_length

password_expired_day

password_history

max_failed_login

lock_duration

otp_expired_second

jwt_expired_minute

refresh_token_day

allow_multiple_session

require_mfa
```

---

## password_policy

```sql
password_policy

id

uppercase_required

lowercase_required

number_required

symbol_required

minimum_length
```

---

## ip_whitelist

```sql
ip_whitelist

id

ip_address

description

enabled
```

---

## ip_blacklist

---

## security_header

Untuk CSP, HSTS.

---

# 11. Authentication

## authentication_provider

```sql
authentication_provider

id

provider

LOCAL

GOOGLE

MICROSOFT

APPLE

enabled
```

---

## oauth_configuration

```sql
oauth_configuration

id

provider

client_id

client_secret

redirect_uri
```

---

# 12. Authorization

## default_role

```sql
default_role

id

organization_id

student_role

teacher_role
```

---

## permission_configuration

---

# 13. Academic

## academic_configuration

```sql
academic_configuration

id

active_academic_year

active_semester

default_curriculum

grading_method

passing_score
```

---

# 14. CBT

## cbt_configuration

```sql
cbt_configuration

id

fullscreen

safe_browser

random_question

random_option

auto_submit

allow_resume

offline_mode

heartbeat_second

cheating_threshold
```

---

## grading_configuration

---

## timer_configuration

---

# 15. AI

## ai_provider

```sql
ai_provider

id

provider

OPENAI

GEMINI

ANTHROPIC

OLLAMA

endpoint

api_key

enabled
```

---

## ai_model

```sql
ai_model

id

provider_id

model_name

purpose

OCR

CHAT

EMBEDDING

QUESTION

SUMMARY
```

---

## ai_parameter

```sql
temperature

max_token

top_p

frequency_penalty

presence_penalty
```

---

# 16. Storage

## storage_configuration

```sql
storage_configuration

id

provider

bucket

region

cdn

max_upload_size

allowed_extension
```

---

## image_configuration

Thumbnail.

---

## video_configuration

Streaming.

---

# 17. Notification

## email_configuration

SMTP.

---

## whatsapp_configuration

---

## sms_configuration

---

## push_configuration

---

## notification_template

---

# 18. Finance

## payment_gateway

```sql
payment_gateway

id

provider

MIDTRANS

XENDIT

STRIPE

enabled

server_key

client_key
```

---

## invoice_configuration

---

## tax_configuration

---

# 19. Membership

## membership_configuration

```sql
trial_day

renewal_day

grace_period
```

---

# 20. Analytics

## analytics_configuration

Google Analytics.

---

## dashboard_configuration

---

# 21. Scheduler

## cron_job

```sql
cron_job

id

job_name

cron_expression

enabled

last_run

next_run
```

---

## scheduler_configuration

---

# 22. Integration

## integration_provider

```sql
provider

SLACK

GOOGLE

ZOOM

TELEGRAM

WEBHOOK
```

---

## webhook_configuration

---

## api_integration

---

# 23. Feature Flag

## feature_flag

```sql
feature_flag

id

code

enabled

rollout_percentage

environment
```

Contoh

```text
AI_TUTOR

CAT_EXAM

LIVE_CLASS

VOICE_CHAT
```

---

## feature_target

Untuk role tertentu.

---

# 24. Backup

## backup_configuration

```sql
backup_configuration

frequency

retention

compression

storage
```

---

## restore_configuration

---

# 25. Maintenance

## maintenance_schedule

```sql
start

finish

message
```

---

## maintenance_history

---

# 26. Configuration Version

## configuration_version

```sql
version

published_by

published_at
```

---

## configuration_snapshot

Snapshot JSON.

---

# 27. Configuration History

## configuration_history

```sql
before_json

after_json

changed_by

changed_at
```

---

# 28. Configuration Audit

## configuration_audit

```sql
user_id

config

old

new

request_id
```

---

# Relasi Besar

```text
Configuration Group
        │
        └──────── Configuration Definition
                        │
                        └──────── Configuration Value
                                       │
                                       ├──────── Environment
                                       ├──────── Organization
                                       ├──────── Version
                                       ├──────── History
                                       └──────── Audit

Application
│
├── Branding
├── Localization
├── Security
├── Authentication
├── Authorization
├── Academic
├── CBT
├── AI
├── Storage
├── Notification
├── Finance
├── Membership
├── Analytics
├── Scheduler
├── Integration
├── Feature Flag
├── Backup
└── Maintenance
```

# Integrasi dengan Domain Lain

| Domain              | Konfigurasi yang Digunakan                                   |
| ------------------- | ------------------------------------------------------------ |
| User & RBAC         | Password policy, MFA, session, default role, OAuth           |
| Master Akademik     | Tahun ajaran aktif, semester aktif, kurikulum default        |
| Bank Soal           | Pengaturan review, approval, impor, ekspor, penomoran soal   |
| Materi Pembelajaran | Pengaturan editor, ukuran media, publikasi, sertifikat       |
| Engine Ujian        | Timer, randomisasi, safe browser, auto submit, anti-cheating |
| Asset Management    | Provider storage, bucket, CDN, batas ukuran file, tipe file  |
| Membership          | Masa trial, grace period, paket default                      |
| Finance             | Payment gateway, pajak, invoice, mata uang                   |
| Notification        | SMTP, WhatsApp API, SMS, Push Notification                   |
| Analytics           | Integrasi BI, retensi data, interval agregasi                |
| AI                  | Provider, model, parameter inferensi, embedding, OCR         |

# Strategi Implementasi

## 1. Hierarki Konfigurasi

Agar fleksibel untuk multi-tenant dan multi-environment, gunakan prioritas berikut:

```text
System Default
        │
        ▼
Environment
        │
        ▼
Organization
        │
        ▼
Role (opsional)
        │
        ▼
User (opsional)
```

Dengan demikian, misalnya:

* ukuran maksimum upload global adalah 20 MB,
* tetapi Sekolah A dapat menggunakan 50 MB,
* dan lingkungan UAT dapat memiliki konfigurasi berbeda dari Production.

## 2. Penyimpanan Secret

Kolom bertanda `is_secret` (API key, client secret, token gateway) sebaiknya:

* dienkripsi sebelum disimpan,
* tidak pernah ditampilkan penuh di antarmuka admin,
* seluruh perubahan dicatat pada `configuration_audit`.

## 3. Versioning

Setiap perubahan konfigurasi penting menghasilkan:

* entri baru pada `configuration_version`,
* snapshot konfigurasi,
* audit perubahan.

Dengan cara ini administrator dapat melakukan **rollback** apabila konfigurasi baru menyebabkan gangguan.

# Rekomendasi Arsitektur

Saya menyarankan **Configuration Service** sebagai pusat seluruh pengaturan sistem.

```text
Admin Panel
      │
      ▼
Configuration Service
      │
      ├──────── Configuration Definition
      ├──────── Configuration Value
      ├──────── Version
      ├──────── Audit
      └──────── Cache (Redis)
                │
                ▼
Semua Domain
(User, CBT, AI, Finance, Asset, Notification, Analytics)
```

Dengan pendekatan ini:

* konfigurasi dapat diubah tanpa mengubah kode aplikasi,
* mendukung multi-sekolah dan multi-lingkungan (Development, UAT, Production),
* mudah diaudit dan di-*rollback*,
* siap diskalakan untuk fitur-fitur baru seperti AI, Computer Adaptive Test (CAT), maupun integrasi layanan pihak ketiga,
* konsisten dengan arsitektur modular dan domain-driven yang telah dirancang untuk seluruh ekosistem **YakinLulus.id**.
