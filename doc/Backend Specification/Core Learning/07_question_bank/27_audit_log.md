Berikutnya adalah **27_audit_log.md**. Dokumen ini sangat penting karena seluruh aktivitas pada Question Bank harus **traceable**. Audit log bukan hanya untuk keamanan, tetapi juga untuk **forensik, kepatuhan, debugging, dan quality assurance**.

Untuk YakinLulus.id, saya merekomendasikan **Audit Log** dipisahkan dari **Application Log** dan **Event Log**. Ketiganya memiliki tujuan yang berbeda.

---

````markdown
# 27_audit_log.md

# Question Bank Audit Log Specification

Version : 1.0

---

# 1. Overview

Audit Log mencatat seluruh aktivitas penting
yang terjadi pada Question Bank.

Audit Log digunakan untuk.

- Security
- Compliance
- Investigation
- Debugging
- Accountability
- Change History

Audit Log bersifat immutable.

---

# 2. Objectives

Audit harus mampu menjawab.

Siapa

↓

Melakukan apa

↓

Terhadap data apa

↓

Kapan

↓

Dari mana

↓

Hasilnya bagaimana

---

# 3. Audit Principles

Audit mengikuti prinsip.

- Immutable
- Append Only
- Tamper Resistant
- Traceable
- Searchable
- Retention Policy

---

# 4. Audit Categories

Kategori.

Authentication

Authorization

Question

Review

Import

Export

AI

Storage

System

---

# 5. Question Events

Diaudit.

Question Created

Question Updated

Question Published

Question Archived

Question Restored

Question Deleted

Question Cloned

Question Viewed

---

# 6. Review Events

Diaudit.

Review Assigned

Review Started

Review Approved

Review Rejected

Revision Requested

Review Comment Added

---

# 7. Import Events

Diaudit.

Import Started

Import Completed

Import Failed

Import Cancelled

Batch Imported

---

# 8. Export Events

Diaudit.

Export Requested

Export Generated

Export Downloaded

Export Cancelled

Export Expired

---

# 9. AI Events

Diaudit.

AI Generation Requested

AI Generated

AI Validation Failed

AI Retry

AI Cancelled

---

# 10. Attachment Events

Diaudit.

Upload

Delete

Replace

Download

Thumbnail Generated

---

# 11. Authentication Events

Diaudit.

Login

Logout

Token Refresh

Permission Denied

Session Expired

---

# 12. Authorization Events

Diaudit.

Access Granted

Access Denied

Role Changed

Permission Changed

---

# 13. Audit Record

Minimal field.

- audit_id
- request_id
- transaction_id
- user_id
- role
- action
- aggregate_type
- aggregate_id
- status
- occurred_at

---

# 14. Additional Metadata

Disimpan.

- IP Address
- User Agent
- Device
- Correlation ID
- Session ID
- Service Name

---

# 15. Before After Snapshot

Untuk operasi Update.

Disimpan.

Before

↓

After

↓

Changed Fields

Snapshot dapat berupa JSON.

---

# 16. Severity

Level.

INFO

WARNING

ERROR

CRITICAL

---

# 17. Audit Storage

Database.

audit_log

audit_detail

audit_attachment

---

# 18. Audit Lifecycle

```
Action

↓

Audit Builder

↓

Database

↓

Event

↓

Analytics
```

---

# 19. Retention Policy

Retention.

Operational Audit

2 Tahun

Security Audit

5 Tahun

Archive

Konfigurabel

---

# 20. Search Capability

Audit dapat dicari berdasarkan.

- User
- Question
- Action
- Time
- Severity
- Request ID
- Transaction ID

---

# 21. Data Integrity

Audit tidak boleh diubah.

Perubahan hanya dapat dilakukan melalui
proses archive resmi.

---

# 22. Performance Strategy

Audit ditulis secara asynchronous
menggunakan Outbox atau Job Queue
untuk operasi non-kritis.

Operasi keamanan kritis dapat ditulis
secara synchronous.

---

# 23. Monitoring

Dipantau.

- Audit Volume
- Failed Audit Write
- Missing Audit
- Audit Delay

---

# 24. Security

Audit hanya dapat diakses oleh.

Admin

Security Officer (Future)

Super Admin

---

# 25. Compliance

Audit mendukung.

- Internal Investigation
- Incident Response
- Change Tracking

---

# 26. Performance Target

| Operation | Target |
|------------|---------|
| Audit Write | < 20 ms |
| Audit Search | < 500 ms |
| Audit Detail | < 200 ms |

---

# 27. Disaster Recovery

Audit termasuk data kritikal.

Harus ikut.

- Backup
- PITR
- Replication

---

# 28. Future Roadmap

- Immutable Storage
- Digital Signature
- WORM Storage
- SIEM Integration
- Audit Dashboard
- Compliance Report
````

---

# Rekomendasi Arsitektur

Pisahkan tiga jenis pencatatan berikut agar tanggung jawabnya jelas.

```text
                   User Request
                        │
                        ▼
                Application Service
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
  Audit Log       Application Log    Domain Event
        │               │                │
        ▼               ▼                ▼
 PostgreSQL         Log System      Message Broker
```

Perbedaannya:

| Jenis           | Tujuan                            |
| --------------- | --------------------------------- |
| Audit Log       | Siapa melakukan apa terhadap data |
| Application Log | Debugging aplikasi                |
| Domain Event    | Komunikasi antar modul            |

---

# Penyempurnaan Khusus untuk YakinLulus.id

## 1. Audit per Aggregate

Audit tidak hanya berdasarkan endpoint API, tetapi berdasarkan **Aggregate**.

Contoh:

```text
Question Aggregate
    │
    ├── Create
    ├── Update
    ├── Publish
    ├── Archive
    └── Restore
```

Dengan cara ini, seluruh riwayat perubahan sebuah soal dapat ditampilkan secara kronologis.

---

## 2. Correlation ID dan Request ID

Setiap audit log sebaiknya menyimpan:

* `request_id`
* `correlation_id`
* `transaction_id`

Ketiga identifier ini memungkinkan pelacakan satu aksi pengguna yang melibatkan beberapa service, background job, dan domain event.

---

## 3. Snapshot Perubahan

Untuk operasi update, simpan:

* `before_snapshot`
* `after_snapshot`
* `changed_fields`

Snapshot sebaiknya berupa JSON yang berisi hanya field yang berubah atau versi lengkap sesuai kebutuhan audit. Hal ini mempermudah proses investigasi dan rollback logis tanpa harus membandingkan seluruh record secara manual.

---

## 4. Integrasi dengan Event Architecture

Setelah audit berhasil dicatat, sistem dapat menerbitkan event seperti:

* `AuditRecorded`
* `SecurityEventDetected`
* `ExportDownloaded`

Event tersebut dapat dikonsumsi oleh modul Analytics atau Notification tanpa menambah beban pada transaksi utama.

Dengan strategi ini, Audit Log menjadi komponen observability yang kuat sekaligus tetap terpisah dari logging aplikasi dan mekanisme komunikasi antar layanan.
