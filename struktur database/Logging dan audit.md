Untuk **YakinLulus.id**, saya **sangat menyarankan** memisahkan **Logging** dan **Audit** menjadi domain tersendiri.

Banyak sistem hanya memiliki tabel seperti:

```sql
activity_log
error_log
```

Padahal pada platform EdTech berskala besar, kebutuhan logging jauh lebih kompleks.

Contohnya:

* siapa mengubah soal
* siapa menghapus materi
* siapa approve ujian
* siapa login
* siapa gagal login
* siapa download soal
* siapa export Excel
* siapa melihat hasil ujian
* siapa mengubah role user
* siapa mengubah paket membership
* siapa melakukan refund
* siapa upload gambar
* siapa menjalankan AI
* siapa menjalankan OCR
* siapa melakukan bulk import
* perubahan konfigurasi sistem
* perubahan permission
* perubahan database master
* API Request
* Error
* Background Worker
* Security
* Performance

Semuanya sebaiknya dipisahkan.

---

# Domain Logging & Audit

Saya membaginya menjadi beberapa bounded context.

```text
Logging & Audit
│
├── Activity Log
│
├── Audit Log
│
├── Authentication Log
│
├── Authorization Log
│
├── Security Log
│
├── API Log
│
├── System Log
│
├── Error Log
│
├── Performance Log
│
├── Background Job Log
│
├── Notification Log
│
├── AI Log
│
├── Import Export Log
│
├── Data Change History
│
├── Compliance
│
└── Archive
```

Total sekitar **60–80 tabel**.

---

# 1. Activity Log

Aktivitas user.

## activity_log

```sql
activity_log

id UUID

user_id

organization_id

module

entity

entity_id

action

CREATE

UPDATE

DELETE

READ

DOWNLOAD

EXPORT

IMPORT

APPROVE

PUBLISH

RESTORE

metadata JSONB

ip_address

device

browser

platform

created_at
```

---

## activity_type

```sql
activity_type

id

code

LOGIN

LOGOUT

CREATE

UPDATE

DELETE

EXPORT

IMPORT

VIEW
```

---

## activity_category

```sql
activity_category

id

name

SECURITY

ACADEMIC

FINANCE

SYSTEM

AI
```

---

# 2. Audit Log

Audit harus immutable (tidak boleh diubah).

## audit_log

```sql
audit_log

id

user_id

entity_type

entity_id

action

before_data JSONB

after_data JSONB

reason

request_id

created_at
```

Semua perubahan penting masuk ke sini.

---

## audit_entity

```sql
audit_entity

id

entity_name
```

---

## audit_snapshot

Snapshot data.

---

# 3. Authentication

## login_log

```sql
login_log

id

user_id

email

login_time

logout_time

status

SUCCESS

FAILED

LOCKED

ip

device

browser

location
```

---

## logout_log

---

## password_change_log

---

## password_reset_log

---

## otp_log

---

## mfa_log

---

# 4. Authorization

## role_change_log

```sql
role_change_log

id

target_user

old_role

new_role

changed_by

created_at
```

---

## permission_change_log

---

## access_denied_log

---

# 5. Security

## security_event

```sql
security_event

id

event

FAILED_LOGIN

TOKEN_EXPIRED

SQL_INJECTION

XSS

CSRF

FILE_SCAN

ip

severity

created_at
```

---

## suspicious_activity

---

## account_lock_log

---

## token_log

---

## session_log

---

## trusted_device_log

---

# 6. API Log

## api_request_log

```sql
api_request_log

id

request_id

endpoint

method

status_code

latency_ms

user_id

ip

request_size

response_size

created_at
```

---

## api_error_log

---

## api_rate_limit_log

---

# 7. Error

## application_error

```sql
application_error

id

service

module

error_code

message

stack_trace

user_id

created_at
```

---

## database_error

---

## worker_error

---

## frontend_error

---

# 8. System

## system_event

```sql
system_event

id

service

event

started_at

finished_at
```

---

## configuration_change

---

## deployment_log

---

## backup_log

---

## restore_log

---

# 9. Performance

## performance_log

```sql
performance_log

id

service

cpu

memory

latency

created_at
```

---

## slow_query_log

---

## cache_log

---

## queue_log

---

## websocket_log

---

# 10. Background Worker

## worker_job

```sql
worker_job

id

job_type

status

started_at

finished_at
```

---

## worker_retry

---

## worker_queue

---

# 11. Notification

## notification_log

```sql
notification_log

id

notification_id

user_id

channel

EMAIL

WA

SMS

PUSH

status

created_at
```

---

## notification_delivery

---

## notification_open

---

# 12. AI

## ai_request_log

```sql
ai_request_log

id

provider

model

token

latency

user_id

created_at
```

---

## ai_generation_log

---

## ai_chat_log

---

## ai_ocr_log

---

## ai_embedding_log

---

# 13. Import Export

## import_log

```sql
import_log

id

file

module

user_id

status

created_at
```

---

## export_log

---

## bulk_update_log

---

# 14. Data History

## entity_history

Versi perubahan.

```sql
entity_history

id

entity

entity_id

version

snapshot JSONB

created_at
```

---

## restore_history

---

## merge_history

---

# 15. Compliance

## consent_log

---

## privacy_log

---

## retention_log

---

## anonymization_log

---

# 16. Archive

## archive_log

---

## log_partition

---

## log_retention

---

# Relasi Besar

```text
Activity
     │
     ├──────── Audit
     │
     ├──────── Authentication
     │
     ├──────── Authorization
     │
     ├──────── Security
     │
     ├──────── API
     │
     ├──────── Error
     │
     ├──────── Worker
     │
     ├──────── Performance
     │
     ├──────── Notification
     │
     ├──────── AI
     │
     ├──────── Import
     │
     ├──────── Data History
     │
     └──────── Archive
```

# Integrasi dengan Seluruh Domain

| Domain              | Logging yang Direkam                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| User & RBAC         | Login, logout, perubahan password, perubahan role, perubahan permission, MFA, session          |
| Master Akademik     | Perubahan tahun ajaran, kurikulum, mata pelajaran, kelas, kompetensi                           |
| Bank Soal           | CRUD soal, perubahan versi, review, approval, publikasi, impor, ekspor                         |
| Materi Pembelajaran | CRUD materi, perubahan blok, review, approval, publikasi                                       |
| Engine Ujian        | Pembuatan ujian, perubahan konfigurasi, mulai ujian, submit, auto submit, grading, pelanggaran |
| Asset Management    | Upload, download, preview, konversi, OCR, penghapusan, restore                                 |
| Membership          | Aktivasi paket, perubahan paket, pembatalan, perpanjangan                                      |
| Finance             | Pembayaran, refund, invoice, perubahan status transaksi                                        |
| Notification        | Pengiriman email, WA, SMS, push notification, status delivery                                  |
| Analytics           | Pembuatan laporan, ekspor dashboard, proses agregasi                                           |
| AI                  | OCR, AI Tutor, chat, pembuatan soal, embedding, ringkasan                                      |

# Strategi Penyimpanan Log

Untuk sistem dengan target ratusan ribu pengguna, jangan menyimpan seluruh log di satu tabel tanpa strategi. Saya merekomendasikan:

## 1. Partisi Berdasarkan Waktu

Gunakan **partitioning** PostgreSQL pada tabel-tabel yang tumbuh cepat seperti:

```text
activity_log
audit_log
api_request_log
login_log
application_error
ai_request_log
notification_log
```

Contoh:

```text
activity_log_2026_01
activity_log_2026_02
activity_log_2026_03
```

Dengan partisi bulanan, proses pencarian, backup, dan penghapusan data lama menjadi jauh lebih efisien.

## 2. Immutable Audit

Tabel `audit_log` dan `entity_history` sebaiknya:

* tidak memiliki operasi UPDATE,
* hanya INSERT,
* hanya dapat diakses oleh Super Admin atau Auditor,
* menggunakan trigger untuk memastikan integritas data.

## 3. JSONB untuk Snapshot

Kolom seperti:

```text
before_data
after_data
metadata
snapshot
```

disarankan menggunakan **JSONB** agar tidak perlu membuat tabel audit terpisah untuk setiap entitas.

## 4. Korelasi Request

Tambahkan `request_id` dan `trace_id` pada seluruh log penting.

Dengan begitu satu request dapat ditelusuri dari:

```text
API Request
      │
      ▼
Activity Log
      │
      ▼
Audit Log
      │
      ▼
Worker Job
      │
      ▼
Notification
```

Hal ini sangat membantu saat debugging maupun investigasi insiden.

# Rekomendasi Arsitektur

Saya merekomendasikan arsitektur logging berikut:

```text
Application
      │
      ▼
Logging Service
      │
      ├──────── Activity Log
      ├──────── Audit Log
      ├──────── Security Log
      ├──────── API Log
      ├──────── Error Log
      ├──────── AI Log
      ├──────── Worker Log
      └──────── Notification Log
              │
              ▼
PostgreSQL (Partitioned Tables)
              │
              ▼
Analytics / Dashboard / SIEM
```

Dengan pendekatan ini:

* **Audit** menjadi lengkap dan dapat dipertanggungjawabkan.
* **Logging operasional** tetap ringan karena dipisahkan berdasarkan jenisnya.
* **Investigasi keamanan** lebih mudah berkat korelasi `request_id` dan `trace_id`.
* **Skalabilitas** terjaga karena tabel log dipartisi dan dapat diarsipkan secara berkala.
* Domain ini siap diintegrasikan dengan solusi observabilitas seperti **Grafana**, **Prometheus**, **OpenTelemetry**, atau **ELK/OpenSearch** apabila kebutuhan monitoring meningkat di masa depan.
