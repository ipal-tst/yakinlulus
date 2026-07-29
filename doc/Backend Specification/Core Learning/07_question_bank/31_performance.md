Selanjutnya adalah **31_performance.md**. Dokumen ini menjadi acuan seluruh target performa Question Bank, mulai dari API, PostgreSQL, Redis, pgvector, Object Storage, hingga Background Worker.

Untuk **YakinLulus.id**, saya menyarankan menggunakan **SLO (Service Level Objective)**, bukan sekadar benchmark. Dengan demikian, performa dapat dipantau secara konsisten di lingkungan produksi.

---

```markdown
# 31_performance.md

# Question Bank Performance Specification

Version : 1.0

---

# 1. Overview

Dokumen ini mendefinisikan target performa
modul Question Bank.

Target meliputi.

- API
- Database
- Search
- AI
- Storage
- Cache
- Background Job

Seluruh target digunakan sebagai
Service Level Objective (SLO).

---

# 2. Performance Principles

Question Bank mengikuti prinsip.

- Fast Read
- Predictable Latency
- Horizontal Scalability
- Efficient Resource Usage
- Event Driven Processing

---

# 3. Performance Objectives

Target utama.

- Response cepat
- Throughput tinggi
- Latency rendah
- Resource efisien
- High Availability

---

# 4. API Response Time

| Endpoint | Target |
|------------|---------|
| Create Question | < 200 ms |
| Update Question | < 200 ms |
| Get Detail | < 100 ms |
| Search | < 300 ms |
| Publish | < 500 ms |
| Review | < 300 ms |

---

# 5. Database Performance

| Operation | Target |
|------------|---------|
| INSERT | < 20 ms |
| UPDATE | < 20 ms |
| SELECT PK | < 10 ms |
| Aggregate Load | < 100 ms |
| Transaction | < 200 ms |

---

# 6. Search Performance

Keyword Search.

< 300 ms

Semantic Search.

< 500 ms

Hybrid Search.

< 700 ms

---

# 7. Cache Performance

Redis.

Hit

< 5 ms

Miss

Fallback Database

---

# 8. PGVector Performance

Top 20 Similar.

< 300 ms

Top 100 Similar.

< 600 ms

Embedding Insert.

< 100 ms

---

# 9. Object Storage

Upload.

< 2 detik

Signed URL.

< 100 ms

Metadata Save.

< 20 ms

---

# 10. Import Performance

Batch.

100 Question

↓

< 5 detik

1000 Question

↓

< 60 detik

---

# 11. Export Performance

100 Question.

< 5 detik

1000 Question.

< 30 detik

10000 Question.

Background Job

---

# 12. Background Jobs

Embedding.

100 Question

↓

< 2 menit

Thumbnail.

↓

< 5 detik

Statistics.

↓

Realtime atau Near Realtime

---

# 13. Concurrent Users

Target MVP.

500 Concurrent User

Target Phase 2.

5.000 Concurrent User

Target Future.

50.000+

---

# 14. Database Capacity

Target.

Question.

1.000.000+

Attachment.

5.000.000+

Statistics.

100.000.000+

Audit.

500.000.000+

---

# 15. Storage Capacity

Image.

10 TB+

Video.

20 TB+

Attachment.

50 TB+

Scale menggunakan Object Storage.

---

# 16. CPU Target

Average.

< 60%

Peak.

< 80%

---

# 17. Memory Target

Average.

< 70%

Peak.

< 85%

---

# 18. Connection Pool

PgBouncer.

100–300 Connection

Redis.

1000+

---

# 19. Queue Performance

Target.

1000 Job

↓

< 10 menit

Retry Queue.

< 1 menit

---

# 20. Event Processing

Outbox.

↓

Broker

↓

Consumer

Target.

< 2 detik

---

# 21. Availability

API.

99.9%

Database.

99.95%

Storage.

99.9%

---

# 22. Scalability

Horizontal.

API

Worker

Redis

Search

Vertical.

Database

---

# 23. Monitoring Metrics

Dipantau.

- Latency
- Throughput
- Error Rate
- CPU
- Memory
- Slow Query
- Queue Length

---

# 24. Alert Threshold

Latency.

> 500 ms

Error Rate.

> 5%

CPU.

> 80%

Memory.

> 85%

Queue.

> 10.000

---

# 25. Performance Testing

Dilakukan.

Load Test

Stress Test

Spike Test

Soak Test

Benchmark

---

# 26. Optimization Strategy

Optimasi.

- Index
- Cache
- Batch
- Async
- Pagination
- Projection

---

# 27. Capacity Planning

Review.

Bulanan

Capacity ditingkatkan
berdasarkan tren penggunaan.

---

# 28. Disaster Scenario

Jika beban tinggi.

↓

Rate Limit

↓

Queue

↓

Retry

↓

Graceful Degradation

---

# 29. Performance Dashboard

Dashboard memantau.

API

Database

Redis

PGVector

Storage

Worker

Broker

---

# 30. Future Roadmap

- CDN
- Read Replica
- Multi Region
- Distributed Cache
- Auto Scaling
- AI Performance Optimization
```

---

# Arsitektur Monitoring Performa

Saya menyarankan seluruh metrik dikumpulkan dalam satu pipeline observability.

```text
                    API
                     │
                     ▼
             Application Metrics
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
 PostgreSQL       Redis          Background Jobs
     │               │                │
     └───────────────┼────────────────┘
                     ▼
             Metrics Collector
                     │
                     ▼
              Monitoring Stack
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      Dashboard              Alerting
```

---

# Performance Budget yang Direkomendasikan

Agar total response tetap di bawah target, tetapkan budget waktu untuk setiap lapisan.

| Layer                  |  Target |
| ---------------------- | ------: |
| Authentication         | < 20 ms |
| Authorization          |  < 5 ms |
| Validation             | < 20 ms |
| Application Service    | < 50 ms |
| Repository             | < 40 ms |
| PostgreSQL             | < 40 ms |
| Redis (jika digunakan) |  < 5 ms |
| Serialization          | < 10 ms |
| Network Overhead       | < 20 ms |

Total target request sinkron:

**≤ 200 ms**

---

# Benchmark Dataset yang Disarankan

Seluruh pengujian performa sebaiknya dilakukan menggunakan data yang realistis, bukan data dummy kecil.

| Dataset          |      Jumlah |
| ---------------- | ----------: |
| Question         |   1.000.000 |
| Question Version |   5.000.000 |
| Question Option  |  20.000.000 |
| Attachment       |   5.000.000 |
| Audit Log        | 500.000.000 |
| Statistics       | 100.000.000 |
| Embedding        |   1.000.000 |

Dengan benchmark seperti ini, desain database, indexing, caching, dan query plan akan tetap relevan ketika platform berkembang dari MVP menjadi sistem produksi berskala nasional.
