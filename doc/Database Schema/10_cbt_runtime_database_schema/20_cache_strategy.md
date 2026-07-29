Berikut **20_cache_strategy.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan strategi caching CBT Runtime untuk mempercepat akses soal, session state, timer, navigation state, dan data yang sering dibaca.

```markdown
# 20_cache_strategy.md

# YakinLulus.id CBT Cache Strategy Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Cache Strategy adalah mekanisme penyimpanan sementara data yang sering diakses untuk meningkatkan performa CBT Runtime.

Tujuan:

- mengurangi query database;
- mempercepat loading soal;
- menjaga respons aplikasi tetap cepat;
- mendukung ujian dengan banyak peserta;
- mengurangi beban PostgreSQL.

---

# 2. Cache Principle


Prinsip utama:


```

Frequently Read

*

Rarely Changed

=

Cache Candidate

```


Cache digunakan untuk:

```

Session State

Question Data

Exam Configuration

Timer State

Navigation State

Answer Draft

Reference Data

```


---

# 3. Cache Architecture


```

```
            CBT Client


                |

                |

          CBT Backend


                |

    +-----------+-----------+

    |                       |

    v                       v


   Cache                 Database


 Redis                  PostgreSQL
```

```


---

# 4. Cache Technology


## MVP


Recommended:


```

Redis

```


Alasan:


- low latency;
- key-value storage;
- TTL support;
- atomic operation;
- cocok untuk session state.


---

## Future Scale


Support:


```

Redis Cluster

Redis Sentinel

Distributed Cache

```


---

# 5. Cache Categories


Cache dibagi menjadi:


```

1. Runtime Cache

2. Reference Cache

3. Session Cache

4. Temporary Cache

5. Analytics Cache

```


---

# 6. Runtime Cache


Data:


```

Active Exam Session

Timer State

Navigation State

Current Question

Answer Draft

```


Karakteristik:


```

High Read

High Update

Short TTL

```


---

# 7. Session Cache


Key:


```

cbt:session:{session_id}

````


Example:


```json
{
"user_id":"123",

"exam_id":"456",

"status":"RUNNING",

"start_time":"10:00",

"end_time":"11:00"
}
````

TTL:

```
Exam Duration + Buffer

```

Example:

Exam:

```
120 minutes
```

TTL:

```
150 minutes

```

---

# 8. Timer Cache

Timer Engine menggunakan cache.

Key:

```
cbt:timer:{session_id}

```

Data:

```json
{
"start_time":"10:00",

"duration":7200,

"remaining":5400

}
```

Update:

```
Atomic Operation

```

---

# 9. Navigation Cache

Key:

```
cbt:navigation:{session_id}

```

Data:

```json
{
"current_question":20,

"visited":[1,2,3,20],

"flagged":[5,10]
}
```

Tujuan:

```
Fast Question Navigation

```

---

# 10. Question Cache

Question yang sering dibuka:

Key:

```
question:{question_id}

```

Data:

```
Question Text

Options

Image Reference

Explanation Metadata

```

TTL:

```
Long TTL

```

Karena soal jarang berubah.

---

# 11. Exam Configuration Cache

Key:

```
exam:config:{exam_id}

```

Contains:

```
Exam Rule

Duration

Randomization Rule

Scoring Rule

Navigation Rule

```

---

# 12. Question Pool Cache

Untuk randomization engine.

Key:

```
exam:pool:{pool_id}

```

Data:

```
Available Questions

Difficulty

Topic

Weight

```

---

# 13. Answer Draft Cache

Untuk mendukung offline dan autosave.

Key:

```
answer:draft:{session_id}

```

Example:

```json
{
"question_id":20,

"answer":"B",

"timestamp":"10:15"
}
```

TTL:

```
Exam Duration

```

---

# 14. Cache Write Strategy

YakinLulus.id menggunakan:

```
Write Through + Write Behind

```

---

## Write Through

Data penting:

```
Answer

Session State

Score

```

Flow:

```
Update Cache

      |

Update Database

```

---

## Write Behind

Data:

```
Analytics Event

Statistics

```

Flow:

```
Write Cache

      |

Background Sync

      |

Database

```

---

# 15. Cache Invalidation

Strategi:

```
TTL Based

Event Based

Manual Invalidation

```

---

# 16. TTL Strategy

Example:

| Data        | TTL           |
| ----------- | ------------- |
| Session     | Exam Duration |
| Timer       | Exam Duration |
| Question    | 24 Hours      |
| Exam Config | 1 Hour        |
| Analytics   | 10 Minutes    |

---

# 17. Cache Consistency

Priority:

```
Answer Data

>

Session State

>

Analytics

```

---

Critical data:

```
Database Source Of Truth

```

Cache:

```
Performance Layer

```

---

# 18. Cache Failure Handling

Jika Redis gagal:

System:

```
Fallback To PostgreSQL

```

Example:

```
Read Timer Cache

        |

Fail

        |

Read Database

```

---

# 19. Cache Warm Up

Sebelum exam dimulai:

System dapat melakukan:

```
Load Exam Config

Load Question Pool

Load Metadata

```

Tujuan:

```
Reduce First Request Latency

```

---

# 20. Cache Preloading

Untuk ujian besar:

```
Exam Start - 10 Minutes

```

Worker:

```
Warm Cache

Prepare Runtime Data

```

---

# 21. Cache Security

Cache harus:

```
Encrypted Connection

Access Controlled

No Sensitive Exposure

TTL Controlled

```

Tidak menyimpan:

```
Plain Answer Key

Admin Secret

Password

```

---

# 22. Cache Data Separation

Pisahkan:

```
Student Cache

Admin Cache

System Cache

```

Contoh:

```
cbt:student:{id}

cbt:admin:{id}

system:config

```

---

# 23. Cache Monitoring

Metrics:

```
Cache Hit Ratio

Cache Miss

Memory Usage

Eviction Rate

Latency

```

---

# 24. Performance Target

Cache Read:

```
<5ms

```

Cache Write:

```
<10ms

```

Question Loading:

```
<100ms

```

---

# 25. Database Impact Reduction

Tanpa cache:

```
1000 Students

×

100 Questions

=

100.000 Query

```

Dengan cache:

```
Majority Request

Handled By Redis

```

---

# 26. Integration

Cache terhubung dengan:

```
Session Management

Timer Engine

Navigation Engine

Randomization Engine

Answer Sync

Scoring Pipeline

Background Jobs

```

---

# 27. Future Enhancement

Support:

```
Redis Cluster

Edge Cache

CDN Question Asset Cache

Distributed Session Store

AI Recommendation Cache

```

---

# 28. Final Architecture

```

                 CBT Runtime


                     |

                     |

                Cache Layer


                     |

        +------------+------------+

        |                         |

        v                         v


      Redis                  PostgreSQL


        |

        |

   Background Sync


        |

        |

     Analytics


```

---

# 29. Conclusion

Cache Strategy memastikan CBT Runtime:

* respons cepat;
* database tidak terbebani;
* session stabil;
* timer akurat;
* navigasi lancar;
* siap scaling.

Dengan desain ini YakinLulus.id dapat berkembang dari:

```
Family MVP

        |

        v

School CBT

        |

        v

Large Scale Examination Platform

```

````

