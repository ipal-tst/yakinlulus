```markdown id="d8s4k1"
# 08_database_security.md

# PostgreSQL Database Security Architecture

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan strategi keamanan database PostgreSQL untuk platform YakinLulus.

Tujuan:

- Melindungi data pengguna.
- Mencegah akses tidak sah.
- Mengontrol hak akses database.
- Melindungi data sensitif.
- Mendukung audit dan compliance.
- Menyiapkan database production yang aman.

---

# 2. Security Philosophy

YakinLulus menggunakan prinsip:

```

Security by Design

```

Keamanan harus dibangun sejak:

```

Architecture

↓

Database Design

↓

Application Layer

↓

Infrastructure

```

---

Prinsip utama:

```

Least Privilege

Defense in Depth

Zero Trust

Data Ownership

Audit Everything

```

---

# 3. Database Security Layer

Security database terdiri dari:

```

Application Security

```
    ↓
```

Database Access Control

```
    ↓
```

Schema Security

```
    ↓
```

Table Security

```
    ↓
```

Column Security

```
    ↓
```

Data Protection

```
    ↓
```

Audit Monitoring

```

---

# 4. PostgreSQL Security Architecture

Struktur:

```

PostgreSQL Instance

│

├── Database

│

├── Schema

│

├── Role

│

├── Permission

│

├── Table

│

├── Row Security

│

└── Audit

```

---

# 5. Database Separation Strategy

Environment dipisahkan:

```

Development Database

Testing Database

Staging Database

Production Database

```

---

Tidak:

```

Developer

```
    ↓
```

Production Database

```

---

# 6. Database User Strategy

PostgreSQL menggunakan beberapa role.

---

## 6.1 Database Owner

Role:

```

db_owner

```

Tugas:

- Schema management.
- Migration.
- Database administration.

Hak:

```

CREATE

ALTER

DROP

```

---

## 6.2 Application Role

Role:

```

app_runtime

```

Digunakan aplikasi.

Hak:

```

SELECT

INSERT

UPDATE

DELETE

```

---

Tidak memiliki:

```

CREATE

ALTER

DROP

```

---

## 6.3 Read Only Role

Role:

```

analytics_reader

```

Untuk:

- Reporting.
- Dashboard.
- BI.

Hak:

```

SELECT ONLY

```

---

## 6.4 Migration Role

Role:

```

migration_runner

```

Digunakan CI/CD.

Hak:

```

CREATE

ALTER

INDEX

CONSTRAINT

```

---

# 7. Role Hierarchy

```

postgres

```
|

|
```

db_owner

```
|

|
```

migration_runner

```
|

|
```

app_runtime

```
|

|
```

readonly_role

```

---

# 8. Least Privilege Principle

Aplikasi hanya mendapatkan hak yang diperlukan.

Contoh:

Aplikasi:

```

INSERT question

```

Tidak berarti:

```

DROP TABLE question

```

---

# 9. Schema Permission

Setiap domain memiliki schema:

```

academic

question

cbt

learning

identity

organization

media

ai

analytics

system

````

---

Permission:

Contoh:

```sql
GRANT USAGE
ON SCHEMA question
TO app_runtime;
````

---

# 10. Domain Ownership

Setiap schema memiliki owner:

| Schema       | Owner                |
| ------------ | -------------------- |
| academic     | academic_service     |
| question     | question_service     |
| cbt          | cbt_service          |
| learning     | learning_service     |
| identity     | identity_service     |
| organization | organization_service |
| media        | media_service        |
| ai           | ai_service           |
| analytics    | analytics_service    |
| system       | system_admin         |

---

# 11. Table Permission

Default:

```
DENY ALL
```

Kemudian diberikan:

```
GRANT REQUIRED ACCESS
```

---

Contoh:

```sql
GRANT SELECT,INSERT,UPDATE
ON question.question
TO app_runtime;
```

---

# 12. Sensitive Data Classification

Data dikategorikan:

```
Public

Internal

Confidential

Restricted
```

---

# 13. Data Classification

## Public

Contoh:

```
Subject Name

Course Title
```

---

## Internal

Contoh:

```
Learning Progress

Analytics Metric
```

---

## Confidential

Contoh:

```
Student Profile

Exam Result
```

---

## Restricted

Contoh:

```
Password Hash

Authentication Token

AI API Key
```

---

# 14. Password Security

Password tidak pernah disimpan plain text.

Salah:

```
password = "123456"
```

---

Benar:

```
password_hash
```

---

Menggunakan:

```
Argon2id

atau

bcrypt
```

---

Database hanya menyimpan:

```
Hash

Salt

Metadata
```

---

# 15. Credential Protection

Credential database:

Tidak boleh:

```
source code

git repository

frontend
```

---

Disimpan pada:

```
Environment Variable

Secret Manager
```

---

Contoh:

```
DATABASE_URL

DB_PASSWORD

DB_USER
```

---

# 16. Connection Security

Production wajib:

```
SSL/TLS Connection
```

---

Konfigurasi:

```conf
ssl = on
```

---

Client:

```conf
sslmode=require
```

---

# 17. Network Security

Database tidak expose public.

Salah:

```
Internet

   |

PostgreSQL
```

---

Benar:

```
Application Server

       |

Private Network

       |

PostgreSQL
```

---

# 18. Firewall Rule

Allow hanya:

```
Application Server IP

Migration Server IP

Backup Server IP
```

---

Block:

```
Public Internet
```

---

# 19. Row Level Security (RLS)

Digunakan untuk:

```
Multi Tenant Security
```

---

Contoh:

Organization A tidak boleh melihat:

```
Organization B Data
```

---

# 20. Organization Isolation

Contoh tabel:

```sql
question.question
```

memiliki:

```sql
organization_id
```

---

Policy:

```sql
CREATE POLICY organization_filter
ON question.question
USING
(
organization_id = current_setting('app.organization_id')::uuid
);
```

---

# 21. Tenant Security Rule

Semua query tenant-aware harus memiliki:

```
organization_id filter
```

---

Tidak:

```sql
SELECT *
FROM question.question;
```

---

Benar:

```sql
SELECT *
FROM question.question
WHERE organization_id = ?;
```

---

# 22. Column Security

Kolom sensitif:

Contoh:

```
password_hash

token

secret_key
```

---

Tidak boleh:

```
SELECT *
```

---

Gunakan:

```sql
SELECT username,email
```

---

# 23. Encryption Strategy

Data encryption dibagi:

```
Encryption At Rest

Encryption In Transit
```

---

# 24. Encryption At Rest

Melindungi:

```
Database Storage

Backup

Snapshot
```

---

Menggunakan:

* Disk encryption.
* Cloud encryption.
* Encrypted volume.

---

# 25. Encryption In Transit

Semua koneksi:

```
TLS
```

---

Melindungi:

```
Application

↓

Database
```

---

# 26. Backup Security

Backup harus:

* Encrypted.
* Access controlled.
* Audited.

---

Tidak:

```
backup.sql

public storage
```

---

# 27. Audit Logging

Semua aktivitas penting dicatat.

Contoh:

```
LOGIN

DATA CHANGE

SCHEMA CHANGE

PERMISSION CHANGE
```

---

# 28. Audit Table

Schema:

```
system
```

Table:

```
audit_log
```

---

Structure:

```sql
CREATE TABLE system.audit_log
(
id UUID PRIMARY KEY,

user_id UUID,

action VARCHAR(50),

entity VARCHAR(100),

entity_id UUID,

timestamp TIMESTAMP,

metadata JSONB
);
```

---

# 29. Database Activity Monitoring

Monitor:

* Failed login.
* Suspicious query.
* Permission escalation.
* Large export.
* Schema change.

---

# 30. SQL Injection Protection

Database security juga bergantung aplikasi.

Wajib:

```
Parameterized Query
```

---

Tidak:

```python
query =
"SELECT * FROM user WHERE id="
+ user_input
```

---

Benar:

```python
query =
"SELECT * FROM user WHERE id=%s"
```

---

# 31. ORM Security

Jika menggunakan ORM:

contoh:

* Django ORM.
* SQLAlchemy.
* GORM.

Tetap:

* Validasi input.
* Hindari raw query tidak aman.

---

# 32. Migration Security

Migration production hanya:

```
migration_runner
```

---

Tidak:

```
app_runtime
```

---

Karena aplikasi tidak boleh:

```
ALTER TABLE

DROP TABLE
```

---

# 33. Extension Security

Extension yang diperbolehkan:

```
pgcrypto

pg_trgm

vector
```

---

Tidak install extension sembarangan.

---

# 34. Database Monitoring

Monitor:

## Performance

```
Slow Query

Lock

Connection
```

---

## Security

```
Unauthorized Access

Failed Login

Privilege Change
```

---

# 35. Connection Limit

Setiap role memiliki limit.

Contoh:

```sql
ALTER ROLE app_runtime
CONNECTION LIMIT 100;
```

---

Tujuan:

Mencegah:

```
Connection Exhaustion Attack
```

---

# 36. Query Timeout

Production:

Set:

```
statement_timeout
```

---

Contoh:

```sql
SET statement_timeout='30s';
```

---

Mencegah:

```
Long Running Query
```

---

# 37. Data Export Control

Export besar harus:

```
Audited

Authorized

Logged
```

---

Tidak:

```
SELECT seluruh student data
```

---

# 38. Security Backup Testing

Secara berkala:

```
Restore Backup

Check Encryption

Validate Access
```

---

# 39. Security Review Checklist

Sebelum Production:

## Access

* Role sudah benar.
* Least privilege diterapkan.

## Network

* Database tidak public.
* SSL aktif.

## Data

* Sensitive data terlindungi.

## Audit

* Logging aktif.

## Backup

* Backup terenkripsi.

---

# 40. Future Security Enhancement

Mendukung:

```
Database Activity Monitoring

Vault Integration

Secrets Manager

Column Encryption

Zero Trust Database Access

Compliance Reporting
```

---

# 41. Final Database Security Rule

YakinLulus Security Principle:

```
No direct production access.

Every user has minimum privilege.

Sensitive data is protected.

Every important action is recorded.

Security is enforced at multiple layers.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Database Security Architecture
```

Digunakan untuk:

* Production Hardening
* DevOps Implementation
* Security Audit
* Compliance Preparation
* Infrastructure Deployment

```

---

Tahap berikutnya yang sesuai:

```

09_database_monitoring.md

```

Karena setelah **security**, database architecture perlu ditutup dengan:

- monitoring metrics,
- slow query detection,
- PostgreSQL health monitoring,
- alerting,
- performance observability,
- operational dashboard.
```
