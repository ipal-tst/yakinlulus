Untuk **YakinLulus.id**, saya tidak menyarankan hanya membuat satu tabel `notifications`. Pada skala **100.000+ pengguna**, sistem notifikasi harus mendukung **multi-channel**, **event-driven**, **template management**, **queue**, **retry**, **tracking**, **user preference**, dan **broadcast**.

Arsitektur ini mendukung:

* In-App Notification
* Push Notification
* Email
* WhatsApp
* SMS
* Telegram (opsional)
* Announcement
* Reminder CBT
* Reminder Membership
* Reminder Belajar
* AI Notification
* Marketing Campaign
* Real-time Notification
* Background Queue

---

# Notification Domain Architecture

```text
Notification

├── Notification Template
├── Notification Event
├── Notification Queue
├── Notification Delivery
├── Notification History
├── Notification Preference
├── Notification Channel
├── Broadcast
├── Announcement
├── Campaign
├── Device Token
├── User Inbox
├── Scheduler
├── Webhook
├── Retry
└── Audit Log
```

---

# High Level Flow

```text
Application Event

        │

        ▼

notification_events

        │

        ▼

Notification Service

        │

 ┌──────┴─────────────┐

 ▼                    ▼

Queue             Broadcast

 ▼                    ▼

Channel Router

 │

 ├── Email

 ├── Push

 ├── WhatsApp

 ├── SMS

 ├── In App

 └── Telegram

 │

 ▼

Delivery Log

 │

 ▼

User Inbox
```

---

# ERD

```text
notification_templates

        │

        ▼

notification_events

        │

        ▼

notification_queue

        │

        ▼

notification_deliveries

        │

        ▼

notification_histories

        │

        ▼

user_notifications

users
 │
 ├── notification_preferences
 │
 ├── notification_devices
 │
 └── notification_read_logs


broadcasts

announcements

campaigns

notification_webhooks

notification_retry

notification_audit_logs
```

---

# 1. notification_templates

Master template.

```text
id UUID PK

code

name

category

title_template

body_template

email_subject

email_template

whatsapp_template

sms_template

push_title

push_body

variables JSONB

language

version

is_active

created_by

updated_by

created_at

updated_at
```

---

Kategori

```text
SYSTEM

EXAM

LEARNING

MEMBERSHIP

PAYMENT

SECURITY

PROMOTION

REMINDER

AI

ANNOUNCEMENT

```

---

# 2. notification_events

Semua event aplikasi.

```text
id

event_name

event_type

reference_type

reference_id

user_id

payload JSONB

priority

scheduled_at

status

created_at
```

Contoh event

```text
REGISTER

LOGIN

PAYMENT_SUCCESS

PAYMENT_FAILED

MEMBERSHIP_EXPIRED

EXAM_START

EXAM_END

NEW_MATERIAL

NEW_ASSIGNMENT

AI_RECOMMENDATION

FORGOT_PASSWORD

OTP

ANNOUNCEMENT

```

---

# 3. notification_queue

Queue pengiriman.

```text
id

event_id

template_id

user_id

channel

priority

scheduled_at

status

retry_count

worker_id

locked_at

processed_at

created_at
```

---

Status

```text
WAITING

PROCESSING

SUCCESS

FAILED

RETRY

CANCELLED

```

---

# 4. notification_deliveries

Hasil pengiriman.

```text
id

queue_id

provider

provider_message_id

channel

status

request_payload JSONB

response_payload JSONB

response_time

sent_at

delivered_at

read_at

failed_reason
```

---

# 5. notification_histories

Riwayat seluruh notifikasi.

```text
id

user_id

template_id

channel

title

body

status

created_at
```

---

# 6. user_notifications

Inbox aplikasi.

```text
id

user_id

notification_history_id

title

body

image_url

action_url

action_type

icon

badge

priority

is_read

read_at

expired_at

created_at
```

---

# 7. notification_preferences

Preferensi user.

```text
id

user_id

allow_email

allow_push

allow_sms

allow_whatsapp

allow_in_app

allow_marketing

allow_exam

allow_payment

allow_learning

allow_ai

allow_system

quiet_hour_start

quiet_hour_end

updated_at
```

---

# 8. notification_devices

Token device.

```text
id

user_id

device_uuid

device_name

platform

manufacturer

model

os

app_version

firebase_token

onesignal_token

last_login

last_seen

active

created_at
```

---

# 9. notification_read_logs

Tracking baca.

```text
id

notification_id

user_id

opened_at

clicked_at

device

platform
```

---

# 10. broadcasts

Broadcast massal.

```text
id

title

description

target_type

target_filter JSONB

template_id

scheduled_at

status

created_by

created_at
```

Target

```text
ALL

STUDENT

TEACHER

STAFF

SCHOOL

PREMIUM

FREE

```

---

# 11. announcements

Pengumuman.

```text
id

title

content

cover_image

category

publish_at

expired_at

is_popup

priority

created_by
```

---

# 12. campaigns

Marketing campaign.

```text
id

campaign_name

template_id

start_date

end_date

target_filter

estimated_recipient

status

created_by
```

---

# 13. notification_webhooks

Webhook provider.

```text
id

provider

endpoint

request

response

http_status

verified

created_at
```

---

# 14. notification_retry

Retry gagal kirim.

```text
id

delivery_id

retry_number

next_retry

status

reason

created_at
```

---

# 15. notification_channels

Master channel.

```text
id

code

name

provider

active

priority

rate_limit_per_minute
```

Contoh

```text
EMAIL

PUSH

WHATSAPP

SMS

IN_APP

TELEGRAM

```

---

# 16. notification_providers

Konfigurasi provider.

```text
id

channel_id

provider_name

api_key

secret_key

endpoint

active

priority

config JSONB

created_at

updated_at
```

Contoh:

* Firebase Cloud Messaging (FCM)
* OneSignal
* SendGrid
* Mailgun
* Amazon SES
* Twilio
* WhatsApp Business API
* Meta Cloud API

---

# 17. notification_scheduler

Penjadwalan otomatis.

```text
id

template_id

cron_expression

next_run

last_run

active

created_at
```

Contoh

* Reminder belajar jam 19.00
* Pengingat ujian H-1
* Membership H-7
* Membership H-3
* Membership H-1

---

# 18. notification_rules

Rule engine.

```text
id

event_name

template_id

channel

priority

delay_second

condition JSONB

active
```

Contoh Rule

| Event             | Channel               |
| ----------------- | --------------------- |
| Payment Success   | Email + Push + In App |
| CBT 30 Menit Lagi | Push + In App         |
| Membership Habis  | Email + WA + Push     |
| Materi Baru       | Push                  |
| Nilai Keluar      | Push + In App         |
| AI Recommendation | Push                  |

---

# 19. notification_statistics

Agregasi statistik.

```text
id

date

channel

total_sent

total_delivered

total_opened

total_clicked

total_failed

delivery_rate

open_rate

click_rate
```

---

# 20. notification_audit_logs

Audit domain.

```text
id

actor_id

actor_role

action

table_name

record_id

old_data JSONB

new_data JSONB

ip_address

device

created_at
```

---

# Jenis Notifikasi

### Sistem

* Login berhasil
* Login gagal
* OTP
* Reset password
* Verifikasi email

---

### Pembelajaran

* Materi baru
* Tugas baru
* Progress belajar
* Target belajar harian
* AI merekomendasikan materi

---

### CBT

* Ujian dibuat
* Ujian dimulai
* 30 menit lagi
* Nilai keluar
* Sertifikat tersedia

---

### Membership

* Trial dimulai
* Trial berakhir
* Membership aktif
* Membership H-7
* Membership H-3
* Membership H-1
* Pembayaran berhasil
* Pembayaran gagal

---

### Marketing

* Promo
* Voucher
* Flash Sale
* Webinar
* Event

---

# Index Strategy

## notification_queue

* `(status, priority, scheduled_at)`
* `(worker_id)`
* `(user_id, status)`

## notification_events

* `(event_name, created_at DESC)`
* `(user_id, created_at DESC)`
* `(status)`

## user_notifications

* `(user_id, is_read, created_at DESC)`
* `(expired_at)`

## notification_devices

* `(user_id)`
* `(firebase_token)` UNIQUE
* `(device_uuid)` UNIQUE

## notification_deliveries

* `(provider_message_id)` UNIQUE
* `(channel, status)`
* `(sent_at DESC)`

---

# Partisi

| Tabel                   | Strategi |
| ----------------------- | -------- |
| notification_events     | Monthly  |
| notification_queue      | Monthly  |
| notification_deliveries | Monthly  |
| notification_histories  | Monthly  |
| notification_read_logs  | Monthly  |
| notification_audit_logs | Monthly  |
| notification_statistics | Yearly   |

---

# Integrasi dengan Domain Lain

Domain **Notification** menjadi pusat komunikasi sistem dan terhubung dengan seluruh bounded context di YakinLulus.id:

* **User & RBAC**: autentikasi, OTP, keamanan akun, dan preferensi notifikasi.
* **CBT Engine**: pengingat jadwal ujian, perubahan jadwal, hasil ujian, dan sertifikat.
* **Learning Material**: materi baru, target belajar harian, progres belajar, dan rekomendasi AI.
* **Finance & Membership**: invoice, pembayaran, aktivasi paket, pengingat perpanjangan, refund, dan promo.
* **Analytics**: seluruh proses pengiriman menghasilkan event untuk mengukur delivery rate, open rate, click-through rate, efektivitas campaign, dan kualitas layanan notifikasi.

Dengan desain ini, sistem notifikasi mampu menangani pengiriman jutaan notifikasi per hari melalui banyak kanal, memiliki mekanisme antrean, retry, audit, pelacakan, serta tetap mudah diperluas untuk provider baru tanpa mengubah struktur inti aplikasi.
