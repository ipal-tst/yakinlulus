Berikut **10_cbt_runtime_database_schema / 15_partitioning_strategy.md**.

Dokumen ini mendefinisikan strategi partitioning PostgreSQL untuk CBT Runtime agar database tetap performant ketika jumlah ujian, peserta, event, dan histori meningkat.

Fokus:

* tabel yang perlu partition;
* partition key;
* retention;
* archive strategy;
* query optimization;
* scaling path.

---

````markdown id="cbt15partition"
# 15_partitioning_strategy.md

# YakinLulus.id CBT Runtime Partitioning Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime memiliki beberapa tabel dengan pertumbuhan data sangat cepat.

High growth table:

```
cbt_answers

cbt_events

cbt_security_logs

cbt_sync_queue

```

---

Tanpa partition:

```
Millions of rows

+

Large index

+

Slow query

```

---

Dengan partition:

```
Smaller Data Segment

+

Faster Query

+

Easier Archive

```

---

# 2. Partition Strategy Principle

Gunakan:

```
Range Partitioning

berdasarkan waktu
```

---

Alasan:

CBT memiliki pola:

```
Exam berlangsung

↓

Data aktif

↓

Data menjadi histori

↓

Archive
```

---

# 3. Partition Candidate Classification

## Mandatory Partition

```
cbt_events

cbt_security_logs

```

---

## Recommended Partition

```
cbt_answers

cbt_sync_queue

```

---

## No Partition

```
cbt_sessions

cbt_timer_states

cbt_navigation_states

```

---

# 4. cbt_events Partition

Table:

```
cbt_events
```

---

Karakteristik:

```
High Insert

Never Update

Never Delete

Audit Data
```

---

Partition Key:

```
created_at
```

---

Strategy:

```
Monthly Partition
```

---

Example:

```
cbt_events_2026_01

cbt_events_2026_02

cbt_events_2026_03

```

---

# 5. PostgreSQL Implementation

Parent table:

```sql
CREATE TABLE cbt_runtime.cbt_events
(
    id UUID NOT NULL,

    session_id UUID NOT NULL,

    event_type VARCHAR(100),

    payload JSONB,

    created_at TIMESTAMPTZ NOT NULL

)
PARTITION BY RANGE(created_at);

```

---

Create partition:

```sql
CREATE TABLE cbt_events_2026_07

PARTITION OF cbt_events

FOR VALUES FROM
('2026-07-01')

TO
('2026-08-01');

```

---

# 6. cbt_answers Partition

Table:

```
cbt_answers
```

---

Growth:

Example:

```
100.000 students

x

100 questions

=

10 million answers
```

---

Partition:

```
created_at
```

---

Strategy:

```
Monthly
```

---

Reason:

Query:

```
Exam period

+

Student attempt
```

lebih cepat.

---

# 7. cbt_security_logs Partition

Security log:

```
High volume

Audit required
```

---

Partition:

```
created_at
```

---

Retention:

```
2-5 years
```

---

Example:

```
security_logs_2026_07

security_logs_2026_08

```

---

# 8. cbt_sync_queue Partition

Karakteristik:

```
Temporary data

High write/delete
```

---

Partition:

```
created_at
```

---

Retention:

```
7-30 days
```

---

Setelah:

```
SYNCED
```

data dapat:

```
Deleted

atau

Archived
```

---

# 9. Index Strategy Partition

Setiap partition memiliki index sendiri.

Example:

```sql
CREATE INDEX

idx_event_session

ON cbt_events_2026_07

(
session_id,
created_at
);

```

---

Keuntungan:

```
Index kecil

Search cepat

Maintenance mudah
```

---

# 10. Partition Pruning

PostgreSQL otomatis memilih partition.

Query:

```sql
SELECT *

FROM cbt_events

WHERE created_at
BETWEEN
'2026-07-01'

AND

'2026-07-31';

```

---

Database hanya membaca:

```
cbt_events_2026_07
```

---

# 11. Archive Strategy

Lifecycle:

```
ACTIVE

↓

WARM

↓

COLD

↓

DELETE
```

---

Example:

## Active

```
0-6 months
```

Database utama.

---

## Warm

```
6-24 months
```

Compressed partition.

---

## Cold

```
>2 years
```

Object storage.

---

# 12. Archive Storage

Future:

```
S3 Compatible Storage
```

Example:

```
MinIO

AWS S3

Cloud Storage

```

---

Format:

```
Parquet

JSONL

CSV

```

---

# 13. Partition Maintenance

Job:

```
Monthly Scheduler
```

---

Task:

```
Create Next Partition

Validate Existing

Archive Old Data

Analyze Statistics

```

---

# 14. Automated Partition Creation

Recommended:

Extension:

```
pg_partman
```

---

Function:

```
Automatic partition creation

Retention management

```

---

# 15. Vacuum Strategy

High write tables:

```
cbt_answers

cbt_events
```

---

Require:

```
VACUUM ANALYZE
```

---

Recommended:

```
autovacuum tuned
```

---

# 16. Backup Strategy

Partition membantu:

```
Selective Backup
```

---

Example:

Backup:

```
Active partitions only

```

---

Archive:

```
Separate lifecycle
```

---

# 17. Disaster Recovery

Restore:

```
Recent partitions

+

Critical session data
```

---

Priority:

```
1. cbt_sessions

2. cbt_answers

3. cbt_events

4. Security logs

```

---

# 18. Scaling Path

## Phase 1

MVP:

```
Single PostgreSQL

No partition

```

---

## Phase 2

Growing:

```
Monthly partition

```

---

## Phase 3

National CBT:

```
Partition

+

Read Replica

+

Warehouse

```

---

# 19. Monitoring Metrics

Monitor:

```
Partition Size

Row Count

Index Size

Query Time

Vacuum Status

```

---

# 20. Anti Pattern

Jangan:

```
Partition every table
```

---

Tidak perlu partition:

```
cbt_timer_states

cbt_navigation_states
```

karena:

```
short lifecycle

small volume
```

---

# 21. Final Partition Architecture

```

                 CBT Runtime


                      |

                      |

              PostgreSQL Cluster


                      |

        +-------------+-------------+

        |             |             |

        v             v             v


   Events       Answers       Security


 Partitioned   Partitioned   Partitioned


        |

        |

    Archive Layer


```

---

# 22. Conclusion

Partitioning Strategy memberikan:

- performa query stabil;
- maintenance mudah;
- histori ujian aman;
- retention terkontrol;
- scalability path jelas.

Desain ini memungkinkan CBT Runtime berkembang dari:

```
10 user keluarga

↓

Sekolah

↓

Nasional CBT Platform
```

