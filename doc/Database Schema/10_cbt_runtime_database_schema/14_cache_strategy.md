Berikut **10_cbt_runtime_database_schema / 14_cache_strategy.md**.

Dokumen ini mendefinisikan strategi caching untuk CBT Runtime agar mampu menangani ujian dengan concurrency tinggi, latency rendah, dan tetap menjaga konsistensi data.

Fokus:

* cache architecture;
* data classification;
* Redis strategy;
* cache invalidation;
* session acceleration;
* question delivery;
* timer optimization;
* failure handling.

---

````markdown id="cbt14cache"
# 14_cache_strategy.md

# YakinLulus.id CBT Runtime Cache Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+  
Cache : Redis Compatible

---

# 1. Overview

CBT Runtime memiliki karakteristik:

```
High Read

+

High Write

+

Low Latency Requirement

```

Contoh:

Saat ujian berlangsung:

```
10.000 siswa

x

40 request/question

=

400.000 runtime access
```

---

Database PostgreSQL tidak boleh menjadi satu-satunya sumber akses cepat.

---

# 2. Cache Architecture

Architecture:

```

                 CBT Client


                     |

                     |

               CBT Runtime API


                     |

                     |

              Cache Layer


                     |

          +----------+----------+

          |                     |

          v                     v


       Redis              PostgreSQL



```

---

# 3. Cache Technology

Recommended:

Primary:

```
Redis 7+
```

Alternative:

```
Valkey

DragonflyDB

```

---

Use case:

```
Session State

Timer State

Question Snapshot

Rate Limiting

Temporary Lock

```

---

# 4. Cache Principle

CBT Runtime menggunakan:

```
Cache Aside Pattern
```

Flow:

```
Application

    |

Check Cache

    |

+---+---+

|       |

Hit    Miss

|       |

Return  Load DB

        |

        Save Cache

```

---

# 5. Data Classification

## Cacheable

```
Session State

Question Snapshot

Timer State

Exam Configuration

User Permission

```

---

## Semi Cacheable

```
Progress State

Navigation State

Answer Draft

```

---

## Never Cache

```
Final Score

Submitted Answer

Audit Event

```

---

# 6. Redis Key Convention

Format:

```
{service}:{entity}:{identifier}
```

---

Example:

```
cbt:session:{session_id}
```

---

Question:

```
cbt:question:{session_id}:{number}
```

---

Timer:

```
cbt:timer:{session_id}
```

---

# 7. Session Cache

Object:

```
cbt:session:{id}
```

---

Example:

```json
{
"id":"abc",

"user_id":"123",

"status":"RUNNING",

"started_at":
"2026-07-26T10:00:00"
}
```

---

TTL:

```
Exam Duration + 1 hour
```

---

# 8. Question Snapshot Cache

Purpose:

Mempercepat loading soal.

---

Key:

```
cbt:questions:{session_id}
```

---

Value:

```json
[
{
"number":1,
"question_id":"xxx"
}
]
```

---

TTL:

```
Exam Duration
```

---

# 9. Question Content Cache

Question content berasal dari:

```
Question Bank Service
```

---

Cache:

```
question_version:{id}
```

---

TTL:

```
24 hours
```

---

Reason:

Question version immutable.

---

# 10. Timer Cache

Timer adalah data sangat sering dibaca.

---

Key:

```
cbt:timer:{session_id}
```

---

Value:

```json
{
"remaining":3600,

"last_sync":
"timestamp"
}
```

---

Update:

```
Periodic
```

---

Source of truth:

```
Server Timestamp

+

Database
```

---

# 11. Navigation Cache

Key:

```
cbt:navigation:{session_id}
```

---

Contains:

```
Current Question

Visited

Flagged

```

---

TTL:

```
Session Lifetime
```

---

# 12. Answer Draft Cache

Saat user menjawab:

Temporary:

```
Redis
```

---

Flow:

```
User Answer

 |

Redis Draft

 |

Async Persist

 |

PostgreSQL

```

---

Purpose:

Reduce database write pressure.

---

# 13. Answer Persistence Strategy

Untuk MVP:

```
Direct Write PostgreSQL
```

---

Untuk scale:

```
Redis Buffer

+

Async Writer

```

---

Architecture:

```

Client

 |

Redis

 |

Queue Worker

 |

PostgreSQL


```

---

# 14. Distributed Lock

Problem:

Double submit.

---

Solution:

Redis Lock.

---

Example:

```
lock:submit:{session_id}
```

---

TTL:

```
30 seconds
```

---

# 15. Rate Limiting

Protect:

```
Answer API

Sync API

Session API

```

---

Key:

```
rate:{user_id}:{endpoint}
```

---

Example:

```
100 request/minute
```

---

# 16. Cache Invalidation

Strategy:

## Session

Invalidate:

```
Submit

Expire

Cancel
```

---

## Question

Invalidate:

```
Never

```

because:

```
Question Version Immutable
```

---

## Permission

Invalidate:

```
Role Change
```

---

# 17. Cache Consistency Model

CBT Runtime menggunakan:

```
Strong Consistency

untuk:

Answer

Score

Submission

```

---

Menggunakan:

```
Eventual Consistency

untuk:

Analytics

Dashboard

```

---

# 18. Cache Failure Handling

Scenario:

Redis Down.

---

System:

```
Fallback PostgreSQL
```

---

Requirement:

CBT tetap berjalan.

---

# 19. Cache Warmup

Sebelum exam dimulai:

Preload:

```
Exam Configuration

Question Metadata

Session Data
```

---

Flow:

```
Schedule Trigger

        |

        |

Warm Cache

        |

        |

Exam Start

```

---

# 20. Cache Eviction Policy

Redis:

Recommended:

```
allkeys-lru
```

---

Priority:

High:

```
Active Session
```

---

Low:

```
Historical Data
```

---

# 21. Monitoring Metrics

Monitor:

```
Cache Hit Ratio

Memory Usage

Eviction Rate

Latency

Connection Count
```

---

Target:

```
Cache Hit Ratio

>95%

```

---

# 22. Security

Redis harus:

```
Private Network

Authentication

Encryption

No Public Access

```

---

Sensitive:

```
Answer Draft

Session Token
```

harus:

```
Encrypted
```

---

# 23. Backup Strategy

Redis:

Tidak menjadi source of truth.

---

Backup:

```
Optional
```

---

Database:

```
PostgreSQL

Primary Persistence
```

---

# 24. Scaling Strategy

Horizontal:

```
Redis Cluster
```

---

Architecture:

```

Redis Node 1

Redis Node 2

Redis Node 3


```

---

# 25. Future Enhancement

Support:

```
Redis Streams

Real-time Proctoring

Live Ranking

Adaptive Exam

```

---

# 26. Final Architecture

```

                 CBT Runtime


                      |

                      |

                Cache Layer


          +-----------+-----------+

          |                       |

          v                       v


        Redis              PostgreSQL


          |

          |

     Fast Runtime State


```

---

# 27. Conclusion

Cache Strategy memberikan:

- latency rendah;
- database protection;
- high concurrency support;
- smooth exam experience;
- scalable runtime architecture.

Dengan strategi ini CBT Runtime dapat berkembang dari:

```
10 user MVP

hingga

Mass Online Examination
```

````
