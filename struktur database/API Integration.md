Untuk **YakinLulus.id**, **API Integration** merupakan domain yang mengelola seluruh komunikasi dengan sistem eksternal maupun internal. Domain ini tidak hanya menyimpan konfigurasi API, tetapi juga autentikasi, webhook, sinkronisasi data, rate limiting, retry, monitoring, idempotency, dan audit integrasi.

Arsitektur ini dirancang agar mendukung:

* Payment Gateway (Midtrans, Xendit, dll.)
* Email Provider (SMTP, SendGrid, Mailgun)
* WhatsApp Provider (Meta, Fonnte, Wablas, Twilio)
* SMS Gateway
* Push Notification (Firebase)
* Google OAuth
* Microsoft OAuth
* Apple OAuth
* Supabase
* AI Provider (OpenAI, Gemini, Claude)
* Cloud Storage
* CDN
* OCR/Vision
* Video Streaming
* SSO
* Future Microservices

---

# Database API Integration

```text
Schema

integration
```

---

# 1. api_providers

Master seluruh provider.

```text
api_providers
-------------

id (uuid)

provider_code
provider_name

category

PAYMENT
EMAIL
SMS
WHATSAPP
PUSH
AI
OCR
STORAGE
CDN
AUTH
VIDEO
ANALYTICS
SEARCH
OTHER

vendor

base_url

documentation_url

version

environment

SANDBOX
PRODUCTION

status

ACTIVE
INACTIVE
MAINTENANCE

supports_webhook

supports_retry

supports_batch

supports_async

created_at

updated_at
```

Unique

```text
provider_code
```

---

# 2. api_credentials

Credential API.

```text
api_credentials
---------------

id

provider_id

credential_name

api_key

api_secret

client_id

client_secret

access_token

refresh_token

jwt_secret

certificate

private_key

public_key

expires_at

is_encrypted

rotation_date

last_used_at

status

created_at

updated_at
```

Catatan:

* Seluruh secret dienkripsi menggunakan KMS/Vault.
* Jangan simpan plaintext.

---

# 3. api_endpoints

Daftar endpoint.

```text
api_endpoints
-------------

id

provider_id

service_name

endpoint_name

base_url

path

http_method

GET

POST

PUT

PATCH

DELETE

timeout_seconds

content_type

authentication_type

NONE

API_KEY

JWT

BASIC

BEARER

OAUTH2

rate_limit

retry_enabled

retry_policy

is_active

created_at

updated_at
```

---

# 4. api_request_logs

Log request.

```text
api_request_logs
----------------

id

request_id

provider_id

endpoint_id

user_id

module

request_method

request_url

request_headers

request_body

payload_hash

request_size

sent_at
```

Index

```text
request_id

provider_id

sent_at DESC
```

---

# 5. api_response_logs

Log response.

```text
api_response_logs
-----------------

id

request_id

status_code

response_headers

response_body

response_size

latency_ms

success

provider_reference

error_code

error_message

received_at
```

---

# 6. webhook_endpoints

Endpoint webhook internal.

```text
webhook_endpoints
-----------------

id

provider_id

endpoint_name

url

secret_key

signature_algorithm

is_active

verification_enabled

created_at

updated_at
```

---

# 7. webhook_events

Event webhook.

```text
webhook_events
--------------

id

provider_id

event_name

event_type

description

is_enabled

created_at
```

---

# 8. webhook_logs

Semua webhook masuk.

```text
webhook_logs
------------

id

provider_id

event_id

request_id

headers

payload

signature

signature_valid

status

processing_time

response

retry_count

received_at
```

---

# 9. api_retry_queue

Retry request gagal.

```text
api_retry_queue
---------------

id

request_id

provider_id

endpoint_id

payload

attempt

max_attempt

next_retry

status

PENDING

RUNNING

SUCCESS

FAILED

CANCELLED

last_error

created_at
```

---

# 10. api_rate_limits

Monitoring rate limit.

```text
api_rate_limits
---------------

id

provider_id

endpoint_id

window_type

SECOND

MINUTE

HOUR

DAY

limit_request

remaining_request

reset_time

created_at
```

---

# 11. api_usage_statistics

Statistik penggunaan.

```text
api_usage_statistics
--------------------

id

provider_id

endpoint_id

date

total_request

success_request

failed_request

avg_latency

max_latency

min_latency

total_data_sent

total_data_received

estimated_cost
```

---

# 12. api_error_catalog

Master error provider.

```text
api_error_catalog
-----------------

id

provider_id

error_code

error_name

description

severity

LOW

MEDIUM

HIGH

CRITICAL

recommended_action

created_at
```

---

# 13. api_sync_jobs

Sinkronisasi data.

```text
api_sync_jobs
-------------

id

provider_id

job_name

module

sync_direction

IMPORT

EXPORT

BIDIRECTIONAL

schedule

cron_expression

last_sync

next_sync

status

ACTIVE

PAUSED

FAILED

SUCCESS

created_at
```

---

# 14. api_sync_history

Riwayat sinkronisasi.

```text
api_sync_history
----------------

id

job_id

started_at

finished_at

duration_ms

record_processed

success_count

failed_count

status

error_message
```

---

# 15. oauth_clients

OAuth.

```text
oauth_clients
-------------

id

provider

GOOGLE

MICROSOFT

APPLE

FACEBOOK

client_id

client_secret

redirect_uri

scope

status

created_at
```

---

# 16. oauth_tokens

Token OAuth.

```text
oauth_tokens
------------

id

user_id

provider

access_token

refresh_token

expires_at

scope

created_at

updated_at
```

---

# 17. integration_modules

Mapping integrasi.

```text
integration_modules
-------------------

id

provider_id

module_name

enabled

priority

fallback_provider

created_at
```

Contoh

```text
Payment

Notification

Authentication

AI

Storage

Analytics
```

---

# 18. provider_health_checks

Monitoring provider.

```text
provider_health_checks
----------------------

id

provider_id

status

UP

DOWN

DEGRADED

latency_ms

http_code

checked_at
```

---

# 19. provider_incidents

Riwayat gangguan.

```text
provider_incidents
------------------

id

provider_id

title

description

started_at

resolved_at

impact_level

LOW

MEDIUM

HIGH

CRITICAL

status
```

---

# 20. idempotency_keys

Mencegah duplicate request.

```text
idempotency_keys
----------------

id

idempotency_key

provider_id

request_hash

response_hash

expires_at

created_at
```

Unique

```text
idempotency_key
```

---

# 21. api_batch_jobs

Batch API.

```text
api_batch_jobs
--------------

id

provider_id

job_name

batch_size

status

total_record

processed_record

failed_record

started_at

finished_at
```

---

# 22. api_batch_items

Item batch.

```text
api_batch_items
---------------

id

batch_job_id

reference_id

payload

status

response

error_message
```

---

# 23. integration_event_logs

Audit integrasi.

```text
integration_event_logs
----------------------

id

provider_id

module

event_type

CONNECT

DISCONNECT

TOKEN_REFRESH

RETRY

TIMEOUT

WEBHOOK

SYNC

ERROR

description

performed_by

created_at
```

---

# 24. ai_provider_models

Model AI yang tersedia.

```text
ai_provider_models
------------------

id

provider_id

model_name

version

context_window

max_output_token

cost_input

cost_output

supports_image

supports_audio

supports_video

supports_function_call

status
```

---

# 25. ai_usage_logs

Monitoring penggunaan AI.

```text
ai_usage_logs
-------------

id

provider_id

model_id

user_id

module

prompt_token

completion_token

total_token

latency_ms

estimated_cost

status

created_at
```

---

# 26. external_file_transfer_logs

Transfer file.

```text
external_file_transfer_logs
---------------------------

id

provider_id

operation

UPLOAD

DOWNLOAD

DELETE

MOVE

COPY

filename

mime_type

size

duration_ms

status

created_at
```

---

# 27. callback_queue

Queue callback.

```text
callback_queue
--------------

id

provider_id

request_id

callback_url

payload

status

retry_count

scheduled_at

processed_at
```

---

# 28. api_configuration

Konfigurasi global.

```text
api_configuration
-----------------

id

provider_id

key

value

description

created_at

updated_at
```

---

# Relasi Antar Tabel

```text
api_providers
    │
    ├──────── api_credentials
    ├──────── api_endpoints
    ├──────── api_rate_limits
    ├──────── api_usage_statistics
    ├──────── provider_health_checks
    ├──────── provider_incidents
    ├──────── webhook_endpoints
    ├──────── webhook_events
    ├──────── api_sync_jobs
    ├──────── ai_provider_models
    ├──────── integration_modules
    └──────── api_configuration

api_endpoints
     │
     ├──────── api_request_logs
     ├──────── api_retry_queue
     ├──────── api_batch_jobs
     └──────── api_usage_statistics

api_request_logs
     │
     ├──────── api_response_logs
     ├──────── callback_queue
     └──────── idempotency_keys

api_sync_jobs
     │
     └──────── api_sync_history

api_batch_jobs
     │
     └──────── api_batch_items

oauth_clients
     │
     └──────── oauth_tokens
```

# Rekomendasi Implementasi untuk YakinLulus.id

Untuk memenuhi kebutuhan produksi skala besar, domain API Integration sebaiknya juga dilengkapi dengan:

* **Outbox Pattern** untuk menjamin pengiriman event eksternal tanpa kehilangan data.
* **Circuit Breaker** agar provider yang sedang bermasalah tidak terus dibebani request.
* **Exponential Backoff + Jitter** pada mekanisme retry.
* **Distributed Idempotency** menggunakan `idempotency_keys` untuk operasi kritis seperti pembayaran dan sinkronisasi.
* **Encrypted Secrets** menggunakan KMS atau Vault; jangan menyimpan API key atau token dalam bentuk plaintext.
* **Provider Failover** melalui `integration_modules.fallback_provider` sehingga layanan seperti email, WhatsApp, atau AI dapat berpindah otomatis ke provider cadangan jika provider utama mengalami gangguan.
* **Observability** dengan `request_id`, `correlation_id`, metrik latensi, dan tracing agar setiap transaksi lintas layanan dapat ditelusuri secara menyeluruh.
