Saya menyarankan **11_question_search.md** menjadi salah satu dokumen paling penting di seluruh backend. Mengingat target YakinLulus.id adalah memiliki **bank soal hingga jutaan soal**, fitur search tidak boleh hanya mengandalkan `LIKE` SQL.

Search harus menggabungkan beberapa teknik:

* PostgreSQL Full Text Search
* Trigram Search (`pg_trgm`)
* Metadata Filtering
* Semantic Search (`pgvector`)
* Hybrid Ranking
* AI Search (future)

Dokumen berikut menjadi spesifikasi lengkapnya.

---

````markdown
# 11_question_search.md

# Question Search Specification

Version : 1.0

---

# 1. Overview

Question Search menyediakan mekanisme pencarian soal secara cepat, akurat, dan scalable.

Search digunakan oleh:

- Question Bank
- CBT Blueprint
- AI Generator
- AI Tutor
- Admin
- Teacher
- Analytics
- Recommendation Engine

Target utama:

- pencarian < 300 ms
- mendukung jutaan soal
- mendukung Full Text Search
- mendukung Semantic Search
- mendukung Hybrid Search

---

# 2. Search Architecture

```
User Request
      │
      ▼
Search API
      │
      ▼
Query Parser
      │
      ▼
Search Pipeline
      │
      ├── Metadata Search
      ├── Full Text Search
      ├── Trigram Search
      ├── Semantic Search
      └── Hybrid Ranking
      │
      ▼
Ranking Engine
      │
      ▼
Search Result
```

---

# 3. Search Types

Question Search mendukung beberapa tipe.

## Exact Search

Contoh

Question Code

↓

YL-MTK-000123

---

## Keyword Search

Contoh

```
Integral Substitusi
```

---

## Metadata Search

Contoh

```
Subject

↓

Matematika

↓

Grade

↓

12

↓

Difficulty

↓

Hard
```

---

## Full Text Search

Menggunakan PostgreSQL tsvector.

Mencari:

- Stem
- Story
- Explanation
- Tags

---

## Semantic Search

Menggunakan pgvector.

Contoh

```
Cari soal yang mirip dengan:

"Integral parsial"

↓

Embedding

↓

Vector Search
```

---

## Hybrid Search

Menggabungkan:

- Full Text
- Metadata
- Vector Similarity

---

# 4. Search Pipeline

```
Receive Query

↓

Normalize

↓

Spell Correction

↓

Metadata Filter

↓

FTS

↓

Semantic Search

↓

Merge

↓

Ranking

↓

Pagination

↓

Response
```

---

# 5. Query Parser

Query Parser bertugas:

- tokenization
- normalization
- stop word removal
- stemming
- operator parsing

Contoh

Input

```
Integral Turunan
```

Output

```
integral

turun
```

---

# 6. Metadata Filtering

Filter yang didukung.

Academic

- Curriculum
- Grade
- Semester
- Subject
- Chapter
- Topic

Classification

- Difficulty
- Bloom
- HOTS
- Language
- Question Type

Status

- Draft
- Published
- Archived

Source

- AI
- Official
- Manual

---

# 7. Full Text Search

Menggunakan:

```
tsvector

tsquery

GIN Index
```

Field

- stem
- story
- explanation
- tag

---

# 8. Trigram Search

Menggunakan pg_trgm.

Digunakan untuk:

- typo
- nama bab
- kode soal
- kata mirip

Contoh

```
integal

↓

integral
```

---

# 9. Semantic Search

Menggunakan pgvector.

Vector berasal dari:

- Stem
- Story
- Explanation

Distance

- Cosine Similarity

atau

- Inner Product

---

# 10. Hybrid Search

Ranking gabungan.

```
Hybrid Score

=

Metadata Score

+

FTS Score

+

Vector Score

+

Popularity

+

Quality Score
```

---

# 11. Ranking Strategy

Prioritas ranking.

1.

Exact Match

↓

2.

Metadata Match

↓

3.

FTS Score

↓

4.

Vector Similarity

↓

5.

Quality Score

↓

6.

Popularity

↓

7.

Recent Usage

---

# 12. Search Operators

Didukung.

```
AND

OR

NOT

""

()

*
```

Contoh

```
Integral AND Turunan
```

---

# 13. Search Sorting

Sort berdasarkan.

- Relevance
- Newest
- Oldest
- Difficulty
- Usage
- Quality
- Similarity

---

# 14. Pagination

Default

```
Page

Size

Total

Total Page
```

Cursor Pagination digunakan untuk dataset besar.

---

# 15. Highlight

Search dapat mengembalikan Highlight.

Contoh

```
"...gunakan metode
integral parsial..."
```

---

# 16. Search Suggestion

Autocomplete.

Contoh

Input

```
inte
```

Output

```
Integral

Integral Parsial

Integral Tak Tentu
```

---

# 17. Saved Search

User dapat menyimpan Query.

Contoh

```
Hard

Integral

HOTS

Published
```

---

# 18. Search Performance

Target.

Keyword

< 100 ms

Metadata

< 100 ms

FTS

< 200 ms

Hybrid

< 300 ms

Semantic

< 500 ms

---

# 19. Cache Strategy

Redis menyimpan.

- Popular Query
- Suggestion
- Search Result
- Metadata Lookup

TTL dapat dikonfigurasi.

---

# 20. Database Index

Menggunakan.

```
GIN

BTREE

GIN tsvector

pg_trgm

HNSW / IVFFlat (pgvector)
```

---

# 21. Search API

Contoh.

```
GET

/questions/search
```

Parameter.

```
keyword

subject

chapter

difficulty

grade

page

size

sort
```

---

# 22. Search Result

Response.

```
Question

Current Version

Subject

Difficulty

Similarity

Highlight

Metadata
```

---

# 23. Security

Student

↓

Published Only

Teacher

↓

Published

Draft (Own)

Reviewer

↓

Review Queue

Admin

↓

All

---

# 24. Audit

Disimpan.

- Query
- User
- Time
- Duration
- Result Count
- IP

---

# 25. Failure Handling

Jika FTS gagal.

↓

Fallback

Metadata Search

Jika Semantic gagal.

↓

FTS

Jika Redis gagal.

↓

PostgreSQL

---

# 26. Database Objects

```
question

question_version

question_metadata

question_tag

question_embedding

question_statistics

search_index
```

---

# 27. Domain Events

```
QuestionIndexed

QuestionUpdated

QuestionPublished

QuestionArchived

EmbeddingUpdated

SearchCacheInvalidated
```

---

# 28. AI Search

Future.

AI dapat:

- memahami pertanyaan natural language
- mencari konsep
- mencari soal ekuivalen
- mencari pembahasan serupa

Contoh

```
Cari soal integral
yang paling mirip
dengan SNBT tahun lalu
```

---

# 29. Monitoring

Metrik.

- Search Latency
- Cache Hit Ratio
- FTS Duration
- Vector Search Duration
- Result Accuracy
- Popular Keyword

---

# 30. Future Roadmap

- Elasticsearch Integration
- OpenSearch
- AI Reranking
- Query Expansion
- Knowledge Graph Search
- Voice Search
- OCR Search
- Image Search
- Cross Language Search
- Personalized Search
````

---

# Rekomendasi Arsitektur (Sangat Disarankan)

Saya menyarankan Search Engine **tidak dibuat sebagai satu query besar**, tetapi sebagai beberapa komponen yang dapat dikombinasikan.

```text
                Search API
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
   Query Parser             Metadata Filter
         │                        │
         ├──────────────┬─────────┘
         ▼              ▼
   Full Text Search   Vector Search
         │              │
         └──────┬───────┘
                ▼
          Ranking Engine
                │
                ▼
         Result Formatter
                │
                ▼
            API Response
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/search/
│
├── parser/
│   ├── lexer.go
│   ├── tokenizer.go
│   ├── normalizer.go
│   └── query_parser.go
│
├── metadata/
│   ├── filter.go
│   └── builder.go
│
├── fulltext/
│   ├── tsquery.go
│   └── ranking.go
│
├── semantic/
│   ├── embedding_search.go
│   ├── similarity.go
│   └── vector_rank.go
│
├── hybrid/
│   ├── merger.go
│   ├── reranker.go
│   └── scorer.go
│
├── cache/
│   └── redis_cache.go
│
└── service.go
```

### Penyempurnaan untuk YakinLulus.id

Karena roadmap Anda mencakup **AI Question Generation**, **Recommendation Engine**, dan **Adaptive Learning**, saya juga menyarankan agar setiap `question_version` memiliki dua kolom pencarian yang dipelihara otomatis:

* `search_vector` (`tsvector`) untuk PostgreSQL Full Text Search.
* `embedding` (`vector`) untuk Semantic Search menggunakan `pgvector`.

Kedua indeks tersebut diperbarui melalui background job setiap kali versi soal baru dipublikasikan. Pendekatan ini menjaga proses publish tetap cepat, sementara pencarian tetap optimal pada skala besar.
