```markdown id="s7k4m2"
# 11_system_ldm.md

# Logical Data Model
## Domain : System Management

Version : 1.0

---

# Tujuan

System Domain merupakan domain inti yang menyediakan kemampuan teknis dan operasional untuk seluruh platform YakinLulus.

Domain ini bukan domain bisnis pendidikan, tetapi menjadi **foundation layer** yang mendukung seluruh domain lain.

System Domain bertanggung jawab terhadap:

- Authentication Support
- Authorization Support
- Configuration Management
- Audit Trail
- Notification System
- Background Processing
- Integration Management
- Feature Management
- Security Monitoring
- System Logging
- File Processing
- Scheduler Management

---

# Prinsip Utama

System Domain adalah:

```

Platform Infrastructure Layer

```

Semua domain lain bergantung pada System Domain.

Contoh:

```

CBT Engine

↓

Notification

↓

System Domain

```
```

AI Processing

↓

Background Job

↓

System Domain

```

---

# Aggregate Root

```

System Configuration

```

dan

```

System Audit Event

```

---

# Entity Hierarchy

```

System Configuration
│
├── Configuration Group
├── Configuration Value
│
System Security
│
├── User Session
├── Access Token
├── Login History
├── Security Event
│
System Operation
│
├── Background Job
├── Scheduler
├── Queue Task
├── Worker
│
System Communication
│
├── Notification
├── Notification Template
├── Notification Delivery
│
System Integration
│
├── External Service
├── API Client
├── Webhook
├── Integration Log
│
System Governance
│
├── Audit Event
├── Activity Log
├── Data Change Log
│
System Feature
│
├── Feature Flag
├── Permission
├── Role Permission
│
System Monitoring
│
├── Error Log
├── Performance Metric
└── Health Check

```

---

# Logical Entity List

| Entity | Purpose |
|-|-|
| System Configuration | Konfigurasi sistem |
| Configuration Group | Kelompok konfigurasi |
| Configuration Value | Nilai konfigurasi |
| User Session | Session pengguna |
| Access Token | Token akses |
| Login History | Riwayat login |
| Security Event | Kejadian keamanan |
| Background Job | Proses background |
| Scheduler | Penjadwalan |
| Queue Task | Antrian pekerjaan |
| Worker | Eksekutor proses |
| Notification | Notifikasi |
| Notification Template | Template pesan |
| Notification Delivery | Status pengiriman |
| External Service | Integrasi eksternal |
| API Client | Client API |
| Webhook | Event callback |
| Integration Log | Log integrasi |
| Audit Event | Audit sistem |
| Activity Log | Aktivitas user |
| Data Change Log | Perubahan data |
| Feature Flag | Fitur dinamis |
| Permission | Hak akses |
| Role Permission | Mapping akses |
| Error Log | Error aplikasi |
| Performance Metric | Monitoring |
| Health Check | Status layanan |

---

# Aggregate Root

# System Configuration

## Business Purpose

Mengelola konfigurasi aplikasi secara dinamis tanpa deploy ulang.

Contoh:

```

Maximum Upload Size

CBT Timer Default

AI Feature Enable

Maintenance Mode

```

---

## Candidate Attribute

```

ID

Configuration Key

Configuration Group ID

Value

Data Type

Environment

Description

Updated By

Updated At

```

---

# Configuration Group

## Purpose

Mengelompokkan konfigurasi.

---

## Candidate Attribute

```

ID

Code

Name

Description

```

---

Contoh:

```

CBT

AI

Media

Security

Email

```

---

# User Session

## Business Purpose

Mengelola sesi login pengguna.

---

## Candidate Attribute

```

ID

User ID

Session Token

Device

IP Address

Login At

Last Activity

Expired At

Status

```

---

Status:

```

Active

Expired

Revoked

```

---

# Access Token

## Business Purpose

Token autentikasi.

---

## Candidate Attribute

```

ID

User ID

Token

Token Type

Issued At

Expired At

Revoked At

```

---

Contoh:

```

JWT Access Token

Refresh Token

```

---

# Login History

## Candidate Attribute

```

ID

User ID

IP Address

Device

Browser

Login Time

Status

```

---

# Security Event

## Business Purpose

Catatan aktivitas keamanan.

---

## Candidate Attribute

```

ID

User ID

Event Type

Severity

IPAddress

Metadata

Created At

```

---

Contoh:

```

Multiple Failed Login

Suspicious Activity

Token Abuse

```

---

# Background Job

## Business Purpose

Mengelola proses asynchronous.

---

## Candidate Attribute

```

ID

Job Type

Reference Domain

Reference ID

Status

Priority

Started At

Completed At

```

---

Contoh:

```

Generate Question AI

Process Video

Generate Report

```

---

# Scheduler

## Purpose

Penjadwalan otomatis.

---

## Candidate Attribute

```

ID

Job ID

Schedule Expression

Next Run

Last Run

Status

```

---

Contoh:

```

Daily Analytics

Weekly Report

```

---

# Queue Task

## Purpose

Antrian pekerjaan.

---

## Candidate Attribute

```

ID

Queue Name

Payload

Priority

Status

Created At

```

---

Status:

```

Waiting

Processing

Completed

Failed

```

---

# Worker

## Purpose

Eksekutor task.

---

## Candidate Attribute

```

ID

Worker Name

Type

Status

Last Heartbeat

```

---

# Notification

## Business Purpose

Mengelola pesan sistem.

---

## Candidate Attribute

```

ID

User ID

Organization ID

Notification Type

Title

Message

Reference Type

Reference ID

Status

Created At

```

---

Contoh:

```

Exam Started

New Material Available

AI Recommendation

```

---

# Notification Template

## Candidate Attribute

```

ID

Code

Channel

Template

Version

Status

```

---

Channel:

```

Email

Push Notification

SMS

WhatsApp

```

---

# Notification Delivery

## Candidate Attribute

```

ID

Notification ID

Channel

Provider

Status

Sent At

Failed Reason

```

---

# External Service

## Business Purpose

Integrasi layanan eksternal.

---

## Candidate Attribute

```

ID

Service Name

Provider

Endpoint

Credential Reference

Status

```

---

Contoh:

```

Email Provider

Payment Gateway

AI Provider

```

---

# API Client

## Candidate Attribute

```

ID

Client Name

API Key

Secret

Permission

Status

```

---

# Webhook

## Candidate Attribute

```

ID

Event Type

Endpoint

Secret

Status

```

---

# Integration Log

## Candidate Attribute

```

ID

Service ID

Request

Response

Status

Created At

```

---

# Audit Event

## Business Purpose

Catatan permanen semua aktivitas penting.

---

## Candidate Attribute

```

ID

User ID

Action

Domain

Entity

Entity ID

Old Value

New Value

Timestamp

```

---

Contoh:

```

Admin changed exam setting

```

---

# Activity Log

## Candidate Attribute

```

ID

User ID

Activity

Reference

Timestamp

```

---

# Data Change Log

## Candidate Attribute

```

ID

Table Name

Record ID

Operation

Before Data

After Data

Changed By

Changed At

```

---

# Feature Flag

## Business Purpose

Mengaktifkan fitur tanpa deployment.

---

## Candidate Attribute

```

ID

Feature Key

Description

Status

Environment

```

---

Contoh:

```

AI_TUTOR_ENABLED=true

CBT_OFFLINE_MODE=false

```

---

# Permission

## Candidate Attribute

```

ID

Code

Name

Description

```

---

Contoh:

```

QUESTION_CREATE

EXAM_PUBLISH

USER_MANAGE

```

---

# Role Permission

## Candidate Attribute

```

ID

Role ID

Permission ID

```

---

# Error Log

## Candidate Attribute

```

ID

Service

Error Code

Message

Stack Trace

Timestamp

```

---

# Performance Metric

## Candidate Attribute

```

ID

Service

Metric Name

Value

Timestamp

```

---

Contoh:

```

API Response Time

Database Query Time

```

---

# Health Check

## Candidate Attribute

```

ID

Service Name

Status

Response Time

Checked At

```

---

# Relationship

```

Configuration Group

1

↓

N

System Configuration

User

1

↓

N

User Session

User

1

↓

N

Access Token

User

1

↓

N

Login History

Background Job

1

↓

N

Queue Task

Scheduler

1

↓

1

Background Job

Notification

1

↓

N

Notification Delivery

External Service

1

↓

N

Integration Log

Role

1

↓

N

Role Permission

Permission

1

↓

N

Role Permission

```

---

# Ownership

| Entity | Owner |
|-|-|
| System Configuration | System Domain |
| Configuration Group | System Domain |
| Configuration Value | System Domain |
| User Session | System Domain |
| Access Token | System Domain |
| Login History | System Domain |
| Security Event | System Domain |
| Background Job | System Domain |
| Scheduler | System Domain |
| Queue Task | System Domain |
| Worker | System Domain |
| Notification | System Domain |
| Notification Template | System Domain |
| Notification Delivery | System Domain |
| External Service | System Domain |
| API Client | System Domain |
| Webhook | System Domain |
| Integration Log | System Domain |
| Audit Event | System Domain |
| Activity Log | System Domain |
| Data Change Log | System Domain |
| Feature Flag | System Domain |
| Permission | System Domain |
| Role Permission | System Domain |
| Error Log | System Domain |
| Performance Metric | System Domain |
| Health Check | System Domain |

---

# Cross Domain Reference

System Domain digunakan oleh:

- User Management
- Organization
- Question Bank
- Learning Resource
- Learning
- CBT Engine
- AI
- Analytics
- Media

---

# Business Constraint

- Audit Event bersifat immutable.
- Security log tidak boleh dihapus.
- Token memiliki masa berlaku.
- Configuration harus memiliki version control.
- Feature Flag harus dapat diaktifkan per environment.
- Background Job harus memiliki retry mechanism.
- Notification harus memiliki delivery tracking.
- Credential eksternal tidak disimpan plaintext.
- Error log harus memiliki retention policy.

---

# Normalization

Target:

```

3NF

```

Namun beberapa tabel menggunakan:

```

JSONB

```

untuk:

- configuration value,
- metadata,
- payload,
- log detail.

---

# Lifecycle

## Background Job

```

Created

↓

Queued

↓

Running

↓

Completed

↓

Failed

↓

Retry / Archived

```

---

## Notification

```

Created

↓

Queued

↓

Sent

↓

Delivered

↓

Read

```

---

## Feature Flag

```

Created

↓

Disabled

↓

Testing

↓

Enabled

↓

Deprecated

```

---

# Design Notes

## 1. Foundation Domain

System Domain bukan domain bisnis.

Tetapi semua domain membutuhkan:

```

Authentication

Authorization

Audit

Notification

Background Processing

```

---

# 2. Security First

Untuk platform edukasi besar:

Semua aktivitas sensitif harus tercatat.

Contoh:

```

Admin delete question

Teacher publish exam

Student login

AI generate content

```

---

# 3. Async Processing Ready

Banyak proses YakinLulus membutuhkan background worker:

```

AI Generation

Video Processing

Report Generation

Analytics Calculation

Email Notification

```

Flow:

```

Request

↓

Queue

↓

Worker

↓

Result

```

---

# 4. Feature Flag Ready

Memungkinkan:

```

AI Tutor

Beta Testing

Offline CBT

Premium Feature

```

tanpa perubahan kode.

---

# 5. Multi Environment Ready

Mendukung:

```

Development

Testing

Staging

Production

```

dengan konfigurasi berbeda.

---

# 6. Future Ready

Model ini mendukung:

- Microservice Architecture
- API Gateway
- Distributed System
- Kubernetes Deployment
- Observability Stack
- Zero Downtime Deployment
- Enterprise Security
- SSO Integration
- OAuth Provider
- Multi Region Deployment
- Disaster Recovery
- Compliance Audit
```

Catatan akhir domain:

Dengan selesai `11_system_ldm.md`, maka **Entity Catalog Domain LDM YakinLulus sudah lengkap**:

```
01 Master Academic
02 Question Bank
03 Learning Resource
04 CBT Engine
05 User Management
06 Learning
07 Organization
08 Media
09 AI
10 Analytics
11 System
```

Tahap berikutnya secara arsitektur sebaiknya masuk ke:

```
12_database_physical_design.md
```

karena seluruh logical model sudah tersedia.

Di tahap tersebut baru kita turunkan:

* PostgreSQL schema
* table naming convention
* primary key strategy
* foreign key
* index strategy
* partitioning
* JSONB usage
* audit table
* soft delete
* multi tenant column
* migration strategy

Ini akan menjadi jembatan dari **LDM → ERD → implementasi database nyata**.
