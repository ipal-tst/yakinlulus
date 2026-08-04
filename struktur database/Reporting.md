Untuk **YakinLulus.id**, saya menyarankan **Reporting** dipisahkan dari **Analytics**.

Perbedaannya:

| Analytics                  | Reporting                                        |
| -------------------------- | ------------------------------------------------ |
| Real-time / Near Real-time | Periodik (harian, mingguan, bulanan, tahunan)    |
| Dashboard & KPI            | Dokumen laporan                                  |
| Agregasi untuk monitoring  | Rekapitulasi dan arsip                           |
| Data interaktif            | PDF, Excel, CSV                                  |
| Digunakan oleh Dashboard   | Digunakan oleh Manajemen, Sekolah, Guru, Finance |

Reporting bertanggung jawab menghasilkan laporan resmi yang dapat diunduh, dijadwalkan, diaudit, dan dikirim secara otomatis.

---

# Reporting Domain Architecture

```text
Reporting

├── Report Definition
├── Report Template
├── Report Category
├── Report Scheduler
├── Report Job
├── Report Generation
├── Report Export
├── Report History
├── Report Delivery
├── Report Sharing
├── Dashboard Snapshot
├── KPI Snapshot
├── Financial Report
├── Academic Report
├── Student Report
├── Teacher Report
├── School Report
├── Audit Report
├── Operational Report
└── Report Audit Log
```

---

# Jenis Report

```
Academic

├── Nilai
├── CBT
├── Materi
├── Kehadiran
├── Ranking

Finance

├── Revenue
├── Membership
├── Refund
├── Invoice

Management

├── KPI
├── DAU
├── MAU
├── Growth

Operational

├── User
├── Login
├── Error
├── Security

School

├── Guru
├── Kelas
├── Mapel
├── Progress
```

---

# High Level ERD

```text
report_categories

        │

        ▼

report_definitions

        │

        ├──────── report_templates

        ├──────── report_jobs

        ├──────── report_exports

        ├──────── report_histories

        ├──────── report_delivery

        ├──────── report_scheduler

        ├──────── report_snapshots

        └──────── report_permissions

users

schools

analytics

finance

academic
```

---

# 1 report_categories

Kategori laporan.

```text
id UUID PK

code

name

description

sort_order

active

created_at
```

Kategori

```
ACADEMIC

FINANCE

ANALYTICS

SECURITY

MEMBERSHIP

SYSTEM

SCHOOL

AI

```

---

# 2 report_definitions

Master laporan.

```text
id

code

name

category_id

description

query_name

template_id

default_format

allow_schedule

allow_export

active

created_by

created_at
```

---

# 3 report_templates

Template laporan.

```text
id

name

layout

header

footer

orientation

paper_size

logo

theme

version

created_at
```

---

# 4 report_jobs

Job generator.

```text
id

definition_id

requested_by

status

parameter JSONB

started_at

finished_at

duration

error_message
```

---

Status

```
QUEUED

PROCESSING

SUCCESS

FAILED

CANCELLED

```

---

# 5 report_exports

File export.

```text
id

job_id

format

storage_provider

file_path

file_size

checksum

download_count

expired_at

created_at
```

Format

```
PDF

EXCEL

CSV

JSON

XML

```

---

# 6 report_histories

Riwayat report.

```text
id

definition_id

user_id

generated_at

parameter

status

downloaded

downloaded_at
```

---

# 7 report_scheduler

Jadwal otomatis.

```text
id

definition_id

cron_expression

next_run

last_run

active

created_by
```

---

Contoh

```
Daily Revenue

Weekly KPI

Monthly School Report

Semester Report

Annual Financial Report

```

---

# 8 report_delivery

Pengiriman otomatis.

```text
id

job_id

channel

recipient

status

sent_at

read_at
```

Channel

```
EMAIL

WHATSAPP

TELEGRAM

DOWNLOAD

```

---

# 9 report_permissions

Hak akses.

```text
id

definition_id

role_id

allow_view

allow_download

allow_schedule
```

---

# 10 report_parameters

Parameter report.

```text
id

definition_id

parameter_name

parameter_type

default_value

required

sort_order
```

Contoh

```
date_from

date_to

school

teacher

student

class

subject

semester

academic_year

```

---

# 11 report_snapshots

Snapshot dashboard.

```text
id

snapshot_date

dashboard_name

snapshot_data JSONB

generated_at
```

---

# 12 report_kpi_snapshots

Snapshot KPI.

```text
id

snapshot_date

kpi_name

kpi_value

target

achievement

created_at
```

---

# 13 report_finance

Ringkasan keuangan.

```text
id

period

gross_income

net_income

tax

refund

membership

invoice

transaction

generated_at
```

---

# 14 report_academic

Ringkasan akademik.

```text
id

period

student

teacher

school

exam

average_score

completion

generated_at
```

---

# 15 report_student

Laporan siswa.

```text
id

student_id

period

average_score

ranking

attendance

learning_time

completion

recommendation

generated_at
```

---

# 16 report_teacher

Laporan guru.

```text
id

teacher_id

period

student_count

material_created

exam_created

average_score

generated_at
```

---

# 17 report_school

Laporan sekolah.

```text
id

school_id

period

student

teacher

exam

completion

average_score

generated_at
```

---

# 18 report_operational

Operasional sistem.

```text
id

period

login

active_user

error

api_request

storage

cpu

memory

generated_at
```

---

# 19 report_audit_logs

Audit report.

```text
id

actor

action

table_name

record_id

old_data JSONB

new_data JSONB

created_at
```

---

# 20 report_distribution_lists

Daftar penerima otomatis.

```text
id

definition_id

recipient_type

recipient

active
```

Contoh

```
Super Admin

Finance

Guru

Sekolah

Owner

```

---

# 21 report_bookmarks

Favorit user.

```text
id

user_id

definition_id

created_at
```

---

# 22 report_comments

Komentar pada laporan.

```text
id

report_history_id

user_id

comment

created_at
```

---

# 23 report_versions

Versi template.

```text
id

template_id

version

layout

created_at
```

---

# 24 report_storage

Penyimpanan file.

```text
id

provider

bucket

path

public_url

checksum

created_at
```

Storage

* Supabase Storage
* S3
* MinIO

---

# Workflow Reporting

```text
User

 │

 ▼

Pilih Report

 │

 ▼

Isi Parameter

 │

 ▼

Generate Job

 │

 ▼

Queue

 │

 ▼

Worker

 │

 ▼

Generate Data

 │

 ▼

Generate PDF/Excel

 │

 ▼

Upload Storage

 │

 ▼

History

 │

 ▼

Download / Email / WhatsApp
```

---

# Jenis Report yang Harus Ada

## Akademik

* Laporan Nilai
* Laporan CBT
* Ranking
* Progress Belajar
* Kehadiran
* Analisis Mata Pelajaran
* Analisis Bab
* Soal Tersulit
* Soal Termudah

---

## Guru

* Aktivitas Guru
* Materi Dibuat
* Soal Dibuat
* Ujian Dibuat
* Performa Siswa

---

## Sekolah

* Performa Sekolah
* Aktivitas Siswa
* Aktivitas Guru
* Nilai Rata-rata
* Kelulusan

---

## Finance

* Pendapatan Harian
* Pendapatan Bulanan
* Invoice
* Membership
* Refund
* Cash Flow
* MRR
* ARR

---

## Membership

* Membership Aktif
* Trial
* Renewal
* Expired
* Conversion

---

## Analytics

* DAU
* WAU
* MAU
* Retention
* Funnel
* Session
* Heatmap

---

## Sistem

* API Usage
* Login
* Error
* Security
* Storage
* Audit

---

# Index Strategy

### report_jobs

```
(status)

(requested_by)

(created_at DESC)
```

### report_histories

```
(user_id)

(generated_at DESC)
```

### report_exports

```
(job_id)

(expired_at)
```

### report_scheduler

```
(next_run)

(active)
```

---

# Partisi

| Table                | Partition |
| -------------------- | --------- |
| report_jobs          | Monthly   |
| report_histories     | Monthly   |
| report_exports       | Monthly   |
| report_delivery      | Monthly   |
| report_audit_logs    | Monthly   |
| report_snapshots     | Yearly    |
| report_kpi_snapshots | Yearly    |

---

# Integrasi dengan Domain Lain

Domain **Reporting** berperan sebagai lapisan penyajian laporan resmi dan mengambil data dari berbagai domain tanpa menjadi sumber data utama:

* **Analytics**: sumber KPI, metrik penggunaan, cohort, funnel, dan aktivitas pengguna.
* **Finance & Membership**: laporan pendapatan, invoice, pembayaran, refund, MRR, ARR, ARPU, dan status membership.
* **CBT Engine**: hasil ujian, analisis soal, distribusi nilai, dan statistik pengerjaan.
* **Learning Material**: progres belajar, penyelesaian materi, dan aktivitas pembelajaran.
* **Notification**: pengiriman laporan otomatis melalui email atau kanal lain sesuai jadwal.
* **CMS**: penyimpanan template visual laporan atau halaman publik jika diperlukan.
* **User & RBAC**: kontrol hak akses terhadap setiap jenis laporan serta audit siapa yang membuat, melihat, dan mengunduh laporan.

## Rekomendasi Enterprise

Untuk target YakinLulus.id dengan ratusan ribu pengguna, saya juga merekomendasikan komponen tambahan di luar tabel inti:

* **Materialized Views** sebagai sumber utama report agar proses generate tidak membebani database transaksi.
* **Background Worker** (misalnya Redis + Asynq/Celery) untuk menjalankan report besar secara asinkron.
* **Object Storage** (Supabase Storage atau S3-compatible) untuk menyimpan hasil PDF/Excel.
* **Data Warehouse** terpisah untuk laporan historis multi-tahun dan analisis Business Intelligence.
* **Template Engine** (HTML → PDF) sehingga format laporan dapat diubah tanpa mengubah kode aplikasi.

Dengan pendekatan ini, domain Reporting menjadi skalabel, mudah diaudit, dan mampu menghasilkan laporan operasional maupun manajerial secara efisien tanpa mengganggu performa sistem transaksi utama.
