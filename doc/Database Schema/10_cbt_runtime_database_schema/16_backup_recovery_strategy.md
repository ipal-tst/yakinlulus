Berikut **10_cbt_runtime_database_schema / 16_backup_recovery_strategy.md**.

Dokumen ini mendefinisikan strategi backup dan recovery untuk CBT Runtime Database agar data ujian tetap aman terhadap:

* database failure;
* human error;
* corruption;
* accidental deletion;
* infrastructure outage;
* disaster recovery.

---

````markdown id="cbt16backup"
# 16_backup_recovery_strategy.md

# YakinLulus.id CBT Runtime Backup & Recovery Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime menyimpan data akademik kritis:

```
Session Execution

Student Answer

Exam Activity

Security Evidence

Audit Trail

```

Kehilangan data dapat menyebabkan:

```
Invalid Result

Loss of Trust

Academic Dispute

```

---

# 2. Recovery Objective

Target:

## Recovery Point Objective (RPO)

Maximum data loss:

```
< 5 minutes
```

---

## Recovery Time Objective (RTO)

Database recovery:

```
< 1 hour
```

---

# 3. Data Criticality Classification

## Critical Data

Tidak boleh hilang:

```
cbt_sessions

cbt_answers

cbt_events

```

---

## Important Data

```
cbt_security_logs

cbt_progress_states

```

---

## Temporary Data

```
cbt_sync_queue

cache data

```

---

# 4. Backup Architecture

```

                PostgreSQL Primary


                       |

                       |

              Continuous Backup


                       |

          +------------+------------+

          |                         |

          v                         v


    Local Backup              Remote Backup


          |                         |

          v                         v


      Storage              Object Storage



```

---

# 5. Backup Types

YakinLulus menggunakan kombinasi:

```
Full Backup

+

Incremental Backup

+

WAL Backup

```

---

# 6. Full Backup

Frequency:

```
Daily
```

---

Contains:

```
Database Schema

Tables

Indexes

Data

Functions

```

---

Example:

```
backup_full_2026_07_26.dump
```

---

# 7. Incremental Backup

Purpose:

Mengurangi waktu backup.

---

Contains:

```
Changes since previous backup
```

---

Frequency:

```
Hourly
```

---

# 8. WAL Archiving

PostgreSQL:

```
Write Ahead Log
```

---

Function:

Menyimpan semua perubahan transaksi.

---

Flow:

```
Transaction

↓

WAL

↓

Archive Storage

↓

Point In Time Recovery

```

---

# 9. Point In Time Recovery (PITR)

Scenario:

User tidak sengaja:

```
DELETE answers
```

jam:

```
10:30
```

---

Recovery:

Restore database:

```
10:29:59
```

---

Result:

Data kembali sebelum kesalahan.

---

# 10. Backup Retention Policy

Recommended:

## Daily Backup

```
30 days
```

---

## Weekly Backup

```
3 months
```

---

## Monthly Backup

```
1 year
```

---

## Academic Archive

```
2-5 years
```

---

# 11. Backup Storage Strategy

Rule:

```
3-2-1 Backup Rule
```

---

Meaning:

```
3 copies

2 different storage

1 offsite
```

---

Example:

```
Production Server

+

NAS

+

Cloud Storage

```

---

# 12. Database Backup Scope

Backup:

```
cbt_runtime schema

+

Reference Data

+

Configuration

```

---

Tidak perlu:

```
Redis Cache

Temporary Files

```

---

# 13. Backup Encryption

Backup harus:

```
Encrypted at Rest

Encrypted During Transfer

```

---

Example:

```
AES-256
```

---

# 14. Access Control

Backup hanya dapat diakses:

```
Database Admin

DevOps

Security Officer

```

---

Tidak:

```
Application User

Teacher

Student

```

---

# 15. Restore Procedure

General flow:

```

Incident Detected

        |

        |

Stop Write Traffic

        |

        |

Select Backup

        |

        |

Restore Database

        |

        |

Apply WAL

        |

        |

Validate

        |

        |

Resume Service


```

---

# 16. Database Validation After Restore

Check:

## Schema

```
Table Exists

Index Exists

Constraint Valid

```

---

## Data

```
Row Count

Checksum

Transaction Integrity

```

---

## Application

```
Login

Create Session

Save Answer

Submit Exam

```

---

# 17. Backup Testing

Backup tidak dianggap valid sebelum:

```
Successful Restore Test
```

---

Schedule:

```
Monthly
```

---

Test:

```
Restore Environment

Run CBT Simulation

Verify Result

```

---

# 18. Disaster Scenario

## Scenario 1

Database Server Failure

---

Action:

```
Promote Replica

Redirect Traffic

Restore Missing WAL

```

---

## Scenario 2

Storage Corruption

---

Action:

```
Restore Backup

Apply WAL

Validate

```

---

## Scenario 3

Application Bug

Example:

```
Wrong update answers
```

---

Action:

```
PITR Recovery
```

---

# 19. High Availability Setup

Production:

```

              Load Balancer


                    |

                    |

             PostgreSQL Primary


                    |

                    |

             Streaming Replica


```

---

Replica:

```
Read Only

Failover Candidate

```

---

# 20. Backup Monitoring

Metrics:

```
Backup Success

Backup Duration

Backup Size

Restore Test Result

WAL Archive Status

```

---

Alert:

```
Backup Failed

Storage Full

WAL Delay

```

---

# 21. Large Scale Strategy

Untuk nasional CBT:

```
Primary Database

+

Read Replica

+

Backup Cluster

+

Data Warehouse

```

---

# 22. Partition Backup Strategy

Dengan partition:

Backup dapat dilakukan:

```
Active Partition

+

Recent History
```

---

Archive:

```
Old Partition
```

---

# 23. Backup Automation

Recommended tools:

```
pgBackRest

Barman

WAL-G

```

---

Automation:

```
Scheduler

+

Monitoring

+

Notification
```

---

# 24. Recovery Priority

Urutan restore:

```
1. Schema

2. cbt_sessions

3. cbt_answers

4. cbt_events

5. Security Logs

6. Supporting Tables

```

---

# 25. Security Audit

Setiap restore harus dicatat:

```
Who

When

Why

What Backup

Result

```

---

# 26. Final Backup Architecture

```

                 CBT Runtime DB


                       |

                       |

                Backup Manager


                       |

        +--------------+--------------+

        |                             |

        v                             v


   Local Storage              Cloud Storage


        |

        |

   Disaster Recovery


```

---

# 27. Conclusion

Backup Recovery Strategy memastikan:

- jawaban siswa aman;
- histori ujian terlindungi;
- recovery cepat;
- audit akademik terjaga;
- platform siap berkembang.

Dengan strategi ini CBT Runtime dapat memenuhi kebutuhan:

```
Family MVP

↓

School Deployment

↓

National Assessment Platform
