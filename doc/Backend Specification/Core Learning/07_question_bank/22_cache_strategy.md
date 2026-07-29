Dokumen berikutnya adalah **22_cache_strategy.md**. Ini merupakan salah satu dokumen yang sangat menentukan performa platform ketika jumlah soal mencapai ratusan ribu hingga jutaan.

Untuk **YakinLulus.id**, saya **tidak menyarankan cache seluruh Question Aggregate**. Yang perlu di-cache adalah **read model**, metadata, taxonomy, search result, dan lookup yang sering diakses. Aggregate tetap diambil dari PostgreSQL agar konsistensi tetap terjaga.

---

````markdown
# 22_cache_strategy.md

# Question Bank Cache Strategy

Version : 1.0

---

# 1. Overview

Cache Strategy mendefinisikan bagaimana data Question Bank
disimpan sementara untuk meningkatkan performa sistem.

Tujuan.

- Mengurangi beban PostgreSQL
- Mempercepat response API
- Mengurangi query berulang
- Mengurangi latency
- Mendukung high concurrency

Cache bukan sumber utama data.

PostgreSQL tetap menjadi Source of Truth.

---

# 2. Cache Architecture

```
Client

↓

REST API

↓

Application Service

↓

Cache

↓

Repository

↓

PostgreSQL
```

---

# 3. Cache Principles

Seluruh cache mengikuti prinsip.

- Read Through
- Cache Aside
- Immutable Key
- TTL Based
- Versioned
- Event Driven Invalidation

---

# 4. Cache Categories

Question Bank menggunakan cache untuk.

- Metadata
- Taxonomy
- Search Result
- Lookup
- Statistics
- AI Metadata
- Read Projection

---

# 5. Cacheable Objects

Object yang boleh di-cache.

✓

Subject

Chapter

Topic

Learning Objective

Difficulty

Bloom

Tag

Statistics

Search Result

Question Summary

Question Projection

Question Recommendation

---

# 6. Non Cacheable Objects

Tidak boleh di-cache.

Draft Question

Review Queue

Transaction State

Permission

User Session

Draft Version

Current Database Transaction

---

# 7. Cache Layers

Layer.

L1

↓

In Memory

L2

↓

Redis

L3 (Future)

↓

CDN

---

# 8. Cache Keys

Contoh.

```
qb:question:{id}

qb:summary:{id}

qb:metadata:subject

qb:metadata:chapter

qb:search:{hash}

qb:statistics:{id}

qb:recommendation:{id}
```

Semua key menggunakan namespace.

---

# 9. TTL Strategy

| Cache | TTL |
|---------|------|
| Metadata | 24 Jam |
| Subject | 24 Jam |
| Bloom | 24 Jam |
| Search | 5 Menit |
| Statistics | 10 Menit |
| Recommendation | 30 Menit |
| AI Metadata | 1 Jam |

TTL dapat dikonfigurasi.

---

# 10. Cache Aside Pattern

```
Request

↓

Redis

↓

Hit

↓

Return

↓

Miss

↓

Database

↓

Save Cache

↓

Return
```

---

# 11. Read Through

Untuk metadata.

```
Application

↓

Cache

↓

Repository

↓

Database
```

---

# 12. Cache Invalidation

Cache dibersihkan ketika.

Question Published

Question Archived

Metadata Updated

Statistics Updated

Import Completed

Review Approved

---

# 13. Event Driven Cache

Invalidate dilakukan melalui event.

```
QuestionPublished

↓

Cache Consumer

↓

Delete Cache

↓

Next Request Reload
```

---

# 14. Search Cache

Search menggunakan hash.

```
Keyword

+

Filter

+

Sort

↓

SHA256

↓

Cache Key
```

---

# 15. Projection Cache

Projection.

Question Summary

Question Detail

Question Statistics

Question Recommendation

Projection lebih cocok di-cache daripada Aggregate.

---

# 16. Metadata Cache

Metadata hampir selalu berasal dari Redis.

Misalnya.

Subject

Chapter

Topic

Grade

Curriculum

---

# 17. Statistics Cache

Statistik di-cache.

- Usage
- Exposure
- Correct Rate
- Difficulty

Update dilakukan asynchronous.

---

# 18. Warm Up Strategy

Saat aplikasi aktif.

↓

Load Metadata

↓

Load Taxonomy

↓

Load Configuration

↓

Ready

---

# 19. Cache Eviction

Menggunakan.

LRU

+

TTL

Redis menghapus key yang sudah kedaluwarsa.

---

# 20. Distributed Cache

Menggunakan Redis Cluster.

Semua instance API berbagi cache yang sama.

---

# 21. Cache Compression

Object besar dapat dikompresi.

- GZIP
- ZSTD (Future)

---

# 22. Cache Monitoring

Dipantau.

- Hit Rate
- Miss Rate
- Eviction
- Memory Usage
- Latency

---

# 23. Database Objects

Cache berasal dari.

question

question_metadata

statistics

taxonomy

subject

chapter

---

# 24. Security

Cache tidak boleh menyimpan.

Password

Token

Prompt Rahasia

Private Review

Audit Internal

PII

---

# 25. Performance Target

| Cache | Target |
|---------|---------|
| Redis Hit | < 5 ms |
| Metadata | < 3 ms |
| Search Cache | < 20 ms |
| Projection | < 10 ms |

---

# 26. Failure Strategy

Jika Redis gagal.

↓

Fallback

↓

Repository

↓

PostgreSQL

Sistem tetap berjalan.

---

# 27. Monitoring Dashboard

Dipantau.

Cache Hit Ratio

Miss Ratio

Memory

Latency

Eviction

Key Count

---

# 28. Future Roadmap

Redis Cluster

Redis Sentinel

CDN Cache

Edge Cache

Geo Cache

Adaptive Cache

Smart Invalidation
````

---

# Rekomendasi Arsitektur

Saya menyarankan **cache hanya untuk Query Side**, bukan Command Side.

```text
                    REST API
                       │
                Query Request
                       │
                       ▼
              Query Application
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
       Redis                       PostgreSQL
         ▲                           │
         └──────────────┬────────────┘
                        ▼
                 Cache Population
```

Semua operasi **Create**, **Update**, **Publish**, **Review**, dan **Import** langsung menuju PostgreSQL. Redis hanya dipakai untuk mempercepat pembacaan.

---

# Penyempurnaan untuk YakinLulus.id

Saya merekomendasikan strategi **multi-level caching** berikut:

| Level | Teknologi                      | Data                                                 |
| ----- | ------------------------------ | ---------------------------------------------------- |
| L1    | In-Memory (Ristretto/BigCache) | Metadata, konfigurasi, taxonomy                      |
| L2    | Redis                          | Search result, projection, statistik, recommendation |
| L3    | CDN (Future)                   | Gambar soal, audio, video, PDF                       |

Selain itu, **cache invalidation** sebaiknya tidak dilakukan langsung oleh service. Setelah transaksi berhasil, service menerbitkan event seperti `QuestionPublished` atau `MetadataUpdated`, kemudian **Cache Consumer** yang bertugas menghapus atau memperbarui cache terkait. Dengan pendekatan ini, Question Bank tetap terlepas dari implementasi cache, konsisten dengan arsitektur event-driven yang telah dirancang untuk seluruh platform YakinLulus.id.
