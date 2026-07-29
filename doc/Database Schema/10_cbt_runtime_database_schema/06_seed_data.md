Berikut **10_cbt_runtime_database_schema / 06_seed_data.md**.

Dokumen ini mendefinisikan data awal (initial data) yang dibutuhkan oleh CBT Runtime agar sistem dapat berjalan konsisten.

Fokus:

* reference data;
* runtime status;
* event type;
* sync state;
* security classification;
* development/staging bootstrap.

---

````markdown id="cbt06seed"
# 06_seed_data.md

# YakinLulus.id CBT Runtime Seed Data

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Seed data adalah data awal yang wajib tersedia
sebelum CBT Runtime digunakan.

Seed berbeda dengan:

```
Production Data

User Data

Exam Data

Student Data
```

Seed berisi:

```
System Reference Data
```

---

# 2. Seed Data Principle

CBT Runtime menggunakan:

```
Deterministic Seed

+

Environment Aware

+

Version Controlled
```

---

# 3. Seed Categories

Data awal:

```
Session Status

Question Runtime Status

Sync Status

Event Type

Security Event Type

Security Severity

Client Type

Answer Sync Status
```

---

# 4. Session Status Seed

Table:

```
cbt_runtime.session_statuses
```

---

## Data

| Code | Description |
|-|-|
| CREATED | Session dibuat |
| INITIALIZED | Session siap dimulai |
| RUNNING | Sedang berlangsung |
| PAUSED | Dijeda |
| SUBMITTED | Sudah submit |
| COMPLETED | Selesai |
| EXPIRED | Kadaluarsa |
| CANCELLED | Dibatalkan |

---

SQL:

```sql
INSERT INTO cbt_runtime.session_statuses
(
code,
name
)
VALUES

('CREATED','Session Created'),

('INITIALIZED','Session Initialized'),

('RUNNING','Session Running'),

('PAUSED','Session Paused'),

('SUBMITTED','Session Submitted'),

('COMPLETED','Session Completed'),

('EXPIRED','Session Expired'),

('CANCELLED','Session Cancelled');
```

---

# 5. Question Runtime Status Seed

Table:

```
cbt_runtime.question_statuses
```

---

Data:

| Code | Description |
|-|-|
| NOT_VISITED | Belum dibuka |
| OPENED | Sedang dibuka |
| ANSWERED | Sudah dijawab |
| FLAGGED | Ditandai |
| REVIEW | Review ulang |

---

SQL:

```sql
INSERT INTO cbt_runtime.question_statuses
(code,name)

VALUES

('NOT_VISITED','Not Visited'),

('OPENED','Opened'),

('ANSWERED','Answered'),

('FLAGGED','Flagged'),

('REVIEW','Review');
```

---

# 6. Sync Status Seed

Table:

```
cbt_runtime.sync_statuses
```

---

Data:

| Code | Description |
|-|-|
| PENDING | Menunggu sync |
| PROCESSING | Sedang diproses |
| SUCCESS | Berhasil |
| FAILED | Gagal |
| CONFLICT | Konflik |

---

SQL:

```sql
INSERT INTO cbt_runtime.sync_statuses
(code,name)

VALUES

('PENDING','Pending'),

('PROCESSING','Processing'),

('SUCCESS','Success'),

('FAILED','Failed'),

('CONFLICT','Conflict');
```

---

# 7. Runtime Event Type Seed

Table:

```
cbt_runtime.event_types
```

---

## Session Event

```
SESSION_CREATED

SESSION_STARTED

SESSION_PAUSED

SESSION_RESUMED

SESSION_SUBMITTED

SESSION_COMPLETED
```

---

## Question Event

```
QUESTION_LOADED

QUESTION_OPENED

QUESTION_VISITED

QUESTION_FLAGGED
```

---

## Answer Event

```
ANSWER_CREATED

ANSWER_UPDATED

ANSWER_REMOVED

ANSWER_SYNCED
```

---

SQL Example:

```sql
INSERT INTO cbt_runtime.event_types
(code,name)

VALUES

('SESSION_STARTED',
'Student Started Exam'),

('QUESTION_OPENED',
'Question Opened'),

('ANSWER_UPDATED',
'Answer Updated'),

('SESSION_SUBMITTED',
'Exam Submitted');
```

---

# 8. Security Severity Seed

Table:

```
cbt_runtime.security_severities
```

---

Data:

| Code | Description |
|-|-|
| LOW | Informational |
| MEDIUM | Warning |
| HIGH | Suspicious |
| CRITICAL | Serious violation |

---

SQL:

```sql
INSERT INTO cbt_runtime.security_severities
(code,name)

VALUES

('LOW','Low'),

('MEDIUM','Medium'),

('HIGH','High'),

('CRITICAL','Critical');
```

---

# 9. Security Event Type Seed

Table:

```
cbt_runtime.security_event_types
```

---

Data:

```
TAB_SWITCH

FULLSCREEN_EXIT

MULTIPLE_DEVICE

NETWORK_DISCONNECT

CLOCK_CHANGED

SESSION_TOKEN_INVALID

UNAUTHORIZED_ACCESS
```

---

SQL:

```sql
INSERT INTO cbt_runtime.security_event_types
(code,name)

VALUES

('TAB_SWITCH',
'Browser Tab Switch'),

('FULLSCREEN_EXIT',
'Fullscreen Exit'),

('MULTIPLE_DEVICE',
'Multiple Device Login'),

('NETWORK_DISCONNECT',
'Network Disconnect'),

('CLOCK_CHANGED',
'Client Clock Changed');
```

---

# 10. Client Type Seed

Table:

```
cbt_runtime.client_types
```

---

Data:

| Code | Description |
|-|-|
| WEB | Browser |
| ANDROID | Android App |
| IOS | iOS App |
| DESKTOP | Desktop Client |

---

SQL:

```sql
INSERT INTO cbt_runtime.client_types
(code,name)

VALUES

('WEB','Web Browser'),

('ANDROID','Android'),

('IOS','iOS'),

('DESKTOP','Desktop Application');
```

---

# 11. Answer Type Seed

Future ready.

Table:

```
cbt_runtime.answer_types
```

---

Data:

```
MULTIPLE_CHOICE

ESSAY

NUMERIC

UPLOAD
```

---

SQL:

```sql
INSERT INTO cbt_runtime.answer_types
(code,name)

VALUES

('MULTIPLE_CHOICE',
'Multiple Choice'),

('ESSAY',
'Essay'),

('NUMERIC',
'Numeric Answer'),

('UPLOAD',
'File Upload');
```

---

# 12. Device Trust Level Seed

Untuk anti-cheat.

Table:

```
cbt_runtime.device_trust_levels
```

---

Data:

```
TRUSTED

UNKNOWN

SUSPICIOUS

BLOCKED
```

---

# 13. Environment Seed

Environment:

```
development

staging

production
```

---

Tidak boleh:

```
test data masuk production
```

---

# 14. Development Dummy Data

Development boleh memiliki:

```
Demo Session

Demo Event

Demo Answer
```

---

Contoh:

```
User:

student_demo


Exam:

TRYOUT_DEMO


Session:

RUNNING
```

---

# 15. Production Seed Restriction

Production hanya:

```
Reference Data
```

---

Tidak boleh:

```
Dummy Student

Dummy Exam

Dummy Answer
```

---

# 16. Seed Migration Structure

Directory:

```
database/

seed/

├── 001_session_status.sql

├── 002_event_types.sql

├── 003_security_types.sql

└── 004_client_types.sql

```

---

# 17. Seed Execution Order

Urutan:

```
1. Status

2. Type Reference

3. Event Reference

4. Security Reference

5. Runtime Configuration
```

---

# 18. Seed Validation

Setelah seed:

Check:

```sql
SELECT COUNT(*)
FROM session_statuses;
```

---

Expected:

```
>= 8 rows
```

---

# 19. Seed Versioning

Setiap seed memiliki:

```
seed_version
```

---

Contoh:

```
session_status_v1

event_type_v1
```

---

# 20. Final Seed Architecture

```

Migration

   |

Schema Creation

   |

Seed Reference Data

   |

Application Startup

   |

CBT Runtime Ready


```

---

# 21. Conclusion

Seed data CBT Runtime menyediakan:

- status lifecycle;
- event classification;
- security classification;
- sync control;
- environment consistency.

Dengan seed ini CBT Runtime siap digunakan
untuk development, testing, staging, dan production.
````

---

