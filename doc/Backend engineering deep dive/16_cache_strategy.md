# 16_cache_strategy.md

# YakinLulus.id Cache Strategy

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan strategi **Caching** pada backend YakinLulus.id.

Caching digunakan untuk meningkatkan performa sistem dengan mengurangi akses langsung ke database PostgreSQL (Supabase) dan mempercepat response API.

Tujuan utama:

* Mengurangi beban database.
* Menurunkan response time.
* Mengurangi biaya query.
* Mendukung scalability.
* Menjaga konsistensi data.

---

# 2. Objectives

Cache Strategy dirancang untuk:

* High Performance
* Low Latency
* Scalable
* Consistent
* Observable
* Secure
* Easy Invalidation
* Vendor Agnostic

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Cache Aside Pattern
* Read Through
* Write Invalidate
* TTL Based
* Immutable Cache
* Small Cache Object
* Explicit Invalidation
* No Business Logic Inside Cache

---

# 4. Technology Stack

| Component     | Technology               |
| ------------- | ------------------------ |
| Cache Server  | Redis                    |
| Client        | go-redis/v9              |
| Serialization | JSON                     |
| Compression   | Optional (Future)        |
| Metrics       | Prometheus/OpenTelemetry |

Redis menjadi cache utama seluruh backend.

---

# 5. High Level Architecture

```text id="9q4vtr"
Client

↓

Controller

↓

Service

↓

Cache

↓

Redis

↓

Database
```

---

# 6. Cache Flow

Cache Hit:

```text id="v7d2ax"
Request

↓

Redis

↓

Return Data
```

Cache Miss:

```text id="k3e6mw"
Request

↓

Redis Miss

↓

Database

↓

Redis

↓

Return Response
```

---

# 7. Cache Pattern

YakinLulus.id menggunakan:

**Cache Aside Pattern**

Flow:

```text id="x4m8ju"
Read Cache

↓

Miss

↓

Read Database

↓

Save Cache

↓

Return Data
```

Untuk operasi write:

```text id="h9w3pk"
Update Database

↓

Delete Cache

↓

Next Read Rebuild Cache
```

---

# 8. Cache Components

Komponen:

* Redis
* Cache Adapter
* Cache Service
* Cache Key Builder
* Cache Invalidation Manager
* Cache Metrics

---

# 9. Directory Structure

```text id="g2p5rf"
internal/

platform/

cache/

adapter.go

redis.go

key.go

ttl.go

service.go
```

---

# 10. Cache Adapter

Gunakan interface.

```go id="m8r1zt"
type Cache interface {
    Get(...)
    Set(...)
    Delete(...)
    Exists(...)
    Increment(...)
}
```

Business layer tidak bergantung langsung pada Redis.

---

# 11. Cacheable Data

Data yang layak di-cache:

* Subject
* Grade
* Chapter
* Curriculum
* User Profile
* Application Configuration
* Feature Flag
* Leaderboard
* Dashboard Summary
* Permission Matrix

---

# 12. Data Not Cached

Tidak disarankan meng-cache:

* JWT Token
* Password
* Active Transaction
* Temporary Validation
* Database Transaction Object
* Sensitive Secret

---

# 13. TTL Strategy

Rekomendasi TTL:

| Data          | TTL      |
| ------------- | -------- |
| Subject       | 24 jam   |
| Chapter       | 24 jam   |
| Curriculum    | 24 jam   |
| User Profile  | 10 menit |
| Dashboard     | 5 menit  |
| Leaderboard   | 5 menit  |
| Ranking       | 5 menit  |
| Statistics    | 15 menit |
| Configuration | 1 jam    |

TTL dapat diubah melalui konfigurasi.

---

# 14. Cache Key Convention

Format:

```text id="v1b7sk"
module:entity:id
```

Contoh:

```text id="u8m4la"
user:profile:uuid

question:uuid

subject:list

curriculum:active

dashboard:student:uuid

ranking:class:uuid
```

Gunakan delimiter `:` secara konsisten.

---

# 15. Cache Versioning

Untuk perubahan besar:

```text id="z6h2nx"
v1:user:profile:uuid
```

Ketika struktur berubah:

```text id="l5r9py"
v2:user:profile:uuid
```

Hal ini menghindari cache lama yang tidak kompatibel.

---

# 16. Serialization

Gunakan JSON.

```text id="w2f8de"
Go Struct

↓

JSON

↓

Redis
```

Untuk objek besar di masa depan dapat dipertimbangkan MessagePack atau Protobuf.

---

# 17. Cache Invalidation

Strategi utama:

**Write Invalidate**

Flow:

```text id="n7x1ca"
Update Database

↓

Delete Cache

↓

Next Read

↓

Rebuild Cache
```

Menghindari inkonsistensi antara cache dan database.

---

# 18. Cache Refresh

Untuk data tertentu:

```text id="j3m9tv"
Background Job

↓

Refresh Cache

↓

Redis
```

Contoh:

* Leaderboard
* Dashboard
* Analytics

---

# 19. User Profile Cache

Flow:

```text id="c4g2oy"
Get Profile

↓

Redis

↓

Miss

↓

Database

↓

Redis

↓

Response
```

Update profile akan menghapus cache terkait.

---

# 20. Question Cache

Cache:

* Question Metadata
* Question Detail

Tidak meng-cache jawaban aktif peserta CBT.

---

# 21. Material Cache

Cache:

* Material Detail
* Material List
* Chapter List

Video dan file tetap diambil dari Storage.

---

# 22. Dashboard Cache

Dashboard berisi agregasi.

Contoh:

* Progress
* XP
* Ranking
* Achievement

TTL pendek karena data sering berubah.

---

# 23. Leaderboard Cache

Leaderboard diperbarui melalui Background Job.

Flow:

```text id="y8k5sb"
Ranking Update

↓

Redis Refresh

↓

Dashboard
```

---

# 24. Permission Cache

Permission Matrix dapat di-cache.

Contoh:

```text id="a6v3mf"
Role

↓

Permission
```

TTL:

```text id="p9d7xu"
30 minutes
```

---

# 25. Configuration Cache

Business Configuration dapat di-cache.

Flow:

```text id="h1q8lj"
Database

↓

Redis

↓

Service
```

Perubahan konfigurasi menghapus cache terkait.

---

# 26. Session Cache

Jika session disimpan di Redis:

```text id="m6n4zt"
session:user-id
```

TTL mengikuti masa berlaku session.

---

# 27. Distributed Cache

Seluruh instance backend menggunakan Redis yang sama.

```text id="b5r9ke"
API A

↓

Redis

↑

API B
```

Hal ini menjaga konsistensi cache pada deployment horizontal.

---

# 28. Cache Stampede Prevention

Gunakan:

* Random TTL Jitter.
* Single Flight (`golang.org/x/sync/singleflight`).
* Background Refresh.

Menghindari banyak request membangun cache secara bersamaan.

---

# 29. Cache Penetration Protection

Untuk data yang tidak ditemukan:

```text id="k4t1rw"
NULL Cache
```

TTL pendek:

```text id="x9m2gs"
30 seconds
```

Mengurangi query berulang terhadap data yang tidak ada.

---

# 30. Cache Avalanche Protection

Gunakan:

* TTL Randomization.
* Bertahap saat preload.
* Monitoring Redis.

Tidak semua cache boleh kedaluwarsa pada waktu yang sama.

---

# 31. Cache Metrics

Metric:

* Hit Rate
* Miss Rate
* Eviction Count
* Memory Usage
* Expired Keys
* Average Latency

Target:

```text id="q8p5yd"
Hit Rate > 80%
```

Untuk cache yang sering diakses.

---

# 32. Logging

Log mencatat:

* Cache Hit
* Cache Miss
* Cache Invalidate
* Redis Error

Log detail cache hit/miss dapat dibatasi pada level DEBUG untuk menghindari noise.

---

# 33. Monitoring

Pantau:

* Redis Availability
* Memory Usage
* CPU Usage
* Command Latency
* Network Latency
* Hit Ratio

Monitoring terintegrasi dengan Grafana dan Prometheus/OpenTelemetry.

---

# 34. Failure Strategy

Jika Redis gagal:

```text id="t5j3vn"
Redis Down

↓

Database

↓

Response
```

Cache bersifat **optional optimization**, bukan single point of failure.

Aplikasi tetap berjalan menggunakan database.

---

# 35. Security

Tidak meng-cache:

* Password
* JWT Secret
* API Key
* Refresh Token

Data sensitif lain harus dipertimbangkan dengan cermat sebelum di-cache.

---

# 36. Testing Strategy

Pengujian:

* Cache Hit
* Cache Miss
* TTL Expired
* Invalidation
* Redis Failure
* Concurrent Access
* Stampede Prevention

---

# 37. Anti-Patterns

Tidak diperbolehkan:

* Business Logic di Redis.
* Cache tanpa TTL (kecuali kasus yang benar-benar terkontrol).
* Meng-cache transaksi database.
* Menyimpan objek yang terlalu besar.
* Mengakses Redis langsung dari Controller.
* Menggunakan key yang tidak konsisten.
* Menghapus seluruh cache (`FLUSHALL`) sebagai mekanisme invalidasi aplikasi.

---

# 38. Future Enhancements

Roadmap:

* Redis Cluster.
* Redis Sentinel.
* Multi-Level Cache (Memory + Redis).
* Distributed Lock.
* Cache Warming.
* Bloom Filter.
* Write Through Cache.
* Read Replica Cache Optimization.

---

# 39. Cache Checklist

Sebelum implementasi:

* Menggunakan Cache Adapter.
* Cache Aside diterapkan.
* TTL dikonfigurasi.
* Key Convention konsisten.
* Invalidation tersedia.
* Monitoring aktif.
* Logging tersedia.
* Redis bersifat optional.
* Unit & integration test tersedia.

---

# 40. Summary

YakinLulus.id menggunakan **Redis** sebagai distributed cache dengan pola **Cache Aside**. Strategi ini memberikan:

* Response API yang lebih cepat.
* Pengurangan beban Supabase PostgreSQL.
* Skalabilitas yang lebih baik pada deployment multi-instance.
* Mekanisme invalidasi yang sederhana dan konsisten.
* Ketahanan sistem karena aplikasi tetap dapat berjalan ketika Redis tidak tersedia.
