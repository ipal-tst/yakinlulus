# 17_search_architecture.md

# YakinLulus.id Search Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **Search System** pada backend YakinLulus.id.

Search merupakan komponen inti platform karena hampir seluruh fitur bergantung pada kemampuan pencarian data secara cepat, akurat, dan scalable.

Search digunakan untuk:

* Bank Soal
* Materi Pembelajaran
* CBT
* User Management
* Analytics
* Back Office
* AI Generated Content

---

# 2. Objectives

Search Architecture dirancang untuk:

* Fast Search
* Flexible Filtering
* Full Text Search
* Ranking
* Pagination
* Scalability
* Multi-Entity Search
* Future AI Semantic Search

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Search First
* Index Driven
* Query Optimized
* Stateless
* Vendor Agnostic
* Consistent
* Observable
* Extensible

---

# 4. Search Technology Roadmap

YakinLulus.id menggunakan pendekatan bertahap.

| Phase   | Technology                             |
| ------- | -------------------------------------- |
| MVP     | PostgreSQL Full Text Search (Supabase) |
| Phase 2 | PostgreSQL + Trigram Search            |
| Phase 3 | Meilisearch/OpenSearch                 |
| Future  | Hybrid Search + AI Semantic Search     |

Pendekatan ini menghindari kompleksitas yang tidak diperlukan pada fase awal tanpa mengorbankan kemampuan scaling.

---

# 5. High Level Architecture

```text id="m4z8xr"
Client

↓

REST API

↓

Search Service

↓

Search Repository

↓

PostgreSQL

↓

Search Result
```

Pada fase berikutnya:

```text id="a8q2kh"
Search Service

↓

Search Adapter

↓

Meilisearch/OpenSearch

↓

Database
```

Business layer tetap tidak bergantung pada engine pencarian tertentu.

---

# 6. Search Components

Komponen utama:

* Search Controller
* Search Service
* Search Repository
* Query Builder
* Search Adapter
* Search Index
* Ranking Engine
* Filter Engine

---

# 7. Directory Structure

```text id="h6v1pw"
internal/

modules/

search/

controller/

service/

repository/

adapter/

dto/

query/

ranking/
```

---

# 8. Search Flow

```text id="k2r9eu"
Request

↓

Validation

↓

Search Service

↓

Query Builder

↓

Repository

↓

Database

↓

Result
```

---

# 9. Supported Search Domains

Search tersedia untuk:

* Questions
* Materials
* Subjects
* Chapters
* Exams
* Students
* Teachers
* Schools
* Users
* Notifications

Setiap domain memiliki query builder tersendiri.

---

# 10. Search Types

Jenis pencarian:

* Exact Match
* Partial Match
* Prefix Search
* Full Text Search
* Multi Filter Search
* Multi Column Search
* Faceted Search

---

# 11. Question Search

Filter utama:

* Jenjang
* Kelas
* Mata Pelajaran
* Bab
* Sub Bab
* Difficulty
* Question Type
* Source
* Status
* Tag
* AI Generated
* Published

---

# 12. Material Search

Filter:

* Jenjang
* Kelas
* Subject
* Chapter
* Keyword
* Content Type
* Published
* Premium

---

# 13. Exam Search

Filter:

* Exam Type
* Status
* Academic Year
* Grade
* Subject
* Teacher
* Schedule
* Published

---

# 14. User Search

Filter:

* Name
* Email
* Username
* Role
* School
* Active Status

---

# 15. Search Query Builder

Seluruh query dibangun menggunakan Query Builder.

```text id="x3p5my"
Keyword

↓

Builder

↓

SQL
```

Tidak diperbolehkan menyusun SQL secara manual di Controller.

---

# 16. Full Text Search

Untuk PostgreSQL digunakan:

* `tsvector`
* `tsquery`
* GIN Index

Contoh field:

```text id="z8m4dn"
question_text

explanation

material_title

material_content
```

---

# 17. Trigram Search

Untuk typo tolerance digunakan:

```text id="g2k7lj"
pg_trgm
```

Mendukung:

* Similar Search
* Misspelling
* Approximate Match

---

# 18. Search Ranking

Prioritas ranking:

1. Exact Match
2. Prefix Match
3. Full Text Score
4. Popularity
5. Updated Time

Formula ranking dapat dikembangkan tanpa mengubah API.

---

# 19. Search Pagination

Gunakan:

```text id="f5q9rt"
Limit

Offset
```

Default:

```text id="p1n6va"
20 items
```

Maximum:

```text id="d7x3ku"
100 items
```

Untuk dataset yang sangat besar, Keyset Pagination dapat digunakan pada fase berikutnya.

---

# 20. Sorting

Supported:

* Created Date
* Updated Date
* Name
* Difficulty
* Popularity
* Score

Sorting menggunakan whitelist untuk mencegah SQL Injection.

---

# 21. Filtering

Search mendukung multiple filter.

Contoh:

```text id="u9c2eh"
Subject = Mathematics

AND

Grade = 12

AND

Difficulty = Hard

AND

Published = True
```

---

# 22. Search DTO

Contoh:

```text id="y6v4sz"
keyword

page

limit

sort

order

filters
```

DTO divalidasi sebelum diproses.

---

# 23. Search Index

MVP menggunakan index PostgreSQL.

Contoh:

* GIN
* BTREE
* Partial Index
* Composite Index

Mengikuti dokumen **Database Indexing Strategy** yang telah disusun sebelumnya.

---

# 24. Search Caching

Query populer dapat di-cache.

Contoh:

```text id="r8k1og"
subject:list

popular:materials

popular:questions
```

TTL disesuaikan dengan jenis data.

---

# 25. Search Suggestions

MVP:

* Keyword Suggestion
* Subject Suggestion
* Chapter Suggestion

Future:

* AI Search Suggestion
* Personalized Suggestion

---

# 26. Autocomplete

Autocomplete tersedia untuk:

* Subject
* Chapter
* Material
* User
* Question Tag

Query dibatasi agar tetap ringan.

---

# 27. Advanced Search

Back Office mendukung:

* Multiple Keyword
* Multiple Filter
* Date Range
* Score Range
* Status
* Created By

---

# 28. Search Security

Search wajib mengikuti RBAC.

Contoh:

Student:

* Tidak dapat mencari soal yang belum dipublikasikan.

Teacher:

* Hanya melihat soal miliknya dan soal yang diizinkan.

Admin:

* Dapat mencari seluruh data.

Hak akses diterapkan sebelum hasil dikembalikan.

---

# 29. Search API

Endpoint:

```text id="b3h7pw"
GET /search/questions

GET /search/materials

GET /search/exams

GET /search/users
```

Future:

```text id="t2q6mr"
GET /search/global
```

---

# 30. Global Search

Future:

```text id="q4f8lj"
Keyword

↓

Questions

Materials

Users

Exams

Notifications

↓

Combined Result
```

Hasil dikelompokkan berdasarkan domain.

---

# 31. Search Logging

Log mencatat:

* Keyword
* Duration
* Result Count
* Module
* User ID
* Request ID

Keyword yang mengandung data sensitif tidak disimpan secara penuh.

---

# 32. Search Monitoring

Metric:

* Search Count
* Average Duration
* Slow Search
* No Result Search
* Popular Keyword
* Cache Hit

Monitoring membantu optimasi index dan pengalaman pengguna.

---

# 33. Performance Targets

Target MVP:

| Metric         | Target   |
| -------------- | -------- |
| Average Search | < 150 ms |
| Complex Search | < 300 ms |
| Autocomplete   | < 100 ms |
| Cache Hit      | > 80%    |

Target dievaluasi secara berkala melalui monitoring.

---

# 34. Scalability

Ketika PostgreSQL mulai menjadi bottleneck:

```text id="m9v3kc"
Search Adapter

↓

Meilisearch

↓

OpenSearch

↓

Elasticsearch
```

Migrasi tidak mengubah Search Service maupun API.

---

# 35. Future AI Search

Roadmap:

```text id="j7p5xd"
User Question

↓

Embedding

↓

Vector Search

↓

Semantic Ranking

↓

Answer
```

Contoh:

> "Soal turunan fungsi yang mirip UTBK"

Sistem dapat menemukan soal relevan meskipun kata yang digunakan tidak identik.

---

# 36. Testing Strategy

Pengujian meliputi:

* Exact Match
* Partial Match
* Full Text Search
* Filter Combination
* Pagination
* Sorting
* Security Filter
* Performance
* Empty Result

---

# 37. Anti-Patterns

Tidak diperbolehkan:

* Menggunakan `LIKE '%keyword%'` untuk seluruh pencarian.
* Query tanpa index pada dataset besar.
* Menggabungkan business logic dengan query pencarian.
* Dynamic SQL tanpa validasi.
* Pagination tanpa limit.
* Mengembalikan seluruh kolom tabel jika tidak diperlukan.

---

# 38. Search Checklist

Sebelum implementasi:

* Query Builder tersedia.
* Full Text Search aktif.
* Index PostgreSQL dibuat.
* Pagination diterapkan.
* Filtering tervalidasi.
* RBAC diterapkan.
* Logging tersedia.
* Monitoring tersedia.
* Unit & integration test tersedia.

---

# 39. Migration Strategy

Tahapan evolusi:

1. PostgreSQL Full Text Search.
2. Optimasi dengan `pg_trgm`.
3. Penambahan Search Adapter.
4. Integrasi Meilisearch/OpenSearch.
5. Hybrid Search.
6. AI Semantic Search.

Pendekatan bertahap ini meminimalkan kompleksitas sekaligus menjaga kompatibilitas API.

---

# 40. Summary

Search Architecture YakinLulus.id menggunakan **PostgreSQL Full Text Search** pada fase MVP dengan pendekatan **Search Adapter Pattern** sehingga tidak bergantung pada satu search engine.

Arsitektur ini memberikan:

* Pencarian cepat dan fleksibel.
* Dukungan filtering dan ranking yang kaya.
* Integrasi penuh dengan RBAC.
* Skalabilitas menuju Meilisearch/OpenSearch.
* Fondasi untuk AI Semantic Search di masa depan tanpa perubahan pada kontrak API maupun business layer.
