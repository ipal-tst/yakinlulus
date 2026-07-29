# 15_notification_architecture.md

# YakinLulus.id Notification Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Notification System** pada backend YakinLulus.id.

Notification System bertanggung jawab mengirimkan seluruh pemberitahuan kepada pengguna melalui berbagai channel secara asynchronous.

Tujuan utama:

* Mendukung multi-channel notification.
* Memisahkan business logic dari delivery mechanism.
* Mendukung retry.
* Mendukung template.
* Mendukung scheduling.
* Mendukung preference management.
* Siap untuk skalabilitas tinggi.

---

# 2. Objectives

Notification Architecture dirancang untuk:

* Multi Channel
* Event Driven
* Asynchronous Delivery
* User Preference Aware
* Template Based
* Retryable
* Observable
* Extensible

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Notification is Infrastructure
* Business Logic Independent
* Queue First
* Template Driven
* Idempotent
* Channel Agnostic
* Fail Gracefully

---

# 4. High Level Architecture

```text id="f8a3bn"
Business Event

↓

Notification Service

↓

Queue

↓

Notification Worker

↓

Channel Adapter

↓

Provider

↓

User
```

Seluruh pengiriman dilakukan melalui Background Job.

---

# 5. Notification Flow

```text id="d1v5qg"
Business Event

↓

Create Notification

↓

Save Database

↓

Queue

↓

Worker

↓

Channel Delivery

↓

Update Status
```

---

# 6. Notification Components

Komponen utama:

* Notification Service
* Notification Repository
* Template Engine
* Channel Adapter
* Queue
* Worker
* Preference Manager
* Delivery Tracker

---

# 7. Directory Structure

```text id="u7r4lm"
internal/

modules/

notification/

controller/

service/

repository/

template/

worker/

provider/

dto/
```

---

# 8. Supported Channels

MVP:

* In-App Notification
* Email

Phase berikutnya:

* Push Notification
* WhatsApp
* SMS
* Telegram
* Discord
* Webhook

---

# 9. Notification Categories

Kategori:

```text id="q2p8tx"
system

academic

exam

material

achievement

security

marketing

reminder
```

Kategori memudahkan filtering dan preference management.

---

# 10. Business Events

Contoh event:

```text id="w5k6zu"
exam.published

exam.started

exam.finished

question.generated

material.published

ranking.updated

achievement.unlocked

user.registered

password.reset
```

Notification dipicu oleh event, bukan dipanggil langsung dari Controller.

---

# 11. Notification Lifecycle

```text id="q0j9fa"
Created

↓

Queued

↓

Processing

↓

Delivered

↓

Read

↓

Archived
```

Jika gagal:

```text id="l8b2ye"
Retry

↓

Failed
```

---

# 12. Notification Entity

Tabel utama:

```text id="v4h6ko"
notifications
```

Kolom utama:

* id
* user_id
* category
* channel
* title
* body
* status
* read_at
* created_at

---

# 13. Delivery Entity

Tabel:

```text id="z7d5wp"
notification_deliveries
```

Kolom:

* id
* notification_id
* provider
* attempt
* delivered_at
* failed_at
* error_code

Satu notifikasi dapat memiliki beberapa delivery record.

---

# 14. Notification Status

Status:

```text id="r6n8cx"
pending

queued

processing

delivered

failed

read

archived
```

Status disimpan di database untuk audit dan troubleshooting.

---

# 15. Template Engine

Notification menggunakan template.

Contoh:

```text id="m3t7vy"
exam_finished

ranking_updated

welcome_email

password_reset
```

Template dipisahkan dari business logic.

---

# 16. Template Variables

Contoh:

```text id="x1p4rh"
{{student_name}}

{{exam_name}}

{{score}}

{{ranking}}
```

Template dirender sebelum dikirim.

---

# 17. In-App Notification

Flow:

```text id="k5g9ub"
Business Event

↓

Notification Table

↓

Frontend API

↓

User Dashboard
```

Frontend mengambil notifikasi melalui REST API.

---

# 18. Email Notification

Flow:

```text id="a2n6jw"
Notification

↓

Queue

↓

Worker

↓

SMTP Provider

↓

Delivery Status
```

Email tidak dikirim langsung dari HTTP Request.

---

# 19. Push Notification (Future)

Flow:

```text id="n8m2ef"
Notification

↓

Queue

↓

Push Adapter

↓

FCM/APNs

↓

Mobile Device
```

---

# 20. WhatsApp Notification (Future)

Flow:

```text id="j6w3ts"
Notification

↓

Queue

↓

WhatsApp Adapter

↓

Provider

↓

User
```

Implementasi menggunakan adapter agar provider dapat diganti.

---

# 21. User Preference

Setiap user memiliki preference.

Contoh:

| Notification  | Email    | In-App | Push     |
| ------------- | -------- | ------ | -------- |
| Exam Reminder | ✓        | ✓      | ✓        |
| Marketing     | Optional | ✓      | Optional |
| Security      | ✓        | ✓      | ✓        |

Preference disimpan pada tabel khusus.

---

# 22. Notification Priority

Prioritas:

```text id="g0q8dm"
critical

high

normal

low
```

Prioritas menentukan queue dan urutan pemrosesan.

---

# 23. Queue Strategy

Queue:

```text id="p4e2la"
notification

notification_high

notification_low
```

Worker dapat dipisahkan berdasarkan prioritas.

---

# 24. Retry Strategy

Default:

* Retry 5 kali.
* Exponential Backoff.
* Configurable Delay.

Validation error tidak di-retry.

---

# 25. Duplicate Prevention

Gunakan deduplication.

Contoh:

```text id="b7x1cr"
Exam Finished
```

Tidak boleh mengirim notifikasi yang sama berkali-kali untuk event yang identik.

---

# 26. Scheduled Notification

Contoh:

* Reminder CBT H-1.
* Reminder CBT H-30 menit.
* Deadline Assignment.
* Subscription Expiry (Future).

Scheduler menggunakan Asynq Scheduler.

---

# 27. Notification API

Endpoint:

```text id="f9m5ky"
GET /notifications

GET /notifications/{id}

PATCH /notifications/{id}/read

PATCH /notifications/read-all

DELETE /notifications/{id}
```

API mendukung pagination dan filtering.

---

# 28. Read Status

Notification memiliki:

```text id="t3y8no"
Unread

↓

Read
```

`read_at` menyimpan waktu pertama kali dibaca.

---

# 29. Notification Counter

Dashboard dapat mengambil:

```text id="s1r4vz"
Unread Count
```

Counter dapat di-cache menggunakan Redis.

---

# 30. Security Notifications

Kategori khusus:

* Login Baru
* Password Berubah
* Email Berubah
* Session Dicabut
* Aktivitas Mencurigakan

Security notification tidak dapat dinonaktifkan oleh pengguna.

---

# 31. Localization

Template mendukung:

* Bahasa Indonesia
* English

Pemilihan bahasa berdasarkan preferensi pengguna.

---

# 32. Channel Adapter

Setiap channel menggunakan interface.

```go id="h5u9jb"
type NotificationProvider interface {
    Send(...)
}
```

Implementasi:

* EmailProvider
* PushProvider
* WhatsAppProvider

Business layer tidak mengetahui provider tertentu.

---

# 33. Logging

Setiap pengiriman mencatat:

* Notification ID
* User ID
* Channel
* Provider
* Duration
* Status
* Retry Count

Konten sensitif tidak dicatat.

---

# 34. Monitoring

Metric:

* Notifications Created
* Notifications Delivered
* Delivery Success Rate
* Delivery Failure Rate
* Retry Count
* Average Delivery Time

Monitoring terintegrasi dengan sistem observability.

---

# 35. Failure Handling

Jika pengiriman gagal:

```text id="y8c2gp"
Retry

↓

Failed

↓

Alert (Critical Only)
```

Status tetap tersimpan untuk investigasi.

---

# 36. Scalability

Worker dapat ditambah.

```text id="r5l7qw"
Redis Queue

↓

Worker A

Worker B

Worker C
```

Tidak diperlukan perubahan business logic.

---

# 37. Future Roadmap

Pengembangan berikutnya:

* Real-time Notification (WebSocket/SSE).
* Notification Digest.
* Smart Notification Scheduling.
* Multi-Tenant Notification.
* Notification Analytics.
* A/B Testing Template.
* Webhook Notification.

---

# 38. Anti-Patterns

Tidak diperbolehkan:

* Mengirim email langsung dari Controller.
* Business logic di Notification Worker.
* Template hardcoded di Service.
* Payload terlalu besar.
* Menyimpan credential provider di source code.
* Mengirim notifikasi sinkron pada request HTTP.

---

# 39. Notification Checklist

Sebelum implementasi:

* Menggunakan Queue.
* Template terpisah.
* Multi-channel siap.
* User Preference diterapkan.
* Retry aktif.
* Logging tersedia.
* Monitoring tersedia.
* Delivery Status disimpan.
* Unit & integration test tersedia.

---

# 40. Summary

Notification Architecture YakinLulus.id menggunakan pendekatan **Event-Driven** dengan **Queue-Based Asynchronous Delivery**. Seluruh notifikasi diproses melalui worker dan channel adapter sehingga menghasilkan:

* Pengiriman yang cepat dan andal.
* Dukungan multi-channel.
* Template yang mudah dikelola.
* Retry dan monitoring bawaan.
* Skalabilitas tinggi melalui worker horizontal.
* Fondasi yang siap mendukung notifikasi real-time dan berbagai provider di masa mendatang.
