```markdown id="v7q2mx"
# 12_engineering_implementation_guide/database/06_query_optimization.md

# Database Query Optimization Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi optimasi query database PostgreSQL pada platform YakinLulus.id.

Query optimization bertujuan memastikan:

- response time API rendah;
- database mampu menangani concurrent user;
- CBT runtime tetap stabil saat ujian berlangsung;
- dashboard analytics tetap responsif;
- biaya infrastruktur database tetap efisien.


Target performance:


```

API Response

< 200ms  : Excellent

< 500ms  : Acceptable

> 1s     : Need Optimization

```


---

# 2. Query Optimization Principle


YakinLulus menggunakan prinsip:


```

Measure

```
|
```

Analyze

```
|
```

Optimize

```
|
```

Monitor

```


Tidak melakukan optimasi berdasarkan asumsi.

Semua optimasi harus berdasarkan:


- query profiling;
- execution plan;
- database metrics;
- production monitoring.


---

# 3. Query Execution Flow


Normal flow:


```

Application

```
  |
```

Repository Layer

```
  |
```

SQL Query

```
  |
```

PostgreSQL Query Planner

```
  |
```

Execution Plan

```
  |
```

Database Engine

```
  |
```

Result

````


---

# 4. Query Analysis Tools


## EXPLAIN


Melihat execution plan:


```sql
EXPLAIN
SELECT *
FROM question_bank.questions;
````

---

## EXPLAIN ANALYZE

Melihat actual execution:

```sql
EXPLAIN ANALYZE
SELECT *
FROM question_bank.questions
WHERE subject_id='xxx';
```

Informasi:

```
Execution Time

Rows

Cost

Scan Type

Index Usage

```

---

# 5. Query Performance Metric

Metric utama:

| Metric         | Description                    |
| -------------- | ------------------------------ |
| Execution Time | Lama query berjalan            |
| Planning Time  | Waktu planner membuat strategi |
| Rows Returned  | Jumlah data                    |
| Buffer Usage   | Memory usage                   |
| Index Hit      | Efektivitas index              |

---

# 6. Avoid SELECT *

Buruk:

```sql
SELECT *
FROM questions;
```

Masalah:

* mengambil data tidak diperlukan;
* meningkatkan network transfer;
* memperbesar memory.

---

Gunakan:

```sql
SELECT
id,
question_text,
difficulty
FROM questions;
```

---

# 7. Pagination Strategy

Tabel besar tidak boleh:

```sql
SELECT *
FROM questions
LIMIT 100000;
```

Gunakan pagination.

---

## Offset Pagination

Untuk data kecil:

```sql
LIMIT 20
OFFSET 40;
```

---

## Cursor Pagination

Untuk data besar:

```sql
WHERE id > last_seen_id

LIMIT 50;
```

Digunakan untuk:

* question bank;
* analytics;
* activity logs.

---

# 8. Query Optimization Question Bank

Question bank merupakan domain penting.

Query:

```
Cari soal berdasarkan:

- subject
- grade
- chapter
- difficulty
- status

```

Optimal:

```sql
SELECT
id,
title,
difficulty

FROM question_bank.questions

WHERE

subject_id=?

AND

difficulty=?

AND

status='ACTIVE';
```

Didukung:

```
Composite Index

(subject_id,difficulty,status)

```

---

# 9. CBT Runtime Optimization

CBT memiliki kebutuhan latency tinggi.

Target:

```
Answer Save

< 100ms

```

---

## Answer Submission

Jangan:

```sql
SELECT *
FROM answers
WHERE session_id=?;
```

Jika hanya membutuhkan status:

```sql
SELECT
id,
question_id,
answer_option

FROM answers

WHERE session_id=?;
```

---

# 10. N+1 Query Problem

Masalah umum ORM.

Contoh:

```
Get 100 students


+

Query exam progress setiap student


=

101 Queries

```

---

Solusi:

gunakan:

```
Join

Preload

Batch Query

```

---

# 11. Join Optimization

Buruk:

```sql
SELECT *

FROM questions q

JOIN subjects s

ON q.subject_id=s.id;

```

Jika mengambil semua kolom.

---

Lebih baik:

```sql
SELECT

q.id,

q.question_text,

s.name

FROM questions q

JOIN subjects s

ON q.subject_id=s.id;

```

---

# 12. Transaction Optimization

Transaction harus pendek.

Buruk:

```
BEGIN


Process 1 juta data


Send Notification


Calculate Report


COMMIT

```

Masalah:

* lock lama;
* blocking.

---

Lebih baik:

```
Small Transaction

+

Background Worker

```

---

# 13. Connection Optimization

Database connection menggunakan:

```
Connection Pool

```

Flow:

```
Application


 |

Connection Pool


 |

PostgreSQL

```

Parameter:

```
max_connections

pool_size

idle_timeout

```

---

# 14. Prepared Statement

Digunakan untuk:

* query berulang;
* keamanan;
* performance.

Contoh:

```sql
SELECT *

FROM users

WHERE id=$1;

```

---

# 15. Caching Strategy

Query mahal dapat menggunakan cache.

Contoh:

```
Academic Master Data

Subject List

Chapter List

Ranking Summary

```

Flow:

```
Request


 |

Redis Check


 |

Cache Hit

 |

Return


```

---

# 16. Materialized View

Untuk analytics.

Contoh:

Student Progress:

```sql
CREATE MATERIALIZED VIEW student_progress_summary
AS
SELECT ...
```

Refresh:

```
Background Worker

```

---

# 17. Database Function

Gunakan function untuk:

* perhitungan kompleks;
* reusable logic;
* aggregation.

Contoh:

```
Calculate Exam Score

```

---

# 18. Batch Operation

Jangan:

```sql
INSERT row 1

INSERT row 2

INSERT row 3

```

Gunakan:

```sql
INSERT INTO questions
VALUES
(...),
(...),
(...);
```

Digunakan untuk:

* import soal;
* seed;
* migration.

---

# 19. Bulk Import Optimization

Question import:

```
Excel

 |

CSV

 |

COPY Command

 |

PostgreSQL

```

Contoh:

```sql
COPY questions
FROM '/file/questions.csv'
CSV HEADER;
```

---

# 20. Slow Query Management

Query dianggap lambat:

```
Development

>500ms


Production

>1s

```

Action:

```
Identify

 |

Analyze

 |

Optimize

 |

Monitor

```

---

# 21. PostgreSQL Monitoring

Tools:

```
pg_stat_statements

pg_stat_activity

EXPLAIN ANALYZE

```

Monitor:

```
Slow Query

Lock

Connection

CPU

Memory

```

---

# 22. Query Optimization Workflow

Developer:

```
Create Query


      |

Run Explain Analyze


      |

Check Index


      |

Optimize SQL


      |

Benchmark


      |

Deploy

```

---

# 23. Domain Specific Optimization

## Question Bank

Optimization:

```
Search Index

Pagination

Filtering Index

Caching Metadata

```

---

## CBT Engine

Optimization:

```
Fast Answer Write

Session Cache

Batch Sync

```

---

## Analytics

Optimization:

```
Aggregation Table

Partitioning

Materialized View

```

---

# 24. Future Scaling Strategy

## Phase 1

```
Single PostgreSQL

Query Optimization

Redis Cache

```

---

## Phase 2

```
Read Replica

Database Tuning

Analytics Database

```

---

## Phase 3

```
CQRS

Separate Query Database

Data Warehouse

Search Engine

```

---

# 25. Query Optimization Checklist

Sebelum release:

```
✅ Query Reviewed

✅ Explain Analyze Tested

✅ Index Verified

✅ Pagination Implemented

✅ N+1 Checked

✅ Slow Query Monitoring Enabled

```

---

# Summary

Query optimization YakinLulus.id menggunakan:

```
Execution Plan Driven

+

Proper Index Usage

+

Efficient Query Pattern

+

Caching

+

Continuous Monitoring

```

Strategi ini memastikan database mampu berkembang dari:

```
<100 user MVP

        |

Thousands Students

        |

Millions Learning Activities

```

tanpa perubahan arsitektur besar.

