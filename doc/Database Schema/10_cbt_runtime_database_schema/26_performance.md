Berikut **26_performance.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan strategi performa CBT Runtime agar mampu berkembang dari skala keluarga/MVP menjadi platform sekolah dan ujian besar.

```markdown
# 26_performance.md

# YakinLulus.id CBT Performance Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Performance Engineering memastikan CBT Runtime mampu menangani:

- banyak peserta ujian secara bersamaan;
- request dengan latency rendah;
- penyimpanan jawaban real-time;
- proses scoring asynchronous;
- peningkatan kapasitas tanpa redesign besar.

---

# 2. Performance Goal


Target utama:


```

Fast Response

High Availability

Predictable Latency

Horizontal Scalability

Resource Efficiency

```

---

# 3. Performance Target


## API Response


Target:


```

Normal Request:

< 200 ms

Critical CBT Action:

< 500 ms

```

---

## Answer Save


Target:


```

Autosave:

< 300 ms

```

---

## Question Loading


Target:


```

First Load:

< 1 second

Next Question:

< 200 ms

```

---

## Score Processing


Target:


```

1000 Student:

< 5 minutes

```

---

# 4. Performance Architecture


```

```
             Client


               |

               |

          CDN / Cache


               |

               |

          API Gateway


               |

    +----------+----------+

    |                     |

    v                     v
```

CBT Runtime          Background Worker

```
    |                     |

    v                     v


PostgreSQL            Queue


    |

    |

Read Replica
```

```

---

# 5. Performance Layer


Optimization dilakukan pada:


```

1. Frontend

2. API Layer

3. Application Logic

4. Database

5. Cache

6. Background Processing

7. Infrastructure

```

---

# 6. Frontend Performance


Strategi:


## Lazy Loading


Load hanya:


```

Current Exam Module

Current Question

Required Asset

```

---

## Local State Management


Gunakan:


```

Local Cache

Memory State

IndexedDB

```

---

## Asset Optimization


Optimasi:


```

Image Compression

Video Streaming

CDN Delivery

```

---

# 7. API Performance


## Stateless Service


API dibuat:


```

Stateless

Horizontal Scalable

```

---

## Response Optimization


Gunakan:


```

Pagination

Field Selection

Compression

Caching Header

```

---

# 8. CBT Runtime Optimization


Karena CBT memiliki trafik tinggi:


Optimasi:


```

Question Delivery

Answer Saving

Timer Validation

Session Lookup

```

---

# 9. Question Delivery Performance


Masalah:


```

Ribuan siswa

Mengakses soal bersamaan

```

Solusi:


```

Pre Generate Exam Snapshot

Cache Question Set

Read Optimization

```

---

Flow:


```

Exam Created

```
    |
```

Generate Snapshot

```
    |
```

Cache

```
    |
```

Student Access

```
    |
```

Fast Delivery

```

---

# 10. Answer Saving Performance


Tidak semua jawaban langsung menulis database.


Strategy:


```

Client

|

Local Save

|

Queue

|

Batch Sync

|

Database

```

---

Benefit:


```

Reduce Database Load

Better Offline Support

Lower Latency

```

---

# 11. Database Performance


Database utama:


```

PostgreSQL

```

---

Optimization:


```

Indexing

Partitioning

Query Optimization

Connection Pooling

```

---

# 12. Query Optimization


Avoid:


```

SELECT *

```

Gunakan:


```

SELECT required_column

````

---

Example:


Buruk:


```sql
SELECT *
FROM questions;
````

Baik:

```sql
SELECT id,
question_text,
options
FROM questions;
```

---

# 13. Index Strategy

Index pada:

```
exam_session_id

student_id

question_id

created_at

status

```

---

Critical Query:

```sql
Find active exam session

Find student answer

Generate score

```

---

# 14. Database Connection Pool

Gunakan:

```
PgBouncer

```

---

Tujuan:

```
Reduce Connection Overhead

Prevent Connection Exhaustion

```

---

# 15. Cache Strategy

Gunakan:

```
Redis

```

---

Cache data:

```
Exam Configuration

Question Snapshot

Session State

Timer State

User Permission

```

---

# 16. Cache Policy

Example:

Question:

```
TTL:

30 minutes

```

---

Session:

```
TTL:

Exam Duration + Buffer

```

---

# 17. Read / Write Separation

Scale besar:

```
               Application


                    |

        +-----------+-----------+

        |                       |

        v                       v


    Write DB              Read Replica


```

---

Write:

```
Answer

Session

Result

```

---

Read:

```
Question

Report

Analytics

```

---

# 18. Background Processing

Proses berat:

```
Scoring

Analytics Calculation

Report Generation

Notification

AI Processing

```

---

Tidak dilakukan langsung pada request.

---

# 19. Queue Architecture

Gunakan:

```
Redis Queue

RabbitMQ

Kafka (Future)

```

---

Flow:

```
Request

 |

Create Job

 |

Queue

 |

Worker

 |

Result

```

---

# 20. Worker Scaling

Worker dapat ditambah:

```
1 Worker

        |

10 Worker

        |

100 Worker

```

---

Contoh:

```
Exam Finished

1000 Submission

        |

20 Scoring Worker

        |

Parallel Processing

```

---

# 21. Session Performance

Session lookup:

Gunakan:

```
Redis

+

Database Backup

```

---

Flow:

```
Request

 |

Redis Check

 |

Found

 |

Return


```

atau:

```
Redis Miss

 |

Database

 |

Update Cache

```

---

# 22. Timer Performance

Timer tidak melakukan:

```
Database Write Every Second

```

---

Strategy:

Server:

```
Single Time Reference

```

Client:

```
Countdown Display

```

Validation:

```
Server Side

```

---

# 23. Event Performance

Event processing:

```
Async

Queue Based

Retry Supported

```

---

Example:

```
ANSWER_SUBMITTED

        |

        +---- Analytics

        |

        +---- Audit

        |

        +---- AI Analysis

```

---

# 24. Large Scale Exam Scenario

Example:

10.000 siswa ujian bersamaan.

Architecture:

```
10.000 Client


       |

       |

Load Balancer


       |

       |

Multiple CBT Service


       |

       |

Redis Cluster


       |

       |

PostgreSQL Cluster

```

---

# 25. Load Balancing

Gunakan:

```
Nginx

HAProxy

Cloud Load Balancer

```

---

Strategy:

```
Round Robin

Least Connection

Session Affinity

```

---

# 26. Monitoring Performance

Metric:

```
CPU Usage

Memory

Database Query Time

API Latency

Error Rate

Queue Length

Active Session

```

---

# 27. Performance Logging

Log:

```
Request Time

Database Time

Cache Hit/Miss

Queue Processing Time

```

---

# 28. Bottleneck Detection

Area monitoring:

```
Slow Query

High CPU

Memory Leak

Queue Delay

Database Lock

```

---

# 29. Database Scaling Strategy

Phase MVP:

```
Single PostgreSQL

```

---

Phase Growth:

```
Primary

+

Read Replica

```

---

Phase Enterprise:

```
Database Cluster

Partitioning

Archive Storage

```

---

# 30. Performance Testing

Jenis test:

```
Load Test

Stress Test

Spike Test

Endurance Test

```

---

Example:

```
Simulate:

5000 concurrent students

100 answers/sec

```

---

# 31. Performance SLA

Target:

```
Availability:

99.5% MVP


99.9% Production


API:

<500ms


Answer Save:

<300ms

```

---

# 32. Future Optimization

Support:

```
Kubernetes Auto Scaling

Database Sharding

Global CDN

Edge Computing

AI Load Prediction

```

---

# 33. Final Performance Architecture

```
                  Users


                    |

                    |

              Load Balancer


                    |

          +---------+---------+

          |                   |

          v                   v


      CBT API             Worker


          |                   |

          v                   v


       Redis              Queue


          |

          |

     PostgreSQL


          |

          |

     Analytics System


```

---

# 34. Conclusion

Performance Architecture memastikan CBT Runtime YakinLulus.id:

* cepat saat ujian berlangsung;
* mampu menangani concurrent user;
* stabil ketika terjadi lonjakan trafik;
* mudah di-scale;
* siap berkembang dari MVP menuju platform assessment besar.

Target evolusi:

```
Family CBT

      |

      v

School CBT

      |

      v

Regional Assessment

      |

      v

National Scale Platform

