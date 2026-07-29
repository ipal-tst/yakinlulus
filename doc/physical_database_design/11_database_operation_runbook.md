```markdown id="op11db7"
# 11_database_operation_runbook.md

# PostgreSQL Database Operation Runbook

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan prosedur operasional database PostgreSQL untuk platform YakinLulus.

Tujuan:

- Menstandarkan aktivitas operasional database.
- Mengurangi human error.
- Memastikan database production berjalan stabil.
- Menjadi panduan troubleshooting.
- Menjadi referensi DBA dan DevOps.

---

# 2. Scope

Runbook mencakup:

```

Database Deployment

Database Maintenance

Monitoring

Backup

Recovery

Performance Tuning

Incident Handling

Security Operation

```

---

# 3. Database Operational Principle

YakinLulus menggunakan prinsip:

```

Automation First

Documentation First

Least Privilege

Change Controlled

Audit Everything

```

---

# 4. Operational Responsibility

## Database Administrator

Bertanggung jawab:

- Database availability.
- Backup.
- Recovery.
- Performance.
- Security.

---

## Backend Engineer

Bertanggung jawab:

- Migration.
- Query optimization.
- Schema change.

---

## DevOps Engineer

Bertanggung jawab:

- Infrastructure.
- Monitoring.
- Deployment pipeline.

---

# 5. Environment Management

Environment:

```

Development

↓

Testing

↓

Staging

↓

Production

```

---

Rule:

Tidak boleh:

```

Development

↓

Direct Production Change

```

---

# 6. Daily Database Checklist

Dilakukan setiap hari.

---

## Availability Check

Pastikan:

```

Database reachable

Connection successful

Application healthy

````

---

Command:

```sql
SELECT now();
````

---

Expected:

```
Current timestamp returned
```

---

# 7. Connection Health Check

Query:

```sql
SELECT
count(*)
FROM pg_stat_activity;
```

---

Periksa:

```
Active Connection

Idle Connection

Maximum Connection
```

---

Alert:

```
Connection usage >80%
```

---

# 8. Database Resource Check

Monitor:

```
CPU

Memory

Disk

IO

Network
```

---

Critical:

```
Disk >90%

Memory >90%

CPU >90%
```

---

# 9. Storage Check

Query:

```sql
SELECT
pg_size_pretty(
pg_database_size(current_database())
);
```

---

Monitor:

```
Database Growth

Table Growth

Index Growth
```

---

# 10. Table Health Check

Query:

```sql
SELECT
relname,
n_live_tup,
n_dead_tup
FROM pg_stat_user_tables;
```

---

Periksa:

```
Dead Tuple

Vacuum Status

Table Growth
```

---

# 11. Vacuum Operation

PostgreSQL menggunakan:

```
MVCC
```

---

Maintenance:

```sql
VACUUM ANALYZE;
```

---

Tujuan:

* Membersihkan dead row.
* Memperbarui statistik query planner.

---

# 12. Autovacuum Check

Pastikan:

```
autovacuum = on
```

---

Check:

```sql
SHOW autovacuum;
```

---

Expected:

```
on
```

---

# 13. Slow Query Investigation

Sumber:

```
pg_stat_statements
```

---

Query:

```sql
SELECT
query,
mean_exec_time,
calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

Analisa:

```
High Frequency Query

High Duration Query

High IO Query
```

---

# 14. Query Optimization Procedure

Flow:

```
Identify Query

↓

EXPLAIN ANALYZE

↓

Check Index

↓

Optimize Query

↓

Measure Result
```

---

Contoh:

```sql
EXPLAIN ANALYZE
SELECT *
FROM question.question
WHERE subject_id='xxx';
```

---

# 15. Index Maintenance

Check index:

```sql
SELECT
*
FROM pg_stat_user_indexes;
```

---

Review:

```
Unused Index

Missing Index

Large Index
```

---

# 16. Database Backup Operation

## Backup Verification

Check:

```
Last Backup Time

Backup Status

Backup Size
```

---

Expected:

```
Latest backup available
```

---

# 17. Manual Backup Procedure

Command:

```bash
pg_dump \
-d yakinlulus \
-F c \
-f backup.dump
```

---

Verify:

```
File created

Size reasonable

Restore tested
```

---

# 18. Restore Procedure

Flow:

```
Stop Application

↓

Prepare Database

↓

Restore Backup

↓

Replay WAL

↓

Validate Data

↓

Start Application
```

---

# 19. Migration Deployment Procedure

Before migration:

Checklist:

```
Backup Database

Review Migration

Test Staging

Prepare Rollback
```

---

Deployment:

```
Run Migration

↓

Validate Schema

↓

Deploy Application

↓

Monitor
```

---

# 20. Migration Failure Handling

Jika gagal:

```
Stop Deployment

↓

Analyze Error

↓

Rollback

atau

Fix Migration
```

---

Tidak:

```
Manual Database Editing
```

---

# 21. Schema Change Procedure

Perubahan schema:

harus melalui:

```
Migration File

Code Review

Testing

Deployment
```

---

Tidak:

```
ALTER TABLE Production Manual
```

---

# 22. User Access Management

Tambah user:

Flow:

```
Request

↓

Approval

↓

Create Role

↓

Grant Permission

↓

Audit
```

---

# 23. Database Role Check

Review:

```sql
\du
```

---

Pastikan:

```
No Excess Privilege
```

---

# 24. Security Audit Procedure

Check:

```
Failed Login

Privilege Change

DDL Change

Suspicious Query
```

---

Review:

```
Weekly
```

---

# 25. Incident Classification

Severity:

## SEV-1

Critical:

```
Database Down

Data Loss

Security Breach
```

---

## SEV-2

High:

```
Performance Degradation

Replication Issue
```

---

## SEV-3

Normal:

```
Minor Error

Optimization Needed
```

---

# 26. Database Down Incident

Procedure:

```
Detect Alert

↓

Verify Database Status

↓

Check Infrastructure

↓

Recover Service

↓

Validate Application
```

---

# 27. Connection Exhaustion Incident

Symptom:

```
Too many connections
```

---

Investigation:

```sql
SELECT
state,
count(*)
FROM pg_stat_activity
GROUP BY state;
```

---

Action:

```
Terminate Idle Connection

Increase Pool Limit

Fix Application Leak
```

---

# 28. High CPU Incident

Investigation:

```
Check Running Query

Check Locks

Check Resource Usage
```

---

Action:

```
Terminate Bad Query

Optimize Query

Scale Resource
```

---

# 29. Storage Full Incident

Symptom:

```
Disk Full
```

---

Immediate Action:

```
Stop Non Critical Job

Remove Temporary Data

Expand Storage
```

---

Long Term:

```
Archive Data

Review Growth
```

---

# 30. Lock Problem Incident

Check:

```sql
SELECT *
FROM pg_locks;
```

---

Action:

```
Identify Blocking Query

Terminate Transaction

Fix Application Transaction
```

---

# 31. Replication Incident

Check:

```
Replica Status

Replication Lag

WAL Status
```

---

Action:

```
Restart Replica

Rebuild Replica

Investigate WAL
```

---

# 32. Disaster Recovery Procedure

Flow:

```
Incident

↓

Declare Disaster

↓

Prepare Recovery Environment

↓

Restore Backup

↓

Replay WAL

↓

Validate

↓

Production Restore
```

---

# 33. Database Maintenance Window

Maintenance dilakukan:

```
Scheduled

Documented

Approved
```

---

Contoh:

```
Sunday

02:00 - 04:00
```

---

# 34. Maintenance Activities

Meliputi:

```
VACUUM

ANALYZE

Index Maintenance

Database Upgrade

Security Patch
```

---

# 35. PostgreSQL Upgrade Procedure

Flow:

```
Backup

↓

Test Upgrade

↓

Upgrade Staging

↓

Upgrade Production

↓

Validation
```

---

# 36. Extension Management

Extension:

```
pgcrypto

pg_trgm

vector
```

---

Perubahan extension harus:

```
Reviewed

Migrated

Tested
```

---

# 37. Operational Documentation

Setiap perubahan dicatat:

```
Date

Operator

Change

Reason

Result
```

---

# 38. Production Change Management

Semua perubahan:

```
Ticket

Approval

Execution

Verification

Documentation
```

---

# 39. Monitoring Escalation

Alert:

```
Monitoring

↓

On Call Engineer

↓

Database Engineer

↓

Incident Manager
```

---

# 40. Database Health Report

Weekly report:

Berisi:

```
Availability

Performance

Growth

Backup Status

Security Event

Optimization
```

---

# 41. Monthly Database Review

Review:

```
Capacity

Cost

Performance

Security

Architecture
```

---

# 42. Operational Metrics

Metric utama:

| Metric            | Target   |
| ----------------- | -------- |
| Availability      | >99.5%   |
| Backup Success    | 100%     |
| Failed Migration  | 0        |
| Critical Incident | Minimum  |
| Restore Test      | Periodic |

---

# 43. Future Automation

Automation yang disiapkan:

```
Automatic Backup

Automatic Health Check

Auto Alert

Migration Pipeline

Performance Recommendation

AI Assisted DBA
```

---

# 44. Final Database Operation Principle

YakinLulus Database Operation Rule:

```
Production database is managed, not manually controlled.

Every change must be traceable.

Every failure must have recovery path.

Every operational activity must be documented.

Reliability is a continuous process.
```

---

# Status

Document:

```
APPROVED
```

Role:

```
Database Operational Governance
```

Digunakan untuk:

* DBA Operation
* DevOps Workflow
* Production Support
* Incident Response
* System Reliability

```

---

Dengan ini folder **Database Architecture** sudah lengkap:

```

01_postgresql_architecture.md
02_schema_design.md
03_table_design.md
04_indexing_strategy.md
05_constraint_strategy.md
06_migration_strategy.md
07_backup_recovery_strategy.md
08_database_security.md
09_database_monitoring.md
10_database_scaling_strategy.md
11_database_operation_runbook.md

```

Tahap dokumentasi berikutnya yang paling tepat adalah masuk ke **Backend Architecture**, karena database layer sudah selesai.

Struktur berikutnya yang saya rekomendasikan:

```

Backend_Architecture/

01_backend_principles.md
02_application_architecture.md
03_api_architecture.md
04_service_layer_design.md
05_authentication_authorization.md
06_domain_service_design.md
07_event_driven_architecture.md
08_background_job_architecture.md
09_file_processing_architecture.md
10_ai_integration_architecture.md
11_error_handling_strategy.md
12_logging_observability.md
13_backend_security.md
14_backend_deployment.md

```

Ini akan menyambungkan:
**Logical Data Model → Database → Backend Service → API → Frontend/Mobile.**
```
