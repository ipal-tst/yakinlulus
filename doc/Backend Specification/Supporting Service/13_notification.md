# 13_notification.md

# YakinLulus.id Backend Specification — Notification Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Notification Module merupakan layanan terpusat yang bertanggung jawab mengirimkan seluruh notifikasi pada platform YakinLulus.id.

Modul ini mengimplementasikan **event-driven notification architecture**, sehingga seluruh domain backend dapat menghasilkan event tanpa bergantung langsung pada mekanisme pengiriman notifikasi.

Notification Module mendukung berbagai channel komunikasi dan dirancang agar mudah diperluas tanpa mengubah business logic pada domain lain.

---

# 2. Module Responsibility

Notification Module bertanggung jawab terhadap:

* Notification Template
* Notification Queue
* Notification Delivery
* User Preference
* Notification History
* Read Status
* Push Notification
* Email Notification
* In-App Notification
* Broadcast Notification
* Scheduled Notification

Module ini **tidak bertanggung jawab** terhadap:

* Authentication
* Business Workflow
* AI Processing
* Analytics Calculation

---

# 3. Architecture Position

```text
                     All Backend Modules
                             │
                             ▼
                    Domain Event Bus
                             │
                             ▼
                =========================
                Notification Module
                =========================
                  │      │       │
                  ▼      ▼       ▼
              In-App   Email   Push
                  │      │       │
                  ▼      ▼       ▼
               Student Teacher Admin
```

---

# 4. Business Objectives

Notification Module dirancang untuk:

* Memusatkan seluruh proses pengiriman notifikasi.
* Mendukung berbagai channel komunikasi.
* Mendukung asynchronous processing.
* Menghindari blocking pada business transaction.
* Menjamin reliabilitas pengiriman.
* Mendukung personalisasi notifikasi.

---

# 5. Notification Lifecycle

```text
Draft

↓

Queued

↓

Processing

↓

Sent

↓

Delivered

↓

Read

↓

Archived
```

State tambahan:

* Failed
* Cancelled
* Expired

---

# 6. Actors

* Student
* Teacher
* Academic Admin
* Platform Admin
* Background Worker
* AI Service

---

# 7. RBAC

```text
notification.read

notification.create

notification.send

notification.broadcast

notification.delete

notification.manage_template

notification.preference
```

---

# 8. Business Rules

### BR-001

Seluruh notifikasi harus berasal dari Domain Event atau Scheduled Job.

---

### BR-002

Notification Template wajib tersedia sebelum notifikasi dikirim.

---

### BR-003

Pengiriman dilakukan secara asynchronous melalui queue.

---

### BR-004

Pengguna dapat menonaktifkan channel tertentu sesuai preference.

---

### BR-005

Notifikasi kritis tidak dapat dinonaktifkan.

---

### BR-006

Setiap pengiriman dicatat pada Notification History.

---

### BR-007

Retry dilakukan apabila delivery gagal.

---

### BR-008

Broadcast dilakukan secara bertahap (batch processing).

---

# 9. Supported Notification Channel

## MVP

* In-App Notification
* Email
* Push Notification (Firebase)

## Future

* WhatsApp
* SMS
* Telegram
* Discord
* Microsoft Teams
* Slack
* Webhook
* Voice Call

---

# 10. Notification Type

System Notification

* Login
* Password Reset
* Verification

Academic Notification

* Exam Published
* Exam Reminder
* Exam Result
* New Material
* Assignment

Learning Notification

* Daily Reminder
* Study Streak
* Recommendation
* Learning Progress

Administrative Notification

* User Invitation
* School Approval
* Role Change

AI Notification

* AI Material Generated
* AI Question Generated
* AI Review Completed

---

# 11. Data Model

Entity utama:

```text
notification_templates

notifications

notification_receivers

notification_preferences

notification_histories

notification_channels

notification_queue

broadcast_jobs
```

---

# 12. Relationships

```text
Domain Event

↓

Notification Template

↓

Notification Queue

↓

Delivery Channel

↓

Notification History

↓

Recipient
```

---

# 13. Notification Template

Template terdiri dari:

* Code
* Name
* Category
* Title
* Subject
* Body
* Variables
* Language
* Channel
* Status

Contoh variable:

```text
{{student_name}}

{{exam_name}}

{{exam_date}}

{{school_name}}
```

---

# 14. Notification Preference

Setiap pengguna dapat mengatur:

* Email Enabled
* Push Enabled
* In-App Enabled
* Reminder Enabled
* Marketing Enabled (Future)

Notifikasi keamanan dan sistem wajib tetap dikirim.

---

# 15. Delivery Strategy

Pengiriman menggunakan queue:

```text
Event

↓

Queue

↓

Worker

↓

Template Rendering

↓

Delivery Provider

↓

History
```

---

# 16. Retry Strategy

Retry dilakukan menggunakan exponential backoff.

Contoh:

```text
Attempt 1

↓

1 Minute

↓

Attempt 2

↓

5 Minutes

↓

Attempt 3

↓

15 Minutes

↓

Failed
```

Maximum retry dapat dikonfigurasi melalui Configuration Management.

---

# 17. Functional Specification

Fitur:

* Send Notification
* Broadcast Notification
* Schedule Notification
* Read Notification
* Delete Notification
* Update Preference
* Manage Template
* Retry Failed Notification
* Notification History

---

# 18. DTO

## Send Notification

```json
{
  "template_code": "EXAM_PUBLISHED",
  "recipient_id": "uuid",
  "variables": {
    "exam_name": "Try Out UTBK 2027"
  }
}
```

---

## Response

```json
{
  "notification_id": "uuid",
  "status": "QUEUED"
}
```

---

# 19. Validation Rules

| Field         | Rule                     |
| ------------- | ------------------------ |
| Template      | Required                 |
| Recipient     | Required                 |
| Channel       | Allowed                  |
| Variables     | Required sesuai Template |
| Schedule Time | Optional                 |

---

# 20. API Summary

```text
GET    /api/v1/notifications

GET    /api/v1/notifications/{id}

POST   /api/v1/notifications

POST   /api/v1/notifications/broadcast

POST   /api/v1/notifications/schedule

PUT    /api/v1/notifications/read

DELETE /api/v1/notifications/{id}

GET    /api/v1/notification-templates

PUT    /api/v1/notification-preferences
```

---

# 21. Service Layer

```text
NotificationService

Send()

Broadcast()

Schedule()

Retry()

MarkAsRead()

Delete()

UpdatePreference()

RenderTemplate()

Dispatch()
```

---

# 22. Repository Layer

```text
NotificationRepository

TemplateRepository

PreferenceRepository

HistoryRepository

QueueRepository

BroadcastRepository
```

---

# 23. Transaction Flow

```text
Business Module

↓

Publish Domain Event

↓

Notification Queue

↓

Worker

↓

Render Template

↓

Send Channel

↓

Save History

↓

Commit
```

---

# 24. Event Publishing

Event yang diproses:

```text
user.registered

user.invited

password.reset

exam.published

exam.started

exam.reminder

exam.finished

exam.result.generated

material.published

question.review.completed

school.approved

notification.failed
```

---

# 25. Background Job

Worker:

* Queue Processor
* Retry Processor
* Broadcast Processor
* Scheduled Notification
* Cleanup Old Notification
* Delivery Monitoring

---

# 26. Cache Strategy

Redis menyimpan:

* Notification Template
* User Preference
* Unread Notification Count
* Broadcast Progress

TTL:

```text
30 Minutes
```

---

# 27. Search Strategy

Filter:

* Recipient
* Channel
* Status
* Category
* Template
* Created Date
* Read Status

Sorting:

* Latest
* Priority
* Delivery Status

---

# 28. Delivery Provider

MVP

* SMTP Email
* Firebase Cloud Messaging (FCM)
* In-App Database

Roadmap

* WhatsApp Business API
* Twilio
* Telegram Bot
* Slack API
* Discord Webhook

Seluruh provider diakses melalui abstraction layer.

---

# 29. Security Rules

Implementasi keamanan:

* JWT Authentication
* RBAC Authorization
* Template Validation
* Variable Sanitization
* Rate Limiting
* Signed Internal Event
* Audit Logging

---

# 30. Audit Log

Audit mencatat:

* Notification Created
* Notification Sent
* Delivery Failed
* Retry
* Read
* Delete
* Broadcast
* Preference Updated

---

# 31. Error Handling

| Code                  | Description                    |
| --------------------- | ------------------------------ |
| TEMPLATE_NOT_FOUND    | Template tidak ditemukan       |
| RECIPIENT_NOT_FOUND   | Penerima tidak ditemukan       |
| CHANNEL_NOT_SUPPORTED | Channel tidak didukung         |
| DELIVERY_FAILED       | Pengiriman gagal               |
| INVALID_VARIABLE      | Variabel template tidak valid  |
| PREFERENCE_BLOCKED    | Channel dinonaktifkan pengguna |
| QUEUE_FULL            | Antrian penuh                  |

---

# 32. Sequence Diagram

```text
Business Module

↓

Domain Event

↓

Notification Queue

↓

Worker

↓

Template Engine

↓

Provider

↓

Recipient

↓

History
```

---

# 33. Integration

Notification Module terintegrasi dengan:

* Authentication
* User Management
* School Management
* Material
* Question Bank
* Exam
* CBT Runtime
* Analytics
* AI Service
* File Management
* Configuration Management

---

# 34. Performance Target

| Metric                | Target                  |
| --------------------- | ----------------------- |
| Queue Processing      | < 100 ms                |
| Template Rendering    | < 50 ms                 |
| Notification Creation | < 100 ms                |
| Broadcast Batch       | ≥ 1.000 recipient/batch |
| Read Status Update    | < 50 ms                 |

Performa delivery bergantung pada provider eksternal.

---

# 35. Test Scenario

### Unit Test

* Render Template
* Queue Notification
* Retry Logic
* Preference Validation
* Read Notification

### Integration Test

* Email Delivery
* Push Delivery
* In-App Notification
* Broadcast
* Scheduled Notification

### Security Test

* Unauthorized Send
* Invalid Template
* Rate Limiting
* Variable Injection
* Broken Access Control

---

# 36. Future Enhancement

* Multi-language Template
* Notification Priority Engine
* AI Personalized Notification
* Smart Reminder
* WhatsApp Integration
* SMS Gateway
* Webhook Notification
* Notification Analytics Dashboard
* User Engagement Prediction

---

# 37. Dependencies

Module bergantung pada:

* Authentication
* User Management
* Redis
* Background Job
* Configuration Management
* Logging
* SMTP Provider
* Firebase Cloud Messaging

Module ini menjadi dependency bagi seluruh domain backend yang membutuhkan mekanisme notifikasi.

---

# 38. Acceptance Criteria

Module dinyatakan selesai apabila:

* Template dapat dikelola.
* Queue berjalan dengan baik.
* In-App Notification berfungsi.
* Email dapat dikirim.
* Push Notification dapat dikirim.
* Retry otomatis berjalan.
* User Preference diterapkan.
* Audit Log tersedia.
* Unit, Integration, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 39. Summary

Notification Module merupakan layanan komunikasi terpusat yang mengimplementasikan arsitektur berbasis event untuk seluruh platform YakinLulus.id. Dengan dukungan queue, template engine, multi-channel delivery, retry mechanism, dan abstraction layer terhadap penyedia layanan notifikasi, modul ini mampu menyediakan sistem notifikasi yang andal, skalabel, dan mudah dikembangkan dari kebutuhan MVP hingga implementasi berskala nasional.
