Untuk **YakinLulus.id**, domain **Monitoring** berbeda dengan **Logging & Audit**.

* **Logging & Audit** → menyimpan histori aktivitas, audit trail, dan log aplikasi.
* **Monitoring** → memantau kesehatan (health), performa, kapasitas, availability, SLA, resource utilization, observability, alerting, dan metrics secara real-time.

Pada skala target **100.000+ pengguna** dan **10.000+ concurrent users**, Monitoring sebaiknya mengikuti prinsip observability yang mencakup:

* **Metrics**
* **Health Check**
* **Tracing**
* **Alerting**
* **Performance**
* **Infrastructure Monitoring**
* **Application Monitoring**
* **Business Monitoring**
* **Synthetic Monitoring**
* **SLA/SLO Monitoring**

Monitoring idealnya terintegrasi dengan Prometheus, Grafana, OpenTelemetry, dan Alertmanager. Database domain ini menyimpan konfigurasi, agregasi metrik, dan histori penting, bukan time-series mentah berfrekuensi tinggi.

---

# Database Monitoring

```text
Schema

monitoring
```

---

# 1. monitored_services

Master service yang dimonitor.

```text
monitored_services
------------------

id (uuid)

service_code

service_name

service_type

API
BACKEND
FRONTEND
DATABASE
REDIS
QUEUE
WORKER
STORAGE
SEARCH
AI
PAYMENT
AUTH
EMAIL
SMS
WHATSAPP
OCR
OTHER

host_name

ip_address

port

environment

LOCAL
DEV
STAGING
PRODUCTION

version

health_endpoint

owner

status

ACTIVE
INACTIVE
MAINTENANCE

created_at

updated_at
```

---

# 2. service_instances

Instance service.

```text
service_instances
-----------------

id

service_id

instance_name

container_name

pod_name

node_name

hostname

ip_address

zone

region

status

STARTING
RUNNING
STOPPED
FAILED

started_at

last_heartbeat
```

---

# 3. health_checks

Health Check.

```text
health_checks
-------------

id

service_id

instance_id

check_type

HTTP
TCP
PING
SQL
REDIS
QUEUE
CUSTOM

status

HEALTHY
UNHEALTHY
DEGRADED

response_time_ms

http_status

message

checked_at
```

---

# 4. service_metrics

Snapshot metrics.

```text
service_metrics
---------------

id

service_id

instance_id

metric_time

cpu_usage

memory_usage

disk_usage

network_in

network_out

request_per_second

error_rate

success_rate

active_connection

queue_length

thread_count

gc_time

uptime

created_at
```

---

# 5. database_metrics

Monitoring PostgreSQL.

```text
database_metrics
----------------

id

database_name

active_connection

idle_connection

max_connection

transaction_per_second

query_per_second

slow_query

deadlock

cache_hit_ratio

replication_delay

disk_size

table_size

index_size

captured_at
```

---

# 6. redis_metrics

```text
redis_metrics
-------------

id

instance

memory_used

memory_peak

connected_client

key_count

hit_rate

miss_rate

evicted_key

expired_key

ops_per_second

captured_at
```

---

# 7. queue_metrics

RabbitMQ / Kafka / Redis Queue.

```text
queue_metrics
-------------

id

queue_name

waiting_job

processing_job

completed_job

failed_job

retry_job

worker_count

avg_processing_time

captured_at
```

---

# 8. api_metrics

API Performance.

```text
api_metrics
-----------

id

service_id

endpoint

http_method

request_count

success_count

failed_count

avg_latency

p95_latency

p99_latency

max_latency

captured_at
```

---

# 9. endpoint_availability

Availability endpoint.

```text
endpoint_availability
---------------------

id

service_id

endpoint

uptime_percentage

downtime_second

availability_status

captured_at
```

---

# 10. error_metrics

```text
error_metrics
-------------

id

service_id

error_type

error_count

critical_count

warning_count

captured_at
```

---

# 11. tracing_transactions

Distributed Tracing.

```text
tracing_transactions
--------------------

id

trace_id

span_id

parent_span

service_id

operation

duration_ms

status

request_id

created_at
```

---

# 12. tracing_spans

```text
tracing_spans
-------------

id

trace_id

service_name

operation

start_time

end_time

duration_ms

status
```

---

# 13. alerts

Master alert.

```text
alerts
------

id

alert_name

alert_type

CPU

MEMORY

DATABASE

API

NETWORK

QUEUE

SECURITY

CUSTOM

severity

INFO

WARNING

HIGH

CRITICAL

condition_expression

enabled

created_at
```

---

# 14. alert_events

Alert yang terjadi.

```text
alert_events
------------

id

alert_id

service_id

trigger_value

threshold

status

OPEN

ACKNOWLEDGED

RESOLVED

triggered_at

resolved_at
```

---

# 15. alert_notifications

Pengiriman alert.

```text
alert_notifications
-------------------

id

alert_event_id

channel

EMAIL

SMS

WHATSAPP

PUSH

SLACK

DISCORD

WEBHOOK

recipient

status

sent_at
```

---

# 16. sla_configuration

```text
sla_configuration
-----------------

id

service_id

availability_target

response_target

error_rate_target

uptime_target

created_at
```

---

# 17. sla_reports

```text
sla_reports
-----------

id

service_id

period

uptime

availability

average_response

error_rate

sla_pass

generated_at
```

---

# 18. synthetic_monitors

Synthetic Monitoring.

```text
synthetic_monitors
------------------

id

monitor_name

url

method

interval_second

expected_status

expected_response

enabled
```

---

# 19. synthetic_results

```text
synthetic_results
-----------------

id

monitor_id

status

response_time

http_status

error

checked_at
```

---

# 20. capacity_forecasts

Prediksi kapasitas.

```text
capacity_forecasts
------------------

id

service_id

forecast_date

predicted_cpu

predicted_memory

predicted_storage

predicted_bandwidth

prediction_model

generated_at
```

---

# 21. business_metrics

Monitoring KPI bisnis.

```text
business_metrics
----------------

id

metric_date

active_user

online_user

new_registration

active_exam

completed_exam

question_answered

revenue

conversion_rate

retention_rate

created_at
```

---

# 22. worker_metrics

Monitoring Worker.

```text
worker_metrics
--------------

id

worker_name

job_running

job_success

job_failed

avg_duration

memory_usage

cpu_usage

heartbeat

captured_at
```

---

# 23. storage_metrics

```text
storage_metrics
---------------

id

provider

bucket

used_storage

free_storage

object_count

upload_count

download_count

captured_at
```

---

# 24. monitoring_dashboards

Dashboard.

```text
monitoring_dashboards
---------------------

id

dashboard_name

description

layout_json

visibility

created_by

created_at
```

---

# 25. dashboard_widgets

```text
dashboard_widgets
-----------------

id

dashboard_id

widget_name

widget_type

chart_type

query

position

size

refresh_interval
```

---

# 26. monitoring_incidents

Incident.

```text
monitoring_incidents
--------------------

id

incident_no

service_id

severity

LOW

MEDIUM

HIGH

CRITICAL

title

description

started_at

resolved_at

root_cause

resolution

status
```

---

# 27. maintenance_windows

Maintenance.

```text
maintenance_windows
-------------------

id

service_id

title

start_time

end_time

description

created_by
```

---

# 28. monitoring_configuration

Konfigurasi.

```text
monitoring_configuration
------------------------

id

config_key

config_value

description
```

Contoh

```text
PROMETHEUS_INTERVAL=15

SCRAPE_TIMEOUT=10

ALERT_CPU=80

ALERT_MEMORY=85

ALERT_DISK=90

SLA_TARGET=99.9

TRACE_SAMPLING=0.2

METRIC_RETENTION=365

ENABLE_SYNTHETIC=true
```

---

# Relasi Antar Tabel

```text
monitored_services
        │
        ├──────── service_instances
        ├──────── health_checks
        ├──────── service_metrics
        ├──────── api_metrics
        ├──────── endpoint_availability
        ├──────── error_metrics
        ├──────── alerts
        ├──────── sla_configuration
        ├──────── monitoring_incidents
        ├──────── maintenance_windows
        └──────── capacity_forecasts

alerts
     │
     └──────── alert_events
                 │
                 └──────── alert_notifications

synthetic_monitors
     │
     └──────── synthetic_results

monitoring_dashboards
     │
     └──────── dashboard_widgets

tracing_transactions
     │
     └──────── tracing_spans
```

# Strategi Penyimpanan Data Monitoring

Karena data monitoring bersifat **time-series** dan volumenya sangat besar, gunakan pendekatan penyimpanan bertingkat:

### 1. Real-Time Metrics

Disimpan pada sistem time-series seperti **Prometheus**, **VictoriaMetrics**, atau **TimescaleDB** untuk metrik berfrekuensi tinggi (misalnya setiap 5–30 detik).

### 2. Operational Database

Schema `monitoring` di PostgreSQL digunakan untuk:

* konfigurasi monitoring,
* definisi dashboard,
* aturan alert,
* SLA/SLO,
* histori incident,
* ringkasan metrik,
* agregasi harian/mingguan.

### 3. Long-Term Archive

Agregasi metrik (per jam, harian, bulanan) dipindahkan ke storage arsip atau data warehouse untuk analisis historis tanpa membebani sistem operasional.

## Integrasi dengan Domain Lain

Domain Monitoring berinteraksi dengan hampir seluruh platform YakinLulus.id:

* **Logging & Audit** → korelasi alert dengan log dan audit trail.
* **Scheduler & Queue** → metrik antrean dan performa worker.
* **API Integration** → health provider eksternal, latensi, dan error rate.
* **Authentication** → pemantauan login, token, dan layanan identitas.
* **CBT Engine** → jumlah peserta aktif, latensi autosave, sinkronisasi jawaban, dan stabilitas sesi ujian.
* **OCR / Import Engine** → durasi OCR, throughput parsing AI, serta tingkat keberhasilan impor.
* **Analytics & Reporting** → KPI operasional dan metrik bisnis.
* **Notification** → distribusi alert melalui email, WhatsApp, Slack, webhook, atau kanal lainnya.

## Rekomendasi Arsitektur Observability

Untuk lingkungan produksi YakinLulus.id, arsitektur berikut memberikan observability yang komprehensif:

* **Metrics**: Prometheus + Grafana.
* **Tracing**: OpenTelemetry + Jaeger atau Tempo.
* **Logging**: Loki atau Elasticsearch/OpenSearch.
* **Alerting**: Alertmanager terintegrasi dengan email, WhatsApp, Slack, dan webhook.
* **Database Metrics**: `pg_stat_statements`, `pg_stat_activity`, serta exporter PostgreSQL.
* **Container & Host Metrics**: Node Exporter dan cAdvisor untuk memantau server, Docker, atau Kubernetes.
* **Business Monitoring**: dashboard khusus untuk jumlah peserta CBT aktif, tingkat penyelesaian ujian, throughput OCR, penggunaan AI, dan metrik pembelajaran sehingga tim operasional dapat memantau kesehatan teknis sekaligus performa bisnis dalam satu ekosistem.
